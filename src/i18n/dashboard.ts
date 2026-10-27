import type { Locale } from "@/types/i18n";

export type DashboardKey =
  | "welcome.greeting"
  | "welcome.quality"
  | "welcome.supply"
  | "welcome.performance"
  | "welcome.dateRange"
  | "period.filter"
  | "period.selectTitle"
  | "period.quick"
  | "period.calendar"
  | "period.quarters"
  | "period.year"
  | "period.today"
  | "period.yesterday"
  | "period.last7"
  | "period.last30"
  | "period.current"
  | "period.lastMonth"
  | "period.thisQuarter"
  | "period.prevQuarter"
  | "period.thisYear"
  | "period.fiscalYear"
  | "period.q1"
  | "period.q2"
  | "period.q3"
  | "period.q4"
  | "period.from"
  | "period.to"
  | "period.apply"
  | "period.cancel"
  | "period.clear"
  | "period.close"
  | "kpi.totalSales"
  | "kpi.grossProfit"
  | "kpi.inventoryValue"
  | "kpi.openPurchaseOrders"
  | "kpi.customerReceivables"
  | "kpi.vsLastPeriod"
  | "dash.goTo"
  | "chart.salesTrend"
  | "chart.sales"
  | "chart.purchases"
  | "chart.profit"
  | "chart.monthly"
  | "chart.quarterly"
  | "chart.yearly"
  | "chart.periodMenu"
  | "chart.topCategories"
  | "chart.byValue"
  | "chart.byQuantity"
  | "chart.metricMenu"
  | "chart.totalValue"
  | "chart.inventoryStatus"
  | "chart.totalItems"
  | "inv.inStock"
  | "inv.lowStock"
  | "inv.outOfStock"
  | "inv.overStock"
  | "inv.pendingReceipt"
  | "po.title"
  | "po.viewAll"
  | "po.status.pending"
  | "po.status.approved"
  | "po.status.inTransit"
  | "po.status.delivered"
  | "ship.title"
  | "ship.inTransit"
  | "ship.arrivedAtPort"
  | "ship.customsClearance"
  | "ship.delivered"
  | "ship.delayed"
  | "lowStock.title"
  | "lowStock.viewAll"
  | "lowStock.col.index"
  | "lowStock.col.part"
  | "lowStock.col.name"
  | "lowStock.col.current"
  | "lowStock.col.min"
  | "lowStock.col.stock"
  | "lowStock.col.status"
  | "lowStock.status.low"
  | "lowStock.status.out"
  | "lowStock.status.ok"
  | "product.details"
  | "product.notFound"
  | "product.backToLowStock"
  | "product.partNumber"
  | "product.name"
  | "product.category"
  | "product.warehouse"
  | "product.stock"
  | "product.minStock"
  | "product.status"
  | "product.openRecord"
  | "po.details"
  | "po.notFound"
  | "po.id"
  | "po.supplier"
  | "po.amount"
  | "po.date"
  | "po.statusLabel"
  | "po.openRecord"
  | "act.title"
  | "act.salesInvoice"
  | "act.purchaseOrder"
  | "act.paymentReceived"
  | "act.goodsReceipt"
  | "act.exchangeUpdated"
  | "act.cat.sales"
  | "act.cat.purchase"
  | "act.cat.finance"
  | "act.cat.inventory"
  | "act.cat.pricing"
  | "fx.title"
  | "fx.currency"
  | "fx.rate"
  | "fx.change"
  | "fx.demoNote"
  | "cat.marineEngines"
  | "cat.engineParts"
  | "cat.filters"
  | "cat.electrical"
  | "cat.lubricants"
  | "cat.others";

