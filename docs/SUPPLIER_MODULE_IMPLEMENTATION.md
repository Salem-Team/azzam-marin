# AZZAM MARINE ERP — Supplier Module Implementation

**Routes:** `/suppliers`, `/suppliers/[id]` (e.g. `/suppliers/sup-alexandria`)  
**Date:** 2026-10-21  
**Scope:** Frontend-only CRUD + browser persistence + document/audit adapters  
**Annex:** `docs/TECHNICAL_ANNEX.md` § إدارة الموردين  
**Related:** `docs/SUPPLIER_MODULE_COMPLIANCE.md`, `docs/SUPPLIER_MODULE_VERIFICATION.md`

> `localStorage` / IndexedDB persistence is a **frontend development adapter**, not a production multi-user database, DMS, or RBAC backend.

---

## Status key

| Status | Meaning |
| --- | --- |
| **PASS** | Implemented and verified by execution within frontend adapter scope |
| **PARTIAL** | Present with documented limits |
| **FAIL** | Missing or incorrect |
| **BLOCKED** | Requires backend / accounting / server DMS / real RBAC |
| **NOT TESTED** | No execution evidence in this pass |

---

## 1. Annex mapping (TA-07)

| Annex item | Frontend status | Notes |
| --- | --- | --- |
| Name, country, phone, email, WhatsApp, bank, basics | PASS | Wizard + details tabs |
| Purchase orders | PARTIAL | Demo ledger + navigation |
| Purchases | PARTIAL | Demo ledger; GR distinction note |
| Payments | PARTIAL | Demo ledger + method/status |
| Current balance | PARTIAL | USD `purchases − payments` on master |
| Account statement | PARTIAL | Demo movements + filter/export/print |
| Transaction history | PARTIAL | Demo movements + banner |
| CSV supplier import | N/A (not in annex) | UI discloses unavailable — see §8 |
| CSV export (directory) | PASS | Client export of filtered rows |

---

## 2. Persistence behavior (actual)

| Data | Mechanism | Cross-user sync | AuthZ |
| --- | --- | --- | --- |
| Supplier master | `localStorage` via `supplier-persist.ts` / `suppliers-store.ts` | No | No |
| Documents | IndexedDB blobs + meta `localStorage` | No | No |
| Audit | `localStorage` (`supplier-audit.ts`) | No | No (client log) |
| PO / purchases / payments / statement | Deterministic mock ledger | N/A | N/A |

- Catalog hydrates after SSR snapshot (`useSuppliersHydrated`).
- Rows carry `origin: "seed" | "user"` (normalized on read).
- Single store: directory and detail share `useSuppliers`.
- Facade for future API swap: `src/lib/suppliers/supplier-data-access.ts`.

---

## 3. Workflows

### Directory (`/suppliers`)

Search (name/code/phone/email/…), filters (country/status/category/balance), date period, sort, pagination, active chips + clear (includes period), create/edit wizard, status confirm, remove/deactivate confirm, export CSV, import notice.

### Create / edit wizard (6 steps)

Identity → Contact → Commercial → Banking → Documents → Review.  
Dirty cancel confirm, step validation, submit lock, persist-error toast, staged docs on create/edit.

### Details tabs

Overview · Contact (actions) · Commercial · Bank · **Related items** · Orders · Purchases & GR · Payments · Statement · History · Documents · Activity & audit.

**Related items** (`SupplierRelatedItemsPanel`) lists catalog items linked through the shared `item-suppliers-store` (same source as Item Details → Suppliers). Count badge reflects real relationships. Empty state links to `/items`. Does **not** invent demo rows or alter balances / PO history.

Activity tab (`SupplierActivityPanel`) merges client audit mutations with demo ledger POs/purchases/payments into a bilingual timeline (`supplier-activity.ts`); prose is resolved at display time from structured `action` + `meta`.

---

## 4. Document management (browser IndexedDB)

Supported: upload (DnD/multi), category, size/type validation, progress, fail + retry, preview (image/PDF), download, replace, remove **with confirmation**, empty/filter states, staged wizard docs.

**Disclosure:** IndexedDB is local to the browser. Not server DMS, not multi-user sync, not production access control.

---

## 5. CSV import status

**Technical annex does not require CSV supplier import** (annex lists profile fields + history only).

Frontend keeps an honest **Import** control that opens an unavailable notice (`suppliers.importSoon`). No silent/partial import is implemented.

A full client-side CSV import (preview, validation, commit via `createSupplier`) remains an optional future enhancement — not claimed as annex-complete.

---

## 6. Test commands & results (executed 2026-10-21)

```bash
npm test          # 46 passed, 0 failed
npm run lint      # PASS
npm run typecheck # PASS
npm run build     # PASS
```

Viewport / RTL smoke (Playwright against `http://127.0.0.1:3456`):

```bash
# with Playwright available (e.g. /tmp/am-pw) and server on :3456
node /tmp/am-pw … # supplier viewport matrix
```

Result: **8 viewports × AR+EN**, routes `/suppliers`, detail, statement, documents + wizard open at ≥768 — **no horizontal overflow**, **dir rtl/ltr correct**, HTTP 200. Artifacts: `~/.cursor/projects/.../assets/supplier-qa/summary.json`.

---

## 7. Responsive & localization coverage

| Viewport | Directory | Details | Statement | Documents | Wizard (≥768) |
| --- | --- | --- | --- | --- | --- |
| 1920×1080 | PASS | PASS | PASS | PASS | PASS |
| 1440×900 | PASS | PASS | PASS | PASS | PASS |
| 1280×800 | PASS | PASS | PASS | PASS | PASS |
| 1024×768 | PASS | PASS | PASS | PASS | PASS |
| 768×1024 | PASS | PASS | PASS | PASS | PASS |
| 430×932 | PASS | PASS | PASS | PASS | N/A (cards) |
| 390×844 | PASS | PASS | PASS | PASS | N/A |
| 360×800 | PASS | PASS | PASS | PASS | N/A |

AR RTL / EN LTR: **PASS** (document `dir`, wizard dialog). Language via preference store + cookie (zero-flicker boot).

Fix applied this pass: desktop suppliers table starts at `xl` (not `lg`) to prevent page-level overflow at 1024×768.

---

## 8. Known limitations

- Demo ledger is not AP posting or bank reconciliation.
- Client audit is not a secure server audit trail.
- CSV import not implemented (not annex-required); UI discloses unavailable.
- No full browser E2E suite in-repo (Playwright used ad-hoc for QA).
- Accessibility: keyboard/dialogs exercised partially; no automated a11y suite.

---

## 9. Backend dependencies (excluded this phase)

- Production DB / API / Prisma
- Server DMS + authorized download
- RBAC / authentication service
- AP subledger, aging, reconciliation
- Multi-user sync
- Server audit module

---

## 10. Key files

- `src/lib/suppliers-store.ts`
- `src/lib/suppliers/supplier-data-access.ts`
- `src/lib/suppliers/supplier-documents.ts`
- `src/lib/suppliers/supplier-audit.ts`
- `src/lib/suppliers/supplier-statement.ts`
- `src/components/suppliers/supplier-create-wizard.tsx`
- `src/components/suppliers/supplier-documents-panel.tsx`
- `src/components/suppliers/supplier-details-view.tsx`
- `src/components/suppliers/supplier-related-items-panel.tsx`
- `src/components/suppliers/suppliers-directory.tsx`
- `src/components/suppliers/supplier-status-dialog.tsx`
- `src/lib/item-suppliers-store.ts` (shared Items ↔ Suppliers links)
- `scripts/supplier-viewport-qa.mjs`
