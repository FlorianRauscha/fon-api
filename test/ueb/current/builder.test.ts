import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type UebBody, build } from "../../../src/ueb/current/index.js";

const minimal: UebBody = {
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
			art: "UEB",
			allgemein: {
				satznr: 1,
				anbringen: "UEB",
				fastnr: "123456789",
				fastnrZu: "987654321",
			},
			uebertragenderBetrag: 1000,
		},
	],
};

describe("UEB build()", () => {
	it("emits FASTNR + FASTNR_ZU + UEBERTRAGENDER_BETRAG", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="UEB">');
		expect(xml).toContain("<FASTNR>123456789</FASTNR><FASTNR_ZU>987654321</FASTNR_ZU>");
		expect(xml).toContain(
			'<UEBERTRAGENDER_BETRAG><BETRAG_UEB type="kz">1000.00</BETRAG_UEB></UEBERTRAGENDER_BETRAG>',
		);
	});

	it("emits WEGBUCHUNG with _WEG-suffixed children + signed BETRAG_WEG", () => {
		const body: UebBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					wegbuchungen: [
						{
							aa: "030",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: -500,
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<WEGBUCHUNG><AA_WEG>030</AA_WEG><ZRVON_WEG type="jahrmonat">2026-03</ZRVON_WEG><ZRBIS_WEG type="jahrmonat">2026-03</ZRBIS_WEG><BETRAG_WEG type="kz">-500.00</BETRAG_WEG></WEGBUCHUNG>',
		);
	});

	it("emits ZUBUCHUNG with _ZU-suffixed children", () => {
		const body: UebBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					zubuchungen: [
						{
							aa: "445",
							zrvon: { value: "2025", type: "jahr" },
							zrbis: { value: "2025", type: "jahr" },
							betrag: 750.5,
						},
					],
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<ZUBUCHUNG><AA_ZU>445</AA_ZU><ZRVON_ZU type="jahr">2025</ZRVON_ZU><ZRBIS_ZU type="jahr">2025</ZRBIS_ZU><BETRAG_ZU type="kz">750.50</BETRAG_ZU></ZUBUCHUNG>',
		);
	});

	it("emits WEG before BETRAG_UEB before ZU in XSD-required order", () => {
		const body: UebBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					wegbuchungen: [
						{
							aa: "030",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: -1000,
						},
					],
					zubuchungen: [
						{
							aa: "445",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 1000,
						},
					],
				},
			],
		};
		const xml = build(body);
		const wegIdx = xml.indexOf("<WEGBUCHUNG>");
		const uebIdx = xml.indexOf("<UEBERTRAGENDER_BETRAG>");
		const zuIdx = xml.indexOf("<ZUBUCHUNG>");
		expect(wegIdx).toBeLessThan(uebIdx);
		expect(uebIdx).toBeLessThan(zuIdx);
	});

	it("supports up to 7 WEGBUCHUNG entries", () => {
		const body: UebBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					wegbuchungen: Array.from({ length: 7 }, () => ({
						aa: "030" as const,
						zrvon: { value: "2026-03", type: "jahrmonat" as const },
						zrbis: { value: "2026-03", type: "jahrmonat" as const },
						betrag: -100,
					})),
				},
			],
		};
		const xml = build(body);
		expect((xml.match(/<WEGBUCHUNG>/g) ?? []).length).toBe(7);
	});

	it("rejects more than 7 WEGBUCHUNG entries", () => {
		const bad: UebBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					wegbuchungen: Array.from({ length: 8 }, () => ({
						aa: "030" as const,
						zrvon: { value: "2026-03", type: "jahrmonat" as const },
						zrbis: { value: "2026-03", type: "jahrmonat" as const },
						betrag: -100,
					})),
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects UEBERTRAGENDER_BETRAG ≤ 0 (must be positive)", () => {
		const bad: UebBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, uebertragenderBetrag: 0 }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
