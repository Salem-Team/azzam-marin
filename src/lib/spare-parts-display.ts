import {
  effectiveItemOnHandQty,
  resolveItemOnHand,
} from "@/lib/item-on-hand";
import type { CatalogItem, SparePartRecord } from "@/types/catalog";

export type SpareStockBadgeId =
  | "inactive"
  | "outOfStock"
  | "lowStock"
  | "active";

/**
 * Prefer live warehouse balances when any exist for the item; otherwise
 * fall back to CatalogItem demo `qtyOnHand`. Never invent warehouse rows.
 * Delegates to shared `effectiveItemOnHandQty` (see item-on-hand.ts).
 */
export function effectiveSpareOnHandQty(
  item: CatalogItem | undefined,
): number {
  return effectiveItemOnHandQty(item);
}

export { resolveItemOnHand, effectiveItemOnHandQty };

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
