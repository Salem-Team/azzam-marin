/**
 * Warehouse-scoped detail projections — read-only over ledger balances.
 * Never invents warehouse qty from CatalogItem.qtyOnHand.
 */

import {
  stockBalanceStatus,
  type InventoryBalanceRow,
  type StockBalanceStatus,
  type WarehouseLowStockRow,
} from "@/lib/inventory-overview";
import type { StockMovement } from "@/lib/inventory-stock-store";
import type { CatalogItem, ItemTypeId } from "@/types/catalog";
import type { WarehouseStockBalance } from "@/types/warehouse";

export type WarehouseDetailTab =
  | "overview"
  | "items"
  | "movements"
  | "receipts"
  | "issues"
  | "transfers"
  | "adjustments"
  | "stocktaking"
  | "settings";

export const WAREHOUSE_DETAIL_TABS: readonly WarehouseDetailTab[] = [
  "overview",
  "items",
  "movements",
  "receipts",
  "issues",
  "transfers",
  "adjustments",
  "stocktaking",
  "settings",
] as const;

export function isWarehouseDetailTab(v: string): v is WarehouseDetailTab {
  return (WAREHOUSE_DETAIL_TABS as readonly string[]).includes(v);
}

export type WarehouseStockBand =
  | "healthy"
  | "near"
  | "low"
  | "out"
  | "stagnant";

export interface WarehouseDetailKpis {
  totalQty: number;
  distinctItems: number;
  lowStockCount: number;
  /** Catalog-cost estimate in USD (ledger qty × costUsd). Null if no priced rows. */
  estimatedValueUsd: number | null;
  /** Catalog-cost estimate in EGP when costEgp present on items. */
  estimatedValueEgp: number | null;
  pricedItemCount: number;
}

export interface WarehouseCategorySlice {
  id: ItemTypeId | "unknown";
  itemCount: number;
  qty: number;
}

export interface WarehouseStatusSummary {
  healthy: number;
  near: number;
  low: number;
  out: number;
  stagnant: number;
}

export interface WarehouseTopItem {
  itemId: string;
  itemCode: string;
  nameEn: string;
  nameAr: string;
  imageSrc: string | null;
  qty: number;
  unitOfMeasure: string;
  partNumber: string;
  oemNumber: string;
}

const NEAR_RATIO = 1.25;
/** No movement for this warehouse+item within this window → stagnant. */
const STAGNANT_MS = 90 * 24 * 60 * 60 * 1000;

export function balancesForWarehouse(
  balances: readonly WarehouseStockBalance[],
  warehouseId: string,
): WarehouseStockBalance[] {
  return balances.filter((b) => b.warehouseId === warehouseId);
}

export function movementsForWarehouse(
  movements: readonly StockMovement[],
  warehouseId: string,
): StockMovement[] {
  return movements.filter(
    (m) =>
      m.warehouseId === warehouseId || m.toWarehouseId === warehouseId,
  );
}

export function classifyWarehouseStockBand(
  qty: number,
  minStock: number,
  lastMovedAt: string | null,
  nowMs: number = Date.now(),
): WarehouseStockBand {
  const status = stockBalanceStatus(qty, minStock);
  if (status === "out") return "out";
  if (status === "low") return "low";
  if (
    lastMovedAt &&
    nowMs - new Date(lastMovedAt).getTime() > STAGNANT_MS
  ) {
    return "stagnant";
  }
  if (minStock > 0 && qty < minStock * NEAR_RATIO) return "near";
  return "healthy";
}

function lastMovementAt(
  movements: readonly StockMovement[],
  warehouseId: string,
  itemId: string,
): string | null {
  let latest: string | null = null;
  for (const m of movements) {
    const touches =
      (m.warehouseId === warehouseId || m.toWarehouseId === warehouseId) &&
      m.itemId === itemId;
    if (!touches) continue;
    if (!latest || m.createdAt > latest) latest = m.createdAt;
  }
  return latest;
}

