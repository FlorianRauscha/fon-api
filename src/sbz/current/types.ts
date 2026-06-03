/**
 * SBZ — Meldung zur Zahlung von SB (notice of payment).
 * Source: schemas/sbz/current/BMF_XSD_Schema_Meldung_SB.xsd
 *
 * Subset of SB: same shape minus the optional UVA_ZEITRAUM block. Same 65-value
 * AA enum and same VERRECHNUNGSWEISUNGEN structure.
 */

export type Anbringen = "SBZ";

/** Same 65-entry AA enum as `fon-api/sb/current` — see that module's types.ts. */
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

export interface Verrechnungsweisung {
	aa: AaCode;
	zrvon: Zeitraum;
	zrbis: Zeitraum;
	betrag: number;
}

export interface Erklaerung {
	art: Anbringen;
	allgemein: AllgemeineDaten;
	verrechnungsweisungen: ReadonlyArray<Verrechnungsweisung>;
}

export interface SbzBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
