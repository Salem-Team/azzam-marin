# AZZAM MARINE ERP — Inventory & Warehouse Technical Annex Compliance Audit

> **Audit date:** 2026-10-27  
> **Mode:** Audit-only (no application source/config/test changes)  
> **Contract:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) § إدارة المخازن والمخزون (and related integrations)  
> **Prior status docs (stale in places):** [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md), [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md)  
> **Scope constraint:** Frontend-only browser persistence. No backend, Prisma, API routes, or server authz exist. Do not treat FE completion as production PASS.
>
> **Follow-up:** Phase 1 ledger SoT + hardening completed 2026-10-27 — see [`INVENTORY_LEDGER_PHASE1.md`](./INVENTORY_LEDGER_PHASE1.md). This audit remains the pre-Phase-1 evidence baseline; statuses for TA-05-03…07/10/11/14 were updated in the matrix/traceability after Phase 1 verification.

---

## Executive summary

**Overall state:** Inventory & Warehouse is a **partial frontend ledger**, not a finished annex module. A real browser-persisted stock store (`inventory-stock-store`) and warehouse master (`warehouses-store`) exist and are wired to goods receipts, adjustments, transfers, movements list, low-stock derivation, and spare-parts display helpers. Stocktaking and inventory reports remain **placeholders**. Sales invoices/returns, import cost allocation, barcode device workflows, RBAC enforcement, and inventory valuation reports are **missing or disconnected**.

**Main risks**

1. **Dual quantity sources of truth** — `CatalogItem.qtyOnHand` (seed/demo) vs warehouse balances in `azzam-marine:warehouse-stock:v1`. Items detail still shows demo `qtyOnHand`; spares/low-stock prefer warehouse sums when any balance row exists. Screens can disagree for the same item.
2. **Incomplete operational cycle** — receive/adjust/transfer work; dedicated sales-linked issue, returns restock, stocktaking (periodic/surprise), and formal inventory reports do not.
3. **Traceability gaps** — goods receipts stamp `referenceId: "pending"`; `issueStock` / transfers do not write client activity; transfer movements omit `toWarehouseId` on records.
4. **Stale compliance docs** — `REQUIREMENTS_TRACEABILITY.md` still marks warehouses/transfers/adjustments as placeholders; code and browser evidence contradict that (matrix also lags for TA-05-05…11, TA-05-14).
5. **No production claims** — localStorage, mock permissions (`MOCK_USER_PERMISSIONS = null`), no concurrency/load evidence for 100k items / 20 users / &lt;2s search.

**Readiness for implementation completion:** Architecture is **worth preserving and extending**, not replacing. Prefer completing the existing `warehouses-store` + `inventory-stock-store` ledger, unifying quantity display, then stocktaking + reports + sales/returns hooks — **not** inventing a second stock subsystem. Correct dual-SoT and audit/reference gaps before claiming annex acceptance.

**Verdict:** Ready for a **precise completion prompt** that reuses current stores; **not** ready for annex acceptance or production inventory claims.

---

## Requirements compliance matrix

Status legend used in this audit:

| Status | Meaning |
|--------|---------|
| **PASS — VERIFIED** | Implemented + meaningful automated or browser execution evidence |
| **PARTIAL** | Important behavior exists; annex-critical pieces missing |
| **UI ONLY** | Screen/control without verified business operation |
| **NOT IMPLEMENTED** | No implementation after adequate inspection |
| **UNVERIFIED** | Appears present; evidence insufficient for PASS |
| **NOT APPLICABLE** | Justified by annex/architecture (used sparingly) |

