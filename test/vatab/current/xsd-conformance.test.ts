import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type VatabBody, build } from "../../../src/vatab/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/vat/current/BMF_XSD_Schema_VAT_Antrag_Abschluss.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-vatab-"));
	const xmlPath = join(dir, "vatab.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("VATAB XSD conformance", () => {
	it("standard close-out (no PDF) validates", () => {
		const body: VatabBody = {
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
					art: "VATAB",
					satznr: 1,
					allgemein: {
						anbringen: "VATAB",
						antragnr: "AT00000000000001",
						zrvon: "2026-01",
						zrbis: "2026-12",
						fastnr: "123456789",
						euLand: "DE",
						emailUnternehmer: "owner@example.com",
						nace: ["4711"],
						kontoinhaber: "Acme GmbH",
						inhabertyp: "A",
						iban: "AT611904300234573201",
						bic: "BKAUATWWXXX",
						waehrBank: "EUR",
						frage1a: "J",
						frage1b: "N",
						frage1c: "N",
					},
					abschluss: {
						gesamtKauf: 5,
						gesamtBmgKauf: 12_500,
						gesamtImport: 0,
						gesamtBmgImport: 0,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("close-out with PDF anhang + multi-NACE + Vertreter validates", () => {
		const body: VatabBody = {
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
					art: "VATAB",
					satznr: 1,
					allgemein: {
						anbringen: "VATAB",
						zrvon: "2026-01",
						zrbis: "2026-06",
						fastnr: "123456789",
						kundeninfo: "Reference 42",
						euLand: "FR",
						emailUnternehmer: "owner@example.com",
						emailVertreter: "rep@example.com",
						nace: ["4711", "5611", "6210"],
						kontoinhaber: "Test KG",
						inhabertyp: "D",
						iban: "DE89370400440532013000",
						bic: "DEUTDEFFXXX",
						waehrBank: "EUR",
						frage1a: "J",
						frage1b: "J",
						frage1c: "N",
						frage2a: "J",
						frage2b: "N",
					},
					abschluss: {
						gesamtKauf: 25,
						gesamtBmgKauf: 50_000.5,
						gesamtImport: 3,
						gesamtBmgImport: 1_500,
						anhang: { pdf: { base64: "JVBERi0xLjQKJeLjz9MK" } },
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
