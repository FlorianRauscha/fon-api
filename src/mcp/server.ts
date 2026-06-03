/**
 * Pure MCP server module — no shebang, no auto-run, importable from any
 * Node.js process. The CLI binary at `src/mcp/index.ts` is a thin shim that
 * just calls `runStdio()` from here.
 *
 * Tools advertised:
 *   - `list_arts`       — enumerate art codes and typed-builder versions
 *   - `describe_art`    — return a JSON Schema describing the body shape for an art
 *   - `build_xml`       — render a typed JSON body into BMF-conformant XML
 *   - `validate_xml`    — round-trip an XML payload through the bundled XSD
 *   - `pipeline`        — build → validate → optionally submit, one shot
 *   - `abfrage`         — query Lohnzettel/Sonderausgaben/Leitungsrechte/Hochwasser
 *   - `upload`          — submit an art-discriminated XML payload
 *
 * Submission + abfrage tools require credentials in the environment of the
 * server process (`FON_TID`, `FON_BENID`, `FON_PIN`, `FON_HERSTELLERID`).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ABFRAGE_ARTEN, type AbfrageArt } from "../abfrage/types.js";
import { type ValidationIssue, groupIssuesByPath } from "../core/issues.js";
import { createClient } from "../index.js";
import { buildBody, listBuilders } from "../upload/build-dispatcher.js";
import { runPipeline } from "../upload/pipeline.js";
import { describeArt } from "../upload/schema-registry.js";
import { UPLOAD_ARTEN, type UploadArt } from "../upload/types.js";
import { validateXml } from "../validation/xsd.js";

function envOrNull(name: string): string | null {
	const v = process.env[name];
	return v && v.length > 0 ? v : null;
}

function clientOrErr(): { client: ReturnType<typeof createClient> } | { error: string } {
	const tid = envOrNull("FON_TID");
	const benid = envOrNull("FON_BENID");
	const pin = envOrNull("FON_PIN");
	const herstellerid = envOrNull("FON_HERSTELLERID");
	if (!tid || !benid || !pin || !herstellerid) {
		return {
			error: "Missing FON_TID/FON_BENID/FON_PIN/FON_HERSTELLERID in the MCP server's environment.",
		};
	}
	return { client: createClient({ tid, benid, pin, herstellerid }) };
}

function jsonResult(value: unknown): { content: Array<{ type: "text"; text: string }> } {
	return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

/**
 * Construct the fon-api MCP server with all 7 tools registered. Useful for
 * embedding into a custom transport (HTTP, websocket, in-process) instead of
 * the default stdio.
 */
