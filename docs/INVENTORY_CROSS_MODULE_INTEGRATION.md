# Inventory Cross-Module Integration

> **Date:** 2026-10-27  
> **Scope:** Items × Suppliers × Spare Parts × Alternative Parts × Marine Engines × Warehouses  
> **Quantity SoT:** [`INVENTORY_LEDGER_PHASE1.md`](./INVENTORY_LEDGER_PHASE1.md) — unchanged

---

## Canonical ownership (preserved)

| Domain | Owner | Notes |
|--------|--------|------|
| Catalog identity | `items-store` / `CatalogItem` | Codes, names, Part/OEM, costs |
| Verified warehouse qty | `inventory-stock-store` ledger | Via `resolveItemOnHand` |
| Spare specialization | `spare-parts-store` (`itemId`) | Alternatives = `alternativeLinks` |
| Engine master | `marine-engines-store` | Compatibility via spare `compatibleEngineIds` |
| Supplier links | `item-suppliers-store` | Does **not** create stock |
| Warehouse master | `warehouses-store` | Balances are ledger-scoped |

No second inventory or catalog store was introduced.

---

## Gaps closed in this pass

1. **Item Details related spare** now uses live `sparePartsForItemId` / `primarySpareForItem` (was seed `mock-catalog`).
2. **Item Inventory tab** shows per-warehouse ledger balances (including zero) with links to `/warehouses/[id]`.
3. **Spare warehouse panel** no longer hides `qty === 0` ledger rows; notes distinguish ledger vs demo.
4. **Legacy `/products/[partNumber]`** resolves from live spare/item stores after hydrate.
5. **Warehouse details** exposes spare/engine deep links when relationships exist.
6. **Supplier related items** show on-hand (`effectiveItemOnHandQty`) + spare deep link when present.
7. **Engine alternatives** show the same on-hand helper as compatible parts.
8. **Cross-reference directory** shows original/alternative on-hand columns.
9. Shared helpers: `src/lib/inventory-cross-module.ts` (+ tests) and `item-on-hand.test.ts`.

---

## Semantics kept distinct

- **Compatible** = spare explicitly lists engine id.
- **Alternative** = directed `alternativeLinks` on spare (not inferred).
- **Stocked in warehouse** = ledger balance for that warehouse only.
- Supplier link ≠ movement / PO / receipt.

---

## Remaining limitations (honest)

- Browser `localStorage` only — not multi-user / server RBAC.
- Reserved / damaged / sellable deductions are not modeled (Reserved still `—`).
- Engine inventory is only via optional `MarineEngineRecord.itemId` → catalog ledger; no separate engine stock table.
- Capacity KPI still omitted (not in warehouse schema).
- Cross-ref stock columns are totals via shared on-hand helper, not a per-warehouse matrix on the xref list.

---

## Tests

```bash
npx tsx --test \
  src/lib/inventory-cross-module.test.ts \
  src/lib/item-on-hand.test.ts \
  src/lib/inventory-stock-store.test.ts \
  src/lib/warehouses/warehouse-details.test.ts \
  src/lib/spare-parts-integration.test.ts \
  src/lib/cross-system-integration.test.ts \
  src/lib/marine-engines-system-integration.test.ts \
  src/lib/marine-engines-spare-integration.test.ts \
  src/lib/cross-reference.test.ts
```
