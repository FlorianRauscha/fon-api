import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { uebBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	InfoDaten,
	UebBody,
	Wegbuchung,
	Zubuchung,
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
		`<FASTNR_ZU>${escapeXml(a.fastnrZu)}</FASTNR_ZU>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function wegXml(w: Wegbuchung): string {
	return [
		"<WEGBUCHUNG>",
		`<AA_WEG>${escapeXml(w.aa)}</AA_WEG>`,
		`<ZRVON_WEG type="${escapeXml(w.zrvon.type)}">${escapeXml(w.zrvon.value)}</ZRVON_WEG>`,
		`<ZRBIS_WEG type="${escapeXml(w.zrbis.type)}">${escapeXml(w.zrbis.value)}</ZRBIS_WEG>`,
		`<BETRAG_WEG type="kz">${fmtKz(w.betrag)}</BETRAG_WEG>`,
		"</WEGBUCHUNG>",
	].join("");
}

function zuXml(z: Zubuchung): string {
	return [
		"<ZUBUCHUNG>",
		`<AA_ZU>${escapeXml(z.aa)}</AA_ZU>`,
		`<ZRVON_ZU type="${escapeXml(z.zrvon.type)}">${escapeXml(z.zrvon.value)}</ZRVON_ZU>`,
		`<ZRBIS_ZU type="${escapeXml(z.zrbis.type)}">${escapeXml(z.zrbis.value)}</ZRBIS_ZU>`,
		`<BETRAG_ZU type="kz">${fmtKz(z.betrag)}</BETRAG_ZU>`,
		"</ZUBUCHUNG>",
	].join("");
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		allgemeinXml(e.allgemein),
		(e.wegbuchungen ?? []).map(wegXml).join(""),
		e.uebertragenderBetrag !== undefined
			? `<UEBERTRAGENDER_BETRAG><BETRAG_UEB type="kz">${fmtKz(e.uebertragenderBetrag)}</BETRAG_UEB></UEBERTRAGENDER_BETRAG>`
			: "",
		(e.zubuchungen ?? []).map(zuXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: UebBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = uebBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"UEB body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
