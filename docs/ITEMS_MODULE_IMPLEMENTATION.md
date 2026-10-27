# Items Module — Frontend Implementation

> **Route:** `/items` · **Detail:** `/items/[itemCode]`  
> **Status:** ACCEPTED WITH DOCUMENTED BACKEND GAPS — **ITEMS FRONTEND CLOSED**  
> **Audit date:** 2026-10-26 (final closure pass — integrity fixes + full QA re-run)  
> **Scope:** Frontend only — no API, Prisma, or server auth

---

## 1. Executive summary

The Items (الأصناف) module is a working frontend item master with:

- Directory (KPI strip, search, filters, sort, pagination, add/edit, bulk status, CSV export).
- Full details route with tabs (overview, basic, identity, pricing, inventory honesty, suppliers, attachments, local activity).
- Create / edit wizard with validation, duplicate-code prevention, unsaved-change confirm; optional create-time image + related engine type. Classification fields (`itemType` / `mainCategory` / `subCategory*`) are **omitted from the wizard** (annex §3.1); create uses silent neutral defaults; details still display stored values. Dedicated classification editing UI is a later improvement.
- Status activate/deactivate with confirmation (history preserved); bulk activate/deactivate on selection.
- Primary item image via IndexedDB (`idb:item-image` marker); general documents remain backend-blocked.
- Pricing fields + local price-history snapshots (no invented FX / auto-reprice).
- Item↔supplier many-to-many links (shared store with Suppliers).
- Clear boundaries vs Spare Parts, Marine Engines, and Inventory.

Persistence uses `localStorage` (`azzam-marine:items:v1`) for master records and IndexedDB for image blobs. This is **not** multi-user production storage.

---

## 2. Routes

| Route | Role |
|-------|------|
| `/items` | Items directory |
| `/items/[itemCode]` | Item details (correct record by code; unknown → not found) |
| `/spare-parts`, `/marine-engines` | Separate modules (not duplicated here) |
| `/products*` | Legacy redirects into catalog routes |
| `/warehouses` | Inventory module link target from Items inventory tab |

---

## 3. Components & data layer

| Area | Path |
|------|------|
| Directory | `src/components/items/items-directory.tsx` |
| Table | `src/components/items/items-table.tsx` |
| Filters dialog | `src/components/items/item-filters-dialog.tsx` |
| Create/Edit wizard | `src/components/items/item-create-drawer.tsx` |
| Details | `src/components/items/item-details-view.tsx` |
| Item↔supplier panel | `src/components/items/item-suppliers-panel.tsx` |
| Status dialog | `src/components/items/item-status-dialog.tsx` |
| Store | `src/lib/items-store.ts` |
| Link store | `src/lib/item-suppliers-store.ts` |
| Persist | `src/lib/items/item-persist.ts` |
| Link persist | `src/lib/item-suppliers/item-supplier-persist.ts` |
| Validation | `src/lib/items/item-validation.ts` |
| Link validation | `src/lib/item-suppliers/item-supplier-validation.ts` |
| Query | `src/lib/catalog-query.ts` |
| Seed | `src/config/mock-catalog.ts` |
| Types | `src/types/catalog.ts`, `src/types/item-supplier.ts` |
| i18n | `src/i18n/catalog.ts` |

Canonical identity: `CatalogItem.id` + `itemCode` (SKU). Specialized spare/engine records reference `itemId`.

---

## 4. Directory functionality

- Title: الأصناف / Items; breadcrumbs via shell.
- DateRangeFilter optional (default = all dates; period filters `updatedAt` when set) — aligned with suppliers/spare-parts directories so master catalog rows are not hidden by “this month”.
- Search: name, item code, part number, OEM, related engine type, barcode, linked engine serial (when present).
- Filters: type (incl. `uncategorized` distinct from `other_materials`), category, manufacturer (form list ∪ catalog), origin (`WorldCountrySelect` same as create form), status, UoM, stock level vs min, price range EGP (invalid bounds match nothing).
- Sort: code / name / recently updated.
- Pagination: 10 / 25 / 50.
- Table columns: image, name, SKU, category, part, OEM, type, manufacturer, origin, UoM, cost USD, sell EGP, min stock, status.
- Row → `/items/[itemCode]`; row actions view/edit.
- Selection + bulk activate/deactivate (confirmed); selection is not decorative.
- Export CSV: browser download of filtered (or selected) rows via `exportItemsCsv` — not server export.
- Import: honest unavailable dialog (requires backend sync).

---

## 5. Details page (reference UI)

Route: `/items/[itemCode]` · Component: `src/components/items/item-details-view.tsx`

### Header (matches reference structure)

