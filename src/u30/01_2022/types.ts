/**
 * U30 — Umsatzsteuervoranmeldung (UVA), schema effective from 2022-01-01 until 2026-06-30.
 * Source: schemas/u30/01_2022/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_01_2022.xsd
 *
 * Identical to the 07_2026 schema except KZ124 and KZ125 do not yet exist.
 */

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
}

export interface AllgemeineDaten {
	anbringen: "U30";
	zrvon: string;
	zrbis: string;
	fastnr: string;
	kundeninfo?: string;
}

export interface Steuerfrei {
	kz011?: number;
	kz012?: number;
	kz015?: number;
	kz017?: number;
	kz018?: number;
	kz019?: number;
	kz016?: number;
	vst?: string;
	kz020?: number;
}

export interface Versteuert {
	kz022?: number;
	kz029?: number;
	kz006?: number;
	kz037?: number;
	kz052?: number;
	kz007?: number;
	kz056?: number;
	kz057?: number;
	kz048?: number;
	kz044?: number;
	kz032?: number;
}

export interface LieferungenLeistungenEigenverbrauch {
	kz000: number;
	kz001?: number;
	kz021?: number;
	steuerfrei?: Steuerfrei;
	versteuert?: Versteuert;
}

export interface VersteuertIge {
	kz072?: number;
	kz073?: number;
	kz008?: number;
	kz088?: number;
	kz076?: number;
	kz077?: number;
}

export interface InnergemeinschaftlicheErwerbe {
	kz070?: number;
	kz071?: number;
	versteuertIge?: VersteuertIge;
}

export interface Vorsteuer {
	kz060?: number;
	kz061?: number;
	kz083?: number;
	kz065?: number;
	kz066?: number;
	kz082?: number;
	kz087?: number;
	kz089?: number;
	kz064?: number;
	kz062?: number;
	kz063?: number;
	kz067?: number;
	kz090?: number;
	are?: "J";
	repo?: "J";
}

export interface Erklaerung {
	art: string;
	satznr: number;
	allgemein: AllgemeineDaten;
	lieferungen: LieferungenLeistungenEigenverbrauch;
	innergemeinschaftlich?: InnergemeinschaftlicheErwerbe;
	vorsteuer?: Vorsteuer;
}

export interface U30Body {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
