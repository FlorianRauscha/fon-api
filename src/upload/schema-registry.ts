/**
 * Per-art Zod schema registry. Mirrors the build-dispatcher registry but
 * exposes the runtime Zod schemas (one per art × version) so callers can
 *
 *  - describe an art's body shape as JSON Schema (`describeArt`)
 *  - introspect for typed-builder coverage from outside this package
 *
 * Used by the MCP server's `describe_art` tool and the CLI's `describe`
 * subcommand to teach LLM agents what shape to send for `build_xml`.
 */

import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { betBody } from "../bet/current/index.js";
import { digiBody } from "../digi/current/index.js";
import { dueBody } from "../due/current/index.js";
import { fvanBody } from "../fvan/current/index.js";
import { ka1Body as ka1Body2016 } from "../ka1/ab_2016/index.js";
import { ka1Body as ka1Body2022 } from "../ka1/ab_2022/index.js";
import { komBody } from "../kom/current/index.js";
import { komuBody } from "../komu/current/index.js";
import { l1Body as l1Body2022 } from "../l1/2022/index.js";
import { l1Body as l1Body2023 } from "../l1/2023/index.js";
import { l1Body as l1Body2024 } from "../l1/2024/index.js";
import { l1Body as l1Body2025 } from "../l1/2025/index.js";
import { novaBody } from "../nova/current/index.js";
import { rzBody } from "../rz/current/index.js";
import { sbBody } from "../sb/current/index.js";
import { sbsBody } from "../sbs/current/index.js";
import { sbzBody } from "../sbz/current/index.js";
import { soerBody } from "../soer/current/index.js";
import { stabBody } from "../stab/current/index.js";
import { tvwBody } from "../tvw/current/index.js";
import { u30Body as u30Body012022 } from "../u30/01_2022/index.js";
import { u30Body as u30Body072026 } from "../u30/07_2026/index.js";
import { uebBody } from "../ueb/current/index.js";
import { vatBody } from "../vat/current/index.js";
import { vatabBody } from "../vatab/current/index.js";
import { vpdgdBody } from "../vpdgd/v2_0/index.js";
import { zmBody } from "../zm/current/index.js";

/** Shape mirrors `BUILDERS` in build-dispatcher.ts — same key set. */
const SCHEMAS: Record<string, Record<string, ZodTypeAny>> = {
	BET: { current: betBody },
	DIGI: { current: digiBody },
	DUE: { current: dueBody },
	FVAN: { current: fvanBody },
	KA1: { ab_2016: ka1Body2016, ab_2022: ka1Body2022 },
	KOM: { current: komBody },
	KOMU: { current: komuBody },
	L1: { "2022": l1Body2022, "2023": l1Body2023, "2024": l1Body2024, "2025": l1Body2025 },
	NOVA: { current: novaBody },
	RZ: { current: rzBody },
	SB: { current: sbBody },
	SBS: { current: sbsBody },
	SBZ: { current: sbzBody },
	SOER: { current: soerBody },
	STAB: { current: stabBody },
	TVW: { current: tvwBody },
	U30: { "01_2022": u30Body012022, "07_2026": u30Body072026 },
	UEB: { current: uebBody },
	VAT: { current: vatBody },
	VATAB: { current: vatabBody },
	VPDGD: { v2_0: vpdgdBody },
	U13: { current: zmBody },
};

export class UnknownSchemaError extends Error {
	constructor(
		public readonly art: string,
		public readonly version?: string,
	) {
		super(
			version
				? `No Zod schema registered for art="${art}" version="${version}"`
				: `No Zod schema registered for art="${art}"`,
		);
		this.name = "UnknownSchemaError";
	}
}

/** Look up the runtime Zod schema for an art × version. */
export function resolveSchema(art: string, version?: string): ZodTypeAny {
	const versions = SCHEMAS[art];
	if (!versions) throw new UnknownSchemaError(art);
	const available = Object.keys(versions);
	const versionKey =
		version ??
		(versions.current !== undefined
			? "current"
			: available.length === 1 && available[0] !== undefined
				? available[0]
				: undefined);
	if (versionKey === undefined) throw new UnknownSchemaError(art);
	const schema = versions[versionKey];
	if (!schema) throw new UnknownSchemaError(art, versionKey);
	return schema;
}

export interface ArtDescription {
	art: string;
	version: string;
	availableVersions: ReadonlyArray<string>;
	jsonSchema: unknown;
}

/**
 * Render an art's body shape as JSON Schema (Draft-7), suitable for tool-call
 * argument validation in MCP clients or for generating UIs.
 */
export function describeArt(art: string, version?: string): ArtDescription {
	const versions = SCHEMAS[art];
	if (!versions) throw new UnknownSchemaError(art);
	const available = Object.keys(versions);
	const lastVersion = available[available.length - 1];
	const resolvedVersion =
		version ??
		(versions.current !== undefined
			? "current"
			: available.length === 1 && available[0] !== undefined
				? available[0]
				: lastVersion);
	if (resolvedVersion === undefined) throw new UnknownSchemaError(art);
	const schema = versions[resolvedVersion];
	if (!schema) throw new UnknownSchemaError(art, resolvedVersion);
	return {
		art,
		version: resolvedVersion,
		availableVersions: available,
		jsonSchema: zodToJsonSchema(schema, {
			name: `${art}_${resolvedVersion}_Body`,
			$refStrategy: "none",
		}),
	};
}

/** Reflection: list every typed-schema (art, version) pair for discovery. */
export function listSchemas(): Record<string, ReadonlyArray<string>> {
	const out: Record<string, string[]> = {};
	for (const [art, versions] of Object.entries(SCHEMAS)) {
		out[art] = Object.keys(versions);
	}
	return out;
}
