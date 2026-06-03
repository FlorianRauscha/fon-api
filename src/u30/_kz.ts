/**
 * Shared Kennzahl primitives for the U30 (USt-Voranmeldung) family.
 * Three numeric ranges defined by the BMF XSD:
 *   kz     — strictly positive, up to 9_999_999_999_999.99
 *   kznull — non-negative, up to 9_999_999_999_999.99
 *   kzvorz — signed, ±9_999_999_999_999.99
 * Each KZ element in the XML carries a `type="kz"` attribute (the schema also
 * defines `type="datum"`, `type="uhrzeit"`, `type="jahrmonat"` for matching elements).
 */
import { z } from "zod";

export const KZ_MAX = 9_999_999_999_999.99;
export const KZ_MIN = 0.01;

export const kz = z.number().min(KZ_MIN).max(KZ_MAX);
export const kznull = z.number().min(0).max(KZ_MAX);
export const kzvorz = z.number().min(-KZ_MAX).max(KZ_MAX);

/** Format a Kennzahl decimal to BMF's expected 2-fraction-digit string (no thousand separators). */
export function fmtKz(value: number): string {
	// Avoid -0.00; clamp tiny rounding drift.
	const rounded = Math.round(value * 100) / 100;
	return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

/** Build a `<KZxxx type="kz">value</KZxxx>` element. */
export function kzEl(name: string, value: number | undefined): string {
	if (value === undefined) return "";
	return `<${name} type="kz">${fmtKz(value)}</${name}>`;
}

/** YYYY-MM gYearMonth (e.g. for ZRVON/ZRBIS) */
export const jahrmonat = z.string().regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])$/, "Expected YYYY-MM");

/** YYYY-MM-DD ISO date (e.g. for DATUM_ERSTELLUNG) */
export const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");

/** HH:MM:SS time (for UHRZEIT_ERSTELLUNG) */
export const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");

/** 9-digit Finanzamts- und Steuernummer in the BMF-acceptable range. */
export const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 10_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");
