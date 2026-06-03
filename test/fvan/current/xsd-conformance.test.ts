import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type FvanBody, build } from "../../../src/fvan/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/fvan/current/BMF_XSD_Schema_Fristverlaengerung.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-fvan-"));
	const xmlPath = join(dir, "fvan.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("FVAN XSD conformance", () => {
	it("single Fristverlängerungs-request validates", () => {
		const body: FvanBody = {
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
					art: "FVAN",
					satznr: 1,
					anbringen: "FVAN",
					fastnr: "123456789",
					kundeninfo: "Q1/2026 ext",
					erklZr: "2025",
					datfrist: "2026-09-30",
					begruend: "Verzögerung durch Krankheit der Buchhalterin",
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-Erklärung packet (3 different deadlines) validates", () => {
		const body: FvanBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 3,
			},
			erklaerungen: [
				{
					art: "FVAN",
					satznr: 1,
					anbringen: "FVAN",
					fastnr: "123456789",
					erklZr: "2025",
					datfrist: "2026-09-30",
					begruend: "Buchhaltungsabschluss verzögert",
				},
				{
					art: "FVAN",
					satznr: 2,
					anbringen: "FVAN",
					fastnr: "123456789",
					erklZr: "2024",
					datfrist: "2026-10-31",
					begruend: "Nachtragsdokumente abzuwarten",
				},
				{
					art: "FVAN",
					satznr: 3,
					anbringen: "FVAN",
					fastnr: "123456789",
					erklZr: "2023",
					datfrist: "2026-12-31",
					begruend: "Korrektur einer Vorjahres-Anmeldung",
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
