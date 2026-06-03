/**
 * L1 (ANV/Arbeitnehmerveranlagung) shared primitives.
 *
 * The L1 schema's `kz` simple type is *signed* (range -9_999_999_999_999.99 ..
 * 9_999_999_999_999.99 with 2 fraction digits) — broader than U30's `kz` /
 * `kznull` distinction. Each KZ element is rendered as
 * `<KZxxx type="kz">value</KZxxx>`.
 */
import { z } from "zod";

export const KZ_MAX = 9_999_999_999_999.99;

export const kz = z.number().min(-KZ_MAX).max(KZ_MAX);

/** Format an L1 Kennzahl decimal to BMF's expected 2-fraction-digit string. */
export function fmtKz(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

export function kzEl(name: string, value: number | undefined): string {
	if (value === undefined) return "";
	return `<${name} type="kz">${fmtKz(value)}</${name}>`;
}

/** YYYY-MM-DD ISO date for DATUM_ERSTELLUNG. */
export const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");

/** HH:MM:SS time for UHRZEIT_ERSTELLUNG. */
export const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");

/** 4-digit gYear for the ZR (Zeitraum/tax year) element. */
export const gYear = z.string().regex(/^[0-9]{4}$/, "Expected YYYY");

/** 9-digit FASTNR (per L1 schema: simple [0-9]{9} pattern, no FastNr range gate). */
export const fastnr = z.string().regex(/^[0-9]{9}$/, "Expected 9 digits");

/** XML Schema gMonthDay: `--MM-DD` (used by WKZRVON1/WKZRBIS1/WKZRVON2/WKZRBIS2). */
export const monattag = z
	.string()
	.regex(/^--(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected --MM-DD");

/** XML Schema gMonth: `--MM` (used by PFLEGE_S_A/E and PFLEGE_P_A/E). */
export const monat = z.string().regex(/^--(?:0[1-9]|1[0-2])$/, "Expected --MM");

/** Integer percentage 0..100 (XSD type prozent0). */
export const prozent0 = z.number().int().min(0).max(100);

/** Free text up to 30 chars (alphanumerisch30u). */
export const alphanum30 = z.string().min(1).max(30);

/** Free text up to 25 chars (alphanumerisch25u). */
export const alphanum25 = z.string().min(1).max(25);

/** 10-digit Versicherungsnummer (VNR), pattern \d{10}, range 1..9999311299. */
export const vnr = z
	.string()
	.regex(/^[0-9]{10}$/, "Expected 10 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 1 && n <= 9_999_311_299;
	}, "VNR out of valid range");

/**
 * BMF country code (laender enum from laender_kfz.xsd, plus "A" for Austria where
 * the union allows it). The full enum has ~250 entries; here we just shape-check
 * (1–5 chars). XSD validation in tests catches invalid codes.
 */
export const staatCode = z.string().min(1).max(5);

/** Zweistellige Ganzzahl 0..99 (XSD type zweistellen). */
export const zweistellen = z.number().int().min(0).max(99);

/** janein simple enum — "J" or "N". */
export const janein = z.enum(["J", "N"]);

/** Free text up to 20 chars (alphanumerisch20). */
export const alphanum20 = z.string().min(1).max(20);

/** Integer percentage 1..100 (XSD type prozent — strictly positive). */
export const prozent = z.number().int().min(1).max(100);

/** PLZ_K — postcode 4..10 chars (BMF pattern is permissive with digits/letters/space/slash). */
export const plz = z.string().min(4).max(10);
