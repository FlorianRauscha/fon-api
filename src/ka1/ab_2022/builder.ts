import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { kzEl } from "../_kz.js";
import { ka1Body } from "./schema.js";
import type {
	AllgemeineDaten,
	BmgM,
	BmgT,
	BmgVe,
	BmgY,
	BmgZ,
	Erklaerung,
	InfoDaten,
	KA1Body,
	RawInnerSection,
	SvaDaten,
} from "./types.js";

function isRawInner(section: object): section is RawInnerSection {
	return "rawInner" in section;
}

function wrapRaw(element: string, section: RawInnerSection): string {
	return `<${element}>${section.rawInner}</${element}>`;
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
		`<ZR type="${escapeXml(a.zr.type)}">${escapeXml(a.zr.value)}</ZR>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function bmgTXml(s: RawInnerSection | BmgT): string {
	if (isRawInner(s)) return wrapRaw("BMG_T", s);
	const parts = [
		kzEl("KAT11", s.kat11),
		kzEl("KAT11A", s.kat11a),
		kzEl("KAT11B", s.kat11b),
		kzEl("KAT11C", s.kat11c),
		s.katBegr !== undefined ? `<KAT_BEGR>${escapeXml(s.katBegr)}</KAT_BEGR>` : "",
		kzEl("KAT21", s.kat21),
		kzEl("KAT22", s.kat22),
		kzEl("KAT23", s.kat23),
		kzEl("KAT24", s.kat24),
		kzEl("KAT25", s.kat25),
		s.katDat25Mel !== undefined
			? `<KAT_DAT25_MEL type="datum">${escapeXml(s.katDat25Mel)}</KAT_DAT25_MEL>`
			: "",
		kzEl("KAT31", s.kat31),
		kzEl("KAT32", s.kat32),
		kzEl("KAT33", s.kat33),
		kzEl("KAT34", s.kat34),
		kzEl("SUMME_KA", s.summeKa),
	];
	return `<BMG_T>${parts.join("")}</BMG_T>`;
}

function bmgMXml(s: RawInnerSection | BmgM): string {
	if (isRawInner(s)) return wrapRaw("BMG_M", s);
	const parts = [
		kzEl("KAM11", s.kam11),
		kzEl("KAM11A", s.kam11a),
		kzEl("KAM11B", s.kam11b),
		kzEl("KAM11C", s.kam11c),
		kzEl("KAM21", s.kam21),
		kzEl("KAM22", s.kam22),
		kzEl("SUMME_KA", s.summeKa),
		kzEl("KBM31", s.kbm31),
		kzEl("KBM31A", s.kbm31a),
		kzEl("KBM31B", s.kbm31b),
		kzEl("KBM32", s.kbm32),
		kzEl("KBM32A", s.kbm32a),
		kzEl("KBM32B", s.kbm32b),
		kzEl("KBM41", s.kbm41),
		kzEl("KBM41B", s.kbm41b),
		kzEl("KBM42", s.kbm42),
		kzEl("KBM42B", s.kbm42b),
		kzEl("SUMME_KB", s.summeKb),
		kzEl("KCM51", s.kcm51),
		kzEl("KCM51A", s.kcm51a),
		kzEl("KCM51B", s.kcm51b),
		kzEl("KCM61", s.kcm61),
		kzEl("KCM61B", s.kcm61b),
		kzEl("SUMME_KC", s.summeKc),
		kzEl("KVM71", s.kvm71),
		kzEl("KVM72", s.kvm72),
		kzEl("SUMME_KV", s.summeKv),
	];
	return `<BMG_M>${parts.join("")}</BMG_M>`;
}

function bmgVeXml(s: RawInnerSection | BmgVe): string {
	if (isRawInner(s)) return wrapRaw("BMG_VE", s);
	const dat = (name: string, v: string | undefined) =>
		v !== undefined ? `<${name} type="datum">${escapeXml(v)}</${name}>` : "";
	const parts = [
		kzEl("KBVE11", s.kbve11),
		kzEl("KBVE11A", s.kbve11a),
		kzEl("KBVE11B", s.kbve11b),
		dat("KBVE_DAT11_VON", s.kbveDat11Von),
		dat("KBVE_DAT11_BIS", s.kbveDat11Bis),
		kzEl("KBVE12", s.kbve12),
		kzEl("KBVE12A", s.kbve12a),
		kzEl("KBVE12B", s.kbve12b),
		dat("KBVE_DAT12_VON", s.kbveDat12Von),
		dat("KBVE_DAT12_BIS", s.kbveDat12Bis),
		kzEl("KBVE21", s.kbve21),
		kzEl("KBVE21B", s.kbve21b),
		kzEl("KBVE22", s.kbve22),
		kzEl("KBVE22B", s.kbve22b),
		kzEl("SUMME_KB", s.summeKb),
	];
	return `<BMG_VE>${parts.join("")}</BMG_VE>`;
}

function bmgZXml(s: RawInnerSection | BmgZ): string {
	if (isRawInner(s)) return wrapRaw("BMG_Z", s);
	const parts = [
		kzEl("KAZ11", s.kaz11),
		kzEl("KAZ12", s.kaz12),
		kzEl("KAZ13", s.kaz13),
		kzEl("KAZ21", s.kaz21),
		kzEl("KAZ22", s.kaz22),
		kzEl("SUMME_KW", s.summeKw),
	];
	return `<BMG_Z>${parts.join("")}</BMG_Z>`;
}

function bmgYXml(s: RawInnerSection | BmgY): string {
	if (isRawInner(s)) return wrapRaw("BMG_Y", s);
	const parts = [
		kzEl("KAY11", s.kay11),
		kzEl("KAY11A", s.kay11a),
		kzEl("KAY11B", s.kay11b),
		kzEl("KAY12", s.kay12),
		kzEl("KAY12A", s.kay12a),
		kzEl("KAY12B", s.kay12b),
		kzEl("KAY21", s.kay21),
		kzEl("KAY21B", s.kay21b),
		kzEl("KAY22", s.kay22),
		kzEl("KAY22B", s.kay22b),
		kzEl("SUMME_KY", s.summeKy),
		kzEl("KYV31", s.kyv31),
		kzEl("SUMME_KYV", s.summeKyv),
	];
	return `<BMG_Y>${parts.join("")}</BMG_Y>`;
}

function svaXml(s: SvaDaten): string {
	return [
		"<SVA_DATEN>",
		`<KAT_VNR>${escapeXml(s.vnr)}</KAT_VNR>`,
		`<KAT_NAME>${escapeXml(s.name)}</KAT_NAME>`,
		`<KAT_BETRAG type="kz">${(Math.round(s.betrag * 100) / 100).toFixed(2)}</KAT_BETRAG>`,
		"</SVA_DATEN>",
	].join("");
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		e.bmgT !== undefined ? bmgTXml(e.bmgT) : "",
		e.bmgM !== undefined ? bmgMXml(e.bmgM) : "",
		e.bmgVe !== undefined ? bmgVeXml(e.bmgVe) : "",
		e.bmgZ !== undefined ? bmgZXml(e.bmgZ) : "",
		e.bmgY !== undefined ? bmgYXml(e.bmgY) : "",
		(e.svaDaten ?? []).map(svaXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

/**
 * Build a KA1 ab_2022 `<ERKLAERUNGS_UEBERMITTLUNG>` payload from a typed body.
 * Pass the output as the `data` field of a fileupload SOAP call with `art: "KA1"`.
 */
export function build(body: KA1Body, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = ka1Body.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"KA1 ab_2022 body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}<KAPITALERTRAGSTEUERERKLAERUNG art="KA1">${erklaerungen}</KAPITALERTRAGSTEUERERKLAERUNG></ERKLAERUNGS_UEBERMITTLUNG>`;
}
