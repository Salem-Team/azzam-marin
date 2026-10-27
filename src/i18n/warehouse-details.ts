import type { Locale } from "@/types/i18n";

export type WhDetailKey =
  | "whd.back"
  | "whd.notFound"
  | "whd.loading"
  | "whd.edit"
  | "whd.newMovement"
  | "whd.deactivate"
  | "whd.activate"
  | "whd.more"
  | "whd.kpi.totalQty"
  | "whd.kpi.distinctItems"
  | "whd.kpi.lowStock"
  | "whd.kpi.estValue"
  | "whd.kpi.estValueHint"
  | "whd.kpi.estValueUnavailable"
  | "whd.tab.overview"
  | "whd.tab.items"
  | "whd.tab.movements"
  | "whd.tab.receipts"
  | "whd.tab.issues"
  | "whd.tab.transfers"
  | "whd.tab.adjustments"
  | "whd.tab.stocktaking"
  | "whd.tab.settings"
  | "whd.distribution"
  | "whd.distributionEmpty"
  | "whd.topItems"
  | "whd.topItemsHint"
  | "whd.topItemsEmpty"
  | "whd.statusTitle"
  | "whd.status.healthy"
  | "whd.status.near"
  | "whd.status.low"
  | "whd.status.out"
  | "whd.status.stagnant"
  | "whd.infoTitle"
  | "whd.info.code"
  | "whd.info.kind"
  | "whd.info.status"
  | "whd.info.address"
  | "whd.info.notes"
  | "whd.info.created"
  | "whd.info.updated"
  | "whd.balancesTitle"
  | "whd.search"
  | "whd.filterType"
  | "whd.filterStatus"
  | "whd.allTypes"
  | "whd.emptyBalances"
  | "whd.noResults"
  | "whd.lowStockTitle"
  | "whd.lowStockEmpty"
  | "whd.shortageQty"
  | "whd.recentMovements"
  | "whd.movementsEmpty"
  | "whd.movementsAll"
  | "whd.settingsHint"
  | "whd.openWorkflow"
  | "whd.col.image"
  | "whd.col.type"
  | "whd.col.uom"
  | "whd.demoPersist"
  | "whd.inactiveOpsBlocked";

const en: Record<WhDetailKey, string> = {
  "whd.back": "Warehouses",
  "whd.notFound": "Warehouse not found.",
  "whd.loading": "Loading…",
  "whd.edit": "Edit",
  "whd.newMovement": "New movement",
  "whd.deactivate": "Deactivate",
  "whd.activate": "Activate",
  "whd.more": "More",
  "whd.kpi.totalQty": "Total quantity",
  "whd.kpi.distinctItems": "Stocked items",
  "whd.kpi.lowStock": "Below minimum",
  "whd.kpi.estValue": "Estimated value",
  "whd.kpi.estValueHint": "Ledger qty × catalog cost — not a formal valuation.",
  "whd.kpi.estValueUnavailable": "No priced ledger rows",
  "whd.tab.overview": "Overview",
  "whd.tab.items": "Items",
  "whd.tab.movements": "Movements",
  "whd.tab.receipts": "Receipts",
  "whd.tab.issues": "Issues",
  "whd.tab.transfers": "Transfers",
  "whd.tab.adjustments": "Adjustments",
  "whd.tab.stocktaking": "Stocktaking",
  "whd.tab.settings": "Settings",
  "whd.distribution": "Item distribution by type",
  "whd.distributionEmpty": "No ledger-backed items in this warehouse.",
  "whd.topItems": "Highest on-hand items",
  "whd.topItemsHint": "Ranked by warehouse ledger quantity.",
  "whd.topItemsEmpty": "No stocked items yet.",
  "whd.statusTitle": "Stock status",
  "whd.status.healthy": "Healthy",
  "whd.status.near": "Near minimum",
  "whd.status.low": "Below minimum",
  "whd.status.out": "Out of stock",
  "whd.status.stagnant": "No recent movement",
  "whd.infoTitle": "Warehouse info",
  "whd.info.code": "Code",
  "whd.info.kind": "Type",
  "whd.info.status": "Status",
  "whd.info.address": "Address",
  "whd.info.notes": "Notes",
  "whd.info.created": "Created",
  "whd.info.updated": "Updated",
  "whd.balancesTitle": "Warehouse item balances",
  "whd.search": "Search item, code, OEM, part number",
  "whd.filterType": "Item type",
  "whd.filterStatus": "Stock status",
  "whd.allTypes": "All types",
  "whd.emptyBalances": "No ledger balances in this warehouse.",
  "whd.noResults": "No items match the current filters.",
  "whd.lowStockTitle": "Items below minimum",
  "whd.lowStockEmpty": "No low-stock ledger items in this warehouse.",
  "whd.shortageQty": "Shortage",
  "whd.recentMovements": "Latest stock movements",
  "whd.movementsEmpty": "No movements recorded for this warehouse.",
  "whd.movementsAll": "Open movements list",
  "whd.settingsHint": "Edit warehouse identity, location, and status.",
  "whd.openWorkflow": "Open module",
  "whd.col.image": "Image",
  "whd.col.type": "Type",
  "whd.col.uom": "UoM",
  "whd.demoPersist":
    "Browser-local warehouse data. Not multi-user. Not a production database.",
  "whd.inactiveOpsBlocked":
    "Stock operations are blocked while this warehouse is inactive.",
};

