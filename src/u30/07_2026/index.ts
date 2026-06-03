export { build, type BuildOptions } from "./builder.js";
export { u30Body, type U30BodyParsed } from "./schema.js";
export type {
	AllgemeineDaten,
	Erklaerung,
	InfoDaten,
	InnergemeinschaftlicheErwerbe,
	LieferungenLeistungenEigenverbrauch,
	Steuerfrei,
	U30Body,
	Versteuert,
	VersteuertIge,
	Vorsteuer,
} from "./types.js";

/** Validity window declared by BMF for this schema version. */
export const VALID_FROM = "2026-07-01" as const;
export const VALID_UNTIL: string | null = null;
export const SCHEMA_VERSION = "07_2026" as const;
