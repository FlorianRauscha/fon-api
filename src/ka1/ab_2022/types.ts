/**
 * KA1 — Kapitalertragsteuer-Anmeldung, schema effective from 2022-01-01.
 * Source: schemas/ka1/ab_2022/BMF_XSD_Schema_Kapitalertragsteuer_Anmeldung_KA1_ab_2022.xsd
 *
 * One submission packet (`KAPITALERTRAGSTEUERERKLAERUNG`) holds 1..9999 ERKLAERUNG
 * entries. Each ERKLAERUNG carries an `art` attribute (KA1T / KA1M / KA1V / KA1E
 * / KA1Z / KA1Y) plus the matching BMG block:
 *   - KA1T → BMG_T (Tagesabrechnung — daily KESt declarations)
 *   - KA1M → BMG_M (Monatsabrechnung — monthly KESt declarations)
 *   - KA1V → BMG_VE (vorzeitige Endabrechnung)
 *   - KA1E → no specific BMG block (Endabrechnung; reuses BMG_M shape in practice)
 *   - KA1Z → BMG_Z (Zwischenabrechnung)
 *   - KA1Y → BMG_Y
 * Up to 10 SVA_DATEN beneficiary blocks per ERKLAERUNG.
 */

export type Anbringen = "KA1T" | "KA1M" | "KA1V" | "KA1E" | "KA1Z" | "KA1Y";

/** KAT_BEGR — Kapitalertragsteuer-Begründung code (01..10 or 99). */
export type KatBegr = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "99";

export type ZrType = "datum" | "jahrmonat" | "jahr";

/** Zeitraum field: value format depends on `type` (YYYY-MM-DD / YYYY-MM / YYYY). */
export interface Zeitraum {
	value: string;
	type: ZrType;
}

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
}

export interface AllgemeineDaten {
	anbringen: Anbringen;
	zr: Zeitraum;
	fastnr: string;
	kundeninfo?: string;
}

export interface RawInnerSection {
	rawInner: string;
}

/** BMG_T — Tagesabrechnung (KESt for daily settlements). */
export interface BmgT {
	kat11?: number;
	kat11a?: number;
	kat11b?: number;
	kat11c?: number;
	katBegr?: KatBegr;
	kat21?: number;
	kat22?: number;
	kat23?: number;
	kat24?: number;
	kat25?: number;
	/** KAT_DAT25_MEL — Meldedatum für KAT25 (YYYY-MM-DD). */
	katDat25Mel?: string;
	kat31?: number;
	kat32?: number;
	kat33?: number;
	kat34?: number;
	summeKa?: number;
}

/** BMG_M — Monatsabrechnung (monthly aggregate KESt). */
export interface BmgM {
	kam11?: number;
	kam11a?: number;
	kam11b?: number;
	kam11c?: number;
	kam21?: number;
	kam22?: number;
	summeKa?: number;
	kbm31?: number;
	kbm31a?: number;
	kbm31b?: number;
	kbm32?: number;
	kbm32a?: number;
	kbm32b?: number;
	kbm41?: number;
	kbm41b?: number;
	kbm42?: number;
	kbm42b?: number;
	summeKb?: number;
	kcm51?: number;
	kcm51a?: number;
	kcm51b?: number;
	kcm61?: number;
	kcm61b?: number;
	summeKc?: number;
	kvm71?: number;
	kvm72?: number;
	summeKv?: number;
}

/** BMG_VE — vorzeitige Endabrechnung. */
export interface BmgVe {
	kbve11?: number;
	kbve11a?: number;
	kbve11b?: number;
	/** YYYY-MM-DD. */
	kbveDat11Von?: string;
	kbveDat11Bis?: string;
	kbve12?: number;
	kbve12a?: number;
	kbve12b?: number;
	kbveDat12Von?: string;
	kbveDat12Bis?: string;
	kbve21?: number;
	kbve21b?: number;
	kbve22?: number;
	kbve22b?: number;
	summeKb?: number;
}

/** BMG_Z — Zwischenabrechnung. */
export interface BmgZ {
	kaz11?: number;
	kaz12?: number;
	kaz13?: number;
	kaz21?: number;
	kaz22?: number;
	summeKw?: number;
}

/** BMG_Y. */
export interface BmgY {
	kay11?: number;
	kay11a?: number;
	kay11b?: number;
	kay12?: number;
	kay12a?: number;
	kay12b?: number;
	kay21?: number;
	kay21b?: number;
	kay22?: number;
	kay22b?: number;
	summeKy?: number;
	kyv31?: number;
	summeKyv?: number;
}

/** SVA_DATEN — beneficiary block (Sondervermögen-/Anteilsinhaber). 1..10 per ERKLAERUNG. */
export interface SvaDaten {
	/** KAT_VNR — 10-digit Versicherungsnummer. */
	vnr: string;
	/** KAT_NAME — beneficiary name (max 60 chars). */
	name: string;
	/** KAT_BETRAG — amount. */
	betrag: number;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein: AllgemeineDaten;
	bmgT?: RawInnerSection | BmgT;
	bmgM?: RawInnerSection | BmgM;
	bmgVe?: RawInnerSection | BmgVe;
	bmgZ?: RawInnerSection | BmgZ;
	bmgY?: RawInnerSection | BmgY;
	svaDaten?: ReadonlyArray<SvaDaten>;
}

export interface KA1Body {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
