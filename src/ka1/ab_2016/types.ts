/**
 * KA1 — Kapitalertragsteuer-Anmeldung, schema effective from 2016-01-01 until 2021-12-31.
 * Source: schemas/ka1/ab_2016/BMF_XSD_Schema_Kapitalertragsteuer_Anmeldung_KA1_ab_2016.xsd
 *
 * Subset of `ab_2022` — see that module's docs for the overall shape. Differences:
 *   - 5 Anbringen values (no `KA1Y`)
 *   - No `BMG_Y` block (introduced in 2022)
 *   - `BMG_M` lacks the *A/*B suffix variants on KBM31/32/41/42, KCM51/61
 *   - `BMG_VE` lacks the *A/*B variants on KBVE11/12/21/22
 * Same SVA_DATEN, BMG_T, BMG_Z, ALLGEMEINE_DATEN, INFO_DATEN as ab_2022.
 */

export type Anbringen = "KA1T" | "KA1M" | "KA1V" | "KA1E" | "KA1Z";

export type KatBegr = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "99";

export type ZrType = "datum" | "jahrmonat" | "jahr";

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

/** BMG_T — same as ab_2022. */
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
	katDat25Mel?: string;
	kat31?: number;
	kat32?: number;
	kat33?: number;
	kat34?: number;
	summeKa?: number;
}

/** BMG_M — ab_2016: 18 fields (no *A/*B suffix variants on KBM/KCM). */
export interface BmgM {
	kam11?: number;
	kam11a?: number;
	kam11b?: number;
	kam11c?: number;
	kam21?: number;
	kam22?: number;
	summeKa?: number;
	kbm31?: number;
	kbm32?: number;
	kbm41?: number;
	kbm42?: number;
	summeKb?: number;
	kcm51?: number;
	kcm61?: number;
	summeKc?: number;
	kvm71?: number;
	kvm72?: number;
	summeKv?: number;
}

/** BMG_VE — ab_2016: 9 fields (no *A/*B suffix variants). */
export interface BmgVe {
	kbve11?: number;
	kbveDat11Von?: string;
	kbveDat11Bis?: string;
	kbve12?: number;
	kbveDat12Von?: string;
	kbveDat12Bis?: string;
	kbve21?: number;
	kbve22?: number;
	summeKb?: number;
}

/** BMG_Z — same as ab_2022. */
export interface BmgZ {
	kaz11?: number;
	kaz12?: number;
	kaz13?: number;
	kaz21?: number;
	kaz22?: number;
	summeKw?: number;
}

/** SVA_DATEN — same as ab_2022. */
export interface SvaDaten {
	vnr: string;
	name: string;
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
	svaDaten?: ReadonlyArray<SvaDaten>;
}

export interface KA1Body {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
