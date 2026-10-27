# Frontend Implementation Roadmap — AZZAM MARINE ERP

> **Audit date:** 2026-10-21  
> **Compliance matrix:** [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md)  
> **Contract:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md)  
> **Traceability IDs:** [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md)  
> **Design system:** [`design-system/README.md`](./design-system/README.md) (mandatory; do not redesign)  
> **Constraint:** Frontend-only until backend is explicitly authorized. No Prisma / API routes / server auth in roadmap execution unless requested.

---

## 1. Current state (evidence-based)

| Area | State |
|------|--------|
| Shell / nav | 8 groups · **43** items · EN/AR + RTL/LTR prefs (Items + Spare Parts split) |
| Placeholders | Most primary nav pages still `ModulePlaceholder`; catalog trio is design-phase UI |
| Deep module | **Suppliers** — provisionally accepted for frontend phase |
| Thin mocks | Dashboard, PO list/detail, catalog design directories (`/items`, `/spare-parts`, `/marine-engines`), low-stock, supplier-linked purchase/payment records |
| Catalog design | Items / Spare Parts / Marine Engines directories + details with demo relationships — **not** workflow-complete |
| Tests | **46** supplier unit tests (`npm test`); no app-wide E2E suite in `package.json` |
| Backend | Absent — no `src/app/api`, no Prisma |
| Annex strict completion | **1.1%** PASS-only (governance rows) |
| Annex weighted progress | **~9.9%** (PASS=1, PARTIAL=0.5; excludes BLOCKED/NOT_REQUIRED) |
| Production readiness | **0% claimed** |

**Principle:** Finish coherent end-to-end frontend workflows. Prefer reusable patterns from Suppliers (directory, wizard, persist adapter, DateRangeFilter on lists, record routes, i18n packs, tests).

---

## 2. Recommended next module

### Products / Spare Parts — Item Master + Catalog Search

**Why first (after Suppliers):**

1. Annex acceptance puts **إدارة الأصناف** and **البحث عن الأصناف** early (TA-AC-03, TA-AC-04, TA-03-*).
2. Unblocks **PO line items**, goods receipts, inventory balances, sales lines, pricing/FX, engines linkage, and cross-reference.
3. Current asymmetry: Suppliers are deep; `/products` is still a placeholder while `/products/[partNumber]` is a thin mock — the catalog is the shared spine of the ERP.
4. Completing Purchase Orders *before* a real item master would invent disconnected line-item theater.

**Purchase Orders** is the immediate **second** module (closes supplier → PO workflow). Do not start PO deep work until product codes/part numbers exist in a queryable frontend store.

---

## 3. Next-module acceptance criteria (Products)

### In scope (frontend-only)

| # | Criterion | Annex IDs | Verification |
|---|-----------|-----------|--------------|
| 1 | Replace `/products` placeholder with dense directory (table + mobile cards) | TA-03-00, TA-AC-03 | Manual + unit tests |
| 2 | Item fields per annex 3.1 (code, AR/EN name, manufacturer, origin, OEM, Part Number, engine type link stub, image placeholder, UoM, min stock, cost, sell, status) | TA-03-01-* | Form + types tests |
| 3 | Create / edit / deactivate workflows with validation (EN/AR messages) | TA-02-02-01/02 | Unit + UI smoke |
| 4 | Search by name, code, Part Number, OEM, Serial, Barcode (client-side over seeded catalog; disclose scale limits) | TA-03-02-01…06, TA-AC-04 | Unit query tests |
| 5 | Detail route `/products/[partNumber]` (or stable id) shows full master; record navigation from list | TA-03-01, DATA_DENSE_INTERFACES | Route smoke |
| 6 | `DateRangeFilter` on list **only if** list shows time-bounded ops; for pure master directory prefer search/filter chips — follow date-range rule (dense list domains include inventory) | date-range-filter rule | Design review |
| 7 | EN/AR dictionaries + RTL/LTR parity | TA-LANG-*, TA-AC-24 | Viewport smoke script |
| 8 | Browser persistence adapter (pattern: `supplier-persist.ts`) with clear “demo persistence” disclosure | Frontend-only rule | Persist rehydrate tests |
| 9 | Global search: either keep nav search separate **or** add catalog results without claiming 100k/<2s | CF-11, TA-PERF-03 | Document limit |
| 10 | `npm run lint` / `typecheck` / `build` + new unit tests green | QA | CI-local |

### Explicitly out of scope for this slice

- Real multi-user DB, authz on product mutations  
- Proving 100k items / <2s search (BLOCKED without backend indexes)  
- Full stock ledger, PO posting, pricing engine apply  
- Claiming TA-PERF-* or production PASS

### Suggested API contract (future)

```
GET    /api/products?query=&oem=&partNumber=&barcode=&page=&pageSize=
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
GET    /api/products/search  # indexed; p95 < 2s target
```

---

## 4. Prioritized workstreams

### P0 — Critical functional / navigation / acceptance blockers

