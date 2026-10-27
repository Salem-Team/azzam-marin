# Technical Annex Compliance Matrix — AZZAM MARINE ERP

> **Purpose:** Permanent, evidence-based requirements compliance matrix for the full annex.
> **Contract source:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) (found in repository; Arabic original authoritative).
> **ID registry (companion):** [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md)
> **Process:** [`PROJECT_COMPLIANCE_RULES.md`](./PROJECT_COMPLIANCE_RULES.md)
> **Roadmap:** [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md)
> **Audit date:** 2026-10-21 · **Refresh:** 2026-10-22 (frontend completion wave)
> **Scope of this audit:** Frontend-only Next.js application. No Prisma, no `src/app/api`, no server auth.
> **Master plan:** [`FRONTEND_COMPLETION_MASTER_PLAN.md`](./FRONTEND_COMPLETION_MASTER_PLAN.md)

---

## 1. Executive summary

The technical annex **is present** in the repository and was used as the sole contractual source. The app shell exposes **8 navigation groups / 43 items** (Items, Spare Parts, and Marine Engines are distinct leaves) with routes for nearly the full annex surface; most non-Supplier destinations remain design shells or placeholders.

**Supplier Management** and **Items** remain deep interactive modules (local persistence), with **Items ↔ Suppliers** links. **2026-10-22 wave** added browser stores + directories for **Warehouses**, **Customers**, **Purchase Orders** (create/lines/status), **Goods Receipts**, **Stock movements/transfers**, and **Exchange rates** — still browser-local demos, not production multi-user systems. See [`FRONTEND_COMPLETION_MASTER_PLAN.md`](./FRONTEND_COMPLETION_MASTER_PLAN.md).

| Metric | Value | Rule |
|--------|------:|------|
| Annex requirements traced (`TA-*`) | 377 | From annex via REQUIREMENTS_TRACEABILITY |
| PASS | 4 | Implemented and verified |
| PARTIAL | 96 | Some implementation; documented gap |
| MISSING | 256 | Required; not implemented |
| NOT_TESTED | 6 | Exists or process; inadequate verification |
| BLOCKED | 12 | Cannot complete in frontend-only scope |
| NOT_REQUIRED | 3 | Explicitly commercial/constraint clauses |
| **Strict annex completion (PASS only)** | **1.1%** | PASS ÷ (all − NOT_REQUIRED − BLOCKED) |
| **Weighted progress (PASS=1, PARTIAL=0.5)** | **14.4%** | Same denominator; **not** production readiness |
| **Frontend-scoped weighted progress** | **14.4%** | Excludes Backend/Delivery/Commercial/Ops modules |
| Production readiness | **0% claimed** | No auth, DB, APIs, or multi-user persistence |
| Supplier frontend phase (module QA) | Provisionally accepted | See SUPPLIER_MODULE_VERIFICATION.md |
| Items UI/UX design phase | Approved for review | See ITEMS_MODULE_IMPLEMENTATION.md — not functionally complete |

**Do not treat route shells, placeholders, or demo screens as completed operational workflows.** BLOCKED and NOT_TESTED are not counted as completed.

### Key conflicts (still open)

| ID | Issue |
|----|-------|
| CF-01 | No login while acceptance requires تسجيل الدخول |
| CF-02 | Nav `permissionKey` ≠ real RBAC |
| CF-03 | Backend / Database / APIs absent |
| CF-04 | Backup placeholder; no daily backup/restore |
| CF-05 | Hardware settings placeholder |
| CF-06 | Pricing/FX routes placeholders |
| CF-07 | Import cost multi-method allocation absent |
| CF-08 | System audit log placeholder |
| CF-09 | Supplier ledger/AP is demo, not posting |
| CF-10 | Dashboard DateRangeFilter uncontrolled (no KPI recompute); PO list period state unused; suppliers + items wire filter |
| CF-11 | Global search searches nav, not SKU/OEM/barcode (Items directory search covers identifiers client-side on demo set) |
| CF-12 | Nav coverage ≠ requirement completion |

---

## 2. Status vocabulary

| Status | Meaning | Counts as complete? |
|--------|---------|---------------------|
| PASS | Implemented and verified with evidence | Yes |
| PARTIAL | Some implementation; documented gap | No (0.5 in weighted only) |
| MISSING | Required functionality not implemented | No |
| NOT_TESTED | Implementation/process exists; inadequate verification | No |
| BLOCKED | Cannot be completed in current frontend-only scope | No |
| NOT_REQUIRED | Explicitly not a product feature (commercial/constraint) | Excluded from denominator |

Priority: **P0** critical/acceptance blockers · **P1** core annex workflows · **P2** integration/QA/usability · **P3** optional/non-feature.

---

## 3. Audit evidence log

| Check | Command / method | Result (2026-10-21) |
|-------|------------------|---------------------|
| Unit tests | `npm test` | **46 pass / 0 fail** (8 suites, all supplier-domain) |
| Lint | `npm run lint` | Pass |
| Typecheck | `npm run typecheck` | Pass |
| Build | `npm run build` | Pass (Next.js 16) |
| Nav scope | `navigation.ts` | **42** leaf items / 8 groups |
| Placeholder routes | grep `ModulePlaceholder` | **38** primary pages |
| Non-placeholder ERP pages | page inspection | dashboard, suppliers (+detail), PO list/detail, purchases/[id], supplier-payments/[id], products/[partNumber], low-stock |
| Backend | filesystem | **No** `src/app/api`, **no** Prisma |
| Auth | code search | **No** login/access-denied routes; demo user in `mock-shell.ts` |
| Supplier viewport QA | `scripts/supplier-viewport-qa.mjs` (documented) | Prior run accepted from docs; **not re-run in this audit session** |
| Full app browser QA | — | **Not claimed** for non-supplier modules |

### Unverified assumptions

- Playwright viewport results for suppliers are accepted from existing documentation; not re-executed in this audit turn.
- Design-system EN/AR parity outside suppliers/dashboard/shell was not visually re-labbed page-by-page.
- Concurrent-user and 100k-item performance cannot be validated without backend + representative data.

### Missing source documents

- None for the annex: `docs/TECHNICAL_ANNEX.md` is present and complete through §36.
- No separate original PDF/DOCX annex was found; markdown annex is treated as the project’s contractual copy.

---

## 4. Module inventory (routes)