### A. Warehouses and balances

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| §5 multi-WH / TA-05-01 / TA-AC-07 | Multiple independent warehouses | **PARTIAL** | `src/lib/warehouses-store.ts`, `src/config/mock-warehouses.ts`, `src/components/warehouses/warehouses-directory.tsx`, `/warehouses` | CRUD create/edit; 4 seeded WH; localStorage `azzam-marine:warehouses:v1`; list shows per-WH qty sum | Unit: `warehouses-store.test.ts` (create, duplicate code). Browser AR 2026-10-27: 4 WH listed | No detail route; no server multi-user; inactive WH still receivable by stock APIs | Deepen WH detail; block stock ops on inactive WH |
| §5 examples / TA-05-02 | WH kinds (main/new/used/engines) | **PARTIAL** | `src/types/warehouse.ts` `WarehouseKind`, seed kinds | Enum + i18n + form select | Browser: kinds visible on directory | Illustrative taxonomy only; no ops rules by kind | Keep kinds; optional kind-based defaults later |
| §5 balance / TA-05-11 | Qty per item per warehouse | **PARTIAL** | `WarehouseStockBalance`, `getStockQty`, spare `WarehouseStockCard`, WH directory aggregate | Per-(warehouseId,itemId) balances; spare detail filters by item | Browser: after adjust, WH-MAIN showed `15 (1)`; localStorage balance row confirmed | No dedicated balance matrix UI; Items detail ignores balances | Unify Items UI on warehouse SoT; optional WH stock drill-down |
| Total across WH | Sum of warehouse qtys | **PARTIAL** | `sumStockQtyForItem` | Sum when any balance rows exist; else `null` → callers fall back to `qtyOnHand` | Integration tests (spare/cross-system/engines) | Fallback creates dual SoT confusion | Prefer explicit “no ledger yet” vs silent demo qty |
| Valuation / cost methodology | Value stock by cost method | **NOT IMPLEMENTED** | — (costs on `CatalogItem.costUsd/costEgp` only) | No FIFO/AVG/landed × qty valuation | Code search: no inventory valuation helper/report | Annex reports require current inventory value | Define FE cost rule (e.g. costEgp/costUsd × on-hand) then report |
| Inactive WH / items | Correct handling | **PARTIAL** | Adjustments/transfers filter `status === "active"` for selects; `receiveStock` only checks WH exists | UI filters active WH; store accepts inactive WH id if known | Code inspection | Inactive item can still receive; inactive WH not blocked in store | Validate status in store mutations |

### B. Receiving and stock additions

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Add stock / TA-05-03 | Record stock additions | **PARTIAL** | `receiveStock`, `/stock-adjustments` (direction in) | Increases balance + movement (`receipt` or `adjustment`) | Browser: +15 via adjustments → persisted | No dedicated “Add stock” nav; uses adjustment form | Optional dedicated receive UI or keep adjust as add |
| Goods receipt / TA-05-04 | Receipt of goods | **PARTIAL** | `goods-receipts-store.ts`, `/goods-receipts`, GR directory | PO status gate; outstanding qty; `receiveStock` per line; updates PO received qty | Unit: receipt updates stock+PO; rejects over-receipt | `referenceId: "pending"` never patched to GR id; no ACID rollback | Patch reference after GR create; browser QA GR path |
| Validation | Item/WH/qty/refs | **PARTIAL** | `StockError`, `GoodsReceiptError` | Unknown WH/item, invalid qty, over-receipt, PO not receivable | Unit + code | No inactive checks; empty WH/item on adjust relies on throw | Harden form required + inactive |
| Link to PO/import | Connect receipts | **PARTIAL** | GR → PO; import shipments/costs pages placeholder | GR linked to PO only | Code | Import shipments/landed cost not connected to stock | After import module; do not fake |
| Duplicate receipts | Avoid double stock | **PARTIAL** | Outstanding qty only | Prevents over-PO qty; same partial can be posted repeatedly within outstanding | Unit over-receipt | No idempotency / duplicate GR guard | Consider GR uniqueness / posting flags |

### C. Stock issue

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Stock issue / TA-05-05 / TA-AC-08 | Record issues | **PARTIAL** | `issueStock`; adjustments direction out | Decrements with optional `allowNegative`; default insufficient-stock error | Code path; no dedicated unit test for issue alone | No dedicated Issue UI; sales invoices placeholder — no sales-linked issue | Dedicated issue form and/or sales hook |
| Validate available qty | Prevent oversell from WH | **PARTIAL** | `issueStock` | Throws `insufficient-stock` unless `allowNegative` | Code | Sales not wired | Keep rule; add tests |
| Update correct WH | | **PARTIAL** | `issueStock(warehouseId,…)` | Updates that WH balance | Code | — | Preserve |
| Sales-linked issues | | **NOT IMPLEMENTED** | `/sales-invoices` ModulePlaceholder | No `issueStock` from sales | Grep + route | Annex sales cycle incomplete | Implement with sales module |
| Reason / ref / history | | **PARTIAL** | `StockMovement` fields; movements list | Reason optional; type/qty/WH/item/date | Browser movements row for adjustment | Issue path skips `logClientActivity` | Log issue/transfer activity |

