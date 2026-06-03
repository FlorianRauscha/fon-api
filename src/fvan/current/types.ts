/**
 * FVAN — Fristverlängerung Abgabenerklärung (filing-deadline extension request).
 * Source: schemas/fvan/current/BMF_XSD_Schema_Fristverlaengerung.xsd
 *
 * Submit via fileupload with `art="FVAN"`. Per ERKLAERUNG: target tax year,
 * requested new deadline, and a free-text justification (up to 2000 chars).
 */

export type Anbringen = "FVAN";

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
}

export interface Erklaerung {
	/** Required `art="FVAN"` attribute. */
	art: Anbringen;
	satznr: number;
	anbringen: Anbringen;
	fastnr: string;
	kundeninfo?: string;
	/** ERKL_ZR — tax year for which the deadline extension is requested (YYYY). */
	erklZr: string;
	/** DATFRIST — requested new filing deadline (YYYY-MM-DD). */
	datfrist: string;
	/** BEGRUEND — justification text (1..2000 chars). */
	begruend: string;
}

export interface FvanBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
