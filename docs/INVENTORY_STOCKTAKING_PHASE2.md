# Inventory Completion — Phase 2 (Stocktaking & Reconciliation)

> **Date:** 2026-10-27  
> **Depends on:** [`INVENTORY_LEDGER_PHASE1.md`](./INVENTORY_LEDGER_PHASE1.md)  
> **Contract:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) § الجرد الدوري / الجرد المفاجئ  
> **Scope:** Periodic + surprise stocktaking MVP with ledger snapshot, variance review, idempotent adjustments. **Not** Phase 3 inventory reports, sales/returns, or backend.

---

## Lifecycle

`draft | in_progress → submitted → approved → applying → applied`

Also: `cancelled` (before applied), `failed` (partial apply / stale snapshot — retry apply without replaying successes).

Transitions are enforced in `src/lib/stocktaking-store.ts`, not only in the UI.

**Approval** stamps the demo session actor. This is **frontend-local only** — not server RBAC or multi-user authorization.

---

## Snapshot rules (preserve Phase 1)

| Rule | Behavior |
|------|----------|
| Ledger row exists | `systemQty` = `getStockQty`; `baselineSource: "ledger"` |
| No ledger row | `systemQty: null`; `baselineSource: "unavailable"` — **never** catalog-demo |
| Opening / viewing | No movements created |
| Apply | Re-reads live qty; fails line with `stale-snapshot` if ≠ snapshot |
| Unavailable baseline | Skipped on apply (`unavailable-baseline`); cannot submit blocking for ledger lines only |

Variance: `physicalQty − systemQty` (shortage &lt; 0, surplus &gt; 0, match = 0).

---

## Idempotency & failure recovery

- Create: optional `operationId` → same create returns same session.
- Apply per line: `operationId = stk:{sessionId}:line:{lineId}` via `receiveStock` / `issueStock`.
- Zero variance → `skipped` (no movement).
- Already-applied / skipped lines are not repeated on retry.
- Session marked `applied` only when every line is `applied` or `skipped`.
- Partial failure → `failed` + `applyProgress`; retry resumes.
- **Not** a DB transaction; **not** safe full-store snapshot rollback after concurrent ops.

Browser-local limitation: `operationId` uniqueness is per-browser storage, not global multi-device.

---

## Persistence

- Key: `azzam-marine:stocktaking:v1`
- Validated on hydrate; malformed records skipped
- Does not mutate warehouse or stock stores except through apply → ledger APIs

---

## UI

| Route | Role |
|-------|------|
| `/stocktaking` | Directory: search, filters, date range, Import (honest unavailable), Export CSV, create |
| `/stocktaking/[id]` | Count entry, variance KPIs, submit / approve / apply / cancel |

i18n: `src/i18n/stocktaking.ts` (EN/AR).

---

## Tests run

```bash
npx tsx --test src/lib/stocktaking-store.test.ts src/lib/inventory-stock-store.test.ts
# → 24 pass / 0 fail

npm run lint      # pass
npm run typecheck # pass
npm run build     # pass (Next 16.4.2)
```

Covers: create periodic/surprise, inactive WH, empty scope, duplicate create op, count validation, unavailable baseline, submit gates, shortage/surplus/zero apply + idempotent re-apply, stale snapshot, cancel/immutability, summarize.

### Browser (2026-10-27, `127.0.0.1:3461`, AR)

- `/stocktaking` directory (filters, Import unavailable, Export, create wizard)
- Seeded ledger via `/stock-adjustments` (empty-scope correctly rejected before seed)
- Created periodic `STK-0001` for `wh-main` (ledger_all → 2 lines)
- Counted shortage (−2) and surplus (+2); submit → approve → apply
- Balances became 8 / 7; movements `referenceType: stocktaking` with per-line `operationId`
- Applied session has no further apply/edit actions
- EN toggle available; RTL layout verified on directory + detail

---

## Requirement mapping (honest)

| ID | Status after Phase 2 |
|----|----------------------|
| TA-05-08 Periodic stocktaking | **IMPLEMENTED** (FE + unit) — not server-backed |
| TA-05-09 Surprise stocktaking | **IMPLEMENTED** (FE + unit) — not server-backed |
| TA-02-02-07 Perform stocktaking | **IMPLEMENTED** (FE + unit) |
| TA-AC-09 Stocktaking operations | **PARTIALLY_IMPLEMENTED** — workflow works locally; no multi-user authz / durable server audit |

---

## Explicit non-claims

- No multi-user concurrent counting lock
- No server approval hierarchy
- No Phase 3 inventory reports
- No sales/returns / import-cost integration
- Catalog-demo qty is never treated as verified stock
