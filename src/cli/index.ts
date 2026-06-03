#!/usr/bin/env node
/**
 * fon-api CLI — one-shot operations against FinanzOnline.
 *
 *   fon-api arts                                                   List supported art codes
 *   fon-api validate --art <ART> --xml <path> [--version <V>]      Validate XML against the bundled XSD
 *   fon-api abfrage --art <ART> --fastnr <9d> --zeitraum <YEAR>    Query Lohnzettel/Sonderausgaben/...
 *   fon-api submit --art <ART> --xml <path> [--uebermittlung T|P]  Submit a pre-built XML payload
 *
 * Submission + abfrage require the four credentials via env vars
 * `FON_TID`, `FON_BENID`, `FON_PIN`, `FON_HERSTELLERID`.
 *
 * `--uebermittlung T` (Test) is the default; pass `P` only when filing for real.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { exit } from "node:process";
import { abfrageDatenuebermittlung } from "../abfrage/index.js";
import { ABFRAGE_ARTEN, type AbfrageArt } from "../abfrage/types.js";
import { type ValidationIssue, groupIssuesByPath } from "../core/issues.js";
import { type SessionLogin, login as bmfLogin, logout as bmfLogout } from "../core/session.js";
import { createClient } from "../index.js";
import { buildBody, listBuilders } from "../upload/build-dispatcher.js";
import { upload as bmfUpload } from "../upload/index.js";
import { runPipeline } from "../upload/pipeline.js";
import { describeArt } from "../upload/schema-registry.js";
import { UPLOAD_ARTEN, type UploadArt } from "../upload/types.js";
import { validateXml } from "../validation/xsd.js";
import {
	type StoredSession,
	clearSession,
	loadSession,
	saveSession,
	sessionFilePath,
} from "./session-store.js";

interface CliFlags {
	command?:
		| "arts"
		| "submit"
		| "validate"
		| "abfrage"
		| "build"
		| "describe"
		| "pipeline"
		| "login"
		| "logout";
	submit?: boolean;
	describe?: boolean;
	art?: string;
	version?: string;
	xml?: string;
	json?: string;
	uebermittlung?: "T" | "P";
	fastnr?: string;
	zeitraum?: string;
}

function parseArgs(argv: ReadonlyArray<string>): CliFlags {
	const flags: CliFlags = {};
	if (
		argv[0] === "arts" ||
		argv[0] === "submit" ||
		argv[0] === "validate" ||
		argv[0] === "abfrage" ||
		argv[0] === "build" ||
		argv[0] === "describe" ||
		argv[0] === "pipeline" ||
		argv[0] === "login" ||
		argv[0] === "logout"
	) {
		flags.command = argv[0];
	}
	for (let i = 1; i < argv.length; i++) {
		const a = argv[i];
		const next = argv[i + 1];
		if (a === "--art" && next) {
			flags.art = next;
			i++;
		} else if (a === "--version" && next) {
			flags.version = next;
			i++;
		} else if (a === "--xml" && next) {
			flags.xml = next;
			i++;
		} else if (a === "--json" && next) {
			flags.json = next;
			i++;
		} else if (a === "--uebermittlung" && (next === "T" || next === "P")) {
			flags.uebermittlung = next;
			i++;
		} else if (a === "--fastnr" && next) {
			flags.fastnr = next;
			i++;
		} else if (a === "--zeitraum" && next) {
			flags.zeitraum = next;
			i++;
		} else if (a === "--submit") {
			flags.submit = true;
		} else if (a === "--describe") {
			flags.describe = true;
		}
	}
	return flags;
}

function printUsage(): void {
	console.error(`Usage:
  fon-api login                                                      BMF login; persist session to ~/.config/fon-api/session.json
  fon-api logout                                                     BMF logout + clear persisted session
  fon-api arts [--describe]                                          List upload + abfrage art codes (--describe = with field counts)
  fon-api describe --art <ART> [--version <V>]                       Print the JSON Schema for an art's body
  fon-api build --art <ART> --json <path> [--version <V>]            Build XML from a typed JSON body
  fon-api pipeline --art <ART> --json <path> [--version <V>]
                  [--submit [--uebermittlung T|P]]                   Build → validate → (optionally) submit, one shot
  fon-api validate --art <ART> --xml <path> [--version <V>]          Validate XML against the bundled XSD
  fon-api abfrage --art <ART> --fastnr <9d> --zeitraum <YEAR>        Query data already submitted to BMF
                  (--art ∈ ${ABFRAGE_ARTEN.join(" | ")})
  fon-api submit --art <ART> --xml <path> [--uebermittlung T|P]      Submit a pre-built XML payload

Submission + abfrage env vars:
  FON_TID, FON_BENID, FON_PIN, FON_HERSTELLERID

Defaults:
  --uebermittlung T
`);
}

function envOrDie(name: string): string {
	const v = process.env[name];
	if (!v) {
		console.error(`Missing required env var: ${name}`);
		exit(2);
	}
	return v;
}

function readXmlOrDie(path: string): string {
	const xmlPath = resolve(process.cwd(), path);
	try {
		return readFileSync(xmlPath, "utf8");
	} catch (e) {
		console.error(`Cannot read XML file: ${(e as Error).message}`);
		exit(2);
	}
}

/**
 * Resolve a usable session: prefer the persisted file, otherwise fall back to
 * a fresh BMF login using FON_TID/BENID/PIN/HERSTELLERID. Returns the session
 * plus a flag describing how it was obtained, so callers can decide whether to
 * logout afterwards (we shouldn't tear down a long-lived persisted session at
 * the end of a single CLI command).
 */