### D. Warehouse transfers

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Transfers / TA-05-06 / TA-AC-08 | Inter-WH transfer | **PARTIAL** | `transferStock`, `/stock-transfers` | issue out + receive in; rejects same WH; insufficient stock | Code + UI form + history of `transfer_out` | No dedicated `inventory-stock-store` unit tests; browser transfer not re-run this audit (adjust path verified) | Add unit tests; browser transfer QA |
| Valid src/dest | | **PARTIAL** | Active WH selects; store validates WH exists | | | Inactive WH possible via API | Store status checks |
| Same-WH prevent | | **PASS — VERIFIED** (store) | `same-warehouse` StockError | Throws before mutate | Code inspection | UI does not pre-validate same WH | Optional UI disable |
| Qty / insufficient | | **PARTIAL** | Shows available qty; store throws | | | | Add tests |
| Deduct + add; total conserved | | **PARTIAL** | Sequential issue+receive | Logic conserves total if both succeed | Code | Partial failure window (no transaction) if receive fails after issue | Single atomic mutate helper |
| Duplicate processing | | **UNVERIFIED** | — | No idempotency | — | Double-submit risk | Disable submit / keys |
| Traceable history | | **PARTIAL** | Two movements; `toWarehouseId` unused on write | History shows from WH on `transfer_out` only | Code | Destination not on out row; transfer report incomplete | Set `toWarehouseId`; show dest column |

### E. Adjustments and stocktaking

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Adjustments / TA-05-07 | Inventory adjustments | **PARTIAL** | `/stock-adjustments` | In/out via receive/issue with type `adjustment` | **Browser verified** 2026-10-27: +15 ITM-0001 → WH balance + movement | Minimal form; no approval workflow | Keep; add approval only if annex RBAC requires |
| Periodic stocktaking / TA-05-08 / TA-AC-09 | | **NOT IMPLEMENTED** | `/stocktaking` → `ModulePlaceholder` | Shell only | Browser: “مساحة عمل الوحدة” | Critical acceptance gap | Implement count sessions → variance → adjust |
| Surprise stocktaking / TA-05-09 | | **NOT IMPLEMENTED** | same | No type distinction | Browser placeholder | Same as periodic | Model `kind: periodic \| surprise` |
| Counted qty / differences | | **NOT IMPLEMENTED** | — | — | — | — | Count lines + variance |
| Authorized approval | | **NOT IMPLEMENTED** | Permissions mock null | Nav keys exist; no enforcement | `permissions.ts` | FE-only disclose | Persona stubs later; no server claim |
| Auditability of qty changes | | **PARTIAL** | Movements + receive activity only | Adjustment movement persisted | Browser + localStorage | Incomplete activity coverage | Log all stock mutations |

### F. Inventory movement history

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Movement history / TA-05-10 | Traceable movements | **PARTIAL** | `StockMovement`, `/stock-movements`, spare MovementsCard | List with date/type/WH/item/qty/reason; DateRangeFilter | Browser: adjustment row 27 Oct 2026 4:01 PM | Type shown as English enum; GR ref pending | Improve labels; fix refs |
| Fields completeness | Item, WH, qty, type, date, ref | **PARTIAL** | Interface has refs | Used inconsistently | Code | `toWarehouseId` unused | Complete fields |
| Consistent across Inventory / Item / Spare | | **PARTIAL** | Spare filters by item; Items detail uses demo qty | Spare inventory tab wired | Code | Items module inconsistent | Wire Items to same helpers |
| No fabricated history | | **PARTIAL** | Empty until ops; dashboard inventory donut still mock | Stock list honest when empty | Browser empty→then row | Dashboard `InventoryStatusCard` still mock | Replace mock chart or label as demo |

### G. Inventory reports