| Order | Task | Requirements | Modules | Dependencies | Frontend-only? | Acceptance criteria | Required tests |
|------:|------|--------------|---------|--------------|----------------|---------------------|----------------|
| 1 | **Auth shell: login + access-denied UI** (demo session; no real security claims) | TA-AC-01, TA-SEC-01, CF-01 | Auth | Design system forms | Yes (UI) | Routes `/login`, denied state; demo credentials documented as mock | Smoke + i18n keys |
| 2 | **Users & roles administration UI** (CRUD screens; stub permission matrix) | TA-RBAC-*, TA-02-01-*, TA-AC-02, TA-SEC-06 | Users | Auth shell | Yes (UI) | List/create/edit/disable user; role editor UI; disclose stub authz | Unit validation |
| 3 | **Wire nav permission preview** (optional demo personas) without claiming server RBAC | TA-SEC-02, CF-02 | Authz/Shell | Users UI | Yes | Switching mock persona hides nav items | Unit `canViewNavItem` |
| 4 | **Dashboard DateRangeFilter → recompute mock KPIs** | TA-12-13, CF-10 | Dashboard | mock-dashboard | Yes | Changing committed range changes visible KPI/chart series | Unit filter helpers |

> P0 auth/users are **UI readiness** for acceptance criteria. Real Authentication/RBAC remain **BLOCKED** until backend.

---

### P1 — Core annex workflows (implementation order)

| Order | Task | Requirements | Modules | Dependencies | Frontend-only? | Acceptance criteria | Required tests |
|------:|------|--------------|---------|--------------|----------------|---------------------|----------------|
| **1** | **Products item master + search** (NEXT) | TA-03-*, TA-AC-03/04, TA-DEL-PARTS | Products | Design patterns from Suppliers | Yes | See §3 | Query/persist/validation |
| 2 | **Purchase Orders full frontend cycle** | TA-06-01-*, TA-02-05-01, TA-AC-10, CF-10 | Purchasing | Products, Suppliers | Yes | Create PO with lines (product pick), qty, prices, currency, status; **wire** existing DateRangeFilter to filter the list (today state is unused); detail with lines | PO totals + period-filter unit tests |
| 3 | **Goods receipts UI** | TA-05-04, TA-02-02-03, TA-AC-08 | Purchasing/Inventory | PO | Yes | Receive against PO; update demo stock store | Association tests |
| 4 | **Warehouses master + balances view** | TA-05-01/02/11, TA-AC-07 | Warehouses | Products | Yes | Multi-warehouse list; per-warehouse qty display from demo store | Unit |
| 5 | **Stock movements / transfers / adjustments / stocktaking UIs** | TA-05-03…10, TA-AC-08/09 | Inventory | Warehouses, Products | Yes | Forms + movement history list; DateRangeFilter on lists | Unit ledger math (demo) |
| 6 | **Import shipments + containers** | TA-06-02-*, TA-AC-12 | Import | PO/Suppliers | Yes | Shipment fields per annex; status tracking UI | Unit |
| 7 | **Import cost allocation (value/qty/weight/manual) + preview** | TA-06-03-*, TA-33-*, TA-AC-13, TA-35-15…18 | Import Costs | Shipments, Products | Yes | Method selector; preview allocation; commit to demo landed cost | Allocation math unit tests |
| 8 | **Marine engines + link parts** | TA-04-*, TA-AC-05/06 | Engines | Products | Yes | Engine master; compatible parts list | Unit |
| 9 | **Cross-reference / alternatives** | TA-32-*, TA-35-13/14 | Cross Reference | Products | Yes | Multi-number links; show alts on product search | Unit |
| 10 | **Customers master** (mirror Suppliers patterns) | TA-08-*, TA-AC-14 | Customers | — | Yes | CRUD + detail tabs; demo AR fields disclosed | Persist/validation |
| 11 | **Quotations** (lines, totals, PDF export client-side; WhatsApp/email deep-links disclosed) | TA-09-01-*, TA-AC-15, AMB-02 | Sales | Customers, Products | Partial | Create quote; PDF; share links (not paid API) | Totals tests |
| 12 | **Sales invoices + returns UIs** | TA-09-02/03, TA-AC-16/17 | Sales | Customers, Products, Inventory demo | Yes | Cash/credit/transfer; return restock demo | Unit |
| 13 | **Pricing: price lists + FX screen + history UI** | TA-27/28/31, TA-35-01…06/12 | Pricing | Products | Yes | USD/EGP fields; FX update + history list; disclose auto-apply limits | FX math tests |
| 14 | **Auto repricing + bulk updates (preview/commit demo)** | TA-29/30, TA-35-07…11 | Pricing | FX, Products | Yes | Preview; exclusions; commit to demo store | Unit |
| 15 | **Cashboxes, banks, receipts/payments, balances UIs** | TA-10-*, TA-AC-18…20 | Finance | Customers, Suppliers | Yes | Movements UI; demo balances; aging table UI | Unit |
| 16 | **Reports pages** (client aggregates from demo stores) | TA-11-*, TA-AC-21 | Reports | Prior modules’ demo data | Yes | Each report route renders meaningful tables/charts from demo | Smoke |
| 17 | **Audit log UI** (aggregate client events; disclose ≠ server audit) | TA-34-*, TA-35-19 | Audit | Module client audits | Partial | Filterable event list | Unit |
| 18 | **Hardware & backup settings UX** (status, config forms; no fake success) | TA-HW-*, TA-BK-*, TA-AC-23/25 | Settings | — | UI only; ops BLOCKED | Honest empty/disabled states | Smoke |
| 19 | **Dashboard role-filtered widgets + best-sellers KPI** | TA-12-*, TA-12-10/12 | Dashboard | Auth stub, demo data | Yes | Persona filter; annex KPIs present | Unit |

