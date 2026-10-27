# Marine Engines Module — Implementation Notes

> **Status:** Frontend CRUD + cross-module SoT integration verified (browser-local)  
> **Routes:** `/marine-engines`, `/marine-engines/[id]`  
> **Annex:** § إدارة المحركات البحرية + acceptance “إدارة المحركات البحرية” / “ربط قطع الغيار بالمحركات”  
> **Audit date:** 2026-10-27 (final compliance + cross-system pass)

## Architecture

- Authoritative engine records: `marine-engines-store` → localStorage key `azzam-marine:marine-engines:v1`.
- Seed hydrate preserves IDs `eng-001`… from `MARINE_ENGINES` in `mock-catalog.ts` on first visit.
- **Spare ↔ engine compatibility SoT:** `SparePartRecord.compatibleEngineIds` only. Reverse view: `sparePartsCompatibleWithEngine(engineId)`.
- Engine-side link writes: `syncEngineCompatibleSpares(engineId, spareIds)` updates spare records (no duplicate link store).
- **Hard delete (safe path):** `deleteMarineEngineAndUnlink(engineId)` → clears spare links then `deleteMarineEngine`. UI must use this helper.
- Soft deactivate (`status: inactive`) preserves links and inventory.
- **Alternatives SoT (distinct):** spare `alternativeLinks` via `alternativePartsForEngine` — never equated with compatibility.
- Optional catalog link: `MarineEngineRecord.itemId` (nullable).
- Engine image: linked catalog item `imageSrc` when present; otherwise Ship placeholder.

## Integration map (source of truth)

| Concern | Source of truth | Engine UI behavior |
|---|---|---|
| Engine master | `marine-engines-store` | Directory + details + wizard |
| Compatible spares | `SparePartRecord.compatibleEngineIds` | Counts/tables via helpers |
| Alternative parts | `SparePartRecord.alternativeLinks` | `alternativePartsForEngine` |
| Catalog item spine | `items-store` | Optional `itemId`; PN/OEM/price/status from item |
| Stock on hand | `inventory-stock-store` balances, else item `qtyOnHand` | `effectiveSpareOnHandQty` |
| Sell/cost price | `CatalogItem.sellEgp` / `costEgp` | Sync does not rewrite prices |
| Manufacturers | Free-text | Not equated with suppliers |
| Suppliers | `item-suppliers-store` on items | Unaffected by engine compatibility |
| Cross-reference | Spare typed refs / `/cross-reference` | Independent of engine compatibility |
| Sales history | *(none wired)* | Honest empty KPI `—` + sales tab empty |
| Documents | *(none)* | Honest empty tab |
| Activity / audit | Engine `activity[]` + `logClientActivity` | Create/update/status/link/delete |
| Directory search | `filterEngines` | Manufacturer, model, serial, year/HP, notes; optional linked item tokens |
| Global ⌘K search | Navigation destinations only | Module search on `/marine-engines` |
| Authz | *(none server-side)* | UI confirm dialogs only |

## Required fields (annex)

| Field | Form / record |
|---|---|
| Manufacturer | `manufacturer` |
| Model | `model` |
| Year | `year` |
| Horsepower | `horsepower` |
| Serial Number | `serialNumber` (unique) |
| Country of origin | `countryCode` + `countryOfOrigin` |
| Basic data | `status`, `notes`, optional `itemId`, `specs[]` |

## Directory & details UI

- Header + Add / Import (honest unavailable) / Export / DateRangeFilter.
- Create/edit: **ModalDialog + WizardStepper** — Identity → Origin & details → Link spare parts → Review.
- Actions: View / Edit / Activate·Deactivate / **Delete** (confirm + unlink cascade).
- Details: unified hero (gallery | identity+KPIs | summary), tabs Overview · Documents · Sales · Alternatives · Compatible · Activity.
- QA shots: `docs/qa/marine-engines/details-1440.png`, `details-390.png`.

## Workflows verified (2026-10-27)

| ID | Workflow | Result |
|---|---|---|
| A | Create → update → deactivate → reload | Pass |
| B | Spare↔engine both directions + count | Pass |
| C | Sync add/remove; alternatives distinct; item survives | Pass |
| D | Warehouse stock SoT; sync does not change qty | Pass |
| E | Item pricing intact after sync | Pass |
| F | Deactivate preserves links + stock; missing id safe | Pass |
| G | No fabricated sales/docs fields | Pass |
| H | Invalid engine ids stripped; name ≠ compatibility | Pass |
| I | Search by manufacturer / model / serial | Pass |
| J | Seed ids preserved; delete cascade + audit | Pass |

## Tests

- `src/lib/marine-engines-store.test.ts`
- `src/lib/marine-engines-spare-integration.test.ts`
- `src/lib/marine-engines-system-integration.test.ts` (A–J)
- `src/lib/catalog-query.engines.test.ts`
- `src/lib/cross-system-integration.test.ts` (live `createMarineEngine`)

## Hardening (post-audit follow-up)

- Edit wizard seeds linked spares only after `useSparePartsHydrated` (render-time adjust) so save cannot wipe links from a pre-hydrate empty snapshot.
- Directory manufacturer / origin / status / **linkStatus** commit live via `patchCommittedFilter` (not draft-only).
- `filterEngines` **fails closed** when `linkStatus` is set without `linkedEngineIds`.
- Compatible-parts mobile cards show stock (`effectiveSpareOnHandQty`) + sell price alongside desktop table.
- `docs/CROSS_SYSTEM_INTEGRATION_AUDIT.md` engines rows aligned with live store + SoT helpers.

## Limitations (honest)

- Browser-local persistence only — not multi-user / not server DB / not authz.
- Sales history for engines remains empty until Sales exposes a reliable item↔engine relationship.
- Documents attachments not implemented.
- Global ⌘K is navigation-only; engine text search is on the engines directory.
- Annex 100k-item / &lt;2s search target not claimed.
- Frontend annex coverage for engines core + linking is high; production/backend readiness remains open.
