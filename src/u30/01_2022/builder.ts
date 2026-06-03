import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { fmtKz, kzEl } from "../_kz.js";
import { u30Body } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	InfoDaten,
	InnergemeinschaftlicheErwerbe,
	LieferungenLeistungenEigenverbrauch,
	Steuerfrei,
	U30Body,
	Versteuert,
	VersteuertIge,
	Vorsteuer,
} from "./types.js";

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
	return [
		"<ALLGEMEINE_DATEN>",
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		`<ZRVON type="jahrmonat">${escapeXml(a.zrvon)}</ZRVON>`,
		`<ZRBIS type="jahrmonat">${escapeXml(a.zrbis)}</ZRBIS>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
		"</ALLGEMEINE_DATEN>",
	].join("");
}

function steuerfreiXml(s: Steuerfrei): string {
	const parts = [
		kzEl("KZ011", s.kz011),
		kzEl("KZ012", s.kz012),
		kzEl("KZ015", s.kz015),
		kzEl("KZ017", s.kz017),
		kzEl("KZ018", s.kz018),
		kzEl("KZ019", s.kz019),
		kzEl("KZ016", s.kz016),
		s.vst !== undefined ? `<VST>${escapeXml(s.vst)}</VST>` : "",
		kzEl("KZ020", s.kz020),
	];
	return `<STEUERFREI>${parts.join("")}</STEUERFREI>`;
}

function versteuertXml(v: Versteuert): string {
	const parts = [
		kzEl("KZ022", v.kz022),
		kzEl("KZ029", v.kz029),
		kzEl("KZ006", v.kz006),
		kzEl("KZ037", v.kz037),
		kzEl("KZ052", v.kz052),
		kzEl("KZ007", v.kz007),
		kzEl("KZ056", v.kz056),
		kzEl("KZ057", v.kz057),
		kzEl("KZ048", v.kz048),
		kzEl("KZ044", v.kz044),
		kzEl("KZ032", v.kz032),
	];
	return `<VERSTEUERT>${parts.join("")}</VERSTEUERT>`;
}

function lieferungenXml(l: LieferungenLeistungenEigenverbrauch): string {
	const parts = [
		`<KZ000 type="kz">${fmtKz(l.kz000)}</KZ000>`,
		kzEl("KZ001", l.kz001),
		kzEl("KZ021", l.kz021),
		l.steuerfrei !== undefined ? steuerfreiXml(l.steuerfrei) : "",
		l.versteuert !== undefined ? versteuertXml(l.versteuert) : "",
	];
	return `<LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH>${parts.join("")}</LIEFERUNGEN_LEISTUNGEN_EIGENVERBRAUCH>`;
}

function versteuertIgeXml(v: VersteuertIge): string {
	const parts = [
		kzEl("KZ072", v.kz072),
		kzEl("KZ073", v.kz073),
		kzEl("KZ008", v.kz008),
		kzEl("KZ088", v.kz088),
		kzEl("KZ076", v.kz076),
		kzEl("KZ077", v.kz077),
	];
	return `<VERSTEUERT_IGE>${parts.join("")}</VERSTEUERT_IGE>`;
}

function innergemXml(i: InnergemeinschaftlicheErwerbe): string {
	const parts = [
		kzEl("KZ070", i.kz070),
		kzEl("KZ071", i.kz071),
		i.versteuertIge !== undefined ? versteuertIgeXml(i.versteuertIge) : "",
	];
	return `<INNERGEMEINSCHAFTLICHE_ERWERBE>${parts.join("")}</INNERGEMEINSCHAFTLICHE_ERWERBE>`;
}

function vorsteuerXml(v: Vorsteuer): string {
	const parts = [
		kzEl("KZ060", v.kz060),
		kzEl("KZ061", v.kz061),
		kzEl("KZ083", v.kz083),
		kzEl("KZ065", v.kz065),
		kzEl("KZ066", v.kz066),
		kzEl("KZ082", v.kz082),
		kzEl("KZ087", v.kz087),
		kzEl("KZ089", v.kz089),
		kzEl("KZ064", v.kz064),
		kzEl("KZ062", v.kz062),
		kzEl("KZ063", v.kz063),
		kzEl("KZ067", v.kz067),
		kzEl("KZ090", v.kz090),
		v.are !== undefined ? `<ARE>${escapeXml(v.are)}</ARE>` : "",
		v.repo !== undefined ? `<REPO>${escapeXml(v.repo)}</REPO>` : "",
	];
	return `<VORSTEUER>${parts.join("")}</VORSTEUER>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		lieferungenXml(e.lieferungen),
		e.innergemeinschaftlich !== undefined ? innergemXml(e.innergemeinschaftlich) : "",
		e.vorsteuer !== undefined ? vorsteuerXml(e.vorsteuer) : "",
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: U30Body, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = u30Body.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"U30 01_2022 body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
