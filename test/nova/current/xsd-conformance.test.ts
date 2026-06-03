import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type NovaBody, build } from "../../../src/nova/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/nova/current/BMF_XSD_Schema_Normverbrauchsabgabe.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-nova-"));
	const xmlPath = join(dir, "nova.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("NoVA XSD conformance", () => {
	it("ANMELDUNG-only payload validates", () => {
		const body: NovaBody = {
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
					art: "NOVA",
					satznr: 1,
					allgemein: { anbringen: "NOVA1", zr: "2026-04", fastnr: "123456789" },
					anmeldung: {
						liefBmg: 50_000,
						liefSteuer: 7_500,
						igeBmg: 20_000,
						igeSteuer: 3_000,
						berichtig: -250.5,
					},
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("VERGUETUNG-only payload (refund claim) with multiple vehicles validates", () => {
		const body: NovaBody = {
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
					art: "NOVA",
					satznr: 1,
					allgemein: { anbringen: "NOVA1", zr: "2026-04", fastnr: "123456789" },
					verguetungen: [
						{
							fin: "WBA8E5C50KA123456",
							vergBmg: 30_000,
							novaSatz: "16",
							vergSteuer: 4_800,
							vergGrund: 41,
							sonstBegruend: "Export ins Drittland",
							ustBmg: 25_000,
							ustInfo: 31,
						},
						{
							fin: "WAUZZZ4G8DN123456",
							vergBmg: 25_000,
							novaSatz: "12",
							vergSteuer: 3_000,
							vergGrund: 50,
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("Combined ANMELDUNG + VERGUETUNG payload validates", () => {
		const body: NovaBody = {
			info: {
				artIdentifikationsbegriff: "FASTNR",
				identifikationsbegriff: "123456789",
				paketNr: 12,
				datumErstellung: "2026-04-15",
				uhrzeitErstellung: "10:00:00",
				anzahlErklaerungen: 1,
			},
			erklaerungen: [
				{
					art: "NOVA",
					satznr: 1,
					allgemein: { anbringen: "NOVA1", zr: "2026-04", fastnr: "123456789" },
					anmeldung: { liefBmg: 80_000, liefSteuer: 12_000 },
					verguetungen: [
						{
							fin: "VIN1234567890ABCDE",
							vergBmg: 5_000,
							novaSatz: "08",
							vergSteuer: 400,
							vergGrund: 45,
						},
					],
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
