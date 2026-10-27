# Inventory Completion — Phase 1 (Ledger SoT + Hardening)

> **Date:** 2026-10-27  
> **Audit baseline:** [`INVENTORY_WAREHOUSE_AUDIT.md`](./INVENTORY_WAREHOUSE_AUDIT.md)  
> **Contract:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) § إدارة المخازن والمخزون  
> **Scope:** Unify quantity display + harden browser stock ledger. **Not** stocktaking, inventory reports, sales/returns, or import costs.

---

## Quantity source-of-truth rule (authoritative for FE)

Implemented in `src/lib/item-on-hand.ts`:

1. If **any** warehouse balance row exists for the item ID → use **sum of ledger balances** (`source: "ledger"`). A sum of `0` is a recorded quantity.
2. If **no** balance rows exist → use `CatalogItem.qtyOnHand` as **`catalog-demo` only**. This is **not** a verified physical count of zero and never invents warehouse rows.
3. Viewing / rendering **never** mutates inventory.

Shared consumers: Items details, Spare Parts display helpers, Marine Engines linked-part qty, low-stock, catalog stock filters/KPIs.

Persistence remains browser `localStorage` (`azzam-marine:warehouse-stock:v1`). Not multi-user; not a server audit.

---

## Ledger defects fixed

| Issue | Fix |
|-------|-----|
| Items details used raw `qtyOnHand` | Uses `resolveItemOnHand` + stock subscription |
| Dual helpers for on-hand | Consolidated via `item-on-hand` / `effectiveItemOnHandQty` |
| Inactive WH/item accepted by store | `inactive-warehouse` / `inactive-item` StockError |
| Transfer sequential risk + missing dest | Atomic transfer; `toWarehouseId` on `transfer_out` |
| No idempotency | Optional `operationId` on movements |
| GR `referenceId: "pending"` | Pre-generate GR id; stamp movements; snapshot/restore on failure |
| Activity only on receive | `logClientActivity` for receive / issue / adjust / transfer |
| Transfer history missing destination column | Transfers + movements tables show destination |

---

## Files changed (primary)

- `src/lib/item-on-hand.ts` *(new)*
- `src/lib/inventory-stock-store.ts`
- `src/lib/inventory-stock-store.test.ts` *(new)*
- `src/lib/goods-receipts-store.ts` (+ test assertion)
- `src/lib/spare-parts-display.ts`
- `src/lib/inventory-low-stock.ts`
- `src/lib/catalog-query.ts`
- `src/components/items/item-details-view.tsx`
- `src/components/spare-parts/spare-part-details-view.tsx`
- `src/components/inventory/stock-transfers-directory.tsx`
- `src/components/inventory/stock-movements-directory.tsx`
- `src/i18n/catalog.ts` (ledger vs demo notes)

---

## Tests

```bash
npx tsx --test \
  src/lib/inventory-stock-store.test.ts \
  src/lib/goods-receipts-store.test.ts \
  src/lib/warehouses-store.test.ts \
  src/lib/spare-parts-integration.test.ts \
  src/lib/cross-system-integration.test.ts \
  src/lib/marine-engines-system-integration.test.ts \
  src/lib/client-activity-store.test.ts
```

**Result (2026-10-27):** 52 passed / 0 failed (includes 15 new stock-store tests).

Also: `npm run lint`, `npm run typecheck`, `npm run build` — passed after TypeScript fix.

---

## Browser verification (localhost:3456)

| Workflow | Result |
|----------|--------|
| Adjust +20 ITM-0002 into WH-NEW | Toast success; localStorage balance 20 |
| Item details `/items/ITM-0002` | Shows **20** + ledger note (AR) |
| Transfer 5 NEW→USED | Balances 15 + 5; `toWarehouseId` set |
| Insufficient transfer qty 999 | Error “Insufficient stock…”; balances unchanged |
| EN LTR switch | Stock Transfers labels EN |

Not claimed this phase: stocktaking UI, `/reports/inventory`, GR browser posting, ~390px full visual QA (mobile shell observed), multi-tab concurrency.

---

## Remaining gaps (next phases)

- Stocktaking (`/stocktaking`)
- Inventory reports (`/reports/inventory`) + valuation
- Sales issue / returns restock
- Import landed cost → item cost
- Server RBAC / multi-user persistence
- Traceability docs were partially stale before this phase — update statuses only with evidence (see matrix)

---

*Frontend-only. Client activity ≠ annex server Audit Log.*
