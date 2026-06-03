import { z } from "zod";

const anbringenSchema = z.literal("U13");
const klagSchema = z.enum(["1", "2", "3"]);

const fastnr = z.string().regex(/^[0-9]{9}$/, "Expected 9 digits");
const uid = z.string().min(1).max(15);
const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");
const jahrmonat = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

/** SUM_BGL: signed whole-euro integer in [-9_999_999_999, 9_999_999_999]. */
const sumBgl = z.number().int().min(-9_999_999_999).max(9_999_999_999);

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
		anbringen: anbringenSchema,
		zrvon: jahrmonat,
		zrbis: jahrmonat,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const zmEntrySchema = z
	.object({
		uidMs: uid,
		sumBgl: sumBgl.optional(),
		dreieck: z.literal("J").optional(),
		solei: z.literal("J").optional(),
		klag: klagSchema.optional(),
		uidUe: uid.optional(),
	})
	.strict();

const gesamtruckziehungSchema = z.object({ gesamtrueck: z.literal("J") }).strict();

const contentSchema = z.union([
	z
		.object({
			kind: z.literal("entries"),
			entries: z.array(zmEntrySchema).min(1).max(9999),
		})
		.strict(),
	z
		.object({
			kind: z.literal("gesamtrueckziehung"),
			gesamtrueckziehung: gesamtruckziehungSchema,
		})
		.strict(),
]);

const erklaerungSchema = z
	.object({
		art: z.string().min(1),
		satznr: z.number().int().min(1),
		allgemein: allgemeineDatenSchema,
		content: contentSchema,
	})
	.strict();

export const zmBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type ZMBodyParsed = z.infer<typeof zmBody>;
