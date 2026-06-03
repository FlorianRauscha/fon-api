import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type ZMBody, build } from "../../../src/zm/current/index.js";

const minimal: ZMBody = {
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
			art: "U13",
			satznr: 1,
			allgemein: {
				anbringen: "U13",
				zrvon: "2026-03",
				zrbis: "2026-03",
				fastnr: "123456789",
			},
			content: { kind: "entries", entries: [{ uidMs: "DE123456789" }] },
		},
	],
};

describe("ZM build()", () => {
	it("produces valid XML for a minimal payload with one ZM entry", () => {
		const xml = build(minimal);
		expect(xml).toContain('<ERKLAERUNG art="U13">');
		expect(xml).toContain("<ANBRINGEN>U13</ANBRINGEN>");
		expect(xml).toContain('<ZRVON type="jahrmonat">2026-03</ZRVON>');
		expect(xml).toContain('<ZRBIS type="jahrmonat">2026-03</ZRBIS>');
		expect(xml).toContain("<ZM><UID_MS>DE123456789</UID_MS></ZM>");
	});

	it("emits multiple ZM entries with all fields populated", () => {
		const body: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					content: {
						kind: "entries",
						entries: [
							{
								uidMs: "DE123456789",
								sumBgl: 5000,
								dreieck: "J",
								solei: "J",
								klag: "1",
								uidUe: "FR987654321",
							},
							{ uidMs: "IT11122233344", sumBgl: -250, klag: "2" },
						],
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain(
			'<ZM><UID_MS>DE123456789</UID_MS><SUM_BGL type="kz">5000</SUM_BGL><DREIECK>J</DREIECK><SOLEI>J</SOLEI><KLAG>1</KLAG><UID_UE>FR987654321</UID_UE></ZM>',
		);
		expect(xml).toContain(
			'<ZM><UID_MS>IT11122233344</UID_MS><SUM_BGL type="kz">-250</SUM_BGL><KLAG>2</KLAG></ZM>',
		);
	});

	it("emits GESAMTRUECKZIEHUNG instead of ZM entries", () => {
		const body: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					content: {
						kind: "gesamtrueckziehung",
						gesamtrueckziehung: { gesamtrueck: "J" },
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain("<GESAMTRUECKZIEHUNG><GESAMTRUECK>J</GESAMTRUECK></GESAMTRUECKZIEHUNG>");
		expect(xml).not.toContain("<ZM>");
	});

	it("rejects KLAG outside 1/2/3", () => {
		const bad: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					content: {
						kind: "entries",
						entries: [
							{
								uidMs: "DE1",
								// @ts-expect-error -- "4" not in KlagCode
								klag: "4",
							},
						],
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects SUM_BGL outside int32-ish range or non-integer", () => {
		const bad: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					content: {
						kind: "entries",
						entries: [{ uidMs: "DE1", sumBgl: 100.5 }],
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects UID_MS longer than 15 chars", () => {
		const bad: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					content: {
						kind: "entries",
						entries: [{ uidMs: "DE123456789ABCDEFGHIJ" }],
					},
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects empty entries array (XSD requires minOccurs=1)", () => {
		const bad: ZMBody = {
			...minimal,
			erklaerungen: [{ ...minimal.erklaerungen[0]!, content: { kind: "entries", entries: [] } }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed ZRVON (not YYYY-MM)", () => {
		const bad: ZMBody = {
			...minimal,
			erklaerungen: [
				{
					...minimal.erklaerungen[0]!,
					allgemein: { ...minimal.erklaerungen[0]!.allgemein, zrvon: "2026-3" },
				},
			],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
