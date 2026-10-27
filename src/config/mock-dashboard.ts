/**
 * Demonstration dashboard data for AZZAM MARINE ERP.
 * Not live operational or financial figures.
 */

export type SalesMetric = "sales" | "purchases" | "profit";

export const DASHBOARD_PERIOD_LABEL = "2025" as const;

export const KPI_CARDS = [
  {
    id: "total-sales",
    labelKey: "kpi.totalSales" as const,
    value: 12_450_000,
    changePct: 12,
    sparkline: [42, 48, 45, 52, 58, 55, 62, 68, 64, 72, 78, 82],
    icon: "trending" as const,
    tone: "blue" as const,
    href: "/reports/sales",
  },
  {
    id: "gross-profit",
    labelKey: "kpi.grossProfit" as const,
    value: 3_260_000,
    changePct: 8,
    sparkline: [28, 30, 32, 31, 36, 38, 40, 42, 41, 45, 48, 50],
    icon: "profit" as const,
    tone: "green" as const,
    href: "/reports/profit",
  },
  {
    id: "inventory-value",
    labelKey: "kpi.inventoryValue" as const,
    value: 28_320_000,
    changePct: 5,
    sparkline: [70, 72, 71, 74, 76, 75, 78, 80, 79, 82, 84, 86],
    icon: "inventory" as const,
    tone: "navy" as const,
    href: "/reports/inventory",
  },
  {
    id: "open-pos",
    labelKey: "kpi.openPurchaseOrders" as const,
    value: 8_760_000,
    changePct: -18,
    sparkline: [90, 85, 82, 78, 75, 70, 68, 62, 58, 55, 50, 48],
    icon: "orders" as const,
    tone: "red" as const,
    href: "/purchase-orders",
  },
  {
    id: "receivables",
    labelKey: "kpi.customerReceivables" as const,
    value: 6_320_000,
    changePct: 7,
    sparkline: [40, 42, 44, 43, 48, 50, 52, 54, 53, 58, 60, 62],
    icon: "receivables" as const,
    tone: "orange" as const,
    href: "/customer-balances",
  },
] as const;

export const SALES_TREND_MONTHS = [
  { key: "jan", labelEn: "Jan", labelAr: "يناير", sales: 2_150_000, purchases: 1_480_000, profit: 620_000 },
  { key: "feb", labelEn: "Feb", labelAr: "فبراير", sales: 2_420_000, purchases: 1_620_000, profit: 710_000 },
  { key: "mar", labelEn: "Mar", labelAr: "مارس", sales: 2_780_000, purchases: 1_850_000, profit: 820_000 },
  { key: "apr", labelEn: "Apr", labelAr: "أبريل", sales: 2_560_000, purchases: 1_720_000, profit: 760_000 },
  { key: "may", labelEn: "May", labelAr: "مايو", sales: 3_050_000, purchases: 2_040_000, profit: 910_000 },
  { key: "jun", labelEn: "Jun", labelAr: "يونيو", sales: 3_280_000, purchases: 2_180_000, profit: 980_000 },
  { key: "jul", labelEn: "Jul", labelAr: "يوليو", sales: 2_960_000, purchases: 1_980_000, profit: 880_000 },
  { key: "aug", labelEn: "Aug", labelAr: "أغسطس", sales: 3_420_000, purchases: 2_260_000, profit: 1_050_000 },
  { key: "sep", labelEn: "Sep", labelAr: "سبتمبر", sales: 3_180_000, purchases: 2_120_000, profit: 960_000 },
  { key: "oct", labelEn: "Oct", labelAr: "أكتوبر", sales: 3_650_000, purchases: 2_380_000, profit: 1_120_000 },
  { key: "nov", labelEn: "Nov", labelAr: "نوفمبر", sales: 3_480_000, purchases: 2_300_000, profit: 1_080_000 },
  { key: "dec", labelEn: "Dec", labelAr: "ديسمبر", sales: 3_920_000, purchases: 2_520_000, profit: 1_220_000 },
] as const;

