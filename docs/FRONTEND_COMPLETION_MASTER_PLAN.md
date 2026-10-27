# Frontend Completion Master Plan — AZZAM MARINE ERP

> **Created:** 2026-10-22  
> **Contract:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md)  
> **Compliance matrix:** [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md)  
> **Constraint:** Frontend-only. No API routes, Prisma, server auth, or backend infra.  
> **Status vocabulary:** PASS · PARTIAL · MISSING · BLOCKED · NOT TESTED · NOT REQUIRED

---

## 1. Mission

Eliminate every *avoidable* frontend gap against the technical annex while preserving working Items, Suppliers, and Items↔Suppliers integrations. Backend-dependent acceptance criteria remain BLOCKED and must be documented, not faked.

---

## 2. Baseline inventory (matrix audit 2026-10-22)

| Status | Count (baseline 2026-10-21) | Count (refresh 2026-10-22 wave) |
|--------|------:|------:|
| PASS | 4 | 4 |
| PARTIAL | 96 | **106** |
| MISSING | 256 | **246** |
| BLOCKED | 12 | 12 |
| NOT TESTED | 6 | 6 |
| NOT REQUIRED | 3 | 3 |
| **Total TA-* rows** | **377** | **377** |

**Weighted progress (PASS=1, PARTIAL=0.5; excl. BLOCKED + NOT_REQUIRED):** ~15.8% (was ~14.4%)  
**Strict PASS-only:** ~1.1%  
**Placeholder nav pages remaining:** ~28 (was ~33+)

> These percentages are inventory metrics only — **not** production readiness.

### By module (matrix module column)

| Module | PASS | PARTIAL | MISSING | BLOCKED | NOT_TESTED | NOT_REQUIRED |
|--------|-----:|--------:|--------:|--------:|-----------:|-------------:|
| AP | 0 | 0 | 4 | 0 | 0 | 0 |
| AR | 0 | 0 | 4 | 0 | 0 | 0 |
| Adjustments | 0 | 0 | 1 | 0 | 0 | 0 |
| Aging | 0 | 0 | 1 | 0 | 0 | 0 |
| Audit | 0 | 0 | 6 | 0 | 0 | 0 |
| Audit/Ops | 0 | 0 | 1 | 0 | 0 | 0 |
| Auth | 0 | 0 | 2 | 0 | 0 | 0 |
| Authz | 0 | 0 | 6 | 0 | 0 | 0 |
| Auto Repricing | 0 | 0 | 8 | 0 | 0 | 0 |
| Backend | 0 | 0 | 0 | 3 | 0 | 0 |
| Backup | 0 | 0 | 3 | 4 | 0 | 0 |
| Banks | 0 | 0 | 4 | 0 | 0 | 0 |
| Bulk Pricing | 0 | 0 | 11 | 0 | 0 | 0 |
| Cashboxes | 0 | 0 | 4 | 0 | 0 | 0 |
| Commercial | 0 | 0 | 0 | 0 | 0 | 2 |
| Cross Reference | 0 | 0 | 8 | 0 | 0 | 0 |
| Customers | 0 | 0 | 9 | 0 | 0 | 0 |
| Dashboard | 0 | 13 | 2 | 0 | 0 | 0 |
| Delivery | 0 | 3 | 5 | 1 | 4 | 0 |
| Docs | 0 | 1 | 0 | 0 | 0 | 0 |
| Engines | 0 | 3 | 5 | 0 | 0 | 0 |
| Engines/Products | 0 | 1 | 0 | 0 | 0 | 0 |
| Engines/Sales | 0 | 0 | 1 | 0 | 0 | 0 |
| Exchange Rates | 0 | 0 | 8 | 0 | 0 | 0 |
| Finance | 0 | 0 | 8 | 0 | 0 | 0 |
| Finance/AR | 0 | 0 | 1 | 0 | 0 | 0 |
| Goods Receipts | 0 | 0 | 1 | 0 | 0 | 0 |
| Governance | 4 | 0 | 0 | 0 | 0 | 0 |
| Governance/Pricing | 0 | 0 | 1 | 0 | 0 | 0 |
| Hardware | 0 | 0 | 8 | 0 | 0 | 0 |
| Import | 0 | 0 | 13 | 0 | 0 | 0 |
| Import Costs | 0 | 0 | 19 | 0 | 0 | 0 |
| Inventory | 0 | 4 | 6 | 0 | 0 | 0 |
| Invoices | 0 | 0 | 4 | 0 | 0 | 0 |
| Movements | 0 | 0 | 2 | 0 | 0 | 0 |
| Ops | 0 | 0 | 0 | 1 | 0 | 0 |
| Platform | 0 | 2 | 0 | 2 | 0 | 1 |
| Price History | 0 | 0 | 5 | 0 | 0 | 0 |
| Pricing | 0 | 13 | 13 | 0 | 0 | 0 |
| Products | 0 | 24 | 5 | 0 | 0 | 0 |
| Products/Pricing | 0 | 0 | 1 | 0 | 0 | 0 |
| Purchasing | 0 | 10 | 3 | 0 | 0 | 0 |
| Purchasing/Import | 0 | 1 | 0 | 0 | 0 | 0 |
| QA | 0 | 1 | 12 | 1 | 1 | 0 |
| Quotations | 0 | 0 | 5 | 0 | 0 | 0 |
| Reports | 0 | 1 | 15 | 0 | 0 | 0 |
| Reports/Inventory | 0 | 0 | 2 | 0 | 0 | 0 |
| Returns | 0 | 0 | 1 | 0 | 0 | 0 |
| Returns/AR | 0 | 0 | 1 | 0 | 0 | 0 |
| Returns/Finance | 0 | 0 | 1 | 0 | 0 | 0 |
| Returns/Inventory | 0 | 0 | 2 | 0 | 0 | 0 |
| Roles | 0 | 0 | 2 | 0 | 0 | 0 |
| Sales | 0 | 0 | 10 | 0 | 0 | 0 |
| Settings | 0 | 0 | 3 | 0 | 0 | 0 |
| Statements | 0 | 0 | 1 | 0 | 0 | 0 |
| Stock | 0 | 0 | 2 | 0 | 0 | 0 |
| Stocktaking | 0 | 0 | 4 | 0 | 0 | 0 |
| Suppliers | 0 | 13 | 0 | 0 | 0 | 0 |
| Transfers | 0 | 0 | 2 | 0 | 0 | 0 |
| Users | 0 | 0 | 5 | 0 | 0 | 0 |
| Users/RBAC | 0 | 1 | 1 | 0 | 0 | 0 |
| Warehouses | 0 | 0 | 4 | 0 | 0 | 0 |
| i18n | 0 | 5 | 0 | 0 | 1 | 0 |

