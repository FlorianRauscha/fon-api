import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type KOMBody, build } from "../../../src/kom/current/index.js";

const minimal: KOMBody = {
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
			art: "KOMMST1",
			satznr: 1,
			allgemein: {
				anbringen: "KOMMST1",
				jahr: "2025",
				fastnr: "123456789",
			},
			gemeinden: [{ gd: "90001", plz: "1010", gem: "Wien", bmg: 100_000, steuer: 3_000 }],
		},
	],
};

describe("KOM XSD floor regression (audit fix)", () => {
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

describe("KOM build()", () => {
	it("produces a valid Kommunalsteuererklärung XML", () => {
		const xml = build(minimal);
		expect(xml).toContain('<KOMMUNALSTEUERERKLAERUNG art="KOM">');
		expect(xml).toContain('<ERKLAERUNG art="KOMMST1">');
		expect(xml).toContain("<JAHR>2025</JAHR>");
		expect(xml).toContain("<GEMEINDE><GD>90001</GD><PLZ>1010</PLZ><GEM>Wien</GEM>");
		expect(xml).toContain('<BMG type="kz">100000.00</BMG>');
		expect(xml).toContain('<STEUER type="kz">3000.00</STEUER>');
	});

	it("emits multiple GEMEINDE entries with optional GESAMTE_BEMESSUNGSGRUNDLAGE summary", () => {
		const body: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					gesamteBemessungsgrundlage: { gesamtBmg: 250_000, gesamtSteuer: 7_500 },
					gemeinden: [
						{ gd: "90001", plz: "1010", gem: "Wien", bmg: 100_000, steuer: 3_000 },
						{ gd: "60101", plz: "8010", gem: "Graz", bmg: 100_000, steuer: 3_000 },
						{ gd: "70101", plz: "4020", gem: "Linz", bmg: 50_000, steuer: 1_500, rueck: "J" },
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<GESAMTE_BEMESSUNGSGRUNDLAGE><GESAMT_BMG type="kz">250000.00</GESAMT_BMG><GESAMT_STEUER type="kz">7500.00</GESAMT_STEUER></GESAMTE_BEMESSUNGSGRUNDLAGE>',
		);
		expect((xml.match(/<GEMEINDE>/g) ?? []).length).toBe(3);
		expect(xml).toContain("<GEM>Wien</GEM>");
		expect(xml).toContain("<GEM>Graz</GEM>");
		expect(xml).toContain("<GEM>Linz</GEM>");
		expect(xml).toContain("<RUECK>J</RUECK>");
	});

	it("rejects mismatched art and allgemein.anbringen", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					art: "KOMMST2",
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, anbringen: "KOMMST1" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects non-5-digit Gemeindekennzahl", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					gemeinden: [{ gd: "9001", plz: "1010", gem: "Wien" }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects non-4-digit PLZ", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					gemeinden: [{ gd: "90001", plz: "10", gem: "Wien" }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects empty gemeinden array (XSD requires at least one)", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, gemeinden: [] }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects GEM longer than 40 chars", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					gemeinden: [{ gd: "90001", plz: "1010", gem: "x".repeat(41) }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects negative kz amounts (KOM kz is non-negative)", () => {
		const bad: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					gemeinden: [{ gd: "90001", plz: "1010", gem: "Wien", bmg: -1 }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("supports KOMMST2 (correction) art", () => {
		const body: KOMBody = {
			...minimal,
			erklaerungen: [
				{
					art: "KOMMST2",
					satznr: 1,
					allgemein: {
						anbringen: "KOMMST2",
						jahr: "2024",
						fastnr: "123456789",
					},
					gemeinden: [{ gd: "90001", plz: "1010", gem: "Wien", bmg: 50_000, steuer: 1_500 }],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<ERKLAERUNG art="KOMMST2">');
		expect(xml).toContain("<ANBRINGEN>KOMMST2</ANBRINGEN>");
	});
});
