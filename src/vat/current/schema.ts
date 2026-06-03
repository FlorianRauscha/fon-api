import { z } from "zod";

const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 30_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");
const yyyymm = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

const wahlSchema = z.enum(["J", "N"]);

const euLandSchema = z.enum([
	"AT",
	"BE",
	"BG",
	"CY",
	"CZ",
	"DK",
	"EE",
	"FI",
	"FR",
	"DE",
	"EL",
	"HU",
	"IE",
	"IT",
	"LV",
	"LT",
	"LU",
	"MT",
	"NL",
	"PL",
	"PT",
	"RO",
	"SK",
	"SI",
	"ES",
	"SE",
	"GB",
	"HR",
	"MC",
	"XI",
	"XJ",
	"IC",
	"XC",
	"XL",
]);

const landSchema = z.enum([
	"AF",
	"AL",
	"DZ",
	"AS",
	"AD",
	"AO",
	"AI",
	"AQ",
	"AG",
	"AR",
	"AM",
	"AW",
	"AU",
	"AZ",
	"BS",
	"BH",
	"BD",
	"BB",
	"BY",
	"BZ",
	"BJ",
	"BM",
	"BT",
	"BO",
	"BA",
	"BW",
	"BV",
	"BR",
	"IO",
	"BN",
	"BF",
	"BI",
	"KH",
	"CM",
	"CA",
	"CV",
	"KY",
	"CF",
	"TD",
	"CL",
	"CN",
	"CX",
	"CC",
	"CO",
	"KM",
	"CG",
	"CD",
	"CK",
	"CR",
	"CI",
	"HR",
	"CU",
	"DJ",
	"DM",
	"DO",
	"EC",
	"EG",
	"SV",
	"GQ",
	"ER",
	"ET",
	"FK",
	"FO",
	"FJ",
	"GF",
	"PF",
	"TF",
	"GA",
	"GM",
	"GE",
	"GH",
	"GI",
	"GL",
	"GD",
	"GP",
	"GU",
	"GT",
	"GN",
	"GW",
	"GY",
	"HT",
	"HM",
	"VA",
	"HN",
	"HK",
	"IS",
	"IN",
	"ID",
	"IR",
	"IQ",
	"IL",
	"JM",
	"JP",
	"JO",
	"KZ",
	"KE",
	"KI",
	"KP",
	"KR",
	"KW",
	"KG",
	"LA",
	"LB",
	"LS",
	"LR",
	"LY",
	"LI",
	"MO",
	"MK",
	"MG",
	"MW",
	"MY",
	"MV",
	"ML",
	"MH",
	"MQ",
	"MR",
	"MU",
	"YT",
	"MX",
	"FM",
	"MD",
	"MC",
	"MN",
	"MS",
	"MA",
	"MZ",
	"MM",
	"NA",
	"NR",
	"NP",
	"AN",
	"NC",
	"NZ",
	"NI",
	"NE",
	"NG",
	"NU",
	"NF",
	"MP",
	"NO",
	"OM",
	"PK",
	"PW",
	"PS",
	"PA",
	"PG",
	"PY",
	"PE",
	"PH",
	"PN",
	"PR",
	"QA",
	"RE",
	"RU",
	"RW",
	"SH",
	"KN",
	"LC",
	"PM",
	"VC",
	"WS",
	"SM",
	"ST",
	"SA",
	"SN",
	"CS",
	"SC",
	"SL",
	"SG",
	"SB",
	"SO",
	"ZA",
	"GS",
	"LK",
	"SD",
	"SR",
	"SJ",
	"SZ",
	"CH",
	"SY",
	"TW",
	"TJ",
	"TZ",
	"TH",
	"TL",
	"TG",
	"TK",
	"TO",
	"TT",
	"TN",
	"TR",
	"TM",
	"TC",
	"TV",
	"UG",
	"UA",
	"AE",
	"US",
	"UM",
	"UY",
	"UZ",
	"VU",
	"VE",
	"VN",
	"VG",
	"VI",
	"WF",
	"EH",
	"YE",
	"ZM",
	"ZW",
	"AX",
	"BL",
	"GG",
	"IM",
	"JE",
	"MF",
	"IC",
	"XI",
	"XJ",
	"CW",
	"NM",
	"BQ",
	"XC",
	"XL",
]);

