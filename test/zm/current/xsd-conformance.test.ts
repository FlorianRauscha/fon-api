import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type ZMBody, build } from "../../../src/zm/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/zm/current/BMF_XSD_Schema_Zusammenfassende_Meldung.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-zm-"));
	const xmlPath = join(dir, "zm.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("ZM XSD conformance", () => {
	it("monthly ZM with multiple EU customers validates", () => {
		const body: ZMBody = {
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
					art: "U13",
					satznr: 1,
					allgemein: {
						anbringen: "U13",
						zrvon: "2026-03",
						zrbis: "2026-03",
						fastnr: "123456789",
						kundeninfo: "Q1/2026",
					},
					content: {
						kind: "entries",
						entries: [
							{ uidMs: "DE123456789", sumBgl: 5000, klag: "1" },
							{ uidMs: "FR12345678901", sumBgl: 2500, klag: "2", solei: "J" },
							{ uidMs: "ITTH12345678", sumBgl: 1000, klag: "3", dreieck: "J" },
						],
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("GESAMTRUECKZIEHUNG retraction validates", () => {
		const body: ZMBody = {
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
					art: "U13",
					satznr: 1,
					allgemein: {
						anbringen: "U13",
						zrvon: "2026-03",
						zrbis: "2026-03",
						fastnr: "123456789",
					},
					content: {
						kind: "gesamtrueckziehung",
						gesamtrueckziehung: { gesamtrueck: "J" },
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("negative SUM_BGL (correction) validates", () => {
		const body: ZMBody = {
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
					art: "U13",
					satznr: 1,
					allgemein: {
						anbringen: "U13",
						zrvon: "2026-03",
						zrbis: "2026-03",
						fastnr: "123456789",
					},
					content: {
						kind: "entries",
						entries: [{ uidMs: "DE123456789", sumBgl: -1500, klag: "1" }],
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
