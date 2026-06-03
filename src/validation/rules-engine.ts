/**
 * Per-form, per-year validation rules engine.
 *
 * Models the BMF "Prüfungen" (validation checks) as composable rules that operate
 * on an abstract `RuleContext`. The context exposes Kennzahl lookups plus a few
 * aggregate accessors (E11/E1c/E1a sums) so rules don't need to know how the
 * underlying form payload is laid out.
 */

import type { KennzahlCode } from "./kz.js";

export type Severity = "error" | "warning";

/** A single validation finding emitted by a rule. */
export interface Finding {
	/** The rule that produced this finding (e.g. "GFB-E1a-2024"). */
	ruleId: string;
	severity: Severity;
	/** Stable machine code (e.g. "GFB_EXCEEDED"). */
	code: string;
	message: string;
	/** Primary Kennzahl this finding pertains to. */
	kz?: KennzahlCode | undefined;
	/** Expected value (e.g. allowed maximum). */
	expected?: number | undefined;
	/** Actual value the user submitted. */
	actual?: number | undefined;
}

/**
 * Form-and-aggregate context a rule operates on. Implementations are responsible
 * for mapping their concrete payload (typed body, parsed XML, raw map) onto these
 * accessors.
 */
export interface RuleContext {
	/** Returns the Kennzahl value, or undefined when not present on the form. */
	kz(code: KennzahlCode): number | undefined;
	/** True when any of the listed E1 Kennzahls is present and non-zero. */
	anyE1KennzahlNonZero(codes: ReadonlyArray<KennzahlCode>): boolean;
	agg: {
		/** Total profit/loss from the Beilage E1a ("Summe aus der Beilage E1a"). */
		e1aSumme(): number;
		/** Sum of positive Einkünfte across all E11 Beilagen with the given EINKART codes. */
		e11PositiveByEinkart(einkartCodes: ReadonlyArray<string>): number;
		/** Sum across all Beilage E1c entries. */
		e1cSumme(): number;
	};
}

export interface Rule {
	id: string;
	applies: { form: string; year: number };
	check(ctx: RuleContext): Finding | ReadonlyArray<Finding> | null;
}

export function defineRule(r: Rule): Rule {
	return r;
}

export function runRules(rules: ReadonlyArray<Rule>, ctx: RuleContext): Finding[] {
	const out: Finding[] = [];
	for (const r of rules) {
		const res = r.check(ctx);
		if (res === null) continue;
		if (Array.isArray(res)) out.push(...res);
		else out.push(res as Finding);
	}
	return out;
}

/** True when there are no findings at error severity. */
export function hasErrors(findings: ReadonlyArray<Finding>): boolean {
	return findings.some((f) => f.severity === "error");
}