| Annex / ID | Requirement | Status | Files | Existing behavior | Evidence | Gap / risk | Next action |
|------------|-------------|--------|-------|-------------------|----------|------------|-------------|
| Qty per item / TA-05-12 | | **NOT IMPLEMENTED** | `/reports/inventory` placeholder | — | Browser placeholder | — | Report from balances + catalog |
| Inventory value / TA-05-13 | | **NOT IMPLEMENTED** | Dashboard KPI mock `inventory-value` | Mock only | `mock-dashboard.ts` | Misleading if treated as live | Live value or honest mock label |
| Low stock / TA-05-14 | | **PARTIAL** | `listLowStockRows`, `/low-stock`, dashboard table | Derived from minStock + effective on-hand | Unit Workflow D; UI live (not static mock) | Traceability still says “static mock” — **stale** | Keep helper; add DateRange only if meaningful |
| Slow / stagnant / TA-05-15 | | **NOT IMPLEMENTED** | — | Needs movement velocity over time | — | Needs sales or issue history volume | After sales or movement aging rules |
| Best-selling / TA-05-16 | | **NOT IMPLEMENTED** | Sales reports placeholder | — | — | Depends on sales | With sales invoices |
| Fast-moving / TA-05-17 | | **NOT IMPLEMENTED** | — | — | — | Same | Same |
| Stock movement reports / TA-05-18 | | **PARTIAL** | `/stock-movements` operational list | Not a formal report module | Browser | Report page still placeholder | Either promote movements UI or build report |
| Transfer reports / TA-05-19 | | **PARTIAL** | Transfers history table | Operational, not report | Code | Destination column weak | Enrich transfers + report page |
| TA-11-04 inventory reports bundle | | **NOT IMPLEMENTED** | `/reports/inventory` | Placeholder | Browser | — | Build from ledger |

### H. Integration with other modules

| # | Module | Status | Source → operation → effect | Evidence |
|---|--------|--------|-----------------------------|----------|
| 1 | Items | **PARTIAL** | Catalog spine `items-store`; stock validates `getItemById`; **display** still `qtyOnHand` on item details | Code; dual SoT risk |
| 2 | Spare Parts | **PARTIAL** | `effectiveSpareOnHandQty` / badges / detail WH+movements prefer warehouse sum | Integration tests PASS; UI wired |
| 3 | Marine Engines | **PARTIAL** | Engine-linked spares use `effectiveSpareOnHandQty`; sync does not invent stock | `marine-engines-system-integration.test.ts` Workflow D/F |
| 4 | Purchasing / PO | **PARTIAL** | Approved PO → GR → `receiveStock` + PO receivedQty | `goods-receipts-store.test.ts` |
| 5 | Import / landed cost | **NOT IMPLEMENTED** | `/import-costs`, `/import-shipments` placeholders; no cost→stock cost update | Routes |
| 6 | Suppliers | **PARTIAL** | Via PO/GR and item-supplier links; not direct stock | Cross-system tests |
| 7 | Sales invoices / returns | **NOT IMPLEMENTED** | Placeholders; no issue/restock | Routes + grep |
| 8 | Pricing / currency | **PARTIAL** | Item costs/sell exist; not used for inventory valuation | Types |
| 9 | Audit Log | **PARTIAL** | `logClientActivity` on **receive** only; `/audit-log` directory exists for client feed — not full TA-34 | Code; matrix still MISSING for TA-34 broadly |
| 10 | Dashboard / reports | **PARTIAL** | Low-stock live; inventory status donut **mock** | Components |
| 11 | Permissions / roles | **UI ONLY** | Nav `permissionKey`s; `MOCK_USER_PERMISSIONS = null` shows all | `permissions.ts` |
| 12 | Barcode scanner/printer | **PARTIAL** (catalog only) | Item barcode fields + search; hardware settings placeholder | Catalog tests; `/settings/hardware` placeholder |

---

## Data architecture map

### Inventory source of truth (quantities)

| Layer | Storage | Role |
|-------|---------|------|
| **Authoritative FE ledger (when rows exist)** | `localStorage` key `azzam-marine:warehouse-stock:v1` via `src/lib/inventory-stock-store.ts` | `balances[]` + `movements[]` |
| **Fallback / seed display** | `CatalogItem.qtyOnHand` in `items-store` / seed catalog | Used when `sumStockQtyForItem` returns `null` (no balance rows for that item) |
| **Not authoritative** | Dashboard `INVENTORY_STATUS` / inventory-value mocks | Static demo |

**Quantity calculation path**

1. `getStockQty(warehouseId, itemId)` → single balance row or 0.  
2. `sumStockQtyForItem(itemId)` → sum of rows or `null` if none.  
3. Display helpers (`effectiveSpareOnHandQty`, `inventory-low-stock.onHandFor`, `catalog-query.effectiveOnHand`) → warehouse sum if not null, else `qtyOnHand`.  
4. **Conflict:** `item-details-view` uses `item.qtyOnHand` directly (demo), ignoring warehouse ledger even after receipts/adjustments.

