/**
 * SBS — Berichtigung Buchung SB (correction of a previously-filed booking).
 * Source: schemas/sbs/current/BMF_XSD_Schema_Berichtigung_Buchung_SB.xsd
 *
 * Per ERKLAERUNG: ALLGEMEINE_DATEN + BUCHUNGSTAG (the date of the original booking
 * being corrected) + BERICHTIGUNG_SELBSTBEMESSUNGSABGABEN, which holds two parallel
 * lists:
 *   - SELBSTBEMESSUNGSABGABEN_IST (1..20) — the original booking entries
 *   - SELBSTBEMESSUNGSABGABEN_BER (0..20) — the replacement entries
 *
 * Both lists use the same 65-AA-code enum.
 */

export type Anbringen = "SBS";

/** Same 65-entry AA enum as `fon-api/sb/current`. */
export type AaCode =
	| "000"
	| "007"
	| "011"
	| "012"
	| "013"
	| "014"
	| "015"
	| "016"
	| "018"
	| "021"
	| "024"
	| "026"
	| "027"
	| "028"
	| "030"
	| "031"
	| "034"
	| "040"
	| "045"
	| "047"
	| "057"
	| "077"
	| "113"
	| "114"
	| "115"
	| "116"
	| "122"
	| "123"
	| "124"
	| "125"
	| "126"
	| "163"
	| "164"
	| "166"
	| "177"
	| "178"
	| "179"
	| "200"
	| "204"
	| "205"
	| "400"
	| "401"
	| "405"
	| "406"
	| "443"
	| "444"
	| "445"
	| "446"
	| "447"
	| "448"
	| "449"
	| "450"
	| "451"
	| "452"
	| "453"
	| "454"
	| "455"
	| "456"
	| "460"
	| "461"
	| "462"
	| "463"
	| "465"
	| "466"
	| "467";

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
	satznr: number;
	anbringen: Anbringen;
	fastnr: string;
	kundeninfo?: string;
}

/** Single original-booking entry (SELBSTBEMESSUNGSABGABEN_IST). */
export interface SbaIst {
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	betrag: number;
}

/** Single corrected-booking entry (SELBSTBEMESSUNGSABGABEN_BER). */
export interface SbaBer {
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	betrag: number;
}

export interface BerichtigungSelbstbemessungsabgaben {
	/** Original booking entries (1..20). */
	ist: ReadonlyArray<SbaIst>;
	/** Corrected booking entries (0..20). */
	ber?: ReadonlyArray<SbaBer>;
}

export interface Erklaerung {
	art: Anbringen;
	allgemein: AllgemeineDaten;
	/** BUCHUNGSTAG → BUCHTAG date (YYYY-MM-DD). */
	buchtag: string;
	berichtigung: BerichtigungSelbstbemessungsabgaben;
}

export interface SbsBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