---

### P2 — Integration, usability, responsive, accessibility

| Order | Task | Requirements | Notes |
|------:|------|--------------|-------|
| 1 | Per-module Playwright viewport matrix (pattern: `supplier-viewport-qa.mjs`) | TA-LANG-03, responsive rules | After each P1 module |
| 2 | Expand global search to catalog without breaking nav jump | CF-11 | After Products |
| 3 | Accessibility pass (focus traps, contrast, keyboard tables) | design-system ACCESSIBILITY | Shared components first |
| 4 | Content discipline / empty-error-loading consistency across new modules | CONTENT_DISCIPLINE | Shared patterns |
| 5 | Low-stock page: DateRangeFilter if treated as dense inventory list; link to products | TA-05-14, date-range rule | Small follow-up |
| 6 | Supplier residual: CSV import or keep disclosed unavailable; AP aging when finance exists | TA-07-*, AP | After Finance |
| 7 | Documentation: update matrix + traceability after each module | PROJECT_COMPLIANCE_RULES | Mandatory |

---

### P3 — Optional enhancements (not required by annex)

| Task | Note |
|------|------|
| Extra dashboard visual polish beyond annex KPIs | Only if no P0/P1 debt |
| Additional export formats beyond CSV/PDF needed for ops | Confirm vs CR |
| Performance virtualization demos for large **client** lists | Disclose ≠ production 100k search |
| Storybook / component gallery | Not in annex |

---

## 5. Suggested overall sequence (swimlane)

```
P0a Auth UI ─┐
P0b Users UI ┼─► (can parallelize lightly with Products)
P0c Dashboard period wire ─┘

P1-1 Products (NEXT)
   └─► P1-2 Purchase Orders
         └─► P1-3 Goods Receipts
               └─► P1-4 Warehouses
                     └─► P1-5 Stock ops
                           └─► P1-6/7 Import + landed cost
P1-1 Products ─► P1-8 Engines ─► P1-9 Cross-ref
P1-1 Products ─► P1-10 Customers ─► P1-11…12 Sales
P1-1 Products ─► P1-13…14 Pricing/FX
Suppliers + Customers + Sales/Purchasing ─► P1-15 Finance ─► P1-16 Reports
Client events ─► P1-17 Audit UI
P1-18 Hardware/Backup UX (honest)
P1-19 Dashboard completion
Ongoing P2 QA/viewport/a11y after each module
```

---

## 6. Frontend vs backend lane

| Lane | Work now | Defer |
|------|----------|-------|
| Frontend | Screens, validation, demo stores, allocation/FX **preview math**, i18n, responsive, unit tests | Claiming posting, multi-user, device I/O, daily backup jobs |
| Backend (future) | — | DB schema, APIs, authn/z, indexes for 100k search, audit integrity, hardware bridges, backup jobs, concurrent users |

Every demo store must remain **labeled** in UI/docs. Never present mock balances as live operational data.

---

## 7. Performance & scale plan

| Annex target | Frontend actions | Backend/infra actions | Verifiable now? |
|--------------|------------------|-----------------------|-----------------|
| 100k+ items | Virtualized lists, paginated UI, debounce search | DB indexes, search service, pagination APIs | No |
| Search <2s | Optimistic UI, request cancellation | Query optimization, caching | No (no API) |
| >20 concurrent users | Avoid assuming localStorage is shared truth | Stateless APIs, sessions, locking | No |

---

## 8. Definition of done (any roadmap task)

1. Annex IDs listed and matrix updated (`PARTIAL`/`PASS` only with evidence).  
2. Design-system compliance (tokens, RTL/LTR, responsive, content discipline).  
3. `npm run lint` · `typecheck` · `build` green.  
4. Unit tests for pure logic (validation, money, allocation, queries).  
5. No false production/backend claims.  
6. Traceability notes updated in `REQUIREMENTS_TRACEABILITY.md`.

---

## 9. What not to do next

- Do **not** implement multiple unrelated modules in parallel without finishing Products acceptance.  
- Do **not** deepen Supplier AP theater without Finance/PO posting design.  
- Do **not** add Prisma/API “just to make the audit look better.”  
- Do **not** redesign the visual language.

---

## 10. Immediate next action (when implementation is authorized)

**Start P1-1: Products / Spare Parts (Item Master + Search)** using Suppliers as the structural reference implementation, and close P0 dashboard period wiring as a small parallel task if capacity allows.

Auth/Users P0 UI may proceed in parallel only if it does not starve the Products spine.
