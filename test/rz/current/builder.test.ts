import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type RzBody, build } from "../../../src/rz/current/index.js";

const minimal: RzBody = {
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
			art: "RZ",
			allgemein: {
				satznr: 1,
				anbringen: "RZ",
				artRz: "I",
				fastnr: "123456789",
			},
			empfaenger: [
				{
					namee: "Max Mustermann",
					betrag: 1500,
					unbar: { iban: "AT611904300234573201", bic: "BKAUATWW" },
				},
			],
		},
	],
};

describe("RZ build()", () => {
	it("produces valid XML for an Inland refund with IBAN", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="RZ">');
		expect(xml).toContain("<ART_RZ>I</ART_RZ>");
		expect(xml).toContain("<NAMEE>Max Mustermann</NAMEE>");
		expect(xml).toContain('<BETRAG type="kz">1500.00</BETRAG>');
		expect(xml).toContain("<UNBAR><IBAN>AT611904300234573201</IBAN><BIC>BKAUATWW</BIC></UNBAR>");
	});

	it("supports BAR (cash pickup) variant", () => {
		const body: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					empfaenger: [
						{
							namee: "Cash Recipient",
							betrag: 500,
							bar: { ort: "Wien", plze: "1010", adre: "Stephansplatz 1" },
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			"<BAR><ORT>Wien</ORT><PLZE>1010</PLZE><ADRE>Stephansplatz 1</ADRE></BAR>",
		);
	});

	it("emits up to 3 EMPFAENGER blocks", () => {
		const body: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					empfaenger: [
						{ namee: "A", betrag: 100, unbar: { iban: "AT11" } },
						{ namee: "B", betrag: 200, unbar: { iban: "AT22" } },
						{ namee: "C", betrag: 300, unbar: { iban: "AT33" } },
					],
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<EMPFAENGER>/g) ?? []).length).toBe(3);
	});

	it("rejects more than 3 EMPFAENGER", () => {
		const bad: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					empfaenger: Array.from({ length: 4 }, (_, i) => ({
						namee: `R${i}`,
						betrag: 1,
					})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects unknown ART_RZ", () => {
		const bad: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: {
						...minimal.erklaerungen[0]!.allgemein,
						// @ts-expect-error -- "X" not in ArtRz
						artRz: "X",
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects BETRAG < 0.01 (kz must be positive)", () => {
		const bad: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					empfaenger: [{ namee: "Zero", betrag: 0, unbar: { iban: "AT1" } }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects NAMEE longer than 37 chars", () => {
		const bad: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					empfaenger: [{ namee: "x".repeat(38), betrag: 100, unbar: { iban: "AT1" } }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("supports Auslandsrückzahlung with LKZ", () => {
		const body: RzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, artRz: "A" },
					empfaenger: [
						{
							namee: "International Inc.",
							betrag: 5000,
							lkz: "USA",
							unbar: { iban: "DE89370400440532013000", bic: "COBADEFFXXX" },
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<ART_RZ>A</ART_RZ>");
		expect(xml).toContain("<LKZ>USA</LKZ>");
	});
});
