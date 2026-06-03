/**
 * VAT — EU VAT-Refund (cross-border input-VAT refund application).
 * Source: schemas/vat/current/BMF_XSD_Schema_VAT_Antrag.xsd (Stand 03.03.2026).
 *
 * One Erklärung carries an ALLGEMEINE_DATEN block plus 0..1000 KAUF and 0..1000
 * IMPORT entries. Each KAUF/IMPORT carries 1..5 GEGENSTAND items (goods code +
 * optional sub-code/description) plus a GRUNDLAGEN block holding currency and
 * basis/VAT/deductible-VAT amounts.
 */

export type Anbringen = "VAT";

/** J = Ja, N = Nein. Used by KLEINBETR_K (small-amount-invoice flag). */
export type Wahl = "J" | "N";

/** EU_LAND — refund member state code (33 entries; includes XI/XJ/IC/XC/XL). */
export type EuLand =
	| "AT"
	| "BE"
	| "BG"
	| "CY"
	| "CZ"
	| "DK"
	| "EE"
	| "FI"
	| "FR"
	| "DE"
	| "EL"
	| "HU"
	| "IE"
	| "IT"
	| "LV"
	| "LT"
	| "LU"
	| "MT"
	| "NL"
	| "PL"
	| "PT"
	| "RO"
	| "SK"
	| "SI"
	| "ES"
	| "SE"
	| "GB"
	| "HR"
	| "MC"
	| "XI"
	| "XJ"
	| "IC"
	| "XC"
	| "XL";

/** LAND — full ISO-3166 alpha-2 plus a few BMF-specific extensions (225 entries). */
export type Land =
	| "AF"
	| "AL"
	| "DZ"
	| "AS"
	| "AD"
	| "AO"
	| "AI"
	| "AQ"
	| "AG"
	| "AR"
	| "AM"
	| "AW"
	| "AU"
	| "AZ"
	| "BS"
	| "BH"
	| "BD"
	| "BB"
	| "BY"
	| "BZ"
	| "BJ"
	| "BM"
	| "BT"
	| "BO"
	| "BA"
	| "BW"
	| "BV"
	| "BR"
	| "IO"
	| "BN"
	| "BF"
	| "BI"
	| "KH"
	| "CM"
	| "CA"
	| "CV"
	| "KY"
	| "CF"
	| "TD"
	| "CL"
	| "CN"
	| "CX"
	| "CC"
	| "CO"
	| "KM"
	| "CG"
	| "CD"
	| "CK"
	| "CR"
	| "CI"
	| "HR"
	| "CU"
	| "DJ"
	| "DM"
	| "DO"
	| "EC"
	| "EG"
	| "SV"
	| "GQ"
	| "ER"
	| "ET"
	| "FK"
	| "FO"
	| "FJ"
	| "GF"
	| "PF"
	| "TF"
	| "GA"
	| "GM"
	| "GE"
	| "GH"
	| "GI"
	| "GL"
	| "GD"
	| "GP"
	| "GU"
	| "GT"
	| "GN"
	| "GW"
	| "GY"
	| "HT"
	| "HM"
	| "VA"
	| "HN"
	| "HK"
	| "IS"
	| "IN"
	| "ID"
	| "IR"
	| "IQ"
	| "IL"
	| "JM"
	| "JP"
	| "JO"
	| "KZ"
	| "KE"
	| "KI"
	| "KP"
	| "KR"
	| "KW"
	| "KG"
	| "LA"
	| "LB"
	| "LS"
	| "LR"
	| "LY"
	| "LI"
	| "MO"
	| "MK"
	| "MG"
	| "MW"
	| "MY"
	| "MV"
	| "ML"
	| "MH"
	| "MQ"
	| "MR"
	| "MU"
	| "YT"
	| "MX"
	| "FM"
	| "MD"
	| "MC"
	| "MN"
	| "MS"
	| "MA"
	| "MZ"
	| "MM"
	| "NA"
	| "NR"
	| "NP"
	| "AN"
	| "NC"
	| "NZ"
	| "NI"
	| "NE"
	| "NG"
	| "NU"
	| "NF"
	| "MP"
	| "NO"
	| "OM"
	| "PK"
	| "PW"
	| "PS"
	| "PA"
	| "PG"
	| "PY"
	| "PE"
	| "PH"
	| "PN"
	| "PR"
	| "QA"
	| "RE"
	| "RU"
	| "RW"
	| "SH"
	| "KN"
	| "LC"
	| "PM"
	| "VC"
	| "WS"
	| "SM"
	| "ST"
	| "SA"
	| "SN"
	| "CS"
	| "SC"
	| "SL"
	| "SG"
	| "SB"
	| "SO"
	| "ZA"
	| "GS"
	| "LK"
	| "SD"
	| "SR"
	| "SJ"
	| "SZ"
	| "CH"
	| "SY"
	| "TW"
	| "TJ"
	| "TZ"
	| "TH"
	| "TL"
	| "TG"
	| "TK"
	| "TO"
	| "TT"
	| "TN"
	| "TR"
	| "TM"
	| "TC"
	| "TV"
	| "UG"
	| "UA"
	| "AE"
	| "US"
	| "UM"
	| "UY"
	| "UZ"
	| "VU"
	| "VE"
	| "VN"
	| "VG"
	| "VI"
	| "WF"
	| "EH"
	| "YE"
	| "ZM"
	| "ZW"
	| "AX"
	| "BL"
	| "GG"
	| "IM"
	| "JE"
	| "MF"
	| "IC"
	| "XI"
	| "XJ"
	| "CW"
	| "NM"
	| "BQ"
	| "XC"
	| "XL";

