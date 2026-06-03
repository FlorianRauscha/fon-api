import { describe, expect, it } from "vitest";
import { type BetBody, build } from "../../../src/bet/current/index.js";
import { ValidationError } from "../../../src/core/errors.js";

const minimal: BetBody = {
	kopf: {
		anbringen: "BET",
		jahr: "2025",
		fastnr: "123456789",
		name: "Test KG",
		adrBetr: "Hauptplatz 1",
		ortBetr: "Wien",
		plzBetr: "1010",
		landBetr: "A",
		datum: "2026-04-15",
		uhrzeit: "10:00:00",
	},
	beteiligte: [
		{
			fastnrb: "234567890",
			pro: 50,
			jahrpro: 50,
			zrvon: "01-01",
			folge: "N",
			nameb: "Mustermann Max",
		},
		{
			fastnrb: "345678901",
			pro: 50,
			jahrpro: 50,
			zrvon: "01-01",
			folge: "N",
			nameb: "Musterfrau Maria",
		},
	],
};

describe("BET build()", () => {
	it("emits valid XML root with kopf + Beteiligten", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain("<XML>");
		expect(xml).toContain("<ANBRINGEN>BET</ANBRINGEN>");
		expect(xml).toContain("<JAHR>2025</JAHR>");
		expect(xml).toContain("<NAME>Test KG</NAME>");
		expect(xml).toContain("<LAND_BETR>A</LAND_BETR>");
		expect(xml).toContain("<FASTNRB>234567890</FASTNRB>");
		expect(xml).toContain("<NAMEB>Mustermann Max</NAMEB>");
		expect(xml).toContain("</XML>");
	});

	it("emits header before any partner data", () => {
		const xml = build(minimal);
		const headerEnd = xml.indexOf("</UHRZEIT>");
		const firstPartner = xml.indexOf("<FASTNRB>");
		expect(headerEnd).toBeGreaterThan(0);
		expect(firstPartner).toBeGreaterThan(headerEnd);
	});

	it("emits each Beteiligter as a contiguous 7-field block", () => {
		const xml = build(minimal);
		const a = xml.indexOf("<FASTNRB>234567890</FASTNRB>");
		const b = xml.indexOf("<NAMEB>Mustermann Max</NAMEB>");
		const c = xml.indexOf("<FASTNRB>345678901</FASTNRB>");
		expect(a).toBeGreaterThan(-1);
		expect(b).toBeGreaterThan(a);
		expect(c).toBeGreaterThan(b);
	});

	it("emits ZRBIS and PLZORT_BETR when set", () => {
		const xml = build({
			kopf: { ...minimal.kopf, plzOrtBetr: "10115 Berlin" },
			beteiligte: [{ ...minimal.beteiligte[0]!, zrbis: "31-12" }],
		});
		expect(xml).toContain("<PLZORT_BETR>10115 Berlin</PLZORT_BETR>");
		expect(xml).toContain("<ZRBIS>31-12</ZRBIS>");
	});

	it("rejects malformed JAHR (must be YYYY)", () => {
		const bad: BetBody = {
			...minimal,
			kopf: { ...minimal.kopf, jahr: "25" },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed ZRVON (must be DD-MM)", () => {
		const bad: BetBody = {
			...minimal,
			beteiligte: [{ ...minimal.beteiligte[0]!, zrvon: "2025-01-01" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects empty Beteiligten list", () => {
		const bad: BetBody = { ...minimal, beteiligte: [] };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 200-Beteiligter cap", () => {
		const tooMany: BetBody = {
			...minimal,
			beteiligte: Array.from({ length: 201 }, (_, i) => ({
				...minimal.beteiligte[0]!,
				fastnrb: String(100_000_000 + i).padStart(9, "0"),
			})),
		};
		expect(() => build(tooMany)).toThrow(ValidationError);
	});

	it("rejects PRO out of range (>100)", () => {
		const bad: BetBody = {
			...minimal,
			beteiligte: [{ ...minimal.beteiligte[0]!, pro: 150 }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("formats fractional percentages with up to 8 decimals", () => {
		const xml = build({
			...minimal,
			beteiligte: [
				{ ...minimal.beteiligte[0]!, pro: 33.33333333, jahrpro: 16.5 },
				{ ...minimal.beteiligte[1]!, pro: 66.66666667, jahrpro: 83.5 },
			],
		});
		expect(xml).toContain("<PRO>33.33333333</PRO>");
		expect(xml).toContain("<JAHRPRO>16.5</JAHRPRO>");
		expect(xml).toContain("<PRO>66.66666667</PRO>");
	});
});
