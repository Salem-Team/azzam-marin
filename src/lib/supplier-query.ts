import type { Locale } from "@/types/i18n";
import type {
  SupplierCategoryId,
  SupplierCountryCode,
  SupplierRecord,
  SupplierStatus,
} from "@/types/supplier";

export type BalanceFilter = "all" | "withBalance" | "zeroBalance";

export type SupplierSortId =
  | "nameAsc"
  | "nameDesc"
  | "balanceDesc"
  | "purchasesDesc"
  | "lastTxDesc";

export interface SupplierFilters {
  query: string;
  country: SupplierCountryCode | "all";
  category: SupplierCategoryId | "all";
  status: SupplierStatus | "all";
  balance: BalanceFilter;
  sort: SupplierSortId;
}

export const DEFAULT_SUPPLIER_FILTERS: SupplierFilters = {
  query: "",
  country: "all",
  category: "all",
  status: "all",
  balance: "all",
  sort: "nameAsc",
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function filterSuppliers(
  suppliers: readonly SupplierRecord[],
  filters: SupplierFilters,
  locale: Locale,
  period?: { start: Date; end: Date } | null,
): SupplierRecord[] {
  const q = normalize(filters.query);
  const periodStart = period
    ? new Date(
        period.start.getFullYear(),
        period.start.getMonth(),
        period.start.getDate(),
      )
    : null;
  const periodEnd = period
    ? new Date(
        period.end.getFullYear(),
        period.end.getMonth(),
        period.end.getDate(),
        23,
        59,
        59,
        999,
      )
    : null;

  let rows = suppliers.filter((s) => {
    if (filters.country !== "all" && s.countryCode !== filters.country) {
      return false;
    }
    if (filters.category !== "all" && s.category !== filters.category) {
      return false;
    }
    if (filters.status !== "all" && s.status !== filters.status) {
      return false;
    }
    if (filters.balance === "withBalance" && s.balance <= 0) return false;
    if (filters.balance === "zeroBalance" && s.balance !== 0) return false;

    if (periodStart && periodEnd) {
      const tx = new Date(`${s.lastTransactionDate}T12:00:00`);
      if (tx < periodStart || tx > periodEnd) return false;
    }

    if (!q) return true;
    const name = locale === "ar" ? s.nameAr : s.nameEn;
    const hay = [
      name,
      s.nameEn,
      s.nameAr,
      s.code,
      s.phone,
      s.email,
      s.whatsapp,
      s.taxId,
      s.contactPerson ?? "",
      s.id,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  rows = [...rows].sort((a, b) => {
    switch (filters.sort) {
      case "nameDesc": {
        const an = locale === "ar" ? a.nameAr : a.nameEn;
        const bn = locale === "ar" ? b.nameAr : b.nameEn;
        return bn.localeCompare(an, locale === "ar" ? "ar" : "en");
      }
      case "balanceDesc":
        return b.balance - a.balance;
      case "purchasesDesc":
        return b.totalPurchases - a.totalPurchases;
      case "lastTxDesc":
        return b.lastTransactionDate.localeCompare(a.lastTransactionDate);
      case "nameAsc":
      default: {
        const an = locale === "ar" ? a.nameAr : a.nameEn;
        const bn = locale === "ar" ? b.nameAr : b.nameEn;
        return an.localeCompare(bn, locale === "ar" ? "ar" : "en");
      }
    }
  });

  return rows;
}

export function countActiveFilters(
  filters: SupplierFilters,
  extras?: { periodActive?: boolean; queryActive?: boolean },
): number {
  let n = 0;
  if (filters.country !== "all") n += 1;
  if (filters.category !== "all") n += 1;
  if (filters.status !== "all") n += 1;
  if (filters.balance !== "all") n += 1;
  if (extras?.periodActive) n += 1;
  if (extras?.queryActive) n += 1;
  return n;
}

export function exportSuppliersCsv(
  rows: readonly SupplierRecord[],
  locale: Locale,
): string {
  const headers = [
    "id",
    "code",
    "name",
    "country",
    "category",
    "taxId",
    "phone",
    "email",
    "status",
    "totalPurchasesUSD",
    "balanceUSD",
    "lastTransactionDate",
  ];
  const lines = [headers.join(",")];
  for (const s of rows) {
    const name = locale === "ar" ? s.nameAr : s.nameEn;
    const cells = [
      s.id,
      s.code,
      `"${name.replaceAll('"', '""')}"`,
      s.countryCode,
      s.category,
      s.taxId,
      s.phone,
      s.email,
      s.status,
      String(s.totalPurchases),
      String(s.balance),
      s.lastTransactionDate,
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}
