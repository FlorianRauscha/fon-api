import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type DueBody, build } from "../../../src/due/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/due/current/BMF_XSD_Schema_Depotuebertragung.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-due-"));
	const xmlPath = join(dir, "due.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("DUE XSD conformance", () => {
	it("transfer Erklärung with FASTNR Depotinhaber + firma transfer-target validates", () => {
		const body: DueBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 1,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
				fastnrMitteiler: "234567890",
				nameMitteiler: "Bank AG",
			},
			erklaerungen: [
				{
					art: "DUE",
					allgemein: {
						kind: "transfer",
						anbringen: "DUE",
						refnr: "REF-2026-1",
						gesetz: "274T",
						datueb: "2026-03-31",
						depotfuehrendeStelle: { depStelle: "Wiener Bank Privat", bic: "BKAUATWWXXX" },
					},
					depotinhaber: [{ kind: "fastnr", fastnr: "123456789" }],
					betroffeneWertpapiere: [
						{
							bezWg: "Apple Inc",
							isin: "US0378331005",
							men: 100,
							kennMen: "S",
							ak: 15_000,
							kennAk: "T",
						},
					],
					uebertragungAuf: [
						{
							kind: "firma",
							firmname: "Receiving Bank GmbH",
							str: "Hauptstr",
							nr: "1",
							plz: "10115",
							ort: "Berlin",
							land: "D",
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("Gesamtrückrufung Erklärung validates", () => {
		const body: DueBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 2,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
				fastnrMitteiler: "234567890",
				nameMitteiler: "Bank AG",
			},
			erklaerungen: [
				{
					art: "DUE",
					allgemein: { kind: "gesamtrueck", anbringen: "DUE", refnr: "RUECK-1" },
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("person Depotinhaber + person Übertragung-target validates", () => {
		const body: DueBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 3,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
				fastnrMitteiler: "234567890",
				nameMitteiler: "Bank AG",
			},
			erklaerungen: [
				{
					art: "DUE",
					allgemein: {
						kind: "transfer",
						anbringen: "DUE",
						refnr: "REF-PERSON-1",
						gesetz: "273T",
						gemeinschaftsdepotD: "J",
						datueb: "2026-04-01",
						depotfuehrendeStelle: { depStelle: "BAWAG", bic: "BAWAATWWXXX" },
					},
					depotinhaber: [
						{
							kind: "person",
							nname: "Mustermann",
							vname: "Max",
							geb: "1970-01-01",
							str: "Lindenallee",
							nr: "5",
							plz: "1010",
							ort: "Wien",
							land: "A",
						},
					],
					betroffeneWertpapiere: [
						{
							bezWg: "Bundesschatz Anleihe 2030",
							isin: "AT0000A1ZGE4",
							men: 50_000,
							kennMen: "N",
							ak: 49_500,
							kennAk: "K",
						},
					],
					uebertragungAuf: [
						{
							kind: "person",
							nname: "Mustermann",
							vname: "Max",
							geb: "1970-01-01",
							str: "Friedrichstr",
							nr: "100",
							plz: "10117",
							ort: "Berlin",
							land: "D",
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
