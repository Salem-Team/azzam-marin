# Cross Reference & Alternative Parts — Implementation Notes

> **Status:** Frontend TA-32 workflow on spare-parts store (typed refs + CSV + indexed search)  
> **Route:** `/cross-reference`  
> **Annex:** §32 Cross Reference & Alternative Parts (**do not edit** `TECHNICAL_ANNEX.md`)  
> **Date:** 2026-10-26  
> **Persistence:** Browser `localStorage` key `azzam-marine:spare-parts:v1` — **not** multi-user / server durable

## Architecture

- **No parallel store.** Relationships are `SparePartRecord.alternativeLinks`; typed numbers are `SparePartRecord.typedReferences`.
- Legacy `crossReferenceCodes` is a **mirror** of typed reference display values (synced on normalize). On hydrate, codes migrate into typed refs when `typedReferences` is empty.
- Engine compatibility (`compatibleEngineIds`) remains separate.
- Query layer: `src/lib/cross-reference-query.ts` (precomputed `searchBlob` per row).
- CSV: `src/lib/cross-reference-csv.ts` (template, preview, validation report, commit).

## Annex §32 mapping

| Annex concept | Implementation | Status |
|---|---|---|
| OEM / Part / MPN numbers | Spine fields + typed refs (`oem`, `part_number`, `mpn`) | PASS (frontend) |
| Alternative Part Number | `typedReferences[].type = alternative` | PASS (frontend) |
| Compatible Part Number | `typedReferences[].type = compatible` | PASS (frontend) |
| Multiple numbers per part | Array of typed refs; duplicate rule below | PASS (frontend) |
| Original + alternative parts | `alternativeLinks[].partId` | PASS (frontend) |
| Manufacturer | Spare + optional per typed ref | PASS (frontend) |
| Compatibility degree | `alternativeLinks[].degree` | PASS (frontend) |
| Relationship type (بديلة / متوافقة) | Persisted `alternativeLinks[].relationshipType` (independent of degree) | PASS (frontend) |
| User notes | Link notes + typed-ref notes | PASS (frontend) |
| Show alts when searching | Directory search + spare details alternatives / cross-ref tabs | PASS (frontend) |
| Server / multi-user persistence | — | **BLOCKED** (architecture) |
| Catalog search >100k / <2s | — | **BLOCKED** (TA-PERF-01; no backend) |

### Ambiguities (not silently invented as contract)

- Annex does **not** define uniqueness for reference numbers. Product rule: conflict when same `(type, normalize(value))` and manufacturers match or either manufacturer is empty.
- Annex does **not** define CSV import. Implemented as a frontend workflow with preview + explicit confirm; partial commit of valid rows after confirm.
- Unprefixed legacy codes migrate as type `alternative`.

## Migration

1. `alternativeLinks` without `relationshipType` → derived once from degree, then persisted.
2. Legacy `alternativePartIds` → `exact` + `alternative` links (existing).
3. Legacy `crossReferenceCodes` → typed refs via `TYPE:value` prefixes (`OEM`, `PN`, `MPN`, `ALT`, `COMPAT`, `XREF`); unprefixed → `alternative`.
4. After normalize, `crossReferenceCodes` rewritten from typed refs (display mirror).

## CSV workflow

- Template download + upload (`.csv`, ≤2 MiB).
- Preview: total / valid / invalid / duplicates / missing parts + downloadable validation report.
- Confirm checkbox required before commit.
- **Policy:** validate → user confirms → revalidate live IDs on commit → apply valid rows; skip duplicate typed refs; upsert existing relationships; never write invalid rows.
- Export includes `relationship` + `reference` row types for round-trip of supported fields.

## Search & scale

- Row `searchBlob` includes names, codes, OEM/PN/MPN, typed values/types, notes.
- Benchmark: `src/lib/cross-reference-search.bench.test.ts` — **5,000** synthetic relationship rows, client budget **100 ms** (measured in CI/local test run).
- Annex **100,000 items / <2 s** remains **BLOCKED** without server search infra.

## UI

- Directory KPIs, filters (manufacturer, degree, relationship type, reference type), Import/Export, DateRangeFilter (list only — never on detail).
- Page title only (no subtitle — CONTENT_DISCIPLINE).
- Create/edit wizard: centered stepper (`--am-wizard-step-count`), equal part pickers, annex review fields (manufacturer + part numbers + degree + notes), activity via spare-store `logClientActivity`.
- Mobile row actions: icon toolbar (view / edit / remove); md+: overflow menu with icons + labels.
- Spare details Cross Ref tab lists typed references.
- Times via `formatDateTime` (12-hour).

## Tests

- `cross-reference.test.ts` — CRUD, validation, migrate, search, KPIs, engine regression
- `cross-reference-csv.test.ts` — CSV parse/import/duplicates/Unicode/export
- `cross-reference-search.bench.test.ts` — 5k indexed filter budget
- `spare-parts-integration.test.ts` — shared store regression

## Limits (honest)

- Browser-local only; not shared across users/devices.
- No server authorization / audit durability (TA-34 separate).
- 100k catalog search SLA not met in this architecture.
- Part pickers always surface `itemCode · partNumber · OEM` so search/E2E can match annex identity fields.
