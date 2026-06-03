import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type SbzBody, build } from "../../../src/sbz/current/index.js";

const minimal: SbzBody = {
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
			art: "SBZ",
			allgemein: { satznr: 1, anbringen: "SBZ", fastnr: "123456789" },
			verrechnungsweisungen: [
				{
					aa: "030",
					zrvon: { value: "2026-03", type: "jahrmonat" },
					zrbis: { value: "2026-03", type: "jahrmonat" },
					betrag: 1500,
				},
			],
		},
	],
};

describe("SBZ build()", () => {
	it("produces valid XML", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="SBZ">');
		expect(xml).toContain("<ANBRINGEN>SBZ</ANBRINGEN>");
		expect(xml).toContain('<BETRAG type="kz">1500.00</BETRAG>');
	});

	it("does NOT emit UVA_ZEITRAUM (SBZ has no UVA block)", () => {
		const xml = build(minimal);
		expect(xml).not.toContain("UVA_ZEITRAUM");
	});

	it("rejects unknown AA code", () => {
		const bad: SbzBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					verrechnungsweisungen: [
						{
							// @ts-expect-error -- not in AaCode
							aa: "999",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 100,
						},
					],
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
