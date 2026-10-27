import {
  ClipboardList,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { findNavItemById } from "@/config/navigation";
import type { NavItemId } from "@/types/navigation";

export type MobileTabId =
  | "dashboard"
  | "inventory"
  | "sales"
  | "purchasing"
  | "suppliers"
  | "more";

export type MobileTab =
  | {
      id: Exclude<MobileTabId, "more">;
      kind: "route";
      href: string;
      icon: LucideIcon;
      labelKey: `shell.mobile.tab.${Exclude<MobileTabId, "more">}`;
      /** Nav item ids that count as selected for this tab. */
      matchIds: readonly NavItemId[];
    }
  | {
      id: "more";
      kind: "more";
      icon: LucideIcon;
      labelKey: "shell.mobile.tab.more";
    };

/**
 * Primary mobile bottom destinations.
 * Full module list remains in `NAVIGATION_GROUPS` via the drawer ("More").
 */
export const MOBILE_BOTTOM_TABS: readonly MobileTab[] = [
  {
    id: "dashboard",
    kind: "route",
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "shell.mobile.tab.dashboard",
    matchIds: ["dashboard"],
  },
  {
    id: "inventory",
    kind: "route",
    href: findNavItemById("items")?.href ?? "/items",
    icon: PackageSearch,
    labelKey: "shell.mobile.tab.inventory",
    matchIds: [
      "items",
      "spare-parts",
      "marine-engines",
      "cross-reference",
      "warehouses",
      "stock-movements",
      "stock-transfers",
      "stock-adjustments",
      "stocktaking",
      "low-stock",
    ],
  },
  {
    id: "sales",
    kind: "route",
    href: findNavItemById("customers")?.href ?? "/customers",
    icon: UsersRound,
    labelKey: "shell.mobile.tab.sales",
    matchIds: [
      "customers",
      "quotations",
      "sales-invoices",
      "sales-returns",
    ],
  },
  {
    id: "purchasing",
    kind: "route",
    href: findNavItemById("purchase-orders")?.href ?? "/purchase-orders",
    icon: ClipboardList,
    labelKey: "shell.mobile.tab.purchasing",
    matchIds: [
      "purchase-orders",
      "goods-receipts",
      "import-shipments",
      "import-costs",
    ],
  },
  {
    id: "suppliers",
    kind: "route",
    href: findNavItemById("suppliers")?.href ?? "/suppliers",
    icon: Truck,
    labelKey: "shell.mobile.tab.suppliers",
    matchIds: ["suppliers", "supplier-balances"],
  },
  {
    id: "more",
    kind: "more",
    icon: Menu,
    labelKey: "shell.mobile.tab.more",
  },
] as const;
