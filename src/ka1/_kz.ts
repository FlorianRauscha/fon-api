/**
 * KA1 (Kapitalertragsteuer-Anmeldung) shared primitives.
 *
 * The KA1 schema's `kz` simple type is **non-negative** (>= 0; cf. U30 which has
 * separate `kz`/`kznull` and L1 which is signed). All KZ elements are emitted as
 * `<KAxxx type="kz">value</KAxxx>` (or KBxxx/KCxxx/KVxxx/KAYxxx variants).
 */
import { z } from "zod";

export const KZ_MAX = 9_999_999_999_999.99;

export const kz = z.number().min(0).max(KZ_MAX);

export function fmtKz(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

export function kzEl(name: string, value: number | undefined): string {
	if (value === undefined) return "";
	return `<${name} type="kz">${fmtKz(value)}</${name}>`;
}

/** YYYY-MM-DD ISO date for DATUM_ERSTELLUNG and KAT_DAT25_MEL etc. */
export const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");

export const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");

/** 9-digit FASTNR with KA1's range gate (010000010..989999999). */
export const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 10_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

/** 10-digit Versicherungsnummer (VNR) for SVA_DATEN beneficiaries. */
export const vnr = z
	.string()
	.regex(/^[0-9]{10}$/, "Expected 10 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 1 && n <= 9_999_311_299;
	}, "VNR out of valid range");

/** Free text up to 60 chars for SVA_DATEN beneficiary name (BMF's alpha60). */
export const alpha60 = z
	.string()
	.min(1)
	.max(60)
	.regex(
		/^[a-zA-ZäÄöÖüÜ .\-=´`ÁÀÂÃÈÉÊÌÍÒÓÔÕÛÑÝßáàâãèéêìíòóôõùúûñý]{1,60}$/,
		"Expected letters, spaces, . - = and accents only (no digits)",
	);
