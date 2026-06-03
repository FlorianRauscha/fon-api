/**
 * Tiered (gestaffelt) percentage calculation used by the Austrian
 * Gewinnfreibetrag check and similar BMF formulas.
 *
 * Each tier defines its upper bound and the rate applied to the *portion* of the
 * base falling within that bracket. Brackets are cumulative — a base of 100k
 * across `[{upTo:33k,rate:.15},{upTo:178k,rate:.13}]` yields
 *   33k × 15%  +  67k × 13%  =  4_950  +  8_710  =  13_660.
 */

export interface Tier {
	/** Upper bound (inclusive) of this tier's bracket. Use `Number.POSITIVE_INFINITY` for the top. */
	upTo: number;
	/** Rate applied to the portion of the base falling within this tier. */
	rate: number;
}

/**
 * Apply the staffel calculation to `base` over `tiers`. Negative bases yield 0.
 * The result is rounded to 2 decimal places (cents).
 */
export function computeStaffel(base: number, tiers: ReadonlyArray<Tier>): number {
	if (!(base > 0)) return 0;
	let remaining = base;
	let prev = 0;
	let total = 0;
	for (const t of tiers) {
		if (remaining <= 0) break;
		const span = t.upTo - prev;
		const portion = Math.min(remaining, span);
		total += portion * t.rate;
		remaining -= portion;
		prev = t.upTo;
	}
	return Math.round(total * 100) / 100;
}
