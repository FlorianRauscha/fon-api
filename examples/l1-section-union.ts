/**
 * Example: the L1 section-union escape hatch — `{ rawInner: string } | TypedSection`.
 *
 *   npx tsx examples/l1-section-union.ts
 *
 * Every L1 section accepts EITHER:
 *   - a fully-typed object that the builder Zod-validates and emits, OR
 *   - a `{ rawInner: <serialized inner XML> }` escape hatch the builder splices verbatim.
 *
 * The pattern goes recursively: AUSSERGEWOEHNLICHE_BELASTUNGEN is itself a
 * union, AND its `behinderung.steuerpflichtiger` / `behinderung.partner` /
 * `kindAusbildungBehinderung` sub-sections are unions, AND each child entry
 * inside `kindAusbildungBehinderung.kindAngaben[]` can itself be `{ rawInner }`.
 *
 * This means callers can:
 *   1. Migrate incrementally — type the sections you understand, leave the rest
 *      as raw inner XML you produce yourself.
 *   2. Stay forward-compatible — when fon-api types a new field next year,
 *      callers passing `{ rawInner }` keep working forever (just lose a bit of
 *      compile-time safety on that section).
 *   3. Mix in BMF-specific custom sections that fon-api hasn't typed yet
 *      without forking.
 */
import { type L1Body, build } from "../src/l1/2025/index.js";

// ---------------------------------------------------------------------------
// Shared header.
// ---------------------------------------------------------------------------
const baseInfo: L1Body["info"] = {
	artIdentifikationsbegriff: "FASTNR",
	identifikationsbegriff: "123456789",
	paketNr: 1,
	datumErstellung: "2026-04-15",
	uhrzeitErstellung: "10:30:00",
	anzahlErklaerungen: 1,
};
const baseAllgemein: L1Body["erklaerungen"][number]["allgemein"] = {
	anbringen: "L1",
	zr: "2025",
	fastnr: "123456789",
	anzbez: 1,
	avab: "J",
};

// ---------------------------------------------------------------------------
// 1. Fully typed — everything goes through Zod and the typed XML emitter.
// ---------------------------------------------------------------------------
const typedBody: L1Body = {
	info: baseInfo,
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: baseAllgemein,
			sonderausgaben: { kz460: 500, kz280: 100 },
			werbungskosten: {
				beruf: "Software Engineer",
				kz717: 250,
				job1: { beruf: "V", zrvon: "--01-01", zrbis: "--12-31", kzPauschale: 825 },
			},
			aussergewoehnlicheBelastungen: {
				allgemein: { kz730: 100, kz731: 50 },
			},
		},
	],
};
console.log("=== 1. Fully typed (no rawInner) ===");
console.log(`${build(typedBody).length} bytes\n`);

// ---------------------------------------------------------------------------
// 2. rawInner everywhere — total escape hatch. fon-api only validates the
//    info envelope and the ERKLAERUNG.allgemein head; every section is
//    a verbatim XML fragment.
// ---------------------------------------------------------------------------
const rawBody: L1Body = {
	info: baseInfo,
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: baseAllgemein,
			sonderausgaben: { rawInner: "<KZ460 type=\"kz\">500.00</KZ460><KZ280 type=\"kz\">100.00</KZ280>" },
			werbungskosten: { rawInner: "<KZ717 type=\"kz\">250.00</KZ717>" },
			aussergewoehnlicheBelastungen: { rawInner: "<ALLGEMEIN><KZ730 type=\"kz\">100.00</KZ730></ALLGEMEIN>" },
		},
	],
};
console.log("=== 2. All-rawInner (escape hatch) ===");
console.log(`${build(rawBody).length} bytes\n`);

// ---------------------------------------------------------------------------
// 3. Mixed — type what you understand, escape-hatch what you don't.
//    AUSSERGEWOEHNLICHE_BELASTUNGEN's outer wrapper is typed, but its
//    `behinderung.partner` is rawInner because we don't have the partner data
//    in typed form yet. The other partner branch (`steuerpflichtiger`) IS typed.
// ---------------------------------------------------------------------------
const mixedBody: L1Body = {
	info: baseInfo,
	erklaerungen: [
		{
			art: "L1",
			satznr: 1,
			allgemein: baseAllgemein,
			sonderausgaben: { kz460: 500 }, // typed
			werbungskosten: { rawInner: "<KZ718 type=\"kz\">800.00</KZ718>" }, // raw
			aussergewoehnlicheBelastungen: {
				// outer object typed
				behinderung: {
					steuerpflichtiger: { koerperS: 50, kfzS: "J" }, // typed nested
					partner: { rawInner: "<KOERPER_P>30</KOERPER_P><KZ436 type=\"kz\">120.00</KZ436>" }, // raw nested
				},
			},
		},
	],
};
const mixedXml = build(mixedBody);
console.log("=== 3. Mixed (typed + rawInner at every level) ===");
console.log(`${mixedXml.length} bytes\n`);
console.log(mixedXml);

console.log("\n---");
console.log("Key takeaway: section unions let you migrate at your own pace.");
console.log("As fon-api types more fields each tax year, your typed code keeps");
console.log("compiling and your rawInner code keeps working.");
