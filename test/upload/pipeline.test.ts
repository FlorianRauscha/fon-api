import { describe, expect, it } from "vitest";
import { runPipeline } from "../../src/upload/pipeline.js";

const goodBody = {
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

describe("runPipeline", () => {
	it("build → validate succeeds for a valid DIGI body, submit is skipped", async () => {
		const r = await runPipeline({ art: "DIGI", body: goodBody });
		expect(r.build.ok).toBe(true);
		expect("xml" in r.build && r.build.xml).toMatch(/<\?xml/);
		// Validate may be ok or xmllint-missing depending on env; both are non-fatal.
		expect(
			"ok" in r.validate || ("reason" in r.validate && r.validate.reason !== "validation-failed"),
		).toBe(true);
		expect(r.submit).toEqual({ skipped: true, reason: "not-requested" });
	});

	it("build failure short-circuits validate + submit", async () => {
		const r = await runPipeline({ art: "DIGI", body: { info: {} } });
		expect(r.build.ok).toBe(false);
		expect("error" in r.build && r.build.error.name).toBe("ValidationError");
		expect("grouped" in r.build && r.build.grouped?.total).toBeGreaterThan(0);
		expect(r.validate).toEqual({ skipped: true, reason: "build-failed" });
		expect(r.submit).toEqual({ skipped: true, reason: "build-failed" });
	});

	it("UnknownVersionError for missing version on multi-version art bubbles up structured", async () => {
		const r = await runPipeline({ art: "L1", body: {} });
		expect(r.build.ok).toBe(false);
		const build = r.build as { error: { name: string }; availableVersions?: ReadonlyArray<string> };
		expect(["VersionRequiredError", "ValidationError"]).toContain(build.error.name);
	});
});
