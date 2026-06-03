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

export const VALID_FROM = "2022-01-01" as const;
export const VALID_UNTIL = "2026-06-30" as const;
export const SCHEMA_VERSION = "01_2022" as const;
