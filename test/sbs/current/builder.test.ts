import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type SbsBody, build } from "../../../src/sbs/current/index.js";

const minimal: SbsBody = {
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
			art: "SBS",
			allgemein: { satznr: 1, anbringen: "SBS", fastnr: "123456789" },
			buchtag: "2026-04-01",
			berichtigung: {
				ist: [
					{
						aa: "030",
						zrvon: { value: "2026-03", type: "jahrmonat" },
						zrbis: { value: "2026-03", type: "jahrmonat" },
						betrag: 1500,
					},
				],
			},
		},
	],
};

describe("SBS build()", () => {
	it('emits BUCHUNGSTAG → BUCHTAG with type="datum"', () => {
		const xml = build(minimal);
		expect(xml).toContain('<BUCHUNGSTAG><BUCHTAG type="datum">2026-04-01</BUCHTAG></BUCHUNGSTAG>');
	});

	it("emits SELBSTBEMESSUNGSABGABEN_IST with AA_IST/ZRVON_IST/ZRBIS_IST/BETRAG_IST", () => {
		const xml = build(minimal);
		expect(xml).toContain(
			'<SELBSTBEMESSUNGSABGABEN_IST><AA_IST>030</AA_IST><ZRVON_IST type="jahrmonat">2026-03</ZRVON_IST><ZRBIS_IST type="jahrmonat">2026-03</ZRBIS_IST><BETRAG_IST type="kz">1500.00</BETRAG_IST></SELBSTBEMESSUNGSABGABEN_IST>',
		);
	});

	it("emits SELBSTBEMESSUNGSABGABEN_BER (replacement entries) without _IST suffix", () => {
		const body: SbsBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					berichtigung: {
						ist: [
							{
								aa: "030",
								zrvon: { value: "2026-03", type: "jahrmonat" },
								zrbis: { value: "2026-03", type: "jahrmonat" },
								betrag: 1500,
							},
						],
						ber: [
							{
								aa: "030",
								zrvon: { value: "2026-03", type: "jahrmonat" },
								zrbis: { value: "2026-03", type: "jahrmonat" },
								betrag: 1750,
							},
						],
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<SELBSTBEMESSUNGSABGABEN_BER><AA>030</AA><ZRVON type="jahrmonat">2026-03</ZRVON><ZRBIS type="jahrmonat">2026-03</ZRBIS><BETRAG type="kz">1750.00</BETRAG></SELBSTBEMESSUNGSABGABEN_BER>',
		);
	});

	it("rejects empty IST array (XSD requires minOccurs=1)", () => {
		const bad: SbsBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, berichtigung: { ist: [] } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects more than 20 IST entries", () => {
		const bad: SbsBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					berichtigung: {
						ist: Array.from({ length: 21 }, () => ({
							aa: "030" as const,
							zrvon: { value: "2026-03", type: "jahrmonat" as const },
							zrbis: { value: "2026-03", type: "jahrmonat" as const },
							betrag: 1,
						})),
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed BUCHTAG", () => {
		const bad: SbsBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, buchtag: "2026/04/01" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
