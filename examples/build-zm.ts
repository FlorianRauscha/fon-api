/**
 * Example: build a Zusammenfassende Meldung (`art=U13`) — both the regular
 * "list of EU customers" form AND the GESAMTRUECKZIEHUNG (full retraction)
 * variant. The two are mutually exclusive per Erklärung; the typed module
 * encodes that with a `kind`-discriminated `content` field.
 *
 *   npx tsx examples/build-zm.ts
 *
 * ZM is filed monthly or quarterly listing every EU-VAT-ID that bought from
 * you, with total turnover. KLAG codes:
 *   1 — innergemeinschaftliche Lieferung
 *   2 — Dreiecksgeschäft
 *   3 — sonstige Leistung
 *
 * Once published, replace relative imports with `import ... from 'fon-api/zm/current'`.
 */
import { type ZMBody, build } from "../src/zm/current/index.js";

// ---------------------------------------------------------------------------
// 1. Regular ZM with three customer entries.
// ---------------------------------------------------------------------------
const regular: ZMBody = {
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
			art: "U13",
			satznr: 1,
			allgemein: {
				anbringen: "U13",
				zrvon: "2026-03",
				zrbis: "2026-03",
				fastnr: "123456789",
				kundeninfo: "ZM 03/2026",
			},
			content: {
				kind: "entries",
				entries: [
					// Standard innergemeinschaftliche Lieferung to a German customer.
					{ uidMs: "DE123456789", sumBgl: 50_000, klag: "1" },
					// Dreiecksgeschäft to an Italian customer.
					{ uidMs: "IT12345678901", sumBgl: 15_000, dreieck: "J", klag: "2" },
					// Sonstige Leistung (cross-border service) to a Polish customer.
					{ uidMs: "PL1234567890", sumBgl: 7_500, solei: "J", klag: "3" },
				],
			},
		},
	],
};

const regularXml = build(regular);
console.log("=== ZM with 3 customer entries ===");
console.log(`${regularXml.length} bytes\n`);
console.log(regularXml);

// ---------------------------------------------------------------------------
// 2. Gesamtrückziehung — "scratch the previous filing entirely".
// ---------------------------------------------------------------------------
const retraction: ZMBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 2,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:01:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U13",
			satznr: 1,
			allgemein: {
				anbringen: "U13",
				zrvon: "2026-02",
				zrbis: "2026-02",
				fastnr: "123456789",
				kundeninfo: "Rueckziehung 02/2026",
			},
			content: {
				kind: "gesamtrueckziehung",
				gesamtrueckziehung: { gesamtrueck: "J" },
			},
		},
	],
};

const retractionXml = build(retraction);
console.log("\n=== ZM Gesamtrückziehung (full retraction) ===");
console.log(`${retractionXml.length} bytes\n`);
console.log(retractionXml);

console.log("\n---");
console.log("Submit each via:");
console.log("  await client.upload({ art: 'U13', uebermittlung: 'P', data: regularXml });");
console.log("  await client.upload({ art: 'U13', uebermittlung: 'P', data: retractionXml });");
