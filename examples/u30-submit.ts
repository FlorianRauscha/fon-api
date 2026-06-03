/**
 * Example: submit a U30 USt-Voranmeldung via fileupload.
 *
 * Requires live credentials in env vars:
 *   FON_TID, FON_BENID, FON_PIN, FON_HERSTELLERID
 *
 *   npx tsx examples/u30-submit.ts
 *
 * By default uses uebermittlung='T' (test, non-binding). Set FON_PRODUCTION=1 to
 * file for real (uebermittlung='P') — verify your data carefully first.
 */
import { createClient } from "../src/index.js";
import { type U30Body, build } from "../src/u30/07_2026/index.js";

const required = ["FON_TID", "FON_BENID", "FON_PIN", "FON_HERSTELLERID"] as const;
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
	console.error(`Missing env vars: ${missing.join(", ")}`);
	process.exit(1);
}

const isProd = process.env.FON_PRODUCTION === "1";
const fastnr = process.env.FON_FASTNR ?? "123456789";
const today = new Date();

const body: U30Body = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: fastnr,
		paketNr: Number(process.env.FON_PAKET_NR ?? 1),
		datumErstellung: today.toISOString().slice(0, 10),
		uhrzeitErstellung: today.toTimeString().slice(0, 8),
		anzahlErklaerungen: 1,
	},
	erklaerungen: [
		{
			art: "U30",
			satznr: 1,
			allgemein: {
				anbringen: "U30",
				zrvon: process.env.FON_ZRVON ?? "2026-07",
				zrbis: process.env.FON_ZRBIS ?? "2026-07",
				fastnr,
				kundeninfo: process.env.FON_KUNDENINFO,
			},
			lieferungen: {
				kz000: Number(process.env.FON_KZ000 ?? 0),
			},
		},
	],
};

const xml = build(body);
console.log(`Built ${xml.length}-byte U30 07_2026 payload.`);
console.log(`Submitting as art=U30, uebermittlung=${isProd ? "P (PRODUCTION!)" : "T (test)"}…`);

if (isProd) {
	console.log("\n⚠️  Production mode — this will be filed for real with BMF.");
	console.log("⚠️  Press Ctrl-C within 5 seconds to abort.");
	await new Promise((r) => setTimeout(r, 5_000));
}

const client = createClient({
	tid: process.env.FON_TID!,
	benid: process.env.FON_BENID!,
	pin: process.env.FON_PIN!,
	herstellerid: process.env.FON_HERSTELLERID!,
});

try {
	await client.login();
	const result = await client.upload({
		art: "U30",
		uebermittlung: isProd ? "P" : "T",
		data: xml,
	});

	console.log(`\nrc=${result.rc}`);
	if (result.parsed) {
		console.log(`kind=${result.parsed.kind}`);
		console.log(`messageRefId=${result.parsed.meta.messageRefId}`);
		if (result.parsed.kind !== "OK") {
			for (const err of result.parsed.errors) {
				console.error(`  ${err.code}: ${err.text}${err.refNr ? ` [refNr=${err.refNr}]` : ""}`);
			}
		}
	} else {
		console.log("msg (raw):", result.msg.slice(0, 500));
	}
} finally {
	await client.logout();
}
