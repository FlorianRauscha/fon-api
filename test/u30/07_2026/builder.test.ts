import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type U30Body, build } from "../../../src/u30/07_2026/index.js";

const minimal: U30Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2026-08-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U30",
			satznr: 1,
			allgemein: {
				anbringen: "U30",
				zrvon: "2026-07",
				zrbis: "2026-07",
				fastnr: "123456789",
			},
			lieferungen: {
				kz000: 0,
			},
		},
	],
};

describe("U30 07_2026 build()", () => {
	it("produces a complete XML document with prolog", () => {
		const xml = build(minimal);
		expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
		expect(xml).toContain("<ERKLAERUNGS_UEBERMITTLUNG>");
		expect(xml).toContain("</ERKLAERUNGS_UEBERMITTLUNG>");
	});

	it("emits the INFO_DATEN children in XSD-required order", () => {
		const xml = build(minimal);
		const expectedOrder = [
			"<ART_IDENTIFIKATIONSBEGRIFF>",
			"<IDENTIFIKATIONSBEGRIFF>",
			"<PAKET_NR>",
			'<DATUM_ERSTELLUNG type="datum">',
			'<UHRZEIT_ERSTELLUNG type="uhrzeit">',
			"<ANZAHL_ERKLAERUNGEN>",
		];
		let last = -1;
		for (const tag of expectedOrder) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits each ERKLAERUNG with required art attribute", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="U30">');
	});

	it('emits ZRVON/ZRBIS with type="jahrmonat" attribute', () => {
		const xml = build(minimal);
		expect(xml).toContain('<ZRVON type="jahrmonat">2026-07</ZRVON>');
		expect(xml).toContain('<ZRBIS type="jahrmonat">2026-07</ZRBIS>');
	});

	it('formats KZ values with 2 fraction digits and type="kz" attribute', () => {
		const body: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					lieferungen: { kz000: 12345.6, kz001: 5000 },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KZ000 type="kz">12345.60</KZ000>');
		expect(xml).toContain('<KZ001 type="kz">5000.00</KZ001>');
	});

	it("includes the new KZ124/KZ125 fields introduced in 07_2026", () => {
		const body: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					lieferungen: {
						kz000: 100,
						versteuert: { kz022: 50, kz124: 25 },
					},
					innergemeinschaftlich: {
						versteuertIge: { kz072: 10, kz125: 5 },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<KZ124 type="kz">25.00</KZ124>');
		expect(xml).toContain('<KZ125 type="kz">5.00</KZ125>');
	});

	it("skips optional fields when undefined (never emits empty tags)", () => {
		const xml = build(minimal);
		expect(xml).not.toContain("<KUNDENINFO");
		expect(xml).not.toContain("<STEUERFREI");
		expect(xml).not.toContain("<VERSTEUERT");
		expect(xml).not.toContain("<INNERGEMEINSCHAFTLICHE_ERWERBE");
		expect(xml).not.toContain("<VORSTEUER");
	});

	it("emits VORSTEUER children in XSD order including signed kzvorz fields", () => {
		const body: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					vorsteuer: { kz060: 1000, kz063: -250.5, kz090: -200 },
				},
			],
		};
		const xml = build(body);
		const order = ["<KZ060", "<KZ063", "<KZ090"];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
		expect(xml).toContain('<KZ063 type="kz">-250.50</KZ063>');
		expect(xml).toContain('<KZ090 type="kz">-200.00</KZ090>');
	});

	it("escapes XML entities in free-text fields", () => {
		const body: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, kundeninfo: "Müller & Co <test>" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<KUNDENINFO>Müller &amp; Co &lt;test&gt;</KUNDENINFO>");
	});

	it("rejects invalid FASTNR via Zod", () => {
		const bad: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, fastnr: "12345" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects mismatch between info.anzahlErklaerungen and erklaerungen.length", () => {
		const bad: U30Body = { ...minimal, info: { ...minimal.info, anzahlErklaerungen: 5 } };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects KZ000 below zero (kznull >= 0)", () => {
		const bad: U30Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, lieferungen: { kz000: -5 } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects KZ001 of 0 (kz must be > 0)", () => {
		const bad: U30Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, lieferungen: { kz000: 100, kz001: 0 } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("can opt out of validation with { validate: false }", () => {
		const bad: U30Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, fastnr: "12345" },
				},
			],
		};
		expect(() => build(bad, { validate: false })).not.toThrow();
	});
});
