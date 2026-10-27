import {
  ArrowLeftRight,
  ArrowRightLeft,
  Banknote,
  Building2,
  Calculator,
  ChartBar,
  ChartColumnIncreasing,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Container,
  DatabaseBackup,
  FileChartColumn,
  FileText,
  GitCompareArrows,
  Hash,
  History,
  Landmark,
  Languages,
  LayoutDashboard,
  ListChecks,
  Cog,
  PackageCheck,
  PackageSearch,
  PackageX,
  Printer,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  ShieldUser,
  Ship,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  Truck,
  Undo2,
  UserRoundCheck,
  UsersRound,
  Wallet,
  Warehouse,
  Handshake,
} from "lucide-react";

import type { NavGroup, NavItem, NavItemId } from "@/types/navigation";

export const NAVIGATION_GROUPS: readonly NavGroup[] = [
  {
    id: "main",
    labelKey: "nav.group.main",
    flat: true,
    items: [
      {
        id: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        labelKey: "nav.item.dashboard",
        permissionKey: "dashboard.view",
      },
    ],
  },
  {
    id: "products-inventory",
    labelKey: "nav.group.products-inventory",
    items: [
      {
        id: "items",
        href: "/items",
        icon: PackageSearch,
        labelKey: "nav.item.items",
        permissionKey: "products.view",
      },
      {
        id: "spare-parts",
        href: "/spare-parts",
        icon: Cog,
        labelKey: "nav.item.spare-parts",
        permissionKey: "spare_parts.view",
      },
      {
        id: "marine-engines",
        href: "/marine-engines",
        icon: Ship,
        labelKey: "nav.item.marine-engines",
        permissionKey: "engines.view",
      },
      {
        id: "cross-reference",
        href: "/cross-reference",
        icon: GitCompareArrows,
        labelKey: "nav.item.cross-reference",
        permissionKey: "cross_reference.view",
      },
      {
        id: "warehouses",
        href: "/warehouses",
        icon: Warehouse,
        labelKey: "nav.item.warehouses",
        permissionKey: "warehouses.view",
      },
      {
        id: "stock-movements",
        href: "/stock-movements",
        icon: ArrowLeftRight,
        labelKey: "nav.item.stock-movements",
        permissionKey: "stock.movements.view",
      },
      {
        id: "stock-transfers",
        href: "/stock-transfers",
        icon: ArrowRightLeft,
        labelKey: "nav.item.stock-transfers",
        permissionKey: "stock.transfers.view",
      },
      {
        id: "stock-adjustments",
        href: "/stock-adjustments",
        icon: SlidersHorizontal,
        labelKey: "nav.item.stock-adjustments",
        permissionKey: "stock.adjustments.view",
      },
      {
        id: "stocktaking",
        href: "/stocktaking",
        icon: ClipboardCheck,
        labelKey: "nav.item.stocktaking",
        permissionKey: "stock.stocktaking.view",
      },
      {
        id: "low-stock",
        href: "/low-stock",
        icon: PackageX,
        labelKey: "nav.item.low-stock",
        permissionKey: "stock.low.view",
      },
    ],
  },
  {
    id: "purchasing-import",
    labelKey: "nav.group.purchasing-import",
    items: [
      {
        id: "suppliers",
        href: "/suppliers",
        icon: Truck,
        labelKey: "nav.item.suppliers",
        permissionKey: "suppliers.view",
      },
      {
        id: "purchase-orders",
        href: "/purchase-orders",
        icon: ClipboardList,
        labelKey: "nav.item.purchase-orders",
        permissionKey: "purchasing.orders.view",
      },
      {
        id: "goods-receipts",
        href: "/goods-receipts",
        icon: PackageCheck,
        labelKey: "nav.item.goods-receipts",
        permissionKey: "purchasing.receipts.view",
      },
      {
        id: "import-shipments",
        href: "/import-shipments",
        icon: Container,
        labelKey: "nav.item.import-shipments",
        permissionKey: "import.shipments.view",
      },
      {
        id: "import-costs",
        href: "/import-costs",
        icon: Calculator,
        labelKey: "nav.item.import-costs",
        permissionKey: "import.costs.view",
      },
    ],
  },
  {
    id: "sales-customers",
    labelKey: "nav.group.sales-customers",
    items: [
      {
        id: "customers",
        href: "/customers",
        icon: UsersRound,
        labelKey: "nav.item.customers",
        permissionKey: "customers.view",
      },
      {
        id: "quotations",
        href: "/quotations",
        icon: FileText,
        labelKey: "nav.item.quotations",
        permissionKey: "sales.quotations.view",
      },
      {
        id: "sales-invoices",
        href: "/sales-invoices",
        icon: ReceiptText,
        labelKey: "nav.item.sales-invoices",
        permissionKey: "sales.invoices.view",
      },
      {
        id: "sales-returns",
        href: "/sales-returns",
        icon: Undo2,
        labelKey: "nav.item.sales-returns",
        permissionKey: "sales.returns.view",
      },
    ],
  },
  {
    id: "pricing-exchange",
    labelKey: "nav.group.pricing-exchange",
    items: [
      {
        id: "price-lists",
        href: "/price-lists",
        icon: Tags,
        labelKey: "nav.item.price-lists",
        permissionKey: "pricing.lists.view",
      },
      {
        id: "exchange-rates",
        href: "/exchange-rates",
        icon: CircleDollarSign,
        labelKey: "nav.item.exchange-rates",
        permissionKey: "pricing.rates.view",
      },
      {
        id: "bulk-price-updates",
        href: "/bulk-price-updates",
        icon: ListChecks,
        labelKey: "nav.item.bulk-price-updates",
        permissionKey: "pricing.bulk.view",
      },
      {
        id: "automatic-repricing",
        href: "/automatic-repricing",
        icon: RefreshCw,
        labelKey: "nav.item.automatic-repricing",
        permissionKey: "pricing.auto.view",
      },
      {
        id: "price-history",
        href: "/price-history",
        icon: History,
        labelKey: "nav.item.price-history",
        permissionKey: "pricing.history.view",
      },
    ],
  },
  {
    id: "finance",
    labelKey: "nav.group.finance",
    items: [
      {
        id: "financial-overview",
        href: "/finance",
        icon: ChartNoAxesCombined,
        labelKey: "nav.item.financial-overview",
        permissionKey: "finance.overview.view",
      },
      {
        id: "cashboxes",
        href: "/cashboxes",
        icon: Wallet,
        labelKey: "nav.item.cashboxes",
        permissionKey: "finance.cashboxes.view",
      },
      {
        id: "bank-accounts",
        href: "/bank-accounts",
        icon: Landmark,
        labelKey: "nav.item.bank-accounts",
        permissionKey: "finance.banks.view",
      },
      {
        id: "receipts-payments",
        href: "/receipts-payments",
        icon: Banknote,
        labelKey: "nav.item.receipts-payments",
        permissionKey: "finance.payments.view",
      },
      {
        id: "customer-balances",
        href: "/customer-balances",
        icon: UserRoundCheck,
        labelKey: "nav.item.customer-balances",
        permissionKey: "finance.customer_balances.view",
      },
      {
        id: "supplier-balances",
        href: "/supplier-balances",
        icon: Handshake,
        labelKey: "nav.item.supplier-balances",
        permissionKey: "finance.supplier_balances.view",
      },
    ],
  },
  {
    id: "reports-control",
    labelKey: "nav.group.reports-control",
    items: [
      {
        id: "sales-reports",
        href: "/reports/sales",
        icon: ChartColumnIncreasing,
        labelKey: "nav.item.sales-reports",
        permissionKey: "reports.sales.view",
      },
      {
        id: "inventory-reports",
        href: "/reports/inventory",
        icon: ChartNoAxesCombined,
        labelKey: "nav.item.inventory-reports",
        permissionKey: "reports.inventory.view",
      },
      {
        id: "purchasing-import-reports",
        href: "/reports/purchasing-import",
        icon: ChartBar,
        labelKey: "nav.item.purchasing-import-reports",
        permissionKey: "reports.purchasing.view",
      },
      {
        id: "profit-reports",
        href: "/reports/profit",
        icon: TrendingUp,
        labelKey: "nav.item.profit-reports",
        permissionKey: "reports.profit.view",
      },
      {
        id: "financial-reports",
        href: "/reports/financial",
        icon: FileChartColumn,
        labelKey: "nav.item.financial-reports",
        permissionKey: "reports.financial.view",
      },
      {
        id: "audit-log",
        href: "/audit-log",
        icon: ShieldCheck,
        labelKey: "nav.item.audit-log",
        permissionKey: "audit.view",
      },
    ],
  },
  {
    id: "system-settings",
    labelKey: "nav.group.system-settings",
    items: [
      {
        id: "users-permissions",
        href: "/settings/users",
        icon: ShieldUser,
        labelKey: "nav.item.users-permissions",
        permissionKey: "settings.users.view",
      },
      {
        id: "company-settings",
        href: "/settings/company",
        icon: Building2,
        labelKey: "nav.item.company-settings",
        permissionKey: "settings.company.view",
      },
      {
        id: "document-numbering",
        href: "/settings/document-numbering",
        icon: Hash,
        labelKey: "nav.item.document-numbering",
        permissionKey: "settings.numbering.view",
      },
      {
        id: "languages",
        href: "/settings/languages",
        icon: Languages,
        labelKey: "nav.item.languages",
        permissionKey: "settings.languages.view",
      },
      {
        id: "hardware-integration",
        href: "/settings/hardware",
        icon: Printer,
        labelKey: "nav.item.hardware-integration",
        permissionKey: "settings.hardware.view",
      },
      {
        id: "backup-restore",
        href: "/settings/backup",
        icon: DatabaseBackup,
        labelKey: "nav.item.backup-restore",
        permissionKey: "settings.backup.view",
      },
    ],
  },
] as const;

export const ALL_NAV_ITEMS: readonly NavItem[] = NAVIGATION_GROUPS.flatMap(
  (group) => group.items,
);

export function findNavItemByHref(pathname: string): NavItem | undefined {
  const exact = ALL_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;
  return ALL_NAV_ITEMS.find(
    (item) => item.href !== "/" && pathname.startsWith(`${item.href}/`),
  );
}

export function findGroupForItem(itemId: NavItemId) {
  return NAVIGATION_GROUPS.find((group) =>
    group.items.some((item) => item.id === itemId),
  );
}

export function findNavItemById(itemId: NavItemId) {
  return ALL_NAV_ITEMS.find((item) => item.id === itemId);
}

/**
 * Leaf navigation count.
 * Annex lists Spare Parts Management separately from the item catalog;
 * inventory group is 10 leaves → **43** total (was 42 when items+spares were merged).
 */
export const NAV_ITEM_COUNT = ALL_NAV_ITEMS.length;
