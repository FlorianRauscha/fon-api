import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type SbzBody, build } from "../../../src/sbz/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/sbz/current/BMF_XSD_Schema_Meldung_SB.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-sbz-"));
	const xmlPath = join(dir, "sbz.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("SBZ XSD conformance", () => {
	it("payment notice with multiple Verrechnungsweisungen validates", () => {
		const body: SbzBody = {
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
					art: "SBZ",
					allgemein: { satznr: 1, anbringen: "SBZ", fastnr: "123456789", kundeninfo: "Q1 payment" },
					verrechnungsweisungen: [
						{
							aa: "030",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: 1500,
						},
						{
							aa: "445",
							zrvon: { value: "2025", type: "jahr" },
							zrbis: { value: "2025", type: "jahr" },
							betrag: 2500,
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
