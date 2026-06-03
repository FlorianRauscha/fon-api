# `fon-api` examples

All TypeScript examples are runnable directly with `tsx`:

```bash
npx tsx examples/<file>.ts
```

The build/validate examples need no credentials. The two that talk to BMF
(`abfrage.ts`, `u30-submit.ts`) read `FON_TID`, `FON_BENID`, `FON_PIN`,
`FON_HERSTELLERID` from the environment and exit early with a hint when any
are missing.

## Build a typed body → XML

| Example | Demonstrates |
|---|---|
| [`build-u30.ts`](./build-u30.ts) | USt-Voranmeldung 07/2026 — KZ000/001/022/060/090 split fields. |
| [`build-vat.ts`](./build-vat.ts) | EU VAT-Refund Antrag (intra-EU KAUF + non-EU IMPORT) plus its closing VATAB Abschluss with bank routing + NACE codes. |
| [`build-due.ts`](./build-due.ts) | Depotübertragung with the 4-way DEPOTINHABER discriminated union (FASTNR / VNR / person / firma) and a firma transfer target. |
| [`build-ka1.ts`](./build-ka1.ts) | Kapitalertragsteuer KA1T (daily settlement) with discriminated `Zeitraum`, KAT11/21/31 split, and 2 SVA_DATEN beneficiary blocks. |
| [`build-zm.ts`](./build-zm.ts) | Zusammenfassende Meldung (U13) with both regular customer entries (KLAG 1/2/3) AND the GESAMTRUECKZIEHUNG retraction variant. |
| [`build-stab.ts`](./build-stab.ts) | Stabilitätsabgabe (bank fee) — standard filing + Neugründungsförderung (NEUGR=J) variant. |
| [`build-nova.ts`](./build-nova.ts) | Normverbrauchsabgabe — period ANMELDUNG totals + per-vehicle VERGUETUNG refund claims with FIN/NOVA_SATZ/VERG_GRUND. |

## L1 (Arbeitnehmerveranlagung) deep-dive

| Example | Demonstrates |
|---|---|
| [`l1-full.ts`](./l1-full.ts) | Full L1 2025 with multiple inner sections typed simultaneously (sonderausgaben + werbungskosten + aussergewöhnliche Belastungen). |
| [`l1-section-union.ts`](./l1-section-union.ts) | The escape-hatch pattern: `{ rawInner } | TypedSection` recursively. Three side-by-side bodies — fully typed, all-rawInner, mixed. |

## End-to-end with credentials

| Example | Demonstrates |
|---|---|
| [`abfrage.ts`](./abfrage.ts) | Live Lohnzettel query against BMF. Configurable via `FON_FASTNR` and `FON_ZEITRAUM`. |
| [`u30-submit.ts`](./u30-submit.ts) | Build → submit a U30 in Test mode and parse the BMF protocol response. |

## Validation rules

| Example | Demonstrates |
|---|---|
| [`validate-gfb.ts`](./validate-gfb.ts) | Gewinnfreibetrag E1a across tax years 2023, 2024, and 2025 — same scenario flips PASS/FAIL across the 30 000 → 33 000 first-tier ceiling change. |

## MCP integration

| File | Demonstrates |
|---|---|
| [`mcp-config.json`](./mcp-config.json) | Drop-in Claude Code / Cursor / Continue config for `fon-api-mcp`, with the recommended agent workflow (`list_arts → describe_art → build_xml → validate_xml → upload`). |

For programmatic embedding (in-process, custom transport) instead of spawning the binary, see the snippet in [`README.md`](../README.md#mcp-server) — `import { createMcpServer } from 'fon-api/mcp'`.
