import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type UebBody, build } from "../../../src/ueb/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/ueb/current/BMF_XSD_Schema_Uebertragung.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-ueb-"));
	const xmlPath = join(dir, "ueb.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("UEB XSD conformance", () => {
	it("UEBERTRAGENDER_BETRAG-only payload validates", () => {
		const body: UebBody = {
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
					art: "UEB",
					allgemein: {
						satznr: 1,
						anbringen: "UEB",
						fastnr: "123456789",
						fastnrZu: "987654321",
					},
					uebertragenderBetrag: 1500,
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("Full transfer with WEG + UEBERTRAGENDER_BETRAG + ZU validates", () => {
		const body: UebBody = {
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
					art: "UEB",
					allgemein: {
						satznr: 1,
						anbringen: "UEB",
						fastnr: "123456789",
						fastnrZu: "987654321",
						kundeninfo: "Q1 settlement transfer",
					},
					wegbuchungen: [
						{
							aa: "030",
							zrvon: { value: "2026-03", type: "jahrmonat" },
							zrbis: { value: "2026-03", type: "jahrmonat" },
							betrag: -1500,
						},
					],
					uebertragenderBetrag: 1500,
					zubuchungen: [
						{
							aa: "445",
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
});
