/**
 * Per-year Prüfungen for the Beilage E1a (2025 tax year).
 *
 * Source: BMF_Pruefung_Gewinnfreibetrag_E1a_Jahreserklaerung_2025.pdf.
 *
 * The tier table is unchanged from 2024 — the 33 000 first-bracket ceiling that
 * arrived with the 2024 reform is now the steady-state value. The
 * Bemessungsgrundlage formula (PDF #2 step 1) is also unchanged.
 */

import {
	type Finding,
	type Rule,
	type RuleContext,
	type Tier,
	computeStaffel,
	defineRule,
} from "../../validation/index.js";

export const GFB_TIERS_2025: ReadonlyArray<Tier> = [
	{ upTo: 33_000, rate: 0.15 },
	{ upTo: 178_000, rate: 0.13 },
	{ upTo: 353_000, rate: 0.07 },
	{ upTo: 583_000, rate: 0.045 },
	{ upTo: Number.POSITIVE_INFINITY, rate: 0 },
];

export function computeBemGfb2025(ctx: RuleContext): number {
	const kz = (c: number): number => ctx.kz(c) ?? 0;
	let bem = ctx.agg.e1aSumme();
	bem -= kz(9020);
	bem += kz(9021);
	const k9316 = ctx.kz(9316);
	if (k9316 !== undefined && k9316 < 0) bem += k9316;
	const k9289 = ctx.kz(9289);
	if (k9289 !== undefined && k9289 < 0) bem += k9289;
	bem += kz(9242);
	bem += kz(9221) + kz(9227) + kz(9229);
	if (ctx.anyE1KennzahlNonZero([780, 782, 784, 917, 918, 919])) {
		bem += kz(9283);
	}
	bem += ctx.agg.e11PositiveByEinkart(["LF", "SA", "GW"]);
	bem += ctx.agg.e1cSumme();
	return bem;
}

export const gewinnfreibetragE1a: Rule = defineRule({
	id: "GFB-E1a-2025",
	applies: { form: "E1a", year: 2025 },
	check: (ctx): Finding | null => {
		if (ctx.kz(9030) === undefined) return null;
		const bem = computeBemGfb2025(ctx);
		const allowed = computeStaffel(bem, GFB_TIERS_2025);
		const claimed =
			(ctx.kz(9227) ?? 0) +
			(ctx.kz(9229) ?? 0) +
			(ctx.kz(9221) ?? 0) +
			ctx.agg.e11PositiveByEinkart(["LF", "SA", "GW"]) +
			ctx.agg.e1cSumme();
		if (claimed > allowed) {
			return {
				ruleId: "GFB-E1a-2025",
				severity: "error",
				code: "GFB_EXCEEDED",
				kz: 9030,
				expected: allowed,
				actual: claimed,
				message: `Gewinnfreibetrag (KZ9227+KZ9229+KZ9221+E11+E1c=${claimed.toFixed(2)}) exceeds the allowed maximum (${allowed.toFixed(2)}) for Bemessungsgrundlage ${bem.toFixed(2)}`,
			};
		}
		return null;
	},
});

export const RULES: ReadonlyArray<Rule> = [gewinnfreibetragE1a];
