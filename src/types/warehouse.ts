/** Warehouse master — frontend inventory location. */

export type WarehouseStatus = "active" | "inactive";

export type WarehouseKind =
  | "main"
  | "new_parts"
  | "used_parts"
  | "engines"
  | "other";

export interface WarehouseRecord {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  kind: WarehouseKind;
  status: WarehouseStatus;
  addressEn: string;
  addressAr: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFormValues {
  code: string;
  nameEn: string;
  nameAr: string;
  kind: WarehouseKind;
  status: WarehouseStatus;
  addressEn: string;
  addressAr: string;
  notes: string;
}

/** On-hand qty for an item in a warehouse (browser ledger). */
export interface WarehouseStockBalance {
  warehouseId: string;
  itemId: string;
  qty: number;
  updatedAt: string;
}