### Warehouse source of truth

- `src/lib/warehouses-store.ts` + seed `INITIAL_WAREHOUSES`  
- Persist key: `azzam-marine:warehouses:v1`  
- Types: `src/types/warehouse.ts`

### Movement source of truth

- Same stock store `movements[]`  
- Types: `StockMovement` (`receipt` \| `issue` \| `transfer_out` \| `transfer_in` \| `adjustment`)  
- Written by `receiveStock` / `issueStock` / `transferStock` / GR create

### Persistence mechanism

- Browser `localStorage` only (via `getBrowserLocalStorage` / JSON helpers)  
- Survives reload in same browser profile  
- Not multi-user, not durable server recovery  
- UI copy discloses demo persistence (`ops.demoPersist`)

### Cross-module data flow (implemented)

```
Warehouses master ──┐
Catalog items ──────┼──► inventory-stock-store (balances + movements)
Purchase Orders ──► Goods Receipts ──receiveStock──┘
Adjustments UI ─── receiveStock / issueStock ───────┘
Transfers UI ───── transferStock ───────────────────┘
                         │
                         ├──► /stock-movements, /stock-transfers history
                         ├──► /warehouses aggregate qty
                         ├──► spare details / badges / low-stock / catalog KPIs
                         └──► logClientActivity (receive only)
```

### Conflicting / duplicated sources

| Conflict | Impact |
|----------|--------|
| `qtyOnHand` vs warehouse balances | Items page can show seed qty while spare/low-stock show ledger |
| Dashboard inventory donut mock vs live low-stock | Mixed honesty on dashboard |
| Stale TA docs vs code | Planning risk if agents trust old NOT_IMPLEMENTED rows |

---

## Existing functionality worth preserving

**Do not replace these in the next implementation:**

| Asset | Path / export | Why |
|-------|---------------|-----|
| Warehouse master store | `warehouses-store.ts` — `createWarehouse`, `updateWarehouse`, `setWarehouseStatus`, `useWarehouses`, … | Working CRUD + persist + tests |
| Warehouse types/kinds | `types/warehouse.ts`, `mock-warehouses.ts` | Annex-aligned seed examples |
| Stock ledger | `inventory-stock-store.ts` — `receiveStock`, `issueStock`, `transferStock`, `getStockQty`, `sumStockQtyForItem`, hooks | Core math + persist |
| GR → stock | `goods-receipts-store.createGoodsReceipt` | Real PO receipt posting |
| Adjustments UI | `stock-adjustments-directory.tsx` | Working mutate path (browser verified) |
| Transfers UI | `stock-transfers-directory.tsx` | Form + history + DateRangeFilter |
| Movements UI | `stock-movements-directory.tsx` | Live ledger list |
| Low stock | `inventory-low-stock.ts`, `low-stock-table.tsx`, `/low-stock` | Derived, not static mock |
| Spare display SoT helper | `effectiveSpareOnHandQty` | Shared preference rule |
| Warehouses directory | `warehouses-directory.tsx` | List + modal CRUD + stock aggregate |
| Integration tests | GR, spare, cross-system, marine engines stock workflows | Regression safety net |
| Nav + i18n ops keys | `navigation.ts`, `i18n/ops.ts` stock/warehouse strings | Shell already scoped |
| Demo persistence disclosure | `ops.demoPersist` | Honest FE boundary |

---

## Defects and missing functionality

Ranked by severity (business impact):

### Critical

1. **Stocktaking absent** (`/stocktaking` placeholder) — blocks TA-AC-09 / TA-05-08/09.  
2. **Sales issue / returns restock absent** — annex inventory cycle incomplete; stock will diverge from sales when sales is built if not planned.  
3. **Dual quantity SoT (Items vs warehouse ledger)** — operators can trust wrong number.

### High

4. **Inventory reports module placeholder** — TA-05-12…19 / TA-11-04 largely unmet.  
5. **No inventory valuation** — cannot report current inventory value from cost methodology.  
6. **Import cost allocation disconnected** — landed cost cannot update item cost/stock value.  
7. **GR `referenceId: "pending"`** — weak audit trail for receipts.  
8. **Incomplete client audit for issue/transfer/adjust** — TA-34 stock events incomplete.

