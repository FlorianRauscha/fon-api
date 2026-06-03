/**
 * Smoke tests for the MCP server. We talk to it over stdio with hand-rolled
 * JSON-RPC messages — no SDK client needed, which keeps the test surface narrow
 * and decouples it from `@modelcontextprotocol/sdk` API churn.
 *
 * `tools/list` and `validate_xml` are exercised because both are pure-offline
 * (no BMF transport involved). `abfrage` and `upload` would require live
 * credentials and are covered by the CLI smoke tests instead.
 */

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MCP = resolve(ROOT, "src/mcp/index.ts");

interface JsonRpcResponse {
	jsonrpc: "2.0";
	id: number;
	result?: unknown;
	error?: { code: number; message: string };
}

class McpClient {
	proc: ChildProcessWithoutNullStreams;
	private buf = "";
	private pending = new Map<number, (r: JsonRpcResponse) => void>();
	private nextId = 1;

	constructor() {
		this.proc = spawn("npx", ["tsx", MCP], {
			cwd: ROOT,
			env: {
				...process.env,
				FON_TID: "",
				FON_BENID: "",
				FON_PIN: "",
				FON_HERSTELLERID: "",
			},
		});
		this.proc.stdout.setEncoding("utf8");
		this.proc.stdout.on("data", (chunk: string) => {
			this.buf += chunk;
			let nl = this.buf.indexOf("\n");
			while (nl >= 0) {
				const line = this.buf.slice(0, nl);
				this.buf = this.buf.slice(nl + 1);
				if (line.trim().length > 0) this.handleLine(line);
				nl = this.buf.indexOf("\n");
			}
		});
		this.proc.stderr.setEncoding("utf8");
	}

	private handleLine(line: string): void {
		try {
			const msg = JSON.parse(line) as JsonRpcResponse;
			const cb = this.pending.get(msg.id);
			if (cb) {
				this.pending.delete(msg.id);
				cb(msg);
			}
		} catch {
			// ignore non-JSON lines
		}
	}

	request(method: string, params: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
		const id = this.nextId++;
		const req = { jsonrpc: "2.0", id, method, params };
		return new Promise((resolveP, rejectP) => {
			this.pending.set(id, resolveP);
			this.proc.stdin.write(`${JSON.stringify(req)}\n`, (err) => {
				if (err) rejectP(err);
			});
			setTimeout(() => {
				if (this.pending.delete(id)) rejectP(new Error(`MCP request "${method}" timed out`));
			}, 15_000);
		});
	}

	async initialize(): Promise<void> {
		await this.request("initialize", {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "fon-api-test", version: "0.0.0" },
		});
		this.proc.stdin.write(
			`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
		);
	}

	close(): void {
		try {
			this.proc.stdin.end();
		} catch {}
		this.proc.kill();
	}
}

// Single MCP child process per file — paying the `npx tsx` cold-start tax once
// instead of per `it`. Each test exchanges JSON-RPC messages with a unique id,
// so there's no cross-test interference even though they share a process.
describe("fon-api-mcp", () => {
	let mcp: McpClient;
	beforeAll(async () => {
		mcp = new McpClient();
		await mcp.initialize();
	}, 30_000);
	afterAll(() => {
		mcp.close();
	});

	it("`tools/list` advertises the four tools", async () => {
		const res = await mcp.request("tools/list");
		expect(res.error).toBeUndefined();
		const tools = (res.result as { tools: Array<{ name: string }> }).tools;
		const names = new Set(tools.map((t) => t.name));
		expect(names).toContain("list_arts");
		expect(names).toContain("describe_art");
		expect(names).toContain("build_xml");
		expect(names).toContain("validate_xml");
		expect(names).toContain("pipeline");
		expect(names).toContain("abfrage");
		expect(names).toContain("upload");
	});

	it("`tools/call pipeline` (no submit) reports build+validate stages", async () => {
		const body = {
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
		const res = await mcp.request("tools/call", {
			name: "pipeline",
			arguments: { art: "DIGI", body },
		});
		expect(res.error).toBeUndefined();
		const text = (res.result as { content: Array<{ text: string }> }).content[0]?.text;
		const parsed = JSON.parse(text ?? "{}");
		expect(parsed.build.ok).toBe(true);
		expect(parsed.submit).toEqual({ skipped: true, reason: "not-requested" });
	});

	it("`tools/call describe_art` returns a JSON Schema for the art's body", async () => {
		const res = await mcp.request("tools/call", {
			name: "describe_art",
			arguments: { art: "DIGI" },
		});
		expect(res.error).toBeUndefined();
		const text = (res.result as { content: Array<{ text: string }> }).content[0]?.text;
		const parsed = JSON.parse(text ?? "{}");
		expect(parsed.art).toBe("DIGI");
		expect(parsed.version).toBe("current");
		expect(parsed.jsonSchema).toBeTruthy();
		expect(JSON.stringify(parsed.jsonSchema)).toContain("artIdentifikationsbegriff");
	});

	it("`tools/call list_arts` returns enumerations + typedBuilders map", async () => {
		const res = await mcp.request("tools/call", {
			name: "list_arts",
			arguments: {},
		});
		expect(res.error).toBeUndefined();
		const text = (res.result as { content: Array<{ text: string }> }).content[0]?.text;
		const parsed = JSON.parse(text ?? "{}");
		expect(parsed.uploadArten).toContain("U30");
		expect(parsed.uploadArten).toContain("VPDGD");
		expect(parsed.abfrageArten).toContain("LOHNZETTEL");
		expect(parsed.typedBuilders.L1).toEqual(
			expect.arrayContaining(["2022", "2023", "2024", "2025"]),
		);
		expect(parsed.typedBuilders.DIGI).toEqual(["current"]);
	});

	it("`tools/call build_xml` round-trips a typed DIGI body to XML", async () => {
		const body = {
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
		const res = await mcp.request("tools/call", {
			name: "build_xml",
			arguments: { art: "DIGI", body },
		});
		expect(res.error).toBeUndefined();
		const text = (res.result as { content: Array<{ text: string }> }).content[0]?.text;
		const parsed = JSON.parse(text ?? "{}");
		expect(parsed.ok).toBe(true);
		expect(parsed.xml).toContain('<ERKLAERUNG art="DIGI">');
	});

	it("`tools/call validate_xml` reports xsd-incompatible for BET", async () => {
		const res = await mcp.request("tools/call", {
			name: "validate_xml",
			arguments: { art: "BET", xml: "<XML/>" },
		});
		expect(res.error).toBeUndefined();
		const text = (res.result as { content: Array<{ text: string }> }).content[0]?.text;
		const parsed = JSON.parse(text ?? "{}");
		expect(parsed.ok).toBe(false);
		expect(parsed.reason).toBe("xsd-incompatible");
	});
});
