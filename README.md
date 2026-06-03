# fon-api

TypeScript SDK for the Austrian FinanzOnline (BMF) SOAP web services. Per-year typed payloads, XSD-conformant XML, validation rules engine, and a manifest-driven schema-update workflow.

> **Status: early release — published on [npm](https://www.npmjs.com/package/fon-api) as `fon-api@0.1.0`.** 27 typed builder modules across 22 art codes (incl. L1 2022–2025 and U30/KA1 multi-version) plus a `fon-api` CLI and a `fon-api-mcp` MCP server, 421 unit + XSD-conformance tests pass — generated XML validates against the official BMF XSDs via libxml2 wherever the upstream XSD is well-formed. Live SOAP round-trip against `finanzonline.bmf.gv.at` requires a registered Hersteller-ID — see [Authentication](#authentication).

---

## Why

Austrian software vendors who integrate with FinanzOnline keep hand-rolling SOAP clients, hand-typing year-versioned XSDs, and re-implementing the BMF "Prüfungen" (per-year validation rules) every year. There is no comprehensive npm package for the **submission** side — `manmal/finanzonline-ts` covers DataBox reads, but nothing covers `fileupload` for U30, ANV, Jahreserklärungen, KA1, ZM, etc.

`fon-api` aims to be the missing piece:

- **One package, one transport** — login + abfrage + the unified `fileupload` service that handles 30+ declaration types via an `art` discriminator.
- **Per-year typed bodies** — `fon-api/u30/07_2026`, `fon-api/l1/2025`, future `fon-api/jahr_erkl/2025`. New tax year = new minor version.
- **Validation rules engine** — Prüfungen encoded as runnable rules (e.g. Gewinnfreibetrag E1a, with the 2023→2024 threshold change captured).
- **Sustainable yearly maintenance** — `npm run update-schemas` walks a manifest of XSD URLs, fetches the latest, sha256-pins them, and feeds the codegen/test pipeline.

---

## Install

```bash
npm install fon-api
# or
pnpm add fon-api
# or
bun add fon-api
```

Requires Node 20+ (uses native `fetch`). Pure TypeScript, no native dependencies.

---

## Quick start

```ts
import { createClient } from "fon-api";
import { build, type U30Body } from "fon-api/u30/07_2026";

const client = createClient({
  tid: process.env.FON_TID!,
  benid: process.env.FON_BENID!,
  pin: process.env.FON_PIN!,
  herstellerid: process.env.FON_HERSTELLERID!,
});

const body: U30Body = {
  info: {
    artIdentifikationsbegriff: "FASTNR",
    identifikationsbegriff: "123456789",
    paketNr: 1,
    datumErstellung: "2026-08-15",
    uhrzeitErstellung: "10:30:00",
    anzahlErklaerungen: 1,
  },
  erklaerungen: [
    {
      art: "U30",
      satznr: 1,
      allgemein: { anbringen: "U30", zrvon: "2026-07", zrbis: "2026-07", fastnr: "123456789" },
      lieferungen: { kz000: 25_000, kz001: 20_000, versteuert: { kz022: 18_000 } },
      vorsteuer: { kz060: 3_600, kz090: -150 },
    },
  ],
};

const xml = build(body);                                       // Zod-validated, XSD-conformant
const result = await client.upload({ art: "U30", uebermittlung: "T", data: xml });

if (result.parsed?.kind === "OK") {
  console.log("Accepted:", result.parsed.meta.messageRefId);
} else if (result.parsed?.kind === "NOK" || result.parsed?.kind === "TWOK") {
  for (const err of result.parsed.errors) console.error(err.code, err.text);
}

await client.logout();
```

---

## What's covered

| Service | Endpoint | Status |
|---|---|---|
| `sessionService` (login/logout) | `…:443/fonws/ws/session` | ✅ |
| `abfrageDatenuebermittlung` | `…/fon/ws/abfrageDatenuebermittlung` | ✅ |
| `fileuploadService` (all submissions) | `…/fon/ws/fileupload` | ✅ |
| `databoxService` (read Bescheide) | — | use [`finanzonline-ts`](https://github.com/manmal/finanzonline-ts) |

| Art (submission type) | Versions | Body builder |
|---|---|---|
| `U30` (USt-Voranmeldung) | `01_2022`, `07_2026` | ✅ fully typed |
| `L1` (Arbeitnehmerveranlagung) | XSDs `2021`–`2025` vendored + sha256-pinned; typed builders `2022`, `2023`, `2024`, `2025` | ✅ 2022 + 2023 + 2024 + 2025 fully typed — all 6 inner sections incl. 1..20 children with FB-Monate grids. 2022 also carries `AUS29B_S/P` flags and per-month `FB{n}_WS` country codes that were removed in 2023. Historical year 2021 carries the vendored XSD (monitored by the schema-drift action) and currently submits via raw `data` until a typed builder lands |
| `KA1` (Kapitalertragsteuer-Anmeldung) | `ab_2016`, `ab_2022` | ✅ fully typed (KA1T/M/V/E/Z/Y, BMG_T/M/VE/Z/Y blocks, SVA_DATEN beneficiaries, KAT_BEGR enum) |
| `U13` / ZM (Zusammenfassende Meldung) | `current` | ✅ fully typed (1..9999 entries OR Gesamtrückziehung; KLAG codes, signed sumBgl) |
| `KOM` (Kommunalsteuer) | `current` | ✅ fully typed (KOMMST1/2, multi-municipality with GD/PLZ/BMG/STEUER, optional summary) |
| `NOVA` (Normverbrauchsabgabe) | `current` | ✅ fully typed (ANMELDUNG aggregates + 1..1200 VERGUETUNG vehicle entries with FIN/NOVA_SATZ/VERG_GRUND) |
| `FVAN` (FinanzOnline Vollmachten — Anlage) | `current` | ✅ fully typed |
| `SB` / `SBS` / `SBZ` (Selbstbemessung family) | `current` | ✅ fully typed (shared ZR shape — `ZRVON`/`ZRBIS` accept type ∈ {`datum`, `jahrmonat`, `jahr`}) |
| `RZ` (Registrierkasse) | `current` | ✅ fully typed |
| `UEB` (Umgründungs-/Übertragung) | `current` | ✅ fully typed |
| `DIGI` (Digitalsteuer) | `current` | ✅ fully typed |
| `STAB` (Stabilitätsabgabe) | `current` (ab 2017) | ✅ fully typed |
| `BET` (Beteiligte einer Personengesellschaft) | `current` | ✅ fully typed (Zod-only — upstream 2007 XSD has malformed regex/totalDigits, libxml2 cannot compile it) |
| `VAT` (EU VAT-Refund Antrag) | `current` | ✅ fully typed (1..1000 KAUF + 1..1000 IMPORT, 1..5 GEGENSTAND each, full Land/EU_LAND/Sprache/Waehrung enums) |
| `VATAB` (EU VAT-Refund Abschluss) | `current` | ✅ fully typed (NACE Rev. 2 651-entry runtime list, MS-IBAN, FRAGE_1A-2B, optional PDF anhang) |
| `DUE` (Depotübertragung §§273T/274T/275T/274A KEStG) | `current` | ✅ fully typed (4-way DEPOTINHABER union, 2-way UEBERTRAGUNG_AUF, 1..1000 BETROFFENE_WERTPAPIERE, Gesamtrück/transfer choice) |
| `KOMU` (Kommunalsteuer-Bemessungsgrundlage, GD-uploader) | `current` | ✅ fully typed (5-digit Gemeindekennzahl identifier, ANBRINGEN="KOM" inside art="KOMU") |
| `TVW` (Teamverwaltung) | `current` | ✅ fully typed (Zod-only — same upstream-XSD malformation as BET; TEAM_UEBERMITTLUNG envelope, per-line aktion attributes) |
| `SOER` (Sonstige Erklärungen — generic envelope) | `current` | ✅ fully typed (namespaced root, MessageSpec, 1..10000 base64-anhang entries with art ∈ E108c/KR1/ENAV1/KOH1/WA1/ELA1/EGA1) |
| `VPDGD` (Verrechnungspreise / CbC v2.0) | `v2_0` | ✅ BMF national-wrapper typed (Info_Daten + Vers); inner OECD `<CBC_OECD>` payload taken as a pre-validated string passthrough — caller supplies it from their own OECD CbC reporting tooling |
| `JAHR_ERKL` (Jahreserklärungen E1, E1a, K1, …) | `2023`, `2024`, `2025` Prüfungen | ⏳ Gewinnfreibetrag E1a rules wired; full typed builder pending codegen (14k-line XSD) |

The full set of 36 `art` codes is exposed by `UPLOAD_ARTEN` from `fon-api/upload`. 22 typed body builders (27 art×version modules) ship today; the remaining art codes accept raw `data` via `client.upload({ art, uebermittlung, data })`.

---

## CLI

A `fon-api` binary ships with the package. List supported art codes:

```bash
$ npx fon-api arts
U30
JAHR_ERKL
L1
…
VPDGD
```

Submit a pre-built XML payload (Test mode by default; pass `--uebermittlung P` for production):

```bash
export FON_TID=… FON_BENID=… FON_PIN=… FON_HERSTELLERID=…
npx fon-api submit --art U30 --xml ./body.xml
# {
#   "rc": 0,
#   "parsed": "OK",
#   "messageRefId": "…"
# }
```

Other CLI commands:

```bash
# Login once, persist the BMF session to ~/.config/fon-api/session.json (mode 0600).
# Subsequent abfrage / submit / pipeline calls skip the per-call BMF login round-trip.
npx fon-api login

# Validate XML against the bundled XSD (no credentials required)
npx fon-api validate --art U30 --xml ./body.xml --version 07_2026

# Query Lohnzettel/Sonderausgaben/Leitungsrechte/Hochwasser data already submitted to BMF
npx fon-api abfrage --art LOHNZETTEL --fastnr 123456789 --zeitraum 2024

# When done, BMF logout + clear the local session file.
npx fon-api logout
```

`validate` exits `0` on success, `1` on validation failure (or when libxml2 cannot compile the upstream XSD — currently BET and TVW). The CLI overall exits `0` on OK, `1` on NOK (BMF rejected the filing), and `2` on usage / I/O errors.

---

## MCP server

A second binary, `fon-api-mcp`, exposes the same primitives as [Model Context Protocol](https://modelcontextprotocol.io) tools an LLM agent can call. It speaks JSON-RPC over stdio.

Tools advertised:

| Tool | Purpose |
|---|---|
| `list_arts` | Enumerate the 36 BMF upload + 4 abfrage art codes plus a per-art map of typed-builder versions. |
| `describe_art` | Return a Draft-7 JSON Schema describing the body shape `build_xml` expects for a given art × version. |
| `build_xml` | Render a typed JSON body into BMF-conformant XML (Zod-validated). |
| `validate_xml` | Round-trip an XML payload through the bundled BMF XSD (libxml2). |
| `pipeline` | Build → validate → (optionally) submit in a single call. Each stage's status surfaces independently. |
| `abfrage` | Query Lohnzettel/Sonderausgaben/Leitungsrechte/Hochwasser data. |
| `upload` | Submit an art-discriminated XML payload via the BMF fileupload service. |

A drop-in config — including the recommended agent workflow — ships at [`examples/mcp-config.json`](./examples/mcp-config.json). To embed the server programmatically (custom transport, in-process from a VS Code extension, etc.) instead of spawning the binary:

```ts
import { createMcpServer } from "fon-api/mcp";

const server = createMcpServer();
// connect to your own Transport — e.g. an Express HTTP route or a custom IPC channel.
```

The minimal binary form:

```json
{
  "mcpServers": {
    "fon-api": {
      "command": "npx",
      "args": ["fon-api-mcp"],
      "env": {
        "FON_TID": "1000103u3032",
        "FON_BENID": "webserv99",
        "FON_PIN": "webserv99",
        "FON_HERSTELLERID": "ATU12345678"
      }
    }
  }
}
```

Credentials live in the server's environment — they are never accepted as tool arguments. `validate_xml` and `list_arts` work without credentials; `abfrage` and `upload` return a structured `error` if any FON_* var is missing.

---

## Authentication

FinanzOnline web services require:

1. **A FinanzOnline Webservice user** — created in FinanzOnline under **Admin → Benutzerverwaltung → Benutzer anlegen → Type "Webservices"**. This gives you a `tid` (Teilnehmer-ID), `benid` (Benutzer-ID), and a PIN.
2. **A Hersteller-ID** — issued to you by BMF when you register as a software developer. Format `[0-9A-Za-z]{10..24}`, often the company's UID like `ATU12345678`. Without one, `login` will fail. Contact `bmf-softwarehersteller@bmf.gv.at` or follow the registration process at <https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller.html>.

```ts
import { createClient, TEST_CREDENTIALS } from "fon-api";

const client = createClient({
  ...TEST_CREDENTIALS,                                          // BMF-published test tid/benid/pin
  herstellerid: process.env.FON_HERSTELLERID!,                  // your registered ID
});
```

`TEST_CREDENTIALS` exports `{ tid: '1000103u3032', benid: 'webserv99', pin: 'webserv99' }` — published by BMF in the Abfrage-Datenübermittlung documentation for testing read access.

---

## Reading data (Abfrage-Datenübermittlung)

Query Lohnzettel, Sonderausgaben, Leitungsrechte, and Hochwasser data submitted by third parties (employers, banks, etc.).

```ts
const data = await client.abfrage({
  art: "LOHNZETTEL",                                            // or 'SONDERAUSGABEN' | 'LEITUNGSRECHTE' | 'HOCHWASSER'
  fastnr: "123456789",                                          // 9-digit Finanzamts- und Steuernummer
  zeitraum: 2024,                                               // tax year (currentYear - 7 ≤ year ≤ currentYear)
});

console.log(data.rc, data.msg);
console.log(data.resultXml);                                    // raw <result> XML for further parsing
```

Returncode semantics (from the BMF spec, fully typed in `fon-api/core`):

| `rc` | Meaning |
|----:|---|
| 0 | OK |
| -1 | Session expired (`SessionExpiredError`) |
| -2 | Maintenance (`MaintenanceError` thrown automatically when BMF returns the wartung HTML) |
| -3 | Technical error |
| -4 | Not authorized (`InvalidCredentialsError`) |
| -5 | Invalid Fastnr |
| -6 | Zeitraum out of range (must be currentYear−7 .. currentYear, ≥ 2016) |
| -7 | Not authorized for the supplied Fastnr (`NotAuthorizedError`) |

---

## Submitting (Fileupload)

All submissions go through one SOAP operation — `POST .../fon/ws/fileupload` with three discriminators:

| Field | Values |
|---|---|
| `art` | `U30`, `JAHR_ERKL`, `L1`, `KOM`, `SB`, `KA1`, `NOVA`, `DIGI`, `SOER`, … (36 in total) |
| `uebermittlung` | `T` (Test, non-binding) or `P` (Production, filed for real) |
| `data` | the year-versioned XML payload string |

### Example: U30 (USt-Voranmeldung) for 07/2026 onwards

See the [Quick start](#quick-start) above. The 01/2022 schema is at `fon-api/u30/01_2022`.

### Example: L1 (Arbeitnehmerveranlagung) for tax year 2025

```ts
import { build, type L1Body } from "fon-api/l1/2025";

const body: L1Body = {
  info: {
    artIdentifikationsbegriff: "FASTNR",
    identifikationsbegriff: "123456789",
    paketNr: 1,
    datumErstellung: "2026-04-15",
    uhrzeitErstellung: "10:30:00",
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
        anzbez: 1,
        avab: "J",                                              // Alleinverdienerabsetzbetrag
      },
      sonderausgaben: { kz460: 500, kz280: 100 },               // typed: Spenden + Kirchenbeitrag
      werbungskosten: {
        beruf: "Software Engineer",
        kz717: 250,
        job1: { beruf: "V", zrvon: "--01-01", zrbis: "--12-31", kzPauschale: 825 },
      },
      // remaining sections via the rawInner escape hatch:
      aussergewoehnlicheBelastungen: { rawInner: '<KOERPER_S>50</KOERPER_S>' },
    },
  ],
};

const xml = build(body);
await client.upload({ art: "L1", uebermittlung: "T", data: xml });
```

### Section-union pattern (for L1 inner sections)

L1's six optional inner sections all accept *either* a typed shape *or* a `{ rawInner: string }` escape hatch — at every nesting level:

```ts
type SonderausgabenSection = { rawInner: string } | { kz460?: number; kz280?: number };

type AbBehinderungSection =
  | { rawInner: string }
  | {
      steuerpflichtiger?: { rawInner: string } | TypedAbBehindSelf;
      partner?: { rawInner: string } | TypedAbBehindPartner;
    };
```

The builder dispatches via `'rawInner' in section` recursively. **All six L1 2025 sections are typed today**, including the recursive AUSSERGEWOEHNLICHE_BELASTUNGEN tree with 1..20 child entries and a 12×5 Familienbeihilfe-monthly grid (`fbMonate: Partial<Record<1..12, FbMonth>>`). Adding new typed fields in future schema versions stays non-breaking: callers passing `{ rawInner }` keep working forever.

---

## Validation rules engine

Two kinds of validation run on a submission:

1. **Schema validation** (Zod, automatic in `build()`) — types, ranges, regex patterns, cross-field invariants like `info.anzahlErklaerungen === erklaerungen.length`. Optional XSD validation via system `xmllint` is wired into the test suite.
2. **Business rules ("Prüfungen")** — per-year tax-law calculations like the Gewinnfreibetrag E1a tiered formula. Encoded for tax years 2023, 2024 (the threshold-change year) and 2025.

```ts
import { gewinnfreibetragE1a } from "fon-api/jahr_erkl/2024";
import { runRules, makeContext, hasErrors } from "fon-api/validation";

const ctx = makeContext({
  e1aSumme: 28_050,
  kennzahls: { 9030: 1, 9227: 4_950 },                          // claimed GFB = 4_950
});

const findings = runRules([gewinnfreibetragE1a], ctx);
if (hasErrors(findings)) {
  for (const f of findings) {
    console.error(`${f.ruleId} ${f.code}: expected ≤ ${f.expected}, got ${f.actual}`);
  }
  throw new Error("Pre-submission validation failed");
}
```

The 2024 tiers (`{ 33_000: 15%, 178_000: 13%, 353_000: 7%, 583_000: 4.5%, ∞: 0% }`) and 2023 tiers (`30_000` first ceiling) are exposed as `GFB_TIERS_2024` / `GFB_TIERS_2023`, and the underlying staffel math as `computeStaffel(base, tiers)`.

Define your own rules:

```ts
import { defineRule } from "fon-api/validation";

const positiveTurnover = defineRule({
  id: "U30-positive-turnover",
  applies: { form: "U30", year: 2026 },
  check: (ctx) => {
    const total = ctx.kz(0);                                    // KZ000
    if (total !== undefined && total < 0) {
      return {
        ruleId: "U30-positive-turnover",
        severity: "error",
        code: "NEGATIVE_KZ000",
        kz: 0,
        actual: total,
        message: "KZ000 (Gesamtbetrag) must be ≥ 0",
      };
    }
    return null;
  },
});
```

---

## Response handling — the BMF protocol

Every fileupload response carries an XML "Protokoll" describing the BMF's verdict. `fon-api` parses it automatically and exposes a typed discriminated union:

```ts
const result = await client.upload({ art: "U30", uebermittlung: "P", data: xml });

switch (result.parsed?.kind) {
  case "OK":
    console.log("Accepted:", result.parsed.meta.messageRefId);
    break;
  case "TWOK":                                                  // Teilweise OK — accepted with warnings
    console.warn("Accepted with warnings:");
    for (const e of result.parsed.errors) console.warn(e.code, e.text, e.refNr);
    break;
  case "NOK":                                                   // Rejected
    console.error("Rejected:");
    for (const e of result.parsed.errors) console.error(e.code, e.text);
    break;
  case undefined:                                                // msg wasn't a recognisable protocol XML
    console.log("Raw msg:", result.msg);
}
```

The parser handles both observed BMF protocol variants (SOER's `<{Art}UebermittlungError>` wrapper with RefNr, and CbC's plain `<Error>` siblings with optional `<Data>` payload). It ships verified against six real BMF fixtures.

---

## Yearly schema updates

BMF publishes new XSDs each tax year (typically in autumn). The package keeps a manifest at `schemas/manifest.json` that lists every XSD URL, sha256 hash, and fetch timestamp. To pull updates:

```bash
npm run update-schemas                          # fetch all
npm run update-schemas -- --only u30            # fetch one art
npm run update-schemas -- --dry-run             # preview without writing
npm run update-schemas -- --force               # re-download even if hash matches
```

The fetcher is idempotent — re-running is a no-op when nothing changed upstream. JAHR_ERKL grew from 12_203 lines (2019) to 14_242 lines (2025), so drift is real and continuous.

A weekly GitHub Action (`.github/workflows/update-schemas.yml`) runs the fetcher every Monday at 06:00 UTC and opens a PR when any pinned sha256 drifts.

---

## Error handling

```ts
import {
  FonError,
  NetworkError,
  SoapFaultError,
  MaintenanceError,
  InvalidXmlError,
  ReturncodeError,
  SessionExpiredError,
  InvalidCredentialsError,
  NotAuthorizedError,
  ValidationError,
} from "fon-api";

try {
  await client.upload(...);
} catch (e) {
  if (e instanceof MaintenanceError)         /* BMF returned the /wartung/ page */;
  else if (e instanceof SessionExpiredError) /* call client.login() again */;
  else if (e instanceof ValidationError)     /* e.issues: [{ path, message }, ...] */;
  else if (e instanceof FonError)            /* generic catch */;
}
```

`FonClient.login()` is idempotent — it caches the session and returns the cached one on subsequent calls until `logout()`.

---

## Subpath exports

Tree-shake by importing only the years/services you use:

```
fon-api                         (top-level: createClient, error classes, TEST_CREDENTIALS)
fon-api/core                    (lower-level: ENDPOINTS, NAMESPACES, soapCall, session)
fon-api/abfrage                 (Lohnzettel/Sonderausgaben/Leitungsrechte/Hochwasser)
fon-api/upload                  (UPLOAD_ARTEN enum, parseProtocol, ProtocolResult)
fon-api/validation              (rules engine, makeContext, computeStaffel)

fon-api/u30/01_2022             (USt-Voranmeldung 01/2022 - 06/2026)
fon-api/u30/07_2026             (USt-Voranmeldung 07/2026 onward)
fon-api/l1/2022                 (Arbeitnehmerveranlagung 2022)
fon-api/l1/2023                 (Arbeitnehmerveranlagung 2023)
fon-api/l1/2024                 (Arbeitnehmerveranlagung 2024)
fon-api/l1/2025                 (Arbeitnehmerveranlagung 2025)
fon-api/ka1/ab_2016             (Kapitalertragsteuer 2016-2021)
fon-api/ka1/ab_2022             (Kapitalertragsteuer 2022 onward)
fon-api/zm/current              (Zusammenfassende Meldung — art=U13)
fon-api/kom/current             (Kommunalsteuererklärung)
fon-api/komu/current            (Kommunalsteuer-Bemessungsgrundlage, GD-uploader)
fon-api/nova/current            (Normverbrauchsabgabe)
fon-api/fvan/current            (Vollmachten-Anlage)
fon-api/sb/current              (Selbstbemessung)
fon-api/sbs/current             (Selbstbemessung-Spielbankenabgabe)
fon-api/sbz/current             (Selbstbemessung-Zwischenmeldung)
fon-api/rz/current              (Registrierkasse)
fon-api/ueb/current             (Umgründungs-/Übertragung)
fon-api/digi/current            (Digitalsteuer)
fon-api/stab/current            (Stabilitätsabgabe)
fon-api/bet/current             (Beteiligte einer Personengesellschaft)
fon-api/vat/current             (EU VAT-Refund Antrag)
fon-api/vatab/current           (EU VAT-Refund Abschluss)
fon-api/due/current             (Depotübertragung)
fon-api/tvw/current             (Teamverwaltung)
fon-api/soer/current            (Sonstige Erklärungen — namespaced envelope)

fon-api/vpdgd/v2_0              (Country-by-Country v2.0 national wrapper; OECD payload pass-through)

fon-api/jahr_erkl/2023          (E1a Gewinnfreibetrag rule, 2023 thresholds)
fon-api/jahr_erkl/2024          (E1a Gewinnfreibetrag rule, 2024 thresholds)
fon-api/jahr_erkl/2025          (E1a Gewinnfreibetrag rule, 2025 thresholds)
```

---

## Common pitfalls

Things callers (and AI agents) trip over repeatedly when building BMF payloads:

- **Country codes are BMF "Kfz-Kennzeichen"-style, not ISO-3166** — `D` for Germany (not `DE`), `A` for Austria, `F` for France, `GB` for UK, `USA` for the US. The DUE country field uses this as a closed enum; L1's country fields are free 1–5 char strings (shape-checked, not a closed enum). The VAT module uses a separate ISO-2 enum (because the EU VAT-Refund directive uses ISO-2). Run `fon-api describe --art DUE` to see the live DUE enum.
- **`info.anzahlErklaerungen` must equal `erklaerungen.length`** — every multi-Erklärung body has this cross-field invariant. Off by one and Zod rejects with `info.anzahlErklaerungen must equal erklaerungen.length`.
- **Output is UTF-8, even when the upstream XSD declares ISO-8859-1.** BMF's modern endpoints accept UTF-8 just fine; the typed builders all emit `<?xml version="1.0" encoding="UTF-8"?>` regardless of the XSD's declared encoding.
- **VATAB's NACE list is BMF-specific (651 entries) and ≠ the EU NACE Rev 2 superset.** Codes like `5610` (food and beverage service, present in EU NACE Rev 2) are *not* valid for VATAB — use `5611` instead. `describe_art --art VATAB` returns the runtime-validated list.
- **VATAB's ANTRAGNR pattern differs from VAT's** — VAT accepts `AT[A-Z0-9]{14}`, VATAB accepts only `AT[0-9]{14}`. Re-using the VAT Antrag's tracking ID will pass VAT but fail VATAB if it contains letters.
- **L1 element ordering changes year-to-year** — `SONDERAUSGABEN` emits `KZ280→KZ460` in 2024 but `KZ460→KZ280` in 2025; `BESONDERE_SONDERAUSGABEN_VERTEILUNG` is rearranged entirely. Always import the typed module matching the tax year you're filing for, not just the latest.
- **BET's and TVW's upstream XSDs are libxml2-incompatible** — their 2007-era schemas ship malformed regex character classes. `validate_xml` returns `xsd-incompatible` for those arts; trust the runtime Zod check instead.
- **Section-union escape hatch** — every L1 inner section accepts `{ rawInner: <xml string> }` as an alternative to the typed shape, recursively. See [`examples/l1-section-union.ts`](./examples/l1-section-union.ts) for a walk-through.
- **`paketNr` is per-day, per-art, per-uploader** — duplicates across submissions in the same day get rejected by BMF as `NOK`. Use a monotonic counter or timestamp.

---

## Roadmap

- **Codegen pipeline for JAHR_ERKL** — the unified Jahreserklärungen XSD is 14k lines covering ~30 form types (E1, E1a, E1c, E11, K1, K2, U1, …). Hand-writing isn't tractable; an XSD-to-TS generator targeted at the BMF dialect (`<xs:include>`, `<xs:sequence>`, `<xs:choice>`, `<xs:enumeration>`, `<xs:simpleType>`, `<xs:complexType>`) is the right multiplier.
- **Encode more Prüfungen rules** — the per-year `BMF_Pruefungen_*.pdf` documents (Einkünfte, GFB E6a-1, …) capture dozens beyond the GFB E1a rule that landed in 2023/2024/2025.
- **L1 backport** — XSDs and sha256 pins for tax years 2021–2024 are vendored; typed builder for 2024 ships today; 2021–2023 typed builders need to be written following the same shape (each with year-specific element-sequence orderings and KZ additions/removals).
- **Live e2e against BMF test environment** — gated on a registered Hersteller-ID; round-trips against `tid=1000103u3032` once that's available.

---

## Prior art / Credits

- **[manmal/finanzonline-ts](https://github.com/manmal/finanzonline-ts)** — read-only TypeScript SDK for the FinanzOnline DataBox. Complementary scope; `fon-api` does not duplicate DataBox.
- **[CSoellinger/php-fon-webservices](https://github.com/CSoellinger/php-fon-webservices)** — MIT-licensed PHP library; reference for the WSDL/XSD bundle (sessionService, fileuploadService, verification.xsd).
- **[bitranox/finanzonline_databox](https://github.com/bitranox/finanzonline_databox)** — original Python implementation that informed manmal's port (and indirectly this package's session/SOAP patterns).

## License

MIT — see [LICENSE](./LICENSE).
