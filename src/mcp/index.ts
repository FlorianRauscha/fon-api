#!/usr/bin/env node
/**
 * `fon-api-mcp` binary entry point.
 *
 * The pure server module (no shebang, no auto-run) lives at `./server.js`
 * and is also exposed via the `fon-api/mcp` package subpath, so consumers
 * can embed `createMcpServer()` programmatically without spawning a process.
 */

import { runStdio } from "./server.js";

export { createMcpServer, runStdio } from "./server.js";

runStdio().catch((err) => {
	console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
	process.exit(1);
});
