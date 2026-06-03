export { build, type BuildOptions } from "./builder.js";
export { ka1Body, type KA1BodyParsed } from "./schema.js";
export type {
	AllgemeineDaten,
	Anbringen,
	BmgM,
	BmgT,
	BmgVe,
	BmgY,
	BmgZ,
	Erklaerung,
	InfoDaten,
	KA1Body,
	KatBegr,
	RawInnerSection,
	SvaDaten,
	Zeitraum,
	ZrType,
} from "./types.js";

export const VALID_FROM = "2022-01-01" as const;
export const VALID_UNTIL: string | null = null;
export const SCHEMA_VERSION = "ab_2022" as const;