| Route | Module | Frontend status | Evidence / notes |
|-------|--------|-----------------|------------------|
| `/dashboard` | Dashboard | PARTIAL | Rich mock KPIs/charts; DateRangeFilter not wired to data |
| `/items` | Items | PARTIAL | Frontend closed 2026-10-26 (final): unit 120/120; CRUD 32/32; links 8/8; hydration 13/13; uncategorized≠other verified; `localStorage`/IndexedDB only — ITEMS_MODULE_IMPLEMENTATION.md |
| `/items/[itemCode]` | Items | PARTIAL | Details: 8 tabs, IndexedDB primary image, relatedEngineType, suppliers links, pricing, edit + status; item↔supplier QA 8/8 |
| `/products` | Products | PARTIAL | Redirects into `/items` (legacy path) |
| `/products/[partNumber]` | Products | PARTIAL | Redirects into spare-parts / items catalog routes |
| `/spare-parts` | Spare Parts | PARTIAL | Card/grid directory + filters/KPIs over `SparePartRecord`→Items spine; specialized create not persisted — see SPARE_PARTS_MODULE_IMPLEMENTATION.md |
| `/spare-parts/[id]` | Spare Parts | PARTIAL | Hero + tabbed details over SparePart→Item spine; WH/movements only when stock store has rows — SPARE_PARTS_MODULE_IMPLEMENTATION.md §5a |
| `/marine-engines` | Engines | PARTIAL | Directory KPIs/filters/table + wizard CRUD + delete cascade; localStorage; system A–J 2026-10-27 — MARINE_ENGINES_MODULE_IMPLEMENTATION.md |
| `/marine-engines/[id]` | Engines | PARTIAL | Detail hero + tabs; live compatible/alternatives; stock via `effectiveSpareOnHandQty`; sales/docs honest empty; delete + status actions |
| `/cross-reference` | Cross Reference | PARTIAL | Typed refs + relationshipType + CSV import/export + indexed client search; browser-local — see `docs/CROSS_REFERENCE_MODULE_IMPLEMENTATION.md` |
| `/warehouses` | Warehouses | MISSING | ModulePlaceholder |
| `/stock-movements` | Inventory | MISSING | ModulePlaceholder |
| `/stock-transfers` | Inventory | MISSING | ModulePlaceholder |
| `/stock-adjustments` | Inventory | MISSING | ModulePlaceholder |
| `/stocktaking` | Inventory | MISSING | ModulePlaceholder |
| `/low-stock` | Inventory | PARTIAL | Static mock table; no DateRangeFilter |
| `/suppliers` | Suppliers | PARTIAL | Directory CRUD + localStorage; provisionally accepted frontend phase |
| `/suppliers/[id]` | Suppliers | PARTIAL | Detail tabs, demo ledger/docs |
| `/purchase-orders` | Purchasing | PARTIAL | Mock list; DateRangeFilter UI not filtering |
| `/purchase-orders/[id]` | Purchasing | PARTIAL | Thin header detail; no line items |
| `/purchases/[id]` | Purchasing | PARTIAL | Supplier-linked mock purchase record |
| `/supplier-payments/[id]` | Purchasing/AP | PARTIAL | Supplier-linked mock payment record |
| `/goods-receipts` | Purchasing | MISSING | ModulePlaceholder |
| `/import-shipments` | Import | MISSING | ModulePlaceholder |
| `/import-costs` | Import Costs | MISSING | ModulePlaceholder |
| `/customers` | Customers | MISSING | ModulePlaceholder |
| `/quotations` | Sales | MISSING | ModulePlaceholder |
| `/sales-invoices` | Sales | MISSING | ModulePlaceholder |
| `/sales-returns` | Sales | MISSING | ModulePlaceholder |
| `/price-lists` | Pricing | MISSING | ModulePlaceholder |
| `/exchange-rates` | Exchange Rates | MISSING | ModulePlaceholder |
| `/bulk-price-updates` | Bulk Pricing | MISSING | ModulePlaceholder |
| `/automatic-repricing` | Auto Repricing | MISSING | ModulePlaceholder |
| `/price-history` | Price History | MISSING | ModulePlaceholder |
| `/finance` | Finance | MISSING | ModulePlaceholder |
| `/cashboxes` | Cashboxes | MISSING | ModulePlaceholder |
| `/bank-accounts` | Banks | MISSING | ModulePlaceholder |
| `/receipts-payments` | Finance | MISSING | ModulePlaceholder |
| `/customer-balances` | AR | MISSING | ModulePlaceholder |
| `/supplier-balances` | AP | MISSING | ModulePlaceholder |
| `/reports/sales` | Reports | MISSING | ModulePlaceholder |
| `/reports/inventory` | Reports | MISSING | ModulePlaceholder |
| `/reports/purchasing-import` | Reports | MISSING | ModulePlaceholder |
| `/reports/profit` | Reports | MISSING | ModulePlaceholder |
| `/reports/financial` | Reports | MISSING | ModulePlaceholder |
| `/audit-log` | Audit | MISSING | ModulePlaceholder |
| `/settings/users` | Users | MISSING | ModulePlaceholder |
| `/settings/company` | Settings | MISSING | ModulePlaceholder |
| `/settings/document-numbering` | Settings | MISSING | ModulePlaceholder |
| `/settings/languages` | Settings | MISSING | ModulePlaceholder (runtime language switch exists in shell) |
| `/settings/hardware` | Hardware | MISSING | ModulePlaceholder |
| `/settings/backup` | Backup | MISSING | ModulePlaceholder |
| `/` | Platform | PASS | Redirects to /dashboard |

---

## 5. Demo-data & frontend-persistence inventory

| Asset | Kind | Used by | Production claim allowed? |
|-------|------|---------|---------------------------|
| `src/config/mock-dashboard.ts` | Static mock | Dashboard, PO list | No |
| `src/config/mock-products.ts` | Static mock | Product detail, low-stock links | No |
| `src/config/mock-supplier-ledger.ts` | Static mock ledger | Supplier PO/purchase/payment/statement | No |
| `src/config/mock-supplier-analytics.ts` | Static mock charts | Supplier overview | No |
| `src/config/mock-shell.ts` | Demo user/session chrome | Shell | No |
| `src/lib/suppliers/supplier-persist.ts` | localStorage adapter | Supplier master CRUD | Browser-only demo persistence |
| `src/lib/suppliers/supplier-documents.ts` | IndexedDB adapter | Supplier documents | Browser-only; not DMS |
| `src/lib/suppliers/supplier-audit.ts` | Client audit log | Supplier mutations | Not server audit (TA-34) |
| `src/lib/preferences.ts` + cookie mirror | Preference persistence | Theme/lang/dir/sidebar | OK for UI prefs |
| `src/config/permissions.ts` | Stub (`null` = show all) | Nav visibility | Not authorization |

---

## 6. RTL/LTR, responsive, accessibility, performance

| Area | Finding | Status |
|------|---------|--------|
| EN/AR dictionaries | Shell + dashboard + suppliers rich; placeholders share generic strings | PARTIAL |
| RTL/LTR | `dir` via preferences + boot script; zero-flicker intent | NOT_TESTED app-wide; supplier viewport documented |
| Responsive shell | Bottom nav + drawer patterns exist | PARTIAL (most module pages are placeholders) |
| Accessibility | Focus/dialog patterns in shared UI; no a11y audit suite | NOT_TESTED |
| Catalog search <2s / 100k items | Product search not implemented; no indexed backend | BLOCKED to verify at scale |
| >20 concurrent users | No multi-user backend | BLOCKED |

---

## 7. Backend dependency register

| Capability | Frontend-safe now | Future contract needed | Cannot verify until backend |
|------------|-------------------|------------------------|------------------------------|
| Supplier master CRUD | Yes (localStorage) | `GET/POST/PATCH/DELETE /suppliers` | Multi-user consistency, authz |
| Supplier documents | Yes (IndexedDB) | Upload/download DMS APIs | Durability, authz |
| Supplier AP ledger/statement | UI + mock movements | AP postings from PO/GR/payments | Real balances, aging |
| Auth / RBAC | Login & access-denied **UI** can be built | Session, roles, permission matrix APIs | Real enforcement |
| Products / search | Catalog UI + client filters on page size | Paginated search API (OEM/PN/barcode), indexes | 100k / <2s |
| Inventory movements | Forms + optimistic UI | Stock ledger APIs, warehouse balances | Correct qty/value |
| Purchasing / import costs | Wizards + allocation **preview** UI | PO/GR/shipment/cost allocation APIs | Landed cost posting |
| Pricing / FX / repricing | Screens + preview calculators | FX history, price apply jobs, approval | Financial correctness |
| Sales / finance | Document UIs | Invoice/payment posting, cash/bank ledgers | Statements, aging, profit |
| Backup / hardware | Settings UX + status | Host jobs, device bridges | Real backup/print/scan |
| Audit log | Client-side event list (limited) | Append-only server audit | Integrity, IP, non-repudiation |

---

## 8. Full requirements matrix

Columns: ID · Requirement · Module · Priority · Status · Evidence · Missing · Dependencies · Backend? · Next action

