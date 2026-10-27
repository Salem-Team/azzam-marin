# Spare Parts Module — Frontend Implementation

> **Route:** `/spare-parts` · **Detail:** `/spare-parts/[id]`  
> **Status:** PARTIAL — specialized CRUD + browser persistence verified; live warehouse / server APIs still open  
> **Audit date:** 2026-10-26  
> **Scope:** Frontend only — no API, Prisma, or server auth

---

## 1. Executive summary

Spare Parts is a **specialized catalog view** over `SparePartRecord` rows that reference the canonical Items spine (`CatalogItem` via `itemId`). It is **not** a second products database.

Create / edit / delete are functional:

1. Validate via `validateSparePartForm` (scoped steps).
2. `createSparePart` → `createItem` (`itemType: spare_part`) + specialized `SparePartRecord`.
3. Persist via `azzam-marine:spare-parts:v1` localStorage (+ items-store key for the spine).
4. Directory / KPIs refresh through `useSpareParts` + `useItems`.
5. Edit updates the same IDs (no duplicate spine).
6. Delete removes the spare and cascades the linked `spare_part` item.

**Persistence limitation (honest):** browser-local only. No multi-user sync or server durability.

---

## 2. Domain relationship (must preserve)

| Layer | Source of truth |
|-------|-----------------|
| Item master (names, SKU, prices, status, demo qty, image) | `CatalogItem` via `items-store` |
| Spare specialization (OEM/PN/MPN, part category, engine compat, alternatives, cross-ref) | `spare-parts-store` (seeded from `SPARE_PARTS`, key `azzam-marine:spare-parts:v1`) |
| Engines for compat | Seed `MARINE_ENGINES` for selection; live reverse via `sparePartsCompatibleWithEngine` |
| Per-warehouse qty | `inventory-stock-store` when rows exist for `itemId` — badges/filters prefer WH sum; **not** invented on create |
| FX on create | `exchange-rates-store` `getRateAsOf` (fallback 48.5) |
| Cross-system map | `docs/SPARE_PARTS_CROSS_SYSTEM_INTEGRATION.md` |

---

## 3. Create form (wizard)

5 steps (same `WizardStepper` pattern as suppliers/items): Identity → Classification → Pricing & stock → Compatibility → Review.

Supported fields (model-backed):

| Field | Stored on |
|-------|-----------|
| itemCode, nameEn/Ar, description, manufacturer, country, UoM, minStock, sell/cost EGP, status, relatedEngineType | `CatalogItem` |
| partNumber, oemNumber, manufacturerPartNumber, partCategory, compatibleEngineIds, alternativePartIds, crossReferenceCodes | `SparePartRecord` |

Uniqueness: part number case-insensitive among spare records; item code among catalog items.

Import remains explicitly unavailable (no inventing CSV success).

---

## 4. Verification evidence (2026-10-26)

Automated:

- `npx tsx --test src/lib/spare-parts-integration.test.ts` (13 cross-system cases)
- `npx tsx --test src/lib/spare-parts-store.test.ts src/lib/spare-parts/spare-part-validation.test.ts src/lib/catalog-query.spares.test.ts`
- Full `npm test` (includes items-store + item-suppliers regression)
- `npm run typecheck` / `npm run lint` / `npm run build`

Covered store behaviours: create+link, persist write, duplicate PN/code, edit without second item, missing-item, persist-failure rollback, refresh/rehydrate, search via `filterSpareParts`, delete cascade.

Manual UI (browser, 2026-10-26): create wizard → success “تم” → directory KPI 8 + card “قطعة تحقق QA”; search `PN-QA-VERIFY-01` → 1 result; detail `/spare-parts/sp-008` after hydrate; hard refresh retains `azzam-marine:spare-parts:v1` + items spine (brief seed flash until `setTimeout` hydrate). Warehouse tab honest empty (no fabricated WH rows). Import stays unavailable.

---

## 5. Annex coverage (honest)

| Area | Status |
|------|--------|
| Specialized spare create/persist | PARTIAL — browser localStorage CRUD |
| TA-03 spine fields via linked item | PARTIAL — local persist |
| Search name/code/PN/OEM | PARTIAL — client set + local creates |
| Engine compat / alternatives / cross-ref | PARTIAL — editable demo links |
| Live per-warehouse stock | NOT claimed — show `inventory-stock-store` rows when present; else demo `qtyOnHand` / empty |
| Import | OMITTED / unavailable dialog |
| Server / multi-user | NOT_IMPLEMENTED |

---

## 6. Remaining gaps

1. Live warehouse balances + inventory APIs.
2. Server persistence / authz.
3. Deeper TA-36 cross-reference product workflows.
4. Optional seed images for spare spines.
