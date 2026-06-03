/**
 * DUE — Depotübertragung (securities depot transfer notification per §§273T,
 * 274T, 275T and 274A KEStG).
 * Source: schemas/due/current/BMF_XSD_Schema_Depotuebertragung.xsd (Stand 25.02.2025).
 *
 * Filed by depositary banks ("depotführende Stelle") when securities move
 * between depots; up to 99 999 Erklärungen per packet, each Erklärung carrying
 * up to 50 depot holders, 1 000 affected securities, and 50 transfer targets.
 */

export type Anbringen = "DUE";

/** GESETZ — legal basis for the transfer. */
export type Gesetz =
	/** §27 Abs 6 Z 1 lit a EStG (in-kind contribution). */
	| "273T"
	/** §27 Abs 6 Z 1 lit b EStG (intra-EU transfer). */
	| "274T"
	/** §27 Abs 6 Z 1 lit c EStG (third-country transfer). */
	| "275T"
	/** §27 Abs 6 Z 1 lit b EStG — § 124 BAO automatic notification. */
	| "274A";

/** KENN_MEN — quantity unit: S (Stück) or N (Nominale). */
export type KennMen = "S" | "N";

/** KENN_AK — Anschaffungskosten classification: T (tatsächlich), A (Annahme), K (Kurswert). */
export type KennAk = "T" | "A" | "K";

/**
 * LAND — BMF "Kfz-Kennzeichen"-style country code (216 entries).
 * Single-letter codes (A=Austria, D=Germany, F=France, etc.) and 3-letter
 * variants (USA, AUS, AFG, ...) coexist; this mirrors the upstream enumeration.
 */
export type Land =
	| "ET"
	| "GQ"
	| "ETH"
	| "AFG"
	| "AL"
	| "GBA"
	| "DZ"
	| "ASM"
	| "VI"
	| "AND"
	| "ANG"
	| "AIA"
	| "ANT"
	| "RA"
	| "ARM"
	| "ABW"
	| "AZ"
	| "AUS"
	| "BS"
	| "BRN"
	| "BD"
	| "BDS"
	| "BY"
	| "B"
	| "BH"
	| "DY"
	| "BMU"
	| "BTN"
	| "BOL"
	| "BIH"
	| "RB"
	| "BR"
	| "BUI"
	| "BRU"
	| "BG"
	| "BF"
	| "RU"
	| "RCH"
	| "RC"
	| "VCR"
	| "COK"
	| "CR"
	| "CI"
	| "D"
	| "WD"
	| "DOM"
	| "DJI"
	| "DK"
	| "EC"
	| "ES"
	| "ER"
	| "EST"
	| "FLK"
	| "FJI"
	| "FIN"
	| "F"
	| "GF"
	| "PF"
	| "FO"
	| "GAB"
	| "WAG"
	| "GE"
	| "GH"
	| "GBZ"
	| "WG"
	| "GR"
	| "GLP"
	| "GUM"
	| "GCA"
	| "GBG"
	| "RG"
	| "GNB"
	| "GUY"
	| "RH"
	| "HD"
	| "HK"
	| "IND"
	| "RI"
	| "GBM"
	| "IRQ"
	| "IR"
	| "IRL"
	| "IS"
	| "IL"
	| "I"
	| "JA"
	| "J"
	| "ADN"
	| "GBJ"
	| "KJH"
	| "SCG"
	| "K"
	| "CAM"
	| "CDN"
	| "CV"
	| "KZ"
	| "QA"
	| "EAK"
	| "KS"
	| "KIR"
	| "CO"
	| "COM"
	| "RCB"
	| "ZRE"
	| "PRK"
	| "ROK"
	| "HR"
	| "CU"
	| "KWT"
	| "LAO"
	| "LS"
	| "LV"
	| "RL"
	| "LB"
	| "LAR"
	| "FL"
	| "LT"
	| "L"
	| "MAC"
	| "RM"
	| "MW"
	| "MAL"
	| "MV"
	| "RMM"
	| "M"
	| "MA"
	| "MTQ"
	| "RIM"
	| "MS"
	| "MK"
	| "MEX"
	| "FSM"
	| "MD"
	| "MC"
	| "MNL"
	| "MOC"
	| "BUR"
	| "NAM"
	| "NAU"
	| "NEP"
	| "NGN"
	| "NCL"
	| "NZ"
	| "NIC"
	| "NL"
	| "NA"
	| "RN"
	| "WAN"
	| "N"
	| "OM"
	| "PK"
	| "PA"
	| "PNG"
	| "PY"
	| "PE"
	| "RP"
	| "PL"
	| "P"
	| "PRI"
	| "RWA"
	| "RO"
	| "RUS"
	| "A"
	| "SLB"
	| "Z"
	| "WS"
	| "RSM"
	| "WL"
	| "STP"
	| "SA"
	| "S"
	| "CH"
	| "SN"
	| "SY"
	| "WAL"
	| "ZW"
	| "SGP"
	| "SK"
	| "SLO"
	| "SO"
	| "SU"
	| "E"
	| "CL"
	| "WV"
	| "KN"
	| "SUD"
	| "SME"
	| "SD"
	| "SYR"
	| "ZA"
	| "TJ"
	| "EAT"
	| "T"
	| "TG"
	| "TO"
	| "TT"
	| "TD"
	| "CZ"
	| "TN"
	| "TM"
	| "TUV"
	| "TR"
	| "EAU"
	| "UA"
	| "H"
	| "ROU"
	| "UZ"
	| "VU"
	| "V"
	| "YV"
	| "UAE"
	| "USA"
	| "GB"
	| "VN"
	| "RCA"
	| "CY";

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
	/** FASTNR_MITTEILER — the depositary bank's own FASTNR. */
	fastnrMitteiler: string;
	/** NAME_MITTEILER — the depositary bank's name (1..50). */
	nameMitteiler: string;
}