- Back to items list
- Product image gallery (real `imageSrc` or placeholder; no fabricated product photos)
- Type badge, bilingual title, status, SKU chip
- Meta grid: manufacturer, origin (+ flag), category, subcategory, UoM
- Actions: Edit, Activate/Deactivate, Actions menu
- KPI cards: demo available qty + min-stock threshold (demo qty labeled)

### Tabs (8)

1. **Overview** — description (AR/EN when present), honest empty features/usage, quick info, pricing with EGP/USD toggle, inventory mini-cards (reserved/total = unavailable `—`), linked-suppliers preview (real relationships)  
2. **Basic data** — full master field list  
3. **Identification & units** — SKU / barcode / part / OEM / serial flag / UoM  
4. **Pricing** — full pricing fields + local price-history table when entries exist  
5. **Inventory** — available (demo) / total & reserved unavailable / min threshold; link `/warehouses`  
6. **Suppliers** — live item↔supplier links (add / edit / remove / view supplier) — see §5a  
7. **Files & images** — primary image choose/replace/remove (IndexedDB); general docs honestly unavailable  
8. **Activity log** — local browser activity only (not TA-34 server audit)

Edit opens the existing item wizard against `items-store`.

### 5a. Item ↔ Supplier relationship (frontend)

Many-to-many links between existing catalog items and existing supplier master records.

| Concern | Implementation |
|---------|----------------|
| Model | `ItemSupplierLink` in `src/types/item-supplier.ts` |
| Store | `src/lib/item-suppliers-store.ts` (shared by Items + Suppliers) |
| Persist | `azzam-marine:item-suppliers:v1` via `item-supplier-persist.ts` |
| Validation | `item-supplier-validation.ts` + store hard checks |
| Item UI | `ItemSuppliersPanel` / overview card on item details |
| Supplier UI | `SupplierRelatedItemsPanel` tab on supplier details |

**Identity:** every link stores `itemId` + `supplierId` (stable IDs). Display names resolve from the Suppliers / Items stores — renaming a supplier does not break links.

**Supported link fields:** `supplierItemCode`, `purchasePrice` + explicit `currency` (USD|EGP), `leadTimeDays`, `minimumOrderQuantity`, `notes`, `status` (active|inactive), timestamps.

**Integrity rules (enforced):**

1. Item and supplier must exist.
2. No duplicate **active** pair for the same item+supplier.
3. New links require an **active** supplier; historical links to deactivated suppliers are preserved.
4. Removing a link deletes only the relationship — not the item, not the supplier, not demo financial history.
5. Supplier purchase price is **not** written into item master cost/sell; no PO/payment/balance side effects.

**Add Supplier flow:** searchable selector over the existing Suppliers catalog (name / code / country / contact fields). Does **not** create a new supplier master.

**Create-item wizard:** suppliers are linked from the Item Details Suppliers tab after the item exists (keeps create simple).

---

## 6. Create / Edit / Status

- 5-step wizard (basic → identity → inventory threshold → pricing → review).
- Required: code, AR/EN names, manufacturer, origin, UoM, min stock.
- Duplicate `ITM-*` code blocked.
- Numeric/currency validation (non-negative).
- Unsaved discard confirm; submit loading; success panel with open-details.
- Edit prepopulates; preserves `qtyOnHand` / `imageSrc` / history unless pricing changes.
- Pricing edits append local `priceHistory` entry (manual reason).
- Deactivate/activate confirms; does not erase master data or history.

---

## 7. Pricing UI (annex §27–31 scope)

| Capability | Status |
|------------|--------|
| USD/EGP cost & sell fields | Implemented (stored as entered) |
| Target margin | Implemented (stored) |
| Exchange rate + source | Implemented (stored; **no auto recalc**) |
| Price history (local) | PARTIAL — client snapshots only |
| FX management / bank feeds | BLOCKED / not in frontend |
| Automatic repricing | NOT implemented (documented) |
| Bulk / category / brand price updates | NOT implemented |
| Price exclusions | NOT implemented |

---

## 8. Persistence & limitations

- Items key: `azzam-marine:items:v1`
- Item↔supplier links key: `azzam-marine:item-suppliers:v1`
- Hydration via `useSyncExternalStore` (SSR empty/seed → client store).
- Survives refresh in the same browser.
- Not shared across users/devices; not an inventory ledger; not multi-user sync.
- Primary image: IndexedDB (`azzam-marine-item-images`) + `imageSrc = idb:item-image` marker; public paths still supported.
- General multi-document attachments: unavailable (backend storage).
- CSV export is browser-local only (no server sync).
- Linking does **not** create purchase orders, goods receipts, payments, or landed-cost allocations.

---

## 9. Localization & responsive

