import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type VatBody, build } from "../../../src/vat/current/index.js";

const minimal: VatBody = {
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
			art: "VAT",
			satznr: 1,
			allgemein: {
				anbringen: "VAT",
				zrvon: "2026-01",
				zrbis: "2026-03",
				fastnr: "123456789",
				euLand: "DE",
			},
			kaeufe: [
				{
					seqnr: 1,
					beznr: "INV-2026-001",
					datum: "2026-02-15",
					kleinbetr: "N",
					uid: "DE123456789",
					name: "Lieferant GmbH",
					adr: "Hauptstr 1",
					plz: "10115",
					stadt: "Berlin",
					land: "DE",
					gegenstaende: [{ code: 1, beschreibung: "Kraftstoff" }],
					grundlagen: { waehrung: "EUR", bmg: 1000, vst: 190, abvst: 190 },
				},
			],
		},
	],
};

describe("VAT XSD pattern regression (audit fix)", () => {
	it("rejects a single-char BEZNR_K (XSD requires >=2 ASCII chars ending with a digit)", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						kaeufe: [{ ...minimal.erklaerungen[0]!.kaeufe![0]!, beznr: "5" }],
					},
				],
			}),
		).toThrow(ValidationError);
	});

	it("rejects a non-EU UID_K prefix (XSD restricts to EU member-state codes)", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{
						...minimal.erklaerungen[0]!,
						kaeufe: [{ ...minimal.erklaerungen[0]!.kaeufe![0]!, uid: "ZZ123456" }],
					},
				],
			}),
		).toThrow(ValidationError);
	});
});

describe("VAT build()", () => {
	it("emits well-formed VAT-Refund Antrag XML", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain("<ERKLAERUNGS_UEBERMITTLUNG>");
		expect(xml).toContain('<ERKLAERUNG art="VAT">');
		expect(xml).toContain("<ANBRINGEN>VAT</ANBRINGEN>");
		expect(xml).toContain('<ZRVON type="jahrmonat">2026-01</ZRVON>');
		expect(xml).toContain('<ZRBIS type="jahrmonat">2026-03</ZRBIS>');
		expect(xml).toContain("<EU_LAND>DE</EU_LAND>");
		expect(xml).toContain("<KAUF>");
		expect(xml).toContain("<CODE_K>1</CODE_K>");
		expect(xml).toContain("<WAEHR_K>EUR</WAEHR_K>");
		expect(xml).toContain("<BMG_K>1000.00</BMG_K>");
	});

	it("emits ANTRAGNR + KUNDENINFO + SPRACHE in XSD-required order", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						antragnr: "AT12345678901234",
						kundeninfo: "Reference 42",
						sprache: "de",
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
			"<SPRACHE",
		];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits IMPORT with _I-suffixed nested elements", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					kaeufe: undefined,
					importe: [
						{
							seqnr: 1,
							importnr: "IM-2026-7",
							datum: "2026-02-15",
							name: "Importer Co",
							adr: "Customs Way 1",
							plz: "00000",
							stadt: "Hong Kong",
							land: "HK",
							gegenstaende: [{ code: 4 }],
							grundlagen: { waehrung: "EUR", bmg: 500, vst: 100, abvst: 100 },
						},
					],
				},
			],
		});
		expect(xml).toContain("<IMPORT>");
		expect(xml).toContain("<SEQNR_I>1</SEQNR_I>");
		expect(xml).toContain("<IMPORTNR_I>IM-2026-7</IMPORTNR_I>");
		expect(xml).toContain("<LAND_I>HK</LAND_I>");
		expect(xml).toContain("<CODE_I>4</CODE_I>");
		expect(xml).toContain("<WAEHR_I>EUR</WAEHR_I>");
	});

	it("emits 1..5 GEGENSTAND blocks per KAUF", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					kaeufe: [
						{
							...minimal.erklaerungen[0]!.kaeufe![0]!,
							gegenstaende: [
								{ code: 1, subcode: "1.05", beschreibung: "Diesel" },
								{ code: 2, subcode: "2.01" },
								{ code: 3 },
							],
						},
					],
				},
			],
		});
		expect(xml.match(/<GEGENSTAND>/g)?.length).toBe(3);
		expect(xml).toContain("<SUBCODE_K>1.05</SUBCODE_K>");
		expect(xml).toContain("<BESCHREIBUNG_K>Diesel</BESCHREIBUNG_K>");
	});

	it("rejects malformed ANTRAGNR (must be AT + 14 alphanumerics)", () => {
		const bad: VatBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, antragnr: "DE12345678901234" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed BEZNR (must end with a digit)", () => {
		const bad: VatBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					kaeufe: [{ ...minimal.erklaerungen[0]!.kaeufe![0]!, beznr: "INVOICE" }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects GEGENSTAND with code outside 1..10", () => {
		const bad: VatBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					kaeufe: [
						{
							...minimal.erklaerungen[0]!.kaeufe![0]!,
							// biome-ignore lint/suspicious/noExplicitAny: testing runtime rejection of out-of-range code
							gegenstaende: [{ code: 11 as any }],
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 5-Gegenstand cap per KAUF", () => {
		const bad: VatBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					kaeufe: [
						{
							...minimal.erklaerungen[0]!.kaeufe![0]!,
							gegenstaende: Array.from({ length: 6 }, () => ({ code: 1 as const })),
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects info.anzahlErklaerungen invariant", () => {
		const bad: VatBody = {
			...minimal,
			info: { ...minimal.info, anzahlErklaerungen: 2 },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
