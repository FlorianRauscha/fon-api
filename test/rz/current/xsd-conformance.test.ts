import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type RzBody, build } from "../../../src/rz/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/rz/current/BMF_XSD_Schema_Rueckzahlung.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-rz-"));
	const xmlPath = join(dir, "rz.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("RZ XSD conformance", () => {
	it("Inland refund with IBAN/BIC validates", () => {
		const body: RzBody = {
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
					art: "RZ",
					allgemein: { satznr: 1, anbringen: "RZ", artRz: "I", fastnr: "123456789" },
					empfaenger: [
						{
							namee: "Max Mustermann",
							betrag: 1500,
							unbar: { iban: "AT611904300234573201", bic: "BKAUATWW", bank: "Bank Austria" },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("BAR (cash) refund validates", () => {
		const body: RzBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "RZ",
					allgemein: { satznr: 1, anbringen: "RZ", artRz: "I", fastnr: "123456789" },
					empfaenger: [
						{
							namee: "Cash Recipient",
							betrag: 500,
							bar: { ort: "Wien", plze: "1010", adre: "Stephansplatz 1" },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-recipient packet with up to 3 EMPFAENGER validates", () => {
		const body: RzBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 12,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "RZ",
					allgemein: { satznr: 1, anbringen: "RZ", artRz: "I", fastnr: "123456789" },
					empfaenger: [
						{ namee: "Recipient One", betrag: 100, unbar: { iban: "AT611904300234573201" } },
						{ namee: "Recipient Two", betrag: 200, unbar: { iban: "AT581200000940000001" } },
						{
							namee: "Recipient Three",
							betrag: 300,
							bar: { plze: "1010", adre: "Stephansplatz 1" },
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
