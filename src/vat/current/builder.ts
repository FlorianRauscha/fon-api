import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { vatBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	Gegenstand,
	Grundlagen,
	Import,
	InfoDaten,
	Kauf,
	VatBody,
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
		a.sprache !== undefined ? `<SPRACHE>${escapeXml(a.sprache)}</SPRACHE>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function gegenstandXml(g: Gegenstand, suffix: "_K" | "_I"): string {
	const parts = [
		`<CODE${suffix}>${g.code}</CODE${suffix}>`,
		g.subcode !== undefined ? `<SUBCODE${suffix}>${escapeXml(g.subcode)}</SUBCODE${suffix}>` : "",
		g.beschreibung !== undefined
			? `<BESCHREIBUNG${suffix}>${escapeXml(g.beschreibung)}</BESCHREIBUNG${suffix}>`
			: "",
	];
	return `<GEGENSTAND>${parts.join("")}</GEGENSTAND>`;
}

function grundlagenXml(g: Grundlagen, suffix: "_K" | "_I"): string {
	const parts = [
		`<WAEHR${suffix}>${escapeXml(g.waehrung)}</WAEHR${suffix}>`,
		`<BMG${suffix}>${fmtZahl(g.bmg)}</BMG${suffix}>`,
		`<VST${suffix}>${fmtZahl(g.vst)}</VST${suffix}>`,
		`<ABVST${suffix}>${fmtZahl(g.abvst)}</ABVST${suffix}>`,
	];
	return `<GRUNDLAGEN>${parts.join("")}</GRUNDLAGEN>`;
}

function kaufXml(k: Kauf): string {
	const parts = [
		`<SEQNR_K>${k.seqnr}</SEQNR_K>`,
		`<BEZNR_K>${escapeXml(k.beznr)}</BEZNR_K>`,
		`<DATUM_K type="datum">${escapeXml(k.datum)}</DATUM_K>`,
		`<KLEINBETR_K>${escapeXml(k.kleinbetr)}</KLEINBETR_K>`,
		k.uid !== undefined ? `<UID_K>${escapeXml(k.uid)}</UID_K>` : "",
		k.stnr !== undefined ? `<STNR_K>${escapeXml(k.stnr)}</STNR_K>` : "",
		`<NAME_K>${escapeXml(k.name)}</NAME_K>`,
		`<ADR_K>${escapeXml(k.adr)}</ADR_K>`,
		`<PLZ_K>${escapeXml(k.plz)}</PLZ_K>`,
		`<STADT_K>${escapeXml(k.stadt)}</STADT_K>`,
		`<LAND_K>${escapeXml(k.land)}</LAND_K>`,
		k.gegenstaende.map((g) => gegenstandXml(g, "_K")).join(""),
		grundlagenXml(k.grundlagen, "_K"),
	];
	return `<KAUF>${parts.join("")}</KAUF>`;
}

function importXml(im: Import): string {
	const parts = [
		`<SEQNR_I>${im.seqnr}</SEQNR_I>`,
		im.rechnr !== undefined ? `<RECHNR_I>${escapeXml(im.rechnr)}</RECHNR_I>` : "",
		im.importnr !== undefined ? `<IMPORTNR_I>${escapeXml(im.importnr)}</IMPORTNR_I>` : "",
		`<DATUM_I type="datum">${escapeXml(im.datum)}</DATUM_I>`,
		`<NAME_I>${escapeXml(im.name)}</NAME_I>`,
		`<ADR_I>${escapeXml(im.adr)}</ADR_I>`,
		`<PLZ_I>${escapeXml(im.plz)}</PLZ_I>`,
		`<STADT_I>${escapeXml(im.stadt)}</STADT_I>`,
		`<LAND_I>${escapeXml(im.land)}</LAND_I>`,
		im.gegenstaende.map((g) => gegenstandXml(g, "_I")).join(""),
		grundlagenXml(im.grundlagen, "_I"),
	];
	return `<IMPORT>${parts.join("")}</IMPORT>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		(e.kaeufe ?? []).map(kaufXml).join(""),
		(e.importe ?? []).map(importXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: VatBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = vatBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"VAT body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