async function getSession(): Promise<{
	session: SessionLogin;
	owned: boolean;
}> {
	const stored = loadSession();
	if (stored) return { session: stored, owned: false };
	const session = await bmfLogin({
		tid: envOrDie("FON_TID"),
		benid: envOrDie("FON_BENID"),
		pin: envOrDie("FON_PIN"),
		herstellerid: envOrDie("FON_HERSTELLERID"),
	});
	return { session, owned: true };
}

async function cmdLogin(): Promise<void> {
	const existing = loadSession();
	if (existing) {
		console.log(
			JSON.stringify(
				{
					ok: true,
					reused: true,
					sessionFile: sessionFilePath(),
					tid: existing.tid,
					benid: existing.benid,
					createdAt: existing.createdAt,
				},
				null,
				2,
			),
		);
		return;
	}
	const session = await bmfLogin({
		tid: envOrDie("FON_TID"),
		benid: envOrDie("FON_BENID"),
		pin: envOrDie("FON_PIN"),
		herstellerid: envOrDie("FON_HERSTELLERID"),
	});
	const stored = saveSession(session);
	console.log(
		JSON.stringify(
			{
				ok: true,
				reused: false,
				sessionFile: sessionFilePath(),
				tid: stored.tid,
				benid: stored.benid,
				createdAt: stored.createdAt,
			},
			null,
			2,
		),
	);
}

async function cmdLogout(): Promise<void> {
	const stored = loadSession();
	if (!stored) {
		console.log(
			JSON.stringify({ ok: true, reason: "no-session", sessionFile: sessionFilePath() }, null, 2),
		);
		return;
	}
	let bmfOk = false;
	try {
		await bmfLogout(stored);
		bmfOk = true;
	} catch (e) {
		// BMF rejected the logout (probably session already expired). Clear the
		// file anyway — the local copy is now meaningless.
		console.error(
			JSON.stringify({ ok: false, reason: "bmf-logout-failed", message: (e as Error).message }),
		);
	}
	clearSession();
	if (bmfOk) {
		console.log(
			JSON.stringify({ ok: true, sessionFile: sessionFilePath(), cleared: true }, null, 2),
		);
	}
}

function cmdDescribe(flags: CliFlags): void {
	if (!flags.art) {
		printUsage();
		exit(2);
	}
	try {
		const desc = describeArt(flags.art, flags.version);
		console.log(JSON.stringify(desc, null, 2));
	} catch (e) {
		const err = e as { name?: string; message: string };
		console.error(JSON.stringify({ ok: false, name: err.name, message: err.message }, null, 2));
		exit(1);
	}
}

