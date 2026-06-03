import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type U30Body, build } from "../../../src/u30/01_2022/index.js";

const minimal: U30Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2024-04-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U30",
			satznr: 1,
			allgemein: {
				anbringen: "U30",
				zrvon: "2024-03",
				zrbis: "2024-03",
				fastnr: "123456789",
			},
			lieferungen: { kz000: 0 },
		},
	],
};

describe("U30 01_2022 build()", () => {
	it("produces valid XML for a minimal payload", () => {
		const xml = build(minimal);
		expect(xml).toContain("<ERKLAERUNGS_UEBERMITTLUNG>");
		expect(xml).toContain('<ERKLAERUNG art="U30">');
	});

	it("type-system rejects KZ124/KZ125 (only present in 07_2026)", () => {
		// Compile-time check via @ts-expect-error.
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					lieferungen: {
						kz000: 100,
						versteuert: {
							kz022: 50,
							// @ts-expect-error -- KZ124 does not exist in 01_2022
							kz124: 10,
						},
					},
				},
			],
		};
		// At runtime, Zod's strict() will reject the extra key.
		expect(() => build(bad as U30Body)).toThrow(ValidationError);
	});

	it("validates a realistic payload with VERSTEUERT and VORSTEUER", () => {
		const body: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					lieferungen: {
						kz000: 50000,
						kz001: 40000,
						versteuert: { kz022: 35000, kz029: 5000 },
					},
					vorsteuer: { kz060: 7000, kz090: -200 },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KZ022 type="kz">35000.00</KZ022>');
		expect(xml).toContain('<KZ090 type="kz">-200.00</KZ090>');
		// The 07_2026 fields must NOT appear:
		expect(xml).not.toContain("<KZ124");
		expect(xml).not.toContain("<KZ125");
	});
});
