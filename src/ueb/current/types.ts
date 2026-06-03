/**
 * UEB — Übertragung innerhalb der Finanzverwaltung (inter-account transfer).
 * Source: schemas/ueb/current/BMF_XSD_Schema_Uebertragung.xsd
 *
 * Moves a positive amount (UEBERTRAGENDER_BETRAG) from one FASTNR to another.
 * Optional WEGBUCHUNG entries describe how the source side is debited (signed).
 * Optional ZUBUCHUNG entries describe how the destination side is credited (signed).
 */

export type Anbringen = "UEB";

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
	/** Source FASTNR. */
	fastnr: string;
	/** Destination FASTNR (FASTNR_ZU). */
	fastnrZu: string;
	kundeninfo?: string;
}

/** WEGBUCHUNG — debit entry on the source-side account. BETRAG_WEG is signed. */
export interface Wegbuchung {
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	/** Signed amount (-9_999_999_999.99 .. +9_999_999_999.99). */
	betrag: number;
}

/** ZUBUCHUNG — credit entry on the destination-side account. BETRAG_ZU is signed. */
export interface Zubuchung {
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	betrag: number;
}

export interface Erklaerung {
	art: Anbringen;
	allgemein: AllgemeineDaten;
	/** WEGBUCHUNG entries (0..7). */
	wegbuchungen?: ReadonlyArray<Wegbuchung>;
	/** UEBERTRAGENDER_BETRAG → BETRAG_UEB (positive kz, ≥ 0.01). */
	uebertragenderBetrag?: number;
	/** ZUBUCHUNG entries (0..7). */
	zubuchungen?: ReadonlyArray<Zubuchung>;
}

export interface UebBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
