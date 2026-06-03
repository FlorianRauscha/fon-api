/**
 * Persistent CLI session store. Lets `fon-api login` cache a BMF session token
 * on disk so subsequent `submit`/`abfrage`/`pipeline` invocations skip the
 * 1–2s login round-trip per call (and avoid unnecessary BMF login churn).
 *
 * Stored at `$XDG_CONFIG_HOME/fon-api/session.json` (falls back to
 * `~/.config/fon-api/session.json`). The file holds the BMF-issued session
 * `id` plus the `tid` / `benid` it was issued for — never the PIN or
 * Hersteller-ID. File mode is 0600 so other users on the same machine can't
 * read it.
 *
 * BMF session timeouts vary; the CLI attempts to use a stored session, and
 * falls back to a fresh login if the call returns `rc=-1` (SessionExpired).
 */

import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	rmdirSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { SessionLogin } from "../core/session.js";

export interface StoredSession extends SessionLogin {
	/** ISO timestamp of when this session was created (debugging only). */
	createdAt: string;
}

function configDir(): string {
	const xdg = process.env.XDG_CONFIG_HOME;
	return xdg && xdg.length > 0 ? join(xdg, "fon-api") : join(homedir(), ".config", "fon-api");
}

export function sessionFilePath(): string {
	return join(configDir(), "session.json");
}

/** Persist a session. File is written atomically via temp-then-rename. */
export function saveSession(s: SessionLogin): StoredSession {
	const stored: StoredSession = { ...s, createdAt: new Date().toISOString() };
	const dir = configDir();
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
	const path = sessionFilePath();
	const tmp = `${path}.tmp`;
	writeFileSync(tmp, JSON.stringify(stored, null, 2), { encoding: "utf8", mode: 0o600 });
	// Re-chmod after write — some umasks override the mode arg above.
	chmodSync(tmp, 0o600);
	renameSync(tmp, path);
	return stored;
}

/** Read the persisted session, or null if none / unreadable / malformed. */
export function loadSession(): StoredSession | null {
	const path = sessionFilePath();
	if (!existsSync(path)) return null;
	try {
		const raw = readFileSync(path, "utf8");
		const parsed = JSON.parse(raw) as Partial<StoredSession>;
		if (
			typeof parsed.tid !== "string" ||
			typeof parsed.benid !== "string" ||
			typeof parsed.id !== "string" ||
			typeof parsed.createdAt !== "string"
		) {
			return null;
		}
		return parsed as StoredSession;
	} catch {
		return null;
	}
}

/** Delete the persisted session file. No-op if it doesn't exist. */
export function clearSession(): void {
	const path = sessionFilePath();
	if (existsSync(path)) rmSync(path, { force: true });
	// Best-effort: clean up the parent dir if it's now empty.
	try {
		const dir = dirname(path);
		if (readdirSync(dir).length === 0) rmdirSync(dir);
	} catch {
		// non-fatal
	}
}
