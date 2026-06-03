import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { vatabBody } from "./schema.js";
import type {
	Abschluss,
	AllgemeineDaten,
	Anhang,
	Erklaerung,
	InfoDaten,
	VatabBody,
} from "./types.js";

function fmtZahl(n: number): string {
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
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		a.antragnr !== undefined ? `<ANTRAGNR>${escapeXml(a.antragnr)}</ANTRAGNR>` : "",
		`<ZRVON type="jahrmonat">${escapeXml(a.zrvon)}</ZRVON>`,
		`<ZRBIS type="jahrmonat">${escapeXml(a.zrbis)}</ZRBIS>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
		`<EU_LAND>${escapeXml(a.euLand)}</EU_LAND>`,
		`<EMAIL_UNTERNEHMER>${escapeXml(a.emailUnternehmer)}</EMAIL_UNTERNEHMER>`,
		a.emailVertreter !== undefined
			? `<EMAIL_VERTRETER>${escapeXml(a.emailVertreter)}</EMAIL_VERTRETER>`
			: "",
		a.nace.map((n) => `<NACE>${escapeXml(n)}</NACE>`).join(""),
		`<KONTOINHABER>${escapeXml(a.kontoinhaber)}</KONTOINHABER>`,
		`<INHABERTYP>${escapeXml(a.inhabertyp)}</INHABERTYP>`,
		`<IBAN>${escapeXml(a.iban)}</IBAN>`,
		`<BIC>${escapeXml(a.bic)}</BIC>`,
		`<WAEHR_BANK>${escapeXml(a.waehrBank)}</WAEHR_BANK>`,
		`<FRAGE_1A>${escapeXml(a.frage1a)}</FRAGE_1A>`,
		`<FRAGE_1B>${escapeXml(a.frage1b)}</FRAGE_1B>`,
		`<FRAGE_1C>${escapeXml(a.frage1c)}</FRAGE_1C>`,
		a.frage2a !== undefined ? `<FRAGE_2A>${escapeXml(a.frage2a)}</FRAGE_2A>` : "",
		a.frage2b !== undefined ? `<FRAGE_2B>${escapeXml(a.frage2b)}</FRAGE_2B>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function anhangXml(a: Anhang): string {
	const inner =
		a.pdf !== undefined ? `<PDF_ANHANG ART="PDF">${escapeXml(a.pdf.base64)}</PDF_ANHANG>` : "";
	return `<ANHANG>${inner}</ANHANG>`;
}

function abschlussXml(a: Abschluss): string {
	const parts = [
		a.gesamtKauf !== undefined ? `<GESAMT_KAUF>${a.gesamtKauf}</GESAMT_KAUF>` : "",
		a.gesamtBmgKauf !== undefined
			? `<GESAMT_BMG_KAUF>${fmtZahl(a.gesamtBmgKauf)}</GESAMT_BMG_KAUF>`
			: "",
		a.gesamtImport !== undefined ? `<GESAMT_IMPORT>${a.gesamtImport}</GESAMT_IMPORT>` : "",
		a.gesamtBmgImport !== undefined
			? `<GESAMT_BMG_IMPORT>${fmtZahl(a.gesamtBmgImport)}</GESAMT_BMG_IMPORT>`
			: "",
		a.anhang !== undefined ? anhangXml(a.anhang) : "",
	];
	return `<ABSCHLUSS>${parts.join("")}</ABSCHLUSS>`;
}

function erklaerungXml(e: Erklaerung): string {
	return [
		`<ERKLAERUNG art="${escapeXml(e.art)}">`,
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		abschlussXml(e.abschluss),
		"</ERKLAERUNG>",
	].join("");
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: VatabBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = vatabBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"VATAB body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