export const PRODUCT_CATEGORIES = [
  { id: "marine-engines", labelKey: "cat.marineEngines" as const, value: 9_056_000, pct: 32, color: "#075DE8" },
  { id: "engine-parts", labelKey: "cat.engineParts" as const, value: 6_792_000, pct: 24, color: "#12345A" },
  { id: "filters", labelKey: "cat.filters" as const, value: 4_245_000, pct: 15, color: "#1674F5" },
  { id: "electrical", labelKey: "cat.electrical" as const, value: 3_396_000, pct: 12, color: "#2584FF" },
  { id: "lubricants", labelKey: "cat.lubricants" as const, value: 2_264_000, pct: 8, color: "#5B8DEF" },
  { id: "others", labelKey: "cat.others" as const, value: 2_547_000, pct: 9, color: "#94A3B8" },
] as const;

export const PRODUCT_CATEGORIES_TOTAL = 28_300_000;

export const INVENTORY_STATUS = [
  { id: "in-stock", labelKey: "inv.inStock" as const, count: 8320, pct: 67, color: "#16865A" },
  { id: "low-stock", labelKey: "inv.lowStock" as const, count: 2150, pct: 17, color: "#B7791F" },
  { id: "out-of-stock", labelKey: "inv.outOfStock" as const, count: 860, pct: 7, color: "#C62832" },
  { id: "over-stock", labelKey: "inv.overStock" as const, count: 450, pct: 4, color: "#075DE8" },
  { id: "pending", labelKey: "inv.pendingReceipt" as const, count: 700, pct: 5, color: "#64748B" },
] as const;

export const INVENTORY_TOTAL = 12_480;

export const PURCHASE_ORDERS = [
  {
    id: "PO-2025-0032",
    supplierEn: "Yanmar Parts Supplier",
    supplierAr: "مورد قطع يانمار",
    status: "pending" as const,
    amount: 1_250_000,
    dateEn: "2 days ago",
    dateAr: "منذ يومين",
    icon: "file" as const,
    tone: "blue" as const,
  },
  {
    id: "PO-2025-0031",
    supplierEn: "Mitsubishi Marine",
    supplierAr: "ميتسوبيشي مارين",
    status: "approved" as const,
    amount: 980_000,
    dateEn: "5 days ago",
    dateAr: "منذ ٥ أيام",
    icon: "warehouse" as const,
    tone: "green" as const,
  },
  {
    id: "PO-2025-0030",
    supplierEn: "Caterpillar Parts",
    supplierAr: "قطع كاتربيلر",
    status: "inTransit" as const,
    amount: 2_340_000,
    dateEn: "Jan 10, 2025",
    dateAr: "١٠ يناير ٢٠٢٥",
    icon: "activity" as const,
    tone: "orange" as const,
  },
  {
    id: "PO-2025-0029",
    supplierEn: "Volvo Penta Supplier",
    supplierAr: "مورد فولفو بنتا",
    status: "delivered" as const,
    amount: 860_000,
    dateEn: "Jan 8, 2025",
    dateAr: "٨ يناير ٢٠٢٥",
    icon: "file" as const,
    tone: "blue" as const,
  },
] as const;

export const SHIPMENT_STATUS = [
  { id: "in-transit", labelKey: "ship.inTransit" as const, count: 5, color: "#075DE8" },
  { id: "arrived", labelKey: "ship.arrivedAtPort" as const, count: 3, color: "#1674F5" },
  { id: "customs", labelKey: "ship.customsClearance" as const, count: 2, color: "#B7791F" },
  { id: "delivered", labelKey: "ship.delivered" as const, count: 8, color: "#16865A" },
  { id: "delayed", labelKey: "ship.delayed" as const, count: 2, color: "#C62832" },
] as const;

