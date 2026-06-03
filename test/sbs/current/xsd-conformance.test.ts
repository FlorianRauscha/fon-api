import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type SbsBody, build } from "../../../src/sbs/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/sbs/current/BMF_XSD_Schema_Berichtigung_Buchung_SB.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-sbs-"));
	const xmlPath = join(dir, "sbs.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("SBS XSD conformance", () => {
	it("correction with original-only IST validates", () => {
		const body: SbsBody = {
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
					art: "SBS",
					allgemein: { satznr: 1, anbringen: "SBS", fastnr: "123456789" },
					buchtag: "2026-04-01",
					berichtigung: {
						ist: [
							{
								aa: "030",
								zrvon: { value: "2026-03", type: "jahrmonat" },
								zrbis: { value: "2026-03", type: "jahrmonat" },
								betrag: 1500,
							},
						],
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("correction with IST + BER replacement validates", () => {
		const body: SbsBody = {
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
					art: "SBS",
					allgemein: { satznr: 1, anbringen: "SBS", fastnr: "123456789" },
					buchtag: "2026-04-01",
					berichtigung: {
						ist: [
							{
								aa: "030",
								zrvon: { value: "2026-03", type: "jahrmonat" },
								zrbis: { value: "2026-03", type: "jahrmonat" },
								betrag: 1500,
							},
						],
						ber: [
							{
								aa: "030",
								zrvon: { value: "2026-03", type: "jahrmonat" },
								zrbis: { value: "2026-03", type: "jahrmonat" },
								betrag: 1750,
							},
						],
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