### Medium

9. **Transfer movement missing destination field population**; history UX incomplete.  
10. **Inactive WH/item not enforced in store mutations**.  
11. **No `inventory-stock-store` dedicated unit suite** (coverage via GR/integration only).  
12. **Dashboard inventory status still mock** while low-stock is live.  
13. **Compliance/traceability docs stale** — risk of re-implementing existing work.  
14. **Design-system gaps on dense lists:** Import/Export missing on warehouses/stock lists; low-stock lacks DateRangeFilter (product rule; not annex §5).

### Low

15. Movement type labels English enum in AR UI.  
16. Adjustments form minimal (no line grid, no multi-item).  
17. Permissions keys decorative only.

---

## Recommended implementation sequence

Smallest safe sequence (reuse stores; no second ledger):

1. **Unify quantity display** — Items (and any remaining surfaces) use `sumStockQtyForItem` / shared helper; document when fallback to `qtyOnHand` is allowed (or freeze `qtyOnHand` updates and treat ledger as sole SoT once first balance exists).  
2. **Harden ledger** — inactive WH/item guards; set GR `referenceId` to real id; populate `toWarehouseId`; `logClientActivity` on issue/transfer/adjust; atomic transfer helper; unit tests for receive/issue/transfer/insufficient/same-WH.  
3. **Stocktaking MVP** — periodic + surprise sessions, count lines, variance → `receiveStock`/`issueStock` adjustments with references; replace `/stocktaking` placeholder.  
4. **Reports MVP on `/reports/inventory`** — qty per item (by WH + total), low stock (reuse helper), movement/transfer extracts, inventory value = on-hand × documented cost field; DateRangeFilter where period-based.  
5. **Sales/returns hooks** (when sales module is implemented) — invoice confirm → `issueStock`; approved return → `receiveStock` with condition flags; never invent engine sales from spare sales.  
6. **Import cost → item cost** after import allocation exists — update `costUsd`/`costEgp`; valuation follows.  
7. **Refresh** `REQUIREMENTS_TRACEABILITY.md` + compliance matrix TA-05-* to match verified status (separate docs task).  
8. **Defer** backend 100k/RBAC/HTTPS claims; keep FE honest disclosures.

---

## Test plan (for next implementation)

### Automated (extend existing `tsx --test` style)

- `inventory-stock-store`: receive, issue, insufficient, transfer conserve total, same-WH, inactive WH reject, persist/rehydrate.  
- Goods receipt: referenceId equals GR id; partial + full receive; stock + PO sync.  
- Adjustments/transfers: movement types and activity events present.  
- Stocktaking: variance posts correct signed qty; surprise vs periodic metadata.  
- Display helpers: Items and Spares show same on-hand for same itemId after receive.  
- Low stock: threshold with warehouse sum vs fallback.  
- Reports: value = Σ(qty × cost) for fixture set.  
- Regression: keep `goods-receipts-store.test.ts`, spare/cross-system/engines stock workflows green.

### Browser workflows

- EN LTR + AR RTL; desktop + ~390px.  
- Create WH → adjust in → see WH aggregate → movements row → transfer to second WH → totals conserved → adjust out insufficient error.  
- GR against approved PO → stock + PO status.  
- Stocktaking count → post variances → movements show refs.  
- Spare detail WH card matches ledger; Items detail matches after SoT fix.  
- `/reports/inventory` numbers match ledger for fixture.  
- Confirm `/stocktaking` and reports no longer placeholders.  
- Console clean; no silent dual qty.

### Commands already proven green (this audit)

```bash
npx tsx --test \
  src/lib/warehouses-store.test.ts \
  src/lib/goods-receipts-store.test.ts \
  src/lib/spare-parts-integration.test.ts \
  src/lib/cross-system-integration.test.ts \
  src/lib/marine-engines-system-integration.test.ts \
  src/lib/client-activity-store.test.ts
```

Result (2026-10-27): **37 pass / 0 fail**.

---

## Evidence and limitations

### Inspected documentation

