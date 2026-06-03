import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { sbzBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	InfoDaten,
	SbzBody,
	Verrechnungsweisung,
} from "./types.js";

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

function allgemeinXml(a: AllgemeineDaten): string {
	const parts = [
		`<SATZNR>${a.satznr}</SATZNR>`,
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function verrechnungsweisungXml(v: Verrechnungsweisung): string {
	return [
		"<VERRECHNUNGSWEISUNGEN>",
		`<AA>${escapeXml(v.aa)}</AA>`,
		`<ZRVON type="${escapeXml(v.zrvon.type)}">${escapeXml(v.zrvon.value)}</ZRVON>`,
		`<ZRBIS type="${escapeXml(v.zrbis.type)}">${escapeXml(v.zrbis.value)}</ZRBIS>`,
		`<BETRAG type="kz">${fmtKz(v.betrag)}</BETRAG>`,
		"</VERRECHNUNGSWEISUNGEN>",
	].join("");
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		allgemeinXml(e.allgemein),
		e.verrechnungsweisungen.map(verrechnungsweisungXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: SbzBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = sbzBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"SBZ body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