const waehrungSchema = z.enum([
	"BGN",
	"CZK",
	"DKK",
	"EEK",
	"EUR",
	"GBP",
	"HUF",
	"LTL",
	"LVL",
	"PLN",
	"RON",
	"SEK",
	"HRK",
]);

const spracheSchema = z.enum([
	"bg",
	"cs",
	"da",
	"de",
	"el",
	"en",
	"es",
	"et",
	"fi",
	"fr",
	"ga",
	"hu",
	"it",
	"lt",
	"lv",
	"mt",
	"nl",
	"pl",
	"pt",
	"ro",
	"sk",
	"sl",
	"sv",
	"tr",
	"hr",
]);

const goodsCodeSchema = z
	.number()
	.int()
	.refine((n) => n >= 1 && n <= 10, "Expected 1..10");

/** SUBCODE — one or two ".dd" segments after a 1-2 digit head. */
const subcodeSchema = z
	.string()
	.regex(/^[0-9]{1,2}\.[0-9]{1,2}(\.[0-9]{1,2})?$/, "Expected D.DD or D.DD.DD");

/** zahl_16 — decimal -9999999999999.99..9999999999999.99. */
const zahl16 = z.number().min(-9_999_999_999_999.99).max(9_999_999_999_999.99);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnr,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlErklaerungen: z.number().int().min(1).max(300),
});

const allgemeineDatenSchema = z
	.object({
		anbringen: z.literal("VAT"),
		antragnr: z
			.string()
			.regex(/^AT[A-Z0-9]{14}$/, "Expected AT + 14 alphanumerics (16 chars)")
			.optional(),
		zrvon: yyyymm,
		zrbis: yyyymm,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
		euLand: euLandSchema,
		sprache: spracheSchema.optional(),
	})
	.strict();

const gegenstandSchema = z
	.object({
		code: goodsCodeSchema,
		subcode: subcodeSchema.optional(),
		beschreibung: z.string().min(1).max(100).optional(),
	})
	.strict();

const grundlagenSchema = z
	.object({
		waehrung: waehrungSchema,
		bmg: zahl16,
		vst: zahl16,
		abvst: zahl16,
	})
	.strict();

const kaufSchema = z
	.object({
		seqnr: z.number().int().min(1).max(999_999),
		beznr: z
			.string()
			.min(1)
			.max(24)
			.regex(/^\p{ASCII}+[0-9]$/u, "Must be >=2 ASCII chars ending with a digit"),
		datum,
		kleinbetr: wahlSchema,
		uid: z
			.string()
			.regex(
				/^(BE|BG|CY|CZ|DE|DK|EE|EL|ES|FI|FR|GB|HR|HU|IC|IE|IT|LT|LU|LV|MC|MT|NL|PL|PT|RO|SE|SI|SK|XC|XI|XJ|XL)[A-Z0-9]{1,12}$/,
				"Expected EU member-state UID prefix + up to 12 alnum",
			)
			.optional(),
		stnr: z.string().min(1).max(20).optional(),
		name: z.string().min(1).max(50),
		adr: z.string().min(1).max(50),
		plz: z.string().min(1).max(10),
		stadt: z.string().min(1).max(40),
		land: euLandSchema,
		gegenstaende: z.array(gegenstandSchema).min(1).max(5),
		grundlagen: grundlagenSchema,
	})
	.strict();

const importSchema = z
	.object({
		seqnr: z.number().int().min(1).max(999_999),
		rechnr: z
			.string()
			.min(1)
			.max(18)
			.regex(/^\p{ASCII}+[0-9]$/u, "Must be >=2 ASCII chars ending with a digit")
			.optional(),
		importnr: z.string().min(1).max(24).optional(),
		datum,
		name: z.string().min(1).max(50),
		adr: z.string().min(1).max(50),
		plz: z.string().min(1).max(10),
		stadt: z.string().min(1).max(40),
		land: landSchema,
		gegenstaende: z.array(gegenstandSchema).min(1).max(5),
		grundlagen: grundlagenSchema,
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("VAT"),
		satznr: z.number().int().min(1).max(999_999_999),
		allgemein: allgemeineDatenSchema,
		kaeufe: z.array(kaufSchema).max(1000).optional(),
		importe: z.array(importSchema).max(1000).optional(),
	})
	.strict();

export const vatBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(300),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type VatBodyParsed = z.infer<typeof vatBody>;
