/**
 * Reproduces the Gewinnfreibetrag E1a check from PDF
 * `BMF_Pruefung_Gewinnfreibetrag_E1a_Jahreserklaerung_2024.pdf` for both 2023 and 2024.
 *
 * The 2023 → 2024 transition moves the first-tier ceiling from 30 000 to 33 000.
 * Tests pin the formula's exact behavior on concrete numbers.
 */

import { describe, expect, it } from "vitest";
import {
	computeBemGfb2023,
	gewinnfreibetragE1a as gfb2023,
} from "../../../src/jahr_erkl/2023/pruefungen.js";
import {
	computeBemGfb2024,
	gewinnfreibetragE1a as gfb2024,
} from "../../../src/jahr_erkl/2024/pruefungen.js";
import { hasErrors, makeContext, runRules } from "../../../src/validation/index.js";

describe("computeBemGfb2024 — Bemessungsgrundlage formula", () => {
	it("starts from e1aSumme with no Kennzahls present", () => {
		const ctx = makeContext({ e1aSumme: 50_000 });
		expect(computeBemGfb2024(ctx)).toBe(50_000);
	});

	it("applies the full PDF #2 step-1 formula", () => {
		// 100k - 5k(KZ9020) + 1k(KZ9021) + (-2k)(KZ9316) + 0(KZ9289 not negative ignored)
		//      + 500(KZ9242) + 200+300+400(KZ9221+9227+9229)
		//      + 1000(KZ9283 because KZ780 is non-zero on E1)
		//      + 700(E11 LF/SA/GW) + 100(E1c)
		// = 100000 - 5000 + 1000 - 2000 + 500 + 900 + 1000 + 700 + 100 = 97_200
		const ctx = makeContext({
			e1aSumme: 100_000,
			kennzahls: {
				9020: 5_000,
				9021: 1_000,
				9316: -2_000,
				9289: 500, // positive → ignored
				9242: 500,
				9221: 200,
				9227: 300,
				9229: 400,
				9283: 1_000,
			},
			e1KennzahlsNonZero: [780],
			e11PositiveByEinkart: { LF: 400, SA: 200, GW: 100, VV: 9999 }, // VV ignored
			e1cSumme: 100,
		});
		expect(computeBemGfb2024(ctx)).toBe(97_200);
	});

	it("ignores KZ9283 when no E1 trigger Kennzahl is non-zero", () => {
		const ctx = makeContext({
			e1aSumme: 50_000,
			kennzahls: { 9283: 5_000 },
			// no e1KennzahlsNonZero
		});
		expect(computeBemGfb2024(ctx)).toBe(50_000);
	});
});

/**
 * Helper: build a context where the EFFECTIVE Bemessungsgrundlage equals `bem`
 * and the user's claim is `claim` (placed into KZ9227). Per PDF #2 step 1, BEM
 * adds KZ9227 back to the e1aSumme — so we set e1aSumme = bem - claim.
 */
function ctxWithBemAndClaim(bem: number, claim: number) {
	return makeContext({
		e1aSumme: bem - claim,
		kennzahls: { 9030: 1, 9227: claim },
	});
}

describe("gewinnfreibetragE1a — 2024 rule", () => {
	it("does not fire when KZ9030 is absent", () => {
		const ctx = makeContext({ e1aSumme: 100_000, kennzahls: { 9227: 50_000 } });
		expect(gfb2024.check(ctx)).toBeNull();
	});

	it("passes when claimed equals exactly the allowed maximum", () => {
		// BEM=33_000 → 2024 max = 33_000 × 15% = 4_950
		expect(gfb2024.check(ctxWithBemAndClaim(33_000, 4_950))).toBeNull();
	});

	it("flags GFB_EXCEEDED when claimed > allowed", () => {
		// BEM=33_000 → allowed=4_950; claim=5_000 (50 over)
		const res = gfb2024.check(ctxWithBemAndClaim(33_000, 5_000));
		expect(res).not.toBeNull();
		const f = Array.isArray(res) ? res[0] : res;
		expect(f).toMatchObject({
			ruleId: "GFB-E1a-2024",
			severity: "error",
			code: "GFB_EXCEEDED",
			kz: 9030,
			expected: 4_950,
			actual: 5_000,
		});
	});

	it("counts E11 LF/SA/GW and E1c contributions toward both BEM and claim", () => {
		// e1aSumme=0; E11 contributes 10k (LF) + 5k (SA); E1c 3k → claimed=18k
		// BEM = 0 + ... + 18k from E11+E1c → all in first tier (15%) → allowed=2_700
		// claimed=18_000 → exceeds 2_700 → ERROR
		const ctx = makeContext({
			kennzahls: { 9030: 1 },
			e11PositiveByEinkart: { LF: 10_000, SA: 5_000 },
			e1cSumme: 3_000,
		});
		const res = gfb2024.check(ctx);
		expect(res).not.toBeNull();
		const f = Array.isArray(res) ? res[0] : res;
		expect(f?.expected).toBe(2_700);
		expect(f?.actual).toBe(18_000);
	});
});

describe("gewinnfreibetragE1a — year-versioned threshold change (2023 vs 2024)", () => {
	it("BEM=33_000 with claim=4_900 fails 2023 only because of the lower bracket ceiling", () => {
		// 2023 allowed (33k): 30k×15% + 3k×13% = 4_500 + 390 = 4_890
		// 2024 allowed (33k): 33k×15% = 4_950
		const ctx = ctxWithBemAndClaim(33_000, 4_900);
		expect(gfb2023.check(ctx)).not.toBeNull(); // 2023: 4900 > 4890 → ERROR
		expect(gfb2024.check(ctx)).toBeNull(); // 2024: 4900 < 4950 → OK
	});

	it("rule.id encodes the year", () => {
		expect(gfb2023.id).toBe("GFB-E1a-2023");
		expect(gfb2024.id).toBe("GFB-E1a-2024");
	});

	it("integrates with runRules + hasErrors", () => {
		// BEM=50_000 → allowed = 33k×15% + 17k×13% = 4_950 + 2_210 = 7_160
		// claim=100_000 → wildly over → 1 error finding
		const ctx = ctxWithBemAndClaim(50_000, 100_000);
		const findings = runRules([gfb2024], ctx);
		expect(findings).toHaveLength(1);
		expect(hasErrors(findings)).toBe(true);
	});
});
