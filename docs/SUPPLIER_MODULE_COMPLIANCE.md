# AZZAM MARINE ERP — Supplier Module Compliance

**Authoritative compliance record** for:

- `/suppliers` (Suppliers List)
- `/suppliers/[id]` (Supplier Details; verified with `sup-alexandria`)

**Date:** 2026-10-21  
**Scope:** Frontend-only Next.js App Router  
**Annex authority:** `docs/TECHNICAL_ANNEX.md` § إدارة الموردين  
**Design authority:** `docs/design-system/*` (Precision Marine Enterprise)  
**Related:** `docs/SUPPLIER_MODULE_IMPLEMENTATION.md` (CRUD + persist), `docs/SUPPLIER_MODULE_AUDIT.md` (historical gap log), `docs/REQUIREMENTS_TRACEABILITY.md` (`TA-07-*`)

---

## Status key

| Status | Meaning |
| --- | --- |
| **PASS** | Implemented and verified against available frontend data |
| **PARTIAL** | Present with honest mock limits or incomplete annex depth |
| **FAIL** | Missing or incorrect for an in-scope frontend capability |
| **BLOCKED** | Requires backend / AP / DMS / accounting not in this repo |

---

## 1. Technical annex — supplier requirements

| ID | Requirement | Status | Evidence / notes |
| --- | --- | --- | --- |
| TA-07-01 | Integrated supplier profile | PARTIAL | Details: identity, tabs, KPIs, charts, master data — mock analytics |
| TA-07-02 | Name, country, phone, email, WhatsApp, bank, basics | PASS | `types/supplier.ts`, form, contact/bank tabs; IBAN masked on view |
| TA-07-03 | Purchase orders history | PARTIAL | Orders tab + ledger + `/purchase-orders/[id]`; no PO line items UI |
| TA-07-04 | Purchases history | PARTIAL | Purchases tab + `/purchases/[id]` mock records |
| TA-07-05 | Payments history | PARTIAL | Payments tab + `/supplier-payments/[id]` mock records |
| TA-07-06 | Current balance | PARTIAL | Seed invariant `balance = purchases − payments` (USD); not AP posting |
| TA-07-07 | Account statement | PARTIAL | Debit/credit/reference/running balance; period recompute; demo ledger |
| TA-07-08 | Transaction history | PARTIAL | History tab (debit/credit, no running balance) |
| TA-07-09 | Persistence | PARTIAL | Browser `localStorage` (`azzam-marine:suppliers:v1`); not multi-user DB — see IMPLEMENTATION.md |
| Documents | Upload / manage | PARTIAL | IndexedDB + meta localStorage adapter; Documents tab + wizard step 5 — not server DMS |
| Audit (supplier) | Mutation trail | PARTIAL | `supplier-audit.ts` browser log; not server RBAC audit |
| Supplier code | Unique code | PASS | Field + uniqueness check + search/export |
| Import cost allocation | Inside supplier profile | N/A | Belongs to import modules (`/import-costs`, shipments) |
| Debt aging | Supplier aging | BLOCKED | No accounting module wired |

---

## 2. Design system & shell

| Rule | Status | Evidence |
| --- | --- | --- |
| Official logo / navy shell / marine blue actions | PASS | Existing shell; no logo redraw |
| Tokens / Lucide / no neon clutter | PASS | `--am-*`, Lucide icons |
| Content discipline (no filler subtitles) | PASS | List/details headings without marketing blurbs |
| DateRangeFilter on dashboard + dense lists only | PASS | Suppliers directory list; omitted on supplier/PO/payment detail records |
| Adaptive full-height / single primary scroll | PASS | `am-page--flow` + shell `min-h-full` (list scrolls via `main`) |
| No overflow-hidden to hide broken layout | PASS | List surface uses `overflow-x-clip` only |
| Charts: container-driven, EN/AR labels | PARTIAL | Recharts + DonutChartPanel; monthly series is deterministic split |
| Preferences zero-flicker | PASS | Boot script + cookie mirror (`preferences.ts`) — unchanged |

---

## 3. Localization & interaction

| Rule | Status | Evidence |
| --- | --- | --- |
| Arabic RTL + English LTR | PASS | `src/i18n/suppliers.ts` + locale provider |
| Centralized strings | PASS | No scattered hardcodes for audited UI |
| Currency presentation | PASS | Supplier reporting currency USD labeled via `formatMoney` |
| Subtle motion / reduced-motion | PASS | `am-transition-*`; no bounce animations added |
| Accessibility basics | PARTIAL | Tabs `role`/`aria-selected`; charts `aria-labelledby`; IBAN masked |

---

## 4. Suppliers List — capability matrix

| Capability | Status | Notes |
| --- | --- | --- |
| KPI counts (total/active/inactive) | PASS | `computeSupplierSummary` |
| KPI financials (purchases/payments/outstanding USD) | PASS | Sum of seed fields |
| Fabricated trend % | PASS (removed) | No fake growth % on list KPIs |
| Search name/phone/email/tax/WhatsApp | PASS | Client filter (`supplier-query.ts`) |
| Filters status/country/category/balance + clear | PASS | Combined; badge count |
| Period filter (last transaction) | PASS | Wired to `filterSuppliers` period arg |
| Table + mobile cards + row → correct supplier | PASS | Drawer preview by id; profile link by id |
| Pagination + page size + selection | PASS | Local slice; selection does not mutate others |
| Create/edit validation (email/phone) | PASS | 6-step create/edit wizard; localStorage persist — see IMPLEMENTATION.md |
| Delete / deactivate | PASS | History → deactivate; no history → delete |
| Export CSV | PASS | Client export of filtered rows |
| Import CSV | PARTIAL | Explicit unavailable dialog (dashed control + `importSoon`) |

