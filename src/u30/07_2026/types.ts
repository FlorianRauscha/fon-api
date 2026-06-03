/**
 * U30 — Umsatzsteuervoranmeldung (UVA), schema effective from 2026-07-01.
 * Source: schemas/u30/07_2026/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_07_2026.xsd
 *
 * KZ ("Kennzahl") fields are German tax-form numbered codes. Comments on each
 * field reference what the official BMF U30 form labels them; consult the
 * BMF "Ausfüllhilfe" for full meaning.
 */

export interface InfoDaten {
	/** Always "FASTNR" in the current schema. */
	artIdentifikationsbegriff: "FASTNR";
	/** 9-digit Finanzamts- und Steuernummer. */
	identifikationsbegriff: string;
	/** Per-submission packet number. 1..999_999_999. */
	paketNr: number;
	/** Submission date in YYYY-MM-DD. */
	datumErstellung: string;
	/** Submission time in HH:MM:SS. */
	uhrzeitErstellung: string;
	/** Number of <ERKLAERUNG> elements in this transmission. 1..9999. */
	anzahlErklaerungen: number;
}

export interface AllgemeineDaten {
	/** Always "U30". */
	anbringen: "U30";
	/** Voranmeldungszeitraum-Beginn (YYYY-MM). */
	zrvon: string;
	/** Voranmeldungszeitraum-Ende (YYYY-MM). */
	zrbis: string;
	/** 9-digit FASTNR. */
	fastnr: string;
	/** Optional free-text customer reference (max 50 chars). */
	kundeninfo?: string;
}

/** Steuerfreie Umsätze. */
export interface Steuerfrei {
	/** KZ011 — Ausfuhrlieferungen (§ 7) */
	kz011?: number;
	/** KZ012 — Lohnveredlungen an ausländischen Gegenständen (§ 8) */
	kz012?: number;
	/** KZ015 — Umsätze gem. Art. 6 Abs. 1 (innergem. Lieferungen) */
	kz015?: number;
	/** KZ017 — Umsätze § 6 Abs. 1 Z 1 lit. d (Goldlieferungen) */
	kz017?: number;
	/** KZ018 — Umsätze § 6 Abs. 1 Z 2-6 (Banken/Versicherungen u.a.) */
	kz018?: number;
	/** KZ019 — Umsätze § 6 Abs. 1 Z 7-26 */
	kz019?: number;
	/** KZ016 — Umsätze für die Steuerschuld auf den Leistungsempfänger übergeht */
	kz016?: number;
	/** Vorsteuerabzug-Berechtigung (one-letter code, e.g. enumerated). */
	vst?: string;
	/** KZ020 — Sonstige steuerfreie Umsätze ohne Vorsteuerabzug */
	kz020?: number;
}

/** Versteuerte Umsätze. */
export interface Versteuert {
	/** KZ022 — 20% Normalsteuersatz */
	kz022?: number;
	/** KZ124 — neu ab 07/2026 */
	kz124?: number;
	/** KZ029 — 13% ermäßigt */
	kz029?: number;
	/** KZ006 — 10% ermäßigt */
	kz006?: number;
	/** KZ037 — 19% Jungholz und Mittelberg */
	kz037?: number;
	/** KZ052 — 13% Wein ab Hof */
	kz052?: number;
	/** KZ007 — 10% (Sondertarif) */
	kz007?: number;
	/** KZ056 — 0% (Photovoltaik §28 Abs. 62) */
	kz056?: number;
	/** KZ057 — Übergang Steuerschuld (§19 Abs. 1a-1e) */
	kz057?: number;
	/** KZ048 — Steuerschuld kraft Rechnungslegung (§11 Abs. 12 und 14) */
	kz048?: number;
	/** KZ044 — Vorsteuerberichtigung (§16) */
	kz044?: number;
	/** KZ032 — § 19 Abs. 1d (Schrott und Altmetalle) */
	kz032?: number;
}

/** Lieferungen, sonstige Leistungen und Eigenverbrauch. */
export interface LieferungenLeistungenEigenverbrauch {
	/** KZ000 — Gesamtbetrag der Bemessungsgrundlage. Required, may be 0. */
	kz000: number;
	/** KZ001 — Lieferungen Eigenverbrauch */
	kz001?: number;
	/** KZ021 — Sonstige Leistungen */
	kz021?: number;
	steuerfrei?: Steuerfrei;
	versteuert?: Versteuert;
}

/** Versteuerung der innergemeinschaftlichen Erwerbe. */
export interface VersteuertIge {
	/** KZ072 — 20% */
	kz072?: number;
	/** KZ125 — neu ab 07/2026 */
	kz125?: number;
	/** KZ073 — 13% */
	kz073?: number;
	/** KZ008 — 10% */
	kz008?: number;
	/** KZ088 — 19% Jungholz/Mittelberg */
	kz088?: number;
	/** KZ076 — 13% Wein ab Hof */
	kz076?: number;
	/** KZ077 — 0% (Photovoltaik) */
	kz077?: number;
}

export interface InnergemeinschaftlicheErwerbe {
	/** KZ070 — Gesamtbetrag der Bemessungsgrundlage der i.g. Erwerbe */
	kz070?: number;
	/** KZ071 — davon steuerfrei (Art. 6) */
	kz071?: number;
	versteuertIge?: VersteuertIge;
}

export interface Vorsteuer {
	/** KZ060 — Vorsteuern (außer EUST) */
	kz060?: number;
	/** KZ061 — EUST (entrichtet) */
	kz061?: number;
	/** KZ083 — geschuldete EUST (§26 Abs. 3 Z 2) */
	kz083?: number;
	/** KZ065 — Vorsteuern § 19 Abs. 1 zweiter Satz */
	kz065?: number;
	/** KZ066 — Vorsteuern aus innergem. Erwerb */
	kz066?: number;
	/** KZ082 — Vorsteuern § 19 Abs. 1a (Bauleistungen) */
	kz082?: number;
	/** KZ087 — Vorsteuern § 19 Abs. 1d (Schrott/Altmetalle) */
	kz087?: number;
	/** KZ089 — Vorsteuern § 19 Abs. 1b und 1e */
	kz089?: number;
	/** KZ064 — Vorsteuerberichtigung (§12 Abs. 10/11) */
	kz064?: number;
	/** KZ062 — Vorsteuern § 12 Abs. 16 (pauschal) */
	kz062?: number;
	/** KZ063 — Vorsteuerberichtigung (§16) — vorzeichenbehaftet */
	kz063?: number;
	/** KZ067 — sonstige Berichtigungen — vorzeichenbehaftet */
	kz067?: number;
	/** KZ090 — Gutschrift / Zahllast (vorzeichenbehaftet) */
	kz090?: number;
	/** ARE — "J" wenn elektronische Rechnung */
	are?: "J";
	/** REPO — "J" wenn Reverse Charge Reporting */
	repo?: "J";
}

export interface Erklaerung {
	/** Required `art="..."` attribute on the `<ERKLAERUNG>` element. Typically "U30". */
	art: string;
	/** Per-Erklärung sequence number within the packet. */
	satznr: number;
	allgemein: AllgemeineDaten;
	lieferungen: LieferungenLeistungenEigenverbrauch;
	innergemeinschaftlich?: InnergemeinschaftlicheErwerbe;
	vorsteuer?: Vorsteuer;
}

/** Top-level body for an `<ERKLAERUNGS_UEBERMITTLUNG>` payload. */
export interface U30Body {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
