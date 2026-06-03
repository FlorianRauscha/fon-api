import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type KomuBody, build } from "../../../src/komu/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/komu/current/BMF_XSD_Schema_Kommunalsteuerbemessungsgrundlage.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-komu-"));
	const xmlPath = join(dir, "komu.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("KOMU XSD conformance", () => {
	it("standard 2-Erklärungen filing validates", () => {
		const body: KomuBody = {
			info: {
				artIdentifikationsbegriff: "GD",
				identifikationsbegriff: "10101",
				paketNr: 1,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 2,
			},
			erklaerungen: [
				{
					art: "KOMU",
					satznr: 1,
					anbringen: "KOM",
					zr: "2025",
					fastnr: "123456789",
					bmg: 250_000,
					vb: "J",
					km: "N",
					ns: "N",
				},
				{
					art: "KOMU",
					satznr: 2,
					anbringen: "KOM",
					zr: "2025",
					fastnr: "234567890",
					bmg: 1_500_000.5,
					mit: "Berichtigung",
					vb: "N",
					km: "J",
					ns: "J",
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
