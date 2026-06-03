import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type SbBody, build } from "../../../src/sb/current/index.js";

const minimal: SbBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "SB",
			allgemein: { satznr: 1, anbringen: "SB", fastnr: "123456789" },
			verrechnungsweisungen: [
				{
					aa: "030",
					zrvon: { value: "2026-03", type: "jahrmonat" },
					zrbis: { value: "2026-03", type: "jahrmonat" },
					betrag: 1500,
				},
			],
		},
	],
};

describe("SB build()", () => {
	it("produces a valid Buchung Sonderbescheid XML", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="SB">');
		expect(xml).toContain("<SATZNR>1</SATZNR><ANBRINGEN>SB</ANBRINGEN>");
		expect(xml).toContain("<AA>030</AA>");
		expect(xml).toContain('<ZRVON type="jahrmonat">2026-03</ZRVON>');
		expect(xml).toContain('<BETRAG type="kz">1500.00</BETRAG>');
	});

	it("emits up to 20 VERRECHNUNGSWEISUNGEN with mixed ZR types", () => {
		const body: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					uvaZeitraum: { uvazrvon: "2026-01", uvazrbis: "2026-12" },
					verrechnungsweisungen: [
						{
							aa: "030",
							zrvon: { value: "2026-01-01", type: "datum" },
							zrbis: { value: "2026-12-31", type: "datum" },
							betrag: 5000,
						},
						{
							aa: "445",
							zrvon: { value: "2025", type: "jahr" },
							zrbis: { value: "2025", type: "jahr" },
							betrag: -250.5,
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<UVA_ZEITRAUM><UVAZRVON type="jahrmonat">2026-01</UVAZRVON>');
		expect(xml).toContain('<ZRVON type="datum">2026-01-01</ZRVON>');
		expect(xml).toContain('<ZRVON type="jahr">2025</ZRVON>');
		expect(xml).toContain('<BETRAG type="kz">-250.50</BETRAG>');
		expect((xml.match(/<VERRECHNUNGSWEISUNGEN>/g) ?? []).length).toBe(2);
	});

	it("rejects unknown AA code", () => {
		const bad: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: [
						{
							// @ts-expect-error -- "999" is not in AaCode
							aa: "999",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 100,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects more than 20 VERRECHNUNGSWEISUNGEN", () => {
		const bad: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: Array.from({ length: 21 }, () => ({
						aa: "030" as const,
						zrvon: { value: "2026-03", type: "jahrmonat" as const },
						zrbis: { value: "2026-03", type: "jahrmonat" as const },
						betrag: 1,
					})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("emits all 20 VERRECHNUNGSWEISUNGEN when packet is full", () => {
		const body: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: Array.from({ length: 20 }, (_, i) => ({
						aa: "030" as const,
						zrvon: { value: "2026-03", type: "jahrmonat" as const },
						zrbis: { value: "2026-03", type: "jahrmonat" as const },
						betrag: 100 * (i + 1),
					})),
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<VERRECHNUNGSWEISUNGEN>/g) ?? []).length).toBe(20);
	});

	it("rejects ZRVON with empty value", () => {
		const bad: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: [
						{
							aa: "030",
							zrvon: { value: "", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 100,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("supports negative BETRAG (corrections)", () => {
		const body: SbBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: [
						{
							aa: "163",
							zrvon: { value: "2025", type: "jahr" },
							zrbis: { value: "2025", type: "jahr" },
							betrag: -1500.75,
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<BETRAG type="kz">-1500.75</BETRAG>');
	});
});