export function computeWarehouseDetailKpis(
  warehouseBalances: readonly WarehouseStockBalance[],
  itemsById: ReadonlyMap<string, CatalogItem>,
  lowStockRows: readonly WarehouseLowStockRow[],
): WarehouseDetailKpis {
  let totalQty = 0;
  let estimatedValueUsd = 0;
  let estimatedValueEgp = 0;
  let pricedUsd = 0;
  let pricedEgp = 0;

  for (const b of warehouseBalances) {
    totalQty += b.qty;
    const item = itemsById.get(b.itemId);
    if (!item) continue;
    if (Number.isFinite(item.costUsd) && item.costUsd > 0) {
      estimatedValueUsd += b.qty * item.costUsd;
      pricedUsd += 1;
    }
    if (item.costEgp != null && Number.isFinite(item.costEgp) && item.costEgp > 0) {
      estimatedValueEgp += b.qty * item.costEgp;
      pricedEgp += 1;
    }
  }

  return {
    totalQty,
    distinctItems: warehouseBalances.length,
    lowStockCount: lowStockRows.length,
    estimatedValueUsd: pricedUsd > 0 ? estimatedValueUsd : null,
    estimatedValueEgp: pricedEgp > 0 ? estimatedValueEgp : null,
    pricedItemCount: Math.max(pricedUsd, pricedEgp),
  };
}

export function buildWarehouseCategorySlices(
  warehouseBalances: readonly WarehouseStockBalance[],
  itemsById: ReadonlyMap<string, CatalogItem>,
): WarehouseCategorySlice[] {
  const map = new Map<ItemTypeId | "unknown", WarehouseCategorySlice>();
  for (const b of warehouseBalances) {
    const item = itemsById.get(b.itemId);
    const id: ItemTypeId | "unknown" = item?.itemType ?? "unknown";
    const cur = map.get(id) ?? { id, itemCount: 0, qty: 0 };
    cur.itemCount += 1;
    cur.qty += b.qty;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.itemCount - a.itemCount);
}

export function buildWarehouseStatusSummary(
  warehouseBalances: readonly WarehouseStockBalance[],
  itemsById: ReadonlyMap<string, CatalogItem>,
  movements: readonly StockMovement[],
  warehouseId: string,
  nowMs: number = Date.now(),
): WarehouseStatusSummary {
  const summary: WarehouseStatusSummary = {
    healthy: 0,
    near: 0,
    low: 0,
    out: 0,
    stagnant: 0,
  };
  for (const b of warehouseBalances) {
    const item = itemsById.get(b.itemId);
    if (!item) continue;
    const last = lastMovementAt(movements, warehouseId, b.itemId);
    const band = classifyWarehouseStockBand(
      b.qty,
      item.minStock,
      last,
      nowMs,
    );
    summary[band] += 1;
  }
  return summary;
}

/** Rank by warehouse on-hand qty (ledger only). */
export function buildWarehouseTopItems(
  warehouseBalances: readonly WarehouseStockBalance[],
  itemsById: ReadonlyMap<string, CatalogItem>,
  limit = 5,
): WarehouseTopItem[] {
  const rows: WarehouseTopItem[] = [];
  for (const b of warehouseBalances) {
    const item = itemsById.get(b.itemId);
    if (!item) continue;
    rows.push({
      itemId: item.id,
      itemCode: item.itemCode,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      imageSrc: item.imageSrc,
      qty: b.qty,
      unitOfMeasure: item.unitOfMeasure,
      partNumber: (item.partNumber ?? "").trim(),
      oemNumber: (item.oemNumber ?? "").trim(),
    });
  }
  rows.sort(
    (a, b) => b.qty - a.qty || a.itemCode.localeCompare(b.itemCode),
  );
  return rows.slice(0, limit);
}

export function filterWarehouseBalanceRows(
  rows: readonly InventoryBalanceRow[],
  warehouseId: string,
): InventoryBalanceRow[] {
  return rows.filter((r) => r.warehouseId === warehouseId);
}

export function warehouseHasForeignBalances(
  rows: readonly InventoryBalanceRow[],
  warehouseId: string,
): boolean {
  return rows.some((r) => r.warehouseId !== warehouseId);
}

export function movementTouchesWarehouse(
  m: StockMovement,
  warehouseId: string,
): boolean {
  return m.warehouseId === warehouseId || m.toWarehouseId === warehouseId;
}

export function filterMovementsByTab(
  movements: readonly StockMovement[],
  warehouseId: string,
  tab: WarehouseDetailTab,
): StockMovement[] {
  const scoped = movementsForWarehouse(movements, warehouseId);
  switch (tab) {
    case "receipts":
      return scoped.filter((m) => m.type === "receipt");
    case "issues":
      return scoped.filter((m) => m.type === "issue");
    case "transfers":
      return scoped.filter(
        (m) => m.type === "transfer_in" || m.type === "transfer_out",
      );
    case "adjustments":
      return scoped.filter((m) => m.type === "adjustment");
    case "movements":
    default:
      return scoped;
  }
}

export function stockStatusFilterMatch(
  status: StockBalanceStatus,
  filter: "" | StockBalanceStatus,
): boolean {
  if (!filter) return true;
  return status === filter;
}
