import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { sbsBody } from "./schema.js";
import type {
	AllgemeineDaten,
	BerichtigungSelbstbemessungsabgaben,
	Erklaerung,
	InfoDaten,
	SbaBer,
	SbaIst,
	SbsBody,
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

function istXml(s: SbaIst): string {
	return [
		"<SELBSTBEMESSUNGSABGABEN_IST>",
		`<AA_IST>${escapeXml(s.aa)}</AA_IST>`,
		`<ZRVON_IST type="${escapeXml(s.zrvon.type)}">${escapeXml(s.zrvon.value)}</ZRVON_IST>`,
		`<ZRBIS_IST type="${escapeXml(s.zrbis.type)}">${escapeXml(s.zrbis.value)}</ZRBIS_IST>`,
		`<BETRAG_IST type="kz">${fmtKz(s.betrag)}</BETRAG_IST>`,
		"</SELBSTBEMESSUNGSABGABEN_IST>",
	].join("");
}

function berXml(s: SbaBer): string {
	return [
		"<SELBSTBEMESSUNGSABGABEN_BER>",
		`<AA>${escapeXml(s.aa)}</AA>`,
		`<ZRVON type="${escapeXml(s.zrvon.type)}">${escapeXml(s.zrvon.value)}</ZRVON>`,
		`<ZRBIS type="${escapeXml(s.zrbis.type)}">${escapeXml(s.zrbis.value)}</ZRBIS>`,
		`<BETRAG type="kz">${fmtKz(s.betrag)}</BETRAG>`,
		"</SELBSTBEMESSUNGSABGABEN_BER>",
	].join("");
}

function berichtigungXml(b: BerichtigungSelbstbemessungsabgaben): string {
	const inner = [b.ist.map(istXml).join(""), (b.ber ?? []).map(berXml).join("")].join("");
	return `<BERICHTIGUNG_SELBSTBEMESSUNGSABGABEN>${inner}</BERICHTIGUNG_SELBSTBEMESSUNGSABGABEN>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		allgemeinXml(e.allgemein),
		`<BUCHUNGSTAG><BUCHTAG type="datum">${escapeXml(e.buchtag)}</BUCHTAG></BUCHUNGSTAG>`,
		berichtigungXml(e.berichtigung),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: SbsBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = sbsBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"SBS body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
