import { z } from "zod";

const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 30_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

const fastnrIdentifikation = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 10_000_010 && n <= 989_999_999;
	}, "Out of valid IDENTIFIKATIONSBEGRIFF range");

const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");

const an50 = z.string().min(1).max(50);
const an12 = z.string().min(1).max(12);
const an10 = z.string().min(1).max(10);

const vnr = z.string().regex(/^[0-9]{10}$/, "Expected 10 digits");
const bic = z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Expected ISO 9362 BIC");
const plz = z.string().regex(/^[A-Za-z0-9,]{4,10}$/, "Expected 4..10 [A-Za-z0-9,]");
const refnr = z.string().regex(/^[A-Za-z0-9,\- /]{1,25}$/, "Expected 1..25 [A-Za-z0-9,- /]");

/** AK — non-negative decimal up to 9 999 999 999 999.99. */
const ak = z.number().min(0).max(9_999_999_999_999.99);
/** MEN — positive integer up to 9 999 999 999. */
const men = z.number().int().min(1).max(9_999_999_999);

const gesetzSchema = z.enum(["273T", "274T", "275T", "274A"]);
const kennMenSchema = z.enum(["S", "N"]);
const kennAkSchema = z.enum(["T", "A", "K"]);

const landSchema = z.enum([
	"ET",
	"GQ",
	"ETH",
	"AFG",
	"AL",
	"GBA",
	"DZ",
	"ASM",
	"VI",
	"AND",
	"ANG",
	"AIA",
	"ANT",
	"RA",
	"ARM",
	"ABW",
	"AZ",
	"AUS",
	"BS",
	"BRN",
	"BD",
	"BDS",
	"BY",
	"B",
	"BH",
	"DY",
	"BMU",
	"BTN",
	"BOL",
	"BIH",
	"RB",
	"BR",
	"BUI",
	"BRU",
	"BG",
	"BF",
	"RU",
	"RCH",
	"RC",
	"VCR",
	"COK",
	"CR",
	"CI",
	"D",
	"WD",
	"DOM",
	"DJI",
	"DK",
	"EC",
	"ES",
	"ER",
	"EST",
	"FLK",
	"FJI",
	"FIN",
	"F",
	"GF",
	"PF",
	"FO",
	"GAB",
	"WAG",
	"GE",
	"GH",
	"GBZ",
	"WG",
	"GR",
	"GLP",
	"GUM",
	"GCA",
	"GBG",
	"RG",
	"GNB",
	"GUY",
	"RH",
	"HD",
	"HK",
	"IND",
	"RI",
	"GBM",
	"IRQ",
	"IR",
	"IRL",
	"IS",
	"IL",
	"I",
	"JA",
	"J",
	"ADN",
	"GBJ",
	"KJH",
	"SCG",
	"K",
	"CAM",
	"CDN",
	"CV",
	"KZ",
	"QA",
	"EAK",
	"KS",
	"KIR",
	"CO",
	"COM",
	"RCB",
	"ZRE",
	"PRK",
	"ROK",
	"HR",
	"CU",
	"KWT",
	"LAO",
	"LS",
	"LV",
	"RL",
	"LB",
	"LAR",
	"FL",
	"LT",
	"L",
	"MAC",
	"RM",
	"MW",
	"MAL",
	"MV",
	"RMM",
	"M",
	"MA",
	"MTQ",
	"RIM",
	"MS",
	"MK",
	"MEX",
	"FSM",
	"MD",
	"MC",
	"MNL",
	"MOC",
	"BUR",
	"NAM",
	"NAU",
	"NEP",
	"NGN",
	"NCL",
	"NZ",
	"NIC",
	"NL",
	"NA",
	"RN",
	"WAN",
	"N",
	"OM",
	"PK",
	"PA",
	"PNG",
	"PY",
	"PE",
	"RP",
	"PL",
	"P",
	"PRI",
	"RWA",
	"RO",
	"RUS",
	"A",
	"SLB",
	"Z",
	"WS",
	"RSM",
	"WL",
	"STP",
	"SA",
	"S",
	"CH",
	"SN",
	"SY",
	"WAL",
	"ZW",
	"SGP",
	"SK",
	"SLO",
	"SO",
	"SU",
	"E",
	"CL",
	"WV",
	"KN",
	"SUD",
	"SME",
	"SD",
	"SYR",
	"ZA",
	"TJ",
	"EAT",
	"T",
	"TG",
	"TO",
	"TT",
	"TD",
	"CZ",
	"TN",
	"TM",
	"TUV",
	"TR",
	"EAU",
	"UA",
	"H",
	"ROU",
	"UZ",
	"VU",
	"V",
	"YV",
	"UAE",
	"USA",
	"GB",
	"VN",
	"RCA",
	"CY",
]);

const adresseSchema = {
	str: an50,
	nr: an10,
	stg: an10.optional(),
	tuer: an10.optional(),
	plz,
	ort: an50,
	land: landSchema,
};

const depotinhaberSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("vnr"), vnr }).strict(),
	z.object({ kind: z.literal("fastnr"), fastnr }).strict(),
	z
		.object({
			kind: z.literal("person"),
			nname: an50,
			vname: an50,
			geb: datum,
			...adresseSchema,
		})
		.strict(),
	z
		.object({
			kind: z.literal("firma"),
			firmname: an50,
			...adresseSchema,
		})
		.strict(),
]);

const uebertragungAufSchema = z.discriminatedUnion("kind", [
	z
		.object({
			kind: z.literal("person"),
			nname: an50,
			vname: an50,
			geb: datum,
			...adresseSchema,
		})
		.strict(),
	z
		.object({
			kind: z.literal("firma"),
			firmname: an50,
			...adresseSchema,
		})
		.strict(),
]);

const betroffeneWertpapierSchema = z
	.object({
		bezWg: an50,
		isin: an12,
		men,
		kennMen: kennMenSchema,
		ak,
		kennAk: kennAkSchema,
	})
	.strict();

const depotfuehrendeStelleSchema = z
	.object({
		depStelle: an50,
		bic,
	})
	.strict();

const allgemeineDatenSchema = z.discriminatedUnion("kind", [
	z
		.object({
			kind: z.literal("transfer"),
			anbringen: z.literal("DUE"),
			kundeninfo: z.string().max(50).optional(),
			refnr,
			gesetz: gesetzSchema,
			gemeinschaftsdepotD: z.literal("J").optional(),
			gemeinschaftsdepotA: z.literal("J").optional(),
			berichtigung: z.literal("J").optional(),
			datueb: datum,
			depotfuehrendeStelle: depotfuehrendeStelleSchema,
		})
		.strict(),
	z
		.object({
			kind: z.literal("gesamtrueck"),
			anbringen: z.literal("DUE"),
			kundeninfo: z.string().max(50).optional(),
			refnr,
		})
		.strict(),
]);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnrIdentifikation,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlErklaerungen: z.number().int().min(1).max(99_999),
	fastnrMitteiler: fastnr,
	nameMitteiler: z.string().min(1).max(50),
});

const erklaerungSchema = z
	.object({
		art: z.literal("DUE"),
		allgemein: allgemeineDatenSchema,
		depotinhaber: z.array(depotinhaberSchema).max(50).optional(),
		betroffeneWertpapiere: z.array(betroffeneWertpapierSchema).max(1000).optional(),
		uebertragungAuf: z.array(uebertragungAufSchema).max(50).optional(),
	})
	.strict();

export const dueBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(99_999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type DueBodyParsed = z.infer<typeof dueBody>;
