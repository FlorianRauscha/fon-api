/**
 * L1 2024 differs from L1 2025 only in two new Kennzahls (KZ117, KZ118 added in
 * 2025's BESONDERE_SONDERAUSGABEN_VERTEILUNG section). The vast bulk of the
 * builder logic is identical and exhaustively tested in test/l1/2025/.
 * This file pins the year-specific behaviour:
 *  - the 2024 module exports TAX_YEAR=2024 / SCHEMA_VERSION="2024"
 *  - typed bodies that include the 2025-only fields fail Zod validation
 *  - typed bodies that exclude those fields round-trip cleanly
 */

import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type L1Body, SCHEMA_VERSION, TAX_YEAR, build } from "../../../src/l1/2024/index.js";

const minimal: L1Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2025-04-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: {
				anbringen: "L1",
				zr: "2024",
				fastnr: "123456789",
				anzbez: 1,
			},
		},
	],
};

describe("L1 2024 build()", () => {
	it("year stamps", () => {
		expect(TAX_YEAR).toBe(2024);
		expect(SCHEMA_VERSION).toBe("2024");
	});

	it("emits well-formed minimal L1 2024 XML", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain('<ERKLAERUNG art="L1">');
		expect(xml).toContain("<ANBRINGEN>L1</ANBRINGEN>");
		expect(xml).toContain("<ZR>2024</ZR>");
	});

	it("rejects bodies whose extra fields aren't part of the 2024 surface", () => {
		// kz117 was added in 2025; the strict() Zod schema should reject it on 2024.
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: { kz117: 100 } as Record<string, number>,
				},
			],
		} as unknown as L1Body;
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("typed BESONDERE_SONDERAUSGABEN_VERTEILUNG omitting KZ117/KZ118 round-trips", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: {
						kz281: 100,
						zus1D: "J",
						kz283: 50,
					},
				},
			],
		});
		expect(xml).toContain("<KZ281");
		expect(xml).toContain("<ZUS1_D>J</ZUS1_D>");
		expect(xml).toContain("<KZ283");
		expect(xml).not.toContain("<KZ117");
		expect(xml).not.toContain("<KZ118");
	});
});
