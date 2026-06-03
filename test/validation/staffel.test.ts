import { describe, expect, it } from "vitest";
import { type Tier, computeStaffel } from "../../src/validation/staffel.js";

const TIERS_2024: ReadonlyArray<Tier> = [
	{ upTo: 33_000, rate: 0.15 },
	{ upTo: 178_000, rate: 0.13 },
	{ upTo: 353_000, rate: 0.07 },
	{ upTo: 583_000, rate: 0.045 },
	{ upTo: Number.POSITIVE_INFINITY, rate: 0 },
];

const TIERS_2023: ReadonlyArray<Tier> = [
	{ upTo: 30_000, rate: 0.15 },
	{ upTo: 178_000, rate: 0.13 },
	{ upTo: 353_000, rate: 0.07 },
	{ upTo: 583_000, rate: 0.045 },
	{ upTo: Number.POSITIVE_INFINITY, rate: 0 },
];

describe("computeStaffel — Gewinnfreibetrag tier math", () => {
	it("returns 0 for non-positive base", () => {
		expect(computeStaffel(0, TIERS_2024)).toBe(0);
		expect(computeStaffel(-100, TIERS_2024)).toBe(0);
	});

	it("2024: base entirely in first tier", () => {
		expect(computeStaffel(20_000, TIERS_2024)).toBe(3_000); // 20000 × 15%
		expect(computeStaffel(33_000, TIERS_2024)).toBe(4_950); // 33000 × 15%
	});

	it("2024: base spans first two tiers", () => {
		// 33k × 15% + 17k × 13% = 4950 + 2210 = 7160
		expect(computeStaffel(50_000, TIERS_2024)).toBe(7_160);
		// 33k × 15% + 67k × 13% = 4950 + 8710 = 13_660
		expect(computeStaffel(100_000, TIERS_2024)).toBe(13_660);
	});

	it("2024: base reaches the 178k boundary", () => {
		// 33k × 15% + 145k × 13% = 4950 + 18850 = 23_800
		expect(computeStaffel(178_000, TIERS_2024)).toBe(23_800);
	});

	it("2024: base reaches the 583k cap", () => {
		// 4950 + 18850 + 175k×7% + 230k×4.5%
		//      = 4950 + 18850 + 12250 + 10350 = 46_400
		expect(computeStaffel(583_000, TIERS_2024)).toBe(46_400);
	});

	it("2024: base above 583k stays at 46_400 (rate=0 above)", () => {
		expect(computeStaffel(1_000_000, TIERS_2024)).toBe(46_400);
		expect(computeStaffel(10_000_000, TIERS_2024)).toBe(46_400);
	});

	it("2023: first-tier ceiling change from 33k to 30k", () => {
		// 2023 BEM=30k → 4500, 2024 BEM=30k → 4500 (same: still all in first bracket)
		expect(computeStaffel(30_000, TIERS_2023)).toBe(4_500);
		expect(computeStaffel(30_000, TIERS_2024)).toBe(4_500);
		// At 33k: 2023 spills into second bracket, 2024 is still all in first
		// 2023: 30k × 15% + 3k × 13% = 4500 + 390 = 4890
		expect(computeStaffel(33_000, TIERS_2023)).toBe(4_890);
		// 2024: 33k × 15% = 4950
		expect(computeStaffel(33_000, TIERS_2024)).toBe(4_950);
	});

	it("rounds to cents (base spilling slightly into the next tier)", () => {
		// 33_000 × 15% + 0.33 × 13% = 4950 + 0.0429 = 4950.0429 → rounds to 4950.04
		expect(computeStaffel(33_000.33, TIERS_2024)).toBe(4_950.04);
	});
});
