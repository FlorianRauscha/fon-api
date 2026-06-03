import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type L1Body, build } from "../../../src/l1/2025/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/l1/2025/BMF_XSD_Schema_Arbeitnehmerveranlagung_2025.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-l1-"));
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

describe.skipIf(!hasXmllint())("L1 2025 XSD conformance", () => {
	it("PFLEGE_K_A/E (gMonth) validate (audit fix)", () => {
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
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1 },
					aussergewoehnlicheBelastungen: {
						allgemein: { agbelP: "J", kz730: 100 },
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
		const r = validateAgainstXsd(xml);
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("minimal payload validates against BMF XSD", () => {
		const body: L1Body = {
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
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2025",
						fastnr: "123456789",
						anzbez: 1,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("realistic payload with all ALLGEMEINE_DATEN flags validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2025",
						fastnr: "123456789",
						kundeninfo: "ANV-2025/A1",
						anzbez: 2,
						kz725: 132.0,
						avab: "J",
						kindfb: 1,
						mehrki: "J",
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("payload with typed SONDERAUSGABEN + WERBUNGSKOSTEN (incl. job blocks) validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 11,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: {
						anbringen: "L1",
						zr: "2025",
						fastnr: "123456789",
						anzbez: 1,
					},
					sonderausgaben: { kz460: 500, kz280: 100 },
					werbungskosten: {
						kz717: 250,
						beruf: "Software Engineer",
						job1: { beruf: "V", zrvon: "--01-01", zrbis: "--06-30", kzPauschale: 825 },
						job2: { beruf: "P", zrvon: "--07-01", zrbis: "--12-31", kzPauschale: 425 },
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("payload with typed AUSSERGEWOEHNLICHE_BELASTUNGEN (allgemein + behinderung) validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 13,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1 },
					aussergewoehnlicheBelastungen: {
						allgemein: { agbelP: "J", kz730: 100, kz475: 250 },
						behinderung: {
							steuerpflichtiger: {
								koerperS: 50,
								diaetSz: "J",
								pflegeSa: "--01",
								pflegeSe: "--12",
								kfzS: "J",
								kz435: 1200,
							},
							partner: { koerperP: 30, kz436: 800 },
						},
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("payload with typed FREIBETRAGSBESCHEID + BESONDERE_SONDERAUSGABEN_VERTEILUNG validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 17,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1 },
					freibetragsbescheid: { indfb: "J", kz449: 1500 },
					besondereSonderausgabenVerteilung: {
						famD: "Mustermann",
						vorD: "Erika",
						vnrD: "1234010180",
						gebdatD: "1980-01-01",
						kz281: 100,
						zus1D: "J",
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("payload with typed INTERNATIONAL (Auslands-L17 + Doppelbesteuerung) validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 21,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1 },
					international: {
						wsInl: "J",
						dbanrech: "J",
						auslEin: "J",
						staat3: "D",
						kz359: 1500,
						pensausl: "J",
						anzl17: 1,
						land1L1: "D",
						wk1L1: 200,
						auslst1: 50,
						ausantr: "J",
						sv184: "J",
						asStaat: "D",
						einkS: 12_000,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("payload with two children including FB monthly grids validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 25,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1, kindfb: 2 },
					aussergewoehnlicheBelastungen: {
						kindAusbildungBehinderung: {
							kindAngaben: [
								{
									famname: "Mustermann",
									vorname: "Max",
									vnrkinK: "1234150115",
									gebkinK: "2015-01-15",
									wsKind: "A",
									kostraK: 100,
									koerperK: 50,
									fbMonate: {
										1: { s: "J", fb100: "J" },
										2: { s: "J", fb100: "J" },
										3: { s: "J", fb100: "J" },
										4: { s: "J", fb100: "J" },
										5: { s: "J", fb100: "J" },
										6: { s: "J", fb100: "J" },
										7: { s: "J", fb100: "J" },
										8: { s: "J", fb100: "J" },
										9: { s: "J", fb100: "J" },
										10: { s: "J", fb100: "J" },
										11: { s: "J", fb100: "J" },
										12: { s: "J", fb100: "J" },
									},
								},
								{
									famname: "Mustermann",
									vorname: "Mia",
									vnrkinK: "5678180220",
									gebkinK: "2018-02-20",
									wsKind: "A",
									kostraK: 100,
									fbMonate: {
										1: { p: "J", fb50: "J" },
										12: { p: "J", fb50: "J" },
									},
								},
							],
						},
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-Erklärung packet validates", () => {
		const body: L1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 99,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "12:00:00",
				anzahlErklaerungen: 3,
			},
			erklaerungen: [
				{
					art: "L1",
					satznr: 1,
					allgemein: { anbringen: "L1", zr: "2025", fastnr: "123456789", anzbez: 1 },
				},
				{
					art: "L1",
					satznr: 2,
					allgemein: { anbringen: "L1", zr: "2024", fastnr: "123456789", anzbez: 1 },
				},
				{
					art: "L1",
					satznr: 3,
					allgemein: { anbringen: "L1", zr: "2023", fastnr: "123456789", anzbez: 0 },
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