async function cmdPipeline(flags: CliFlags): Promise<void> {
	if (!flags.art || !flags.json) {
		printUsage();
		exit(2);
	}
	const jsonPath = resolve(process.cwd(), flags.json);
	let body: unknown;
	try {
		body = JSON.parse(readFileSync(jsonPath, "utf8"));
	} catch (e) {
		console.error(`Cannot read/parse JSON file: ${(e as Error).message}`);
		exit(2);
	}
	let owned = false;
	let client: ReturnType<typeof createClient> | undefined;
	if (flags.submit) {
		const stored = loadSession();
		if (stored) {
			client = createClient({
				tid: stored.tid,
				benid: stored.benid,
				pin: "",
				herstellerid: "",
			});
			client.useSession(stored);
		} else {
			client = createClient({
				tid: envOrDie("FON_TID"),
				benid: envOrDie("FON_BENID"),
				pin: envOrDie("FON_PIN"),
				herstellerid: envOrDie("FON_HERSTELLERID"),
			});
			owned = true;
		}
	}
	const submitArgs = client
		? { submit: { client, uebermittlung: flags.uebermittlung ?? ("T" as const) } }
		: {};
	try {
		const result = await runPipeline({
			art: flags.art,
			body,
			...(flags.version ? { version: flags.version } : {}),
			...submitArgs,
		});
		console.log(JSON.stringify(result, null, 2));
		// Exit code: 0 if everything that ran succeeded, 1 if any stage failed.
		if (result.build.ok === false) exit(1);
		if ("reason" in result.validate && result.validate.reason === "validation-failed") {
			exit(1);
		}
		if (result.submit.skipped === false && result.submit.parsed === "NOK") exit(1);
	} finally {
		if (owned && client) {
			await client.logout().catch(() => undefined);
		}
	}
}

function cmdBuild(flags: CliFlags): void {
	if (!flags.art || !flags.json) {
		printUsage();
		exit(2);
	}
	const jsonPath = resolve(process.cwd(), flags.json);
	let body: unknown;
	try {
		body = JSON.parse(readFileSync(jsonPath, "utf8"));
	} catch (e) {
		console.error(`Cannot read/parse JSON file: ${(e as Error).message}`);
		exit(2);
	}
	try {
		const xml = buildBody({
			art: flags.art,
			body,
			...(flags.version ? { version: flags.version } : {}),
		});
		// Plain XML on stdout — pipeable into `validate` or `submit`.
		process.stdout.write(xml);
	} catch (e) {
		const err = e as {
			name?: string;
			message: string;
			issues?: ReadonlyArray<unknown>;
			available?: ReadonlyArray<string>;
		};
		const out: Record<string, unknown> = { ok: false, message: err.message };
		if (err.name === "ValidationError" && err.issues) {
			out.issues = err.issues;
			out.grouped = groupIssuesByPath(err.issues as ReadonlyArray<ValidationIssue>);
		}
		if (
			(err.name === "UnknownVersionError" || err.name === "VersionRequiredError") &&
			err.available
		) {
			out.available = err.available;
			out.hint = `Pass --version <V> with one of: ${err.available.join(", ")}`;
		}
		if (err.name === "UnsupportedArtError") {
			out.hint = `Run "fon-api arts" to see typed-builder coverage.`;
		}
		console.error(JSON.stringify(out, null, 2));
		exit(1);
	}
}

function cmdValidate(flags: CliFlags): void {
	if (!flags.art || !flags.xml) {
		printUsage();
		exit(2);
	}
	const xml = readXmlOrDie(flags.xml);
	const result = validateXml(flags.art, xml, flags.version);
	if (result.ok) {
		console.log(JSON.stringify({ ok: true, art: flags.art, xsdPath: result.xsdPath }, null, 2));
		return;
	}
	const out: Record<string, unknown> = { ok: false, art: flags.art, reason: result.reason };
	if (result.reason === "validation-failed") {
		out.xsdPath = result.xsdPath;
		out.errors = result.stderr.split("\n").filter((l) => l.length > 0);
	} else if (result.reason === "xsd-missing") {
		out.xsdPath = result.xsdPath;
		out.hint = "Run `npm run update-schemas` to fetch.";
	} else if (result.reason === "xmllint-missing") {
		out.hint = "Install libxml2-utils (Linux) or `brew install libxml2` (macOS).";
	} else if (result.reason === "xsd-incompatible") {
		out.hint =
			"This art's upstream XSD has malformed regex/totalDigits and cannot be compiled by libxml2. Use the typed builder's runtime Zod validation instead.";
	}
	console.log(JSON.stringify(out, null, 2));
	exit(1);
}

