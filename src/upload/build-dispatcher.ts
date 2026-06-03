/**
 * Unified build dispatcher: map an upload art (with optional version) to the
 * typed-body `build()` function shipped by its module, and route a generic
 * `unknown` payload through Zod validation + XML emission.
 *
 * The body is `unknown` at the boundary — each typed module's Zod schema
 * (already wired into its `build()`) is the source of truth for shape.
 *
 * Year-versioned arts (`l1/2025`, `jahr_erkl/2025`) and effective-date-versioned
 * arts (`u30/07_2026`, `ka1/ab_2022`) require an explicit `version`. Single-
 * version arts default to "current".
 */

import { build as buildBet } from "../bet/current/index.js";
import { build as buildDigi } from "../digi/current/index.js";
import { build as buildDue } from "../due/current/index.js";
import { build as buildFvan } from "../fvan/current/index.js";
import { build as buildKa1Ab2016 } from "../ka1/ab_2016/index.js";
import { build as buildKa1Ab2022 } from "../ka1/ab_2022/index.js";
import { build as buildKom } from "../kom/current/index.js";
import { build as buildKomu } from "../komu/current/index.js";
import { build as buildL12022 } from "../l1/2022/index.js";
import { build as buildL12023 } from "../l1/2023/index.js";
import { build as buildL12024 } from "../l1/2024/index.js";
import { build as buildL12025 } from "../l1/2025/index.js";
import { build as buildNova } from "../nova/current/index.js";
import { build as buildRz } from "../rz/current/index.js";
import { build as buildSb } from "../sb/current/index.js";
import { build as buildSbs } from "../sbs/current/index.js";
import { build as buildSbz } from "../sbz/current/index.js";
import { build as buildSoer } from "../soer/current/index.js";
import { build as buildStab } from "../stab/current/index.js";
import { build as buildTvw } from "../tvw/current/index.js";
import { build as buildU3001_2022 } from "../u30/01_2022/index.js";
import { build as buildU3007_2026 } from "../u30/07_2026/index.js";
import { build as buildUeb } from "../ueb/current/index.js";
import { build as buildVat } from "../vat/current/index.js";
import { build as buildVatab } from "../vatab/current/index.js";
import { build as buildVpdgd } from "../vpdgd/v2_0/index.js";
import { build as buildZm } from "../zm/current/index.js";

/** A typed builder erased to the dispatcher's boundary. */
type Builder = (body: unknown) => string;

const cast = <T>(fn: (b: T) => string): Builder => fn as unknown as Builder;

/**
 * Registry of every typed builder shipped by the package, keyed by
 * `art` then `version`. Single-version arts use `"current"`.
 */
const BUILDERS: Record<string, Record<string, Builder>> = {
	BET: { current: cast(buildBet) },
	DIGI: { current: cast(buildDigi) },
	DUE: { current: cast(buildDue) },
	FVAN: { current: cast(buildFvan) },
	KA1: { ab_2016: cast(buildKa1Ab2016), ab_2022: cast(buildKa1Ab2022) },
	KOM: { current: cast(buildKom) },
	KOMU: { current: cast(buildKomu) },
	L1: {
		"2022": cast(buildL12022),
		"2023": cast(buildL12023),
		"2024": cast(buildL12024),
		"2025": cast(buildL12025),
	},
	NOVA: { current: cast(buildNova) },
	RZ: { current: cast(buildRz) },
	SB: { current: cast(buildSb) },
	SBS: { current: cast(buildSbs) },
	SBZ: { current: cast(buildSbz) },
	SOER: { current: cast(buildSoer) },
	STAB: { current: cast(buildStab) },
	TVW: { current: cast(buildTvw) },
	U30: { "01_2022": cast(buildU3001_2022), "07_2026": cast(buildU3007_2026) },
	UEB: { current: cast(buildUeb) },
	VAT: { current: cast(buildVat) },
	VATAB: { current: cast(buildVatab) },
	VPDGD: { v2_0: cast(buildVpdgd) },
	U13: { current: cast(buildZm) },
};

export class UnsupportedArtError extends Error {
	constructor(public readonly art: string) {
		super(`No typed builder for art="${art}"`);
		this.name = "UnsupportedArtError";
	}
}

export class UnknownVersionError extends Error {
	constructor(
		public readonly art: string,
		public readonly version: string,
		public readonly available: ReadonlyArray<string>,
	) {
		super(`Art "${art}" has no version "${version}". Available: ${available.join(", ")}`);
		this.name = "UnknownVersionError";
	}
}

export class VersionRequiredError extends Error {
	constructor(
		public readonly art: string,
		public readonly available: ReadonlyArray<string>,
	) {
		super(
			`Art "${art}" is multi-version; pass an explicit version. Available: ${available.join(", ")}`,
		);
		this.name = "VersionRequiredError";
	}
}

export interface BuildBodyArgs {
	art: string;
	version?: string;
	body: unknown;
}

/**
 * Look up the right typed builder for `(art, version)` and emit XML from a
 * `unknown` body. Throws on unknown art / missing version. The underlying
 * `build()` throws `ValidationError` on Zod failure.
 */
export function buildBody(args: BuildBodyArgs): string {
	const versions = BUILDERS[args.art];
	if (!versions) throw new UnsupportedArtError(args.art);
	const available = Object.keys(versions);
	let versionKey: string;
	if (args.version !== undefined) {
		versionKey = args.version;
	} else if (versions.current !== undefined) {
		versionKey = "current";
	} else if (available.length === 1 && available[0] !== undefined) {
		versionKey = available[0];
	} else {
		throw new VersionRequiredError(args.art, available);
	}
	const fn = versions[versionKey];
	if (!fn) throw new UnknownVersionError(args.art, versionKey, available);
	return fn(args.body);
}

/** Reflection: list typed-builder versions per art (for CLI / MCP discovery). */
export function listBuilders(): Record<string, ReadonlyArray<string>> {
	const out: Record<string, string[]> = {};
	for (const [art, versions] of Object.entries(BUILDERS)) {
		out[art] = Object.keys(versions);
	}
	return out;
}
