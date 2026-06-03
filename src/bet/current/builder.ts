import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { betBody } from "./schema.js";
import type { BetBody, Beteiligter, Kopfdaten } from "./types.js";

/** Format prozent-typed double; up to 8 decimals, strip trailing zeros, keep at least 1. */
function fmtProzent(n: number): string {
	if (!Number.isFinite(n)) throw new Error("prozent must be finite");
	const s = n.toFixed(8).replace(/0+$/, "").replace(/\.$/, ".0");
	return s;
}

function kopfXml(k: Kopfdaten): string {
	return [
		`<ANBRINGEN>${escapeXml(k.anbringen)}</ANBRINGEN>`,
		`<JAHR>${escapeXml(k.jahr)}</JAHR>`,
		`<FASTNR>${escapeXml(k.fastnr)}</FASTNR>`,
		`<NAME>${escapeXml(k.name)}</NAME>`,
		`<ADR_BETR>${escapeXml(k.adrBetr)}</ADR_BETR>`,
		`<ORT_BETR>${escapeXml(k.ortBetr)}</ORT_BETR>`,
		`<PLZ_BETR>${escapeXml(k.plzBetr)}</PLZ_BETR>`,
		k.plzOrtBetr !== undefined ? `<PLZORT_BETR>${escapeXml(k.plzOrtBetr)}</PLZORT_BETR>` : "",
		`<LAND_BETR>${escapeXml(k.landBetr)}</LAND_BETR>`,
		`<DATUM>${escapeXml(k.datum)}</DATUM>`,
		`<UHRZEIT>${escapeXml(k.uhrzeit)}</UHRZEIT>`,
	].join("");
}

function beteiligterXml(b: Beteiligter): string {
	return [
		`<FASTNRB>${escapeXml(b.fastnrb)}</FASTNRB>`,
		`<PRO>${fmtProzent(b.pro)}</PRO>`,
		`<JAHRPRO>${fmtProzent(b.jahrpro)}</JAHRPRO>`,
		`<ZRVON>${escapeXml(b.zrvon)}</ZRVON>`,
		b.zrbis !== undefined ? `<ZRBIS>${escapeXml(b.zrbis)}</ZRBIS>` : "",
		`<FOLGE>${escapeXml(b.folge)}</FOLGE>`,
		`<NAMEB>${escapeXml(b.nameb)}</NAMEB>`,
	].join("");
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: BetBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = betBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"BET body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const partners = body.beteiligte.map(beteiligterXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><XML>${kopfXml(body.kopf)}${partners}</XML>`;
}
