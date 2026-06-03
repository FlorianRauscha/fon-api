import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		exclude: process.env.FON_E2E === "1" ? [] : ["test/e2e/**"],
		globals: false,
		environment: "node",
	},
});
