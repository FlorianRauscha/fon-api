import { z } from "zod";

const anbringenSchema = z.enum(["KOMMST1", "KOMMST2"]);

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
const jahrmonat = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

const kz = z.number().min(0).max(9_999_999_999_999.99);
const gemeindekennzahl = z.string().regex(/^[0-9]{5}$/, "Expected 5 digits");
const plz = z.string().regex(/^[0-9]{4}$/, "Expected 4 digits");
const gemeindename = z.string().min(1).max(40);

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
		jahr: gYear.optional(),
		zr: jahrmonat.optional(),
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const gemeindeSchema = z
	.object({
		gd: gemeindekennzahl,
		plz,
		gem: gemeindename,
		bmg: kz.optional(),
		steuer: kz.optional(),
		rueck: z.literal("J").optional(),
	})
	.strict();

const gesamteBemessungsgrundlageSchema = z.object({ gesamtBmg: kz, gesamtSteuer: kz }).strict();

const erklaerungSchema = z
	.object({
		art: anbringenSchema,
		satznr: z.number().int().min(1).max(999_999_999),
		allgemein: allgemeineDatenSchema,
		gesamteBemessungsgrundlage: gesamteBemessungsgrundlageSchema.optional(),
		gemeinden: z.array(gemeindeSchema).min(1),
	})
	.strict()
	.refine((e) => e.art === e.allgemein.anbringen, "erklaerung.art must equal allgemein.anbringen");

export const komBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type KOMBodyParsed = z.infer<typeof komBody>;
