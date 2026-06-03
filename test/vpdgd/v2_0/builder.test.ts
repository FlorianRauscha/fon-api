import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type VpdgdBody, build } from "../../../src/vpdgd/v2_0/index.js";

const minimalCbcOecd =
	'<CBC_OECD version="2.0" xmlns="urn:oecd:ties:cbc:v2"><MessageSpec><SendingEntityIN>AT12345678</SendingEntityIN></MessageSpec></CBC_OECD>';

const minimal: VpdgdBody = {
	info: { fastnrFonTn: "234567890", fastnrOrg: "123456789", vers: "02.00" },
	cbcOecdInner: minimalCbcOecd,
};

describe("VPDGD build()", () => {
	it("emits namespaced Cbc_National wrapper around the OECD payload", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain(
			'<Cbc_National xmlns="urn:oecd:ties:nationalcbc:v2" xmlns:cbc="urn:oecd:ties:cbc:v2">',
		);
		expect(xml).toContain("<Info_Daten>");
		expect(xml).toContain("<Fastnr_Fon_Tn>234567890</Fastnr_Fon_Tn>");
		expect(xml).toContain("<Fastnr_Org>123456789</Fastnr_Org>");
		expect(xml).toContain("<Vers>02.00</Vers>");
		expect(xml).toContain(minimalCbcOecd);
		expect(xml).toContain("</Cbc_National>");
	});

	it("emits Info_Daten before the OECD payload", () => {
		const xml = build(minimal);
		const info = xml.indexOf("<Info_Daten>");
		const oecd = xml.indexOf("<CBC_OECD");
		expect(info).toBeGreaterThan(0);
		expect(oecd).toBeGreaterThan(info);
	});

	it("rejects malformed Vers (must be NN.NN)", () => {
		const bad: VpdgdBody = { ...minimal, info: { ...minimal.info, vers: "2.0" } };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects FASTNR with wrong length", () => {
		const bad: VpdgdBody = { ...minimal, info: { ...minimal.info, fastnrOrg: "12345678" } };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects payload missing the <CBC_OECD> wrapper", () => {
		const bad: VpdgdBody = { ...minimal, cbcOecdInner: "<Something>...</Something>" };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects opts.validate=false (skips schema check, still emits)", () => {
		const noValidate: VpdgdBody = {
			...minimal,
			info: { ...minimal.info, vers: "bogus" },
		};
		expect(() => build(noValidate, { validate: false })).not.toThrow();
	});
});
