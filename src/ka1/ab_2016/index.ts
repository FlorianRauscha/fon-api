export { build, type BuildOptions } from "./builder.js";
export { ka1Body, type KA1BodyParsed } from "./schema.js";
export type {
	AllgemeineDaten,
	Anbringen,
	BmgM,
	BmgT,
	BmgVe,
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

export const VALID_FROM = "2016-01-01" as const;
export const VALID_UNTIL = "2021-12-31" as const;
export const SCHEMA_VERSION = "ab_2016" as const;
