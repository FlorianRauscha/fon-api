import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type ProtocolResult, parseProtocol, tryParseProtocol } from "../../src/upload/protocol.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "protocol");

function load(name: string): string {
	return readFileSync(join(FIXTURES, name), "utf8");
}

describe("parseProtocol — SOER fixtures", () => {
	it("parses OK to { kind: 'OK', meta }", () => {
		const r = parseProtocol(load("soer_OK.xml"));
		expect(r.kind).toBe("OK");
		expect(r.meta).toMatchObject({
			art: "SOER",
			uebermittlung: "P",
			messageRefId: "20200211r",
			fastnrFonTn: "091234567",
			einbringungsTimestamp: "2020-02-12T08:52:21.400464",
		});
	});

	it("parses NOK with the Error nested inside MessageSpec", () => {
		const r = parseProtocol(load("soer_NOK.xml"));
		expect(r.kind).toBe("NOK");
		if (r.kind !== "NOK") return;
		expect(r.errors).toHaveLength(1);
		expect(r.errors[0]).toMatchObject({
			code: "ERR-F-001",
			text: "Die Fastnr_Fon_Tn muss gültig, 9-stellig und vorhanden sein.",
		});
		expect(r.errors[0]?.refNr).toBeUndefined();
	});

	it("parses TWOK with multiple <{Art}UebermittlungError> wrappers carrying RefNr", () => {
		const r = parseProtocol(load("soer_TWOK.xml"));
		expect(r.kind).toBe("TWOK");
		if (r.kind !== "TWOK") return;
		expect(r.errors).toHaveLength(2);
		expect(r.errors.map((e) => e.code).sort()).toEqual(["ERR-E-004", "ERR-E-012"]);
		// Both errors carry the surrounding RefNr
		expect(r.errors.every((e) => typeof e.refNr === "string")).toBe(true);
		expect(r.errors.map((e) => e.refNr).sort()).toEqual(["Referenz007", "Referenz008"]);
	});
});

describe("parseProtocol — CbC fixtures", () => {
	it("parses OK with Fastnr_Org also captured", () => {
		const r = parseProtocol(load("cbc_OK.xml"));
		expect(r.kind).toBe("OK");
		expect(r.meta.art).toBe("VPDGD");
		expect(r.meta.uebermittlung).toBe("T");
		expect(r.meta.fastnrFonTn).toBe("123456789");
		expect(r.meta.fastnrOrg).toBe("987654321");
	});

	it("parses NOK with Error as a sibling of MessageSpec", () => {
		const r = parseProtocol(load("cbc_NOK.xml"));
		expect(r.kind).toBe("NOK");
		if (r.kind !== "NOK") return;
		expect(r.errors).toHaveLength(1);
		expect(r.errors[0]).toMatchObject({ code: "3", text: "Fehlertext 3" });
	});

	it("parses TWOK and captures the optional <Data> field on errors", () => {
		const r = parseProtocol(load("cbc_TWOK.xml"));
		expect(r.kind).toBe("TWOK");
		if (r.kind !== "TWOK") return;
		expect(r.errors).toHaveLength(2);
		const withData = r.errors.find((e) => e.data !== undefined);
		expect(withData).toMatchObject({ code: "2", text: "Fehlertext 2", data: "Data" });
		const withoutData = r.errors.find((e) => e.data === undefined);
		expect(withoutData).toMatchObject({ code: "1", text: "Fehlertext 1" });
	});
});

describe("parseProtocol — error handling", () => {
	it("throws when MessageSpec/Info is missing", () => {
		expect(() => parseProtocol("<Foo><Bar/></Foo>")).toThrow(/MessageSpec/);
	});

	it("throws when Info is not a recognised value", () => {
		expect(() => parseProtocol("<Resp><MessageSpec><Info>WAT</Info></MessageSpec></Resp>")).toThrow(
			/MessageSpec\/Info/,
		);
	});

	it("tryParseProtocol returns null instead of throwing", () => {
		expect(tryParseProtocol("not xml at all")).toBeNull();
		expect(tryParseProtocol("<Foo/>")).toBeNull();
	});
});

describe("parseProtocol — preserves raw XML for forensic access", () => {
	it("raw equals the input string", () => {
		const xml = load("soer_NOK.xml");
		const r: ProtocolResult = parseProtocol(xml);
		expect(r.raw).toBe(xml);
	});
});
