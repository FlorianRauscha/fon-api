/**
 * STAB — Stabilitätsabgabe (Austrian bank stability fee, §3 ab 2017).
 * Source: schemas/stab/current/BMF_XSD_Schema_Stabilitaetsabgabe_2017.xsd
 *
 * Filed by Austrian credit institutions. Annual filing per FASTNR per ZR.
 */

export type Anbringen = "STAB";

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
	/** ZR — tax year (YYYY). */
	zr: string;
	fastnr: string;
	kundeninfo?: string;
}

export interface Bemessungsgrundlage {
	/** BEM_STA3 — Bemessungsgrundlage §3 Stabilitätsabgabe (signed). */
	bemSta3?: number;
	/** NEUGR — Neugründungsförderungs-Kennzeichen ("J" | "N"). */
	neugr?: "J" | "N";
	/** JAHR_UEB — Jahresübertrag (annual carryover, signed). */
	jahrUeb?: number;
	/** BEL_OG — Belastung Obergrenze (top-cap charge, signed). */
	belOg?: number;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein?: AllgemeineDaten;
	bemessungsgrundlage?: Bemessungsgrundlage;
}

export interface StabBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
