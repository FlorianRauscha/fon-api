import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type SoerBody, build } from "../../../src/soer/current/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const XSD = join(ROOT, "schemas/soer/current/SonstigeErklaerungen.xsd");

function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function validateAgainstXsd(xml: string): { ok: true } | { ok: false; stderr: string } {
	const dir = mkdtempSync(join(tmpdir(), "fon-soer-"));
	const xmlPath = join(dir, "soer.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", XSD, xmlPath], { stdio: "pipe" });
		return { ok: true };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return { ok: false, stderr: e.stderr?.toString() ?? "" };
	}
}

describe.skipIf(!hasXmllint())("SOER XSD conformance", () => {
	it("envelope with one E108c entry validates", () => {
		const body: SoerBody = {
			info: { fastnrFonTn: "234567890" },
			messageSpec: {
				messageRefId: "MSG-2026-04-15-001",
				timestamp: "2026-04-15T10:00:00Z",
			},
			soer: [
				{
					art: "E108c",
					refNr: "REF-001",
					fastnrOrg: "123456789",
					datvon: "2025",
					datbis: "2025",
					anhang: "JVBERi0xLjQK",
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});

	it("envelope with three different art entries validates", () => {
		const body: SoerBody = {
			messageSpec: {
				messageRefId: "MSG-MIXED-001",
				timestamp: "2026-04-15T10:00:00.123Z",
			},
			soer: [
				{
					art: "ENAV1",
					refNr: "ENAV-001",
					fastnrOrg: "123456789",
					datvon: "2024",
					anhang: "AAAA",
				},
				{
					art: "ELA1",
					refNr: "ELA-001",
					fastnrOrg: "123456789",
					datvon: "202401",
					datbis: "202412",
					anhang: "BBBB",
				},
				{
					art: "KR1",
					refNr: "KR-001",
					fastnrOrg: "123456789",
					datvon: "2024",
					anhang: "CCCC",
				},
			],
		};
		const r = validateAgainstXsd(build(body));
		expect(r.ok, "ok" in r && r.ok ? "" : (r as { stderr: string }).stderr).toBe(true);
	});
});
