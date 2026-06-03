import { z } from "zod";
import {
	alphanum20,
	alphanum25,
	alphanum30,
	datum,
	fastnr,
	gYear,
	janein,
	kz,
	monat,
	monattag,
	plz,
	prozent,
	prozent0,
	staatCode,
	uhrzeit,
	vnr,
	zweistellen,
} from "../_kz.js";
import { WK_BERUF_CODES } from "./types.js";

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
		anbringen: z.literal("L1"),
		zr: gYear,
		fastnr,
		kundeninfo: z.string().max(50).optional(),
		anzbez: z.number().int().min(0).max(99),
		kz725: kz.optional(),
		avab: z.literal("J").optional(),
		aeab: z.literal("J").optional(),
		kindfb: z.number().int().min(0).max(99).optional(),
		kmb30: z.literal("J").optional(),
		kmbPart: z.literal("J").optional(),
		agbelP: z.literal("J").optional(),
		erhPab: z.literal("J").optional(),
		mehrki: z.literal("J").optional(),
	})
	.strict();

const rawInnerSchema = z.object({ rawInner: z.string() }).strict();

const typedSonderausgabenSchema = z.object({ kz460: kz.optional(), kz280: kz.optional() }).strict();

const wkBerufSchema = z.enum(WK_BERUF_CODES);

const werbungskostenJobSchema = z
	.object({
		beruf: wkBerufSchema,
		zrvon: monattag,
		zrbis: monattag,
		kzPauschale: kz.optional(),
	})
	.strict();

const typedWerbungskostenSchema = z
	.object({
		kz718: kz.optional(),
		kz916: kz.optional(),
		kz717: kz.optional(),
		kz158: kz.optional(),
		kz274: kz.optional(),
		beruf: alphanum30.optional(),
		kz169: kz.optional(),
		kz719: kz.optional(),
		kz720: kz.optional(),
		kz721: kz.optional(),
		kz722: kz.optional(),
		kz300: kz.optional(),
		kz723: kz.optional(),
		kz159: kz.optional(),
		kz724: kz.optional(),
		job1: werbungskostenJobSchema.optional(),
		job2: werbungskostenJobSchema.optional(),
	})
	.strict();

const sonderausgabenSchema = z.union([rawInnerSchema, typedSonderausgabenSchema]);
const werbungskostenSchema = z.union([rawInnerSchema, typedWerbungskostenSchema]);

const typedAbAllgemeinSchema = z
	.object({
		kz730: kz.optional(),
		kz731: kz.optional(),
		kz734: kz.optional(),
		kz735: kz.optional(),
		kz475: kz.optional(),
		opferaus: z.literal("J").optional(),
	})
	.strict();

const typedAbBehindSelfSchema = z
	.object({
		koerperS: prozent0.optional(),
		diaetSz: z.literal("J").optional(),
		diaetSg: z.literal("J").optional(),
		diaetSm: z.literal("J").optional(),
		pflegeSa: monat.optional(),
		pflegeSe: monat.optional(),
		kfzS: z.literal("J").optional(),
		kz435: kz.optional(),
		kz476: kz.optional(),
		kz439: kz.optional(),
	})
	.strict();

const typedAbBehindPartnerSchema = z
	.object({
		koerperP: prozent0.optional(),
		diaetPz: z.literal("J").optional(),
		diaetPg: z.literal("J").optional(),
		diaetPm: z.literal("J").optional(),
		pflegePa: monat.optional(),
		pflegePe: monat.optional(),
		kfzP: z.literal("J").optional(),
		kz436: kz.optional(),
		kz417: kz.optional(),
		kz418: kz.optional(),
	})
	.strict();

const typedAbBehinderungSchema = z
	.object({
		steuerpflichtiger: z.union([rawInnerSchema, typedAbBehindSelfSchema]).optional(),
		partner: z.union([rawInnerSchema, typedAbBehindPartnerSchema]).optional(),
	})
	.strict();

const fbMonthSchema = z
	.object({
		s: z.literal("J").optional(),
		p: z.literal("J").optional(),
		u: z.literal("J").optional(),
		fb50: z.literal("J").optional(),
		fb100: z.literal("J").optional(),
	})
	.strict();

const monthKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
const fbMonateSchema = z
	.object(Object.fromEntries(monthKeys.map((k) => [k, fbMonthSchema.optional()])))
	.strict();

const typedKindAngabenSchema = z
	.object({
		famname: alphanum25.optional(),
		vorname: alphanum25.optional(),
		vnrkinK: vnr.optional(),
		gebkinK: datum.optional(),
		eurokv: alphanum20.optional(),
		wsKind: staatCode.optional(),
		fbsn50: z.literal("J").optional(),
		fbsn100: z.literal("J").optional(),
		fbpn50: z.literal("J").optional(),
		fbpn100: z.literal("J").optional(),
		fbsu50: z.literal("J").optional(),
		fbsu100: z.literal("J").optional(),
		uab50: z.literal("J").optional(),
		uab100: z.literal("J").optional(),
		untGes: kz.optional(),
		untMtl: kz.optional(),
		untausl: kz.optional(),
		auslKa: monat.optional(),
		auslKe: monat.optional(),
		agbelK: kz.optional(),
		kostraK: prozent.optional(),
		mmberuK: zweistellen.optional(),
		plzK: plz.optional(),
		staatK: staatCode.optional(),
		koerperK: prozent0.optional(),
		diaetKz: z.literal("J").optional(),
		diaetKg: z.literal("J").optional(),
		diaetKm: z.literal("J").optional(),
		fberhKa: monat.optional(),
		fberhKe: monat.optional(),
		pflegeK: kz.optional(),
		pflegeKa: monat.optional(),
		pflegeKe: monat.optional(),
		kz28k: kz.optional(),
		kz71k: kz.optional(),
		kz29k: kz.optional(),
		nvstagz: kz.optional(),
		fbMonate: fbMonateSchema.optional(),
	})
	.strict();

