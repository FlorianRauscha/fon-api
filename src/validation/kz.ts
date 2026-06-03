/**
 * Kennzahl primitives for the validation rules engine.
 *
 * BMF tax forms identify each numeric field by a "Kennzahl" (literally "key figure"),
 * a 3- or 4-digit code like KZ9030, KZ780, KZ9227. The same code can mean different
 * things on different forms (E1, E1a, E11), so rules always declare the form they
 * apply to.
 */

/** A 3- or 4-digit Kennzahl code, e.g. 9030, 9227, 780. */
export type KennzahlCode = number;

/** Format a Kennzahl as the canonical "KZ9030" string. */
export function fmtKz(code: KennzahlCode): string {
	return `KZ${String(code).padStart(3, "0")}`;
}
