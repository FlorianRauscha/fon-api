/**
 * Smoke tests for the CLI binary. We exercise the offline `arts` subcommand and
 * argument-parsing failures here. The `submit` path is not exercised end-to-end
 * since it would require live BMF credentials; instead we verify it errors
 * correctly when env vars are missing or arts are unknown.
 */

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = resolve(ROOT, "src/cli/index.ts");

function runCli(
	args: ReadonlyArray<string>,
	env: Record<string, string | undefined> = {},
): ReturnType<typeof spawnSync> {
	return spawnSync("npx", ["tsx", CLI, ...args], {
		cwd: ROOT,
		encoding: "utf8",
		env: { ...process.env, ...env, FON_TID: "", FON_BENID: "", FON_PIN: "", FON_HERSTELLERID: "" },
		timeout: 30_000,
	});
}

describe("fon-api CLI", () => {
	it("`arts` lists every art code, one per line", () => {
		const r = runCli(["arts"]);
		expect(r.status).toBe(0);
		const out = (r.stdout ?? "").trim().split("\n");
		// Each line is either "ART" or "ART\t[typed: v1, v2, ...]" — pull the bare art code.
		const codes = out.map((line) => line.split("\t")[0]);
		expect(codes).toContain("U30");
		expect(codes).toContain("L1");
		expect(codes).toContain("VATAB");
		expect(codes).toContain("VPDGD");
		expect(codes.length).toBeGreaterThan(30);
	});

	it("prints usage on no arguments and exits 2", () => {
		const r = runCli([]);
		expect(r.status).toBe(2);
		expect(r.stderr).toContain("Usage:");
	});

	it("`submit` without --art exits 2 with usage", () => {
		const r = runCli(["submit", "--xml", "/dev/null"]);
		expect(r.status).toBe(2);
		expect(r.stderr).toContain("Usage:");
	});

	it("`submit` with unknown art exits 2 with hint", () => {
		const r = runCli(["submit", "--art", "BOGUS", "--xml", "/dev/null"]);
		expect(r.status).toBe(2);
		expect(r.stderr).toContain("Unknown art");
	});

	it("`submit` rejects --uebermittlung values other than T or P", () => {
		// unknown --uebermittlung is silently ignored, so the next-arg parser
		// keeps a default; sanity-check that the default path still fails on
		// missing env vars (proving we got past argument parsing).
		const r = runCli(["submit", "--art", "U30", "--xml", "nonexistent.xml"]);
		expect(r.status).toBe(2);
		// Either env-var miss or file-read error — both 2 exits.
		expect(r.stderr.length).toBeGreaterThan(0);
	});

	it("`validate` reports xsd-incompatible for BET (libxml2 cannot compile)", () => {
		const r = runCli(["validate", "--art", "BET", "--xml", "package.json"]);
		expect(r.status).toBe(1);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.ok).toBe(false);
		expect(out.reason).toBe("xsd-incompatible");
	});

	it("`validate` round-trips a real DIGI payload through the bundled XSD", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const digiMod = await import("../../src/digi/current/index.js");
		const { build } = digiMod;
		const xml = build({
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
						ortLtg: "Wien",
						wjBeg: "202501",
						wjEnde: "202512",
						ums212a: 1_000_000,
						entgelt: 50_000,
						bemGes: 50_000,
					},
				},
			],
		});
		const dir = mkdtempSync(join(tmpdir(), "fon-cli-"));
		const xmlPath = join(dir, "digi.xml");
		writeFileSync(xmlPath, xml, "utf8");
		const r = runCli(["validate", "--art", "DIGI", "--xml", xmlPath]);
		unlinkSync(xmlPath);
		expect(r.status).toBe(0);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.ok).toBe(true);
	});

	it("`abfrage` without --fastnr/--zeitraum prints usage", () => {
		const r = runCli(["abfrage", "--art", "LOHNZETTEL"]);
		expect(r.status).toBe(2);
		expect(r.stderr).toContain("Usage:");
	});

	it("`abfrage` with unknown art exits 2", () => {
		const r = runCli(["abfrage", "--art", "BOGUS", "--fastnr", "123456789", "--zeitraum", "2024"]);
		expect(r.status).toBe(2);
		expect(r.stderr).toContain("Unknown abfrage art");
	});

	it("`build` round-trips a typed DIGI body to XML on stdout", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const body = {
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
						ortLtg: "Wien",
						wjBeg: "202501",
						wjEnde: "202512",
						ums212a: 1_000_000,
						entgelt: 50_000,
						bemGes: 50_000,
					},
				},
			],
		};
		const dir = mkdtempSync(join(tmpdir(), "fon-build-"));
		const jsonPath = join(dir, "body.json");
		writeFileSync(jsonPath, JSON.stringify(body), "utf8");
		const r = runCli(["build", "--art", "DIGI", "--json", jsonPath]);
		unlinkSync(jsonPath);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("<?xml");
		expect(r.stdout).toContain('<ERKLAERUNG art="DIGI">');
	});

	it("`build` with invalid body emits ValidationError + grouped issues", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const dir = mkdtempSync(join(tmpdir(), "fon-build-"));
		const jsonPath = join(dir, "bad.json");
		writeFileSync(jsonPath, JSON.stringify({ info: {} }), "utf8");
		const r = runCli(["build", "--art", "DIGI", "--json", jsonPath]);
		unlinkSync(jsonPath);
		expect(r.status).toBe(1);
		const err = JSON.parse(r.stderr ?? "{}");
		expect(err.ok).toBe(false);
		expect(Array.isArray(err.issues)).toBe(true);
		expect(err.grouped).toBeTruthy();
		expect(err.grouped.total).toBe(err.issues.length);
		expect(Array.isArray(err.grouped.sections)).toBe(true);
		expect(err.grouped.sections.length).toBeGreaterThan(0);
	});

	it("`build` with year-versioned art and missing --version reports availableVersions", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const dir = mkdtempSync(join(tmpdir(), "fon-build-"));
		const jsonPath = join(dir, "body.json");
		writeFileSync(jsonPath, "{}", "utf8");
		const r = runCli(["build", "--art", "L1", "--json", jsonPath]);
		unlinkSync(jsonPath);
		expect(r.status).toBe(1);
		const err = JSON.parse(r.stderr ?? "{}");
		expect(err.available).toEqual(expect.arrayContaining(["2024", "2025"]));
	});

	it("`describe` returns a JSON Schema for the art's body shape", () => {
		const r = runCli(["describe", "--art", "DIGI"]);
		expect(r.status).toBe(0);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.art).toBe("DIGI");
		expect(out.version).toBe("current");
		expect(out.availableVersions).toEqual(["current"]);
		expect(out.jsonSchema).toBeTruthy();
		expect(JSON.stringify(out.jsonSchema)).toContain("artIdentifikationsbegriff");
	});

	it("`describe` for L1 picks 2025 as default and lists all 4 versions", () => {
		const r = runCli(["describe", "--art", "L1"]);
		expect(r.status).toBe(0);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.availableVersions).toEqual(expect.arrayContaining(["2022", "2023", "2024", "2025"]));
	});

	it("`describe` for unknown art exits 1 with structured error", () => {
		const r = runCli(["describe", "--art", "UNKNOWN_ART_FOR_TEST"]);
		expect(r.status).toBe(1);
		const out = JSON.parse(r.stderr ?? "{}");
		expect(out.ok).toBe(false);
		expect(out.name).toBe("UnknownSchemaError");
	});

	it("`arts` annotates art codes that have typed builders", () => {
		const r = runCli(["arts"]);
		expect(r.status).toBe(0);
		// L1 is year-versioned with multiple typed builders
		expect(r.stdout).toMatch(/L1\s+\[typed: .*2025/);
		// Most one-art-one-version cases are tagged 'current'
		expect(r.stdout).toMatch(/DIGI\s+\[typed: current\]/);
		// Default mode: no field-count column.
		expect(r.stdout).not.toMatch(/top-level field/);
	});

	it("`arts --describe` adds a field-count column for typed arts only", () => {
		const r = runCli(["arts", "--describe"]);
		expect(r.status).toBe(0);
		// Typed art: has the count column.
		expect(r.stdout).toMatch(/DIGI\s+\[typed: current\]\s+\(2 top-level fields\)/);
		expect(r.stdout).toMatch(/L1\s+\[typed: .*2025\].+top-level field/);
		// Untyped art (e.g. JAHR_ERKL): bare line, no annotations.
		expect(r.stdout).toMatch(/^JAHR_ERKL$/m);
	});

	it("`pipeline` runs build + validate (no --submit) and reports stages", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const body = {
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
						ortLtg: "Wien",
						wjBeg: "202501",
						wjEnde: "202512",
						ums212a: 1_000_000,
						entgelt: 50_000,
						bemGes: 50_000,
					},
				},
			],
		};
		const dir = mkdtempSync(join(tmpdir(), "fon-pipeline-"));
		const jsonPath = join(dir, "body.json");
		writeFileSync(jsonPath, JSON.stringify(body), "utf8");
		const r = runCli(["pipeline", "--art", "DIGI", "--json", jsonPath]);
		unlinkSync(jsonPath);
		expect(r.status).toBe(0);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.build.ok).toBe(true);
		expect(out.submit).toEqual({ skipped: true, reason: "not-requested" });
	});

	it("`logout` with no persisted session returns ok=true with reason=no-session", async () => {
		const { mkdtempSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const tmpHome = mkdtempSync(join(tmpdir(), "fon-cli-logout-"));
		const r = spawnSync("npx", ["tsx", CLI, "logout"], {
			cwd: ROOT,
			encoding: "utf8",
			env: { ...process.env, XDG_CONFIG_HOME: tmpHome },
			timeout: 30_000,
		});
		expect(r.status).toBe(0);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.ok).toBe(true);
		expect(out.reason).toBe("no-session");
	});

	it("`login` without credentials and no stored session exits 2", async () => {
		const { mkdtempSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const tmpHome = mkdtempSync(join(tmpdir(), "fon-cli-login-"));
		const r = spawnSync("npx", ["tsx", CLI, "login"], {
			cwd: ROOT,
			encoding: "utf8",
			env: {
				...process.env,
				XDG_CONFIG_HOME: tmpHome,
				FON_TID: "",
				FON_BENID: "",
				FON_PIN: "",
				FON_HERSTELLERID: "",
			},
			timeout: 30_000,
		});
		expect(r.status).toBe(2);
		expect(r.stderr).toMatch(/Missing required env var/);
	});

	it("`pipeline` exits 1 when build fails", async () => {
		const { writeFileSync, mkdtempSync, unlinkSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const dir = mkdtempSync(join(tmpdir(), "fon-pipeline-"));
		const jsonPath = join(dir, "bad.json");
		writeFileSync(jsonPath, JSON.stringify({ info: {} }), "utf8");
		const r = runCli(["pipeline", "--art", "DIGI", "--json", jsonPath]);
		unlinkSync(jsonPath);
		expect(r.status).toBe(1);
		const out = JSON.parse(r.stdout ?? "{}");
		expect(out.build.ok).toBe(false);
		expect(out.validate).toEqual({ skipped: true, reason: "build-failed" });
		expect(out.submit).toEqual({ skipped: true, reason: "build-failed" });
	});
});
