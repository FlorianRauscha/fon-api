import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { komBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	Gemeinde,
	GesamteBemessungsgrundlage,
	InfoDaten,
	KOMBody,
} from "./types.js";

function fmtKz(n: number): string {
	const r = Math.round(n * 100) / 100;
	return (Object.is(r, -0) ? 0 : r).toFixed(2);
}

function kzEl(name: string, v: number | undefined): string {
	if (v === undefined) return "";
	return `<${name} type="kz">${fmtKz(v)}</${name}>`;
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
		a.jahr !== undefined ? `<JAHR>${escapeXml(a.jahr)}</JAHR>` : "",
		a.zr !== undefined ? `<ZR type="jahrmonat">${escapeXml(a.zr)}</ZR>` : "",
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function gemeindeXml(g: Gemeinde): string {
	const parts = [
		`<GD>${escapeXml(g.gd)}</GD>`,
		`<PLZ>${escapeXml(g.plz)}</PLZ>`,
		`<GEM>${escapeXml(g.gem)}</GEM>`,
		kzEl("BMG", g.bmg),
		kzEl("STEUER", g.steuer),
		g.rueck !== undefined ? `<RUECK>${escapeXml(g.rueck)}</RUECK>` : "",
	];
	return `<GEMEINDE>${parts.join("")}</GEMEINDE>`;
}

function gesamteBmgXml(g: GesamteBemessungsgrundlage): string {
	return `<GESAMTE_BEMESSUNGSGRUNDLAGE><GESAMT_BMG type="kz">${fmtKz(g.gesamtBmg)}</GESAMT_BMG><GESAMT_STEUER type="kz">${fmtKz(g.gesamtSteuer)}</GESAMT_STEUER></GESAMTE_BEMESSUNGSGRUNDLAGE>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		e.gesamteBemessungsgrundlage !== undefined ? gesamteBmgXml(e.gesamteBemessungsgrundlage) : "",
		e.gemeinden.map(gemeindeXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: KOMBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = komBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"KOM body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}<KOMMUNALSTEUERERKLAERUNG art="KOM">${erklaerungen}</KOMMUNALSTEUERERKLAERUNG></ERKLAERUNGS_UEBERMITTLUNG>`;
}