const en: Record<DashboardKey, string> = {
  "welcome.greeting": "Good Morning, Ahmed 👋",
  "welcome.quality": "Quality Parts",
  "welcome.supply": "Global Supply",
  "welcome.performance": "Trusted Performance",
  "welcome.dateRange": "Jan 1, 2025 – Dec 31, 2025",
  "period.filter": "Period",
  "period.selectTitle": "Select Date Range",
  "period.quick": "Quick periods",
  "period.calendar": "Calendar",
  "period.quarters": "Quarterly",
  "period.year": "Fiscal year",
  "period.today": "Today",
  "period.yesterday": "Yesterday",
  "period.last7": "Last 7 days",
  "period.last30": "Last 30 days",
  "period.current": "This month",
  "period.lastMonth": "Last month",
  "period.thisQuarter": "Current quarter",
  "period.prevQuarter": "Previous quarter",
  "period.thisYear": "This year",
  "period.fiscalYear": "Fiscal year",
  "period.q1": "Q1",
  "period.q2": "Q2",
  "period.q3": "Q3",
  "period.q4": "Q4",
  "period.from": "From",
  "period.to": "To",
  "period.apply": "Apply",
  "period.cancel": "Cancel",
  "period.clear": "Clear",
  "period.close": "Close",
  "kpi.totalSales": "Total Sales",
  "kpi.grossProfit": "Gross Profit",
  "kpi.inventoryValue": "Inventory Value",
  "kpi.openPurchaseOrders": "Open Purchase Orders",
  "kpi.customerReceivables": "Customer Receivables",
  "kpi.vsLastPeriod": "vs last month",
  "dash.goTo": "Go to",
  "chart.salesTrend": "Sales Trend",
  "chart.sales": "Sales",
  "chart.purchases": "Purchases",
  "chart.profit": "Profit",
  "chart.monthly": "Monthly",
  "chart.quarterly": "Quarterly",
  "chart.yearly": "Yearly",
  "chart.periodMenu": "Chart period",
  "chart.topCategories": "Top Product Categories",
  "chart.byValue": "By Value",
  "chart.byQuantity": "By Quantity",
  "chart.metricMenu": "Category metric",
  "chart.totalValue": "Total Value",
  "chart.inventoryStatus": "Inventory Status",
  "chart.totalItems": "Total Items",
  "inv.inStock": "In Stock",
  "inv.lowStock": "Low Stock",
  "inv.outOfStock": "Out of Stock",
  "inv.overStock": "Over Stock",
  "inv.pendingReceipt": "Pending Receipt",
  "po.title": "Purchase Orders",
  "po.viewAll": "View All",
  "po.status.pending": "Pending",
  "po.status.approved": "Approved",
  "po.status.inTransit": "In Transit",
  "po.status.delivered": "Delivered",
  "ship.title": "Shipment Status",
  "ship.inTransit": "In Transit",
  "ship.arrivedAtPort": "Arrived at Port",
  "ship.customsClearance": "Customs Clearance",
  "ship.delivered": "Delivered",
  "ship.delayed": "Delayed",
  "lowStock.title": "Low Stock Items",
  "lowStock.viewAll": "View All",
  "lowStock.col.index": "#",
  "lowStock.col.part": "Part Number",
  "lowStock.col.name": "Item Name",
  "lowStock.col.current": "Current Stock",
  "lowStock.col.min": "Min. Stock",
  "lowStock.col.stock": "Stock",
  "lowStock.col.status": "Status",
  "lowStock.status.low": "Low Stock",
  "lowStock.status.out": "Out of Stock",
  "lowStock.status.ok": "In Stock",
  "product.details": "Product Details",
  "product.notFound": "Product not found",
  "product.backToLowStock": "Back to Low Stock",
  "product.partNumber": "Part Number",
  "product.name": "Item Name",
  "product.category": "Category",
  "product.warehouse": "Warehouse",
  "product.stock": "Current Stock",
  "product.minStock": "Min. Stock",
  "product.status": "Status",
  "product.openRecord": "Open product",
  "po.details": "Purchase Order",
  "po.notFound": "Purchase order not found",
  "po.id": "PO Number",
  "po.supplier": "Supplier",
  "po.amount": "Amount",
  "po.date": "Date",
  "po.statusLabel": "Status",
  "po.openRecord": "Open purchase order",
  "act.title": "Recent Activities",
  "act.salesInvoice": "Sales Invoice #SI-2025-0048",
  "act.purchaseOrder": "Purchase Order #PO-2025-0032",
  "act.paymentReceived": "Payment Received",
  "act.goodsReceipt": "Goods Receipt #GR-2025-0019",
  "act.exchangeUpdated": "Exchange Rate Updated",
  "act.cat.sales": "Sales",
  "act.cat.purchase": "Purchase",
  "act.cat.finance": "Finance",
  "act.cat.inventory": "Inventory",
  "act.cat.pricing": "Pricing",
  "fx.title": "Exchange Rates",
  "fx.currency": "Currency",
  "fx.rate": "vs EGP",
  "fx.change": "Change",
  "fx.demoNote": "Demonstration rates — not live market data",
  "cat.marineEngines": "Marine Engines",
  "cat.engineParts": "Engine Parts",
  "cat.filters": "Filters",
  "cat.electrical": "Electrical Parts",
  "cat.lubricants": "Lubricants",
  "cat.others": "Others",
};

