import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type VatabBody, build } from "../../../src/vatab/current/index.js";

const minimal: VatabBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:00:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "VATAB",
			satznr: 1,
			allgemein: {
				anbringen: "VATAB",
				zrvon: "2026-01",
				zrbis: "2026-12",
				fastnr: "123456789",
				euLand: "DE",
				emailUnternehmer: "owner@example.com",
				nace: ["4711"],
				kontoinhaber: "Acme GmbH",
				inhabertyp: "A",
				iban: "AT611904300234573201",
				bic: "BKAUATWWXXX",
				waehrBank: "EUR",
				frage1a: "J",
				frage1b: "N",
				frage1c: "N",
			},
			abschluss: {
				gesamtKauf: 5,
				gesamtBmgKauf: 12_500,
				gesamtImport: 0,
				gesamtBmgImport: 0,
			},
		},
	],
};

describe("VATAB build()", () => {
	it("emits well-formed VATAB Erklärung", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain('<ERKLAERUNG art="VATAB">');
		expect(xml).toContain("<ANBRINGEN>VATAB</ANBRINGEN>");
		expect(xml).toContain("<EMAIL_UNTERNEHMER>owner@example.com</EMAIL_UNTERNEHMER>");
		expect(xml).toContain("<NACE>4711</NACE>");
		expect(xml).toContain("<KONTOINHABER>Acme GmbH</KONTOINHABER>");
		expect(xml).toContain("<INHABERTYP>A</INHABERTYP>");
		expect(xml).toContain("<IBAN>AT611904300234573201</IBAN>");
		expect(xml).toContain("<BIC>BKAUATWWXXX</BIC>");
		expect(xml).toContain("<WAEHR_BANK>EUR</WAEHR_BANK>");
		expect(xml).toContain("<FRAGE_1A>J</FRAGE_1A>");
		expect(xml).toContain("<GESAMT_KAUF>5</GESAMT_KAUF>");
		expect(xml).toContain("<GESAMT_BMG_KAUF>12500.00</GESAMT_BMG_KAUF>");
	});

	it("emits ALLGEMEINE_DATEN children in XSD-required order", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						antragnr: "AT12345678901234",
						kundeninfo: "ref",
						emailVertreter: "rep@example.com",
						nace: ["4711", "5611"],
						frage2a: "J",
						frage2b: "N",
					},
				},
			],
		});
		const order = [
			"<ANBRINGEN",
			"<ANTRAGNR",
			"<ZRVON",
			"<ZRBIS",
			"<FASTNR",
			"<KUNDENINFO",
			"<EU_LAND",
			"<EMAIL_UNTERNEHMER",
			"<EMAIL_VERTRETER",
			"<NACE",
			"<KONTOINHABER",
			"<INHABERTYP",
			"<IBAN",
			"<BIC",
			"<WAEHR_BANK",
			"<FRAGE_1A",
			"<FRAGE_1B",
			"<FRAGE_1C",
			"<FRAGE_2A",
			"<FRAGE_2B",
		];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits up to 5 NACE codes in declared order", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						nace: ["4711", "5611", "6210", "7020", "8210"],
					},
				},
			],
		});
		expect(xml.match(/<NACE>/g)?.length).toBe(5);
		const idx = ["4711", "5611", "6210", "7020", "8210"].map((c) =>
			xml.indexOf(`<NACE>${c}</NACE>`),
		);
		idx.reduce((prev, cur) => {
			expect(cur).toBeGreaterThan(prev);
			return cur;
		}, -1);
	});

	it("emits ABSCHLUSS without ANHANG when no PDF attached", () => {
		const xml = build(minimal);
		expect(xml).toContain("<ABSCHLUSS>");
		expect(xml).not.toContain("<ANHANG>");
	});

	it('emits PDF_ANHANG with ART="PDF" attribute when set', () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					abschluss: {
						...minimal.erklaerungen[0]!.abschluss,
						anhang: { pdf: { base64: "JVBERi0xLjQKJeLjz9MK..." } },
					},
				},
			],
		});
		expect(xml).toContain(
			'<ANHANG><PDF_ANHANG ART="PDF">JVBERi0xLjQKJeLjz9MK...</PDF_ANHANG></ANHANG>',
		);
	});

	it("rejects ANTRAGNR with letters (VATAB requires digits-only)", () => {
		const bad: VatabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, antragnr: "ATABCDEF12345678" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed IBAN (non-EU prefix)", () => {
		const bad: VatabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, iban: "US12345678901234" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects unknown NACE code", () => {
		const bad: VatabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, nace: ["9999"] },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed email", () => {
		const bad: VatabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						emailUnternehmer: "not-an-email",
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 5-NACE cap", () => {
		const bad: VatabBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						nace: ["4711", "4712", "4721", "4722", "4723", "4724"],
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
