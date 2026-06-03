import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { novaBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Anmeldung,
	Erklaerung,
	InfoDaten,
	NovaBody,
	Verguetung,
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
		`<ZR type="jahrmonat">${escapeXml(a.zr)}</ZR>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function anmeldungXml(a: Anmeldung): string {
	const parts = [
		kzEl("LIEF_BMG", a.liefBmg),
		kzEl("LIEF_STEUER", a.liefSteuer),
		kzEl("IGE_BMG", a.igeBmg),
		kzEl("IGE_STEUER", a.igeSteuer),
		kzEl("SONSTVG_BMG", a.sonstvgBmg),
		kzEl("SONSTVG_STEUER", a.sonstvgSteuer),
		kzEl("BERICHTIG", a.berichtig),
	];
	return `<ANMELDUNG>${parts.join("")}</ANMELDUNG>`;
}

function verguetungXml(v: Verguetung): string {
	const parts = [
		v.fin !== undefined ? `<FIN>${escapeXml(v.fin)}</FIN>` : "",
		kzEl("VERG_BMG", v.vergBmg),
		v.novaSatz !== undefined ? `<NOVA_SATZ>${escapeXml(v.novaSatz)}</NOVA_SATZ>` : "",
		kzEl("VERG_STEUER", v.vergSteuer),
		v.vergGrund !== undefined ? `<VERG_GRUND>${v.vergGrund}</VERG_GRUND>` : "",
		v.sonstBegruend !== undefined
			? `<SONST_BEGRUEND>${escapeXml(v.sonstBegruend)}</SONST_BEGRUEND>`
			: "",
		kzEl("UST_BMG", v.ustBmg),
		v.ustInfo !== undefined ? `<UST_INFO>${v.ustInfo}</UST_INFO>` : "",
	];
	return `<VERGUETUNG>${parts.join("")}</VERGUETUNG>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		e.allgemein !== undefined ? allgemeinXml(e.allgemein) : "",
		e.anmeldung !== undefined ? anmeldungXml(e.anmeldung) : "",
		(e.verguetungen ?? []).map(verguetungXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: NovaBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = novaBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"NoVA body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
