import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type DueBody, build } from "../../../src/due/current/index.js";

const baseInfo: DueBody["info"] = {
	artIdentifikationsbegriff: "FASTNR",
	identifikationsbegriff: "123456789",
	paketNr: 1,
	datumErstellung: "2026-04-15",
	uhrzeitErstellung: "10:00:00",
	anzahlErklaerungen: 1,
	fastnrMitteiler: "234567890",
	nameMitteiler: "Bank AG",
};

const transferAllgemein: DueBody["erklaerungen"][number]["allgemein"] = {
	kind: "transfer",
	anbringen: "DUE",
	refnr: "REF-2026-1",
	gesetz: "274T",
	datueb: "2026-03-31",
	depotfuehrendeStelle: { depStelle: "Wiener Bank Privat", bic: "BKAUATWWXXX" },
};

const minimal: DueBody = {
	info: baseInfo,
	erklaerungen: [
		{
			art: "DUE",
			allgemein: transferAllgemein,
			depotinhaber: [{ kind: "fastnr", fastnr: "123456789" }],
			betroffeneWertpapiere: [
				{
					bezWg: "Apple Inc",
					isin: "US0378331005",
					men: 100,
					kennMen: "S",
					ak: 15_000,
					kennAk: "T",
				},
			],
			uebertragungAuf: [
				{
					kind: "firma",
					firmname: "Receiving Bank GmbH",
					str: "Hauptstr",
					nr: "1",
					plz: "10115",
					ort: "Berlin",
					land: "D",
				},
			],
		},
	],
};

describe("DUE build()", () => {
	it("emits well-formed transfer Erklärung", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain('<ERKLAERUNG art="DUE">');
		expect(xml).toContain("<ANBRINGEN>DUE</ANBRINGEN>");
		expect(xml).toContain("<FASTNR_MITTEILER>234567890</FASTNR_MITTEILER>");
		expect(xml).toContain("<NAME_MITTEILER>Bank AG</NAME_MITTEILER>");
		expect(xml).toContain("<GESETZ>274T</GESETZ>");
		expect(xml).toContain('<DATUEB type="datum">2026-03-31</DATUEB>');
		expect(xml).toContain("<BIC>BKAUATWWXXX</BIC>");
		expect(xml).toContain("<ISIN>US0378331005</ISIN>");
		expect(xml).toContain('<AK type="kz">15000.00</AK>');
		expect(xml).toContain("<KENN_AK>T</KENN_AK>");
	});

	it("emits person DEPOTINHABER with full address", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					depotinhaber: [
						{
							kind: "person",
							nname: "Mustermann",
							vname: "Max",
							geb: "1970-01-01",
							str: "Lindenallee",
							nr: "5",
							stg: "B",
							tuer: "12",
							plz: "1010",
							ort: "Wien",
							land: "A",
						},
					],
				},
			],
		});
		expect(xml).toContain("<NNAME_D>Mustermann</NNAME_D>");
		expect(xml).toContain("<VNAME_D>Max</VNAME_D>");
		expect(xml).toContain('<GEB_D type="datum">1970-01-01</GEB_D>');
		expect(xml).toContain("<STG_D>B</STG_D>");
		expect(xml).toContain("<TUER_D>12</TUER_D>");
		expect(xml).toContain("<LAND_D>A</LAND_D>");
	});

	it("emits VNR-only DEPOTINHABER as the short variant", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					depotinhaber: [{ kind: "vnr", vnr: "1234567890" }],
				},
			],
		});
		expect(xml).toContain("<DEPOTINHABER><VNR_D>1234567890</VNR_D></DEPOTINHABER>");
	});

	it("emits Gesamtrückrufung shape (no GESETZ / ZEITPUNKT / DEP_STELLE)", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					art: "DUE",
					allgemein: { kind: "gesamtrueck", anbringen: "DUE", refnr: "REF-RUECK-1" },
				},
			],
		});
		expect(xml).toContain("<GESAMTRUECK>J</GESAMTRUECK>");
		expect(xml).not.toContain("<GESETZ>");
		expect(xml).not.toContain("<DATUEB");
	});

	it("emits ALLGEMEINE_DATEN child order (XSD-required)", () => {
		const xml = build({
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...transferAllgemein,
						kundeninfo: "Reference",
						gemeinschaftsdepotD: "J",
						gemeinschaftsdepotA: "J",
						berichtigung: "J",
					},
				},
			],
		});
		const order = [
			"<ANBRINGEN",
			"<KUNDENINFO",
			"<REFNR",
			"<GESETZ",
			"<GEMEINSCHAFTSDEPOT_D",
			"<GEMEINSCHAFTSDEPOT_A",
			"<BERICHTIGUNG",
			"<ZEITPUNKT",
			"<DEPOTFUEHRENDE_STELLE",
		];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects malformed BIC", () => {
		const bad: DueBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...transferAllgemein,
						depotfuehrendeStelle: { depStelle: "Bank", bic: "INVALID" },
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed ISIN (>12 chars)", () => {
		const bad: DueBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					betroffeneWertpapiere: [
						{
							...minimal.erklaerungen[0]!.betroffeneWertpapiere![0]!,
							isin: "TOO_LONG_ISIN_VALUE",
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects negative AK", () => {
		const bad: DueBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					betroffeneWertpapiere: [
						{
							...minimal.erklaerungen[0]!.betroffeneWertpapiere![0]!,
							ak: -1,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects info.anzahlErklaerungen invariant", () => {
		const bad: DueBody = {
			...minimal,
			info: { ...baseInfo, anzahlErklaerungen: 2 },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 50-DEPOTINHABER cap", () => {
		const bad: DueBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					depotinhaber: Array.from({ length: 51 }, () => ({
						kind: "fastnr" as const,
						fastnr: "123456789",
					})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
