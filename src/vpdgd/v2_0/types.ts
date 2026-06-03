/**
 * VPDGD — Verrechnungspreisdokumentation / Country-by-Country reporting (CbC v2.0).
 * Source: schemas/vpdgd/v2_0/{Cbc_National_v2.0,CbcXML_v2.0,isocbctypes_v1.1,oecdcbctypes_v5.0,Cbc_Protokoll}.xsd
 *
 * **Scope**: this module types only the BMF-specific national wrapper
 * (`<Cbc_National>` namespace `urn:oecd:ties:nationalcbc:v2`). The inner OECD
 * `CBC_OECD` payload (governed by the much larger OECD/EU CbcXML v2.0 schema
 * — 26 KB main + 106 KB ISO types + 10 KB OECD types) is taken as a
 * pre-validated XML string supplied by the caller's own CbC reporting tooling.
 *
 * Most CbC filers already produce `CBC_OECD` XML using a standard OECD
 * generator and just need the BMF national-wrapper layer; that's what this
 * module provides. If you need typed access to the full OECD payload, treat
 * `cbcOecdInner` as the integration point and parse it with a dedicated CbC
 * library before passing the serialized result here.
 */

export const VPDGD_NATIONAL_NAMESPACE = "urn:oecd:ties:nationalcbc:v2";
export const VPDGD_OECD_NAMESPACE = "urn:oecd:ties:cbc:v2";

export interface InfoDaten {
	/** Fastnr_Fon_Tn — FASTNR of the FinanzOnline-Teilnehmer (uploader). */
	fastnrFonTn: string;
	/** Fastnr_Org — FASTNR of the reporting organisation. */
	fastnrOrg: string;
	/**
	 * Vers — schema version this filing targets, formatted as `NN.NN`
	 * (XSD pattern `[0-9]{2}\.[0-9]{2}`, e.g. `"02.00"` for CbC v2.0).
	 */
	vers: string;
}

export interface VpdgdBody {
	info: InfoDaten;
	/**
	 * Raw `<CBC_OECD ...>...</CBC_OECD>` element (with namespace declaration if
	 * it isn't inherited from the parent `<Cbc_National>` envelope). Caller is
	 * responsible for supplying a payload that validates against the OECD CbC
	 * v2.0 schemas; this builder treats it as opaque.
	 */
	cbcOecdInner: string;
}
