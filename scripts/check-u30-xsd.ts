#!/usr/bin/env tsx
/**
 * End-to-end check: build a U30 07_2026 sample payload and validate it against
 * the official BMF XSD using system `xmllint`. Run with: `npx tsx scripts/check-u30-xsd.ts`.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build, type U30Body } from "../src/u30/07_2026/index.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const XSD = join(ROOT, "schemas/u30/07_2026/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_07_2026.xsd");

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
				kundeninfo: "Test submission — Müller & Co",
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

const xml = build(sample);
const dir = mkdtempSync(join(tmpdir(), "fon-u30-"));
const xmlPath = join(dir, "u30.xml");
writeFileSync(xmlPath, xml, "utf8");

console.log(`Generated XML (${xml.length} bytes) → ${xmlPath}`);
console.log("---");
console.log(xml);
console.log("---");

try {
	const out = execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], {
		stdio: ["ignore", "pipe", "pipe"],
		encoding: "utf8",
	});
	console.log("xmllint stdout:", out);
	console.log("✓ XML validates against BMF U30 07_2026 XSD");
} catch (err) {
	const e = err as { stderr?: Buffer; stdout?: Buffer; status?: number };
	console.error("✗ XSD validation failed");
	console.error("stderr:", e.stderr?.toString());
	console.error("stdout:", e.stdout?.toString());
	process.exit(1);
}