export const LOW_STOCK_ITEMS = [
  {
    id: 1,
    partNumber: "6LY2-12345",
    nameEn: "Fuel Filter Element",
    nameAr: "عنصر فلتر وقود",
    current: 3,
    min: 10,
    status: "low" as const,
  },
  {
    id: 2,
    partNumber: "8M-45678",
    nameEn: "Oil Filter",
    nameAr: "فلتر زيت",
    current: 2,
    min: 10,
    status: "low" as const,
  },
  {
    id: 3,
    partNumber: "876543-21",
    nameEn: "Impeller Kit",
    nameAr: "طقم إمبلر",
    current: 1,
    min: 5,
    status: "low" as const,
  },
  {
    id: 4,
    partNumber: "REC-358907",
    nameEn: "Alternator 24V",
    nameAr: "مولد 24 فولت",
    current: 0,
    min: 3,
    status: "out" as const,
  },
  {
    id: 5,
    partNumber: "18-7789",
    nameEn: "Thermostat",
    nameAr: "ثرموستات",
    current: 4,
    min: 10,
    status: "low" as const,
  },
] as const;

export const RECENT_ACTIVITIES = [
  {
    id: "a1",
    titleKey: "act.salesInvoice" as const,
    detailEn: "Created for Ocean Marine Co.",
    detailAr: "تم الإنشاء لشركة أوشن مارين",
    timeEn: "2 minutes ago",
    timeAr: "منذ دقيقتين",
    categoryKey: "act.cat.sales" as const,
    tone: "blue" as const,
    dot: "outline-green" as const,
  },
  {
    id: "a2",
    titleKey: "act.purchaseOrder" as const,
    detailEn: "Created for Yanmar Parts Supplier",
    detailAr: "تم الإنشاء لمورد قطع يانمار",
    timeEn: "15 minutes ago",
    timeAr: "منذ 15 دقيقة",
    categoryKey: "act.cat.purchase" as const,
    tone: "red" as const,
    dot: "solid-green" as const,
    recordId: "PO-2025-0032",
    recordKind: "purchase-order" as const,
  },
  {
    id: "a3",
    titleKey: "act.paymentReceived" as const,
    detailEn: "EGP 250,000 from Delta Marine",
    detailAr: "250,000 ج.م من دلتا مارين",
    highlightEn: "EGP 250,000",
    highlightAr: "250,000 ج.م",
    timeEn: "1 hour ago",
    timeAr: "منذ ساعة",
    categoryKey: "act.cat.finance" as const,
    tone: "green" as const,
    dot: "outline-blue" as const,
  },
  {
    id: "a4",
    titleKey: "act.goodsReceipt" as const,
    detailEn: "50 items received",
    detailAr: "استلام ٥٠ صنفًا",
    timeEn: "2 hours ago",
    timeAr: "منذ ساعتين",
    categoryKey: "act.cat.inventory" as const,
    tone: "blue" as const,
    dot: "outline-blue" as const,
  },
  {
    id: "a5",
    titleKey: "act.exchangeUpdated" as const,
    detailEn: "USD = 50.25 EGP",
    detailAr: "الدولار = ٥٠٫٢٥ ج.م",
    timeEn: "3 hours ago",
    timeAr: "منذ ٣ ساعات",
    categoryKey: "act.cat.pricing" as const,
    tone: "orange" as const,
    dot: "outline-blue" as const,
  },
] as const;

export const EXCHANGE_RATES = [
  { code: "USD", rate: 50.25, changePct: 0.3 },
  { code: "EUR", rate: 54.8, changePct: -0.15 },
  { code: "SAR", rate: 13.4, changePct: 0.2 },
  { code: "AED", rate: 13.7, changePct: 0.18 },
  { code: "GBP", rate: 64.25, changePct: -0.22 },
] as const;

export const WELCOME_TRUST = [
  { id: "quality", labelKey: "welcome.quality" as const },
  { id: "supply", labelKey: "welcome.supply" as const },
  { id: "performance", labelKey: "welcome.performance" as const },
] as const;

export const DATE_RANGE_LABEL = {
  en: "Jan 1, 2025 – Dec 31, 2025",
  ar: "١ يناير ٢٠٢٥ – ٣١ ديسمبر ٢٠٢٥",
} as const;
