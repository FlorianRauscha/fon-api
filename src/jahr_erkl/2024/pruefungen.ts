/**
 * Per-year Prüfungen for the Beilage E1a (2024 tax year).
 *
 * Source: BMF_Pruefung_Gewinnfreibetrag_E1a_Jahreserklaerung_2024.pdf (Stand: 03.01.2025).
 */

import {
	type Finding,
	type Rule,
	type RuleContext,
	type Tier,
	computeStaffel,
	defineRule,
} from "../../validation/index.js";

/**
 * Cumulative tiers for the Gewinnfreibetrag, tax year 2024.
 * The 2023→2024 change moved the first-bracket ceiling from 30 000 to 33 000.
 */
export const GFB_TIERS_2024: ReadonlyArray<Tier> = [
	{ upTo: 33_000, rate: 0.15 },
	{ upTo: 178_000, rate: 0.13 },
	{ upTo: 353_000, rate: 0.07 },
	{ upTo: 583_000, rate: 0.045 },
	{ upTo: Number.POSITIVE_INFINITY, rate: 0 },
];

/**
 * Compute the Bemessungsgrundlage for the GFB check, as defined in PDF #2 step 1.
 *
 *   Summe aus der Beilage E1a
 *   minus KZ9020
 *   plus  KZ9021
 *   plus  KZ9316  (only when negative)
 *   plus  KZ9289  (only when negative)
 *   plus  KZ9242
 *   plus  KZ9221 + KZ9227 + KZ9229
 *   plus  KZ9283  (only when any of E1.{KZ780, KZ782, KZ784, KZ917, KZ918, KZ919} is non-zero)
 *   plus  positive Einkünfte across E11 with EINKART ∈ {LF, SA, GW}
 *   plus  Summe E1c
 */
export function computeBemGfb2024(ctx: RuleContext): number {
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

/**
 * Gewinnfreibetrag E1a — the rule fires only when KZ9030 is present (the user
 * declared a GFB claim). It then verifies that the total claimed GFB does not
 * exceed the cumulative-tiered allowance derived from the Bemessungsgrundlage.
 */
export const gewinnfreibetragE1a: Rule = defineRule({
	id: "GFB-E1a-2024",
	applies: { form: "E1a", year: 2024 },
	check: (ctx): Finding | null => {
		if (ctx.kz(9030) === undefined) return null;

		const bem = computeBemGfb2024(ctx);
		const allowed = computeStaffel(bem, GFB_TIERS_2024);

		const claimed =
			(ctx.kz(9227) ?? 0) +
			(ctx.kz(9229) ?? 0) +
			(ctx.kz(9221) ?? 0) +
			ctx.agg.e11PositiveByEinkart(["LF", "SA", "GW"]) +
			ctx.agg.e1cSumme();

		if (claimed > allowed) {
			return {
				ruleId: "GFB-E1a-2024",
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
