import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type SbBody, build } from "../../../src/sb/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/sb/current/BMF_XSD_Schema_Buchung_SB.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-sb-"));
	const xmlPath = join(dir, "sb.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("SB XSD conformance", () => {
	it("single Verrechnungsweisung validates", () => {
		const body: SbBody = {
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
					art: "SB",
					allgemein: { satznr: 1, anbringen: "SB", fastnr: "123456789" },
					verrechnungsweisungen: [
						{
							aa: "030",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 1500,
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-Weisung packet with UVA period + mixed ZR types validates", () => {
		const body: SbBody = {
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
					art: "SB",
					allgemein: {
						satznr: 1,
						anbringen: "SB",
						fastnr: "123456789",
						kundeninfo: "Q1 settlement",
					},
					uvaZeitraum: { uvazrvon: "2026-01", uvazrbis: "2026-03" },
					verrechnungsweisungen: [
						{
							aa: "030",
							zrvon: { value: "2026-01-01", type: "datum" },
							zrbis: { value: "2026-03-31", type: "datum" },
							betrag: 5000,
						},
						{
							aa: "445",
							zrvon: { value: "2025", type: "jahr" },
							zrbis: { value: "2025", type: "jahr" },
							betrag: -250.5,
						},
						{
							aa: "163",
							zrvon: { value: "2026-02", type: "jahrmonat" },
							zrbis: { value: "2026-02", type: "jahrmonat" },
							betrag: 750,
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
