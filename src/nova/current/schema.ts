import { z } from "zod";

const anbringenSchema = z.literal("NOVA1");

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
const jahrmonat = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

/** Signed decimal in [-9_999_999_999.99, 9_999_999_999.99]. */
const kz = z.number().min(-9_999_999_999.99).max(9_999_999_999.99);

const fin = z.string().regex(/^[0-9A-Za-z]{1,20}$/, "Expected 1..20 alphanumeric chars");

/** NOVA_SATZ — "00".."N" 2-digit percent string, or "16.67" special. */
const novaSatz = z
	.string()
	.regex(/^(?:[0-7][0-9]|80|16\.67)$/, "Expected percent '00'..'80' or '16.67'");

const vergGrund = z.number().int().min(40).max(59);
const ustInfo = z.number().int().min(30).max(33);
const sonstBegruend = z.string().min(1).max(500);

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
		zr: jahrmonat,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const anmeldungSchema = z
	.object({
		liefBmg: kz.optional(),
		liefSteuer: kz.optional(),
		igeBmg: kz.optional(),
		igeSteuer: kz.optional(),
		sonstvgBmg: kz.optional(),
		sonstvgSteuer: kz.optional(),
		berichtig: kz.optional(),
	})
	.strict();

const verguetungSchema = z
	.object({
		fin: fin.optional(),
		vergBmg: kz.optional(),
		novaSatz: novaSatz.optional(),
		vergSteuer: kz.optional(),
		vergGrund: vergGrund.optional(),
		sonstBegruend: sonstBegruend.optional(),
		ustBmg: kz.optional(),
		ustInfo: ustInfo.optional(),
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("NOVA"),
		satznr: z.number().int().min(1).max(999_999_999),
		allgemein: allgemeineDatenSchema.optional(),
		anmeldung: anmeldungSchema.optional(),
		verguetungen: z.array(verguetungSchema).min(1).max(1200).optional(),
	})
	.strict();

export const novaBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type NovaBodyParsed = z.infer<typeof novaBody>;
