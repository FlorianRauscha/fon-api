/**
 * Example: build an EU VAT-Refund Antrag (`art=VAT`) and its closing Abschluss
 * (`art=VATAB`) — the typical end-to-end flow for cross-border refund claims.
 *
 *   npx tsx examples/build-vat.ts
 *
 * Once published, replace relative imports with `import ... from 'fon-api/vat/current'`
 * (and `fon-api/vatab/current`).
 *
 * VAT-Refund flow:
 *   1. File one or more `art=VAT` Antrag submissions for purchases / imports
 *      made in another EU member state.
 *   2. After the refund period closes, file a single `art=VATAB` Abschluss
 *      with bank-account routing for the payout, NACE codes, and total
 *      counts/bases for the period.
 */
import { type VatBody, build as buildVatAntrag } from "../src/vat/current/index.js";
import { type VatabBody, build as buildVatabAbschluss } from "../src/vatab/current/index.js";

// --- 1. Antrag (VAT) — invoice-by-invoice refund claim ---------------------

const antragBody: VatBody = {
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
			art: "VAT",
			satznr: 1,
			allgemein: {
				anbringen: "VAT",
				zrvon: "2026-01",
				zrbis: "2026-03",
				fastnr: "123456789",
				euLand: "DE", // Refund member state
				sprache: "de",
			},
			kaeufe: [
				{
					seqnr: 1,
					beznr: "INV-DE-2026-001",
					datum: "2026-02-15",
					kleinbetr: "N",
					uid: "DE123456789",
					name: "Fuel Supplier GmbH",
					adr: "Hauptstr 1",
					plz: "10115",
					stadt: "Berlin",
					land: "DE",
					gegenstaende: [
						{ code: 1, subcode: "1.05", beschreibung: "Diesel for company vehicle" },
					],
					grundlagen: { waehrung: "EUR", bmg: 1_000, vst: 190, abvst: 190 },
				},
			],
			importe: [
				{
					seqnr: 1,
					importnr: "IM-2026-7",
					datum: "2026-03-01",
					name: "Hardware Trading Ltd",
					adr: "Pier 9",
					plz: "00000",
					stadt: "Hong Kong",
					land: "HK",
					gegenstaende: [{ code: 4, beschreibung: "Server replacement parts" }],
					grundlagen: { waehrung: "EUR", bmg: 500, vst: 100, abvst: 100 },
				},
			],
		},
	],
};

const antragXml = buildVatAntrag(antragBody);
console.log("=== VAT Antrag (1 KAUF + 1 IMPORT) ===");
console.log(`${antragXml.length} bytes\n`);
console.log(antragXml);

// --- 2. Abschluss (VATAB) — close-out with payout details ------------------

const abschlussBody: VatabBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 2,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:00:00",
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "VATAB",
			satznr: 1,
			allgemein: {
				anbringen: "VATAB",
				antragnr: "AT00000000000001", // From the VAT Antrag's BMF acknowledgement
				zrvon: "2026-01",
				zrbis: "2026-03",
				fastnr: "123456789",
				euLand: "DE",
				emailUnternehmer: "owner@example.com",
				nace: ["4711"], // Retail sale of food (any of the 651 NACE Rev. 2 codes)
				kontoinhaber: "Acme GmbH",
				inhabertyp: "A", // A = Antragsteller (applicant themselves)
				iban: "AT611904300234573201",
				bic: "BKAUATWWXXX",
				waehrBank: "EUR",
				frage1a: "J", // Required qualifiers — answer per BMF guidance
				frage1b: "N",
				frage1c: "N",
			},
			abschluss: {
				gesamtKauf: 1, // From the Antrag above
				gesamtBmgKauf: 1_000,
				gesamtImport: 1,
				gesamtBmgImport: 500,
				// Optional PDF anhang (base64-encoded original invoices etc.)
				// anhang: { pdf: { base64: "JVBERi0xLjQ..." } },
			},
		},
	],
};

const abschlussXml = buildVatabAbschluss(abschlussBody);
console.log("\n=== VATAB Abschluss ===");
console.log(`${abschlussXml.length} bytes\n`);
console.log(abschlussXml);

console.log("\n---");
console.log("Submit each via:");
console.log("  await client.upload({ art: 'VAT',   uebermittlung: 'P', data: antragXml });");
console.log("  await client.upload({ art: 'VATAB', uebermittlung: 'P', data: abschlussXml });");
