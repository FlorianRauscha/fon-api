/**
 * KOM — Kommunalsteuererklärung (municipal tax declaration), fileupload art="KOM".
 * Source: schemas/kom/current/BMF_XSD_Schema_KommSt1_KommSt2.xsd
 *
 * Two ANBRINGEN sub-types:
 *   - KOMMST1 — annual Kommunalsteuererklärung
 *   - KOMMST2 — Korrektur (correction of a previously filed declaration)
 *
 * Per ERKLAERUNG: optional GESAMTE_BEMESSUNGSGRUNDLAGE summary + 1..N GEMEINDE
 * entries (one per municipality the company paid Lohnabgaben in).
 */

export type Anbringen = "KOMMST1" | "KOMMST2";

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
	/** JAHR — tax year (YYYY). Either jahr or zr (yearMonth) is supplied; zr is rare. */
	jahr?: string;
	/** ZR — reporting period (YYYY-MM). */
	zr?: string;
	fastnr: string;
	kundeninfo?: string;
}

export interface Gemeinde {
	/** GD — 5-digit Gemeindekennzahl. */
	gd: string;
	/** PLZ — 4-digit Austrian postcode. */
	plz: string;
	/** GEM — Gemeindename (1..40 chars). */
	gem: string;
	/** BMG — Bemessungsgrundlage for this municipality. */
	bmg?: number;
	/** STEUER — Kommunalsteuer for this municipality. */
	steuer?: number;
	/** RUECK — Rückforderung flag ("J"). */
	rueck?: "J";
}

export interface GesamteBemessungsgrundlage {
	gesamtBmg: number;
	gesamtSteuer: number;
}

export interface Erklaerung {
	art: Anbringen;
	satznr: number;
	allgemein: AllgemeineDaten;
	gesamteBemessungsgrundlage?: GesamteBemessungsgrundlage;
	/** GEMEINDE — at least one municipality entry required. */
	gemeinden: ReadonlyArray<Gemeinde>;
}

export interface KOMBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
