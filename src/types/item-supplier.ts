/** Item ↔ Supplier link — frontend relationship layer (not a purchase order). */

export type ItemSupplierLinkStatus = "active" | "inactive";

/** Explicit currency when a supplier purchase price is set. */
export type ItemSupplierCurrency = "USD" | "EGP";

/**
 * Many-to-many link between a catalog item and an existing supplier.
 * References stable IDs only — never embeds a duplicated supplier master.
 */
export interface ItemSupplierLink {
  id: string;
  itemId: string;
  supplierId: string;
  /** Optional code used by the supplier for this item. */
  supplierItemCode: string;
  /** Quoted / agreed supplier purchase price — not the item master cost. */
  purchasePrice: number | null;
  currency: ItemSupplierCurrency | null;
  leadTimeDays: number | null;
  minimumOrderQuantity: number | null;
  notes: string;
  status: ItemSupplierLinkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ItemSupplierLinkFormValues {
  supplierId: string;
  supplierItemCode: string;
  purchasePrice: string;
  currency: ItemSupplierCurrency | "";
  leadTimeDays: string;
  minimumOrderQuantity: string;
  notes: string;
  status: ItemSupplierLinkStatus;
}