### Project definition

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-01-01 | Central ERP platform covering listed operational domains | Platform | P2 | PARTIAL | Repo inspection; `src/config/navigation.ts`, `src/app/(erp)/**` | Navigation maps most domains; majority modules are placeholders | — | Partial | Close documented frontend gaps; do not claim production complete |
| TA-01-02 | Users & permissions management | Users/RBAC | P2 | PARTIAL | Repo inspection; `settings/users`, `permissions.ts` | Route shell + nav stubs only | — | Partial | Close documented frontend gaps; do not claim production complete |
| TA-01-03 | Spare parts catalog | Products | P1 | PARTIAL | Repo inspection; `/products`, `/products/[partNumber]` | List placeholder; thin detail mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-01-04 | Marine engines | Engines | P1 | PARTIAL | `/marine-engines` CRUD + A–J tests 2026-10-27; MARINE_ENGINES_MODULE_IMPLEMENTATION.md | No server/authz | Spare Parts | Partial (UI now; APIs later) | Keep FE; backend later |
| TA-01-05 | Warehouses & inventory | Inventory | P1 | PARTIAL | Repo inspection; warehouse/stock routes; `/low-stock` | Only low-stock mock list beyond shells | — | Yes (for production) | Close documented frontend gaps; do not claim production complete |
| TA-01-06 | Purchasing & import | Purchasing/Import | P2 | PARTIAL | Repo inspection; `/purchase-orders`, import routes | Thin PO list/detail; import shells | — | Partial | Close documented frontend gaps; do not claim production complete |
| TA-01-07 | Suppliers | Suppliers | P1 | PARTIAL | Repo inspection; `/suppliers`, suppliers store | Deepest frontend mock module | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-01-08 | Customers | Customers | P1 | MISSING | Repo inspection; `/customers` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-01-09 | Sales | Sales | P1 | MISSING | Repo inspection; quotations/invoices/returns | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-01-10 | Cashbox & bank accounts | Finance | P1 | MISSING | Repo inspection; cashboxes/banks | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-01-11 | Customer & supplier balances | Finance | P1 | MISSING | Repo inspection; balance routes | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-01-12 | Import expenses & costs | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-01-13 | Reports & statistics | Reports | P1 | MISSING | Repo inspection; `/reports/*` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-01-14 | Backup & restore | Backup | P1 | MISSING | Repo inspection; `/settings/backup` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-01-15 | External device integrations | Hardware | P1 | MISSING | Repo inspection; `/settings/hardware` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-01-16 | Arabic & English support | i18n | P1 | PARTIAL | UI/code inspection; `src/i18n/*`, locale providers | Shell/dashboard/suppliers dictionaries; not full module coverage | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |

### RBAC & role capabilities

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-RBAC-01 | Full RBAC for users/roles/permissions | Users/RBAC | P0 | MISSING | Repo inspection; `permissions.ts`, `settings/users` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-02-01-01 | Add users | Users | P0 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-02 | Edit users | Users | P0 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-03 | Disable/delete users per permissions | Users | P0 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-04 | Create/manage roles | Roles | P2 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-05 | Assign permissions | Roles | P2 | MISSING | Repo inspection; `permissions.ts` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-06 | System settings management | Settings | P2 | MISSING | Repo inspection; `/settings/*` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-07 | Access reports & statistics | Reports | P1 | MISSING | Repo inspection; `/reports/*` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-01-08 | Monitor main system operations | Audit/Ops | P2 | MISSING | Repo inspection; `/audit-log` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-01 | Add products | Products | P1 | MISSING | Repo inspection; `/products` | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-02-02-02 | Edit products per permissions | Products | P1 | MISSING | Repo inspection; product detail | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-02-02-03 | Receive goods | Goods Receipts | P2 | MISSING | Repo inspection; `/goods-receipts` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-04 | Add stock | Stock | P2 | MISSING | Repo inspection; stock routes | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-05 | Issue/stock out | Stock | P2 | MISSING | Repo inspection; `/stock-movements` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-06 | Transfer between warehouses | Transfers | P2 | MISSING | Repo inspection; `/stock-transfers` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-07 | Perform stocktaking | Stocktaking | P2 | MISSING | Repo inspection; `/stocktaking` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-02-08 | Monitor stock balances | Inventory | P1 | PARTIAL | Repo inspection; `/low-stock`, dashboard | Mock quantities only | — | Yes (for production) | Close documented frontend gaps; do not claim production complete |
| TA-02-02-09 | Monitor low & slow-moving items | Inventory | P1 | PARTIAL | Repo inspection; `/low-stock` | Low-stock mock list; slow-moving not implemented | — | Yes (for production) | Close documented frontend gaps; do not claim production complete |
| TA-02-02-10 | Monitor stock movements | Movements | P2 | MISSING | Repo inspection; `/stock-movements` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-03-01 | Manage customers | Customers | P1 | MISSING | Repo inspection; `/customers` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-03-02 | Create quotations | Sales | P1 | MISSING | Repo inspection; `/quotations` | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-03-03 | Issue sales invoices | Sales | P1 | MISSING | Repo inspection; `/sales-invoices` | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-03-04 | Record sales returns | Sales | P1 | MISSING | Repo inspection; `/sales-returns` | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-03-05 | Follow sales operations | Sales | P1 | MISSING | Repo inspection; sales routes | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-03-06 | Follow customer balances | Finance/AR | P2 | MISSING | Repo inspection; `/customer-balances` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-03-07 | Search products & prices | Products/Pricing | P2 | MISSING | Repo inspection; global-search, products | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-04-01 | Record receipts | Finance | P1 | MISSING | Repo inspection; `/receipts-payments` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-02 | Record payments | Finance | P1 | MISSING | Repo inspection; `/receipts-payments` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-03 | Manage cashbox | Cashboxes | P1 | MISSING | Repo inspection; `/cashboxes` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-04 | Manage bank accounts | Banks | P1 | MISSING | Repo inspection; `/bank-accounts` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-05 | Customer balances | AR | P1 | MISSING | Repo inspection; `/customer-balances` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-06 | Supplier balances | AP | P1 | MISSING | Repo inspection; `/supplier-balances` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-02-04-07 | Issue account statements | Statements | P2 | MISSING | Repo inspection; supplier/customer details | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-04-08 | Debt aging | Aging | P2 | MISSING | Repo inspection; finance/reports | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-04-09 | Extract financial reports | Reports | P1 | MISSING | Repo inspection; `/reports/financial` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-05-01 | Create purchase orders | Purchasing | P1 | PARTIAL | Repo inspection; `/purchase-orders` | Mock list/detail; no create/lines | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-02-05-02 | Manage suppliers | Suppliers | P1 | PARTIAL | UI inspection; `/suppliers` | Frontend CRUD-like in-memory | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-02-05-03 | Record import operations | Import | P1 | MISSING | Repo inspection; import routes | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-05-04 | Track shipments | Import | P1 | MISSING | Repo inspection; `/import-shipments` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-05-05 | Record container data | Import | P1 | MISSING | Repo inspection; `/import-shipments` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-02-05-06 | Record freight/insurance/customs/expenses | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-05-07 | Allocate import costs to items | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-02-05-08 | Track shipment status | Import | P1 | MISSING | Repo inspection; `/import-shipments` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Spare parts & catalog

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-03-00 | Integrated parts/products module | Products | P1 | PARTIAL | `/items` CRUD+details; item↔supplier links via `item-suppliers-store`; `/spare-parts` + `/marine-engines` separate; ITEMS_MODULE_IMPLEMENTATION.md §5a | No server API; spare/engine workflows incomplete; links ≠ purchasing | Suppliers | Partial (UI now; APIs later) | Backend item master; keep module separation |
| TA-03-01-01 | Item code | Products | P1 | PARTIAL | Items list/detail/wizard; persisted in `localStorage`; duplicate prevention tested | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-02 | Arabic name | Products | P1 | PARTIAL | Items list/detail/wizard; i18n; local persist | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-03 | English name | Products | P1 | PARTIAL | Items list/detail/wizard; local persist | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-04 | Manufacturer | Products | P1 | PARTIAL | Items list/filter/wizard; local persist | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-05 | Country of origin | Products | P1 | PARTIAL | Items list/filter/wizard + flag; local persist | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-06 | OEM Number | Products | P1 | PARTIAL | Items search + identity tab; spare module still specialized | Spare workflows incomplete | Spare Parts | Partial (UI now; APIs later) | Complete spare-part specialized UI + API |
| TA-03-01-07 | Part Number | Products | P1 | PARTIAL | Items search/detail; `/spare-parts/[id]` | Not production keying | Spare Parts | Partial (UI now; APIs later) | Persist + spare workflows |
| TA-03-01-08 | Linked engine type | Products | P1 | PARTIAL | `relatedEngineType` on item master + form/details/search; engine-record link when `itemId` matches | Specialized compatibility CRUD remains on Engines/Spares | Engines | Partial (UI now; APIs later) | Keep module separation; API later |
| TA-03-01-09 | Product image | Products | P1 | PARTIAL | IndexedDB primary image choose/replace/remove (`item-images.ts`); create-wizard optional image; QA actions present | Browser-local only; general docs DMS missing | — | Partial (UI now; APIs later) | Central media storage + upload API |
| TA-03-01-10 | Unit of measure | Products | P1 | PARTIAL | Items list/filter/wizard; local persist | Browser-local only | — | Partial (UI now; APIs later) | Persist via item master API |
| TA-03-01-11 | Minimum stock | Products | P1 | PARTIAL | Items list/wizard/detail; inventory tab distinguishes threshold vs demo qty | Live warehouse balances unavailable | Inventory | Partial (UI now; APIs later) | Wire to warehouse stock |
| TA-03-01-12 | Cost price | Products | P1 | PARTIAL | Items pricing tab + wizard (USD/EGP); local persist; no auto FX | No FX engine | Pricing | Partial (UI now; APIs later) | Pricing services |
| TA-03-01-13 | Selling price | Products | P1 | PARTIAL | Items table EGP + pricing tab/wizard USD/EGP; local persist | No FX engine | Pricing | Partial (UI now; APIs later) | Pricing services |
| TA-03-01-14 | Item status | Products | P1 | PARTIAL | Status badges + confirm dialog; `setItemStatus` persists locally | Not server workflow | — | Partial (UI now; APIs later) | Server status transitions |
| TA-03-02-01 | Search by name | Products | P1 | PARTIAL | Items directory `filterItems`; unit-tested | Client-side demo set | — | Partial (UI now; APIs later) | Indexed server search |
| TA-03-02-02 | Search by item code | Products | P1 | PARTIAL | Items directory; unit-tested | Client-side demo | — | Partial (UI now; APIs later) | Indexed server search |
| TA-03-02-03 | Search by Part Number | Products | P1 | PARTIAL | Items + spare directories; unit-tested | Client-side demo | — | Partial (UI now; APIs later) | Indexed server search |
| TA-03-02-04 | Search by OEM Number | Products | P1 | PARTIAL | Items + spare directories; unit-tested | Client-side demo | — | Partial (UI now; APIs later) | Indexed server search |
| TA-03-02-05 | Search by Serial Number | Products | P1 | PARTIAL | Items query matches linked engine serial; engines directory | Demo linkage only | Engines | Partial (UI now; APIs later) | Serial registry + search |
| TA-03-02-06 | Search by Barcode | Products | P1 | PARTIAL | Items directory; unit-tested | Client-side demo | — | Partial (UI now; APIs later) | Indexed server search |
| TA-03-02-07 | Search suitable for large catalogs | Products | P1 | MISSING | Repo inspection; mock ~20 items | No indexed/100k-scale search | — | Yes (for production) | Backend search infra |