export function createMcpServer(): McpServer {
	const server = new McpServer(
		{ name: "fon-api", version: "0.1.0" },
		{ capabilities: { tools: {} } },
	);

	server.tool(
		"list_arts",
		"List the 36 BMF FinanzOnline upload art codes plus a per-art map of typed-builder versions ('current', '2025', 'ab_2022', 'v2_0', etc.). Use the version key with build_xml / validate_xml to target a specific schema.",
		async () =>
			jsonResult({
				uploadArten: UPLOAD_ARTEN,
				abfrageArten: ABFRAGE_ARTEN,
				typedBuilders: listBuilders(),
			}),
	);

	server.tool(
		"describe_art",
		"Return a JSON Schema (Draft-7) describing the typed body shape this package expects for `build_xml` of a given art × version. Call this first to learn the field names, types, and constraints — feed the returned schema into your prompt or validator before constructing a body.",
		{
			art: z
				.enum(UPLOAD_ARTEN as unknown as [UploadArt, ...UploadArt[]])
				.describe("BMF upload art code."),
			version: z
				.string()
				.optional()
				.describe(
					"Schema version (e.g. '2025', '01_2022', 'ab_2022', 'v2_0'). Use list_arts to discover.",
				),
		},
		async ({ art, version }) => {
			try {
				return jsonResult(describeArt(art, version));
			} catch (e) {
				const err = e as { name?: string; message: string };
				return jsonResult({ ok: false, name: err.name, message: err.message });
			}
		},
	);

	server.tool(
		"build_xml",
		"Build a BMF-conformant XML payload from a typed JSON body. **Recommended workflow: call `describe_art` first to fetch the body's JSON Schema, then construct your body to match.** Each art's body shape is enforced by Zod at runtime — invalid inputs return a structured ValidationError with field-level issues grouped by section (`grouped.sections[].section`). Year/effective-date-versioned arts (L1, JAHR_ERKL, U30, KA1, VPDGD) require a version; others default to 'current'.",
		{
			art: z
				.enum(UPLOAD_ARTEN as unknown as [UploadArt, ...UploadArt[]])
				.describe("BMF upload art code."),
			version: z
				.string()
				.optional()
				.describe(
					"Schema version (e.g. '2025', '01_2022', 'ab_2022', 'v2_0'). Use list_arts to discover.",
				),
			body: z
				.unknown()
				.describe(
					"Typed body matching the art's exported interface. See `fon-api/<art>/<version>` types or run list_arts first.",
				),
		},
		async ({ art, version, body }) => {
			try {
				const xml = buildBody({ art, body, ...(version ? { version } : {}) });
				return jsonResult({ ok: true, xml });
			} catch (e) {
				const err = e as {
					name?: string;
					message: string;
					issues?: ReadonlyArray<unknown>;
					available?: ReadonlyArray<string>;
				};
				return jsonResult({
					ok: false,
					name: err.name,
					message: err.message,
					...(err.issues
						? {
								issues: err.issues,
								grouped: groupIssuesByPath(err.issues as ReadonlyArray<ValidationIssue>),
							}
						: {}),
					...(err.available ? { availableVersions: err.available } : {}),
				});
			}
		},
	);

	server.tool(
		"validate_xml",
		"Validate an XML payload against the bundled BMF XSD for the given art. Returns ok=true on success or a structured failure (xmllint stderr, xsd-incompatible, missing-xmllint, etc.).",
		{
			art: z
				.enum(UPLOAD_ARTEN as unknown as [UploadArt, ...UploadArt[]])
				.describe("BMF upload art code (e.g. U30, L1, DIGI, KA1)."),
			version: z
				.string()
				.optional()
				.describe(
					"Schema version (e.g. '2025', '01_2022', 'ab_2022'). Defaults to 'current' or the only available version.",
				),
			xml: z.string().min(1).describe("Serialized XML payload to validate."),
		},
		async ({ art, version, xml }) => jsonResult(validateXml(art, xml, version)),
	);

	server.tool(
		"pipeline",
		"Build → validate → (optionally) submit a typed JSON body in a single call. **Recommended workflow: call `describe_art` once first to learn the body shape, then drive `pipeline` for every subsequent filing.** Each stage's status surfaces independently in the response: `build.ok`, `validate.ok`, `submit.skipped|parsed`. Saves 2-3 round-trips for agents that already know the body shape. Pass `submit=true` (and optionally `uebermittlung`) to also file; otherwise stops after validate.",
		{
			art: z
				.enum(UPLOAD_ARTEN as unknown as [UploadArt, ...UploadArt[]])
				.describe("BMF upload art code."),
			version: z.string().optional().describe("Schema version. Use list_arts to discover."),
			body: z.unknown().describe("Typed body. Use describe_art first to learn the shape."),
			submit: z
				.boolean()
				.default(false)
				.describe("If true, also submit via the fileupload service after validation."),
			uebermittlung: z
				.enum(["T", "P"])
				.default("T")
				.describe("T = Test (default); P = Production. Only used when submit=true."),
		},
		async ({ art, version, body, submit, uebermittlung }) => {
			let client: ReturnType<typeof createClient> | undefined;
			if (submit) {
				const c = clientOrErr();
				if ("error" in c) return jsonResult({ error: c.error });
				client = c.client;
			}
			try {
				const result = await runPipeline({
					art,
					body,
					...(version ? { version } : {}),
					...(client ? { submit: { client, uebermittlung } } : {}),
				});
				return jsonResult(result);
			} finally {
				if (client) await client.logout().catch(() => undefined);
			}
		},
	);

	server.tool(
		"abfrage",
		"Run a FinanzOnline Abfrage-Datenübermittlung query. Reads BMF data submitted by third parties (Lohnzettel from employers, Sonderausgaben from charities, etc.) for a given FASTNR and tax year.",
		{
			art: z
				.enum(ABFRAGE_ARTEN as unknown as [AbfrageArt, ...AbfrageArt[]])
				.describe(`Abfrage art (${ABFRAGE_ARTEN.join(" | ")}).`),
			fastnr: z
				.string()
				.regex(/^[0-9]{9}$/)
				.describe("9-digit Finanzamts-/Steuernummer."),
			zeitraum: z
				.number()
				.int()
				.min(2016)
				.describe("Tax year. BMF accepts currentYear-7 .. currentYear, ≥ 2016."),
		},
		async ({ art, fastnr, zeitraum }) => {
			const c = clientOrErr();
			if ("error" in c) return jsonResult({ error: c.error });
			try {
				const result = await c.client.abfrage({ art, fastnr, zeitraum });
				return jsonResult({
					rc: result.rc,
					msg: result.msg,
					hasResult: result.resultXml !== undefined,
					resultXml: result.resultXml,
				});
			} finally {
				await c.client.logout().catch(() => undefined);
			}
		},
	);

	server.tool(
		"upload",
		"Submit a pre-built XML payload via the BMF fileupload service. Defaults to Test (uebermittlung='T'); pass 'P' only when filing for real. Returns the parsed BMF protocol response (OK / NOK / TWOK).",
		{
			art: z
				.enum(UPLOAD_ARTEN as unknown as [UploadArt, ...UploadArt[]])
				.describe("BMF upload art code."),
			uebermittlung: z
				.enum(["T", "P"])
				.default("T")
				.describe("T = Test (non-binding); P = Production (filed for real)."),
			data: z.string().min(1).describe("Serialized XML payload."),
		},
		async ({ art, uebermittlung, data }) => {
			const c = clientOrErr();
			if ("error" in c) return jsonResult({ error: c.error });
			try {
				const result = await c.client.upload({ art, uebermittlung, data });
				return jsonResult({
					rc: result.rc,
					parsed: result.parsed?.kind ?? "unparsed",
					messageRefId: result.parsed?.kind === "OK" ? result.parsed.meta?.messageRefId : undefined,
					errors:
						result.parsed?.kind === "NOK" || result.parsed?.kind === "TWOK"
							? result.parsed.errors.map((e) => ({ code: e.code, text: e.text }))
							: undefined,
					rawMsg: result.msg,
				});
			} finally {
				await c.client.logout().catch(() => undefined);
			}
		},
	);

	return server;
}

/** Connect a fresh `createMcpServer()` to a `StdioServerTransport()`. */
export async function runStdio(): Promise<void> {
	const server = createMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
