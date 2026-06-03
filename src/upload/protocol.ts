/**
 * BMF response-protocol parser.
 *
 * Every fileupload response carries (asynchronously, via DataBox or as the
 * `msg` field of an `upload` SOAP response) an XML "Protokoll" describing the
 * BMF's verdict. Across submission types (SOER, VPDG/CbC, U30, ...) the shape
 * is *almost* the same — a `MessageSpec` block with `Info ∈ {OK, NOK, TWOK}`
 * plus zero or more `Error` elements scattered at varying depths. This parser
 * normalizes those variants into a single discriminated union.
 *
 * Confirmed against fixtures:
 *   test/fixtures/protocol/soer_{OK,NOK,TWOK}.xml
 *   test/fixtures/protocol/cbc_{OK,NOK,TWOK}.xml
 *
 * - SOER NOK puts Error inside MessageSpec.
 * - SOER TWOK wraps each Error in `<{Art}UebermittlungError>` with a RefNr.
 * - CbC NOK/TWOK lists Error elements as siblings of MessageSpec, with optional `<Data>`.
 *
 * The parser walks the entire tree, so element placement doesn't matter.
 */

import { parseXml } from "../core/xml.js";

export type ProtocolKind = "OK" | "NOK" | "TWOK";

export interface ProtocolMeta {
	/** The submission type (e.g. "SOER", "VPDGD", "U30"). */
	art: string | undefined;
	/** "P" (production) or "T" (test). */
	uebermittlung: "P" | "T" | undefined;
	/** Submitter's reference id from the original payload. */
	messageRefId: string | undefined;
	/** ISO timestamp at which BMF accepted the submission. */
	einbringungsTimestamp: string | undefined;
	/** 9-digit FASTNR of the Finanzonline-Teilnehmer. */
	fastnrFonTn: string | undefined;
	/** 9-digit FASTNR of the underlying organisation, when distinct. */
	fastnrOrg: string | undefined;
}

export interface ProtocolError {
	code: string;
	text: string;
	/** Optional free-form payload (CbC includes it on some errors). */
	data?: string;
	/** Optional reference number identifying which record produced the error (SOER). */
	refNr?: string;
}

export type ProtocolResult =
	| { kind: "OK"; meta: ProtocolMeta; raw: string }
	| { kind: "NOK"; meta: ProtocolMeta; errors: ReadonlyArray<ProtocolError>; raw: string }
	| { kind: "TWOK"; meta: ProtocolMeta; errors: ReadonlyArray<ProtocolError>; raw: string };

interface ParsedNode {
	[k: string]: unknown;
}

function asObj(x: unknown): ParsedNode | null {
	return x !== null && typeof x === "object" && !Array.isArray(x) ? (x as ParsedNode) : null;
}

function asStr(x: unknown): string | undefined {
	if (x === undefined || x === null) return undefined;
	if (typeof x === "string") return x;
	if (typeof x === "number" || typeof x === "boolean") return String(x);
	return undefined;
}

function* walkErrors(node: unknown, refNrCtx: string | undefined): Generator<ProtocolError> {
	if (Array.isArray(node)) {
		for (const item of node) yield* walkErrors(item, refNrCtx);
		return;
	}
	const obj = asObj(node);
	if (!obj) return;

	const myRefNr = asStr(obj.RefNr) ?? refNrCtx;

	for (const [key, value] of Object.entries(obj)) {
		if (key === "RefNr") continue;
		if (key === "Error") {
			const arr = Array.isArray(value) ? value : [value];
			for (const e of arr) {
				const eo = asObj(e);
				if (!eo) continue;
				const code = asStr(eo.Code);
				const text = asStr(eo.Text);
				if (code === undefined && text === undefined) continue;
				const err: ProtocolError = {
					code: code ?? "",
					text: text ?? "",
				};
				const data = asStr(eo.Data);
				if (data !== undefined) err.data = data;
				if (myRefNr !== undefined) err.refNr = myRefNr;
				yield err;
			}
			continue;
		}
		yield* walkErrors(value, myRefNr);
	}
}

function extractMeta(root: ParsedNode): ProtocolMeta {
	const spec = asObj(root.MessageSpec) ?? {};
	const info = asObj(root.Info_Daten) ?? {};
	const uebermittlungRaw = asStr(spec.Uebermittlung);
	return {
		art: asStr(spec.Art),
		uebermittlung:
			uebermittlungRaw === "P" || uebermittlungRaw === "T" ? uebermittlungRaw : undefined,
		messageRefId: asStr(spec.MessageRefId),
		einbringungsTimestamp: asStr(spec.EinbringungsTimestamp),
		fastnrFonTn: asStr(info.Fastnr_Fon_Tn),
		fastnrOrg: asStr(info.Fastnr_Org),
	};
}

/**
 * Parse a BMF protocol XML into a typed discriminated union.
 *
 * @throws if the XML can't be parsed at all or no `<MessageSpec>/<Info>` is present.
 */
export function parseProtocol(xml: string): ProtocolResult {
	const parsed = parseXml<ParsedNode>(xml);
	// First top-level non-prolog node is the root response element.
	const rootEntry = Object.entries(parsed).find(([k]) => k !== "?xml");
	if (!rootEntry) throw new Error("parseProtocol: no root element found");
	const root = asObj(rootEntry[1]);
	if (!root) throw new Error("parseProtocol: root is not an element");

	const spec = asObj(root.MessageSpec);
	const infoRaw = asStr(spec?.Info);
	if (infoRaw !== "OK" && infoRaw !== "NOK" && infoRaw !== "TWOK") {
		throw new Error(
			`parseProtocol: missing or unrecognised MessageSpec/Info ("${infoRaw ?? "<absent>"}")`,
		);
	}
	const meta = extractMeta(root);
	if (infoRaw === "OK") return { kind: "OK", meta, raw: xml };
	const errors = [...walkErrors(root, undefined)];
	return { kind: infoRaw, meta, errors, raw: xml };
}

/** Best-effort: return null instead of throwing on non-protocol input. */
export function tryParseProtocol(xml: string): ProtocolResult | null {
	try {
		return parseProtocol(xml);
	} catch {
		return null;
	}
}