const ar: Record<DashboardKey, string> = {
  "welcome.greeting": "صباح الخير، أحمد 👋",
  "welcome.quality": "قطع عالية الجودة",
  "welcome.supply": "توريد عالمي",
  "welcome.performance": "أداء موثوق",
  "welcome.dateRange": "١ يناير ٢٠٢٥ – ٣١ ديسمبر ٢٠٢٥",
  "period.filter": "الفترة",
  "period.selectTitle": "اختيار الفترة الزمنية",
  "period.quick": "فترات سريعة",
  "period.calendar": "تقويم",
  "period.quarters": "ربع سنوي",
  "period.year": "سنة مالية",
  "period.today": "اليوم",
  "period.yesterday": "أمس",
  "period.last7": "آخر 7 أيام",
  "period.last30": "آخر 30 يومًا",
  "period.current": "الشهر الحالي",
  "period.lastMonth": "الشهر الماضي",
  "period.thisQuarter": "الربع الحالي",
  "period.prevQuarter": "الربع السابق",
  "period.thisYear": "السنة الحالية",
  "period.fiscalYear": "السنة المالية",
  "period.q1": "Q1",
  "period.q2": "Q2",
  "period.q3": "Q3",
  "period.q4": "Q4",
  "period.from": "من",
  "period.to": "إلى",
  "period.apply": "تطبيق",
  "period.cancel": "إلغاء",
  "period.clear": "مسح",
  "period.close": "إغلاق",
  "kpi.totalSales": "إجمالي المبيعات",
  "kpi.grossProfit": "إجمالي الربح",
  "kpi.inventoryValue": "قيمة المخزون",
  "kpi.openPurchaseOrders": "أوامر الشراء المفتوحة",
  "kpi.customerReceivables": "مستحقات العملاء",
  "kpi.vsLastPeriod": "مقارنة بالشهر اللي فات",
  "dash.goTo": "الانتقال إلى",
  "chart.salesTrend": "اتجاه المبيعات",
  "chart.sales": "المبيعات",
  "chart.purchases": "المشتريات",
  "chart.profit": "الربح",
  "chart.monthly": "شهري",
  "chart.quarterly": "ربع سنوي",
  "chart.yearly": "سنوي",
  "chart.periodMenu": "فترة الرسم",
  "chart.topCategories": "أعلى فئات المنتجات",
  "chart.byValue": "حسب القيمة",
  "chart.byQuantity": "حسب الكمية",
  "chart.metricMenu": "مقياس الفئة",
  "chart.totalValue": "إجمالي القيمة",
  "chart.inventoryStatus": "حالة المخزون",
  "chart.totalItems": "إجمالي الأصناف",
  "inv.inStock": "متوفر",
  "inv.lowStock": "مخزون منخفض",
  "inv.outOfStock": "غير متوفر",
  "inv.overStock": "مخزون زائد",
  "inv.pendingReceipt": "بانتظار الاستلام",
  "po.title": "أوامر الشراء",
  "po.viewAll": "عرض الكل",
  "po.status.pending": "قيد الانتظار",
  "po.status.approved": "معتمد",
  "po.status.inTransit": "قيد الشحن",
  "po.status.delivered": "تم التسليم",
  "ship.title": "حالة الشحنات",
  "ship.inTransit": "قيد الشحن",
  "ship.arrivedAtPort": "وصلت إلى الميناء",
  "ship.customsClearance": "التخليص الجمركي",
  "ship.delivered": "تم التسليم",
  "ship.delayed": "متأخرة",
  "lowStock.title": "أصناف منخفضة المخزون",
  "lowStock.viewAll": "عرض الكل",
  "lowStock.col.index": "#",
  "lowStock.col.part": "رقم القطعة",
  "lowStock.col.name": "اسم الصنف",
  "lowStock.col.current": "المخزون الحالي",
  "lowStock.col.min": "الحد الأدنى",
  "lowStock.col.stock": "المخزون",
  "lowStock.col.status": "الحالة",
  "lowStock.status.low": "مخزون منخفض",
  "lowStock.status.out": "غير متوفر",
  "lowStock.status.ok": "متوفر",
  "product.details": "تفاصيل الصنف",
  "product.notFound": "الصنف غير موجود",
  "product.backToLowStock": "العودة للأصناف منخفضة المخزون",
  "product.partNumber": "رقم القطعة",
  "product.name": "اسم الصنف",
  "product.category": "الفئة",
  "product.warehouse": "المخزن",
  "product.stock": "المخزون الحالي",
  "product.minStock": "الحد الأدنى",
  "product.status": "الحالة",
  "product.openRecord": "فتح الصنف",
  "po.details": "أمر شراء",
  "po.notFound": "أمر الشراء غير موجود",
  "po.id": "رقم أمر الشراء",
  "po.supplier": "المورد",
  "po.amount": "المبلغ",
  "po.date": "التاريخ",
  "po.statusLabel": "الحالة",
  "po.openRecord": "فتح أمر الشراء",
  "act.title": "النشاطات الأخيرة",
  "act.salesInvoice": "فاتورة مبيعات #SI-2025-0048",
  "act.purchaseOrder": "أمر شراء #PO-2025-0032",
  "act.paymentReceived": "استلام دفعة",
  "act.goodsReceipt": "إذن استلام #GR-2025-0019",
  "act.exchangeUpdated": "تحديث سعر الصرف",
  "act.cat.sales": "مبيعات",
  "act.cat.purchase": "مشتريات",
  "act.cat.finance": "مالية",
  "act.cat.inventory": "مخزون",
  "act.cat.pricing": "تسعير",
  "fx.title": "أسعار الصرف",
  "fx.currency": "العملة",
  "fx.rate": "مقابل الجنيه المصري",
  "fx.change": "التغيير",
  "fx.demoNote": "أسعار تجريبية — ليست بيانات سوق حية",
  "cat.marineEngines": "محركات بحرية",
  "cat.engineParts": "قطع محركات",
  "cat.filters": "فلاتر",
  "cat.electrical": "قطع كهربائية",
  "cat.lubricants": "زيوت",
  "cat.others": "أخرى",
};

const dictionaries: Record<Locale, Record<DashboardKey, string>> = { en, ar };

export function td(locale: Locale, key: DashboardKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
