import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type StabBody, build } from "../../../src/stab/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/stab/current/BMF_XSD_Schema_Stabilitaetsabgabe_2017.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-stab-"));
	const xmlPath = join(dir, "stab.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("STAB XSD conformance", () => {
	it("standard bank-fee filing validates", () => {
		const body: StabBody = {
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
					art: "STAB",
					satznr: 1,
					allgemein: { anbringen: "STAB", zr: "2025", fastnr: "123456789" },
					bemessungsgrundlage: {
						bemSta3: 100_000_000,
						jahrUeb: 5_000_000,
						belOg: 1_500_000,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("Neugründung filing (NEUGR=J) validates", () => {
		const body: StabBody = {
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
					art: "STAB",
					satznr: 1,
					allgemein: { anbringen: "STAB", zr: "2025", fastnr: "123456789" },
					bemessungsgrundlage: { neugr: "J", bemSta3: 50_000_000 },
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
