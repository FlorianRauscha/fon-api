/**
 * Example: build a KA1T (Kapitalertragsteuer-Anmeldung Tagesabrechnung)
 * payload with the post-2022 schema, including the SVA_DATEN beneficiary block.
 *
 *   npx tsx examples/build-ka1.ts
 *
 * KA1's `art` attribute discriminates the inner BMG block:
 *   - KA1T → daily settlements   (BMG_T)        ← this example
 *   - KA1M → monthly aggregate   (BMG_M)
 *   - KA1V → vorzeitige Endabr.  (BMG_VE)
 *   - KA1Z → Zwischenabrechnung  (BMG_Z)
 *   - KA1Y → Y-block             (BMG_Y)
 *
 * Once published, replace relative imports with `import ... from 'fon-api/ka1/ab_2022'`.
 */
import { type KA1Body, build } from "../src/ka1/ab_2022/index.js";

const body: KA1Body = {
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
			art: "KA1T",
			satznr: 1,
			allgemein: {
				anbringen: "KA1T",
				// `zr` is a discriminated value — use type='datum' for KA1T daily settlements.
				zr: { value: "2026-04-14", type: "datum" },
				fastnr: "123456789",
				kundeninfo: "KESt 14.04.2026",
			},
			bmgT: {
				// KAT11/KAT21/KAT31 are the typical "Inland-/Ausland-/Sonstige" splits.
				kat11: 12_500.0,
				kat11a: 1_000.0,
				kat21: 7_500.0,
				kat31: 5_000.0,
				summeKa: 25_000.0,
				// KAT_BEGR — Kapitalertragsteuer-Begründungscode (01..10, 99).
				katBegr: "03",
			},
			// Up to 10 beneficiary blocks per Erklärung. KAT_VNR is the 10-digit
			// Versicherungsnummer; KAT_BETRAG the apportioned amount in EUR.
			svaDaten: [
				{ vnr: "1234567890", name: "Mustermann Max", betrag: 15_000 },
				{ vnr: "0987654321", name: "Musterfrau Maria", betrag: 10_000 },
			],
		},
	],
};

const xml = build(body);
console.log(xml);
console.log("\n---");
console.log(`Generated ${xml.length} bytes of XSD-conformant KA1 (ab_2022) XML.`);
console.log("Submit via:");
console.log("  await client.upload({ art: 'KA1', uebermittlung: 'T', data: xml });");
