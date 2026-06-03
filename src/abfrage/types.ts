export const ABFRAGE_ARTEN = [
	"LOHNZETTEL",
	"SONDERAUSGABEN",
	"LEITUNGSRECHTE",
	"OEKOSONDERAUSGABENPAUSCHALE",
	"HOCHWASSER",
	"AUSSERORDENTLICHEGUTSCHRIFT",
	"PAUSCHALEREISEAUFWANDSENTSCHAEDIGUNGEN",
] as const;
export type AbfrageArt = (typeof ABFRAGE_ARTEN)[number];

export interface AbfrageRequest {
	tid: string;
	benid: string;
	id: string;
	/** When omitted, all available content types are returned. */
	art?: AbfrageArt;
	/** Finanzamts- und Steuernummer in the form 999999999 (exactly 9 digits). */
	fastnr: string;
	/** Tax year in the form YYYY. Must lie between currentYear-7 and currentYear; earliest 2016. */
	zeitraum: number | string;
}

/**
 * Parsed response. The raw XML payload is preserved alongside the structured fields
 * so callers can dig deeper without losing fidelity.
 */
export interface AbfrageResult {
	rc: number;
	msg?: string | undefined;
	/** Raw `<result>` payload as XML string (callers can parse with their own pipeline). */
	resultXml?: string | undefined;
	/** Parsed result tree (loose typing — refined per-art parsers will live in parse.ts). */
	result?: unknown;
}
