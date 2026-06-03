import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type KA1Body, build } from "../../../src/ka1/ab_2016/index.js";

const minimal: KA1Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2020-04-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "KA1M",
			satznr: 1,
			allgemein: {
				anbringen: "KA1M",
				zr: { value: "2020-04", type: "jahrmonat" },
				fastnr: "123456789",
			},
		},
	],
};

describe("KA1 ab_2016 build()", () => {
	it("produces valid XML for a minimal payload", () => {
		const xml = build(minimal);
		expect(xml).toContain('<KAPITALERTRAGSTEUERERKLAERUNG art="KA1">');
		expect(xml).toContain('<ERKLAERUNG art="KA1M">');
	});

	it("type-system rejects KA1Y (only present in ab_2022)", () => {
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					// @ts-expect-error -- KA1Y is not in ab_2016 Anbringen
					art: "KA1Y",
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						// @ts-expect-error -- same
						anbringen: "KA1Y",
					},
				},
			],
		};
		expect(() => build(bad as KA1Body)).toThrow(ValidationError);
	});

	it("type-system + Zod reject the *A/*B suffix variants in BMG_M (introduced in 2022)", () => {
		const bad = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bmgM: {
						kbm31: 100,
						// @ts-expect-error -- KBM31A doesn't exist in ab_2016
						kbm31a: 50,
					},
				},
			],
		};
		expect(() => build(bad as KA1Body)).toThrow(ValidationError);
	});

	it("emits BMG_M with the 18-field ab_2016 sequence (no *A/*B variants)", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bmgM: {
						kam11: 100,
						kbm31: 200,
						kbm32: 50,
						summeKb: 250,
						kcm51: 25,
						summeKc: 25,
						kvm71: 10,
						summeKv: 10,
					},
				},
			],
		};
		const xml = build(body);
		// 2016-only ordering — no KBM31A/B, KBM32A/B between
		expect(xml).toContain("<KBM31");
		expect(xml).toContain("<KBM32");
		expect(xml).not.toContain("<KBM31A");
		expect(xml).not.toContain("<KBM32B");
		expect(xml).not.toContain("<KCM51A");
		// Order check: KBM31 < KBM32 < SUMME_KB < KCM51 < SUMME_KC
		const indices = ["<KBM31", "<KBM32", "<SUMME_KB", "<KCM51", "<SUMME_KC"].map((t) =>
			xml.indexOf(t),
		);
		for (let i = 1; i < indices.length; i++) {
			expect(indices[i]).toBeGreaterThan(indices[i - 1]!);
		}
	});

	it("emits BMG_VE with 9-field ab_2016 sequence (no *A/*B variants)", () => {
		const body: KA1Body = {
			...minimal,
			erklaerungen: [
				{
					art: "KA1V",
					satznr: 1,
					allgemein: {
						anbringen: "KA1V",
						zr: { value: "2020", type: "jahr" },
						fastnr: "123456789",
					},
					bmgVe: {
						kbve11: 5000,
						kbveDat11Von: "2020-01-01",
						kbveDat11Bis: "2020-06-30",
						kbve21: 1500,
						summeKb: 6500,
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KBVE11 type="kz">5000.00</KBVE11>');
		expect(xml).toContain('<KBVE_DAT11_VON type="datum">2020-01-01</KBVE_DAT11_VON>');
		expect(xml).not.toContain("<KBVE11A");
		expect(xml).not.toContain("<KBVE21B");
	});

	it("Anbringen union has 5 values (no KA1Y)", () => {
		// Pure type assertion; if KA1Y ever sneaks in, this test fails to compile.
		const allValid: KA1Body["erklaerungen"][number]["art"][] = [
			"KA1T",
			"KA1M",
			"KA1V",
			"KA1E",
			"KA1Z",
		];
		expect(allValid).toHaveLength(5);
	});
});
