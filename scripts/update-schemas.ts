#!/usr/bin/env tsx
/**
 * Schema fetcher: walks schemas/manifest.json, downloads every URL whose key starts
 * with "xsd" (xsd, xsd_laender_kfz, xsd_antrag, xsd_abschluss, ...) into
 * `schemas/<art>/<version>/<filename>.xsd`, computes sha256, and writes a sibling
 * `xsd.sha256` field back into the manifest. Idempotent: re-running with no
 * upstream changes is a no-op except for refreshing `fetched_at`.
 *
 * Usage: `npm run update-schemas` or `npm run update-schemas -- --only u30`
 *        --only <art>     limit to a single art (e.g. u30, jahr_erkl, l1)
 *        --force          re-download even if local sha256 already matches manifest
 *        --dry-run        log what would happen without writing files
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "schemas", "manifest.json");

interface CliFlags {
	only?: string;
	force: boolean;
	dryRun: boolean;
}

function parseArgs(argv: ReadonlyArray<string>): CliFlags {
	const flags: CliFlags = { force: false, dryRun: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--force") flags.force = true;
		else if (a === "--dry-run") flags.dryRun = true;
		else if (a === "--only" && argv[i + 1]) {
			flags.only = argv[++i];
		}
	}
	return flags;
}

interface FetchResult {
	art: string;
	version: string;
	field: string;
	url: string;
	relPath: string;
	sha256: string;
	bytes: number;
	skipped: boolean;
}

async function sha256(buf: ArrayBuffer | Uint8Array): Promise<string> {
	const h = createHash("sha256");
	h.update(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
	return h.digest("hex");
}

function filenameFromUrl(url: string): string {
	const path = new URL(url).pathname;
	const last = path.split("/").pop() ?? "schema.xsd";
	// Normalize extension casing (some BMF URLs end ".XSD") so re-fetching does not
	// create a second, differently-cased vendored file on case-sensitive filesystems.
	return decodeURIComponent(last).replace(/\.XSD$/, ".xsd");
}

function isXsdField(key: string): boolean {
	// `xsd`, `xsd_laender_kfz`, `xsd_antrag`, etc. — but NOT the sibling
	// `*_sha256` hash fields, which start with the same prefix.
	if (key.endsWith("_sha256")) return false;
	return key === "xsd" || key.startsWith("xsd_");
}

function shaFieldFor(xsdField: string): string {
	return `${xsdField}_sha256`;
}

async function downloadIfChanged(
	art: string,
	version: string,
	field: string,
	url: string,
	currentSha: string | undefined,
	flags: CliFlags,
): Promise<FetchResult> {
	const filename = filenameFromUrl(url);
	const dir = join(ROOT, "schemas", art, version);
	const fullPath = join(dir, filename);
	const relPath = `schemas/${art}/${version}/${filename}`;

	if (flags.dryRun) {
		console.log(`[dry-run] ${art}/${version}/${field} → ${url}`);
		return { art, version, field, url, relPath, sha256: "", bytes: 0, skipped: true };
	}

	const res = await fetch(url, { redirect: "follow" });
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} fetching ${url}`);
	}
	const buf = new Uint8Array(await res.arrayBuffer());
	const sha = await sha256(buf);

	if (!flags.force && currentSha === sha) {
		console.log(`  · ${art}/${version}/${field} unchanged (${sha.slice(0, 12)}…)`);
		return { art, version, field, url, relPath, sha256: sha, bytes: buf.length, skipped: true };
	}

	mkdirSync(dir, { recursive: true });
	writeFileSync(fullPath, buf);
	console.log(`  ✓ ${art}/${version}/${field} → ${relPath} (${buf.length} bytes, ${sha.slice(0, 12)}…)`);
	return { art, version, field, url, relPath, sha256: sha, bytes: buf.length, skipped: false };
}

interface ManifestEntry {
	[k: string]: string | number | null | undefined | ManifestEntry;
}

interface Manifest {
	[art: string]: ManifestEntry | string | number | unknown;
}

async function main() {
	const flags = parseArgs(process.argv.slice(2));
	const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
	const results: FetchResult[] = [];

	for (const [art, artNode] of Object.entries(manifest)) {
		// Skip top-level meta keys
		if (
			art === "$schema" ||
			art === "version" ||
			art === "generatedAt" ||
			art === "comment" ||
			art === "transport"
		)
			continue;
		if (typeof artNode !== "object" || artNode === null) continue;
		if (flags.only && art !== flags.only) continue;

		const versions = artNode as Record<string, ManifestEntry | string | unknown>;
		for (const [version, versionNode] of Object.entries(versions)) {
			if (version === "comment") continue;
			if (typeof versionNode !== "object" || versionNode === null) continue;

			const verEntry = versionNode as Record<string, string | undefined>;
			for (const [key, value] of Object.entries(verEntry)) {
				if (!isXsdField(key) || typeof value !== "string") continue;
				const shaField = shaFieldFor(key);
				const currentSha = verEntry[shaField];
				try {
					const r = await downloadIfChanged(art, version, key, value, currentSha, flags);
					results.push(r);
					if (!flags.dryRun) {
						verEntry[shaField] = r.sha256;
						verEntry.fetched_at = new Date().toISOString();
					}
				} catch (err) {
					console.error(`  ✗ ${art}/${version}/${key} failed: ${(err as Error).message}`);
				}
			}
		}
	}

	if (!flags.dryRun) {
		writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
	}

	const fetched = results.filter((r) => !r.skipped).length;
	const skipped = results.filter((r) => r.skipped).length;
	console.log(`\nDone: ${fetched} updated, ${skipped} unchanged${flags.dryRun ? " (dry-run)" : ""}.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
