/**
 * L1 2022 differs from L1 2023 in three places:
 *  1. BEHINDERUNG_STEUERPFLICHTIGER / _PARTNER each carry an `AUS29B_S` /
 *     `AUS29B_P` flag (removed in 2023).
 *  2. The per-month FB grid carries an extra `FB{n}_WS` country-code field
 *     (removed in 2023).
 *  3. INTERNATIONAL drops `AUSL_EIN`, `KZ183`, `KZ184`, `SV_184` (added in 2023).
 */

import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type L1Body, SCHEMA_VERSION, TAX_YEAR, build } from "../../../src/l1/2022/index.js";

const minimal: L1Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2023-04-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: {
				anbringen: "L1",
				zr: "2022",
				fastnr: "123456789",
				anzbez: 1,
			},
		},
	],
};

describe("L1 2022 build()", () => {
	it("year stamps", () => {
		expect(TAX_YEAR).toBe(2022);
		expect(SCHEMA_VERSION).toBe("2022");
	});

	it("emits AUS29B_S / AUS29B_P flags inside BEHINDERUNG_*", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						behinderung: {
							steuerpflichtiger: { koerperS: 50, aus29bS: "J" },
							partner: { koerperP: 30, aus29bP: "J" },
						},
					},
				},
			],
		});
		expect(xml).toContain("<AUS29B_S>J</AUS29B_S>");
		expect(xml).toContain("<AUS29B_P>J</AUS29B_P>");
	});

	it("emits FB{n}_WS country-code field on the FB month grid", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [
								{
									famname: "Test",
									vorname: "Kid",
									fbMonate: { 1: { fb50: "J", ws: "D" }, 6: { fb100: "J", ws: "D" } },
								},
							],
						},
					},
				},
			],
		});
		expect(xml).toContain("<FB1_WS>D</FB1_WS>");
		expect(xml).toContain("<FB6_WS>D</FB6_WS>");
	});

	it("rejects 2023-only INTERNATIONAL fields", () => {
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: { auslEin: "J" } as Record<string, string>,
				},
			],
		} as unknown as L1Body;
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
