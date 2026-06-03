import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type L1Body, build } from "../../../src/l1/2025/index.js";

const minimal: L1Body = {
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
			art: "L1",
			satznr: 1,
			allgemein: {
				anbringen: "L1",
				zr: "2025",
				fastnr: "123456789",
				anzbez: 1,
			},
		},
	],
};

describe("L1 2025 build()", () => {
	it("produces a complete XML document with prolog", () => {
		const xml = build(minimal);
		expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
		expect(xml).toContain("<ERKLAERUNGS_UEBERMITTLUNG>");
		expect(xml).toContain('<ERKLAERUNG art="L1">');
	});

	it("emits ALLGEMEINE_DATEN children in XSD-required order", () => {
		const xml = build(minimal);
		const order = ["<ANBRINGEN>", "<ZR>", "<FASTNR>", "<ANZBEZ>"];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits all optional ALLGEMEINE_DATEN flags when set", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						kundeninfo: "Test",
						kz725: 132.0,
						avab: "J",
						aeab: "J",
						kindfb: 2,
						kmb30: "J",
						kmbPart: "J",
						erhPab: "J",
						mehrki: "J",
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<KUNDENINFO>Test</KUNDENINFO>");
		expect(xml).toContain('<KZ725 type="kz">132.00</KZ725>');
		expect(xml).toContain("<AVAB>J</AVAB>");
		expect(xml).toContain("<AEAB>J</AEAB>");
		expect(xml).toContain("<KINDFB>2</KINDFB>");
		expect(xml).toContain("<KMB_30>J</KMB_30>");
		expect(xml).toContain("<KMB_PART>J</KMB_PART>");
		expect(xml).toContain("<ERH_PAB>J</ERH_PAB>");
		expect(xml).toContain("<MEHRKI>J</MEHRKI>");
	});

	it("wraps optional inner sections with the right element name", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					sonderausgaben: { rawInner: '<KZ281 type="kz">100.00</KZ281>' },
					werbungskosten: { rawInner: '<KZ717 type="kz">50.00</KZ717>' },
					international: { rawInner: "<AUSL_BON>J</AUSL_BON>" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<SONDERAUSGABEN><KZ281 type="kz">100.00</KZ281></SONDERAUSGABEN>');
		expect(xml).toContain('<WERBUNGSKOSTEN><KZ717 type="kz">50.00</KZ717></WERBUNGSKOSTEN>');
		expect(xml).toContain("<INTERNATIONAL><AUSL_BON>J</AUSL_BON></INTERNATIONAL>");
		// Non-supplied sections must be absent
		expect(xml).not.toContain("<AUSSERGEWOEHNLICHE_BELASTUNGEN");
		expect(xml).not.toContain("<FREIBETRAGSBESCHEID");
		expect(xml).not.toContain("<BESONDERE_SONDERAUSGABEN_VERTEILUNG");
	});

	it("rejects invalid 9-digit FASTNR via Zod", () => {
		const bad: L1Body = {
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

	it("rejects ANZBEZ outside 0..99", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, anzbez: 100 },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects mismatch between info.anzahlErklaerungen and erklaerungen.length", () => {
		const bad: L1Body = { ...minimal, info: { ...minimal.info, anzahlErklaerungen: 5 } };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("validates non-YYYY zr format", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, zr: "2025-01" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("escapes XML entities in free-text fields", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						kundeninfo: "Müller & Söhne <2025>",
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<KUNDENINFO>Müller &amp; Söhne &lt;2025&gt;</KUNDENINFO>");
	});

	it("allows up to 4000 erklaerungen per packet", () => {
		const big: L1Body = {
			info: { ...minimal.info, anzahlErklaerungen: 4000 },
			erklaerungen: Array.from({ length: 4000 }, (_, i) => ({
				...minimal.erklaerungen[0]!,
				satznr: i + 1,
			})),
		};
		expect(() => build(big)).not.toThrow();
	});

	it("can opt out of validation with { validate: false }", () => {
		const bad: L1Body = {
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

describe("L1 2025 typed SONDERAUSGABEN", () => {
	it("emits KZ460 (Spenden) and KZ280 (Kirchenbeitrag) in XSD order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					sonderausgaben: { kz460: 250, kz280: 132.5 },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<SONDERAUSGABEN><KZ460 type="kz">250.00</KZ460><KZ280 type="kz">132.50</KZ280></SONDERAUSGABEN>',
		);
	});

	it("rawInner escape hatch still works", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					sonderausgaben: { rawInner: '<SOMETHING_NEW type="kz">9.99</SOMETHING_NEW>' },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<SONDERAUSGABEN><SOMETHING_NEW type="kz">9.99</SOMETHING_NEW></SONDERAUSGABEN>',
		);
	});

	it("emits empty <SONDERAUSGABEN/> when typed shape has no fields set", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, sonderausgaben: {} }],
		};
		const xml = build(body);
		expect(xml).toContain("<SONDERAUSGABEN></SONDERAUSGABEN>");
	});
});