/** Currency for KAUF/IMPORT amounts (13 BMF-permitted refund-state currencies). */
export type Waehrung =
	| "BGN"
	| "CZK"
	| "DKK"
	| "EEK"
	| "EUR"
	| "GBP"
	| "HUF"
	| "LTL"
	| "LVL"
	| "PLN"
	| "RON"
	| "SEK"
	| "HRK";

/** ISO-639 lowercase 2-letter language code (BMF-permitted subset). */
export type Sprache =
	| "bg"
	| "cs"
	| "da"
	| "de"
	| "el"
	| "en"
	| "es"
	| "et"
	| "fi"
	| "fr"
	| "ga"
	| "hu"
	| "it"
	| "lt"
	| "lv"
	| "mt"
	| "nl"
	| "pl"
	| "pt"
	| "ro"
	| "sk"
	| "sl"
	| "sv"
	| "tr"
	| "hr";

/** Goods category code 1..10 per the EU VAT Refund directive. */
export type GoodsCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
	/** ANTRAGNR — refund tracking ID, AT + 14 alphanumerics (16 chars total). */
	antragnr?: string;
	/** ZRVON — period start as YYYY-MM. */
	zrvon: string;
	/** ZRBIS — period end as YYYY-MM. */
	zrbis: string;
	fastnr: string;
	kundeninfo?: string;
	euLand: EuLand;
	sprache?: Sprache;
}

/** A single goods-category line for a KAUF or IMPORT (1..5 per parent). */
export interface Gegenstand {
	code: GoodsCode;
	/** SUBCODE — one or two ".dd" suffixes (e.g. "1.05" or "1.05.06"). */
	subcode?: string;
	beschreibung?: string;
}

/** GRUNDLAGEN block — currency + base/VAT/deductible-VAT amounts. */
export interface Grundlagen {
	waehrung: Waehrung;
	/** BMG — Bemessungsgrundlage (taxable amount). */
	bmg: number;
	/** VST — Vorsteuer (input VAT). */
	vst: number;
	/** ABVST — abziehbare Vorsteuer (deductible VAT). */
	abvst: number;
}

/** A single KAUF (intra-EU purchase from another member state). */
export interface Kauf {
	/** SEQNR_K — sequence within this Erklärung (1..999999). */
	seqnr: number;
	/** BEZNR_K — invoice/document number (1..24 chars, must end with a digit). */
	beznr: string;
	/** DATUM_K — invoice date (YYYY-MM-DD). */
	datum: string;
	/** KLEINBETR_K — Kleinbetragsrechnung flag. */
	kleinbetr: Wahl;
	/** UID_K — supplier VAT-ID (EU prefix + up to 12 alnum). */
	uid?: string;
	/** STNR_K — supplier tax number (max 20 chars). */
	stnr?: string;
	name: string;
	adr: string;
	plz: string;
	stadt: string;
	land: EuLand;
	gegenstaende: ReadonlyArray<Gegenstand>;
	grundlagen: Grundlagen;
}

/** A single IMPORT (from a non-EU country into the refund member state). */
export interface Import {
	/** SEQNR_I — sequence within this Erklärung (1..999999). */
	seqnr: number;
	/** RECHNR_I — invoice number (1..18 chars, must end with a digit). */
	rechnr?: string;
	/** IMPORTNR_I — customs/import declaration ID (max 24 chars). */
	importnr?: string;
	/** DATUM_I — import date (YYYY-MM-DD). */
	datum: string;
	name: string;
	adr: string;
	plz: string;
	stadt: string;
	land: Land;
	gegenstaende: ReadonlyArray<Gegenstand>;
	grundlagen: Grundlagen;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein: AllgemeineDaten;
	kaeufe?: ReadonlyArray<Kauf>;
	importe?: ReadonlyArray<Import>;
}

export interface VatBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
