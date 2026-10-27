import { CATALOG_ITEMS } from "@/config/mock-catalog";

/**
 * Compatibility shim for older low-stock / dashboard consumers.
 * Prefer `mock-catalog` for new catalog UI.
 */
export type ProductRecord = {
  partNumber: string;
  nameEn: string;
  nameAr: string;
  current: number;
  min: number;
  status: "low" | "out" | "ok";
  categoryEn: string;
  categoryAr: string;
  warehouseEn: string;
  warehouseAr: string;
};

function stockStatus(
  qty: number,
  min: number,
): "low" | "out" | "ok" {
  if (qty <= 0) return "out";
  if (qty < min) return "low";
  return "ok";
}

export const PRODUCTS: readonly ProductRecord[] = CATALOG_ITEMS.filter(
  (item) => item.partNumber,
).map((item) => ({
  partNumber: item.partNumber!,
  nameEn: item.nameEn,
  nameAr: item.nameAr,
  current: item.qtyOnHand,
  min: item.minStock,
  status: stockStatus(item.qtyOnHand, item.minStock),
  categoryEn: item.itemType.replaceAll("_", " "),
  categoryAr: item.itemType,
  warehouseEn: "Main Warehouse",
  warehouseAr: "المخزن الرئيسي",
}));

export function findProductByPartNumber(
  partNumber: string,
): ProductRecord | undefined {
  return PRODUCTS.find((product) => product.partNumber === partNumber);
}
