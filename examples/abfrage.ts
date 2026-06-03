/**
 * Example: query Lohnzettel data via the abfrageDatenuebermittlungService.
 *
 * Requires live credentials in env vars:
 *   FON_TID, FON_BENID, FON_PIN, FON_HERSTELLERID
 *
 *   npx tsx examples/abfrage.ts
 *
 * Without FON_HERSTELLERID the example exits with a hint instead of failing.
 */
import { createClient } from "../src/index.js";

const required = ["FON_TID", "FON_BENID", "FON_PIN", "FON_HERSTELLERID"] as const;
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
	console.error(`Missing env vars: ${missing.join(", ")}`);
	console.error("Set FON_TID/BENID/PIN/HERSTELLERID and re-run. The published BMF test creds");
	console.error("are tid=1000103u3032, benid=webserv99, pin=webserv99 — but you still need");
	console.error("a registered FON_HERSTELLERID (see README → Authentication).");
	process.exit(1);
}

const client = createClient({
	tid: process.env.FON_TID!,
	benid: process.env.FON_BENID!,
	pin: process.env.FON_PIN!,
	herstellerid: process.env.FON_HERSTELLERID!,
});

try {
	const fastnr = process.env.FON_FASTNR ?? "123456789";
	const zeitraum = Number(process.env.FON_ZEITRAUM ?? new Date().getFullYear() - 1);

	console.log(`Logging in as ${process.env.FON_TID}/${process.env.FON_BENID}…`);
	await client.login();

	console.log(`Fetching Lohnzettel for fastnr=${fastnr}, zeitraum=${zeitraum}…`);
	const res = await client.abfrage({ art: "LOHNZETTEL", fastnr, zeitraum });

	console.log(`rc=${res.rc}${res.msg ? ` (${res.msg})` : ""}`);
	if (res.resultXml) {
		console.log("--- result XML ---");
		console.log(res.resultXml.slice(0, 1500));
		if (res.resultXml.length > 1500) console.log(`… (${res.resultXml.length - 1500} more bytes)`);
	}
} finally {
	await client.logout();
}
