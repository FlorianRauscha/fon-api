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
const gYear = z.string().regex(/^[0-9]{4}$/, "Expected YYYY");

const kzvorz = z.number().min(-9_999_999_999_999.99).max(9_999_999_999_999.99);

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
		anbringen: z.literal("STAB"),
		zr: gYear,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const bemessungsgrundlageSchema = z
	.object({
		bemSta3: kzvorz.optional(),
		neugr: z.enum(["J", "N"]).optional(),
		jahrUeb: kzvorz.optional(),
		belOg: kzvorz.optional(),
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("STAB"),
		satznr: z.number().int().min(1).max(999_999_999),
		allgemein: allgemeineDatenSchema.optional(),
		bemessungsgrundlage: bemessungsgrundlageSchema.optional(),
	})
	.strict();

export const stabBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(300),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type StabBodyParsed = z.infer<typeof stabBody>;
