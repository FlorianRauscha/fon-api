import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { komuBody } from "./schema.js";
import type { Erklaerung, InfoDaten, KomuBody } from "./types.js";

function fmtKz(n: number): string {
	const r = Math.round(n * 100) / 100;
	return (Object.is(r, -0) ? 0 : r).toFixed(2);
}

function infoXml(i: InfoDaten): string {
	return [
		"<INFO_DATEN>",
		`<ART_IDENTIFIKATIONSBEGRIFF>${escapeXml(i.artIdentifikationsbegriff)}</ART_IDENTIFIKATIONSBEGRIFF>`,
		`<IDENTIFIKATIONSBEGRIFF>${escapeXml(i.identifikationsbegriff)}</IDENTIFIKATIONSBEGRIFF>`,
		`<PAKET_NR>${i.paketNr}</PAKET_NR>`,
		`<DATUM_ERSTELLUNG type="datum">${escapeXml(i.datumErstellung)}</DATUM_ERSTELLUNG>`,
		`<UHRZEIT_ERSTELLUNG type="uhrzeit">${escapeXml(i.uhrzeitErstellung)}</UHRZEIT_ERSTELLUNG>`,
		`<ANZAHL_ERKLAERUNGEN>${i.anzahlErklaerungen}</ANZAHL_ERKLAERUNGEN>`,
		"</INFO_DATEN>",
	].join("");
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		`<ANBRINGEN>${escapeXml(e.anbringen)}</ANBRINGEN>`,
		`<ZR>${escapeXml(e.zr)}</ZR>`,
		`<FASTNR>${escapeXml(e.fastnr)}</FASTNR>`,
		`<BMG type="kz">${fmtKz(e.bmg)}</BMG>`,
		e.mit !== undefined ? `<MIT>${escapeXml(e.mit)}</MIT>` : "",
		`<VB>${escapeXml(e.vb)}</VB>`,
		`<KM>${escapeXml(e.km)}</KM>`,
		`<NS>${escapeXml(e.ns)}</NS>`,
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: KomuBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = komuBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"KOMU body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
