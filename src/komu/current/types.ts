/**
 * KOMU — Kommunalsteuer-Bemessungsgrundlage (municipal payroll-tax basis declaration).
 * Source: schemas/komu/current/BMF_XSD_Schema_Kommunalsteuerbemessungsgrundlage.xsd (Stand 13.12.2002).
 *
 * Filed by Gemeinden (Austrian municipalities) reporting per-employer payroll
 * basis figures to the federal tax authority. Two quirks compared with the
 * "regular" art uploads:
 *
 *  1. **`ART_IDENTIFIKATIONSBEGRIFF` is `"GD"`** (Gemeindedaten), not `"FASTNR"`,
 *     and `IDENTIFIKATIONSBEGRIFF` is a 5-digit Gemeindekennzahl rather than a
 *     9-digit FASTNR.
 *  2. **Inner `<ANBRINGEN>` is `"KOM"`** even though the upload art is `"KOMU"`.
 *     The XSD predates the present-day art convention; this package keeps the
 *     two terms separate (`Anbringen = "KOM"`, `art = "KOMU"`).
 */

export type Anbringen = "KOM";

/** J = Ja, N = Nein. */
export type Wahl = "J" | "N";

export interface InfoDaten {
	artIdentifikationsbegriff: "GD";
	/** IDENTIFIKATIONSBEGRIFF — 5-digit Gemeindekennzahl. */
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
}

export interface Erklaerung {
	/** Upload art on the fileupload service. KOMU is BMF's art code. */
	art: "KOMU";
	satznr: number;
	anbringen: Anbringen;
	/** ZR — tax year (YYYY). */
	zr: string;
	/** FASTNR — employer's 9-digit FASTNR. */
	fastnr: string;
	/** BMG — Bemessungsgrundlage (non-negative kz, max 9 999 999 999 999.99). */
	bmg: number;
	/** MIT — Mitteilung / memo (free-form string). */
	mit?: string;
	/** VB — Verbund-flag (J/N). */
	vb: Wahl;
	/** KM — Kammerumlage-flag (J/N). */
	km: Wahl;
	/** NS — Nachschau-flag (J/N). */
	ns: Wahl;
}

export interface KomuBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