/** Address block shared by DEPOTINHABER and UEBERTRAGUNG_AUF (with _D / _A suffixes). */
export interface Adresse {
	str: string;
	nr: string;
	stg?: string;
	tuer?: string;
	plz: string;
	ort: string;
	land: Land;
}

/**
 * DEPOTINHABER — discriminated union over the four upstream choice variants.
 *  - kind:'vnr'    → just the 10-digit Versicherungsnummer (VNR_D)
 *  - kind:'fastnr' → just the 9-digit BMF FASTNR (FASTNR_D)
 *  - kind:'person' → natural person with full address
 *  - kind:'firma'  → company with full address
 */
export type Depotinhaber =
	| { kind: "vnr"; vnr: string }
	| { kind: "fastnr"; fastnr: string }
	| ({ kind: "person"; nname: string; vname: string; geb: string } & Adresse)
	| ({ kind: "firma"; firmname: string } & Adresse);

/**
 * UEBERTRAGUNG_AUF — transfer target. Only person / firma variants here (no
 * VNR / FASTNR shortcut, since the receiving party is identified by its own
 * jurisdiction's address).
 */
export type UebertragungAuf =
	| ({ kind: "person"; nname: string; vname: string; geb: string } & Adresse)
	| ({ kind: "firma"; firmname: string } & Adresse);

/** A single security line (BETROFFENE_WERTPAPIERE). */
export interface BetroffeneWertpapier {
	/** BEZ_WG — security description (1..50). */
	bezWg: string;
	/** ISIN (1..12 alphanumerics). */
	isin: string;
	/** MEN — quantity (1..9 999 999 999 positive integer). */
	men: number;
	kennMen: KennMen;
	/** AK — Anschaffungskosten (0..9 999 999 999 999.99). */
	ak: number;
	kennAk: KennAk;
}

export interface DepotfuehrendeStelle {
	/** DEP_STELLE — depot name (1..50). */
	depStelle: string;
	/** BIC — 8 or 11 characters per ISO 9362. */
	bic: string;
}

/** ALLGEMEINE_DATEN — discriminated union over the upstream choice. */
export type AllgemeineDaten = {
	anbringen: Anbringen;
	kundeninfo?: string;
	/** REFNR — uploader's reference number, 1..25 chars. */
	refnr: string;
} & (
	| {
			kind: "transfer";
			gesetz: Gesetz;
			gemeinschaftsdepotD?: "J";
			gemeinschaftsdepotA?: "J";
			berichtigung?: "J";
			/** ZEITPUNKT/DATUEB — date the transfer takes effect (YYYY-MM-DD). */
			datueb: string;
			depotfuehrendeStelle: DepotfuehrendeStelle;
	  }
	| { kind: "gesamtrueck" }
);

export interface Erklaerung {
	art: Anbringen;
	allgemein: AllgemeineDaten;
	depotinhaber?: ReadonlyArray<Depotinhaber>;
	betroffeneWertpapiere?: ReadonlyArray<BetroffeneWertpapier>;
	uebertragungAuf?: ReadonlyArray<UebertragungAuf>;
}

export interface DueBody {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
