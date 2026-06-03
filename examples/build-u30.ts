/**
 * Example: build a U30 (USt-Voranmeldung) XML payload for the 07/2026 schema.
 *
 * Runnable today, no credentials needed:
 *   npx tsx examples/build-u30.ts
 *
 * Once published, replace the relative imports with `import ... from 'fon-api/u30/07_2026'`.
 */
import { type U30Body, build } from "../src/u30/07_2026/index.js";

const today = new Date();
const isoDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
const isoTime = today.toTimeString().slice(0, 8); // HH:MM:SS

const body: U30Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: isoDate,
		uhrzeitErstellung: isoTime,
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U30",
			satznr: 1,
			allgemein: {
				anbringen: "U30",
				zrvon: "2026-07",
				zrbis: "2026-07",
				fastnr: "123456789",
				kundeninfo: "Q3/2026 sample",
			},
			lieferungen: {
				kz000: 25_000, // Gesamtbetrag der Bemessungsgrundlage
				kz001: 20_000, // Lieferungen
				versteuert: {
					kz022: 18_000, // 20% Normalsteuersatz
					kz029: 1_200, // 13% ermäßigt
					kz006: 800, // 10% ermäßigt
				},
			},
			vorsteuer: {
				kz060: 3_600, // Vorsteuern (außer EUST)
				kz061: 200, // EUST entrichtet
				kz090: -150, // Gutschrift / Zahllast (signed)
			},
		},
	],
};

const xml = build(body);
console.log(xml);

console.log("\n---");
console.log(`Generated ${xml.length} bytes of XSD-conformant U30 07_2026 XML.`);
console.log("Pass this as `data` to a fileupload SOAP call:");
console.log("  await client.upload({ art: 'U30', uebermittlung: 'T', data: xml });");
