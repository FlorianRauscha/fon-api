/**
 * Example: build a maxed-out L1 (Arbeitnehmerveranlagung) 2025 payload that
 * exercises every typed inner section.
 *
 * Demonstrates:
 *   - Typed ALLGEMEINE_DATEN with all flags set
 *   - Typed SONDERAUSGABEN (Spenden + Kirchenbeitrag)
 *   - Typed WERBUNGSKOSTEN with two job blocks
 *   - Typed AUSSERGEWOEHNLICHE_BELASTUNGEN
 *       · ALLGEMEIN
 *       · BEHINDERUNG (Steuerpflichtiger + Partner)
 *       · KIND_AUSBILDUNG_BEHINDERUNG with two children + FB monthly grids
 *   - Typed FREIBETRAGSBESCHEID
 *   - Typed INTERNATIONAL with Auslands-L17 + Doppelbesteuerung
 *   - Typed BESONDERE_SONDERAUSGABEN_VERTEILUNG
 *
 * Runnable today, no credentials needed:
 *   npx tsx examples/l1-full.ts
 */
import { type L1Body, build } from "../src/l1/2025/index.js";

const today = new Date();

const body: L1Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "123456789",
		paketNr: 1,
		datumErstellung: today.toISOString().slice(0, 10),
		uhrzeitErstellung: today.toTimeString().slice(0, 8),
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: {
				anbringen: "L1",
				zr: "2025",
				fastnr: "123456789",
				kundeninfo: "ANV-2025 sample",
				anzbez: 2,
				kz725: 132,
				avab: "J",
				kindfb: 2,
				mehrki: "J",
			},
			sonderausgaben: { kz460: 500, kz280: 132 },
			werbungskosten: {
				kz717: 250,
				beruf: "Software Engineer",
				job1: { beruf: "V", zrvon: "--01-01", zrbis: "--06-30", kzPauschale: 825 },
				job2: { beruf: "P", zrvon: "--07-01", zrbis: "--12-31", kzPauschale: 425 },
			},
			aussergewoehnlicheBelastungen: {
				allgemein: { agbelP: "J", kz730: 100, kz475: 250, opferaus: "J" },
				behinderung: {
					steuerpflichtiger: {
						koerperS: 50,
						diaetSz: "J",
						pflegeSa: "--01",
						pflegeSe: "--12",
						kfzS: "J",
						kz435: 1200,
					},
					partner: { koerperP: 30, kz436: 800 },
				},
				kindAusbildungBehinderung: {
					kindAngaben: [
						{
							famname: "Mustermann",
							vorname: "Max",
							vnrkinK: "1234150115",
							gebkinK: "2015-01-15",
							wsKind: "A",
							kostraK: 100,
							koerperK: 50,
							fbMonate: Object.fromEntries(
								Array.from({ length: 12 }, (_, i) => [i + 1, { s: "J", fb100: "J" }]),
							),
						},
						{
							famname: "Mustermann",
							vorname: "Mia",
							vnrkinK: "5678180220",
							gebkinK: "2018-02-20",
							wsKind: "A",
							kostraK: 100,
							fbMonate: { 1: { p: "J", fb50: "J" }, 12: { p: "J", fb50: "J" } },
						},
					],
				},
			},
			freibetragsbescheid: { indfb: "J", kz449: 1500 },
			international: {
				wsInl: "J",
				dbanrech: "J",
				auslEin: "J",
				staat3: "D",
				kz359: 1500,
				pensausl: "J",
				anzl17: 1,
				land1L1: "D",
				wk1L1: 200,
				auslst1: 50,
				ausantr: "J",
				sv184: "J",
				asStaat: "D",
				einkS: 12_000,
			},
			besondereSonderausgabenVerteilung: {
				famD: "Musterfrau",
				vorD: "Erika",
				vnrD: "1234010180",
				gebdatD: "1980-01-01",
				kz281: 100,
				zus1D: "J",
			},
		},
	],
};

const xml = build(body);
console.log(`Built ${xml.length}-byte L1 2025 payload exercising all typed sections.\n`);
console.log("--- XML preview (first 1500 bytes) ---");
console.log(xml.slice(0, 1500));
if (xml.length > 1500) console.log(`\n... (${xml.length - 1500} more bytes)`);

// Quick structural sanity-check: count occurrences of each major element.
const elementCounts: Record<string, number> = {};
for (const tag of [
	"ALLGEMEINE_DATEN",
	"SONDERAUSGABEN",
	"WERBUNGSKOSTEN",
	"WKBERUF1",
	"WKBERUF2",
	"AUSSERGEWOEHNLICHE_BELASTUNGEN",
	"BEHINDERUNG_STEUERPFLICHTIGER",
	"BEHINDERUNG_PARTNER",
	"KIND_ANGABEN",
	"FREIBETRAGSBESCHEID",
	"INTERNATIONAL",
	"BESONDERE_SONDERAUSGABEN_VERTEILUNG",
]) {
	elementCounts[tag] = (xml.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length;
}

console.log("\n--- structural sanity ---");
for (const [tag, count] of Object.entries(elementCounts)) {
	console.log(`  ${tag.padEnd(40)} × ${count}`);
}
console.log("\nReady to ship via `client.upload({ art: 'L1', uebermittlung: 'T', data: xml })`.");
