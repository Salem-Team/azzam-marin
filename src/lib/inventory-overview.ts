/**
 * Inventory overview projections — read-only views over ledger balances + catalog.
 * Does not mutate stock. Qty always comes from WarehouseStockBalance rows
 * (ledger), never by inventing warehouse splits from catalog-demo qtyOnHand.
 */

import type { Locale } from "@/types/i18n";
import type { CatalogItem } from "@/types/catalog";
import type {
  WarehouseRecord,
  WarehouseStockBalance,
} from "@/types/warehouse";
import type { StockMovement } from "@/lib/inventory-stock-store";

export type StockBalanceStatus = "available" | "low" | "out";

export interface InventoryBalanceRow {
  key: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseNameEn: string;
  warehouseNameAr: string;
  itemId: string;
  itemCode: string;
  nameEn: string;
  nameAr: string;
  partNumber: string;
  oemNumber: string;
  manufacturer: string;
  barcode: string;
  imageSrc: string | null;
  qty: number;
  minStock: number;
  status: StockBalanceStatus;
  updatedAt: string;
}

export interface WarehouseStockSummary {
  warehouseId: string;
  totalQty: number;
  distinctItems: number;
}

export interface WarehouseLowStockRow {
  key: string;
  itemId: string;
  itemCode: string;
  nameEn: string;
  nameAr: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseNameEn: string;
  warehouseNameAr: string;
  qty: number;
  minStock: number;
  /** 0–100: share of minimum still missing. */
  shortagePct: number;
  status: "low" | "out";
}

export function stockBalanceStatus(
  qty: number,
  minStock: number,
): StockBalanceStatus {
  if (qty <= 0) return "out";
  if (minStock > 0 && qty < minStock) return "low";
  return "available";
}

export function shortagePercent(qty: number, minStock: number): number {
  if (minStock <= 0) return 0;
  const missing = Math.max(0, minStock - qty);
  return Math.min(100, Math.round((missing / minStock) * 100));
}

export function summarizeWarehouseStock(
  balances: readonly WarehouseStockBalance[],
): Map<string, WarehouseStockSummary> {
  const map = new Map<string, WarehouseStockSummary>();
  for (const b of balances) {
    const cur = map.get(b.warehouseId) ?? {
      warehouseId: b.warehouseId,
      totalQty: 0,
      distinctItems: 0,
    };
    cur.totalQty += b.qty;
    cur.distinctItems += 1;
    map.set(b.warehouseId, cur);
  }
  return map;
}

