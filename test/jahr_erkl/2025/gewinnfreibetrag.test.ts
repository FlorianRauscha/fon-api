/**
 * 2025 Gewinnfreibetrag E1a tests. Tiers carry over from 2024 (33 000 first
 * bracket ceiling); pin the rule ID and a representative cross-tier case.
 */

import { describe, expect, it } from "vitest";
import {
	GFB_TIERS_2025,
	computeBemGfb2025,
	gewinnfreibetragE1a as gfb2025,
} from "../../../src/jahr_erkl/2025/index.js";
import { computeStaffel, hasErrors, makeContext, runRules } from "../../../src/validation/index.js";

describe("Gewinnfreibetrag E1a — 2025", () => {
	it("rule.id is year-stamped", () => {
		expect(gfb2025.id).toBe("GFB-E1a-2025");
		expect(gfb2025.applies).toEqual({ form: "E1a", year: 2025 });
	});

	it("first-tier ceiling is 33 000 (carry-over from 2024)", () => {
		expect(GFB_TIERS_2025[0]).toEqual({ upTo: 33_000, rate: 0.15 });
	});

	it("computeStaffel hits 33 000 → 4 950", () => {
		expect(computeStaffel(33_000, GFB_TIERS_2025)).toBe(4_950);
	});

	it("does not fire when KZ9030 is absent", () => {
		const ctx = makeContext({ e1aSumme: 200_000, kennzahls: { 9227: 50_000 } });
		expect(gfb2025.check(ctx)).toBeNull();
	});

	it("flags GFB_EXCEEDED above the cumulative-tiered allowance", () => {
		// BEM=50 000 → 33k×15% + 17k×13% = 4_950 + 2_210 = 7_160
		// claim=8 000 → 840 over → ERROR
		const ctx = makeContext({
			e1aSumme: 42_000, // bem = e1aSumme + claim(KZ9227)=42k+8k=50k
			kennzahls: { 9030: 1, 9227: 8_000 },
		});
		const res = gfb2025.check(ctx);
		expect(res).not.toBeNull();
		const f = Array.isArray(res) ? res[0] : res;
		expect(f).toMatchObject({
			ruleId: "GFB-E1a-2025",
			severity: "error",
			code: "GFB_EXCEEDED",
			expected: 7_160,
			actual: 8_000,
		});
	});

	it("BEM=100 000 → BemFormula additivity matches direct computeStaffel", () => {
		const ctx = makeContext({
			e1aSumme: 100_000,
			kennzahls: { 9030: 1 },
		});
		const bem = computeBemGfb2025(ctx);
		expect(bem).toBe(100_000);
		// 33k×15% + 67k×13% = 4_950 + 8_710 = 13_660
		expect(computeStaffel(bem, GFB_TIERS_2025)).toBe(13_660);
	});

	it("integrates with runRules + hasErrors", () => {
		const ctx = makeContext({
			e1aSumme: 0,
			kennzahls: { 9030: 1, 9227: 1_000_000 },
		});
		const findings = runRules([gfb2025], ctx);
		expect(findings).toHaveLength(1);
		expect(hasErrors(findings)).toBe(true);
	});
});
