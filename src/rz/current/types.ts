/**
 * RZ — Rückzahlung (tax refund payout request).
 * Source: schemas/rz/current/BMF_XSD_Schema_Rueckzahlung.xsd
 *
 * ART_RZ discriminates Inland ('I') from Ausland ('A') refunds.
 * Each ERKLAERUNG has 1..3 EMPFAENGER recipient blocks; each can specify
 * either UNBAR (cashless: bank-account details) or BAR (pickup at an address).
 */

export type Anbringen = "RZ";

/** ART_RZ — refund destination: 'I' = Inland, 'A' = Ausland. */
export type ArtRz = "I" | "A";

/** Cashless bank-transfer details. */
export interface Unbar {
	/** BLZ — bank routing code (max 30). */
	blz?: string;
	/** GIRO — Girokonto number (max 20). */
	giro?: string;
	/** IBAN — international bank account number (max 35). */
	iban?: string;
	/** BIC — bank identifier code (max 11). */
	bic?: string;
	/** BANK — bank name (max 70). */
	bank?: string;
}

/** Cash-pickup destination address. */
export interface Bar {
	/** ORT — town/city (max 35). */
	ort?: string;
	/** PLZE — postcode (max 10). */
	plze: string;
	/** ADRE — address (max 35). */
	adre: string;
}

export interface Empfaenger {
	/** NAMEE — recipient name (max 37). */
	namee: string;
	/** BETRAG — refund amount (positive, ≥ 0.01). */
	betrag: number;
	/** LKZ — Länderkennzeichen (2-3 letter BMF country code). Optional, mainly for ART_RZ='A'. */
	lkz?: string;
	unbar?: Unbar;
	bar?: Bar;
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
	artRz: ArtRz;
	fastnr: string;
	kundeninfo?: string;
}

export interface Erklaerung {
	art: Anbringen;
	allgemein: AllgemeineDaten;
	/** 1..3 recipient blocks per Erklärung. */
	empfaenger: ReadonlyArray<Empfaenger>;
}

export interface RzBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
