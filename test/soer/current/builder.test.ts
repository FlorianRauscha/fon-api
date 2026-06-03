import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type SoerBody, build } from "../../../src/soer/current/index.js";

const minimal: SoerBody = {
	messageSpec: {
		messageRefId: "MSG-2026-04-15-001",
		timestamp: "2026-04-15T10:00:00Z",
	},
	soer: [
		{
			art: "E108c",
			refNr: "REF-001",
			fastnrOrg: "123456789",
			datvon: "2025",
			anhang: "JVBERi0xLjQ=",
		},
	],
};

describe("SOER build()", () => {
	it("emits namespaced root + MessageSpec + one SOER", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain(
			'<SonstigeErklaerungenUebermittlung xmlns="https://finanzonline.bmf.gv.at/fon/ws/uebermittlungSonstigeErklaerungen">',
		);
		expect(xml).toContain("<MessageSpec>");
		expect(xml).toContain("<MessageRefId>MSG-2026-04-15-001</MessageRefId>");
		expect(xml).toContain("<Timestamp>2026-04-15T10:00:00Z</Timestamp>");
		expect(xml).toContain('<SOER art="E108c">');
		expect(xml).toContain("<RefNr>REF-001</RefNr>");
		expect(xml).toContain("<Fastnr_Org>123456789</Fastnr_Org>");
		expect(xml).toContain("<Datvon>2025</Datvon>");
		expect(xml).toContain("<Anhang>JVBERi0xLjQ=</Anhang>");
		expect(xml).toContain("</SonstigeErklaerungenUebermittlung>");
	});

	it("includes Info_Daten only when provided", () => {
		expect(build(minimal)).not.toContain("<Info_Daten>");
		const xml = build({ ...minimal, info: { fastnrFonTn: "234567890" } });
		expect(xml).toContain("<Info_Daten><Fastnr_Fon_Tn>234567890</Fastnr_Fon_Tn></Info_Daten>");
	});

	it("emits Datbis only when provided", () => {
		expect(build(minimal)).not.toContain("<Datbis>");
		const xml = build({
			...minimal,
			soer: [{ ...minimal.soer[0]!, datbis: "202512" }],
		});
		expect(xml).toContain("<Datbis>202512</Datbis>");
	});

	it("emits all 7 art enumerations", () => {
		for (const art of ["E108c", "KR1", "ENAV1", "KOH1", "WA1", "ELA1", "EGA1"] as const) {
			const xml = build({ ...minimal, soer: [{ ...minimal.soer[0]!, art }] });
			expect(xml).toContain(`<SOER art="${art}">`);
		}
	});

	it("emits SOER children in XSD-required order", () => {
		const xml = build({
			...minimal,
			soer: [{ ...minimal.soer[0]!, datbis: "202512" }],
		});
		const order = ["<RefNr>", "<Fastnr_Org>", "<Datvon>", "<Datbis>", "<Anhang>"];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects malformed Datvon (must be 4..6 digits)", () => {
		const bad: SoerBody = {
			...minimal,
			soer: [{ ...minimal.soer[0]!, datvon: "2025-04" }],
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects RefNr with disallowed characters", () => {
		const bad: SoerBody = {
			...minimal,
			soer: [{ ...minimal.soer[0]!, refNr: "REF 001" }], // space not in [0-9a-zA-Z-/\\]
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects malformed Timestamp", () => {
		const bad: SoerBody = {
			...minimal,
			messageSpec: { ...minimal.messageSpec, timestamp: "2026-04-15 10:00:00" },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects empty SOER list", () => {
		const bad: SoerBody = { ...minimal, soer: [] };
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("respects 10 000-SOER cap", () => {
		const bad: SoerBody = {
			...minimal,
			soer: Array.from({ length: 10_001 }, () => ({ ...minimal.soer[0]! })),
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
