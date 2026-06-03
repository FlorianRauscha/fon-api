# Contributing to fon-api

Thanks for taking the time! Three workflows cover most contributions: **yearly schema refresh**, **adding a new typed art module**, and **releasing a new version**.

## Setup

```bash
git clone https://github.com/florianrauscha/fon-api.git
cd fon-api
npm ci
# install libxml2-utils so XSD-conformance tests run (skipped if absent)
brew install libxml2          # macOS
# or
sudo apt-get install -y libxml2-utils   # Debian/Ubuntu
```

Day-to-day commands:

```bash
npm test           # vitest run (unit + XSD-conformance suites)
npm run typecheck  # tsc --noEmit
npm run lint       # biome check src test
npm run build      # tsup → ESM bundles + .d.ts
```

## Yearly schema refresh

BMF publishes new XSDs each tax year (typically autumn). The package keeps `schemas/manifest.json` as the source of truth: every XSD URL has a pinned sha256 and a `fetched_at` timestamp.

The weekly `update-schemas.yml` GitHub Action does this automatically on Mondays at 06:00 UTC and opens a PR if anything drifted, but you can run it locally too:

```bash
npm run update-schemas                      # fetch all
npm run update-schemas -- --only u30        # one art
npm run update-schemas -- --dry-run         # log only
npm run update-schemas -- --force           # re-download even if hash matches
```

**Expected output when nothing has drifted upstream** (the steady state):

```
  · u30/01_2022/xsd unchanged (484bdff6e41a…)
  · u30/07_2026/xsd unchanged (e51a69c99568…)
  …
Done: 0 updated, 39 unchanged.
```

`--dry-run` produces the same accounting without writing any files. If you see `Invalid URL` errors, the predicate that walks XSD fields is leaking through `*_sha256` siblings — see `test/scripts/update-schemas.test.ts` for the regression check.

When a hash changes:

1. Inspect the diff with `git diff schemas/`. The XSD bytes are the source of truth — eyeball what BMF changed.
2. Re-run the full test suite. Module-level XSD-conformance tests catch breaking schema changes (e.g. new required elements, dropped enumerations).
3. If types or validators need follow-up changes, add them in the same PR with a Changeset entry (`npx changeset`, pick **patch** for additive-only changes, **minor** for new tax years, **major** only on intentional breaks).

## Adding a new typed art module

Pick the next untyped art from the table in the README. The pattern (~250 lines of code per art) is:

1. **Add the manifest entry**

   ```jsonc
   "newart": {
     "comment": "art=NEWART — short description",
     "current": {                                 // or "ab_2025", "01_2026", etc.
       "xsd": "https://www.bmf.gv.at/dam/jcr:UUID/BMF_XSD_Schema_NewArt.xsd"
     }
   }
   ```

   Then `npm run update-schemas -- --only newart` to download + sha256-pin.

2. **Write the four module files**

   ```
   src/newart/current/
   ├── types.ts      — TypeScript interfaces, plain unions for enums, `*Body` top-level
   ├── schema.ts     — Zod mirroring types.ts (z.literal / z.enum / z.string().regex(...))
   ├── builder.ts    — pure-string XML emission with `escapeXml`; runs `schema.safeParse` first
   └── index.ts      — re-exports build, schema, types
   ```

   Borrow shape from a similar module: `digi/current` (small, INFO_DATEN + ERKLAERUNG with one BEMESSUNGSGRUNDLAGE) or `due/current` (large, with discriminated unions for choice variants). The section-union escape hatch (`{ rawInner: string } | TypedSection` discriminated by `'rawInner' in section`) is established in `l1/2025` for any complex nested choice you don't want to fully type yet.

3. **Wire the subpath export** in `package.json`:

   ```jsonc
   "./newart/current": {
     "types": "./dist/newart/current/index.d.ts",
     "default": "./dist/newart/current/index.js"
   }
   ```

   And the bundler entry in `tsup.config.ts`:

   ```ts
   "newart/current/index": "src/newart/current/index.ts",
   ```

4. **Add tests** in `test/newart/current/`:

   - `builder.test.ts` — exercise the typed paths, all rejection cases (every Zod regex/range/enum), and any cross-field invariants. Aim for ~10 builder tests per module.
   - `xsd-conformance.test.ts` — `describe.skipIf(!hasXmllint())` block running the builder output through `xmllint --schema`. **Skip this if** the upstream XSD is libxml2-incompatible (BMF's older 2007-era XSDs use malformed regex character classes; document the limitation in `types.ts` TSDoc, see `bet/current` and `tvw/current` for prior art).

5. **Update the README** coverage table and the subpath-exports list.

6. **Run the full pipeline** to make sure nothing else broke:

   ```bash
   npm run typecheck && npm test && npm run lint && npm run build
   ```

7. **Add a Changeset entry** (`npx changeset`, pick **minor**) describing what shipped.

## Releasing

Every PR that ships user-visible changes should include a `.changeset/*.md` file (run `npx changeset` and follow the prompts). On merge to `main`, the Release workflow:

1. Aggregates all pending changesets and opens (or updates) a "chore: release" PR that bumps `package.json#version` and updates `CHANGELOG.md`.
2. Once that PR merges, the same workflow re-runs, sees no pending changesets, and instead `changeset publish`es to npm with provenance and pushes a git tag.

Pre-release checklist on the GitHub side: an `NPM_TOKEN` secret must be set on the repository.

## House style

- **Strict TS.** No `any` outside test files (where a `// biome-ignore` may justify rejection-case input).
- **No comments unless they explain WHY.** The XML element ordering and BMF-specific quirks (`ART_IDENTIFIKATIONSBEGRIFF="GD"` for KOMU, the BET 2007-XSD malformation, etc.) are exactly the kind of comments to write — anything that would surprise a future contributor reading the file cold.
- **No upstream-text elements left untyped.** Either type the field or document the section-union escape hatch — never silently drop information.
- **Builders are pure.** `build()` runs `schema.safeParse` (unless `validate: false`), then string-concatenates. No parsers, no SOAP transport, no I/O.
- **One module per art × version pair.** Year-versioned arts (`jahr_erkl/2024`, `jahr_erkl/2025`) and effective-date-versioned arts (`u30/01_2022`, `u30/07_2026`) coexist as siblings under `src/<art>/`.

## Reporting issues

- **BMF schema drift** that the weekly action didn't pick up: open an issue with the diff between checked-in and upstream XSD, plus a copy of the failing input you observed.
- **Validation false positives** (Zod rejects a body BMF would have accepted): include the `ValidationError.issues` array and an example of the BMF response that proves the body was acceptable.
- **Live SOAP integration bugs**: redact your `tid`/`benid`/`pin`/`herstellerid` and the `FASTNR`s involved before sharing payloads.
