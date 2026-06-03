/**
 * SB — Buchung Sonderbescheid (manual tax-account booking).
 * Source: schemas/sb/current/BMF_XSD_Schema_Buchung_SB.xsd
 *
 * Submitted via fileupload `art="SB"`. Each ERKLAERUNG carries optional UVA period
 * markers + 1..20 Verrechnungsweisungen (booking instructions: account code + period
 * range + signed amount). The AA codes are a fixed BMF enum of 65 account types.
 *
 * NOTE: unlike other arts in this package, SATZNR is **inside** ALLGEMEINE_DATEN
 * rather than a sibling of it.
 */

export type Anbringen = "SB";

/**
 * AA — Abgabenart (3-digit account-type code). Fixed 65-value BMF enum,
 * see XSD `<xs:element name="AA">` for the canonical list.
 */
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

/** ZRVON/ZRBIS in SB are typed strings with a `type` attribute discriminating the format. */
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
	/** SATZNR is part of ALLGEMEINE_DATEN here (unusual). */
	satznr: number;
	anbringen: Anbringen;
	fastnr: string;
	kundeninfo?: string;
}

export interface UvaZeitraum {
	/** UVAZRVON — start of the UVA period (YYYY-MM). */
	uvazrvon?: string;
	/** UVAZRBIS — end of the UVA period (YYYY-MM). */
	uvazrbis?: string;
}

export interface Verrechnungsweisung {
	/** AA — Abgabenart (3-digit BMF account-type code). */
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	/** Signed amount (-9_999_999_999.99 .. 9_999_999_999.99). */
	betrag: number;
}

export interface Erklaerung {
	/** Required `art="SB"` attribute. */
	art: Anbringen;
	allgemein: AllgemeineDaten;
	uvaZeitraum?: UvaZeitraum;
	/** 1..20 booking instructions per Erklärung. */
	verrechnungsweisungen: ReadonlyArray<Verrechnungsweisung>;
}

export interface SbBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
