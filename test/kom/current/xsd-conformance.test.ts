import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type KOMBody, build } from "../../../src/kom/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/kom/current/BMF_XSD_Schema_KommSt1_KommSt2.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-kom-"));
	const xmlPath = join(dir, "kom.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("KOM XSD conformance", () => {
	it("KOMMST1 with single GEMEINDE validates", () => {
		const body: KOMBody = {
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
					art: "KOMMST1",
					satznr: 1,
					allgemein: { anbringen: "KOMMST1", jahr: "2025", fastnr: "123456789" },
					gemeinden: [{ gd: "90001", plz: "1010", gem: "Wien", bmg: 100_000, steuer: 3_000 }],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("KOMMST1 with summary + 3 municipalities validates", () => {
		const body: KOMBody = {
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
					art: "KOMMST1",
					satznr: 1,
					allgemein: {
						anbringen: "KOMMST1",
						jahr: "2025",
						fastnr: "123456789",
						kundeninfo: "Multi-location",
					},
					gesamteBemessungsgrundlage: { gesamtBmg: 250_000, gesamtSteuer: 7_500 },
					gemeinden: [
						{ gd: "90001", plz: "1010", gem: "Wien", bmg: 100_000, steuer: 3_000 },
						{ gd: "60101", plz: "8010", gem: "Graz", bmg: 100_000, steuer: 3_000 },
						{ gd: "70101", plz: "4020", gem: "Linz", bmg: 50_000, steuer: 1_500 },
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("KOMMST2 (Korrektur) with RUECK flag validates", () => {
		const body: KOMBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 99,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "KOMMST2",
					satznr: 1,
					allgemein: { anbringen: "KOMMST2", jahr: "2024", fastnr: "123456789" },
					gemeinden: [
						{ gd: "90001", plz: "1010", gem: "Wien", bmg: 50_000, steuer: 1_500, rueck: "J" },
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