export function buildInventoryBalanceRows(
  balances: readonly WarehouseStockBalance[],
  warehouses: readonly WarehouseRecord[],
  items: readonly CatalogItem[],
): InventoryBalanceRow[] {
  const whById = new Map(warehouses.map((w) => [w.id, w]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const rows: InventoryBalanceRow[] = [];

  for (const b of balances) {
    const wh = whById.get(b.warehouseId);
    const item = itemById.get(b.itemId);
    if (!wh || !item) continue;
    rows.push({
      key: `${b.warehouseId}:${b.itemId}`,
      warehouseId: wh.id,
      warehouseCode: wh.code,
      warehouseNameEn: wh.nameEn,
      warehouseNameAr: wh.nameAr,
      itemId: item.id,
      itemCode: item.itemCode,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      partNumber: (item.partNumber ?? "").trim(),
      oemNumber: (item.oemNumber ?? "").trim(),
      manufacturer: item.manufacturer ?? "",
      barcode: (item.barcode ?? "").trim(),
      imageSrc: item.imageSrc,
      qty: b.qty,
      minStock: item.minStock,
      status: stockBalanceStatus(b.qty, item.minStock),
      updatedAt: b.updatedAt,
    });
  }

  rows.sort((a, b) => {
    const code = a.itemCode.localeCompare(b.itemCode);
    if (code !== 0) return code;
    return a.warehouseCode.localeCompare(b.warehouseCode);
  });
  return rows;
}

export function buildWarehouseLowStockRows(
  balances: readonly WarehouseStockBalance[],
  warehouses: readonly WarehouseRecord[],
  items: readonly CatalogItem[],
): WarehouseLowStockRow[] {
  const whById = new Map(warehouses.map((w) => [w.id, w]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const rows: WarehouseLowStockRow[] = [];

  for (const b of balances) {
    const item = itemById.get(b.itemId);
    const wh = whById.get(b.warehouseId);
    if (!item || !wh) continue;
    if (item.status !== "active") continue;
    if (item.minStock <= 0) continue;
    if (b.qty >= item.minStock) continue;
    rows.push({
      key: `${b.warehouseId}:${b.itemId}`,
      itemId: item.id,
      itemCode: item.itemCode,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      warehouseId: wh.id,
      warehouseCode: wh.code,
      warehouseNameEn: wh.nameEn,
      warehouseNameAr: wh.nameAr,
      qty: b.qty,
      minStock: item.minStock,
      shortagePct: shortagePercent(b.qty, item.minStock),
      status: b.qty <= 0 ? "out" : "low",
    });
  }

  rows.sort(
    (a, b) =>
      b.shortagePct - a.shortagePct ||
      a.qty - b.qty ||
      a.itemCode.localeCompare(b.itemCode),
  );
  return rows;
}

export type BalanceSortKey =
  | "itemCode"
  | "name"
  | "qty"
  | "minStock"
  | "status"
  | "warehouse";

export function filterBalanceRows(
  rows: readonly InventoryBalanceRow[],
  opts: {
    query: string;
    warehouseId: string;
    status: "" | StockBalanceStatus;
    locale: Locale;
  },
): InventoryBalanceRow[] {
  const q = opts.query.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.warehouseId && r.warehouseId !== opts.warehouseId) return false;
    if (opts.status && r.status !== opts.status) return false;
    if (!q) return true;
    const hay = [
      r.itemCode,
      r.nameEn,
      r.nameAr,
      r.partNumber,
      r.oemNumber,
      r.manufacturer,
      r.barcode,
      r.warehouseCode,
      r.warehouseNameEn,
      r.warehouseNameAr,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function sortBalanceRows(
  rows: readonly InventoryBalanceRow[],
  sort: BalanceSortKey,
  locale: Locale,
  dir: "asc" | "desc" = "asc",
): InventoryBalanceRow[] {
  const mul = dir === "asc" ? 1 : -1;
  const statusRank: Record<StockBalanceStatus, number> = {
    out: 0,
    low: 1,
    available: 2,
  };
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "qty":
        cmp = a.qty - b.qty;
        break;
      case "minStock":
        cmp = a.minStock - b.minStock;
        break;
      case "status":
        cmp = statusRank[a.status] - statusRank[b.status];
        break;
      case "warehouse":
        cmp = a.warehouseCode.localeCompare(b.warehouseCode);
        break;
      case "name": {
        const an = locale === "ar" ? a.nameAr : a.nameEn;
        const bn = locale === "ar" ? b.nameAr : b.nameEn;
        cmp = an.localeCompare(bn, locale === "ar" ? "ar" : "en");
        break;
      }
      case "itemCode":
      default:
        cmp = a.itemCode.localeCompare(b.itemCode);
        break;
    }
    if (cmp !== 0) return cmp * mul;
    return a.key.localeCompare(b.key) * mul;
  });
}

export function exportInventoryBalancesCsv(
  rows: readonly InventoryBalanceRow[],
  locale: Locale,
): string {
  const headers =
    locale === "ar"
      ? [
          "كود الصنف",
          "اسم الصنف",
          "رقم القطعة",
          "رقم OEM",
          "الشركة المصنعة",
          "المخزن",
          "كود المخزن",
          "الرصيد",
          "الحد الأدنى",
          "الحالة",
        ]
      : [
          "Item Code",
          "Item Name",
          "Part Number",
          "OEM Number",
          "Manufacturer",
          "Warehouse",
          "Warehouse Code",
          "Qty",
          "Min Stock",
          "Status",
        ];

  const statusLabel = (s: StockBalanceStatus) => {
    if (locale === "ar") {
      if (s === "available") return "متاح";
      if (s === "low") return "تحت الحد";
      return "نفد";
    }
    if (s === "available") return "Available";
    if (s === "low") return "Below min";
    return "Out of stock";
  };

  const escape = (v: string | number) => {
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.itemCode,
        locale === "ar" ? r.nameAr : r.nameEn,
        r.partNumber,
        r.oemNumber,
        r.manufacturer,
        locale === "ar" ? r.warehouseNameAr : r.warehouseNameEn,
        r.warehouseCode,
        r.qty,
        r.minStock,
        statusLabel(r.status),
      ]
        .map(escape)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}`;
}

export function formatSignedQty(type: StockMovement["type"], qty: number): string {
  const abs = Math.abs(qty);
  if (type === "issue" || type === "transfer_out") return `−${abs}`;
  if (type === "receipt" || type === "transfer_in") return `+${abs}`;
  return qty >= 0 ? `+${abs}` : `−${abs}`;
}

export function countActiveWarehouses(
  warehouses: readonly WarehouseRecord[],
): number {
  return warehouses.filter((w) => w.status === "active").length;
}
