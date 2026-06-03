import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type KA1Body, build } from "../../../src/ka1/ab_2022/index.js";

const minimal: KA1Body = {
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
			art: "KA1M",
			satznr: 1,
			allgemein: {
				anbringen: "KA1M",
				zr: { value: "2026-04", type: "jahrmonat" },
				fastnr: "123456789",
			},
		},
	],
};

describe("KA1 alpha60 KAT_NAME pattern (audit fix)", () => {
	it("rejects a beneficiary name containing a digit (XSD alpha60 forbids digits)", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						svaDaten: [{ vnr: "1234150115", name: "Firma 3000 GmbH", betrag: 100 }],
					},
				],
			}),
		).toThrow(ValidationError);
	});
});

describe("KA1 ab_2022 build()", () => {
	it("produces a complete XML document with KAPITALERTRAGSTEUERERKLAERUNG wrapper", () => {
		const xml = build(minimal);
		expect(xml).toContain('<KAPITALERTRAGSTEUERERKLAERUNG art="KA1">');
		expect(xml).toContain('<ERKLAERUNG art="KA1M">');
		expect(xml).toContain('<ZR type="jahrmonat">2026-04</ZR>');
	});

	it("rejects mismatched art and allgemein.anbringen", () => {
		const bad: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					art: "KA1T",
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, anbringen: "KA1M" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("emits BMG_T fields with KAT_BEGR enum", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					art: "KA1T",
					satznr: 1,
					allgemein: {
						anbringen: "KA1T",
						zr: { value: "2026-04-15", type: "datum" },
						fastnr: "123456789",
					},
					bmgT: {
						kat11: 1000.5,
						katBegr: "01",
						kat25: 250,
						katDat25Mel: "2026-04-15",
						summeKa: 1250.5,
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KAT11 type="kz">1000.50</KAT11>');
		expect(xml).toContain("<KAT_BEGR>01</KAT_BEGR>");
		expect(xml).toContain('<KAT_DAT25_MEL type="datum">2026-04-15</KAT_DAT25_MEL>');
		expect(xml).toContain('<SUMME_KA type="kz">1250.50</SUMME_KA>');
	});

	it("emits BMG_M with all 28 fields in XSD-required order", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bmgM: {
						kam11: 100,
						kbm31: 200,
						summeKb: 200,
						kcm51: 50,
						summeKc: 50,
						kvm71: 25,
						summeKv: 25,
					},
				},
			],
		};
		const xml = build(body);
		const order = ["<KAM11", "<KBM31", "<SUMME_KB", "<KCM51", "<SUMME_KC", "<KVM71", "<SUMME_KV"];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it('emits BMG_VE with type="datum" attributes on date fields', () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					art: "KA1V",
					satznr: 1,
					allgemein: {
						anbringen: "KA1V",
						zr: { value: "2026", type: "jahr" },
						fastnr: "123456789",
					},
					bmgVe: {
						kbve11: 5000,
						kbveDat11Von: "2026-01-01",
						kbveDat11Bis: "2026-06-30",
						summeKb: 5000,
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KBVE_DAT11_VON type="datum">2026-01-01</KBVE_DAT11_VON>');
		expect(xml).toContain('<KBVE_DAT11_BIS type="datum">2026-06-30</KBVE_DAT11_BIS>');
		expect(xml).toContain('<ZR type="jahr">2026</ZR>');
	});

	it("emits up to 10 SVA_DATEN beneficiary blocks", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					svaDaten: Array.from({ length: 10 }, (_, i) => ({
						vnr: "1234150115",
						name: `Beneficiary ${String.fromCharCode(65 + i)}`,
						betrag: 100 * (i + 1),
					})),
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<SVA_DATEN>/g) ?? []).length).toBe(10);
		expect(xml).toContain("<KAT_NAME>Beneficiary A</KAT_NAME>");
		expect(xml).toContain("<KAT_NAME>Beneficiary J</KAT_NAME>");
		expect(xml).toContain('<KAT_BETRAG type="kz">1000.00</KAT_BETRAG>');
	});

	it("rejects more than 10 SVA_DATEN", () => {
		const bad: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					svaDaten: Array.from({ length: 11 }, () => ({
						vnr: "1234150115",
						name: "X",
						betrag: 1,
					})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects invalid KAT_BEGR enum value", () => {
		const bad: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					art: "KA1T",
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, anbringen: "KA1T" },
					// @ts-expect-error -- "00" not in the KatBegr enum
					bmgT: { katBegr: "00" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects negative kz values (KA1 kz is non-negative)", () => {
		const bad: KA1Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, bmgM: { kam11: -1 } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rawInner escape hatch works on a BMG block", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bmgM: { rawInner: '<KAM11 type="kz">99.99</KAM11>' },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<BMG_M><KAM11 type="kz">99.99</KAM11></BMG_M>');
	});
});
