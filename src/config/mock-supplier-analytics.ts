/**
 * Frontend-only supplier analytics derived from a SupplierRecord + ledger links.
 * Deterministic per supplier id — demonstration data, not a live ledger.
 */

import {
  listSupplierPayments,
  listSupplierPos,
  listSupplierPurchases,
} from "@/config/mock-supplier-ledger";
import type { SupplierRecord } from "@/types/supplier";

export type SupplierPoStatus =
  | "open"
  | "inProgress"
  | "partial"
  | "completed";

export type SupplierPaymentMethod = "bankTransfer" | "swift" | "cash";

export interface SupplierMonthPoint {
  key: string;
  labelEn: string;
  labelAr: string;
  purchases: number;
  payments: number;
}

export interface SupplierCategoryShare {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  pct: number;
}

export interface SupplierRecentOrder {
  id: string;
  date: string;
  amount: number;
  status: SupplierPoStatus;
}

export interface SupplierRecentPurchase {
  id: string;
  date: string;
  amount: number;
  status: "received" | "pending";
}

export interface SupplierRecentPayment {
  id: string;
  date: string;
  amount: number;
  method: SupplierPaymentMethod;
}

export interface SupplierAnalytics {
  monthly: SupplierMonthPoint[];
  categoryShare: SupplierCategoryShare[];
  poStatus: { id: SupplierPoStatus; count: number }[];
  poTotal: number;
  openPoCount: number;
  openPoValue: number;
  reliabilityPct: number;
  trendPurchasesPct: number;
  trendPaymentsPct: number;
  trendBalancePct: number;
  recentOrders: SupplierRecentOrder[];
  recentPurchases: SupplierRecentPurchase[];
  recentPayments: SupplierRecentPayment[];
  statementLines: {
    id: string;
    date: string;
    labelEn: string;
    labelAr: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

const MONTHS: { key: string; labelEn: string; labelAr: string }[] = [
  { key: "01", labelEn: "Jan", labelAr: "يناير" },
  { key: "02", labelEn: "Feb", labelAr: "فبراير" },
  { key: "03", labelEn: "Mar", labelAr: "مارس" },
  { key: "04", labelEn: "Apr", labelAr: "أبريل" },
  { key: "05", labelEn: "May", labelAr: "مايو" },
  { key: "06", labelEn: "Jun", labelAr: "يونيو" },
  { key: "07", labelEn: "Jul", labelAr: "يوليو" },
  { key: "08", labelEn: "Aug", labelAr: "أغسطس" },
  { key: "09", labelEn: "Sep", labelAr: "سبتمبر" },
  { key: "10", labelEn: "Oct", labelAr: "أكتوبر" },
  { key: "11", labelEn: "Nov", labelAr: "نوفمبر" },
  { key: "12", labelEn: "Dec", labelAr: "ديسمبر" },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function splitTotal(total: number, weights: number[]): number[] {
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => Math.round((total * w) / sumW));
  const drift = total - raw.reduce((a, b) => a + b, 0);
  raw[raw.length - 1] += drift;
  return raw;
}

function categoryWeights(category: SupplierRecord["category"]): number[] {
  switch (category) {
    case "engines":
      return [45, 25, 15, 10, 5];
    case "spareParts":
      return [15, 45, 20, 12, 8];
    case "electrical":
      return [10, 20, 45, 15, 10];
    case "oilsFilters":
      return [5, 15, 10, 55, 15];
    default:
      return [20, 20, 20, 20, 20];
  }
}

export function getSupplierAnalytics(supplier: SupplierRecord): SupplierAnalytics {
  const h = hashId(supplier.id);
  const purchaseWeights = MONTHS.map((_, i) => 6 + ((h >> i) & 7));
  const paymentWeights = MONTHS.map((_, i) => 5 + ((h >> (i + 3)) & 7));
  const purchaseParts = splitTotal(supplier.totalPurchases, purchaseWeights);
  const paymentParts = splitTotal(supplier.totalPayments, paymentWeights);

  const monthly: SupplierMonthPoint[] = MONTHS.map((m, i) => ({
    key: m.key,
    labelEn: m.labelEn,
    labelAr: m.labelAr,
    purchases: purchaseParts[i] ?? 0,
    payments: paymentParts[i] ?? 0,
  }));

  const catLabels = [
    { id: "engines", labelEn: "Main Engines", labelAr: "محركات رئيسية" },
    { id: "parts", labelEn: "Spare Parts", labelAr: "قطع غيار" },
    { id: "electrical", labelEn: "Electrical", labelAr: "أنظمة كهربائية" },
    { id: "oils", labelEn: "Oils & Filters", labelAr: "زيوت وفلاتر" },
    { id: "other", labelEn: "Others", labelAr: "أخرى" },
  ];
  const catValues = splitTotal(
    supplier.totalPurchases,
    categoryWeights(supplier.category),
  );
  const categoryShare: SupplierCategoryShare[] = catLabels.map((c, i) => {
    const value = catValues[i] ?? 0;
    return {
      ...c,
      value,
      pct: supplier.totalPurchases
        ? Math.round((value / supplier.totalPurchases) * 100)
        : 0,
    };
  });

  const linkedOrders = listSupplierPos(supplier.id);
  const recentOrders: SupplierRecentOrder[] = linkedOrders
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      date: o.date,
      amount: o.amount,
      status: o.status,
    }));

  const poStatus: { id: SupplierPoStatus; count: number }[] = (
    ["open", "inProgress", "partial", "completed"] as const
  ).map((id) => ({
    id,
    count: linkedOrders.filter((o) => o.status === id).length,
  }));
  const poTotal = linkedOrders.length;
  const openOrders = linkedOrders.filter(
    (o) =>
      o.status === "open" ||
      o.status === "inProgress" ||
      o.status === "partial",
  );
  const openPoCount = openOrders.length;
  const openPoValue = openOrders.reduce((sum, o) => sum + o.amount, 0);

  const linkedPurchases = listSupplierPurchases(supplier.id);
  const recentPurchases: SupplierRecentPurchase[] = linkedPurchases
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      status: p.status,
    }));

  const linkedPayments = listSupplierPayments(supplier.id);
  const recentPayments: SupplierRecentPayment[] = linkedPayments
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      method: p.method,
    }));

  /** Statement movements from linked purchases/payments; ending balance = supplier.balance. */
  const movements = [
    ...linkedPurchases.map((p) => ({
      id: p.id,
      date: p.date,
      labelEn: `Purchase ${p.id}`,
      labelAr: `مشتريات ${p.id}`,
      debit: p.amount,
      credit: 0,
    })),
    ...linkedPayments.map((p) => ({
      id: p.id,
      date: p.date,
      labelEn: `Payment ${p.id}`,
      labelAr: `دفعة ${p.id}`,
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });

  const movementNet = movements.reduce(
    (sum, row) => sum + row.debit - row.credit,
    0,
  );
  const opening = supplier.balance - movementNet;
  let running = opening;
  const statementLines = [
    {
      id: `${supplier.id}-opening`,
      date: movements[0]?.date ?? supplier.lastTransactionDate,
      labelEn: "Opening balance",
      labelAr: "رصيد افتتاحي",
      debit: 0,
      credit: 0,
      balance: opening,
    },
    ...movements.map((row) => {
      running += row.debit - row.credit;
      return { ...row, balance: running };
    }),
  ];

  return {
    monthly,
    categoryShare,
    poStatus,
    poTotal,
    openPoCount,
    openPoValue,
    reliabilityPct: 88 + (h % 10),
    trendPurchasesPct: 6 + (h % 10),
    trendPaymentsPct: 4 + (h % 8),
    trendBalancePct: -(8 + (h % 12)),
    recentOrders,
    recentPurchases,
    recentPayments,
    statementLines,
  };
}
