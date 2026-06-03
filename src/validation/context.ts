/**
 * Convenience builder for `RuleContext`. Lets rule authors and tests provide a
 * flat data record instead of implementing the interface by hand.
 */

import type { KennzahlCode } from "./kz.js";
import type { RuleContext } from "./rules-engine.js";

export interface RuleContextData {
	/** Kennzahls present on the form, by code. */
	kennzahls?: Readonly<Record<number, number>>;
	/** Codes (typically from Beilage E1) that are present AND non-zero. Used by `anyE1KennzahlNonZero`. */
	e1KennzahlsNonZero?: ReadonlyArray<KennzahlCode>;
	/** Total profit/loss reported on Beilage E1a. */
	e1aSumme?: number;
	/** Sums of POSITIVE Einkünfte across all E11 Beilagen, keyed by EINKART code (e.g. LF, SA, GW). */
	e11PositiveByEinkart?: Readonly<Record<string, number>>;
	/** Total across all Beilage E1c entries. */
	e1cSumme?: number;
}

export function makeContext(data: RuleContextData = {}): RuleContext {
	const present = new Set(data.e1KennzahlsNonZero ?? []);
	return {
		kz: (c) => data.kennzahls?.[c],
		anyE1KennzahlNonZero: (codes) => codes.some((c) => present.has(c)),
		agg: {
			e1aSumme: () => data.e1aSumme ?? 0,
			e11PositiveByEinkart: (eks) =>
				eks.reduce((sum, ek) => sum + (data.e11PositiveByEinkart?.[ek] ?? 0), 0),
			e1cSumme: () => data.e1cSumme ?? 0,
		},
	};
}