describe("L1 2025 typed WERBUNGSKOSTEN", () => {
	it("emits Kennzahls in XSD-required order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: {
						kz718: 100,
						kz916: 50,
						kz717: 200,
						beruf: "Software Engineer",
						kz169: 75,
					},
				},
			],
		};
		const xml = build(body);
		const expectedOrder = [
			"<KZ718",
			"<KZ916",
			"<KZ717",
			"<BERUF>Software Engineer</BERUF>",
			"<KZ169",
		];
		let last = -1;
		for (const tag of expectedOrder) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits a job block with WKBERUF1/WKZRVON1/WKZRBIS1/KZ437 in order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: {
						job1: { beruf: "V", zrvon: "--01-01", zrbis: "--06-30", kzPauschale: 825 },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<WKBERUF1>V</WKBERUF1><WKZRVON1 type="monattag">--01-01</WKZRVON1><WKZRBIS1 type="monattag">--06-30</WKZRBIS1><KZ437 type="kz">825.00</KZ437>',
		);
	});

	it("emits both job1 and job2 with their respective KZ437/KZ438", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: {
						job1: { beruf: "V", zrvon: "--01-01", zrbis: "--06-30", kzPauschale: 825 },
						job2: { beruf: "P", zrvon: "--07-01", zrbis: "--12-31", kzPauschale: 425 },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<WKBERUF1>V</WKBERUF1>");
		expect(xml).toContain("<WKBERUF2>P</WKBERUF2>");
		expect(xml).toContain('<KZ437 type="kz">825.00</KZ437>');
		expect(xml).toContain('<KZ438 type="kz">425.00</KZ438>');
	});

	it("rejects invalid WkBeruf code via Zod", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: {
						// @ts-expect-error -- "X" is not in the WkBerufCode enum
						job1: { beruf: "X", zrvon: "--01-01", zrbis: "--12-31" },
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects invalid monattag format (--MM-DD required)", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: {
						job1: { beruf: "V", zrvon: "2026-01-01", zrbis: "--12-31" },
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects beruf longer than 30 chars", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: { beruf: "x".repeat(31) },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rawInner escape hatch wins when 'rawInner' is present", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					werbungskosten: { rawInner: '<KZ718 type="kz">100.00</KZ718>' },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<WERBUNGSKOSTEN><KZ718 type="kz">100.00</KZ718></WERBUNGSKOSTEN>');
	});
});

describe("L1 2025 typed AUSSERGEWOEHNLICHE_BELASTUNGEN", () => {
	it("emits typed ALLGEMEIN sub-section in XSD order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						allgemein: { agbelP: "J", kz730: 100, kz475: 250, opferaus: "J" },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<AUSSERGEWOEHNLICHE_BELASTUNGEN><ALLGEMEIN><AGBEL_P>J</AGBEL_P><KZ730 type="kz">100.00</KZ730><KZ475 type="kz">250.00</KZ475><OPFERAUS>J</OPFERAUS></ALLGEMEIN></AUSSERGEWOEHNLICHE_BELASTUNGEN>',
		);
	});

	it("emits both BEHINDERUNG sub-blocks (Steuerpflichtiger + Partner)", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						behinderung: {
							steuerpflichtiger: { koerperS: 50, diaetSz: "J", kz435: 1200 },
							partner: { koerperP: 30, kfzP: "J", kz436: 800 },
						},
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<BEHINDERUNG>");
		expect(xml).toContain(
			'<BEHINDERUNG_STEUERPFLICHTIGER><KOERPER_S>50</KOERPER_S><DIAET_S_Z>J</DIAET_S_Z><KZ435 type="kz">1200.00</KZ435></BEHINDERUNG_STEUERPFLICHTIGER>',
		);
		expect(xml).toContain(
			'<BEHINDERUNG_PARTNER><KOERPER_P>30</KOERPER_P><KFZ_P>J</KFZ_P><KZ436 type="kz">800.00</KZ436></BEHINDERUNG_PARTNER>',
		);
	});

	it('emits PFLEGE_S_A/E with type="monat" attribute', () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						behinderung: { steuerpflichtiger: { pflegeSa: "--01", pflegeSe: "--12" } },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<PFLEGE_S_A type="monat">--01</PFLEGE_S_A>');
		expect(xml).toContain('<PFLEGE_S_E type="monat">--12</PFLEGE_S_E>');
	});

	it("rawInner escape hatch works at every nesting level", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						allgemein: { rawInner: "<NEW_FIELD/>" },
						behinderung: {
							steuerpflichtiger: { rawInner: "<X>1</X>" },
							partner: { koerperP: 25 },
						},
						kindAusbildungBehinderung: { rawInner: "<KIND_ANGABEN/>" },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<ALLGEMEIN><NEW_FIELD/></ALLGEMEIN>");
		expect(xml).toContain(
			"<BEHINDERUNG_STEUERPFLICHTIGER><X>1</X></BEHINDERUNG_STEUERPFLICHTIGER>",
		);
		expect(xml).toContain("<KOERPER_P>25</KOERPER_P>");
		expect(xml).toContain(
			"<KIND_AUSBILDUNG_BEHINDERUNG><KIND_ANGABEN/></KIND_AUSBILDUNG_BEHINDERUNG>",
		);
	});

	it("rejects KOERPER_S above 100", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						behinderung: { steuerpflichtiger: { koerperS: 150 } },
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed PFLEGE month (must be --MM)", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						behinderung: { steuerpflichtiger: { pflegeSa: "2025-01" } },
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("emits sub-sections in AB → ALLGEMEIN, BEHINDERUNG, KIND_AUSBILDUNG order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						allgemein: { kz730: 1 },
						behinderung: { steuerpflichtiger: { koerperS: 10 } },
						kindAusbildungBehinderung: { rawInner: "<KIND_ANGABEN/>" },
					},
				},
			],
		};
		const xml = build(body);
		const order = ["<ALLGEMEIN>", "<BEHINDERUNG>", "<KIND_AUSBILDUNG_BEHINDERUNG>"];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});
});

