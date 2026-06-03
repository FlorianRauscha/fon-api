import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { rzBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Bar,
	Empfaenger,
	Erklaerung,
	InfoDaten,
	RzBody,
	Unbar,
} from "./types.js";

function fmtKz(n: number): string {
	const r = Math.round(n * 100) / 100;
	return r.toFixed(2);
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
		`<ART_RZ>${escapeXml(a.artRz)}</ART_RZ>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function unbarXml(u: Unbar): string {
	const parts = [
		u.blz !== undefined ? `<BLZ>${escapeXml(u.blz)}</BLZ>` : "",
		u.giro !== undefined ? `<GIRO>${escapeXml(u.giro)}</GIRO>` : "",
		u.iban !== undefined ? `<IBAN>${escapeXml(u.iban)}</IBAN>` : "",
		u.bic !== undefined ? `<BIC>${escapeXml(u.bic)}</BIC>` : "",
		u.bank !== undefined ? `<BANK>${escapeXml(u.bank)}</BANK>` : "",
	];
	return `<UNBAR>${parts.join("")}</UNBAR>`;
}

function barXml(b: Bar): string {
	const parts = [
		b.ort !== undefined ? `<ORT>${escapeXml(b.ort)}</ORT>` : "",
		`<PLZE>${escapeXml(b.plze)}</PLZE>`,
		`<ADRE>${escapeXml(b.adre)}</ADRE>`,
	];
	return `<BAR>${parts.join("")}</BAR>`;
}

function empfaengerXml(e: Empfaenger): string {
	const parts = [
		`<NAMEE>${escapeXml(e.namee)}</NAMEE>`,
		`<BETRAG type="kz">${fmtKz(e.betrag)}</BETRAG>`,
		e.lkz !== undefined ? `<LKZ>${escapeXml(e.lkz)}</LKZ>` : "",
		e.unbar !== undefined ? unbarXml(e.unbar) : "",
		e.bar !== undefined ? barXml(e.bar) : "",
	];
	return `<EMPFAENGER>${parts.join("")}</EMPFAENGER>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [allgemeinXml(e.allgemein), e.empfaenger.map(empfaengerXml).join("")];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: RzBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = rzBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"RZ body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
