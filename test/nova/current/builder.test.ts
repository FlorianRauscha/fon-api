import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type NovaBody, build } from "../../../src/nova/current/index.js";

const minimal: NovaBody = {
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
			art: "NOVA",
			satznr: 1,
			allgemein: {
				anbringen: "NOVA1",
				zr: "2026-04",
				fastnr: "123456789",
			},
		},
	],
};

describe("NoVA XSD regression (audit fix)", () => {
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

	it("rejects NOVA_SATZ '99' (XSD enum max is '80')", () => {
		expect(() =>
			build({
				...minimal,
				erklaerungen: [
					{ ...minimal.erklaerungen[0]!, verguetungen: [{ fin: "X1", novaSatz: "99" }] },
				],
			}),
		).toThrow(ValidationError);
	});
});

describe("NoVA build()", () => {
	it("produces valid XML for a minimal payload", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="NOVA">');
		expect(xml).toContain("<ANBRINGEN>NOVA1</ANBRINGEN>");
		expect(xml).toContain('<ZR type="jahrmonat">2026-04</ZR>');
	});

	it("emits ANMELDUNG with all 7 KZ slots populated (incl. signed BERICHTIG)", () => {
		const body: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					anmeldung: {
						liefBmg: 50_000,
						liefSteuer: 7_500,
						igeBmg: 20_000,
						igeSteuer: 3_000,
						sonstvgBmg: 5_000,
						sonstvgSteuer: 750,
						berichtig: -250.5,
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<ANMELDUNG><LIEF_BMG type="kz">50000.00</LIEF_BMG>');
		expect(xml).toContain('<BERICHTIG type="kz">-250.50</BERICHTIG>');
	});

	it("emits VERGUETUNG with FIN, NOVA_SATZ, codes", () => {
		const body: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [
						{
							fin: "WBA8E5C50KA123456",
							vergBmg: 30_000,
							novaSatz: "16",
							vergSteuer: 4_800,
							vergGrund: 41,
							sonstBegruend: "Export ins Drittland",
							ustBmg: 25_000,
							ustInfo: 31,
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<FIN>WBA8E5C50KA123456</FIN>");
		expect(xml).toContain("<NOVA_SATZ>16</NOVA_SATZ>");
		expect(xml).toContain("<VERG_GRUND>41</VERG_GRUND>");
		expect(xml).toContain("<SONST_BEGRUEND>Export ins Drittland</SONST_BEGRUEND>");
		expect(xml).toContain("<UST_INFO>31</UST_INFO>");
	});

	it("supports the special NOVA_SATZ '16.67'", () => {
		const body: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [{ fin: "X1", novaSatz: "16.67" }],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<NOVA_SATZ>16.67</NOVA_SATZ>");
	});

	it("rejects invalid NOVA_SATZ format", () => {
		const bad: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [{ novaSatz: "20.5" }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects VERG_GRUND outside 40..59", () => {
		const bad: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [
						{
							// @ts-expect-error -- 60 not in VergGrund
							vergGrund: 60,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects UST_INFO outside 30..33", () => {
		const bad: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [
						{
							// @ts-expect-error -- 34 not in UstInfoCode
							ustInfo: 34,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects FIN longer than 20 chars", () => {
		const bad: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: [{ fin: "x".repeat(21) }],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("supports up to 1200 VERGUETUNG entries", () => {
		const body: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: Array.from({ length: 1200 }, (_, i) => ({ fin: `FIN${i}` })),
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<VERGUETUNG>/g) ?? []).length).toBe(1200);
	});

	it("rejects more than 1200 VERGUETUNG entries", () => {
		const bad: NovaBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verguetungen: Array.from({ length: 1201 }, () => ({})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