---

## 3. Route / implementation reality (code inspection)

| Bucket | Evidence |
|--------|----------|
| Deep interactive | `/suppliers`, `/items` (+ details), item↔supplier links |
| Design directories (partial) | `/spare-parts`, `/marine-engines`, dashboard mocks, PO mock list/detail, low-stock mock |
| Placeholders (`ModulePlaceholder`) | warehouses, stock-*, goods-receipts, imports, customers, sales-*, pricing-*, finance-*, reports-*, audit-log, cross-reference, settings-* (~33 routes) |
| Shared stores today | `items-store`, `suppliers-store`, `item-suppliers-store`, `preference-store` |

---

## 4. Module execution board

| Module | Annex areas | Phase | Current plan status |
|--------|-------------|-------|---------------------|
| Dashboard | Dashboard | Phase 6 | PARTIAL — DateRangeFilter / KPIs need live store wiring |
| Items | Products | Done (frontend) — CLOSED 2026-10-26 | CRUD + details + supplier links + bulk/CSV + IndexedDB image + relatedEngineType + uncategorized≠other; unit 120/120; QA 32/32 + links 8/8 + hydration 13/13 — PARTIAL vs annex (no server) |
| Spare Parts | Products/Engines | Phase 3 | Directory exists; deepen CRUD/OEM/cross-ref |
| Marine Engines | Engines | Phase 3 | Directory exists; deepen CRUD + compat links |
| Items↔Suppliers | Products/Suppliers | Done (frontend) | Shared item-suppliers-store verified |
| Suppliers | Suppliers | Done (frontend) | Deepest module — preserve |
| Warehouses | Warehouses/Inventory | Phase 3 — NEXT | Placeholder → master + balances |
| Stock movements | Movements/Stock | Phase 4 | Placeholder |
| Stock transfers | Transfers | Phase 4 | Placeholder |
| Stock adjustments | Adjustments | Phase 4 | Placeholder |
| Stocktaking | Stocktaking | Phase 4 | Placeholder |
| Low stock | Inventory | Phase 4 | Mock list — wire to stock store |
| Purchase Orders | Purchasing | Phase 4 — NEXT | Mock list/detail → real CRUD lines |
| Goods Receipts | Goods Receipts | Phase 4 | Placeholder |
| Import shipments | Import | Phase 4 | Placeholder |
| Import costs | Import Costs | Phase 4 | Placeholder |
| Customers | Customers | Phase 3 — NEXT | Placeholder |
| Quotations | Quotations/Sales | Phase 4 | Placeholder |
| Sales invoices | Invoices | Phase 4 | Placeholder |
| Sales returns | Returns | Phase 4 | Placeholder |
| Exchange rates | Exchange Rates | Phase 5 | Placeholder |
| Price lists / history / bulk / auto | Pricing | Phase 5 | Placeholders |
| Cashboxes / banks / receipts | Finance | Phase 5 | Placeholders |
| Customer/Supplier balances | AR/AP | Phase 5 | Placeholders |
| Reports (all) | Reports | Phase 6 | Placeholders |
| Cross reference | Cross Reference | Phase 6 | Placeholder |
| Audit log | Audit | Phase 6 | Placeholder |
| Users / settings / hardware / backup | Users/Settings | Phase 6 | Placeholders; HW/BK often BLOCKED |