- `AGENTS.md`, `docs/PROJECT_COMPLIANCE_RULES.md`  
- `docs/TECHNICAL_ANNEX.md` (§3 items, §5 inventory, §6 purchasing/import, §8–10 sales/finance, performance, security, testing, acceptance, §33 import cost, §34 audit)  
- `docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`, `docs/REQUIREMENTS_TRACEABILITY.md`, `docs/FRONTEND_IMPLEMENTATION_ROADMAP.md`  
- Related: Items / Spare Parts / Marine Engines / Suppliers / Cross-system docs under `docs/`

### Inspected code (primary)

- Stores: `inventory-stock-store.ts`, `warehouses-store.ts`, `goods-receipts-store.ts`, `items-store.ts`, `spare-parts-display.ts`, `inventory-low-stock.ts`, `catalog-query.ts`, `permissions.ts`, `log-client-activity.ts`  
- UI: warehouses, stock-adjustments, stock-transfers, stock-movements, low-stock, stocktaking, reports/inventory, goods-receipts, spare-part-details (stock cards), item-details (demo stock), dashboard inventory/low-stock cards  
- Routes under `src/app/(erp)/` for inventory group + placeholders listed above  
- Types: `types/warehouse.ts`, catalog cost/qty fields  
- Nav: `config/navigation.ts`

### Commands executed

| Command | Result |
|---------|--------|
| Inventory-related `tsx --test` suite (6 files) | 37 passed |
| `curl` `http://127.0.0.1:3456/warehouses` | HTTP 200 |
| Browser CDP `localStorage` read of `azzam-marine:warehouse-stock:v1` | Balance qty 15 + adjustment movement after UI save |

### Browser verification performed (localhost:3456)

| Route | Result |
|-------|--------|
| `/warehouses` (AR) | 4 WH; after adjust WH-MAIN `15 (1)` |
| `/stock-adjustments` | Saved +15 ITM-0001 / wh-main; toast success; form reset |
| `/stock-movements` | Row: adjustment, main WH, qty 15, reason visible, 12h time |
| `/stocktaking` | ModulePlaceholder |
| `/reports/inventory` | ModulePlaceholder |
| Viewport | ~mobile/tablet width observed; AR RTL OK |

**Not fully browser-tested this session:** stock transfer submit end-to-end, goods receipt UI posting, EN LTR parity pass, exact 390px layout QA, sales/returns (placeholders), import costs, barcode hardware, multi-reload persistence beyond localStorage snapshot, concurrency/load.

### Explicit non-claims

- No PASS for production backend, RBAC, HTTPS, 100k items, 20 concurrent users, or &lt;2s search.  
- No claim that compliance matrix / traceability files are up to date.  
- No claim that Items module stock display matches warehouse ledger.  
- Build/lint/typecheck not re-run for this audit (not required for audit-only; not used as PASS evidence).

---

## Appendix — File inventory (inventory-related)

### Routes

- `/warehouses`, `/stock-movements`, `/stock-transfers`, `/stock-adjustments`, `/stocktaking`, `/low-stock`  
- `/goods-receipts` (purchasing → stock)  
- `/reports/inventory`  
- Related placeholders: `/import-costs`, `/import-shipments`, `/sales-invoices`, `/sales-returns`

### Core libs

- `src/lib/inventory-stock-store.ts`  
- `src/lib/warehouses-store.ts`  
- `src/lib/inventory-low-stock.ts`  
- `src/lib/spare-parts-display.ts` (`effectiveSpareOnHandQty`)  
- `src/lib/goods-receipts-store.ts`  
- `src/config/mock-warehouses.ts`  
- `src/types/warehouse.ts`

### UI components

- `src/components/warehouses/warehouses-directory.tsx`  
- `src/components/inventory/stock-*.tsx`  
- `src/components/dashboard/low-stock-table.tsx`  
- `src/components/dashboard/inventory-status-card.tsx` (mock)  
- Spare details warehouse/movements cards in `spare-part-details-view.tsx`

### Tests touching inventory

- `src/lib/warehouses-store.test.ts`  
- `src/lib/goods-receipts-store.test.ts`  
- `src/lib/spare-parts-integration.test.ts` (warehouse on-hand)  
- `src/lib/cross-system-integration.test.ts` (Workflow D)  
- `src/lib/marine-engines-system-integration.test.ts` (Workflow D/F)  
- **Missing:** dedicated `inventory-stock-store.test.ts`

---

*End of audit. Authoritative annex text was not modified. Application source was not modified.*
