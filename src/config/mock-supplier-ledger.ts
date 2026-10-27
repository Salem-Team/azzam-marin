/**
 * Frontend-only supplier ledger links.
 * Deterministic demo records derived from INITIAL_SUPPLIERS — not an AP ledger.
 */

import { INITIAL_SUPPLIERS } from "@/config/mock-suppliers";
import type { SupplierRecord } from "@/types/supplier";

export type LedgerPoStatus =
  | "open"
  | "inProgress"
  | "partial"
  | "completed";

export type LedgerPaymentMethod = "bankTransfer" | "swift" | "cash";

export interface SupplierLinkedPo {
  id: string;
  supplierId: string;
  supplierEn: string;
  supplierAr: string;
  date: string;
  /** Expected delivery (demo) — not a warehouse commitment. */
  expectedDeliveryDate: string;
  amount: number;
  currency: "USD";
  status: LedgerPoStatus;
}

export interface SupplierLinkedPurchase {
  id: string;
  supplierId: string;
  supplierEn: string;
  supplierAr: string;
  date: string;
  amount: number;
  currency: "USD";
  status: "received" | "pending";
}

export interface SupplierLinkedPayment {
  id: string;
  supplierId: string;
  supplierEn: string;
  supplierAr: string;
  date: string;
  amount: number;
  currency: "USD";
  method: LedgerPaymentMethod;
  /** Demo presentation status — not bank reconciliation. */
  status: "posted" | "pending";
}

const PO_STATUSES: LedgerPoStatus[] = [
  "open",
  "inProgress",
  "partial",
  "completed",
];

const PAY_METHODS: LedgerPaymentMethod[] = [
  "bankTransfer",
  "swift",
  "bankTransfer",
  "cash",
  "swift",
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function shiftDate(iso: string, daysBack: number): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildPo(
  supplier: SupplierRecord,
  id: string,
  index: number,
): SupplierLinkedPo {
  const h = hashId(id);
  const openValue = Math.max(
    2_500,
    Math.round(supplier.balance * 1.8 + (h % 12_000) + (index + 1) * 3_500),
  );
  const date = shiftDate(supplier.lastTransactionDate, index * 9 + 3);
  return {
    id,
    supplierId: supplier.id,
    supplierEn: supplier.nameEn,
    supplierAr: supplier.nameAr,
    date,
    expectedDeliveryDate: shiftDate(date, -(14 + (index % 5) * 3)),
    amount: openValue,
    currency: "USD",
    status: PO_STATUSES[index % PO_STATUSES.length]!,
  };
}

function buildPurchase(
  supplier: SupplierRecord,
  id: string,
  index: number,
  share: number,
): SupplierLinkedPurchase {
  return {
    id,
    supplierId: supplier.id,
    supplierEn: supplier.nameEn,
    supplierAr: supplier.nameAr,
    date: shiftDate(supplier.lastTransactionDate, index * 11 + 2),
    amount: Math.max(100, share - index * 120),
    currency: "USD",
    status: index === 0 ? "pending" : "received",
  };
}

function buildPayment(
  supplier: SupplierRecord,
  id: string,
  index: number,
  share: number,
): SupplierLinkedPayment {
  return {
    id,
    supplierId: supplier.id,
    supplierEn: supplier.nameEn,
    supplierAr: supplier.nameAr,
    date: shiftDate(supplier.lastTransactionDate, index * 10 + 5),
    amount: Math.max(100, share - index * 80),
    currency: "USD",
    method: PAY_METHODS[index % PAY_METHODS.length]!,
    status: index === 0 ? "pending" : "posted",
  };
}

function buildCatalog() {
  const pos = new Map<string, SupplierLinkedPo>();
  const purchases = new Map<string, SupplierLinkedPurchase>();
  const payments = new Map<string, SupplierLinkedPayment>();

  for (const supplier of INITIAL_SUPPLIERS) {
    supplier.purchaseOrderIds.forEach((id, index) => {
      if (!pos.has(id)) pos.set(id, buildPo(supplier, id, index));
    });

    const purchaseShare =
      supplier.purchaseIds.length > 0
        ? Math.round(supplier.totalPurchases / supplier.purchaseIds.length)
        : 0;
    supplier.purchaseIds.forEach((id, index) => {
      if (!purchases.has(id)) {
        purchases.set(
          id,
          buildPurchase(supplier, id, index, purchaseShare),
        );
      }
    });

    const paymentShare =
      supplier.paymentIds.length > 0
        ? Math.round(supplier.totalPayments / supplier.paymentIds.length)
        : 0;
    supplier.paymentIds.forEach((id, index) => {
      if (!payments.has(id)) {
        payments.set(id, buildPayment(supplier, id, index, paymentShare));
      }
    });
  }

  return { pos, purchases, payments };
}

const CATALOG = buildCatalog();

export function findSupplierLinkedPo(
  id: string,
): SupplierLinkedPo | undefined {
  return CATALOG.pos.get(id);
}

export function findSupplierLinkedPurchase(
  id: string,
): SupplierLinkedPurchase | undefined {
  return CATALOG.purchases.get(id);
}

export function findSupplierLinkedPayment(
  id: string,
): SupplierLinkedPayment | undefined {
  return CATALOG.payments.get(id);
}

export function listSupplierPos(supplierId: string): SupplierLinkedPo[] {
  return [...CATALOG.pos.values()].filter((r) => r.supplierId === supplierId);
}

export function listSupplierPurchases(
  supplierId: string,
): SupplierLinkedPurchase[] {
  return [...CATALOG.purchases.values()].filter(
    (r) => r.supplierId === supplierId,
  );
}

export function listSupplierPayments(
  supplierId: string,
): SupplierLinkedPayment[] {
  return [...CATALOG.payments.values()].filter(
    (r) => r.supplierId === supplierId,
  );
}

/** All supplier-linked PO ids (for static params). */
export function allSupplierLinkedPoIds(): string[] {
  return [...CATALOG.pos.keys()];
}

export function allSupplierLinkedPurchaseIds(): string[] {
  return [...CATALOG.purchases.keys()];
}

export function allSupplierLinkedPaymentIds(): string[] {
  return [...CATALOG.payments.keys()];
}
