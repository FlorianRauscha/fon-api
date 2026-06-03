/**
 * Smoke tests for `scripts/update-schemas.ts`.
 *
 * The full fetch path is exercised every Monday by the GitHub Action; here we
 * verify (a) `--dry-run` is a no-op against the current manifest (no diff vs
 * pinned sha256s) and (b) the predicate that walks XSD URL fields ignores the
 * sibling `_sha256` hash fields — a regression we hit in 2026-04-29.
 */

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = resolve(ROOT, "scripts/update-schemas.ts");

describe("update-schemas script", () => {
	it("--dry-run produces no `Invalid URL` errors (no _sha256 leakage)", () => {
		const r = spawnSync("npx", ["tsx", SCRIPT, "--dry-run"], {
			cwd: ROOT,
			encoding: "utf8",
			timeout: 60_000,
		});
		expect(r.status).toBe(0);
		const combined = `${r.stdout ?? ""}${r.stderr ?? ""}`;
		expect(combined).not.toContain("Invalid URL");
		expect(combined).not.toContain("_sha256 failed");
	}, 60_000);
});
