/**
 * Shared item on-hand quantity rule (frontend inventory ledger).
 *
 * Rule:
 * - If any warehouse balance row exists for the item → use the sum of those
 *   rows (ledger). A ledger sum of 0 is a real recorded quantity.
 * - If no balance rows exist → fall back to CatalogItem.qtyOnHand as
 *   catalog-demo only. That fallback is NOT a verified physical count of zero
 *   and must never invent warehouse rows.
 * - Viewing / rendering never mutates inventory.
 */

import { sumStockQtyForItem } from "@/lib/inventory-stock-store";
import type { CatalogItem } from "@/types/catalog";

export type ItemOnHandSource = "ledger" | "catalog-demo";

export interface ItemOnHandResolution {
  qty: number;
  source: ItemOnHandSource;
}

export function resolveItemOnHand(
  item: CatalogItem | undefined,
): ItemOnHandResolution {
  if (!item) return { qty: 0, source: "catalog-demo" };
  const ledgerSum = sumStockQtyForItem(item.id);
  if (ledgerSum != null) {
    return { qty: ledgerSum, source: "ledger" };
  }
  return { qty: item.qtyOnHand, source: "catalog-demo" };
}

/** Numeric on-hand for badges, filters, and cross-module display. */
export function effectiveItemOnHandQty(
  item: CatalogItem | undefined,
): number {
  return resolveItemOnHand(item).qty;
}