### Marine engines

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-04-01 | Independent engines module | Engines | P1 | PARTIAL | `/marine-engines` directory+detail; store persist; wizard; delete; system A–J 2026-10-27 | No server/authz | Items | Partial (UI now; APIs later) | Keep module separation; API later |
| TA-04-02 | Manufacturer, model, year, HP, serial, origin, basics | Engines | P1 | PARTIAL | Wizard + validation + unique serial; unit + system tests | No server | — | Partial (UI now; APIs later) | Backend engine master |
| TA-04-03 | Compatible parts for engine | Engines/Products | P2 | PARTIAL | `syncEngineCompatibleSpares` + live reverse; both-direction tests | No server | Spare Parts | Partial (UI now; APIs later) | API sync |
| TA-04-04 | Alternative parts via engine | Engines | P1 | PARTIAL | `alternativePartsForEngine` from spare `alternativeLinks` (distinct from compatibility) | Not engine sales graph | Cross Reference, Spare Parts | Partial (UI now; APIs later) | Keep spare/cross-ref SoT |
| TA-04-05 | Parts linked to a model | Engines | P1 | PARTIAL | Live spare↔engine ids on detail/directory + counts + search | No server model index | Spare Parts | Partial (UI now; APIs later) | Indexed model search later |
| TA-04-06 | Sales history for engine when available | Engines/Sales | P2 | MISSING | Engine details honest empty KPI/tab — no fake counts | Sales module not connected | Sales | Yes (for production) | Wire when Sales exists |

### Warehouses & inventory

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-05-01 | Multi-warehouse independent management | Warehouses | P1 | PARTIAL | `/warehouses` + `warehouses-store`; create/edit; unit tests 2026-10-22 | No server; no detail route depth | Items | Partial (UI now; APIs later) | Deepen WH details; keep FE persist |
| TA-05-02 | Support warehouse types (main/new/used/engines) | Warehouses | P1 | PARTIAL | Warehouse `kind` enum + seed types; directory filters | Limited taxonomy vs ops reality | — | Partial (UI now; APIs later) | Keep kinds aligned with annex examples |
| TA-05-03 | Add stock | Inventory | P1 | PARTIAL | `inventory-stock-store.receiveStock`; GR path | No standalone “add stock” form UI | Warehouses, Items | Partial (UI now; APIs later) | Add adjustment/add UI |
| TA-05-04 | Goods receipt | Inventory | P1 | PARTIAL | `/goods-receipts` + `goods-receipts-store`; PO outstanding; stock update; unit tests | No server GR posting | PO, Warehouses | Partial (UI now; APIs later) | Browser QA + partial receipt UX polish |
| TA-05-05 | Stock issue | Inventory | P1 | MISSING | Repo inspection; `/stock-movements` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-05-06 | Transfer between warehouses | Transfers | P2 | MISSING | Repo inspection; `/stock-transfers` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-07 | Stock adjustment | Adjustments | P2 | MISSING | Repo inspection; `/stock-adjustments` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-08 | Periodic stocktaking | Stocktaking | P2 | MISSING | Repo inspection; `/stocktaking` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-09 | Surprise stocktaking | Stocktaking | P2 | MISSING | Repo inspection; `/stocktaking` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-10 | Item movement history | Movements | P2 | MISSING | Repo inspection; `/stock-movements` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-11 | Current balance per warehouse | Inventory | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-05-12 | Qty per item | Reports/Inventory | P2 | MISSING | Repo inspection; `/reports/inventory` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-13 | Current inventory value | Reports/Inventory | P2 | MISSING | Repo inspection; dashboard mock KPI | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-14 | Low stock items | Inventory | P1 | PARTIAL | UI inspection; `/low-stock`, dashboard table | Static mock list | — | Yes (for production) | Close documented frontend gaps; do not claim production complete |
| TA-05-15 | Slow-moving items | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-16 | Best-selling items | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-17 | Fast-moving items | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-18 | Stock movement reports | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-05-19 | Inter-warehouse transfer reports | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Purchasing & import

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-06-00 | Full purchase/import cycle | Purchasing | P1 | PARTIAL | Repo inspection; purchasing routes | Incomplete | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-01 | PO number | Purchasing | P1 | PARTIAL | UI inspection; `mock-dashboard.ts`, PO pages | Mock IDs | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-02 | Supplier on PO | Purchasing | P1 | PARTIAL | UI inspection; PO detail | Header field only | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-03 | Purchase date | Purchasing | P1 | PARTIAL | UI inspection; PO cards | Mock | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-04 | Currency | Purchasing | P1 | PARTIAL | UI inspection; PO detail | Limited | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-05 | Line items | Purchasing | P1 | PARTIAL | `purchase-orders-store` lines + create dialog + detail table; unit tests | Legacy mock POs still separate; no server | Suppliers, Items | Partial (UI now; APIs later) | Migrate legacy mock rows or label clearly |
| TA-06-01-06 | Quantities | Purchasing | P1 | MISSING | UI inspection | Not implemented | Suppliers, Products | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-06-01-07 | Purchase prices | Purchasing | P1 | MISSING | UI inspection | Not implemented | Suppliers, Products | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-06-01-08 | PO total | Purchasing | P1 | PARTIAL | UI inspection; PO cards | Mock totals | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-01-09 | PO status | Purchasing | P1 | PARTIAL | UI inspection; PO cards | Mock status | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-06-02-01 | Container number | Import | P1 | MISSING | Repo inspection; `/import-shipments` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-02 | Shipping company | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-03 | Loading port | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-04 | Arrival port | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-05 | Ship date | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-06 | ETA | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-02-07 | Shipment status | Import | P1 | MISSING | Repo inspection; dashboard shipment card | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-06-03-01 | Record goods value / freight / insurance / customs / admin / other | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-06-03-02 | Allocate costs to items for final unit cost | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |

