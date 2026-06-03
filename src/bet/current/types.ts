/**
 * BET — Beteiligte einer Personengesellschaft (partners of a partnership).
 * Source: schemas/bet/current/BMF_XSD_Schema_Abfragen_Beteiligte.xsd (Stand 02.04.2007).
 *
 * Root element is `<XML>` (not the usual ERKLAERUNGS_UEBERMITTLUNG). The schema
 * pre-dates the unified packaging shape used by U30/JAHR_ERKL/etc.; it carries
 * a flat header for the partnership followed by 1..200 repetitions of a 7-field
 * Beteiligter group.
 *
 * Note: the upstream 2007 XSD is not xmllint/libxml2-compatible — its
 * `alphanumerisch37` pattern is a broken character class and `prozent` declares
 * a `totalDigits` facet on `xs:double` (not permitted). Conformance therefore
 * relies on the runtime Zod schema instead of XSD validation.
 */

export type Anbringen = "BET";

/** FOLGE — J = Folgeerklärung (correction), N = Erstmeldung. */
export type Folge = "J" | "N";

/**
 * BMF country code for LAND_BETR — mostly ISO 3166-1 alpha-2, but with "A" for
 * Austria (BMF's standard 1-letter code) and a few BMF-specific variants. The
 * complete enumeration as fixed by the 2007 schema (184 entries).
 */
export type LandBetr =
	| "A"
	| "AS"
	| "AI"
	| "AG"
	| "SY"
	| "EG"
	| "AR"
	| "AW"
	| "AU"
	| "BB"
	| "BZ"
	| "BM"
	| "VG"
	| "BN"
	| "YU"
	| "NG"
	| "DE"
	| "BF"
	| "BS"
	| "DM"
	| "CK"
	| "ST"
	| "SO"
	| "DZ"
	| "KP"
	| "LA"
	| "MG"
	| "LK"
	| "ET"
	| "DO"
	| "FO"
	| "AD"
	| "LI"
	| "MC"
	| "FK"
	| "FR"
	| "BR"
	| "FM"
	| "GA"
	| "GI"
	| "GD"
	| "GB"
	| "LU"
	| "GU"
	| "GF"
	| "GR"
	| "HK"
	| "IE"
	| "KM"
	| "MR"
	| "PK"
	| "IR"
	| "IT"
	| "JM"
	| "JP"
	| "VI"
	| "SZ"
	| "KH"
	| "CA"
	| "KI"
	| "LS"
	| "MA"
	| "NL"
	| "SA"
	| "BE"
	| "BT"
	| "DK"
	| "JO"
	| "NP"
	| "NO"
	| "SE"
	| "ES"
	| "TH"
	| "TO"
	| "LY"
	| "LB"
	| "MO"
	| "MY"
	| "MQ"
	| "MK"
	| "MN"
	| "NC"
	| "NZ"
	| "AN"
	| "PG"
	| "PT"
	| "PR"
	| "GQ"
	| "BW"
	| "PH"
	| "BA"
	| "TT"
	| "AF"
	| "AL"
	| "AM"
	| "AZ"
	| "BY"
	| "BO"
	| "BG"
	| "BI"
	| "CL"
	| "CR"
	| "CI"
	| "DJ"
	| "EC"
	| "SV"
	| "EE"
	| "FJ"
	| "FI"
	| "GM"
	| "GE"
	| "GH"
	| "GT"
	| "GY"
	| "GN"
	| "GW"
	| "HT"
	| "HN"
	| "IN"
	| "ID"
	| "IQ"
	| "IS"
	| "YE"
	| "CM"
	| "CV"
	| "KZ"
	| "KE"
	| "KG"
	| "CO"
	| "CG"
	| "KR"
	| "HR"
	| "CU"
	| "LV"
	| "LR"
	| "LT"
	| "MW"
	| "MV"
	| "ML"
	| "MT"
	| "MU"
	| "MZ"
	| "MD"
	| "NA"
	| "NR"
	| "NI"
	| "NE"
	| "PA"
	| "PY"
	| "PE"
	| "PL"
	| "RW"
	| "ZA"
	| "ZM"
	| "SM"
	| "SN"
	| "SC"
	| "SL"
	| "SG"
	| "SI"
	| "SD"
	| "SR"
	| "TR"
	| "TJ"
	| "TG"
	| "TD"
	| "TN"
	| "UG"
	| "HU"
	| "UY"
	| "UZ"
	| "VU"
	| "VE"
	| "ZW"
	| "CY"
	| "RO"
	| "RU"
	| "SB"
	| "CH"
	| "SK"
	| "VN"
	| "KN"
	| "LC"
	| "VC"
	| "BH"
	| "IL"
	| "QA"
	| "KW"
	| "VA"
	| "OM"
	| "CZ"
	| "TM"
	| "TV"
	| "UA"
	| "WS"
	| "BU"
	| "US"
	| "AE"
	| "MX"
	| "TZ"
	| "AO"
	| "BJ"
	| "CN"
	| "BD"
	| "CF";

/** Header for the partnership (Personengesellschaft / -gemeinschaft). */
export interface Kopfdaten {
	anbringen: Anbringen;
	/** JAHR — tax year (YYYY). */
	jahr: string;
	/** FASTNR — partnership's 9-digit FASTNR. */
	fastnr: string;
	/** NAME — partnership name (1..37 chars). */
	name: string;
	/** ADR_BETR — address line (1..37 chars). */
	adrBetr: string;
	/** ORT_BETR — city (1..37 chars). */
	ortBetr: string;
	/** PLZ_BETR — postal code (1..10 chars). */
	plzBetr: string;
	/** PLZORT_BETR — combined PLZ+Ort line for foreign addresses (1..37 chars). */
	plzOrtBetr?: string;
	/** LAND_BETR — country code (BMF enum). */
	landBetr: LandBetr;
	/** DATUM — creation date (YYYY-MM-DD). */
	datum: string;
	/** UHRZEIT — creation time (HH:MM:SS). */
	uhrzeit: string;
}

/** A single Beteiligter row (up to 200 per Erklärung). */
export interface Beteiligter {
	/** FASTNRB — partner's 9-digit FASTNR. */
	fastnrb: string;
	/** PRO — share percentage (0.00000001..100). */
	pro: number;
	/** JAHRPRO — annual percentage (0.00000001..100). */
	jahrpro: number;
	/** ZRVON — period start as DD-MM. */
	zrvon: string;
	/** ZRBIS — period end (free string per XSD). */
	zrbis?: string;
	/** FOLGE — J = correction, N = first filing. */
	folge: Folge;
	/** NAMEB — partner name (1..20 chars). */
	nameb: string;
}

export interface BetBody {
	kopf: Kopfdaten;
	beteiligte: ReadonlyArray<Beteiligter>;
}
