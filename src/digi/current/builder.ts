import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { digiBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Bemessungsgrundlage,
	DigiBody,
	Erklaerung,
	InfoDaten,
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
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		`<ZR>${escapeXml(a.zr)}</ZR>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function bemessungsgrundlageXml(b: Bemessungsgrundlage): string {
	const parts = [
		`<ARTLEIST>${escapeXml(b.artLeistung)}</ARTLEIST>`,
		`<ORT_LTG>${escapeXml(b.ortLtg)}</ORT_LTG>`,
		`<WJ_BEG>${escapeXml(b.wjBeg)}</WJ_BEG>`,
		`<WJ_ENDE>${escapeXml(b.wjEnde)}</WJ_ENDE>`,
		`<UMS_212a type="kz">${fmtKz(b.ums212a)}</UMS_212a>`,
		`<ENTGELT type="kz">${fmtKz(b.entgelt)}</ENTGELT>`,
		b.ausg !== undefined ? `<AUSG type="kz">${fmtKz(b.ausg)}</AUSG>` : "",
		`<BEM_GES type="kz">${fmtKz(b.bemGes)}</BEM_GES>`,
	];
	return `<BEMESSUNGSGRUNDLAGE>${parts.join("")}</BEMESSUNGSGRUNDLAGE>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		e.allgemein !== undefined ? allgemeinXml(e.allgemein) : "",
		e.bemessungsgrundlage !== undefined ? bemessungsgrundlageXml(e.bemessungsgrundlage) : "",
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: DigiBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = digiBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"DIGI body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
