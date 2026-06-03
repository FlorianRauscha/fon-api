/**
 * Example: build a NoVA (`art=NOVA`) filing — Austria's Normverbrauchsabgabe,
 * a one-off tax on motor-vehicle registration based on CO₂ emissions.
 *
 *   npx tsx examples/build-nova.ts
 *
 * Each ERKLAERUNG carries:
 *   - ANMELDUNG  — aggregate Bemessungsgrundlagen + Steuern for the period
 *                  (Lieferung / innergemeinschaftlicher Erwerb / sonstige Vorgänge)
 *   - VERGUETUNG — 0..1200 per-vehicle reimbursement entries (refund claims),
 *                  each keyed by FIN (Fahrzeug-Identifikationsnummer / VIN).
 *
 * Once published, replace relative imports with `import ... from 'fon-api/nova/current'`.
 */
import { type NovaBody, build } from "../src/nova/current/index.js";

const body: NovaBody = {
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
			art: "NOVA",
			satznr: 1,
			allgemein: {
				anbringen: "NOVA1",
				zr: "2026-03",
				fastnr: "123456789",
				kundeninfo: "NoVA 03/2026",
			},
			// Aggregate the period's Bemessungsgrundlagen across all delivery channels.
			anmeldung: {
				liefBmg: 250_000, // Inland deliveries
				liefSteuer: 25_000,
				igeBmg: 100_000, // Innergemeinschaftlicher Erwerb (intra-EU acquisition)
				igeSteuer: 10_000,
				sonstvgBmg: 0, // Sonstige Vorgänge (Eigenverbrauch etc.)
				sonstvgSteuer: 0,
			},
			// Per-vehicle refund claims — VERG_GRUND codes 40..59 cover legal grounds
			// (e.g. 40 = export, 41 = re-import, 50 = other).
			verguetungen: [
				{
					fin: "WAUZZZ8V0KA123456",
					vergBmg: 30_000,
					novaSatz: "12", // 12% NoVA rate
					vergSteuer: 3_600,
					vergGrund: 40,
					sonstBegruend: "Vehicle exported to non-EU country.",
					ustBmg: 30_000,
					ustInfo: 30,
				},
				{
					fin: "VF1RFD00159876543",
					vergBmg: 22_000,
					novaSatz: "08",
					vergSteuer: 1_760,
					vergGrund: 50,
					ustBmg: 22_000,
					ustInfo: 31,
				},
			],
		},
	],
};

const xml = build(body);
console.log(xml);
console.log("\n---");
console.log(`Generated ${xml.length} bytes of XSD-conformant NOVA XML.`);
console.log("Submit via:");
console.log("  await client.upload({ art: 'NOVA', uebermittlung: 'T', data: xml });");
