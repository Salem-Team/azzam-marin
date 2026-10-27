# Spare Parts — Cross-System Integration Report

> **Date:** 2026-10-26  
> **Scope:** Frontend-only shared-source wiring for `/spare-parts`  
> **Status:** PARTIAL — repaired integrations verified; several masters remain enum/seed

---

## A. Integration matrix

| Dependency | Source | Read | Write | Persistence | Propagation | Tests | Status |
|---|---|---|---|---|---|---|---|
| Identity / spine | `items-store` / `CatalogItem` | `useItems`, details join | `createSparePart` → `createItem`; `updateSparePart` → `updateItem` | `azzam-marine:items:v1` | Reactive store | store + integration | **PASS** |
| Specialized spare | `spare-parts-store` | `useSpareParts` | create/update/delete | `azzam-marine:spare-parts:v1` | Reactive | store + integration | **PASS** |
| Part categories | Enum `PART_CATEGORIES` (shared export) | Form + directory chips | Stored on `SparePartRecord.partCategory` | spare v1 | Enum (no CRUD) | integration | **PARTIAL** — no dynamic category master |
| Item mainCategory | `ItemCategoryId` on CatalogItem | Details | Preserved (`other` on create) | items v1 | Via items | — | **PARTIAL** — not mapped from partCategory |
| Country of origin | `world-countries` + `WorldCountrySelect` | Form / filters / flags | ISO code + label on item+spare | both stores | Static ISO list | integration | **PASS** (fixed supported list) |
| Manufacturer | `mergeManufacturerOptions` / `ITEM_MANUFACTURERS` ∪ data | Form select + filters | Copied labels on item+spare | both | Const + data union | integration | **PARTIAL** — no manufacturer CRUD master |
| Suppliers | `suppliers-store` + `item-suppliers-store` | Details `ItemSuppliersPanel` | Panel link CRUD | suppliers + item-suppliers keys | Reactive | integration + item-supplier suite | **PASS** |
| Marine engines | `marine-engines-store` | Form checkboxes; details; reverse lists | IDs on spare; `syncEngineCompatibleSpares` / `deleteMarineEngineAndUnlink` | engines v1 + spare v1 | Live reverse via `sparePartsCompatibleWithEngine` | system A–J 2026-10-27 | **PASS** (FE local) |
| Units | `ITEM_UNITS` / `mergeUnitOptions` | Form `<select>` | CatalogItem.unitOfMeasure | items v1 | Shared const + data | integration | **PASS** |
| OEM / Part Number | Dual item + spare | Search / form | Dual write; Items edit syncs spare | both | Hook `registerAfterItemUpdate` | integration | **PASS** |
| Alternatives | `alternativePartIds` → spare ids | Form / details | Spare CRUD | spare v1 | Reactive | integration | **PASS** (one-way unless both selected) |
| Cross-ref codes | Spare string[] | Details tab | Form | spare v1 | Reactive | store | **PARTIAL** — `/cross-reference` placeholder |
| Warehouse stock | `inventory-stock-store` | Details WH tab; badges/filters prefer sum | Inventory workflows only | warehouse-stock v1 | Reactive | integration | **PARTIAL** — uses balances when present; else demo qty |
| Pricing EGP | CatalogItem | Form / cards | Spare form | items v1 | Reactive | store | **PASS** (local) |
| FX / USD | `exchange-rates-store` | Create uses `getRateAsOf` | Rate module | exchange-rates v1 | Reactive rate list | integration | **PASS** for create; spare UI still EGP-primary |
| Images | Item image + IndexedDB | Details | Item image APIs | items + IDB | Reactive | items QA | **PASS** (via linked item) |
| Status | CatalogItem status enum | Form / badges / dialog | Spare form + status dialog | items v1 | Reactive | store | **PASS** |

---

## B. Changes made (why)

| Area | Files | Why |
|---|---|---|
| Shared categories | `spare-part-persist.ts` export `PART_CATEGORIES`; form + directory consume it | One enum list |
| UoM + manufacturers | `spare-part-form-dialog.tsx`, `item-form-options.ts` (+ KIT/SET) | Same shared selectors as Items |
| FX on create | `spare-parts-store.ts` → `getRateAsOf` | Stop inventing rate when FX store exists |
| Spine→spare sync | `registerAfterItemUpdate` + `syncSparePartFromCatalogItem` | Prevent dual-write drift from Items edits |
| Engine reverse links | `sparePartsCompatibleWithEngine`; engine directory/details/table | Live compat, not stale seed reverse IDs |
| Stock honesty | `sumStockQtyForItem`, `effectiveSpareOnHandQty`, catalog-query filters/KPIs | Prefer real WH balances when present |
| Engines list items | `engines-directory` uses `useItems` | Hydrated catalog, not seed-only map |
| Integration tests | `spare-parts-integration.test.ts` | Prove shared-source flows |
| Docs | this file + SPARE_PARTS_MODULE_IMPLEMENTATION | Honest status |

---

## C. Verification (executed)

| Command | Result |
|---|---|
| `npx tsx --test src/lib/spare-parts-integration.test.ts` | **13/13 pass** |
| `npm test` | **155/155 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** (0 errors) |
| `npm run build` | run after this report if not already in session |

---

## D. Remaining gaps

1. **No dynamic category / manufacturer master CRUD stores** — annex may eventually require masters; today enums/consts + free-text manufacturers.
2. **Cross-reference numbers** live on spare records; `/cross-reference` UI exists as a directory (verify current route status separately).
3. **Engine master** is live via `marine-engines-store` (create/edit/deactivate/delete + `syncEngineCompatibleSpares` / `deleteMarineEngineAndUnlink`) — seed hydrates first visit only.
4. **Browser-local persistence** — no multi-user / server sync.
5. **Spare form** still EGP-primary for price entry (USD derived).
6. **Invalid engine IDs** are stripped on spare create/update via `filterValidEngineIds` against the live engines store.

---

## E. Compliance (honest)

| Requirement class | Verdict |
|---|---|
| Spare ↔ CatalogItem relationship | Implemented & verified (frontend local) |
| Shared UoM / country / manufacturer options | Implemented & verified within const/list architecture |
| Supplier links both directions | Implemented & verified via item-suppliers |
| Engine compatibility live reverse | Implemented & verified against spare store |
| Live warehouse inventing on create | **Not done** (correct) — display prefers balances when present |
| Dynamic category management screen → spare form | **Not applicable / not implemented** — no category store in product |
| Full annex ERP integration / server | **Not implemented** |
