import { sumStockQtyForItem } from "@/lib/inventory-stock-store";
import type { CatalogItem, SparePartRecord } from "@/types/catalog";

export type SpareStockBadgeId =
  | "inactive"
  | "outOfStock"
  | "lowStock"
  | "active";

/**
 * Prefer live warehouse balances when any exist for the item; otherwise
 * fall back to CatalogItem demo `qtyOnHand`. Never invent warehouse rows.
 */
export function effectiveSpareOnHandQty(
  item: CatalogItem | undefined,
): number {
  if (!item) return 0;
  const warehouseSum = sumStockQtyForItem(item.id);
  if (warehouseSum != null) return warehouseSum;
  return item.qtyOnHand;
}

/** Prefer lifecycle / stock severity for card badges (no invented trends). */
export function resolveSpareStockBadge(
  item: CatalogItem | undefined,
): SpareStockBadgeId {
  if (!item) return "active";
  if (item.status === "inactive" || item.status === "discontinued") {
    return "inactive";
  }
  const onHand = effectiveSpareOnHandQty(item);
  if (onHand <= 0) return "outOfStock";
  if (onHand < item.minStock) return "lowStock";
  return "active";
}

export function sparePartDisplayNames(
  part: SparePartRecord,
  item: CatalogItem | undefined,
): { nameAr: string; nameEn: string } {
  return {
    nameAr: item?.nameAr?.trim() || part.partNumber,
    nameEn:
      item?.nameEn?.trim() ||
      part.manufacturerPartNumber ||
      part.partNumber,
  };
}
