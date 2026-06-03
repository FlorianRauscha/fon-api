import { ENDPOINTS, NAMESPACES, SOAP_ACTIONS } from "../core/endpoints.js";
import { InvalidXmlError } from "../core/errors.js";
import { rcToError } from "../core/returncodes.js";
import type { SessionTransport } from "../core/session.js";
import { soapCall } from "../core/soap.js";
import { el, parseXml } from "../core/xml.js";
import type { AbfrageRequest, AbfrageResult } from "./types.js";

export type { AbfrageArt, AbfrageRequest, AbfrageResult } from "./types.js";
export { ABFRAGE_ARTEN } from "./types.js";

const RESULT_RE = /<(?:\w+:)?result[\s>]([\s\S]*?)<\/(?:\w+:)?result>/i;

interface AbfrageResponseXml {
	abfrageDatenuebermittlungResponse?: {
		rc?: string;
		msg?: string;
		result?: unknown;
	};
}

export async function abfrageDatenuebermittlung(
	req: AbfrageRequest,
	transport: SessionTransport = {},
): Promise<AbfrageResult> {
	const body = el("abf", "abfrageDatenuebermittlungRequest", [
		["tid", req.tid],
		["benid", req.benid],
		["id", req.id],
		["art", req.art],
		["fastnr", req.fastnr],
		["zeitraum", String(req.zeitraum)],
	]).replace(
		"<abf:abfrageDatenuebermittlungRequest>",
		`<abf:abfrageDatenuebermittlungRequest xmlns:abf="${NAMESPACES.abfrage}">`,
	);

	const responseBody = await soapCall({
		endpoint: transport.endpoint ?? ENDPOINTS.abfrage,
		soapAction: SOAP_ACTIONS.abfrageDatenuebermittlung,
		bodyXml: body,
		...(transport.fetch !== undefined && { fetch: transport.fetch }),
		...(transport.timeoutMs !== undefined && { timeoutMs: transport.timeoutMs }),
	});

	const parsed = parseXml<AbfrageResponseXml>(responseBody);
	const r = parsed.abfrageDatenuebermittlungResponse;
	if (!r || r.rc === undefined) {
		throw new InvalidXmlError("abfrage: missing rc in response", responseBody);
	}
	const rc = Number.parseInt(r.rc, 10);
	if (rc !== 0 && rc !== undefined) {
		// Non-zero rc on this service still returns a structured response; bubble as typed error
		// only when result is missing entirely.
		if (r.result === undefined) throw rcToError(rc, r.msg);
	}

	const resultMatch = responseBody.match(RESULT_RE);
	return {
		rc,
		msg: r.msg,
		resultXml: resultMatch?.[1]?.trim(),
		result: r.result,
	};
}
