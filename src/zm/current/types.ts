/**
 * ZM — Zusammenfassende Meldung (EU recapitulative statement, fileupload art="U13").
 * Source: schemas/zm/current/BMF_XSD_Schema_Zusammenfassende_Meldung.xsd
 *
 * Each ERKLAERUNG either lists 1..9999 ZM entries (one per customer EU-VAT-ID) OR
 * a single GESAMTRUECKZIEHUNG (full retraction of a previous filing) — modeled as
 * a discriminated `content` field on Erklaerung.
 *
 * NOTE: ZM uses **whole-euro signed integers** for SUM_BGL (range
 * -9_999_999_999 .. 9_999_999_999), unlike U30/L1/KA1 which use decimal kz.
 */

/** ANBRINGEN — currently only "U13" (Umsatzsteuer §13 — ZM). */
export type Anbringen = "U13";

/** KLAG — Klassifikation (1=Lieferung, 2=sonstige Leistung, 3=Dreiecksgeschäft). */
export type KlagCode = "1" | "2" | "3";

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
	/** ZRVON — start of reporting period (YYYY-MM). */
	zrvon: string;
	/** ZRBIS — end of reporting period (YYYY-MM). */
	zrbis: string;
	fastnr: string;
	kundeninfo?: string;
}

/** A single ZM line — one customer EU-VAT-ID. */
export interface ZmEntry {
	/** UID_MS — customer's EU VAT-ID (Mitgliedstaat-UID), 1..15 chars (e.g. "DE123456789"). */
	uidMs: string;
	/** SUM_BGL — sum (whole euros). Signed integer, may be negative for corrections. */
	sumBgl?: number;
	/** DREIECK — Dreiecksgeschäft flag ("J"). */
	dreieck?: "J";
	/** SOLEI — sonstige Leistung flag ("J"). */
	solei?: "J";
	/** KLAG — Klassifikation 1/2/3. */
	klag?: KlagCode;
	/** UID_UE — alternative/Endkunden-UID (1..15 chars). */
	uidUe?: string;
}

/** Full retraction of a previously filed ZM (returns the ERKLAERUNG to the BMF). */
export interface Gesamtruckziehung {
	/** GESAMTRUECK — must be "J". */
	gesamtrueck: "J";
}

export interface Erklaerung {
	/** Required `art="..."` attribute (typically "U13" matching ANBRINGEN). */
	art: string;
	satznr: number;
	allgemein: AllgemeineDaten;
	/** Discriminator: either ZM entries or a Gesamtrückziehung — never both. */
	content:
		| { kind: "entries"; entries: ReadonlyArray<ZmEntry> }
		| { kind: "gesamtrueckziehung"; gesamtrueckziehung: Gesamtruckziehung };
}

export interface ZMBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
