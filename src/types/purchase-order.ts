/** Purchase order — frontend purchasing document (not supplier acknowledgement). */

export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseOrderCurrency = "USD" | "EGP";

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  itemCode: string;
  descriptionEn: string;
  descriptionAr: string;
  quantity: number;
  unitPrice: number;
  /** Received qty against this line (goods receipts). */
  receivedQty: number;
}

export interface PurchaseOrderRecord {
  id: string;
  number: string;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  currency: PurchaseOrderCurrency;
  status: PurchaseOrderStatus;
  notes: string;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineForm {
  itemId: string;
  quantity: string;
  unitPrice: string;
}

export interface PurchaseOrderFormValues {
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  currency: PurchaseOrderCurrency;
  notes: string;
  lines: PurchaseOrderLineForm[];
}
