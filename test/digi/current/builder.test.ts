import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type DigiBody, build } from "../../../src/digi/current/index.js";

const minimal: DigiBody = {
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
			art: "DIGI",
			satznr: 1,
			allgemein: { anbringen: "DIGI", zr: "2025", fastnr: "123456789" },
			bemessungsgrundlage: {
				artLeistung: "BA",
				ortLtg: "Wien, Österreich",
				wjBeg: "202501",
				wjEnde: "202512",
				ums212a: 1_000_000,
				entgelt: 850_000,
				bemGes: 850_000,
			},
		},
	],
};

describe("DIGI XSD floor regression (audit fix)", () => {
	it("rejects a FASTNR below the XSD floor 020000010", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						allgemein: { ...minimal.erklaerungen[0]!.allgemein, fastnr: "015000000" },
					},
				],
			}),
		).toThrow(ValidationError);
	});
});

describe("DIGI build()", () => {
	it("produces XML with full BEMESSUNGSGRUNDLAGE", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="DIGI">');
		expect(xml).toContain("<ARTLEIST>BA</ARTLEIST>");
		expect(xml).toContain("<ORT_LTG>Wien, Österreich</ORT_LTG>");
		expect(xml).toContain("<WJ_BEG>202501</WJ_BEG>");
		expect(xml).toContain("<WJ_ENDE>202512</WJ_ENDE>");
		expect(xml).toContain('<UMS_212a type="kz">1000000.00</UMS_212a>');
		expect(xml).toContain('<BEM_GES type="kz">850000.00</BEM_GES>');
	});

	it("supports all 3 ARTLEIST enum values", () => {
		for (const code of ["BA", "SU", "SO"] as const) {
			const xml = build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						bemessungsgrundlage: {
							...minimal.erklaerungen[0]!.bemessungsgrundlage!,
							artLeistung: code,
						},
					},
				],
			});
			expect(xml).toContain(`<ARTLEIST>${code}</ARTLEIST>`);
		}
	});

	it("emits AUSG when provided, omits when undefined", () => {
		const withAusg = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: { ...minimal.erklaerungen[0]!.bemessungsgrundlage!, ausg: 50_000 },
				},
			],
		});
		expect(withAusg).toContain('<AUSG type="kz">50000.00</AUSG>');
		expect(build(minimal)).not.toContain("<AUSG");
	});

	it("rejects invalid ARTLEIST", () => {
		const bad: DigiBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: {
						...minimal.erklaerungen[0]!.bemessungsgrundlage!,
						// @ts-expect-error -- "XX" not in enum
						artLeistung: "XX",
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed WJ_BEG (must be YYYYMM)", () => {
		const bad: DigiBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: {
						...minimal.erklaerungen[0]!.bemessungsgrundlage!,
						wjBeg: "2025-01",
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects ORT_LTG longer than 50 chars", () => {
		const bad: DigiBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: {
						...minimal.erklaerungen[0]!.bemessungsgrundlage!,
						ortLtg: "x".repeat(51),
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects DIGI's lower 300-Erklärungen cap", () => {
		const bad: DigiBody = {
			info: { ...minimal.info, anzahlErklaerungen: 301 },
			erklaerungen: Array.from({ length: 301 }, (_, i) => ({
				...minimal.erklaerungen[0]!,
				satznr: i + 1,
			})),
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("supports negative ENTGELT (corrections)", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: {
						...minimal.erklaerungen[0]!.bemessungsgrundlage!,
						entgelt: -50_000,
					},
				},
			],
		});
		expect(xml).toContain('<ENTGELT type="kz">-50000.00</ENTGELT>');
	});
});
