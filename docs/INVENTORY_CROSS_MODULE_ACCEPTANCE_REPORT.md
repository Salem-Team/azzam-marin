# Inventory Cross-Module Acceptance Report

> **Date:** 2026-10-27  
> **Environment:** local `http://127.0.0.1:3456` (live frontend; browser-local stores)  
> **Baseline docs:** [`INVENTORY_LEDGER_PHASE1.md`](./INVENTORY_LEDGER_PHASE1.md), [`INVENTORY_CROSS_MODULE_INTEGRATION.md`](./INVENTORY_CROSS_MODULE_INTEGRATION.md)  
> **Automated suite:** `src/lib/inventory-cross-module-acceptance.test.ts`

---

## 1. Test environment and setup

| Item | Value |
|------|--------|
| App | AZZAM MARINE ERP (Next.js frontend-only) |
| Dev URL | `http://127.0.0.1:3456` |
| Persistence | Browser `localStorage` stores (not multi-user) |
| Test runner | `tsx --test` (Node test runner) |
| Fixture isolation | Fresh in-memory `localStorage` + `__reset*StoreForTests([])` per test |
| User data | **Not** cleared or overwritten |

---

## 2. Fixture design and expected balances

Unique acceptance IDs (`WH-ACC-*`, `ITM-ACC-*`, `PN-ACC-*`, `SUP-ACC-*`).

| Entity | Expected |
|--------|----------|
| Warehouse A (`WH-ACC-A`) | Active |
| Warehouse B (`WH-ACC-B`) | Active |
| Warehouse I (`WH-ACC-I`) | Inactive (negative stock ops) |
| Item A | **15** in A only → ledger total **15** |
| Item B | **8** in A + **5** in B → ledger total **13** |
| Item C | Explicit ledger row **0** in A → source `ledger`, qty **0** |
| Item D | No ledger rows; `qtyOnHand` **40** → source `catalog-demo` |
| Spare A ↔ Item A | Explicit engine compatibility |
| Spare B ↔ Item B | Directed alternative of Spare A |
| Spare U | Unrelated — must **not** appear as compatible |
| Suppliers 1 & 2 | Linked to Item A / Item B respectively |

---

## 3–4. Scenarios executed and results

| Scenario | Focus | Result |
|----------|--------|--------|
| **A** Catalog ↔ Warehouse | Scoped balances, totals, deep-link hrefs | **PASS** |
| **B** Supplier ↔ Item ↔ Spare | Bidirectional links; canonical `itemId`; no stock mutation | **PASS** |
| **C** Alternatives / xref | Directed A→B only; xref on-hand = ledger; self/duplicate rejected | **PASS** |
| **D** Engine compatibility | Only explicit spare A; unrelated excluded; stock via helper | **PASS** |
| **E** Zero vs demo | Positive ledger / zero ledger / demo-only distinct | **PASS** |
| **F** WH scoping & movements | Transfer A→B; inactive WH blocked; view ≠ mutate | **PASS** |
| **G** Search / missing | Code, Part, OEM, barcode resolve; missing safe | **PASS** |
| Side-effect audit | Resolve on-hand/links/xref → zero stock delta | **PASS** |

**Confirmed defects found in this pass:** none (contracts held; no production code changes required for scenarios A–G).

TypeScript defects in the new acceptance file (`CompatibilityDegreeId` / `AlternativeRelationshipTypeId` literals) were fixed in the test only.

---

## 5–7. Defects / fixes / regression

| Item | Detail |
|------|--------|
| Product defects | None confirmed against Phase 1 / cross-module contracts |
| Test-only fix | Acceptance fixture used valid `degree: "high"` + `relationshipType: "alternative"` |
| New regression file | `src/lib/inventory-cross-module-acceptance.test.ts` (**16** tests) |
| Prior helpers preserved | `item-on-hand.ts`, `inventory-cross-module.ts`, ledger store |

---

## 8. Read-only side-effect audit

Before/after JSON snapshot of balances + movement count for:

- `resolveItemOnHand` (A/C/D)
- `effectiveSpareOnHandQty`
- `primarySpareForItem` / `resolveCatalogModuleLinks`
- `buildCrossRefRows`
- `sparePartsCompatibleWithEngine`
- `listLinksForItem` / `listLinksForSupplier`
- Warehouse projection helpers

**Result:** no balance or movement changes.

---

## 9. Browser QA (actual)

Server responded **200** on `:3456`. Read-only checks (no fixture writes into the live browser profile):

| Check | Result |
|-------|--------|
| `/items/ITM-0001?tab=inventory` | Ledger note; on-hand **15**; “أرصدة المخازن”; link “المخزن الرئيسي” |
| `/warehouses/wh-main` | Same item **١٥** / KPI total **١٥**; isolation UI present |
| `/spare-parts` | Directory loads; stock badges visible |
| Bottom nav “المخزون” | Routes to `/warehouses` (prior config fix) |
| Console / hydration | No crash observed on these navigations |
| EN/AR full toggle during this pass | Not fully re-walked; AR UI verified on pages above |
| Mobile layout | Bottom nav visible; deep-link click intercepted by bottom bar (viewport) — navigated by URL instead |

Browser QA used **existing demo browser data**, not the acceptance fixture (fixture is automated-only by design).

---

## 10. Commands executed

```bash
npx tsx --test \
  src/lib/inventory-cross-module-acceptance.test.ts \
  src/lib/inventory-cross-module.test.ts \
  src/lib/item-on-hand.test.ts \
  src/lib/inventory-stock-store.test.ts \
  src/lib/warehouses/warehouse-details.test.ts \
  src/lib/warehouses/warehouse-validation.test.ts \
  src/lib/spare-parts-integration.test.ts \
  src/lib/cross-system-integration.test.ts \
  src/lib/marine-engines-system-integration.test.ts \
  src/lib/marine-engines-spare-integration.test.ts \
  src/lib/cross-reference.test.ts \
  src/lib/inventory-overview.test.ts
```

| Command | Result |
|---------|--------|
| Acceptance suite | **16 pass / 0 fail** |
| Combined regression above | **101 pass / 0 fail** (12 files) |
| `npm run lint` | pass |
| `npm run typecheck` | pass (after test literal fix) |
| `npm run build` | pass |

---

## 11. Remaining limitations

- Frontend-local only — not server RBAC / multi-user consistency.
- Reserved / damaged / sellable stock not modeled.
- Engine stock only via optional `itemId` → catalog ledger.
- Cross-ref list shows total on-hand, not a per-warehouse matrix.
- Capacity KPI still absent from warehouse schema.
- Full EN + mobile visual matrix not exhaustive in this pass.

---

## 12. Verification status summary

| Area | Status |
|------|--------|
| Ledger SoT (ledger vs catalog-demo vs zero row) | **Verified** (automated) |
| Warehouse isolation + transfers | **Verified** (automated) |
| Supplier / spare / alternative / engine relationships | **Verified** (automated) |
| Read-only no stock mutation | **Verified** (automated) |
| Item ↔ warehouse UI consistency | **Verified** (browser, demo data) |
| Spare / engine / supplier full UI walk with fixture data | **Partially verified** (store-level + limited browser) |
| Performance / 100k annex targets | **Unverified** (no benchmarks) |
| Multi-user / backend persistence | **Unverified** (out of scope) |

---

*Evidence-backed only. No annex rewrite. Phase 1 quantity contract unchanged.*
