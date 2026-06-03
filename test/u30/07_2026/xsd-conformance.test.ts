/**
 * End-to-end conformance: pipe a built U30 XML payload through system `xmllint`
 * and ensure libxml accepts it against the real BMF XSD.
 *
 * Skipped automatically when xmllint isn't on PATH (e.g. minimal CI containers).
 * On macOS / Debian-family with libxml2-utils installed it runs in <50ms.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type U30Body, build } from "../../../src/u30/07_2026/index.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const XSD = join(ROOT, "schemas/u30/07_2026/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_07_2026.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-u30-"));
	const xmlPath = join(dir, "u30.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

const sample: U30Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 42,
		datumErstellung: "2026-08-15",
		uhrzeitErstellung: "10:30:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U30",
			satznr: 1,
			allgemein: {
				anbringen: "U30",
				zrvon: "2026-07",
				zrbis: "2026-07",
				fastnr: "123456789",
				kundeninfo: "Test — Müller & Co",
			},
			lieferungen: {
				kz000: 25000,
				kz001: 20000,
				steuerfrei: { kz011: 1500 },
				versteuert: { kz022: 18000, kz124: 500, kz029: 1200, kz006: 800 },
			},
			innergemeinschaftlich: {
				kz070: 5000,
				versteuertIge: { kz072: 5000, kz125: 100 },
			},
			vorsteuer: { kz060: 3600, kz061: 200, kz090: -150 },
		},
	],
};

describe.skipIf(!hasXmllint())("U30 07_2026 XSD conformance", () => {
	it("realistic payload validates against BMF XSD", () => {
		const xml = build(sample);
		const r = validateAgainstXsd(xml);
		if (!r.ok) {
			throw new Error(`xmllint rejected the generated XML:\n${r.stderr}\n\nXML was:\n${xml}`);
		}
		expect(r.ok).toBe(true);
	});

	it("minimal payload (only required fields) validates", () => {
		const minimal: U30Body = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 1,
				datumErstellung: "2026-08-01",
				uhrzeitErstellung: "00:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "U30",
					satznr: 1,
					allgemein: {
						anbringen: "U30",
						zrvon: "2026-07",
						zrbis: "2026-07",
						fastnr: "123456789",
					},
					lieferungen: { kz000: 0 },
				},
			],
		};
		const r = validateAgainstXsd(build(minimal));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-Erklärung packet (3 of them) validates", () => {
		const multi: U30Body = {
			info: { ...sample.info, paketNr: 99, anzahlErklaerungen: 3 },
			erklaerungen: [
				{ ...sample.erklaerungen[0]!, satznr: 1 },
				{ ...sample.erklaerungen[0]!, satznr: 2 },
				{ ...sample.erklaerungen[0]!, satznr: 3 },
			],
		};
		const r = validateAgainstXsd(build(multi));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