---

## 5. Phased execution checklist

### Phase 1 — Audit & baseline ✅
- [x] Read annex + matrix + roadmap + AGENTS
- [x] Count statuses (377 requirements)
- [x] Identify placeholder vs deep routes
- [x] Create this master plan
- [x] Record `npm test` / lint / typecheck / build (103 tests PASS)

### Phase 2 — Foundation ✅ (partial)
- [x] Shared browser catalog store helper (versioned localStorage)
- [x] Client activity/audit aggregator skeleton
- [ ] Fix dashboard DateRangeFilter → recompute from stores where data exists

### Phase 3 — Master data 🟡
- [x] Warehouses CRUD directory
- [x] Customers CRUD directory
- [x] Spare Parts directory UI (grid/list, filters, KPIs) — 2026-10-26; persist + OEM/compat CRUD still open
- [ ] Marine Engines deepen (persist + compat parts)
- [x] Preserve Items + Suppliers (unit regression still green)

### Phase 4 — Operational workflows 🟡
- [x] Purchase Orders CRUD with lines (supplier + item pick)
- [x] Goods receipts against PO + stock updates
- [x] Inventory movements / transfers / adjustments
- [ ] Stocktaking UI
- [ ] Import shipments + cost allocation (value/qty/weight/manual)
- [ ] Quotations + sales invoices + returns (drafts)

### Phase 5 — Pricing & finance UI 🟡
- [x] Exchange rates + history screen
- [ ] Bulk / auto repricing preview+commit (browser)
- [ ] Cashboxes, banks, receipts/payments demo stores
- [ ] AR/AP statement views from local transactions
- [ ] Honest BLOCKED labels for real posting/bank sync

### Phase 6 — Cross-cutting 🟡
- [ ] Dashboard live aggregates
- [ ] Reports from stores (empty when no data)
- [ ] Cross-reference relationships
- [x] Audit log UI from client events (empty until writers hooked)
- [ ] Users/roles demo UI + login shell
- [ ] Settings honesty (hardware/backup BLOCKED)

### Phase 7 — QA & hardening 🟡
- [x] Unit tests for new warehouse/customer/PO/GR stores
- [ ] Browser QA scripts for PO→GR→stock flow
- [ ] EN/AR + viewport spot checks on new pages
- [x] Update compliance matrix with evidence (selected rows)
- [ ] Full annex re-score + final verdict when FE gaps closed

---

## 6. Requirement-level register

Full row-level register is maintained in [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md) (authoritative status column).  
This plan tracks **execution progress**; the matrix tracks **annex compliance evidence**.

### Frontend-completable priority queue (dependency order)

