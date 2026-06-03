import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type FvanBody, build } from "../../../src/fvan/current/index.js";

const minimal: FvanBody = {
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
			art: "FVAN",
			satznr: 1,
			anbringen: "FVAN",
			fastnr: "123456789",
			erklZr: "2025",
			datfrist: "2026-09-30",
			begruend: "Verzögerung durch Krankheit der Buchhalterin.",
		},
	],
};

describe("FVAN build()", () => {
	it("produces valid XML for a minimal request", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="FVAN">');
		expect(xml).toContain("<ANBRINGEN>FVAN</ANBRINGEN>");
		expect(xml).toContain("<ERKL_ZR>2025</ERKL_ZR>");
		expect(xml).toContain('<DATFRIST type="datum">2026-09-30</DATFRIST>');
		expect(xml).toContain("<BEGRUEND>Verzögerung durch Krankheit der Buchhalterin.</BEGRUEND>");
	});

	it("emits children in XSD-required order", () => {
		const xml = build(minimal);
		const order = ["<SATZNR>", "<ANBRINGEN>", "<FASTNR>", "<ERKL_ZR>", "<DATFRIST", "<BEGRUEND>"];
		let last = -1;
		for (const tag of order) {
			const idx = xml.indexOf(tag);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects malformed ERKL_ZR (must be YYYY)", () => {
		const bad: FvanBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, erklZr: "25" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed DATFRIST (must be YYYY-MM-DD)", () => {
		const bad: FvanBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, datfrist: "2026/09/30" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects BEGRUEND longer than 2000 chars", () => {
		const bad: FvanBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, begruend: "x".repeat(2001) }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects empty BEGRUEND", () => {
		const bad: FvanBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, begruend: "" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("escapes XML entities in BEGRUEND", () => {
		const body: FvanBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					begruend: "Müller & Söhne <Steuerberatung> 'GmbH' \"OG\"",
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			"<BEGRUEND>Müller &amp; Söhne &lt;Steuerberatung&gt; &apos;GmbH&apos; &quot;OG&quot;</BEGRUEND>",
		);
	});

	it("supports multiple Erklärungen in one packet", () => {
		const body: FvanBody = {
			info: { ...minimal.info, anzahlErklaerungen: 3 },
			erklaerungen: [
				{ ...minimal.erklaerungen[0]!, satznr: 1 },
				{ ...minimal.erklaerungen[0]!, satznr: 2, datfrist: "2026-10-31" },
				{ ...minimal.erklaerungen[0]!, satznr: 3, datfrist: "2026-12-31" },
			],
		};
		const xml = build(body);
		expect((xml.match(/<ERKLAERUNG art="FVAN">/g) ?? []).length).toBe(3);
	});
});