const typedKindAusbildungBehinderungSchema = z
	.object({
		kindAngaben: z
			.array(z.union([rawInnerSchema, typedKindAngabenSchema]))
			.min(1)
			.max(20),
	})
	.strict();

const typedAbSchema = z
	.object({
		allgemein: z.union([rawInnerSchema, typedAbAllgemeinSchema]).optional(),
		behinderung: z.union([rawInnerSchema, typedAbBehinderungSchema]).optional(),
		kindAusbildungBehinderung: z
			.union([rawInnerSchema, typedKindAusbildungBehinderungSchema])
			.optional(),
	})
	.strict();

const aussergewoehnlicheBelastungenSchema = z.union([rawInnerSchema, typedAbSchema]);

const typedFreibetragsbescheidSchema = z
	.object({
		indfb: z.literal("J").optional(),
		kz449: kz.optional(),
	})
	.strict();

const freibetragsbescheidSchema = z.union([rawInnerSchema, typedFreibetragsbescheidSchema]);

const typedBesondereSonderausgabenVerteilungSchema = z
	.object({
		famD: alphanum25.optional(),
		vorD: alphanum25.optional(),
		vnrD: vnr.optional(),
		gebdatD: datum.optional(),
		kz281: kz.optional(),
		kz282: kz.optional(),
		kz458: kz.optional(),
		zus1D: z.literal("J").optional(),
		kz284: kz.optional(),
		zehn2D: z.literal("J").optional(),
		zus2D: z.literal("J").optional(),
		zehn1D: z.literal("J").optional(),
		kz283: kz.optional(),
	})
	.strict();

const besondereSonderausgabenVerteilungSchema = z.union([
	rawInnerSchema,
	typedBesondereSonderausgabenVerteilungSchema,
]);

const wahl = z.literal("J");
const typedInternationalSchema = z
	.object({
		wsInl: wahl.optional(),
		greg1614: wahl.optional(),
		wsAusag: wahl.optional(),
		auslbeh: wahl.optional(),
		auslbez: wahl.optional(),
		inlBon: wahl.optional(),
		dbanrech: wahl.optional(),
		auslNsa: wahl.optional(),
		wsAusl: wahl.optional(),
		aglst: wahl.optional(),
		inlbez: wahl.optional(),
		ausag: wahl.optional(),
		auslBon: wahl.optional(),
		staat3: staatCode.optional(),
		ansBsg: wahl.optional(),
		auslEin: wahl.optional(),
		kz359: kz.optional(),
		pensausl: wahl.optional(),
		kz183: kz.optional(),
		kz377: kz.optional(),
		anzl17: zweistellen.optional(),
		kz187: kz.optional(),
		kz154: kz.optional(),
		kz544: kz.optional(),
		land1L1: staatCode.optional(),
		wk1L1: kz.optional(),
		auslst1: kz.optional(),
		land2L1: staatCode.optional(),
		wk2L1: kz.optional(),
		auslst2: kz.optional(),
		ausnein: wahl.optional(),
		auserh: wahl.optional(),
		ausantr: wahl.optional(),
		kz775: kz.optional(),
		kz453: kz.optional(),
		kz184: kz.optional(),
		sv184: janein.optional(),
		kz493: kz.optional(),
		kz791: kz.optional(),
		antr9911: wahl.optional(),
		beschpfl: wahl.optional(),
		keinws: wahl.optional(),
		asStaat: staatCode.optional(),
		staatAn: staatCode.optional(),
		antr14: wahl.optional(),
		einkS: kz.optional(),
		einkAnd: kz.optional(),
		einkP: kz.optional(),
		kz188: kz.optional(),
		sts275: wahl.optional(),
	})
	.strict();

const internationalSchema = z.union([rawInnerSchema, typedInternationalSchema]);

const erklaerungSchema = z
	.object({
		art: z.string().min(1),
		satznr: z.number().int().min(1),
		allgemein: allgemeineDatenSchema,
		sonderausgaben: sonderausgabenSchema.optional(),
		werbungskosten: werbungskostenSchema.optional(),
		aussergewoehnlicheBelastungen: aussergewoehnlicheBelastungenSchema.optional(),
		freibetragsbescheid: freibetragsbescheidSchema.optional(),
		international: internationalSchema.optional(),
		besondereSonderausgabenVerteilung: besondereSonderausgabenVerteilungSchema.optional(),
	})
	.strict();

export const l1Body = z
	.object({
		info: infoDatenSchema,
		erklaerungen: z.array(erklaerungSchema).min(1).max(4000),
	})
	.strict()
	.refine(
		(b) => b.info.anzahlErklaerungen === b.erklaerungen.length,
		"info.anzahlErklaerungen must equal erklaerungen.length",
	);

export type L1BodyParsed = z.infer<typeof l1Body>;