describe("L1 2025 typed FREIBETRAGSBESCHEID", () => {
	it("emits INDFB + KZ449 in XSD order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					freibetragsbescheid: { indfb: "J", kz449: 1500 },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<FREIBETRAGSBESCHEID><INDFB>J</INDFB><KZ449 type="kz">1500.00</KZ449></FREIBETRAGSBESCHEID>',
		);
	});

	it("rawInner escape hatch still works for FREIBETRAGSBESCHEID", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					freibetragsbescheid: { rawInner: "<INDFB>J</INDFB>" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<FREIBETRAGSBESCHEID><INDFB>J</INDFB></FREIBETRAGSBESCHEID>");
	});
});

describe("L1 2025 typed BESONDERE_SONDERAUSGABEN_VERTEILUNG", () => {
	it("emits all 15 fields in XSD-required order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: {
						famD: "Mustermann",
						vorD: "Erika",
						vnrD: "1234010180",
						gebdatD: "1980-01-01",
						kz281: 100,
						kz282: 50,
						kz458: 25,
						zus1D: "J",
						kz284: 10,
						zehn2D: "J",
						zus2D: "J",
						zehn1D: "J",
						kz283: 75,
						kz117: 200,
						kz118: 300,
					},
				},
			],
		};
		const xml = build(body);
		const order = [
			"<FAM_D>Mustermann</FAM_D>",
			"<VOR_D>Erika</VOR_D>",
			"<VNR_D>1234010180</VNR_D>",
			'<GEBDAT_D type="datum">1980-01-01</GEBDAT_D>',
			'<KZ281 type="kz">100.00</KZ281>',
			'<KZ282 type="kz">50.00</KZ282>',
			'<KZ458 type="kz">25.00</KZ458>',
			"<ZUS1_D>J</ZUS1_D>",
			'<KZ284 type="kz">10.00</KZ284>',
			"<ZEHN2_D>J</ZEHN2_D>",
			"<ZUS2_D>J</ZUS2_D>",
			"<ZEHN1_D>J</ZEHN1_D>",
			'<KZ283 type="kz">75.00</KZ283>',
			'<KZ117 type="kz">200.00</KZ117>',
			'<KZ118 type="kz">300.00</KZ118>',
		];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects VNR_D shorter than 10 digits via Zod", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: { vnrD: "123" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects FAM_D longer than 25 chars", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: { famD: "x".repeat(26) },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed GEBDAT_D (must be YYYY-MM-DD)", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: { gebdatD: "1980/01/01" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rawInner escape hatch still works", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					besondereSonderausgabenVerteilung: { rawInner: "<NEW_FIELD/>" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			"<BESONDERE_SONDERAUSGABEN_VERTEILUNG><NEW_FIELD/></BESONDERE_SONDERAUSGABEN_VERTEILUNG>",
		);
	});
});