| # | Work package | Primary TA-* | Depends on | Target status after FE |
|--:|--------------|--------------|------------|------------------------|
| 1 | Warehouses master | TA-05-01, TA-05-02, TA-AC-07 | Items | PARTIAL |
| 2 | Inventory stock ledger | TA-05-03…11 | Warehouses, Items | PARTIAL |
| 3 | Purchase Orders CRUD | TA-06-01-*, TA-AC-10 | Suppliers, Items | PARTIAL |
| 4 | Goods receipts | TA-05-04, TA-AC-08 | PO, Warehouses | PARTIAL |
| 5 | Customers master | TA-08-*, TA-AC-14 | — | PARTIAL |
| 6 | Sales docs | TA-09-* | Customers, Items | PARTIAL |
| 7 | Import + landed cost | TA-06-02/03, TA-33-* | PO, Items | PARTIAL |
| 8 | FX + pricing tools | TA-27…31, TA-35-* | Items | PARTIAL |
| 9 | Finance UI | TA-10-* | Customers, Suppliers | PARTIAL |
| 10 | Reports + dashboard | TA-11/12 | Prior stores | PARTIAL |
| 11 | Cross-ref + engines/spares deepen | TA-04, TA-32 | Items | PARTIAL |
| 12 | Audit + users demo | TA-34, TA-RBAC, TA-AC-01 | — | PARTIAL / BLOCKED (security) |

### Explicitly BLOCKED (backend / infra)

- Multi-user DB, APIs, server authz, server audit integrity
- Hardware device drivers / real printers-scanners
- Automatic backup/restore to enterprise storage
- 100k-item indexed search SLAs
- Real bank/payment gateway posting
- Email/SMS/WhatsApp paid delivery APIs

---

## 7. Execution log

| When | Checkpoint | Notes |
|------|------------|-------|
| 2026-10-22 | Plan created | Baseline matrix counts frozen above; implementation starts Phase 2→3 with Warehouses + Customers + PO |
| 2026-10-22 | Phase 2 foundation | `browser-entity-store.ts` shared helper |
| 2026-10-22 | Phase 3 warehouses | `warehouses-store` + directory UI wired; unit tests PASS |
| 2026-10-22 | Phase 3/4 spine stores | `customers-store`, `purchase-orders-store`, `goods-receipts-store`, `inventory-stock-store`, `exchange-rates-store` |
| 2026-10-22 | Phase 5 FX UI | `/exchange-rates` directory (manual rates + convert helper) |
| 2026-10-22 | UI wiring | Customers, PO, GR, stock transfers/movements, exchange rates directories wired |
| 2026-10-22 | QA gate | `npm test` **103 PASS**; lint/typecheck/build **PASS** |
| 2026-10-22 | Matrix refresh | TA-05-01…04, TA-06-01-05, TA-08-01, TA-AC-07/08/10/14, TA-28-01 → PARTIAL |
| 2026-10-22 | Subagent reconcile | Route audit + customers/PO/GR/stock UI verified; `npm test` 103 PASS; **28** placeholder pages remain (audit’s 36 was pre-wave) |

---

## 8. Definition of done (frontend scope)

Accept **FRONTEND SCOPE COMPLETE — BACKEND EXCLUDED** only when:

1. No avoidable MISSING frontend workflows remain for annex modules that are FE-feasible.
2. Every TA-* has an evidence-based status.
3. Items + Suppliers + item↔supplier links still pass regression.
4. `npm test`, lint, typecheck, build executed with recorded results.
5. Browser QA executed for critical new workflows.
6. Remaining gaps are only BLOCKED / disclosed PARTIAL backend limits / NOT REQUIRED.

Until then, verdict remains **INCOMPLETE — FRONTEND REQUIREMENTS REMAIN** or **FRONTEND SUBSTANTIALLY COMPLETE — DOCUMENTED GAPS REMAIN**.

---

## 9. Sample requirement rows (template)

| ID | Annex | Module | Required behavior | Status | Missing | Planned | Test | Evidence |
|----|-------|--------|-------------------|--------|---------|---------|------|----------|
| TA-05-01 | مخازن | Warehouses | Multi-warehouse master | MISSING | Placeholder route | CRUD + persist | unit+browser | TBD |
| TA-06-01-05 | 6.1 | Purchasing | PO line items | MISSING | Mock header only | Lines + item pick | unit | TBD |
| TA-08-01 | عملاء | Customers | Customer profile | MISSING | Placeholder | Mirror suppliers pattern | unit+browser | TBD |
| TA-03-00 | أصناف | Products | Item master | PARTIAL | No server | Keep; deepen links | existing | ITEMS_MODULE_IMPLEMENTATION.md |
| TA-07-01 | موردون | Suppliers | Supplier profile | PARTIAL | No AP server | Preserve | existing | SUPPLIER_MODULE_* |
| TA-DEL-BE | Deliverables | Backend | Backend delivery | BLOCKED | No backend in scope | — | — | Explicit exclusion |

*Full 377-row detail lives in the compliance matrix; update both when status changes.*
