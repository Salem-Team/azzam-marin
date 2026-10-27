import type { LucideIcon } from "lucide-react";

export type NavItemId =
  | "dashboard"
  | "items"
  | "spare-parts"
  | "marine-engines"
  | "cross-reference"
  | "warehouses"
  | "stock-movements"
  | "stock-transfers"
  | "stock-adjustments"
  | "stocktaking"
  | "low-stock"
  | "suppliers"
  | "purchase-orders"
  | "goods-receipts"
  | "import-shipments"
  | "import-costs"
  | "customers"
  | "quotations"
  | "sales-invoices"
  | "sales-returns"
  | "price-lists"
  | "exchange-rates"
  | "bulk-price-updates"
  | "automatic-repricing"
  | "price-history"
  | "financial-overview"
  | "cashboxes"
  | "bank-accounts"
  | "receipts-payments"
  | "customer-balances"
  | "supplier-balances"
  | "sales-reports"
  | "inventory-reports"
  | "purchasing-import-reports"
  | "profit-reports"
  | "financial-reports"
  | "audit-log"
  | "users-permissions"
  | "company-settings"
  | "document-numbering"
  | "languages"
  | "hardware-integration"
  | "backup-restore";

export type NavGroupId =
  | "main"
  | "products-inventory"
  | "purchasing-import"
  | "sales-customers"
  | "pricing-exchange"
  | "finance"
  | "reports-control"
  | "system-settings";

export type TranslationKey =
  | `nav.group.${NavGroupId}`
  | `nav.item.${NavItemId}`
  | "app.name"
  | "app.shortName"
  | "app.descriptor"
  | "shell.searchPlaceholder"
  | "shell.searchHint"
  | "shell.searchTitle"
  | "shell.searchEmpty"
  | "shell.searchNoResults"
  | "shell.searchShortcut"
  | "shell.searchSuggested"
  | "shell.searchClear"
  | "shell.searchNavigate"
  | "shell.searchSelect"
  | "shell.searchClose"
  | "shell.searchEsc"
  | "shell.notifications"
  | "shell.notificationsEmpty"
  | "shell.notificationsEmptyHint"
  | "shell.notificationsViewAll"
  | "shell.notificationsNew"
  | "shell.toggleSidebar"
  | "shell.openMenu"
  | "shell.closeMenu"
  | "shell.language"
  | "shell.language.en"
  | "shell.language.ar"
  | "shell.language.switchToEn"
  | "shell.language.switchToAr"
  | "shell.theme.toLight"
  | "shell.theme.toDark"
  | "shell.theme.toSystem"
  | "shell.theme.system"
  | "shell.user.profile"
  | "shell.user.settings"
  | "shell.user.signOut"
  | "shell.user.mockNote"
  | "shell.user.accountMenu"
  | "shell.breadcrumbs.home"
  | "shell.module.comingSoon"
  | "shell.module.comingSoonHint"
  | "shell.module.frontendOnly"
  | "shell.collapse"
  | "shell.expand"
  | "shell.mobile.tab.dashboard"
  | "shell.mobile.tab.inventory"
  | "shell.mobile.tab.sales"
  | "shell.mobile.tab.purchasing"
  | "shell.mobile.tab.suppliers"
  | "shell.mobile.tab.more"
  | "shell.mobile.navLabel";

export interface NavItem {
  id: NavItemId;
  href: string;
  icon: LucideIcon;
  labelKey: `nav.item.${NavItemId}`;
  /** Optional frontend visibility flag for future permission wiring */
  permissionKey?: string;
}

export interface NavGroup {
  id: NavGroupId;
  labelKey: `nav.group.${NavGroupId}`;
  items: readonly NavItem[];
  /** When true, items render at the top level without a group header. */
  flat?: boolean;
}