### Suppliers

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-07-01 | Integrated supplier profile | Suppliers | P1 | PARTIAL | `/suppliers`, `/suppliers/[id]` + Related items tab (`SupplierRelatedItemsPanel`); SUPPLIER_MODULE_IMPLEMENTATION.md | Server-backed AP ledger/history; related items are browser-local links only | Items | Partial (UI now; APIs later) | Maintain; wire APIs when backend exists |
| TA-07-02 | Name, country, phone, email, WhatsApp, bank, basics | Suppliers | P1 | PARTIAL | Wizard/form/validation + localStorage; 46 tests | Multi-user DB persistence | — | Partial (UI now; APIs later) | API contract for supplier master |
| TA-07-03 | Purchase orders history | Suppliers | P1 | PARTIAL | UI + route smoke; `mock-supplier-ledger.ts`, PO details fallback | Linked POs resolve to detail pages (USD); not full PO workflow | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-04 | Purchases history | Suppliers | P1 | PARTIAL | UI + route smoke; `/purchases/[id]`, ledger catalog | Mock purchase records; not goods-receipt posting | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-05 | Payments history | Suppliers | P1 | PARTIAL | UI + route smoke; `/supplier-payments/[id]` | Mock payment records; not bank reconciliation | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-06 | Current balance | Suppliers | P1 | PARTIAL | Seed invariant check; directory + details KPIs | Seed `balance = purchases − payments` (USD); not AP posting | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-07 | Account statement | Suppliers | P1 | PARTIAL | Code inspection; statement tab + analytics | Debit/credit/reference + running balance; period recompute; ends at supplier.balance; demo only | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-08 | Transaction history | Suppliers | P1 | PARTIAL | UI inspection; history tab | Same movements as statement without running-balance column | — | Yes | Close documented frontend gaps; do not claim production complete |
| TA-07-09 | Persistence of supplier data | Suppliers | P1 | PARTIAL | Tests 2026-10-21; `supplier-persist.ts`, `suppliers-store.ts`, `supplier-documents.ts`, `supplier-audit.ts` | Browser localStorage + IndexedDB adapters; not multi-user DB / DMS / RBAC — see `docs/SUPPLIER_MODUL | — | Yes | Close documented frontend gaps; do not claim production complete |

### Customers

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-08-01 | Integrated customer profile | Customers | P1 | PARTIAL | `/customers` directory CRUD via `customers-store`; demo AR balance disclosed | No detail tabs / sales history integration yet | Sales | Partial (UI now; APIs later) | Customer details + sales docs |
| TA-08-02 | Name, phone, address, optional tax id, basics | Customers | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-08-03 | Purchases / invoices / payments / returns | Customers | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-08-04 | Outstanding balance & last transaction | Customers | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-08-05 | Account statement & operations log | Customers | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Sales

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-09-00 | Full sales cycle | Sales | P1 | MISSING | Repo inspection; sales routes | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-01-01 | Create quotation | Quotations | P2 | MISSING | Repo inspection; `/quotations` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-01-02 | Add items/qty/prices & totals | Quotations | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-01-03 | Generate PDF | Quotations | P2 | MISSING | Repo inspection; package.json | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-01-04 | Send via WhatsApp | Quotations | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-01-05 | Send via email | Quotations | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-02-01 | Cash sale | Invoices | P2 | MISSING | Repo inspection; `/sales-invoices` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-02-02 | Credit sale | Invoices | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-02-03 | Bank transfer sale | Invoices | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-02-04 | Invoice with customer/items/qty/prices/totals | Invoices | P2 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-09-03-01 | Record return | Returns | P2 | MISSING | Repo inspection; `/sales-returns` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-09-03-02 | Restock per approved condition | Returns/Inventory | P2 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-09-03-03 | Update stock qty | Returns/Inventory | P2 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-09-03-04 | Update customer account | Returns/AR | P2 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-09-03-05 | Record financial impact | Returns/Finance | P2 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Accounting & finance

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-10-01-01 | Daily cash movement | Cashboxes | P1 | MISSING | Repo inspection; `/cashboxes` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-01-02 | Receipts & payments in cashbox | Cashboxes | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-01-03 | Current cash balance & statement | Cashboxes | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-02-01 | Manage bank accounts | Banks | P1 | MISSING | Repo inspection; `/bank-accounts` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-02-02 | Record bank movements & balances | Banks | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-02-03 | Bank transfers & statements | Banks | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-03-01 | Customer balances / payments / dues | AR | P1 | MISSING | Repo inspection; `/customer-balances` | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-03-02 | Debt aging | AR | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-03-03 | Customer statements | AR | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-10-04-01 | Supplier balances / payments / dues | AP | P1 | MISSING | Repo inspection; `/supplier-balances` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-10-04-02 | Debt aging | AP | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-10-04-03 | Supplier statements | AP | P1 | MISSING | Repo inspection; supplier statement tab | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

### Reports

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-11-01 | Daily/weekly/monthly/yearly sales reports | Reports | P1 | MISSING | Repo inspection; `/reports/sales` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-11-02 | Sales by customer / by item | Reports | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-11-03 | Sales total, COGS, gross profit, net profit | Reports | P1 | MISSING | Repo inspection; `/reports/profit` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-11-04 | Inventory value, low/slow/fast, movements, warehouse balances | Reports | P1 | MISSING | Repo inspection; `/reports/inventory` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-11-05 | Customer/supplier statements, cash/bank movement, aging | Reports | P1 | MISSING | Repo inspection; `/reports/financial` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-11-06 | Purchasing/import reports route | Reports | P1 | MISSING | Repo inspection; `/reports/purchasing-import` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Dashboard

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-12-00 | Main dashboard with role-based KPIs | Dashboard | P1 | PARTIAL | UI inspection; `dashboard-home.tsx`, `mock-dashboard.ts` | Rich mock UI; not role-filtered | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-01 | Total sales KPI | Dashboard | P1 | PARTIAL | UI inspection; KPI cards | Static mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-02 | Total purchases KPI | Dashboard | P1 | PARTIAL | UI inspection; KPI cards | Static mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-03 | Inventory value KPI | Dashboard | P1 | PARTIAL | UI inspection; KPI cards | Static mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-04 | Customer balances KPI | Dashboard | P1 | PARTIAL | UI inspection; KPI cards | Static mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-05 | Supplier balances KPI | Dashboard | P1 | PARTIAL | UI inspection; KPI cards | Static mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-06 | Cash movement indicator | Dashboard | P1 | PARTIAL | UI inspection; finance-related cards | Mock/limited | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-07 | Bank movement indicator | Dashboard | P1 | PARTIAL | UI inspection | Mock/limited | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-08 | Profits indicator | Dashboard | P1 | PARTIAL | UI inspection | Mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-09 | Low stock list | Dashboard | P1 | PARTIAL | UI inspection; `low-stock-table.tsx` | Mock | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-10 | Best-selling items | Dashboard | P1 | MISSING | UI inspection | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-12-11 | Recent operations | Dashboard | P1 | PARTIAL | UI inspection; `recent-activities-card.tsx` | Decorative mock ≠ audit | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-12-12 | KPIs respect user permissions | Dashboard | P1 | MISSING | Code inspection; permissions stub | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-12-13 | Period filter affects metrics | Dashboard | P1 | PARTIAL | DateRangeFilter on dashboard welcome | KPI/chart recompute from committed range | — | Partial (UI now; APIs later) | Wire dashboard data to period |

### Hardware

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-HW-01 | Barcode Scanner integration | Hardware | P1 | MISSING | Repo inspection; `/settings/hardware` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-HW-02 | Invoice Printer integration | Hardware | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-HW-03 | Barcode Printer integration | Hardware | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

### Backup

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-BK-01 | Automatic daily backups | Backup | P1 | BLOCKED | Repo inspection; `/settings/backup` | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-BK-02 | Suitable backup storage | Backup | P1 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-BK-03 | Data restore capability | Backup | P1 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-BK-04 | Backup protection per hosting settings | Backup | P1 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-BK-05 | Cloud/hosting fees independent unless contract says otherwise | Commercial | P2 | NOT_REQUIRED | Contractual note; annex text | — | — | No / process | No action |

### Languages

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-LANG-01 | Arabic language | i18n | P1 | PARTIAL | UI/code inspection; `src/i18n/ar.ts`, locale provider | Shell + selected modules | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-LANG-02 | English language | i18n | P1 | PARTIAL | UI/code inspection; `src/i18n/en.ts` | Shell + selected modules | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-LANG-03 | Appropriate text direction (RTL/LTR) | i18n | P1 | NOT_TESTED | preferences + dir; supplier viewport QA AR/EN documented | Full visual QA on all future modules | — | Partial (UI now; APIs later) | Viewport QA per module delivery |
| TA-LANG-04 | Languages settings page (admin) | Settings | P2 | MISSING | Repo inspection; `/settings/languages` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |

### Performance

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-PERF-01 | Support >100,000 items | Platform | P2 | BLOCKED | Repo inspection; mock catalog size | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-PERF-02 | Support >20 concurrent users | Platform | P2 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-PERF-03 | Search <2s under normal conditions | Products | P1 | MISSING | Repo inspection | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-PERF-04 | Actual performance depends on server/data/network/DB | Platform | P3 | NOT_REQUIRED | N/A; annex clause | — | — | Partial | No action |

### Security

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-SEC-01 | Authentication | Auth | P0 | MISSING | Repo inspection; no login/middleware | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-02 | Role-Based Access Control | Authz | P0 | MISSING | Repo inspection; `permissions.ts` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-03 | User Permissions | Authz | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-04 | Role Permissions | Authz | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-05 | Protect sensitive operations | Authz | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-06 | Access permission management | Settings | P2 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-SEC-07 | HTTPS in supporting production environments | Ops | P2 | BLOCKED | Deployment not reviewed | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |

### QA phase

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-QA-01 | Functional Testing | QA | P2 | MISSING | Repo inspection; no test suite | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-02 | User Flow Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-03 | Inventory Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-04 | Sales Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-05 | Purchase Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-06 | Import Cost Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-07 | Customer Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-08 | Supplier Testing | QA | P2 | PARTIAL | `npm test` 46/46 pass (2026-10-21); supplier-domain unit tests only | Full annex Supplier Testing + E2E browser suite | — | No / process | Keep supplier tests green; expand when next module lands |
| TA-QA-09 | Accounting Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-10 | Reports Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-11 | Permissions Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-12 | API Testing | QA | P2 | BLOCKED | Repo inspection; no APIs | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-QA-13 | Backup & Restore Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-14 | Device Integration Testing | QA | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-QA-15 | Fix in-scope defects before final delivery | QA | P2 | NOT_TESTED | Process | Not implemented | — | No / process | Run verification against acceptance criteria |

### Training, phases, commercial, IP

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-TRN-01 | Train core staff on main operations | Delivery | P2 | MISSING | Process | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-TRN-02 | 12-month post Go-Live support for agreed functions | Delivery | P2 | NOT_TESTED | Contractual | Not implemented | — | No / process | Run verification against acceptance criteria |
| TA-TRN-03 | Support excludes new modules/features/scope/integrations (CR) | Governance | P2 | PASS | PROJECT_COMPLIANCE_RULES + annex text | — | — | No / process | Preserve governance |
| TA-PH-01 | 45 working days (excl. Fri/Sat/holidays/client delays) | Delivery | P2 | NOT_TESTED | Schedule | Not implemented | — | No / process | Run verification against acceptance criteria |
| TA-PH-02 | Discovery & Analysis (5 days) | Delivery | P2 | NOT_TESTED | Process | Not implemented | — | No / process | Run verification against acceptance criteria |
| TA-PH-03 | UX/UI (7 days) | Delivery | P2 | PARTIAL | Repo inspection; `docs/design-system/*` | Design system advanced; not formal phase sign-off | — | No / process | Close documented frontend gaps; do not claim production complete |
| TA-PH-04 | Core Development incl. Backend/DB/UI/modules (23 days) | Delivery | P2 | PARTIAL | Repo inspection; frontend shell | Backend/DB missing | — | No / process | Close documented frontend gaps; do not claim production complete |
| TA-PH-05 | Integration & QA (7 days) | Delivery | P2 | MISSING | Repo inspection | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-PH-06 | Final Handover (3 days) | Delivery | P2 | MISSING | Process | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-SCOPE-01 | Only annex features in scope; others are CR | Governance | P2 | PASS | TECHNICAL_ANNEX + compliance rules | — | — | No / process | Preserve |
| TA-SCOPE-02 | CR study → impact → cost → written approval | Governance | P2 | PASS | PROJECT_COMPLIANCE_RULES §9 | — | — | No / process | Preserve |
| TA-HOST-01 | Third-party fees excluded unless agreed | Commercial | P2 | NOT_REQUIRED | Contractual; annex | — | — | No / process | No action |
| TA-WAR-01 | 12-month warranty from Go-Live for in-scope defects | Delivery | P2 | NOT_TESTED | Contractual; annex | Not implemented | — | No / process | Run verification against acceptance criteria |
| TA-WAR-02 | Warranty exclusions (new features, 3rd-party edits, hosting, incompatible devices) | Governance | P2 | PASS | Annex warranty exclusions preserved | — | — | No / process | Preserve |
| TA-IP-01 | Deliver Source Code/DB/Backend/APIs/docs after full payment | Delivery | P2 | BLOCKED | Process | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |

### Acceptance criteria (basic)

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-AC-01 | Login | Auth | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-AC-02 | Users & permissions management | Users | P0 | MISSING | Repo inspection; `/settings/users` | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-AC-03 | Products management | Products | P0 | PARTIAL | Repo inspection; products routes | Incomplete | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-AC-04 | Product search | Products | P0 | MISSING | Repo inspection | Not implemented | — | Partial (UI now; APIs later) | Implement frontend workflow per roadmap priority |
| TA-AC-05 | Marine engines management | Engines | P0 | PARTIAL | Directory wizard CRUD + KPIs/filters/delete; system A–J 2026-10-27 | No server/authz | — | Partial (UI now; APIs later) | Backend engines API |
| TA-AC-06 | Link parts to engines | Engines | P0 | PARTIAL | Wizard link step + `syncEngineCompatibleSpares` / `deleteMarineEngineAndUnlink`; integrity tests | No server | Spare Parts | Partial (UI now; APIs later) | Backend link API |
| TA-AC-07 | Warehouses management | Warehouses | P0 | PARTIAL | Warehouses directory + persist + tests 2026-10-22 | Detail pages / multi-user | — | Partial (UI now; APIs later) | Continue FE polish |
| TA-AC-08 | Stock in/out/transfer | Inventory | P0 | PARTIAL | Receipts + transfers + movements directories; ledger math unit-tested via GR | Adjustments/stocktaking incomplete | Warehouses | Partial (UI now; APIs later) | Finish adjustments/stocktaking UIs |
| TA-AC-09 | Stocktaking operations | Stocktaking | P0 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-AC-10 | Create purchase orders | Purchasing | P0 | PARTIAL | Create PO with supplier+lines+currency; status transitions; tests 2026-10-22 | Not external submit; legacy mocks coexist | Suppliers, Items | Partial (UI now; APIs later) | Browser QA; retire mock-only list |
| TA-AC-11 | Suppliers management | Suppliers | P0 | PARTIAL | Supplier frontend provisionally accepted (frontend phase) | Production AP/RBAC | — | Partial (UI now; APIs later) | Do not reopen unless regression |
| TA-AC-12 | Record shipment data | Import | P0 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-AC-13 | Allocate import costs | Import Costs | P0 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-AC-14 | Customers management | Customers | P0 | PARTIAL | Customers directory CRUD + localStorage 2026-10-22 | Details/sales history incomplete | — | Partial (UI now; APIs later) | Details + sales wiring |
| TA-AC-15 | Create quotations | Sales | P0 | MISSING | Repo inspection | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-AC-16 | Issue sales invoices | Sales | P0 | MISSING | Repo inspection | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-AC-17 | Record returns | Sales | P0 | MISSING | Repo inspection | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-AC-18 | Cashbox management | Finance | P0 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-AC-19 | Bank accounts management | Finance | P0 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-AC-20 | Customer & supplier balances | Finance | P0 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-AC-21 | Basic reports | Reports | P0 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-AC-22 | Permissions system operating | Authz | P0 | MISSING | Repo inspection; permissions stub | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-AC-23 | Backup operating | Backup | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-AC-24 | Arabic & English support | i18n | P0 | PARTIAL | UI inspection; i18n system | Incomplete module coverage | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-AC-25 | Agreed device integrations operating | Hardware | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

### Deliverables

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-DEL-SYS | Company management system | Platform | P2 | PARTIAL | Repo inspection; app shell | Frontend shell | — | Partial | Close documented frontend gaps; do not claim production complete |
| TA-DEL-DASH | Dashboard | Dashboard | P1 | PARTIAL | UI inspection; `/dashboard` | Mock KPIs | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-DEL-USER | User Management | Users | P0 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-DEL-ROLE | Roles & Permissions | Authz | P0 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-DEL-INV | Inventory Management | Inventory | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-DEL-WH | Warehouse Management | Warehouses | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-DEL-PARTS | Spare Parts Management | Products | P1 | PARTIAL | SPARE_PARTS_MODULE_IMPLEMENTATION.md; `/spare-parts` directory UI 2026-10-26 | Specialized spare persist store missing; live WH stock missing | Items, Engines | Partial (UI now; APIs later) | Persist spare records; wire inventory |
| TA-DEL-ENG | Marine Engines Management | Engines | P1 | PARTIAL | MARINE_ENGINES_MODULE_IMPLEMENTATION.md; FE CRUD + SoT map + A–J 2026-10-27 | Backend deliverable | Spare Parts | Partial (UI now; APIs later) | Backend engines APIs |
| TA-DEL-PUR | Purchasing Management | Purchasing | P1 | PARTIAL | Repo inspection | Thin PO mock | Suppliers, Products | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-DEL-IMP | Import Management | Import | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-DEL-SUP | Suppliers Management | Suppliers | P1 | PARTIAL | Deepest frontend module | Backend deliverable | — | Partial (UI now; APIs later) | Backend supplier APIs |
| TA-DEL-CUS | Customers Management | Customers | P1 | MISSING | Repo inspection | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-DEL-SAL | Sales Management | Sales | P1 | MISSING | Repo inspection | Not implemented | Customers, Products, Inventory | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-DEL-FIN | Basic Accounting & Financial Management | Finance | P1 | MISSING | Repo inspection | Not implemented | — | Yes (posting) | Implement frontend workflow per roadmap priority |
| TA-DEL-REP | Reports & Dashboard | Reports | P1 | PARTIAL | Repo inspection; dashboard vs reports | Dashboard partial; reports missing | — | Partial | Close documented frontend gaps; do not claim production complete |
| TA-DEL-BC | Barcode Integration | Hardware | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-DEL-IPR | Invoice Printer Integration | Hardware | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-DEL-BPR | Barcode Printer Integration | Hardware | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-DEL-DB | Database | Backend | P2 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-DEL-BE | Backend | Backend | P2 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-DEL-API | APIs | Backend | P2 | BLOCKED | Repo inspection | Requires backend/infra outside frontend-only scope | — | Yes | Document API/infra contract; defer implementation |
| TA-DEL-BK | Backup System | Backup | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-DEL-I18N | Arabic & English Interface | i18n | P1 | PARTIAL | UI inspection; i18n | Partial | — | Partial (UI now; APIs later) | Close documented frontend gaps; do not claim production complete |
| TA-DEL-DOC | Basic Documentation | Docs | P2 | PARTIAL | Repo inspection; `docs/**` | Design system + this annex set | — | No / process | Close documented frontend gaps; do not claim production complete |
| TA-DEL-TRN | User Training | Delivery | P2 | MISSING | Process | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-DEL-WALK | Operational Walkthrough | Delivery | P2 | MISSING | Process | Not implemented | — | No / process | Implement frontend workflow per roadmap priority |
| TA-DEL-SRC | Source Code after full payment | Delivery | P2 | PARTIAL | Repo exists; git repo | Frontend source present; full stack incomplete | — | No / process | Close documented frontend gaps; do not claim production complete |

### §27 Multi-currency pricing

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-27-01 | Multi-currency pricing USD/EGP | Pricing | P1 | PARTIAL | Items pricing tab/wizard fields persisted locally; `/price-lists` placeholder | No FX engine / price lists module | Items | Yes (for production) | Implement pricing services; keep Items fields |
| TA-27-02 | Purchase cost USD | Pricing | P1 | PARTIAL | Items pricing tab/wizard `costUsd`; local persist | No server pricing | — | Yes (for production) | Persist + calculate |
| TA-27-03 | Purchase cost local when needed | Pricing | P1 | PARTIAL | Items pricing tab/wizard `costEgp`; local persist | No server pricing | — | Yes (for production) | Persist + calculate |
| TA-27-04 | Sell price USD | Pricing | P1 | PARTIAL | Items pricing tab/wizard `sellUsd`; local persist | No server pricing | — | Yes (for production) | Persist + calculate |
| TA-27-05 | Target profit % | Pricing | P1 | PARTIAL | Items pricing tab/wizard `targetMarginPct`; local persist | No server pricing | — | Yes (for production) | Persist + calculate |
| TA-27-06 | Sell price EGP | Pricing | P1 | PARTIAL | Items table + pricing tab/wizard `sellEgp`; local persist | No server pricing | — | Yes (for production) | Persist + calculate |
| TA-27-07 | FX used in price calculation | Pricing | P1 | PARTIAL | Items pricing `exchangeRate` stored as entered; no auto apply | No approved FX service | Exchange Rates | Yes (for production) | Approved FX service |
| TA-27-08 | Last price update date | Pricing | P1 | PARTIAL | `priceUpdatedAt` updated on local price edits | Not server reprice jobs | — | Yes (for production) | Persist on reprice |
| TA-27-09 | FX source/type | Pricing | P1 | PARTIAL | Items pricing `exchangeRateSource`; local persist | No FX registry | Exchange Rates | Yes (for production) | FX source registry |
| TA-27-10 | Auto EGP = USD × approved FX | Pricing | P1 | MISSING | Honest UI note: no auto calculation | No auto calculation | Exchange Rates | Yes (for production) | Implement FX apply engine |
| TA-27-11 | Price from profit % per item/category | Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-27-12 | Retain FX used at last pricing | Pricing | P1 | PARTIAL | Local `priceHistory` snapshots on edit | Not server audit history | — | Yes (for production) | Persist FX snapshot history |

### §28 Exchange rates

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-28-01 | Dedicated FX management screen | Exchange Rates | P1 | PARTIAL | `/exchange-rates` + `exchange-rates-store`; manual rates; convert helper | Not live market; no auto apply to catalog | Pricing | Partial (UI now; APIs later) | Wire optional apply preview to items |
| TA-28-02 | Show current approved USD rate | Exchange Rates | P1 | MISSING | Repo inspection; dashboard FX mock | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-28-03 | Update USD rate | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-28-04 | Record update date/time & user | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-28-05 | Keep previous FX history | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-28-06 | Know rate used at each repricing | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-28-07 | Approved FX is basis for auto pricing | Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |

### §29 Automatic repricing

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-29-01 | Auto reprice on FX update | Auto Repricing | P1 | MISSING | Repo inspection; `/automatic-repricing` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-02 | Recalculate EGP sell prices | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-03 | Preserve USD sell price when needed | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-04 | Preserve item profit % | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-05 | Select items to reprice | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-06 | Preview changes before commit | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-29-07 | Authorized confirmation required for bulk price apply | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |

### §30 Bulk price updates

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-30-01 | Bulk price updates tools | Bulk Pricing | P1 | MISSING | Repo inspection; `/bulk-price-updates` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-02 | Raise/lower prices by percentage with preview & commit | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-03 | Update by category / selected set / product type | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-04 | Update by brand/manufacturer | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-05 | Manual exclusions | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-06 | Protected from automatic update | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-30-07 | Items unaffected by FX change | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |

### §31 Price history

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-31-01 | Full historical price-change log | Price History | P1 | MISSING | Repo inspection; `/price-history` | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-31-02 | Old/new price, % change, old/new FX | Price History | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-31-03 | Timestamp, user, reason, affected items | Price History | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-31-04 | Change type & source (manual/auto/bulk) | Price History | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |

### §32 Cross reference

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-32-01 | Cross Reference capability | Cross Reference | P1 | PARTIAL | `/cross-reference`; `cross-reference.test.ts`; CSV + typed refs | Frontend CRUD + typed refs + CSV on spare store | Server/multi-user persistence | Partial | Backend APIs |
| TA-32-02 | Link multiple OEM/Part/MPN/Alt/Compatible numbers | Cross Reference | P1 | PARTIAL | `typedReferences` + spine OEM/PN/MPN; migrate codes; CSV reference rows | Typed Alt/Compatible implemented frontend | Server durability | Partial | Persist on server |
| TA-32-03 | Define original vs alternative with manufacturer, number, compatibility, notes | Cross Reference | P1 | PARTIAL | `alternativeLinks` + persisted `relationshipType` + degree + notes; drawer/CSV | Full frontend workflow | Bidirectional optional; server | Partial | Server durability |
| TA-32-04 | Show alternatives when searching a part | Cross Reference | P1 | PARTIAL | Indexed `searchBlob`; spare details alts/cross-ref tabs; 5k bench | Client search OK; 100k/<2s blocked | TA-PERF-01 backend | Partial | Server search |

### §33 Import cost allocation

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-33-01 | Multiple allocation methods | Import Costs | P1 | MISSING | Repo inspection; `/import-costs` | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-02 | Allocate by value share | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-03 | Allocate by quantity | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-04 | Allocate by weight when available | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-05 | Manual allocation by authorized user | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-06 | Choose method per additional cost | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-07 | Preview pre/post allocation per item | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-33-08 | Review, approve, update final costs, keep allocation log | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |

### §34 Audit log

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-34-01 | Audit Log for sensitive operations | Audit | P1 | MISSING | Repo inspection; `/audit-log` | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-34-02 | Capture create/update/delete & domain events listed | Audit | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-34-03 | User, action type, module, record, old/new, timestamp, IP, details | Audit | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |
| TA-34-04 | Management review of who/when/what changed | Audit | P1 | MISSING | Repo inspection; dashboard activities | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

### §35 Additional acceptance

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-35-01 | Record item cost in USD | Pricing | P1 | PARTIAL | Items pricing tab UI | Not persisted / no API | — | Yes (for production) | Persist cost USD |
| TA-35-02 | Record sell price in USD | Pricing | P1 | PARTIAL | Items pricing tab UI | Not persisted / no API | — | Yes (for production) | Persist sell USD |
| TA-35-03 | Set profit percentage | Pricing | P1 | PARTIAL | Items pricing tab UI | Not persisted / no API | — | Yes (for production) | Persist margin |
| TA-35-04 | Compute EGP sell via approved FX | Pricing | P1 | MISSING | Items shows EGP field only | No approved-FX computation | Exchange Rates | Yes (for production) | FX compute engine |
| TA-35-05 | Edit USD rate from dedicated screen | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-06 | Persist FX history | Exchange Rates | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-07 | Reprice items from new FX | Auto Repricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-08 | Raise/lower group prices by % | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-09 | Update prices by category | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-10 | Update prices by brand | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-11 | Exclude items from repricing | Bulk Pricing | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-12 | Full price-change history | Price History | P1 | MISSING | Repo inspection | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-13 | Cross Reference support | Cross Reference | P1 | PARTIAL | Typed refs + CSV + directory | Frontend complete for browser-local | Production backend | Partial | — |
| TA-35-14 | Alternative parts support | Cross Reference | P1 | PARTIAL | `alternativeLinks` + relationshipType CRUD | Frontend | Production backend | Partial | — |
| TA-35-15 | Import cost allocation by value | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-16 | Import cost allocation by quantity | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-17 | Import cost allocation by weight | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-18 | Manual import cost allocation | Import Costs | P1 | MISSING | Repo inspection | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-35-19 | Audit Log for sensitive ops | Audit | P1 | MISSING | Repo inspection | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

### §36 In-scope confirmation

| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |
|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|
| TA-36-01 | Multi-Currency Pricing in scope (not CR) | Governance/Pricing | P1 | MISSING | Scope documented; feature absent; annex §36 | Not implemented | — | Partial | Implement frontend workflow per roadmap priority |
| TA-36-02 | USD/EGP Pricing in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-03 | Exchange Rate Management in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-04 | Automatic Repricing in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-05 | Bulk Price Updates in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-06 | Category-Based Price Updates in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-07 | Brand-Based Price Updates in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-08 | Price Exclusions in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-09 | Price History in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-10 | Exchange Rate History in scope | Pricing | P1 | MISSING | — | Not implemented | — | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-11 | Cross Reference in scope | Cross Reference | P1 | PARTIAL | Module live | Frontend scope | Backend | Partial | — |
| TA-36-12 | Alternative Parts in scope | Cross Reference | P1 | PARTIAL | Module live | Frontend scope | Backend | Partial | — |
| TA-36-13 | Multiple Import Cost Allocation Methods in scope | Import Costs | P1 | MISSING | — | Not implemented | Import shipments, Products, PO | Yes (for production) | Implement frontend workflow per roadmap priority |
| TA-36-14 | Audit Log in scope | Audit | P1 | MISSING | — | Not implemented | — | Yes | Implement frontend workflow per roadmap priority |

---

## 9. Confirmed functional gaps (high signal)

1. **Authentication & access-denied UI** — absent (TA-AC-01, TA-SEC-01).
2. **Users/roles/permissions administration** — placeholder (TA-RBAC-*, TA-AC-02).
3. **Items catalog** — frontend workflows closed 2026-10-26 final pass (CRUD/links/hydration/uncategorized integrity verified; unit 120/120); remaining PARTIAL/MISSING are backend (import, FX, TA-03-02-07 scale search) — see ITEMS_MODULE_IMPLEMENTATION.md.
4. **Marine engines + parts linkage** — frontend CRUD + live spare links done; sales history + server APIs open (TA-04-*, TA-AC-05/06).
5. **Warehouses & stock operations** — placeholders (TA-05-*, TA-AC-07–09).
6. **PO create/lines/qty/price** — mock list/detail only (TA-06-01-*, TA-AC-10).
7. **Goods receipts, shipments, import cost allocation methods** — placeholders (TA-06-02/03, TA-33-*, TA-AC-12/13).
8. **Customers & full sales cycle** (quote PDF/WhatsApp/email, invoices, returns) — placeholders (TA-08/09, TA-AC-14–17).
9. **Cashboxes, banks, receipts/payments, AR/AP balances & aging** — placeholders (TA-10-*, TA-AC-18–20).
10. **Reports modules** — placeholders (TA-11-*, TA-AC-21).
11. **Pricing/FX/repricing/bulk/history** — placeholders (TA-27–31, TA-35-*).
12. **Cross-reference / alternatives** — frontend PARTIAL (TA-32-*); `/cross-reference` live; browser-local.
13. **System audit log** — placeholder; supplier has client-only audit (TA-34-*).
14. **Backup & hardware integrations** — placeholders (TA-BK-*, TA-HW-*, TA-AC-23/25).
15. **Dashboard period filter → live metrics** — UI only (TA-12-13).

---

## 10. Recommended next module

See [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md) § Recommended next module: **Products / Spare Parts (Item Master + Search)**.

---

## 11. Maintenance

1. Update this matrix when a requirement’s status changes.
2. Keep `TA-*` IDs stable; sync notes with `REQUIREMENTS_TRACEABILITY.md`.
3. Never edit `TECHNICAL_ANNEX.md` to match incomplete code.
4. Frontend-only work may move MISSING → PARTIAL; production PASS for backend-dependent rows requires verified APIs/DB/authz.

---

*Generated from REQUIREMENTS_TRACEABILITY.md + 2026-10-21 audit refresh. Regenerator: `scripts/generate-compliance-matrix.mjs`.*
