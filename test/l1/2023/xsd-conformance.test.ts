import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type L1Body, build } from "../../../src/l1/2023/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/l1/2023/BMF_XSD_Schema_Arbeitnehmerveranlagung_2023.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-l1-2023-"));
	const xmlPath = join(dir, "l1.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("L1 2023 XSD conformance", () => {
	it("PFLEGE_K_A/E (gMonth) + ALLGEMEINE_DATEN AGBEL_P validate (audit fix)", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 5,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:30:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2023",
						fastnr: "123456789",
						anzbez: 1,
						agbelP: "J",
					},
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [
								{
									famname: "Mustermann",
									vorname: "Max",
									vnrkinK: "1234150115",
									gebkinK: "2015-01-15",
									wsKind: "A",
									pflegeK: 200,
									pflegeKa: "--03",
									pflegeKe: "--09",
								},
							],
						},
					},
				},
			],
		};
		const xml = build(body);
		expect(xml).toContain('<PFLEGE_K_A type="monat">--03</PFLEGE_K_A>');
		expect(xml).toContain("<AGBEL_P>J</AGBEL_P>");
		const r = validateAgainstXsd(xml);
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("minimal payload validates against L1 2023 XSD", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 1,
				datumErstellung: "2024-04-15",
				uhrzeitErstellung: "10:30:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2023",
						fastnr: "123456789",
						anzbez: 1,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("typed sections without 2024-only fields validate", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 2,
				datumErstellung: "2024-04-15",
				uhrzeitErstellung: "10:30:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2023",
						fastnr: "123456789",
						anzbez: 1,
					},
					sonderausgaben: { kz460: 500, kz280: 100 },
					international: {
						auslEin: "J",
						kz359: 1_000,
						kz154: 200,
						land1L1: "D",
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
