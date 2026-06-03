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

/** Positive kz (refund amounts must be > 0). */
const kz = z.number().min(0.01).max(9_999_999_999.99);

const namee = z.string().min(1).max(37);
const ort = z.string().min(1).max(35);
const adre = z.string().min(1).max(35);
const plz = z
	.string()
	.min(1)
	.max(10)
	.regex(/^[0-9A-Za-z\- ]{1,10}$/, "Invalid PLZ");
const iban = z
	.string()
	.min(1)
	.max(35)
	.regex(/^[0-9A-Za-z]{1,35}$/, "Invalid IBAN");
const bic = z
	.string()
	.min(1)
	.max(11)
	.regex(/^[0-9A-Za-z]{1,11}$/, "Invalid BIC");
const blz = z
	.string()
	.min(1)
	.max(30)
	.regex(/^[0-9A-Za-z]{1,30}$/, "Invalid BLZ");
const giro = z
	.string()
	.min(1)
	.max(20)
	.regex(/^[0-9A-Za-z]{1,20}$/, "Invalid Giro");
const bank = z.string().min(1).max(70);
/** LKZ: 2..3 char BMF country code; permissive to avoid enumerating ~200 values. XSD validation in tests catches bad codes. */
const lkz = z.string().regex(/^[A-Z]{2,3}$/, "Expected 2-3 uppercase letters");

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
		anbringen: z.literal("RZ"),
		artRz: z.enum(["I", "A"]),
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const unbarSchema = z
	.object({
		blz: blz.optional(),
		giro: giro.optional(),
		iban: iban.optional(),
		bic: bic.optional(),
		bank: bank.optional(),
	})
	.strict();

const barSchema = z.object({ ort: ort.optional(), plze: plz, adre }).strict();

const empfaengerSchema = z
	.object({
		namee,
		betrag: kz,
		lkz: lkz.optional(),
		unbar: unbarSchema.optional(),
		bar: barSchema.optional(),
	})
	.strict();

const erklaerungSchema = z
	.object({
		art: z.literal("RZ"),
		allgemein: allgemeineDatenSchema,
		empfaenger: z.array(empfaengerSchema).min(1).max(3),
	})
	.strict();

export const rzBody = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type RzBodyParsed = z.infer<typeof rzBody>;
