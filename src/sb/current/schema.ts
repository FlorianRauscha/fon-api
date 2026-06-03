import { z } from "zod";

const AA_CODES = [
	"000",
	"007",
	"011",
	"012",
	"013",
	"014",
	"015",
	"016",
	"018",
	"021",
	"024",
	"026",
	"027",
	"028",
	"030",
	"031",
	"034",
	"040",
	"045",
	"047",
	"057",
	"077",
	"113",
	"114",
	"115",
	"116",
	"122",
	"123",
	"124",
	"125",
	"126",
	"163",
	"164",
	"166",
	"177",
	"178",
	"179",
	"200",
	"204",
	"205",
	"400",
	"401",
	"405",
	"406",
	"443",
	"444",
	"445",
	"446",
	"447",
	"448",
	"449",
	"450",
	"451",
	"452",
	"453",
	"454",
	"455",
	"456",
	"460",
	"461",
	"462",
	"463",
	"465",
	"466",
	"467",
] as const;
const aaSchema = z.enum(AA_CODES);

const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 10_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");
const jahrmonat = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

const zeitraumSchema = z
	.object({
		value: z.string().min(1),
		type: z.enum(["datum", "jahrmonat", "jahr"]),
	})
	.strict();

/** Signed decimal in [-9_999_999_999.99, 9_999_999_999.99]. */
const kz = z.number().min(-9_999_999_999.99).max(9_999_999_999.99);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnr,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlErklaerungen: z.number().int().min(1).max(9999),
});

const allgemeineDatenSchema = z
	.object({
		satznr: z.number().int().min(1).max(999_999_999),
		anbringen: z.literal("SB"),
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const uvaZeitraumSchema = z
	.object({
		uvazrvon: jahrmonat.optional(),
		uvazrbis: jahrmonat.optional(),
	})
	.strict();

const verrechnungsweisungSchema = z
	.object({
		aa: aaSchema,
		zrvon: zeitraumSchema,
		zrbis: zeitraumSchema,
		betrag: kz,
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("SB"),
		allgemein: allgemeineDatenSchema,
		uvaZeitraum: uvaZeitraumSchema.optional(),
		verrechnungsweisungen: z.array(verrechnungsweisungSchema).min(1).max(20),
	})
	.strict();

export const sbBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type SbBodyParsed = z.infer<typeof sbBody>;
export { AA_CODES };
