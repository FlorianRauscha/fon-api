/**
 * L1 2023 differs from L1 2024 only in four INTERNATIONAL-section fields
 * (`AUSL_NSA`, `KZ187`, `KZ188`, `STS_275`) added in 2024. All other sections
 * are identical, so the broader builder behaviour is exhaustively tested in
 * test/l1/2024/ and test/l1/2025/. This file pins the year-specific behaviour.
 */

import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type L1Body, SCHEMA_VERSION, TAX_YEAR, build } from "../../../src/l1/2023/index.js";

const minimal: L1Body = {
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
			art: "L1",
			satznr: 1,
			allgemein: {
				anbringen: "L1",
				zr: "2023",
				fastnr: "123456789",
				anzbez: 1,
			},
		},
	],
};

describe("L1 2023 build()", () => {
	it("year stamps", () => {
		expect(TAX_YEAR).toBe(2023);
		expect(SCHEMA_VERSION).toBe("2023");
	});

	it("emits well-formed minimal L1 2023 XML", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="L1">');
		expect(xml).toContain("<ZR>2023</ZR>");
	});

	it("rejects 2024-only INTERNATIONAL fields", () => {
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: { auslNsa: "J" } as Record<string, string>,
				},
			],
		} as unknown as L1Body;
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("typed INTERNATIONAL omitting 2024-only fields round-trips", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: {
						auslEin: "J",
						kz359: 1_000,
						kz154: 200,
						land1L1: "D",
					},
				},
			],
		});
		expect(xml).toContain("<AUSL_EIN>J</AUSL_EIN>");
		expect(xml).toContain("<LAND1_L1>D</LAND1_L1>");
		expect(xml).not.toContain("<AUSL_NSA");
		expect(xml).not.toContain("<KZ187");
		expect(xml).not.toContain("<KZ188");
		expect(xml).not.toContain("<STS_275");
	});
});
