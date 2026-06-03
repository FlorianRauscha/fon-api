/**
 * Example: build a Stabilitätsabgabe (`art=STAB`) filing — Austria's bank
 * stability fee (Bankenabgabe), filed quarterly by depository institutions.
 *
 *   npx tsx examples/build-stab.ts
 *
 * The current shape (since 2017) is intentionally minimal:
 *   - BEM_STA3 — assessment basis under §3 (signed kz)
 *   - JAHR_UEB — annual carry-over (signed)
 *   - BEL_OG  — top-cap charge (signed)
 *   - NEUGR   — Neugründungsförderung flag ("J") — set instead of BEM_STA3 etc.
 *
 * Up to 300 ERKLAERUNG entries per packet. Once published, replace relative
 * imports with `import ... from 'fon-api/stab/current'`.
 */
import { type StabBody, build } from "../src/stab/current/index.js";

// --- 1. Standard bank-fee filing ------------------------------------------
const standard: StabBody = {
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
			art: "STAB",
			satznr: 1,
			allgemein: { anbringen: "STAB", zr: "2025", fastnr: "123456789" },
			bemessungsgrundlage: {
				bemSta3: 100_000_000, // §3 assessment basis (e.g. EUR 100m of liabilities)
				jahrUeb: 5_000_000, // Annual carry-over (signed; negative for credits)
				belOg: 1_500_000, // Top-cap surcharge
			},
		},
	],
};

console.log("=== STAB standard filing ===");
console.log(`${build(standard).length} bytes\n`);
console.log(build(standard));

// --- 2. Neugründungsförderung — newly-founded institutions are exempt ------
//   Per §3, the first 3 years post-founding don't owe the assessment fee.
//   Send NEUGR="J" alongside (or instead of) the BEM_STA3 amount.
const neuGruendung: StabBody = {
	info: { ...standard.info, paketNr: 2 },
	erklaerungen: [
		{
			art: "STAB",
			satznr: 1,
			allgemein: { anbringen: "STAB", zr: "2025", fastnr: "123456789" },
			bemessungsgrundlage: { neugr: "J", bemSta3: 50_000_000 },
		},
	],
};

console.log("\n=== STAB Neugründung (NEUGR=J) ===");
console.log(`${build(neuGruendung).length} bytes\n`);
console.log(build(neuGruendung));

console.log("\n---");
console.log("Submit each via:");
console.log("  await client.upload({ art: 'STAB', uebermittlung: 'P', data: xml });");