---

## 5. Supplier Details — capability matrix

| Capability | Status | Notes |
| --- | --- | --- |
| Route resolves `sup-alexandria` (not hardcoded UI) | PASS | `findSupplierInStore(id)` |
| `?tab=` deep link | PASS | `useSearchParams` |
| Header identity + actions | PASS | Status, meta chips, edit, new action |
| Overview KPIs (purchases/payments/balance/open PO/last Tx) | PASS | From record + ledger |
| Supply commitment ring | PARTIAL | Deterministic mock % — not measured SLA |
| Charts (combo / category / PO status) | PARTIAL | Internally consistent mock; not live warehouse |
| Recent tables + View all | PASS | Navigates to tabs; row hrefs to records |
| PO / purchase / payment navigation | PASS | Ledger-backed routes return 200 |
| Statement debit/credit/running balance | PARTIAL | Demo; reconciles to `supplier.balance` |
| Contact + bank (IBAN masked) | PASS | Full IBAN only in edit form |
| Documents tab | PARTIAL | Upload/list/download/replace/remove via browser adapter + activity list |
| Import workflow engine | N/A / BLOCKED | Out of page scope |

---

## 6. Data integrity checks (verified)

| Check | Result |
| --- | --- |
| Seed count | 22 suppliers |
| `balance === purchases − payments` | All rows PASS |
| Duplicate PO / PI ids | None |
| Alexandria POs resolve via ledger | PASS (`PO-2025-0037`, `0048`, `0061`) |
| Statement last running balance = `supplier.balance` | By construction in `getSupplierAnalytics` |

---

## 7. Files inspected (primary)

- `src/components/suppliers/*`
- `src/config/mock-suppliers.ts`, `mock-supplier-ledger.ts`, `mock-supplier-analytics.ts`
- `src/lib/supplier-query.ts`, `suppliers-store.ts`, `record-routes.ts`, `format.ts`, `preferences.ts`
- `src/components/layout/app-shell.tsx`, `page-frame.tsx`
- `src/i18n/suppliers.ts`
- `src/app/(erp)/suppliers/**`, `purchases/[id]`, `supplier-payments/[id]`, `purchase-orders/[id]`
- `docs/TECHNICAL_ANNEX.md`, `docs/design-system/*`, `docs/REQUIREMENTS_TRACEABILITY.md`

---

## 8. Files modified in this compliance pass

- `src/lib/format.ts` — `maskAccountNumber`
- `src/components/suppliers/supplier-details-view.tsx` — masked IBAN; documents unavailable copy
- `src/components/suppliers/supplier-preview-drawer.tsx` — masked IBAN
- `src/components/suppliers/suppliers-directory.tsx` — import control styling
- `src/i18n/suppliers.ts` — `documentsUnavailable`
- `docs/SUPPLIER_MODULE_COMPLIANCE.md` — **this file**
- `docs/SUPPLIER_MODULE_AUDIT.md` — pointer to this document
- `docs/REQUIREMENTS_TRACEABILITY.md` — CF-09 / TA-07 notes

*(Prior gap-closure already delivered ledger routes, statement columns, scroll fix, trend removal, period filter — see audit log.)*

---

## 9. Verification evidence

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `GET /suppliers` | 200 |
| `GET /suppliers/sup-alexandria` | 200 |
| `GET /suppliers/sup-alexandria?tab=orders` | 200 |
| `GET /suppliers/sup-alexandria?tab=statement` | 200 |
| `GET /purchase-orders/PO-2025-0037` | 200 |
| `GET /purchases/PI-2025-0101` | 200 |
| `GET /supplier-payments/PAY-2025-0076` | 200 |
| `GET /dashboard` (shell regression smoke) | 200 |
| Automated unit tests | **None defined** in `package.json` |
| Full visual viewport lab (1920→360) | Code-path responsive grids verified; no device lab automation |

---

## 10. Remaining blockers / limitations

1. **No backend / AP ledger** — all financial analytics are deterministic demo data.
2. **Persistence** — supplier master uses browser `localStorage` (survives refresh; not multi-user).
3. **CSV import** — unavailable until sync exists (UI discloses this).
4. **Documents / DMS** — browser IndexedDB adapter only; not authorized multi-user storage.
5. **RBAC / server audit** — UI + local audit trail only; no backend enforcement.
6. **PO line items / import cost allocation / debt aging** — other modules or blocked.
7. **Supply commitment %** — mock indicator only.
8. **Dashboard sample POs** may still use EGP amounts; supplier-linked POs are USD and labeled.

---

## 11. Conflicts

| ID | Conflict | Resolution |
| --- | --- | --- |
| CF-09 | Annex implies full AP depth; repo is frontend-only | Keep `PARTIALLY_IMPLEMENTED` / BLOCKED where persistence or ledger required; do not claim production accounting |

---

## Definition of done (frontend scope)

Feasible in-scope supplier list + details workflows are implemented, identity/navigation/search/filter/statement presentation are consistent with mock data, design-system and scroll rules are respected, and remaining annex depth is classified BLOCKED/PARTIAL with evidence — not presented as complete backend accounting.
