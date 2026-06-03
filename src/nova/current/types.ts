/**
 * NoVA — Normverbrauchsabgabe (Austrian vehicle import tax), fileupload art="NOVA".
 * Source: schemas/nova/current/BMF_XSD_Schema_Normverbrauchsabgabe.xsd
 *
 * One ANBRINGEN value (NOVA1). Per ERKLAERUNG: optional ANMELDUNG aggregate +
 * 1..1200 VERGUETUNG entries (one per vehicle being reimbursed).
 *
 * KZ values are signed decimals (-9_999_999_999.99 .. 9_999_999_999.99) — the
 * BERICHTIG field is meant to carry corrections that may be negative.
 */

export type Anbringen = "NOVA1";

/** UST_INFO — integer code 30..33 indicating the Umsatzsteuer-Info source. */
export type UstInfoCode = 30 | 31 | 32 | 33;

/** VERG_GRUND — Vergütungsgrund integer code 40..59. */
export type VergGrund =
	| 40
	| 41
	| 42
	| 43
	| 44
	| 45
	| 46
	| 47
	| 48
	| 49
	| 50
	| 51
	| 52
	| 53
	| 54
	| 55
	| 56
	| 57
	| 58
	| 59;

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
	/** ZR — Voranmeldungszeitraum (YYYY-MM). */
	zr: string;
	fastnr: string;
	kundeninfo?: string;
}

/** ANMELDUNG — aggregate Bemessungsgrundlagen + Steuern for the reporting period. */
export interface Anmeldung {
	/** LIEF_BMG — Lieferung (Inland). */
	liefBmg?: number;
	liefSteuer?: number;
	/** IGE_BMG — innergemeinschaftlicher Erwerb. */
	igeBmg?: number;
	igeSteuer?: number;
	/** SONSTVG_BMG — sonstige Vorgänge (Eigenverbrauch etc.). */
	sonstvgBmg?: number;
	sonstvgSteuer?: number;
	/** BERICHTIG — period-correction amount (signed). */
	berichtig?: number;
}

/**
 * VERGUETUNG — per-vehicle reimbursement entry (claim for refund of NoVA paid).
 * 1..1200 per ERKLAERUNG.
 */
export interface Verguetung {
	/** FIN — Fahrzeug-Identifikationsnummer (VIN), 1..20 alphanumeric chars. */
	fin?: string;
	/** VERG_BMG — Bemessungsgrundlage of this vehicle. */
	vergBmg?: number;
	/**
	 * NOVA_SATZ — applicable NoVA rate, integer-percent string ("00".."N") or "16.67"
	 * for the special reduced rate. The exact valid set comes from the XSD enum.
	 */
	novaSatz?: string;
	/** VERG_STEUER — NoVA amount for this vehicle. */
	vergSteuer?: number;
	/** VERG_GRUND — Vergütungsgrund code (40..59). */
	vergGrund?: VergGrund;
	/** SONST_BEGRUEND — free-text justification (max 500 chars). */
	sonstBegruend?: string;
	/** UST_BMG — Umsatzsteuer-Bemessungsgrundlage. */
	ustBmg?: number;
	/** UST_INFO — USt-Info code 30..33. */
	ustInfo?: UstInfoCode;
}

export interface Erklaerung {
	/** Required `art="..."` attribute on `<ERKLAERUNG>` — fixed to "NOVA". */
	art: "NOVA";
	satznr: number;
	allgemein?: AllgemeineDaten;
	anmeldung?: Anmeldung;
	verguetungen?: ReadonlyArray<Verguetung>;
}

export interface NovaBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
