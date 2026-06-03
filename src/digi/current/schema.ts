import { z } from "zod";

const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 20_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");
const gYear = z.string().regex(/^[0-9]{4}$/, "Expected YYYY");

/** YYYYMM 6-digit string (no dash, BMF's ZR_Type). */
const yyyymm = z.string().regex(/^[0-9]{6}$/, "Expected YYYYMM");

const kzvorz = z.number().min(-9_999_999_999_999.99).max(9_999_999_999_999.99);

const artLeistungSchema = z.enum(["BA", "SU", "SO"]);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnr,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	/** DIGI's max is 300 (vs other arts' 9999). */
	anzahlErklaerungen: z.number().int().min(1).max(300),
});

const allgemeineDatenSchema = z
	.object({
		anbringen: z.literal("DIGI"),
		zr: gYear,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const bemessungsgrundlageSchema = z
	.object({
		artLeistung: artLeistungSchema,
		ortLtg: z.string().min(1).max(50),
		wjBeg: yyyymm,
		wjEnde: yyyymm,
		ums212a: kzvorz,
		entgelt: kzvorz,
		ausg: kzvorz.optional(),
		bemGes: kzvorz,
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("DIGI"),
		satznr: z.number().int().min(1).max(999_999_999),
		allgemein: allgemeineDatenSchema.optional(),
		bemessungsgrundlage: bemessungsgrundlageSchema.optional(),
	})
	.strict();

export const digiBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(300),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type DigiBodyParsed = z.infer<typeof digiBody>;
