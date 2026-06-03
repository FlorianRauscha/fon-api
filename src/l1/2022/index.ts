export { build, type BuildOptions } from "./builder.js";
export { l1Body, type L1BodyParsed } from "./schema.js";
export type {
	AbAllgemeinSection,
	AbBehinderungSection,
	AllgemeineDaten,
	AussergewoehnlicheBelastungenSection,
	BesondereSonderausgabenVerteilungSection,
	Erklaerung,
	FreibetragsbescheidSection,
	InfoDaten,
	L1Body,
	RawInnerSection,
	SonderausgabenSection,
	TypedAbAllgemein,
	TypedAbBehinderung,
	TypedAbBehindPartner,
	TypedAbBehindSelf,
	TypedAussergewoehnlicheBelastungen,
	TypedBesondereSonderausgabenVerteilung,
	TypedFreibetragsbescheid,
	TypedInternational,
	TypedKindAngaben,
	TypedKindAusbildungBehinderung,
	TypedSonderausgaben,
	TypedWerbungskosten,
	FbMonate,
	FbMonth,
	InternationalSection,
	KindAusbildungBehinderungSection,
	WerbungskostenJob,
	WerbungskostenSection,
	WkBerufCode,
} from "./types.js";
export { WK_BERUF_CODES } from "./types.js";

export const TAX_YEAR = 2022 as const;
export const SCHEMA_VERSION = "2022" as const;
