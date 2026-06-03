import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type KomuBody, build } from "../../../src/komu/current/index.js";

const minimal: KomuBody = {
	info: {
		artIdentifikationsbegriff: "GD",
		identifikationsbegriff: "12345",
		paketNr: 1,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:00:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "KOMU",
			satznr: 1,
			anbringen: "KOM",
			zr: "2025",
			fastnr: "123456789",
			bmg: 250_000,
			vb: "N",
			km: "J",
			ns: "N",
		},
	],
};

describe("KOMU build()", () => {
	it("emits well-formed KOMU upload XML", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain("<ERKLAERUNGS_UEBERMITTLUNG>");
		expect(xml).toContain("<ART_IDENTIFIKATIONSBEGRIFF>GD</ART_IDENTIFIKATIONSBEGRIFF>");
		expect(xml).toContain("<IDENTIFIKATIONSBEGRIFF>12345</IDENTIFIKATIONSBEGRIFF>");
		expect(xml).toContain('<ERKLAERUNG art="KOMU">');
		expect(xml).toContain("<ANBRINGEN>KOM</ANBRINGEN>");
		expect(xml).toContain("<ZR>2025</ZR>");
		expect(xml).toContain('<BMG type="kz">250000.00</BMG>');
		expect(xml).toContain("<VB>N</VB>");
		expect(xml).toContain("<KM>J</KM>");
		expect(xml).toContain("<NS>N</NS>");
	});

	it("emits MIT only when set", () => {
		const without = build(minimal);
		expect(without).not.toContain("<MIT>");
		const withMit = build({
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, mit: "Berichtigung lt. Lohnverrechnung" }],
		});
		expect(withMit).toContain("<MIT>Berichtigung lt. Lohnverrechnung</MIT>");
	});

	it("emits ERKLAERUNG children in XSD-required order", () => {
		const xml = build({
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, mit: "memo" }],
		});
		const order = [
			"<SATZNR>",
			"<ANBRINGEN>",
			"<ZR>",
			"<FASTNR>",
			"<BMG",
			"<MIT>",
			"<VB>",
			"<KM>",
			"<NS>",
		];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects negative BMG (kznull is non-negative)", () => {
		const bad: KomuBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, bmg: -1 }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed Gemeindekennzahl (must be 5 digits)", () => {
		const bad: KomuBody = {
			...minimal,
			info: { ...minimal.info, identifikationsbegriff: "123" },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed ZR (must be YYYY)", () => {
		const bad: KomuBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, zr: "25" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects info.anzahlErklaerungen invariant", () => {
		const bad: KomuBody = {
			...minimal,
			info: { ...minimal.info, anzahlErklaerungen: 2 },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 32 768-Erklärung cap", () => {
		const bad: KomuBody = {
			...minimal,
			info: { ...minimal.info, anzahlErklaerungen: 32_769 },
			erklaerungen: Array.from({ length: 32_769 }, (_, i) => ({
				...minimal.erklaerungen[0]!,
				satznr: i + 1,
			})),
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
