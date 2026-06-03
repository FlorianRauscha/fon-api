/**
 * Unit tests for the persistent CLI session store.
 *
 * We point `XDG_CONFIG_HOME` at a per-test temp dir so we don't trample any
 * real `~/.config/fon-api/session.json` the developer might have.
 */

import { existsSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let tmpHome: string;
let originalXdg: string | undefined;

beforeEach(() => {
	tmpHome = mkdtempSync(join(tmpdir(), "fon-session-"));
	originalXdg = process.env.XDG_CONFIG_HOME;
	process.env.XDG_CONFIG_HOME = tmpHome;
});

afterEach(() => {
	if (originalXdg === undefined) process.env.XDG_CONFIG_HOME = undefined;
	else process.env.XDG_CONFIG_HOME = originalXdg;
});

describe("session-store", () => {
	it("loadSession returns null when no file exists", async () => {
		const { loadSession } = await import("../../src/cli/session-store.js");
		expect(loadSession()).toBeNull();
	});

	it("saveSession writes a file with mode 0600 and createdAt timestamp", async () => {
		const { saveSession, sessionFilePath } = await import("../../src/cli/session-store.js");
		const stored = saveSession({ tid: "1000103u3032", benid: "webserv99", id: "abc123" });
		const path = sessionFilePath();
		expect(existsSync(path)).toBe(true);
		// 0600 = owner rw only.
		const mode = statSync(path).mode & 0o777;
		expect(mode).toBe(0o600);
		expect(stored.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(stored.id).toBe("abc123");
	});

	it("loadSession returns the stored shape after saveSession", async () => {
		const { saveSession, loadSession } = await import("../../src/cli/session-store.js");
		saveSession({ tid: "T1", benid: "B1", id: "I1" });
		const got = loadSession();
		expect(got).toMatchObject({ tid: "T1", benid: "B1", id: "I1" });
		expect(got?.createdAt).toBeTruthy();
	});

	it("clearSession removes the file (and is idempotent)", async () => {
		const { saveSession, clearSession, loadSession, sessionFilePath } = await import(
			"../../src/cli/session-store.js"
		);
		saveSession({ tid: "T", benid: "B", id: "I" });
		expect(existsSync(sessionFilePath())).toBe(true);
		clearSession();
		expect(existsSync(sessionFilePath())).toBe(false);
		expect(loadSession()).toBeNull();
		// Running again is a no-op, no throw.
		clearSession();
	});

	it("loadSession returns null on a malformed file rather than throwing", async () => {
		const { writeFileSync, mkdirSync } = await import("node:fs");
		const { dirname } = await import("node:path");
		const { sessionFilePath, loadSession } = await import("../../src/cli/session-store.js");
		const path = sessionFilePath();
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, "{ not valid json", "utf8");
		expect(loadSession()).toBeNull();
	});
});
