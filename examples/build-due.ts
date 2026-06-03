/**
 * Example: build a Depotübertragung (`art=DUE`) notification.
 *
 *   npx tsx examples/build-due.ts
 *
 * Filed by depositary banks when securities move between depots, per §§273T,
 * 274T, 275T, 274A KEStG. The schema models the move with three nested
 * elements:
 *
 *   - DEPOTINHABER  (0..50 entries, 4-way choice: VNR / FASTNR / person / firma)
 *   - BETROFFENE_WERTPAPIERE (0..1000 securities)
 *   - UEBERTRAGUNG_AUF (0..50 transfer targets, 2-way choice: person / firma)
 *
 * The typed module mirrors each xs:choice as a `kind`-discriminated union, so
 * passing an `aus`-shaped DEPOTINHABER (firma) with a `person`-shaped
 * UEBERTRAGUNG_AUF is a single typed object — Zod enforces the choice at
 * runtime and the builder dispatches to the right XML fragment.
 *
 * Once published, replace relative imports with `import ... from 'fon-api/due/current'`.
 */
import { type DueBody, build } from "../src/due/current/index.js";

const body: DueBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:00:00",
		anzahlErklaerungen: 1,
		fastnrMitteiler: "234567890",
		nameMitteiler: "Bank AG",
	},
	erklaerungen: [
		{
			art: "DUE",
			allgemein: {
				kind: "transfer", // — vs `kind: "gesamtrueck"` for a full revocation
				anbringen: "DUE",
				refnr: "REF-2026-04-15-1",
				gesetz: "274T", // §27 Abs 6 Z 1 lit b EStG (intra-EU transfer)
				gemeinschaftsdepotD: "J",
				datueb: "2026-03-31",
				depotfuehrendeStelle: { depStelle: "Wiener Bank Privat", bic: "BKAUATWWXXX" },
			},
			depotinhaber: [
				// Variant 1: existing FASTNR — most compact when the depot is held by
				// an Austrian taxpayer with a registered FASTNR.
				{ kind: "fastnr", fastnr: "123456789" },
				// Variant 2: natural person with full address — required when no FASTNR
				// is on file. Note the BMF "Kfz-Kennzeichen"-style country codes
				// (`A` = Austria, `D` = Germany, `F` = France, ...).
				{
					kind: "person",
					nname: "Mustermann",
					vname: "Max",
					geb: "1970-01-01",
					str: "Lindenallee",
					nr: "5",
					stg: "B",
					tuer: "12",
					plz: "1010",
					ort: "Wien",
					land: "A",
				},
			],
			betroffeneWertpapiere: [
				{
					bezWg: "Apple Inc.",
					isin: "US0378331005",
					men: 100, // 100 shares
					kennMen: "S", // S = Stück, N = Nominale
					ak: 15_000, // Anschaffungskosten in EUR (non-negative)
					kennAk: "T", // T = tatsächlich, A = Annahme, K = Kurswert
				},
				{
					bezWg: "Bundesschatz Anleihe 2030",
					isin: "AT0000A1ZGE4",
					men: 50_000,
					kennMen: "N", // Nominale
					ak: 49_500,
					kennAk: "K", // Kurswert
				},
			],
			uebertragungAuf: [
				// Receiving party (firma in this case — could also be a person).
				{
					kind: "firma",
					firmname: "Receiving Bank GmbH",
					str: "Friedrichstr",
					nr: "100",
					plz: "10117",
					ort: "Berlin",
					land: "D",
				},
			],
		},
	],
};

const xml = build(body);
console.log(xml);
console.log("\n---");
console.log(`Generated ${xml.length} bytes of XSD-conformant DUE XML.`);
console.log("Submit via:");
console.log("  await client.upload({ art: 'DUE', uebermittlung: 'T', data: xml });");