const ar: Record<WhDetailKey, string> = {
  "whd.back": "المخازن",
  "whd.notFound": "المخزن غير موجود.",
  "whd.loading": "جاري التحميل…",
  "whd.edit": "تعديل",
  "whd.newMovement": "حركة جديدة",
  "whd.deactivate": "إيقاف المخزن",
  "whd.activate": "تفعيل المخزن",
  "whd.more": "المزيد",
  "whd.kpi.totalQty": "إجمالي الكمية",
  "whd.kpi.distinctItems": "أصناف مخزّنة",
  "whd.kpi.lowStock": "تحت الحد الأدنى",
  "whd.kpi.estValue": "قيمة تقديرية",
  "whd.kpi.estValueHint":
    "كمية الدفتر × تكلفة الكتالوج — ليست تقييمًا محاسبيًا رسميًا.",
  "whd.kpi.estValueUnavailable": "لا توجد بنود مسعّرة في الدفتر",
  "whd.tab.overview": "نظرة عامة",
  "whd.tab.items": "الأصناف",
  "whd.tab.movements": "الحركات",
  "whd.tab.receipts": "الاستلامات",
  "whd.tab.issues": "الصرف",
  "whd.tab.transfers": "التحويلات",
  "whd.tab.adjustments": "التسويات",
  "whd.tab.stocktaking": "الجرد",
  "whd.tab.settings": "الإعدادات",
  "whd.distribution": "توزيع الأصناف حسب النوع",
  "whd.distributionEmpty": "لا توجد أصناف بدفتر في هذا المخزن.",
  "whd.topItems": "أعلى الأصناف رصيدًا",
  "whd.topItemsHint": "مرتّبة حسب كمية دفتر المخزن.",
  "whd.topItemsEmpty": "لا توجد أصناف مخزّنة بعد.",
  "whd.statusTitle": "حالة المخزون",
  "whd.status.healthy": "مستوى جيد",
  "whd.status.near": "قريب من الحد",
  "whd.status.low": "تحت الحد الأدنى",
  "whd.status.out": "نفد المخزون",
  "whd.status.stagnant": "بلا حركة حديثة",
  "whd.infoTitle": "بيانات المخزن",
  "whd.info.code": "الكود",
  "whd.info.kind": "النوع",
  "whd.info.status": "الحالة",
  "whd.info.address": "العنوان",
  "whd.info.notes": "ملاحظات",
  "whd.info.created": "تاريخ الإنشاء",
  "whd.info.updated": "آخر تحديث",
  "whd.balancesTitle": "أرصدة أصناف المخزن",
  "whd.search": "بحث بالصنف أو الكود أو OEM أو رقم القطعة",
  "whd.filterType": "نوع الصنف",
  "whd.filterStatus": "حالة الرصيد",
  "whd.allTypes": "كل الأنواع",
  "whd.emptyBalances": "لا توجد أرصدة دفتر في هذا المخزن.",
  "whd.noResults": "لا توجد أصناف مطابقة للفلاتر الحالية.",
  "whd.lowStockTitle": "أصناف تحت الحد الأدنى",
  "whd.lowStockEmpty": "لا توجد أصناف دفتر تحت الحد في هذا المخزن.",
  "whd.shortageQty": "العجز",
  "whd.recentMovements": "أحدث حركات المخزون",
  "whd.movementsEmpty": "لا توجد حركات مسجّلة لهذا المخزن.",
  "whd.movementsAll": "فتح قائمة الحركات",
  "whd.settingsHint": "تعديل هوية المخزن والموقع والحالة.",
  "whd.openWorkflow": "فتح الوحدة",
  "whd.col.image": "صورة",
  "whd.col.type": "النوع",
  "whd.col.uom": "الوحدة",
  "whd.demoPersist":
    "بيانات مخزن محلية في المتصفح. ليست متعددة المستخدمين وليست قاعدة إنتاج.",
  "whd.inactiveOpsBlocked":
    "عمليات المخزون موقوفة بينما هذا المخزن غير نشط.",
};

export function twd(locale: Locale, key: WhDetailKey): string {
  return (locale === "ar" ? ar : en)[key];
}
