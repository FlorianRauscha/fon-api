import { z } from "zod";
import { datum, fastnr, jahrmonat, kz, kznull, kzvorz, uhrzeit } from "../_kz.js";

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnr,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlErklaerungen: z.number().int().min(1).max(9999),
});

const allgemeineDatenSchema = z.object({
	anbringen: z.literal("U30"),
	zrvon: jahrmonat,
	zrbis: jahrmonat,
	fastnr,
	kundeninfo: z.string().max(50).optional(),
});

const steuerfreiSchema = z
	.object({
		kz011: kz.optional(),
		kz012: kz.optional(),
		kz015: kz.optional(),
		kz017: kz.optional(),
		kz018: kz.optional(),
		kz019: kz.optional(),
		kz016: kz.optional(),
		vst: z
			.string()
			.regex(/^[0-9][0-9a-zA-Z]{0,3}$/, "VST: 1-4 chars, first must be a digit")
			.optional(),
		kz020: kz.optional(),
	})
	.strict();

const versteuertSchema = z
	.object({
		kz022: kz.optional(),
		kz124: kz.optional(),
		kz029: kz.optional(),
		kz006: kz.optional(),
		kz037: kz.optional(),
		kz052: kz.optional(),
		kz007: kz.optional(),
		kz056: kz.optional(),
		kz057: kz.optional(),
		kz048: kz.optional(),
		kz044: kz.optional(),
		kz032: kz.optional(),
	})
	.strict();

const lieferungenSchema = z
	.object({
		kz000: kznull,
		kz001: kz.optional(),
		kz021: kz.optional(),
		steuerfrei: steuerfreiSchema.optional(),
		versteuert: versteuertSchema.optional(),
	})
	.strict();

const versteuertIgeSchema = z
	.object({
		kz072: kz.optional(),
		kz125: kz.optional(),
		kz073: kz.optional(),
		kz008: kz.optional(),
		kz088: kz.optional(),
		kz076: kz.optional(),
		kz077: kz.optional(),
	})
	.strict();

const innergemSchema = z
	.object({
		kz070: kznull.optional(),
		kz071: kz.optional(),
		versteuertIge: versteuertIgeSchema.optional(),
	})
	.strict();

const vorsteuerSchema = z
	.object({
		kz060: kz.optional(),
		kz061: kz.optional(),
		kz083: kz.optional(),
		kz065: kz.optional(),
		kz066: kz.optional(),
		kz082: kz.optional(),
		kz087: kz.optional(),
		kz089: kz.optional(),
		kz064: kz.optional(),
		kz062: kz.optional(),
		kz063: kzvorz.optional(),
		kz067: kzvorz.optional(),
		kz090: kzvorz.optional(),
		are: z.literal("J").optional(),
		repo: z.literal("J").optional(),
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.string().min(1),
		satznr: z.number().int().min(1),
		allgemein: allgemeineDatenSchema,
		lieferungen: lieferungenSchema,
		innergemeinschaftlich: innergemSchema.optional(),
		vorsteuer: vorsteuerSchema.optional(),
	})
	.strict();

export const u30Body = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type U30BodyParsed = z.infer<typeof u30Body>;
