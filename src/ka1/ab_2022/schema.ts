import { z } from "zod";
import { alpha60, datum, fastnr, kz, uhrzeit, vnr } from "../_kz.js";

const anbringenSchema = z.enum(["KA1T", "KA1M", "KA1V", "KA1E", "KA1Z", "KA1Y"]);

const katBegrSchema = z.enum(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "99"]);

const zrSchema = z
	.object({
		value: z.string().min(1),
		type: z.enum(["datum", "jahrmonat", "jahr"]),
	})
	.strict();

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
		zr: zrSchema,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
	})
	.strict();

const rawInnerSchema = z.object({ rawInner: z.string() }).strict();

const bmgTSchema = z
	.object({
		kat11: kz.optional(),
		kat11a: kz.optional(),
		kat11b: kz.optional(),
		kat11c: kz.optional(),
		katBegr: katBegrSchema.optional(),
		kat21: kz.optional(),
		kat22: kz.optional(),
		kat23: kz.optional(),
		kat24: kz.optional(),
		kat25: kz.optional(),
		katDat25Mel: datum.optional(),
		kat31: kz.optional(),
		kat32: kz.optional(),
		kat33: kz.optional(),
		kat34: kz.optional(),
		summeKa: kz.optional(),
	})
	.strict();

const bmgMSchema = z
	.object({
		kam11: kz.optional(),
		kam11a: kz.optional(),
		kam11b: kz.optional(),
		kam11c: kz.optional(),
		kam21: kz.optional(),
		kam22: kz.optional(),
		summeKa: kz.optional(),
		kbm31: kz.optional(),
		kbm31a: kz.optional(),
		kbm31b: kz.optional(),
		kbm32: kz.optional(),
		kbm32a: kz.optional(),
		kbm32b: kz.optional(),
		kbm41: kz.optional(),
		kbm41b: kz.optional(),
		kbm42: kz.optional(),
		kbm42b: kz.optional(),
		summeKb: kz.optional(),
		kcm51: kz.optional(),
		kcm51a: kz.optional(),
		kcm51b: kz.optional(),
		kcm61: kz.optional(),
		kcm61b: kz.optional(),
		summeKc: kz.optional(),
		kvm71: kz.optional(),
		kvm72: kz.optional(),
		summeKv: kz.optional(),
	})
	.strict();

const bmgVeSchema = z
	.object({
		kbve11: kz.optional(),
		kbve11a: kz.optional(),
		kbve11b: kz.optional(),
		kbveDat11Von: datum.optional(),
		kbveDat11Bis: datum.optional(),
		kbve12: kz.optional(),
		kbve12a: kz.optional(),
		kbve12b: kz.optional(),
		kbveDat12Von: datum.optional(),
		kbveDat12Bis: datum.optional(),
		kbve21: kz.optional(),
		kbve21b: kz.optional(),
		kbve22: kz.optional(),
		kbve22b: kz.optional(),
		summeKb: kz.optional(),
	})
	.strict();

const bmgZSchema = z
	.object({
		kaz11: kz.optional(),
		kaz12: kz.optional(),
		kaz13: kz.optional(),
		kaz21: kz.optional(),
		kaz22: kz.optional(),
		summeKw: kz.optional(),
	})
	.strict();

const bmgYSchema = z
	.object({
		kay11: kz.optional(),
		kay11a: kz.optional(),
		kay11b: kz.optional(),
		kay12: kz.optional(),
		kay12a: kz.optional(),
		kay12b: kz.optional(),
		kay21: kz.optional(),
		kay21b: kz.optional(),
		kay22: kz.optional(),
		kay22b: kz.optional(),
		summeKy: kz.optional(),
		kyv31: kz.optional(),
		summeKyv: kz.optional(),
	})
	.strict();

const svaDatenSchema = z.object({ vnr, name: alpha60, betrag: kz }).strict();

const erklaerungSchema = z
	.object({
		art: anbringenSchema,
		satznr: z.number().int().min(1),
		allgemein: allgemeineDatenSchema,
		bmgT: z.union([rawInnerSchema, bmgTSchema]).optional(),
		bmgM: z.union([rawInnerSchema, bmgMSchema]).optional(),
		bmgVe: z.union([rawInnerSchema, bmgVeSchema]).optional(),
		bmgZ: z.union([rawInnerSchema, bmgZSchema]).optional(),
		bmgY: z.union([rawInnerSchema, bmgYSchema]).optional(),
		svaDaten: z.array(svaDatenSchema).max(10).optional(),
	})
	.strict()
	.refine((e) => e.art === e.allgemein.anbringen, "erklaerung.art must equal allgemein.anbringen");

export const ka1Body = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(9999),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type KA1BodyParsed = z.infer<typeof ka1Body>;
