import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type KA1Body, build } from "../../../src/ka1/ab_2022/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(
	ROOT,
	"schemas/ka1/ab_2022/BMF_XSD_Schema_Kapitalertragsteuer_Anmeldung_KA1_ab_2022.xsd",
);

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-ka1-"));
	const xmlPath = join(dir, "ka1.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("KA1 ab_2022 XSD conformance", () => {
	it("KA1M payload with BMG_M validates", () => {
		const body: KA1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 1,
				datumErstellung: "2026-05-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "KA1M",
					satznr: 1,
					allgemein: {
						anbringen: "KA1M",
						zr: { value: "2026-04", type: "jahrmonat" },
						fastnr: "123456789",
					},
					bmgM: {
						kam11: 10_000,
						kam21: 2_750,
						summeKa: 2_750,
						kbm31: 5_000,
						summeKb: 1_375,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("KA1T payload with BMG_T + KAT_BEGR enum + SVA_DATEN beneficiaries validates", () => {
		const body: KA1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2026-05-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "KA1T",
					satznr: 1,
					allgemein: {
						anbringen: "KA1T",
						zr: { value: "2026-05-15", type: "datum" },
						fastnr: "123456789",
					},
					bmgT: {
						kat11: 50_000,
						katBegr: "03",
						kat25: 1_250,
						katDat25Mel: "2026-05-15",
						summeKa: 1_250,
					},
					svaDaten: [
						{ vnr: "1234150115", name: "Mustermann GmbH", betrag: 1_000 },
						{ vnr: "5678180220", name: "Beispiel AG", betrag: 250 },
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("KA1V payload with BMG_VE date ranges validates", () => {
		const body: KA1Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 99,
				datumErstellung: "2026-07-01",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "KA1V",
					satznr: 1,
					allgemein: {
						anbringen: "KA1V",
						zr: { value: "2026", type: "jahr" },
						fastnr: "123456789",
					},
					bmgVe: {
						kbve11: 8_000,
						kbveDat11Von: "2026-01-01",
						kbveDat11Bis: "2026-06-30",
						summeKb: 8_000,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
