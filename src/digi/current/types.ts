/**
 * DIGI — Digitalsteuer (Austrian digital services tax).
 * Source: schemas/digi/current/BMF_XSD_Schema_Digitalsteuer.xsd
 *
 * Filed by online-advertising businesses with Austrian-served impressions.
 * 1..300 Erklärungen per packet.
 */

export type Anbringen = "DIGI";

/** ARTLEIST — type of digital advertising service. */
export type ArtLeistung =
	/** Bannerwerbung */
	| "BA"
	/** Suchmaschinenwerbung */
	| "SU"
	/** Sonstige */
	| "SO";

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
	artLeistung: ArtLeistung;
	/** ORT_LTG — Ort der Leistung (place of service, max 50 chars). */
	ortLtg: string;
	/** WJ_BEG — Wirtschaftsjahr-Beginn in YYYYMM format. */
	wjBeg: string;
	/** WJ_ENDE — Wirtschaftsjahr-Ende in YYYYMM format. */
	wjEnde: string;
	/** UMS_212a — Umsatz nach §212a (signed). */
	ums212a: number;
	/** ENTGELT — Entgelt (revenue, signed). */
	entgelt: number;
	/** AUSG — Ausgaben (expenses, signed, optional). */
	ausg?: number;
	/** BEM_GES — Bemessungsgrundlage gesamt (final assessment basis, signed). */
	bemGes: number;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein?: AllgemeineDaten;
	bemessungsgrundlage?: Bemessungsgrundlage;
}

export interface DigiBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
