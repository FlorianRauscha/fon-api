import { z } from "zod";

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
const gYear = z.string().regex(/^[0-9]{4}$/, "Expected YYYY");

/** Gemeindekennzahl — 5-digit Austrian municipality code. */
const gemeindeKennzahl = z.string().regex(/^[0-9]{5}$/, "Expected 5 digits");

/** kznull — non-negative decimal up to 9 999 999 999 999.99. */
const kznull = z.number().min(0).max(9_999_999_999_999.99);

const wahlSchema = z.enum(["J", "N"]);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("GD"),
	identifikationsbegriff: gemeindeKennzahl,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlErklaerungen: z.number().int().min(1).max(32_768),
});

const erklaerungSchema = z
	.object({
		art: z.literal("KOMU"),
		satznr: z.number().int().min(1).max(999_999_999),
		anbringen: z.literal("KOM"),
		zr: gYear,
		fastnr,
		bmg: kznull,
		mit: z.string().optional(),
		vb: wahlSchema,
		km: wahlSchema,
		ns: wahlSchema,
	})
	.strict();

export const komuBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(32_768),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type KomuBodyParsed = z.infer<typeof komuBody>;
