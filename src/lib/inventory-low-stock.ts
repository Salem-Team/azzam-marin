/**
 * Low-stock rows derived from CatalogItem + warehouse balances.
 * Prefers warehouse sum when balances exist; else demo qtyOnHand.
 */

import { sumStockQtyForItem } from "@/lib/inventory-stock-store";
import { listItems } from "@/lib/items-store";
import type { CatalogItem } from "@/types/catalog";

export interface LowStockRow {
  itemId: string;
  itemCode: string;
  partNumber: string;
  nameEn: string;
  nameAr: string;
  current: number;
  min: number;
  status: "low" | "out";
}

function onHandFor(item: CatalogItem): number {
  const wh = sumStockQtyForItem(item.id);
  return wh != null ? wh : item.qtyOnHand;
}

/** Active items at or below min stock (including zero). */
export function listLowStockRows(
  items: readonly CatalogItem[] = listItems(),
): LowStockRow[] {
  const rows: LowStockRow[] = [];
  for (const item of items) {
    if (item.status !== "active") continue;
    if (item.minStock <= 0) continue;
    const current = onHandFor(item);
    if (current >= item.minStock) continue;
    rows.push({
      itemId: item.id,
      itemCode: item.itemCode,
      partNumber:
        (item.partNumber ?? "").trim() ||
        (item.oemNumber ?? "").trim() ||
        item.itemCode,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      current,
      min: item.minStock,
      status: current <= 0 ? "out" : "low",
    });
  }
  rows.sort((a, b) => a.current - b.current || a.partNumber.localeCompare(b.partNumber));
  return rows;
}