- EN/AR dictionaries in `src/i18n/catalog.ts`; RTL/LTR via locale provider + logical CSS.
- Responsive patterns: desktop table, mobile cards, horizontal tabs scroll, wizard dialog.

### Viewport QA (browser, executed 2026-10-22)

Script: `scripts/qa-items-crud.mjs` (overflowX check + screenshots under `docs/qa/items-crud/`).

| Viewport | Status | Notes |
|----------|--------|-------|
| 1920×1080 | PASS | No document overflowX on `/items/ITM-0001` |
| 1440×900 | PASS | Primary CRUD audit viewport |
| 1280×800 | PASS | No overflowX |
| 1024×768 | PASS | No overflowX |
| 768×1024 | PASS | No overflowX |
| 430×932 | PASS | No overflowX |
| 390×844 | PASS | No overflowX |
| 360×800 | PASS | No overflowX |

RTL: Arabic `document.documentElement.dir === "rtl"` **PASS** (fresh browser context).

---

## 10. Tests & automated checks (executed 2026-10-26 final closure)

| Command | Result |
|---------|--------|
| `npm test` | **PASS** — **120** tests / 22 suites |
| `npm run lint` | **PASS** (0 errors) |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `node scripts/qa-items-crud.mjs` | **32/32 PASS** |
| `node scripts/qa-item-supplier-links.mjs` | **8/8 PASS** |
| `node scripts/qa-items-hydration.mjs` | **13/13 PASS** |
| Ad-hoc filter browser check | **5/5 PASS** — `uncategorized` ≠ KPI/filter `other_materials` |

Unit coverage includes: create/edit, **uncategorized defaults**, empty-catalog rehydrate (no re-seed), duplicate code, validation, rehydrate, cross-item isolation, deactivate, bulk status, price history, no-op edit, persist rollback, search identifiers, filter/sort/pagination, **invalid price bounds**, CSV export + uncategorized CSV, image validation, imageSrc preservation, **item↔supplier link CRUD**.

---

## 11. Cross-module boundaries

| Module | Items responsibility |
|--------|----------------------|
| Spare Parts | Link only when `sparePartsForItem` exists; no OEM/compat CRUD here |
| Marine Engines | Link when `itemId` match; no HP/serial engine ops here |
| Inventory | Min-stock + demo qty; live balances unavailable; link `/warehouses` |
| Suppliers | Relationship links via shared `item-suppliers-store`; supplier master remains authoritative |
| Purchasing / Pricing admin | Not implemented — link price ≠ PO / landed cost |

---

## 12. Backend-dependent (BLOCKED for production)

- Multi-user item master API, general document DMS, warehouse balances, reserved qty, server audit log (TA-34), FX engine, bulk repricing, CSV import sync, 100k-scale search. Primary image is browser-local only.

---

## 13. Defects fixed in acceptance hardening

### 2026-10-22

| Defect | Fix |
|--------|-----|
| Annex related engine type only via engine-record link | Optional `relatedEngineType` on item master + form/details/search |
| Attachments tab claimed upload unavailable for primary image | IndexedDB primary image choose/replace/remove + create-wizard optional image |
| Unrelated edits risked image loss (contract) | Regression test: `imageSrc` preserved when master fields change |
| Default `thisMonth` hid older catalog rows | Period defaults to all dates (prior pass) |
| Decorative selection / fake export / missing columns | Bulk status, CSV export, part/OEM/cost columns (prior pass) |

### 2026-10-26 final closure

| Defect | Fix |
|--------|-----|
| New creates defaulted into `other_materials` / KPI «Other materials» | Silent `uncategorized` defaults; KPI/filters/CSV separate |
| Empty catalog re-seeded seed data on reload | `loadItemsFromStorage` returns `[]`; hydrate respects empty |
| Create succeeded then image failure → stuck with saveError + duplicate on retry | Partial success UI + attachments remediation message |
| `deleteItem` left orphan supplier links / images | Store cascades `removeLinksForItem` + image blob removal |
| Invalid EGP price filter silently ignored | Non-finite bounds match no rows |
| Origin filter listed only seed countries | `WorldCountrySelect` (same as form) with All |
| Manufacturer filter not aligned with form options | Shared `ITEM_MANUFACTURERS` ∪ catalog data |
| `updateItemSupplierLink` missing-id threw `unknown-item` | Distinct `unknown-link` code + i18n |
| Multiple engine serials per item | Search concatenates all linked serials |

---

## 14. Browser CRUD evidence (`docs/qa/items-crud/report.json`)

Executed against `http://127.0.0.1:3456` on **2026-10-26** (final closure re-verify):

