import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type VatBody, build } from "../../../src/vat/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/vat/current/BMF_XSD_Schema_VAT_Antrag.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-vat-"));
	const xmlPath = join(dir, "vat.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("VAT XSD conformance", () => {
	it("KAUF-only filing validates", () => {
		const body: VatBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 1,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "VAT",
					satznr: 1,
					allgemein: {
						anbringen: "VAT",
						zrvon: "2026-01",
						zrbis: "2026-03",
						fastnr: "123456789",
						euLand: "DE",
						sprache: "de",
					},
					kaeufe: [
						{
							seqnr: 1,
							beznr: "INV-2026-001",
							datum: "2026-02-15",
							kleinbetr: "N",
							uid: "DE123456789",
							name: "Lieferant GmbH",
							adr: "Hauptstr 1",
							plz: "10115",
							stadt: "Berlin",
							land: "DE",
							gegenstaende: [
								{ code: 1, subcode: "1.05", beschreibung: "Diesel" },
								{ code: 2, beschreibung: "Reparatur" },
							],
							grundlagen: { waehrung: "EUR", bmg: 1000, vst: 190, abvst: 190 },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("IMPORT-only filing validates", () => {
		const body: VatBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 2,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "VAT",
					satznr: 1,
					allgemein: {
						anbringen: "VAT",
						antragnr: "AT00000000000001",
						zrvon: "2026-01",
						zrbis: "2026-03",
						fastnr: "123456789",
						euLand: "FR",
					},
					importe: [
						{
							seqnr: 1,
							importnr: "IM-2026-7",
							datum: "2026-02-15",
							name: "Importer Co",
							adr: "Customs Way 1",
							plz: "999077",
							stadt: "Hong Kong",
							land: "HK",
							gegenstaende: [{ code: 4 }],
							grundlagen: { waehrung: "EUR", bmg: 500, vst: 100, abvst: 100 },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("mixed KAUF+IMPORT filing validates", () => {
		const body: VatBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 3,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "VAT",
					satznr: 1,
					allgemein: {
						anbringen: "VAT",
						zrvon: "2026-01",
						zrbis: "2026-12",
						fastnr: "123456789",
						euLand: "DE",
					},
					kaeufe: [
						{
							seqnr: 1,
							beznr: "K-1",
							datum: "2026-03-15",
							kleinbetr: "J",
							name: "Mini Inc",
							adr: "Side St 1",
							plz: "10115",
							stadt: "Berlin",
							land: "DE",
							gegenstaende: [{ code: 5 }],
							grundlagen: { waehrung: "EUR", bmg: 100, vst: 19, abvst: 19 },
						},
					],
					importe: [
						{
							seqnr: 1,
							datum: "2026-04-01",
							name: "Trader Ltd",
							adr: "Pier 9",
							plz: "PO12345",
							stadt: "Singapore",
							land: "SG",
							gegenstaende: [{ code: 7, subcode: "7.01" }],
							grundlagen: { waehrung: "EUR", bmg: 750, vst: 0, abvst: 0 },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
