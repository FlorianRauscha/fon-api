/**
 * SOER — Sonstige Erklärungen (catch-all envelope for less-common BMF filings).
 * Source: schemas/soer/current/SonstigeErklaerungen.xsd (Stand 30.01.2020).
 *
 * SOER is a namespaced wrapper protocol — root element
 * `SonstigeErklaerungenUebermittlung` lives in the target namespace
 * `https://finanzonline.bmf.gv.at/fon/ws/uebermittlungSonstigeErklaerungen` and
 * carries 1..10 000 inner `SOER` blocks. Each block has an `art` attribute
 * naming the actual form (E108c / KR1 / ENAV1 / KOH1 / WA1 / ELA1 / EGA1) and
 * an `Anhang` element with the base64-encoded payload.
 *
 * Conventions diverge from the older BMF XSDs typed elsewhere in this package:
 * camelCase element names (`Datvon`, `Anhang`, `MessageRefId`) instead of the
 * UPPER_CASE shouted form. The package keeps the upstream casing on the wire
 * but normalises field names to camelCase on the typed side for ergonomics.
 */

export const SOER_NAMESPACE =
	"https://finanzonline.bmf.gv.at/fon/ws/uebermittlungSonstigeErklaerungen";

/** Inner-form discriminator — fixed enumeration of forms accepted via SOER. */
export type SoerArt =
	/** Antrag auf Familienbeihilfe / Energiekostenzuschuss-related (E 108 c). */
	| "E108c"
	/** Klimabonus (Abrechnungs-Reklamation 1). */
	| "KR1"
	/** Energieabgabenvergütung (ENergieABgaben Vergütung). */
	| "ENAV1"
	/** Kohleabgabe-Vergütung. */
	| "KOH1"
	/** Wirtschaftsanträge (catch-all). */
	| "WA1"
	/** Elektrizitätsabgabe-Vergütung. */
	| "ELA1"
	/** Erdgasabgabe-Vergütung. */
	| "EGA1";

export interface InfoDaten {
	/** Fastnr_Fon_Tn — FASTNR of the FinanzOnline-Teilnehmer (uploader). */
	fastnrFonTn: string;
}

export interface MessageSpec {
	/** MessageRefId — uploader-assigned message identifier (1..36 chars, [0-9a-zA-Z-]). */
	messageRefId: string;
	/** Timestamp — xsd:dateTime (ISO-8601 with timezone, e.g. "2026-04-15T10:00:00Z"). */
	timestamp: string;
}

export interface SoerEntry {
	art: SoerArt;
	/** RefNr — uploader's reference number, 1..23 chars [0-9a-zA-Z-/\\]. */
	refNr: string;
	/** Fastnr_Org — 9-digit FASTNR of the affected organisation. */
	fastnrOrg: string;
	/** Datvon — period start as YYYY or YYYYMM (4 or 6 digits). */
	datvon: string;
	/** Datbis — optional period end as YYYY or YYYYMM. */
	datbis?: string;
	/** Anhang — base64-encoded form payload. */
	anhang: string;
}

export interface SoerBody {
	info?: InfoDaten;
	messageSpec: MessageSpec;
	soer: ReadonlyArray<SoerEntry>;
}