| Workflow | Result |
|----------|--------|
| Create validation blocks empty required | PASS |
| Create valid → directory/details | PASS |
| Details persist after refresh | PASS |
| Unknown code not-found | PASS |
| Auto SKU / duplicate prevention | PASS |
| Search code + barcode + OEM + part + related engine type | PASS |
| Attachments tab image actions present | PASS |
| Export CSV download | PASS |
| Status filter | PASS |
| Eight details tabs | PASS |
| Edit persist after refresh | PASS |
| Cancel edit | PASS |
| Deactivate cancel + confirm | PASS |
| AR rtl | PASS |
| Viewports overflow (8 sizes) | PASS |
| React #418 hydration (see §14a) | PASS — 13/13 `qa-items-hydration.mjs` |

| Suite | Result (2026-10-26 re-run after integrity fixes) |
|-------|--------|
| `npm test` | **120/120** |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `node scripts/qa-items-crud.mjs` | 32/32 |
| `node scripts/qa-item-supplier-links.mjs` | 8/8 |
| `node scripts/qa-items-hydration.mjs` | 13/13 |
| Filter uncategorized vs other (Playwright ad-hoc) | 5/5 |

---

## 14a. React #418 hydration defect (resolved)

### Symptom
Intermittent minified React error **#418** (text hydration mismatch) on `/items` after some loads — especially Arabic `localStorage` without a matching request cookie, and sometimes AR cookie SSR after a prior EN request on the same Node process.

### Verified root cause (dev unminified stack)
Mismatch was in `AppShell` / `LocaleProvider` tree:

- Server HTML: `dir="ltr"` / `lang="en"` / English chrome (`aria-label`, logo `alt`, …)
- Client hydrate: `dir="rtl"` / `lang="ar"` / Arabic chrome

Two cooperating bugs:

1. **`PreferencesHydrator` `useLayoutEffect`** re-seeded the preference store from `localStorage` and **mutated `serverSeed`** before nested client islands finished hydrating. Late `get*ServerSnapshot` calls then returned Arabic while SSR HTML was English.
2. **Freezing `serverSeed` on the server** (shared module across requests) could leave a prior EN seed in place while a later AR-cookie request rendered AR props — SSR snapshots disagreed with the request.

Items/catalog stores using `queueMicrotask` to flip `hydrated` could also race hydration; deferred to `setTimeout(0)`.

### Fix (no suppressHydrationWarning blanket; SSR kept)
| File | Change |
|------|--------|
| `src/lib/preference-store.ts` | Gate localStorage reads until after mount; **freeze `serverSeed` only on the client**; `adoptClientPreferences()` updates client memory without touching SSR snapshots |
| `src/providers/preferences-hydrator.tsx` | Sync storage in **`useEffect`** (not layout); call `adoptClientPreferences` instead of re-seeding SSR snapshot |
| `src/lib/items-store.ts` / `item-suppliers-store.ts` / `suppliers-store.ts` | Hydrate via macrotask; stable server items snapshot |
| `scripts/qa-items-*.mjs` | Set preference **context cookies** so SSR locale matches storage |
| `scripts/qa-items-hydration.mjs` | Regression suite for #418 scenarios |

### Evidence
Before fix: `cold /items AR storage, no request cookie` → #418; after wrong freeze, `AR cookie+storage` also #418.  
After fix (2026-10-22): 8/8 PASS.  
**Closure re-verify (2026-10-26):** `docs/qa/items-hydration/report.json` → **13/13 PASS**, covering:

1. Cold `/items` (EN, AR cookie, AR storage without cookie)  
2. Create → details → directory  
3. Edit → save → directory  
4. Cancel edit  
5. Deactivate → directory  
6. Details with image + attachments controls + refresh  
7. Item ↔ supplier details navigation  
8. Directory ↔ details ×5  
9. AR refresh after load  

No `#418` / hydration text mismatch in console across these scenarios.

---

## 15. Acceptance verdict

**ACCEPTED WITH DOCUMENTED BACKEND GAPS** — Items frontend module **formally closed**:

- Mandatory Items frontend workflows (CRUD, search/filter/sort/pagination, details, pricing fields, min stock, status, primary image, item↔supplier links, uncategorized vs other) implemented and re-verified on **2026-10-26** after integrity fixes.
- React #418 preference/hydration race fixed at root cause (hydration QA 13/13).
- **Backend gaps (not FE-completeable):** multi-user item master API, warehouse live balances, general document DMS, CSV import sync, FX/auto-reprice engines, TA-34 server audit, TA-03-02-07 100k-scale search, purchasing side-effects from links.
- No further Items-scope frontend work remains without backend or out-of-module Change Requests. Do not start another module under the Items closure task.
