# Cross-System Integration Audit

> **Date:** 2026-10-26  
> **Scope:** Frontend-only ERP — integrate *existing* implemented modules  
> **Annex:** unchanged (authoritative). This document is evidence, not completion of the full annex.

---

## A. Implemented module inventory

| Module / route | Classification | Store / source |
|---|---|---|
| Dashboard `/dashboard` | **Partial** — layout real; widgets now prefer live stores where wired | FX / PO / low-stock / activity → stores; charts still mock |
| Items `/items`, `/items/[itemCode]` | **Implemented and testable** | `items-store` → `azzam-marine:items:v1` |
| Spare Parts `/spare-parts`, `/spare-parts/[id]` | **Implemented and testable** | `spare-parts-store` + items spine |
| Marine Engines `/marine-engines`, `/[id]` | **Implemented and testable** (FE local) | `marine-engines-store` + spare compat SoT; seed hydrates first visit |
| Cross-reference `/cross-reference` | **Frontend PARTIAL** | Live directory on spare `alternativeLinks`; browser-local — see `CROSS_REFERENCE_MODULE_IMPLEMENTATION.md` |
| Warehouses `/warehouses` | **Implemented and testable** | `warehouses-store` |
| Stock movements / transfers / adjustments | **Implemented and testable** (ops UI) | `inventory-stock-store` |
| Stocktaking `/stocktaking` | **UI shell** | Placeholder |
| Low stock `/low-stock` | **Partial → repaired** | Derived from items + warehouse stock |
| Suppliers `/suppliers`, `/suppliers/[id]` | **Implemented and testable** | `suppliers-store` + item-suppliers; ledger tabs still partly mock |
| Purchase orders `/purchase-orders`, `/[id]` | **Implemented and testable** | `purchase-orders-store` (mock fallback on some detail paths) |
| Goods receipts `/goods-receipts` | **Implemented and testable** | `goods-receipts-store` → receiveStock + PO apply |
| Import shipments / costs | **UI shell** | Placeholder |
| Customers `/customers` | **Partial** — list CRUD; no detail route | `customers-store` |
| Quotations / sales invoices / returns | **UI shell** | Placeholder |
| Exchange rates `/exchange-rates` | **Implemented and testable** | `exchange-rates-store` |
| Other pricing leaves | **UI shell** | Placeholder |
| Finance leaves | **UI shell** | Placeholder |
| Reports leaves | **UI shell** | Placeholder |
| Audit log `/audit-log` | **Partial → repaired feed** | `client-activity-store` now written by creates |
| Settings leaves | **UI shell** | Placeholder |

---

## B. Integration matrix (implemented relationships)

| Relationship | Authoritative source | Read | Write / propagate | Persist | Tests | Status |
|---|---|---|---|---|---|---|
| Spare ↔ CatalogItem | items + spare-parts stores | Directory/details join | Dual create/update; Items edit syncs spare | both localStorage keys | spare + cross-system | **PASS** |
| Item ↔ Supplier | item-suppliers-store | Item + supplier panels | Link CRUD | item-suppliers v1 | item-supplier + cross-system | **PASS** |
| Spare suppliers | via linked itemId | Spare details panel | Same item-suppliers | same | cross-system | **PASS** |
| Engine ↔ Spare compat | spare `compatibleEngineIds`; `marine-engines-store` | Engine details live reverse | Spare form + `syncEngineCompatibleSpares` / `deleteMarineEngineAndUnlink` | engines v1 + spare v1 | system A–J + spare-integration | **PASS** (FE local) |
| PO ↔ Supplier | purchase-orders-store | Supplier orders tab merges live POs | createPurchaseOrder | PO v1 | cross-system | **PASS** (live); demo ledger still supplements |
| GR ↔ Stock ↔ PO | goods-receipts + inventory-stock + PO | Stock dirs / PO received | receiveStock / applyReceipt | stock + GR + PO | goods-receipts tests | **PASS** |
| Warehouse qty → Items/Spare/Low-stock | inventory-stock-store | `sumStockQtyForItem` / `listLowStockRows` | Stock ops only | warehouse-stock v1 | cross-system | **PASS** when balances exist |
| FX → Spare create / dashboard FX card | exchange-rates-store | getRateAsOf / useExchangeRates | addExchangeRate | FX v1 | spare-integration + UI | **PASS** |
| Client activity → Audit / dashboard | client-activity-store | Audit directory; recent activities prefer live | create item/spare/supplier/PO/receive | client-activity v1 | cross-system | **PASS** (creates only) |
| Categories / manufacturers / UoM | enums/consts (`PART_CATEGORIES`, `ITEM_*`) | Shared form options | Copied labels | N/A | spare-integration | **PARTIAL** — no dynamic masters |
| Countries | world-countries | WorldCountrySelect | ISO + label | on records | spare-integration | **PASS** (static list) |
| Dashboard charts / KPI cards / shipments | mock-dashboard | Dashboard widgets | — | — | — | **NOT IMPLEMENTED** as live |
| Sales / finance / reports | — | Placeholders | — | — | — | **NOT IMPLEMENTED** |
| Cross-reference module | spare codes only | Placeholder page | — | — | — | **NOT IMPLEMENTED** |

