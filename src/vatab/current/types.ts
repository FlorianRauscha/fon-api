/**
 * VATAB — VAT-Refund Abschluss (final-period close-out for an EU VAT-Refund Antrag).
 * Source: schemas/vat/current/BMF_XSD_Schema_VAT_Antrag_Abschluss.xsd (Stand 12.12.2024).
 *
 * Filed once after submitting one or more VAT (`art=VAT`) Anträge for a refund
 * period: carries the bank-account routing for the refund payout, the company's
 * NACE economic-activity codes, five Yes/No qualifier questions, and aggregate
 * KAUF / IMPORT counts and bases — plus an optional PDF attachment.
 *
 * Cross-module note: the `EuLand`, `Waehrung` and `Sprache` enums match the
 * companion `fon-api/vat/current` module (single source of truth: the same
 * upstream BMF-VAT XSD pair).
 */

export type Anbringen = "VATAB";

/** J = Ja, N = Nein. Used by FRAGE_1A/1B/1C/2A/2B. */
export type Wahl = "J" | "N";

/** EU_LAND — refund member state code (33 entries). */
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

/** Currency for the refund payout (13 BMF-permitted refund-state currencies). */
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

/**
 * INHABERTYP — account-holder relation to the applicant.
 *  - "A" = Antragsteller (the applicant themselves)
 *  - "D" = Dritter (third party, e.g. tax representative)
 */
export type Inhabertyp = "A" | "D";

/**
 * NACE Rev. 2 4-digit economic-activity code (e.g. "4711" = food retail).
 * The upstream XSD enumerates 651 valid values; runtime validation against the
 * full list is enforced by the Zod schema (see `NACE_VALUES`). Kept here as a
 * 4-digit string at the type level to keep the TypeScript checker fast.
 */
export type Nace = string;

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
	/** ANTRAGNR — refund tracking ID, AT + 14 digits (16 chars total). Note: VATAB requires digits-only, unlike VAT-Antrag which permits A-Z0-9. */
	antragnr?: string;
	/** ZRVON — period start as YYYY-MM. */
	zrvon: string;
	/** ZRBIS — period end as YYYY-MM. */
	zrbis: string;
	fastnr: string;
	kundeninfo?: string;
	euLand: EuLand;
	emailUnternehmer: string;
	emailVertreter?: string;
	/** NACE — 1..5 economic-activity codes for the applicant. */
	nace: ReadonlyArray<Nace>;
	/** KONTOINHABER — payee name on the refund-receiving bank account (1..70). */
	kontoinhaber: string;
	inhabertyp: Inhabertyp;
	/** IBAN — must start with one of the 29 supported EU country prefixes. */
	iban: string;
	/** BIC — 8 or 11 chars per ISO 9362. */
	bic: string;
	waehrBank: Waehrung;
	/** FRAGE_1A — required qualifier. */
	frage1a: Wahl;
	/** FRAGE_1B — required qualifier. */
	frage1b: Wahl;
	/** FRAGE_1C — required qualifier. */
	frage1c: Wahl;
	/** FRAGE_2A — optional qualifier. */
	frage2a?: Wahl;
	/** FRAGE_2B — optional qualifier. */
	frage2b?: Wahl;
}

/** Optional base64-encoded PDF attachment (with required ART="PDF" attribute). */
export interface PdfAnhang {
	/** Base64-encoded PDF body. */
	base64: string;
}

export interface Anhang {
	pdf?: PdfAnhang;
}

export interface Abschluss {
	/** GESAMT_KAUF — total count of intra-EU purchase lines (0..999 999). */
	gesamtKauf?: number;
	/** GESAMT_BMG_KAUF — total taxable basis across KAUF entries. */
	gesamtBmgKauf?: number;
	/** GESAMT_IMPORT — total count of import lines (0..999 999). */
	gesamtImport?: number;
	/** GESAMT_BMG_IMPORT — total taxable basis across IMPORT entries. */
	gesamtBmgImport?: number;
	anhang?: Anhang;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein: AllgemeineDaten;
	abschluss: Abschluss;
}

export interface VatabBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
