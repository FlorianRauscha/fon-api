import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type DigiBody, build } from "../../../src/digi/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/digi/current/BMF_XSD_Schema_Digitalsteuer.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-digi-"));
	const xmlPath = join(dir, "digi.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("DIGI XSD conformance", () => {
	it("Bannerwerbung filing validates", () => {
		const body: DigiBody = {
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
					art: "DIGI",
					satznr: 1,
					allgemein: { anbringen: "DIGI", zr: "2025", fastnr: "123456789" },
					bemessungsgrundlage: {
						artLeistung: "BA",
						ortLtg: "Wien, Österreich",
						wjBeg: "202501",
						wjEnde: "202512",
						ums212a: 1_000_000,
						entgelt: 850_000,
						ausg: 50_000,
						bemGes: 800_000,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("multi-Erklärung packet (3 ad types) validates", () => {
		const body: DigiBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 7,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 3,
			},
			erklaerungen: ["BA" as const, "SU" as const, "SO" as const].map((art, i) => ({
				art: "DIGI" as const,
				satznr: i + 1,
				allgemein: { anbringen: "DIGI" as const, zr: "2025", fastnr: "123456789" },
				bemessungsgrundlage: {
					artLeistung: art,
					ortLtg: "Wien",
					wjBeg: "202501",
					wjEnde: "202512",
					ums212a: 100_000,
					entgelt: 85_000,
					bemGes: 85_000,
				},
			})),
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
