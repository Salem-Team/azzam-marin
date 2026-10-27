/**
 * Shared presentation helpers for warehouse / inventory overview UI.
 * No store mutations — display-only.
 */

import {
  Boxes,
  Cog,
  Package,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { StockBalanceStatus } from "@/lib/inventory-overview";
import type { StockMovementType } from "@/lib/inventory-stock-store";
import type { StatusTone } from "@/components/dashboard/status-badge";
import type { WarehouseKind } from "@/types/warehouse";

/** Matches dashboard KPI icon chip tones (status semantics, not brand chrome). */
export const WAREHOUSE_KPI_TONES = {
  red: "bg-[#FDECEC] text-[#C62832]",
  blue: "bg-[#EAF2FF] text-[#075DE8]",
  amber: "bg-[#FFF4E5] text-[#B7791F]",
  green: "bg-[#E8F7EF] text-[#16865A]",
} as const;

export type WarehouseKpiTone = keyof typeof WAREHOUSE_KPI_TONES;

export const WAREHOUSE_KIND_ICON: Record<WarehouseKind, LucideIcon> = {
  main: Warehouse,
  new_parts: Package,
  used_parts: Cog,
  engines: Boxes,
  other: Boxes,
};

export const STOCK_MOVEMENT_TONE: Record<StockMovementType, StatusTone> = {
  receipt: "approved",
  issue: "out",
  transfer_out: "inTransit",
  transfer_in: "inTransit",
  adjustment: "inventory",
};

export function stockStatusTone(status: StockBalanceStatus): StatusTone {
  if (status === "available") return "approved";
  if (status === "low") return "low";
  return "out";
}

export function stockQtyClass(status: StockBalanceStatus): string {
  if (status === "available") return "text-[#16865A]";
  if (status === "low") return "text-[var(--am-blue-700)]";
  return "text-[#C62832]";
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
