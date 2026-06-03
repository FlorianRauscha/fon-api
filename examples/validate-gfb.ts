/**
 * Example: run the Gewinnfreibetrag E1a rule across tax years 2023, 2024 and 2025.
 *
 * The 2023→2024 threshold change moved the first-tier ceiling from 30 000 to 33 000;
 * 2025 carries 2024's ceiling forward unchanged. The same scenario therefore flips
 * from FAIL (2023) to ok (2024 + 2025) at the boundary.
 *
 * Runnable today, no credentials needed:
 *   npx tsx examples/validate-gfb.ts
 */
import { gewinnfreibetragE1a as gfb2023 } from "../src/jahr_erkl/2023/pruefungen.js";
import { gewinnfreibetragE1a as gfb2024 } from "../src/jahr_erkl/2024/pruefungen.js";
import { gewinnfreibetragE1a as gfb2025 } from "../src/jahr_erkl/2025/pruefungen.js";
import { hasErrors, makeContext, runRules } from "../src/validation/index.js";

const scenarios = [
	{ label: "BEM=30k, claim=4500 (within all years)", bem: 30_000, claim: 4_500 },
	{ label: "BEM=33k, claim=4900 (over 2023, OK 2024+)", bem: 33_000, claim: 4_900 },
	{ label: "BEM=33k, claim=4950 (max from 2024)", bem: 33_000, claim: 4_950 },
	{ label: "BEM=100k, claim=15_000 (over all)", bem: 100_000, claim: 15_000 },
	{ label: "BEM=100k, claim=13_660 (max from 2024)", bem: 100_000, claim: 13_660 },
];

for (const { label, bem, claim } of scenarios) {
	const ctx = makeContext({
		e1aSumme: bem - claim, // BEM = e1aSumme + claimed (KZ9227 added back per PDF #2 step 1)
		kennzahls: { 9030: 1, 9227: claim },
	});
	const f2023 = runRules([gfb2023], ctx);
	const f2024 = runRules([gfb2024], ctx);
	const f2025 = runRules([gfb2025], ctx);
	const flag = (fs: ReturnType<typeof runRules>) => (hasErrors(fs) ? "FAIL" : "ok  ");
	console.log(`${flag(f2023)} 2023  |  ${flag(f2024)} 2024  |  ${flag(f2025)} 2025  |  ${label}`);
	for (const x of [...f2023, ...f2024, ...f2025]) {
		console.log(`              ${x.ruleId}: claimed=${x.actual} > allowed=${x.expected}`);
	}
}
