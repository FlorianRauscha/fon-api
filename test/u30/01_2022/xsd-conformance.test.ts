import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type U30Body, build } from "../../../src/u30/01_2022/index.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const XSD = join(ROOT, "schemas/u30/01_2022/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_01_2022.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-u30-01-"));
	const xmlPath = join(dir, "u30.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("U30 01_2022 XSD conformance", () => {
	it("realistic payload validates against BMF XSD", () => {
		const body: U30Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2024-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "U30",
					satznr: 1,
					allgemein: {
						anbringen: "U30",
						zrvon: "2024-03",
						zrbis: "2024-03",
						fastnr: "123456789",
						kundeninfo: "Q1/2024",
					},
					lieferungen: {
						kz000: 80000,
						kz001: 75000,
						versteuert: { kz022: 60000, kz029: 10000, kz006: 5000 },
					},
					innergemeinschaftlich: {
						kz070: 2000,
						versteuertIge: { kz072: 2000 },
					},
					vorsteuer: { kz060: 12000, kz090: -300 },
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
