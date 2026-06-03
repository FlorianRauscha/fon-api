import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type StabBody, build } from "../../../src/stab/current/index.js";

const minimal: StabBody = {
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
			art: "STAB",
			satznr: 1,
			allgemein: { anbringen: "STAB", zr: "2025", fastnr: "123456789" },
			bemessungsgrundlage: { bemSta3: 100_000_000, jahrUeb: 5_000_000 },
		},
	],
};

describe("STAB audit fixes", () => {
	it("rejects a FASTNR below the XSD floor 030000010", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						allgemein: { ...minimal.erklaerungen[0]!.allgemein, fastnr: "025000000" },
					},
				],
			}),
		).toThrow(ValidationError);
	});

	it("accepts NEUGR='N' (XSD wahl enum allows {J,N})", () => {
		const xml = build({
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, bemessungsgrundlage: { neugr: "N" } }],
		});
		expect(xml).toContain("<NEUGR>N</NEUGR>");
	});
});

describe("STAB build()", () => {
	it("emits valid bank-fee filing XML", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="STAB">');
		expect(xml).toContain("<ANBRINGEN>STAB</ANBRINGEN>");
		expect(xml).toContain('<BEM_STA3 type="kz">100000000.00</BEM_STA3>');
		expect(xml).toContain('<JAHR_UEB type="kz">5000000.00</JAHR_UEB>');
	});

	it("emits NEUGR flag and BEL_OG when set", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: { neugr: "J", belOg: 1_500_000 },
				},
			],
		});
		expect(xml).toContain("<NEUGR>J</NEUGR>");
		expect(xml).toContain('<BEL_OG type="kz">1500000.00</BEL_OG>');
	});

	it("emits BEMESSUNGSGRUNDLAGE children in XSD-required order", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: {
						bemSta3: 1,
						neugr: "J",
						jahrUeb: 2,
						belOg: 3,
					},
				},
			],
		});
		const order = ["<BEM_STA3", "<NEUGR>", "<JAHR_UEB", "<BEL_OG"];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("supports negative kz (corrections)", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					bemessungsgrundlage: { bemSta3: -250_000 },
				},
			],
		});
		expect(xml).toContain('<BEM_STA3 type="kz">-250000.00</BEM_STA3>');
	});

	it("respects 300-Erklärungen cap", () => {
		const bad: StabBody = {
			info: { ...minimal.info, anzahlErklaerungen: 301 },
			erklaerungen: Array.from({ length: 301 }, (_, i) => ({
				...minimal.erklaerungen[0]!,
				satznr: i + 1,
			})),
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed ZR (must be YYYY)", () => {
		const bad: StabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein!, zr: "2025-Q1" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