describe("L1 2025 typed INTERNATIONAL", () => {
	it("emits a mix of wahl flags + KZs in XSD-required order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: {
						wsInl: "J",
						auslEin: "J",
						kz359: 1500,
						kz183: 800,
						anzl17: 2,
						land1L1: "DE",
						wk1L1: 200,
						auslst1: 50,
						sv184: "N",
						einkS: 12_000,
					},
				},
			],
		};
		const xml = build(body);
		const order = [
			"<WS_INL>J</WS_INL>",
			"<AUSL_EIN>J</AUSL_EIN>",
			'<KZ359 type="kz">1500.00</KZ359>',
			'<KZ183 type="kz">800.00</KZ183>',
			"<ANZL17>2</ANZL17>",
			"<LAND1_L1>DE</LAND1_L1>",
			'<WK1_L1 type="kz">200.00</WK1_L1>',
			'<AUSLST1 type="kz">50.00</AUSLST1>',
			"<SV_184>N</SV_184>",
			'<EINK_S type="kz">12000.00</EINK_S>',
		];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("emits country codes for STAAT_3 / AS_STAAT / STAAT_AN", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: { staat3: "DE", asStaat: "CH", staatAn: "A" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<STAAT_3>DE</STAAT_3>");
		expect(xml).toContain("<AS_STAAT>CH</AS_STAAT>");
		expect(xml).toContain("<STAAT_AN>A</STAAT_AN>");
	});

	it("rejects ANZL17 outside 0..99 (zweistellen)", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, international: { anzl17: 100 } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects SV_184 values outside 'J'|'N'", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					// @ts-expect-error -- janein is "J" | "N"
					international: { sv184: "X" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rawInner escape hatch still works for INTERNATIONAL", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					international: { rawInner: "<WS_INL>J</WS_INL><BRAND_NEW_FIELD/>" },
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<INTERNATIONAL><WS_INL>J</WS_INL><BRAND_NEW_FIELD/></INTERNATIONAL>");
	});

	it("emits empty <INTERNATIONAL/> when typed shape has no fields set", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, international: {} }],
		};
		const xml = build(body);
		expect(xml).toContain("<INTERNATIONAL></INTERNATIONAL>");
	});
});

describe("L1 2025 typed KIND_AUSBILDUNG_BEHINDERUNG", () => {
	it("emits a single typed KIND_ANGABEN with identity + Pflege fields", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [
								{
									famname: "Mustermann",
									vorname: "Max",
									vnrkinK: "1234150115",
									gebkinK: "2015-01-15",
									wsKind: "A",
									pflegeK: 200,
									pflegeKa: "--03",
									pflegeKe: "--09",
								},
							],
						},
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			"<KIND_AUSBILDUNG_BEHINDERUNG><KIND_ANGABEN><FAMNAME>Mustermann</FAMNAME>",
		);
		expect(xml).toContain('<GEBKIN_K type="datum">2015-01-15</GEBKIN_K>');
		expect(xml).toContain('<PFLEGE_K type="kz">200.00</PFLEGE_K>');
	});

	it("expands fbMonate map to FBn_S/P/U/50/100 elements in chronological order", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [
								{
									fbMonate: {
										1: { s: "J", fb100: "J" },
										2: { s: "J", fb100: "J" },
										12: { p: "J", fb50: "J" },
									},
								},
							],
						},
					},
				},
			],
		};
		const xml = build(body);
		// Month 1
		expect(xml).toContain("<FB1_S>J</FB1_S><FB1_100>J</FB1_100>");
		// Month 2
		expect(xml).toContain("<FB2_S>J</FB2_S><FB2_100>J</FB2_100>");
		// Month 12
		expect(xml).toContain("<FB12_P>J</FB12_P><FB12_50>J</FB12_50>");
		// Months 3..11 absent
		expect(xml).not.toContain("<FB3_");
		expect(xml).not.toContain("<FB11_");
		// Month 12 must come AFTER month 2
		expect(xml.indexOf("<FB12_")).toBeGreaterThan(xml.indexOf("<FB2_"));
	});

	it("emits up to 20 KIND_ANGABEN entries", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: Array.from({ length: 20 }, (_, i) => ({ vorname: `Kind${i + 1}` })),
						},
					},
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<KIND_ANGABEN>/g) ?? []).length).toBe(20);
	});

	it("rejects more than 20 KIND_ANGABEN entries via Zod", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: Array.from({ length: 21 }, () => ({})),
						},
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects KOSTRA_K of 0 (prozent must be 1..100)", () => {
		const bad: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [{ kostraK: 0 }],
						},
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rawInner escape hatch works on a single KIND_ANGABEN entry", () => {
		const body: L1Body = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [{ rawInner: "<FAMNAME>Custom</FAMNAME>" }, { vorname: "Typed" }],
						},
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<KIND_ANGABEN><FAMNAME>Custom</FAMNAME></KIND_ANGABEN>");
		expect(xml).toContain("<KIND_ANGABEN><VORNAME>Typed</VORNAME></KIND_ANGABEN>");
	});
});