async function cmdAbfrage(flags: CliFlags): Promise<void> {
	if (!flags.art || !flags.fastnr || !flags.zeitraum) {
		printUsage();
		exit(2);
	}
	if (!ABFRAGE_ARTEN.includes(flags.art as AbfrageArt)) {
		console.error(
			`Unknown abfrage art "${flags.art}". Expected one of: ${ABFRAGE_ARTEN.join(" | ")}`,
		);
		exit(2);
	}
	const zeitraum = Number.parseInt(flags.zeitraum, 10);
	if (!Number.isFinite(zeitraum)) {
		console.error(`--zeitraum must be a year (e.g. 2024), got "${flags.zeitraum}"`);
		exit(2);
	}

	const { session, owned } = await getSession();
	try {
		const result = await abfrageDatenuebermittlung({
			tid: session.tid,
			benid: session.benid,
			id: session.id,
			art: flags.art as AbfrageArt,
			fastnr: flags.fastnr,
			zeitraum,
		});
		console.log(
			JSON.stringify(
				{ rc: result.rc, msg: result.msg, hasResult: result.resultXml !== undefined },
				null,
				2,
			),
		);
		if (result.resultXml !== undefined) console.log(result.resultXml);
	} finally {
		if (owned) await bmfLogout(session).catch(() => undefined);
	}
}

async function cmdSubmit(flags: CliFlags): Promise<void> {
	if (!flags.art || !flags.xml) {
		printUsage();
		exit(2);
	}
	if (!UPLOAD_ARTEN.includes(flags.art as UploadArt)) {
		console.error(`Unknown art "${flags.art}". Run "fon-api arts" for the list.`);
		exit(2);
	}
	const xml = readXmlOrDie(flags.xml);
	const uebermittlung = flags.uebermittlung ?? "T";

	const { session, owned } = await getSession();
	try {
		const result = await bmfUpload({
			tid: session.tid,
			benid: session.benid,
			id: session.id,
			art: flags.art as UploadArt,
			uebermittlung,
			data: xml,
		});
		const summary = {
			rc: result.rc,
			parsed: result.parsed?.kind ?? "unparsed",
			messageRefId: result.parsed?.kind === "OK" ? result.parsed.meta?.messageRefId : undefined,
			errors:
				result.parsed?.kind === "NOK" || result.parsed?.kind === "TWOK"
					? result.parsed.errors.map((e) => ({ code: e.code, text: e.text }))
					: undefined,
		};
		console.log(JSON.stringify(summary, null, 2));
		if (result.parsed?.kind === "NOK") exit(1);
	} finally {
		if (owned) await bmfLogout(session).catch(() => undefined);
	}
}

async function main(): Promise<void> {
	const flags = parseArgs(process.argv.slice(2));
	if (flags.command === "arts") {
		const builders = listBuilders();
		const lines = UPLOAD_ARTEN.map((a) => {
			const versions = builders[a];
			if (!versions) return a;
			const base = `${a}\t[typed: ${versions.join(", ")}]`;
			if (!flags.describe) return base;
			// --describe: append a field count derived from the JSON Schema for the
			// default version of this art. Untyped arts and lookup failures fall
			// back to the bare line so the column still aligns visually.
			try {
				const desc = describeArt(a);
				const root = desc.jsonSchema as {
					properties?: Record<string, unknown>;
					$ref?: string;
					definitions?: Record<string, { properties?: Record<string, unknown> }>;
				};
				let props: Record<string, unknown> | undefined = root.properties;
				if (!props && root.$ref?.startsWith("#/definitions/") && root.definitions) {
					const defKey = root.$ref.slice("#/definitions/".length);
					props = root.definitions[defKey]?.properties;
				}
				const count = props ? Object.keys(props).length : 0;
				return `${base}  (${count} top-level field${count === 1 ? "" : "s"})`;
			} catch {
				return base;
			}
		});
		console.log(lines.join("\n"));
		return;
	}
	if (flags.command === "describe") {
		cmdDescribe(flags);
		return;
	}
	if (flags.command === "build") {
		cmdBuild(flags);
		return;
	}
	if (flags.command === "pipeline") {
		await cmdPipeline(flags);
		return;
	}
	if (flags.command === "validate") {
		cmdValidate(flags);
		return;
	}
	if (flags.command === "abfrage") {
		await cmdAbfrage(flags);
		return;
	}
	if (flags.command === "submit") {
		await cmdSubmit(flags);
		return;
	}
	if (flags.command === "login") {
		await cmdLogin();
		return;
	}
	if (flags.command === "logout") {
		await cmdLogout();
		return;
	}
	printUsage();
	exit(2);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : String(err));
	exit(1);
});
