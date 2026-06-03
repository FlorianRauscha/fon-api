/**
 * One-shot build → validate → (optionally) submit pipeline.
 *
 * Closes the full filing loop in a single call so callers (CLI scripts, MCP
 * agents, CI jobs) don't round-trip through 3 separate operations.
 *
 *   1. build      — typed JSON body → XML (Zod-validated)
 *   2. validate   — XML round-trip through bundled XSD via libxml2 (best-effort:
 *                   skipped with a clear reason for BET/TVW XSD-incompatible arts
 *                   or when xmllint isn't installed)
 *   3. upload     — fileupload SOAP submit (only when `submit.client` provided)
 *
 * Each stage's status is reported independently so callers can render a
 * structured "what passed, what failed, what was skipped" summary.
 */

import type { FonClient } from "../core/client.js";
import { type ValidationIssue, groupIssuesByPath } from "../core/issues.js";
import { type ValidateXmlResult, validateXml } from "../validation/xsd.js";
import { buildBody } from "./build-dispatcher.js";
import type { ProtocolResult } from "./protocol.js";
import type { Uebermittlung, UploadArt } from "./types.js";

export interface PipelineArgs {
	art: string;
	version?: string;
	body: unknown;
	/** Provide a client + uebermittlung to also submit. Omit to stop after validate. */
	submit?: {
		client: FonClient;
		uebermittlung: Uebermittlung;
	};
}

export type PipelineBuildStage =
	| { ok: true; xml: string }
	| {
			ok: false;
			error: { name: string; message: string };
			issues?: ReadonlyArray<ValidationIssue>;
			grouped?: ReturnType<typeof groupIssuesByPath>;
			availableVersions?: ReadonlyArray<string>;
	  };

export type PipelineValidateStage = { skipped: true; reason: "build-failed" } | ValidateXmlResult;

export type PipelineSubmitStage =
	| { skipped: true; reason: "build-failed" | "not-requested" }
	| {
			skipped: false;
			rc: number;
			parsed: ProtocolResult["kind"] | "unparsed";
			messageRefId?: string;
			errors?: ReadonlyArray<{ code: string; text: string }>;
	  };

export interface PipelineResult {
	build: PipelineBuildStage;
	validate: PipelineValidateStage;
	submit: PipelineSubmitStage;
}

/**
 * Run the pipeline. Never throws — every failure surfaces as a structured
 * stage result. The build stage is required; validate runs only if build
 * succeeded; submit runs only if `submit` was passed AND build succeeded.
 */
export async function runPipeline(args: PipelineArgs): Promise<PipelineResult> {
	// --- 1. build -----------------------------------------------------------
	let xml: string;
	try {
		xml = buildBody({
			art: args.art,
			body: args.body,
			...(args.version ? { version: args.version } : {}),
		});
	} catch (e) {
		const err = e as {
			name?: string;
			message: string;
			issues?: ReadonlyArray<ValidationIssue>;
			available?: ReadonlyArray<string>;
		};
		return {
			build: {
				ok: false,
				error: { name: err.name ?? "Error", message: err.message },
				...(err.issues ? { issues: err.issues, grouped: groupIssuesByPath(err.issues) } : {}),
				...(err.available ? { availableVersions: err.available } : {}),
			},
			validate: { skipped: true, reason: "build-failed" },
			submit: { skipped: true, reason: "build-failed" },
		};
	}

	// --- 2. validate --------------------------------------------------------
	const validate = validateXml(args.art, xml, args.version);

	// --- 3. submit (optional) ----------------------------------------------
	if (!args.submit) {
		return {
			build: { ok: true, xml },
			validate,
			submit: { skipped: true, reason: "not-requested" },
		};
	}
	const result = await args.submit.client.upload({
		art: args.art as UploadArt,
		uebermittlung: args.submit.uebermittlung,
		data: xml,
	});
	const submit: PipelineSubmitStage = {
		skipped: false,
		rc: result.rc,
		parsed: result.parsed?.kind ?? "unparsed",
		...(result.parsed?.kind === "OK" && result.parsed.meta?.messageRefId
			? { messageRefId: result.parsed.meta.messageRefId }
			: {}),
		...(result.parsed?.kind === "NOK" || result.parsed?.kind === "TWOK"
			? { errors: result.parsed.errors.map((e) => ({ code: e.code, text: e.text })) }
			: {}),
	};
	return { build: { ok: true, xml }, validate, submit };
}