---

## C. Repairs performed

| Change | Why |
|---|---|
| Dashboard FX card → `exchange-rates-store` | Stop dual mock FX source |
| Dashboard PO card → `purchase-orders-store` + supplier names | Single PO source for open orders widget |
| Low-stock table/page → `listLowStockRows` (items + WH) | Same stock source as inventory |
| Supplier orders tab merges live POs | Reverse visibility from purchasing store |
| `logClientActivity` on item/spare/supplier/PO/receive | Feed audit log + recent activities |
| Recent activities prefer live client events | Honest feed when mutations exist |
| `listClientActivity` export | Testable activity source |
| `src/lib/cross-system-integration.test.ts` | Workflows A–G coverage for implemented modules |
| Prior spare integration (UoM, FX, engine reverse, WH badges, spine sync) | Remains in force — see `SPARE_PARTS_CROSS_SYSTEM_INTEGRATION.md` |

**Files touched (this pass):**  
`exchange-rates-card.tsx`, `purchase-orders-card.tsx`, `low-stock-table.tsx`, `recent-activities-card.tsx`, `supplier-details-view.tsx`, `inventory-low-stock.ts`, `log-client-activity.ts`, `client-activity-store.ts`, `items-store.ts`, `spare-parts-store.ts`, `suppliers-store.ts`, `purchase-orders-store.ts`, `inventory-stock-store.ts`, `cross-system-integration.test.ts`, this audit doc.

---

## D. Verification results

| Command | Result |
|---|---|
| `npx tsx --test src/lib/cross-system-integration.test.ts` | **8/8 pass** |
| `npm test` | **163/163 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** |
| `npm run build` | run after doc finalize |

---

## E. Remaining gaps

1. **~27 ModulePlaceholder routes** (sales, finance, reports, most pricing, settings, stocktaking, import ops; cross-reference now implemented frontend).
2. **Marine engines** remain seed-only (no create/update store).
3. **Supplier purchases/payments/statement/analytics** still largely mock-ledger.
4. **Dashboard** sales charts, inventory donut, shipment status, KPI strip still mock-dashboard.
5. **Customers** have no detail route and no sales document links.
6. **PO details** may still fall back to mock IDs for legacy demo links.
7. **Browser-local persistence only** — no server sync / multi-user.
8. **No dynamic category/manufacturer masters**.
9. Activity log covers **create** (and receive) paths — not every update/delete yet.

---

## F. Scope boundaries

| Bucket | Content |
|---|---|
| Integration completed for existing modules | Items↔Spares, Item↔Supplier, Stock↔Low-stock/Spare badges, FX↔Spare/Dashboard, PO↔Dashboard/Supplier orders, Activity↔Audit |
| Partial | Engines, supplier financial ledger, dashboard charts/KPIs, customers |
| Missing | Placeholder modules listed above |
| Outside architecture | Backend DB, multi-user authz, live market FX feeds |

Do **not** treat this audit as full annex completion.
