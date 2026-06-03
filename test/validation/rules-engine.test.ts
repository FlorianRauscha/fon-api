import { describe, expect, it } from "vitest";
import {
	type Rule,
	defineRule,
	hasErrors,
	makeContext,
	runRules,
} from "../../src/validation/index.js";

const trivialError: Rule = defineRule({
	id: "always-error",
	applies: { form: "E1", year: 2024 },
	check: () => ({
		ruleId: "always-error",
		severity: "error",
		code: "TEST",
		message: "boom",
	}),
});

const trivialWarning: Rule = defineRule({
	id: "always-warn",
	applies: { form: "E1", year: 2024 },
	check: () => ({
		ruleId: "always-warn",
		severity: "warning",
		code: "TEST",
		message: "nudge",
	}),
});

const noFire: Rule = defineRule({
	id: "no-fire",
	applies: { form: "E1", year: 2024 },
	check: () => null,
});

const multipleFindings: Rule = defineRule({
	id: "multi",
	applies: { form: "E1", year: 2024 },
	check: () => [
		{ ruleId: "multi", severity: "error", code: "A", message: "" },
		{ ruleId: "multi", severity: "warning", code: "B", message: "" },
	],
});

describe("runRules", () => {
	it("collects findings from every rule", () => {
		const findings = runRules([trivialError, trivialWarning, noFire], makeContext());
		expect(findings).toHaveLength(2);
		expect(findings.map((f) => f.severity).sort()).toEqual(["error", "warning"]);
	});

	it("flattens array results", () => {
		const findings = runRules([multipleFindings], makeContext());
		expect(findings).toHaveLength(2);
	});

	it("skips rules that return null", () => {
		const findings = runRules([noFire, noFire, noFire], makeContext());
		expect(findings).toHaveLength(0);
	});
});

describe("hasErrors", () => {
	it("true when any finding is severity=error", () => {
		expect(hasErrors([{ ruleId: "x", severity: "error", code: "A", message: "" }])).toBe(true);
	});
	it("false when all findings are warnings", () => {
		expect(hasErrors([{ ruleId: "x", severity: "warning", code: "A", message: "" }])).toBe(false);
	});
	it("false when no findings", () => {
		expect(hasErrors([])).toBe(false);
	});
});

describe("makeContext", () => {
	it("kz returns undefined for unknown codes", () => {
		const ctx = makeContext({ kennzahls: { 9030: 1 } });
		expect(ctx.kz(9030)).toBe(1);
		expect(ctx.kz(999)).toBeUndefined();
	});

	it("anyE1KennzahlNonZero membership check", () => {
		const ctx = makeContext({ e1KennzahlsNonZero: [780, 917] });
		expect(ctx.anyE1KennzahlNonZero([780])).toBe(true);
		expect(ctx.anyE1KennzahlNonZero([782])).toBe(false);
		expect(ctx.anyE1KennzahlNonZero([782, 917])).toBe(true);
	});

	it("e11PositiveByEinkart sums the requested codes", () => {
		const ctx = makeContext({
			e11PositiveByEinkart: { LF: 100, SA: 50, GW: 25, VV: 999 },
		});
		expect(ctx.agg.e11PositiveByEinkart(["LF", "SA", "GW"])).toBe(175);
		expect(ctx.agg.e11PositiveByEinkart(["LF"])).toBe(100);
		expect(ctx.agg.e11PositiveByEinkart([])).toBe(0);
	});

	it("aggregates default to 0 when not provided", () => {
		const ctx = makeContext();
		expect(ctx.agg.e1aSumme()).toBe(0);
		expect(ctx.agg.e1cSumme()).toBe(0);
		expect(ctx.agg.e11PositiveByEinkart(["LF"])).toBe(0);
	});
});
