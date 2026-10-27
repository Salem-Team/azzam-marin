import type { Locale } from "@/types/i18n";

export type StocktakingKey =
  | "stk.title"
  | "stk.create"
  | "stk.search"
  | "stk.empty"
  | "stk.loading"
  | "stk.col.number"
  | "stk.col.warehouse"
  | "stk.col.kind"
  | "stk.col.status"
  | "stk.col.progress"
  | "stk.col.created"
  | "stk.col.variance"
  | "stk.kind.periodic"
  | "stk.kind.surprise"
  | "stk.status.draft"
  | "stk.status.in_progress"
  | "stk.status.submitted"
  | "stk.status.approved"
  | "stk.status.applying"
  | "stk.status.applied"
  | "stk.status.cancelled"
  | "stk.status.failed"
  | "stk.filter.allKinds"
  | "stk.filter.allStatuses"
  | "stk.createTitle"
  | "stk.step.kind"
  | "stk.step.warehouse"
  | "stk.step.scope"
  | "stk.scope.ledger_all"
  | "stk.scope.selected"
  | "stk.scope.hintLedger"
  | "stk.scope.hintSelected"
  | "stk.scope.warnUnavailable"
  | "stk.notes"
  | "stk.createConfirm"
  | "stk.toast.created"
  | "stk.toast.counted"
  | "stk.toast.submitted"
  | "stk.toast.approved"
  | "stk.toast.applied"
  | "stk.toast.cancelled"
  | "stk.toast.error"
  | "stk.detail.notFound"
  | "stk.detail.back"
  | "stk.detail.count"
  | "stk.detail.systemQty"
  | "stk.detail.physicalQty"
  | "stk.detail.variance"
  | "stk.detail.baseline"
  | "stk.detail.baseline.ledger"
  | "stk.detail.baseline.unavailable"
  | "stk.detail.uncounted"
  | "stk.detail.counted"
  | "stk.detail.searchLines"
  | "stk.action.submit"
  | "stk.action.approve"
  | "stk.action.apply"
  | "stk.action.cancel"
  | "stk.action.retryApply"
  | "stk.confirm.submit"
  | "stk.confirm.approve"
  | "stk.confirm.apply"
  | "stk.confirm.cancel"
  | "stk.summary.total"
  | "stk.summary.counted"
  | "stk.summary.uncounted"
  | "stk.summary.matching"
  | "stk.summary.shortage"
  | "stk.summary.surplus"
  | "stk.summary.unavailable"
  | "stk.approveNote"
  | "stk.applyNote"
  | "stk.demoPersist"
  | "stk.import"
  | "stk.export"
  | "stk.importUnavailable"
  | "stk.toast.exported"
  | "stk.filter.allWarehouses"
  | "stk.close"
  | "stk.col.item"
  | "stk.confirm.ok";

const en: Record<StocktakingKey, string> = {
  "stk.title": "Stocktaking",
  "stk.create": "New stocktaking",
  "stk.search": "Search by number or warehouse",
  "stk.empty": "No stocktaking sessions yet.",
  "stk.loading": "Loading…",
  "stk.col.number": "Session",
  "stk.col.warehouse": "Warehouse",
  "stk.col.kind": "Type",
  "stk.col.status": "Status",
  "stk.col.progress": "Progress",
  "stk.col.created": "Created",
  "stk.col.variance": "Variance",
  "stk.kind.periodic": "Periodic",
  "stk.kind.surprise": "Surprise",
  "stk.status.draft": "Draft",
  "stk.status.in_progress": "In progress",
  "stk.status.submitted": "Submitted",
  "stk.status.approved": "Approved",
  "stk.status.applying": "Applying",
  "stk.status.applied": "Applied",
  "stk.status.cancelled": "Cancelled",
  "stk.status.failed": "Recovery required",
  "stk.filter.allKinds": "All types",
  "stk.filter.allStatuses": "All statuses",
  "stk.createTitle": "Create stocktaking",
  "stk.step.kind": "Type",
  "stk.step.warehouse": "Warehouse",
  "stk.step.scope": "Scope",
  "stk.scope.ledger_all": "All ledger-backed items in warehouse",
  "stk.scope.selected": "Selected items",
  "stk.scope.hintLedger":
    "Only items with warehouse ledger rows are included. Catalog-demo quantities are never used as the system baseline.",
  "stk.scope.hintSelected":
    "Items without a ledger row are included as unavailable baseline and cannot be reconciled until they have ledger stock.",
  "stk.scope.warnUnavailable":
    "Some selected items have no ledger baseline.",
  "stk.notes": "Notes",
  "stk.createConfirm": "Create session",
  "stk.toast.created": "Stocktaking session created.",
  "stk.toast.counted": "Count saved.",
  "stk.toast.submitted": "Session submitted.",
  "stk.toast.approved": "Session approved (frontend-local).",
  "stk.toast.applied": "Adjustments applied.",
  "stk.toast.cancelled": "Session cancelled.",
  "stk.toast.error": "Could not complete the action.",
  "stk.detail.notFound": "Stocktaking session not found.",
  "stk.detail.back": "Back to list",
  "stk.detail.count": "Physical count",
  "stk.detail.systemQty": "System snapshot",
  "stk.detail.physicalQty": "Physical qty",
  "stk.detail.variance": "Variance",
  "stk.detail.baseline": "Baseline",
  "stk.detail.baseline.ledger": "Ledger",
  "stk.detail.baseline.unavailable": "Unavailable",
  "stk.detail.uncounted": "Uncounted",
  "stk.detail.counted": "Counted",
  "stk.detail.searchLines": "Search lines",
  "stk.action.submit": "Submit for review",
  "stk.action.approve": "Approve",
  "stk.action.apply": "Apply adjustments",
  "stk.action.cancel": "Cancel session",
  "stk.action.retryApply": "Retry apply",
  "stk.confirm.submit": "Submit this count for review?",
  "stk.confirm.approve":
    "Approve this session? Approval is frontend-local only — not server RBAC.",
  "stk.confirm.apply":
    "Apply inventory adjustments for nonzero variances? This changes warehouse balances.",
  "stk.confirm.cancel": "Cancel this stocktaking session?",
  "stk.summary.total": "In scope",
  "stk.summary.counted": "Counted",
  "stk.summary.uncounted": "Uncounted",
  "stk.summary.matching": "Matching",
  "stk.summary.shortage": "Shortage",
  "stk.summary.surplus": "Surplus",
  "stk.summary.unavailable": "No baseline",
  "stk.approveNote":
    "Approval is stamped for the demo session user. It is not multi-user authorization.",
  "stk.applyNote":
    "Each variance uses an idempotent adjustment operationId. Not a database transaction.",
  "stk.demoPersist":
    "Browser-local stocktaking data. Not multi-user. Not a production database.",
  "stk.import": "Import",
  "stk.export": "Export",
  "stk.importUnavailable":
    "Bulk stocktaking import is not available in this frontend build.",
  "stk.toast.exported": "Sessions exported.",
  "stk.filter.allWarehouses": "All warehouses",
  "stk.close": "Close",
  "stk.col.item": "Item",
  "stk.confirm.ok": "Confirm",
};

const ar: Record<StocktakingKey, string> = {
  "stk.title": "الجرد",
  "stk.create": "جرد جديد",
  "stk.search": "بحث بالرقم أو المخزن",
  "stk.empty": "لا توجد جلسات جرد بعد.",
  "stk.loading": "جاري التحميل…",
  "stk.col.number": "الجلسة",
  "stk.col.warehouse": "المخزن",
  "stk.col.kind": "النوع",
  "stk.col.status": "الحالة",
  "stk.col.progress": "التقدم",
  "stk.col.created": "الإنشاء",
  "stk.col.variance": "الفروقات",
  "stk.kind.periodic": "دوري",
  "stk.kind.surprise": "مفاجئ",
  "stk.status.draft": "مسودة",
  "stk.status.in_progress": "قيد التنفيذ",
  "stk.status.submitted": "مُرسل للمراجعة",
  "stk.status.approved": "معتمد",
  "stk.status.applying": "جاري التطبيق",
  "stk.status.applied": "مُطبَّق",
  "stk.status.cancelled": "ملغى",
  "stk.status.failed": "يتطلب استعادة",
  "stk.filter.allKinds": "كل الأنواع",
  "stk.filter.allStatuses": "كل الحالات",
  "stk.createTitle": "إنشاء جلسة جرد",
  "stk.step.kind": "النوع",
  "stk.step.warehouse": "المخزن",
  "stk.step.scope": "النطاق",
  "stk.scope.ledger_all": "كل أصناف الدفتر في المخزن",
  "stk.scope.selected": "أصناف محددة",
  "stk.scope.hintLedger":
    "يُدرج فقط ما له صفوف دفتر مخزني. كميات العرض التجريبية في الكتالوج لا تُستخدم كرصيد نظام.",
  "stk.scope.hintSelected":
    "الأصناف بلا صف دفتر تُدرج كأساس غير متاح ولا تُسوّى حتى يوجد رصيد دفتري.",
  "stk.scope.warnUnavailable":
    "بعض الأصناف المحددة بلا أساس دفتري.",
  "stk.notes": "ملاحظات",
  "stk.createConfirm": "إنشاء الجلسة",
  "stk.toast.created": "تم إنشاء جلسة الجرد.",
  "stk.toast.counted": "تم حفظ العد.",
  "stk.toast.submitted": "تم إرسال الجلسة.",
  "stk.toast.approved": "تم اعتماد الجلسة (محلي).",
  "stk.toast.applied": "تم تطبيق التسويات.",
  "stk.toast.cancelled": "تم إلغاء الجلسة.",
  "stk.toast.error": "تعذر إكمال الإجراء.",
  "stk.detail.notFound": "جلسة الجرد غير موجودة.",
  "stk.detail.back": "العودة للقائمة",
  "stk.detail.count": "العد الفعلي",
  "stk.detail.systemQty": "لقطة النظام",
  "stk.detail.physicalQty": "الكمية الفعلية",
  "stk.detail.variance": "الفرق",
  "stk.detail.baseline": "الأساس",
  "stk.detail.baseline.ledger": "دفتر",
  "stk.detail.baseline.unavailable": "غير متاح",
  "stk.detail.uncounted": "غير معدود",
  "stk.detail.counted": "معدود",
  "stk.detail.searchLines": "بحث في البنود",
  "stk.action.submit": "إرسال للمراجعة",
  "stk.action.approve": "اعتماد",
  "stk.action.apply": "تطبيق التسويات",
  "stk.action.cancel": "إلغاء الجلسة",
  "stk.action.retryApply": "إعادة التطبيق",
  "stk.confirm.submit": "إرسال هذا العد للمراجعة؟",
  "stk.confirm.approve":
    "اعتماد هذه الجلسة؟ الاعتماد محلي في الواجهة فقط — ليس صلاحيات خادم.",
  "stk.confirm.apply":
    "تطبيق تسويات المخزون للفروقات غير الصفرية؟ سيُغيّر أرصدة المخزن.",
  "stk.confirm.cancel": "إلغاء جلسة الجرد؟",
  "stk.summary.total": "ضمن النطاق",
  "stk.summary.counted": "معدود",
  "stk.summary.uncounted": "غير معدود",
  "stk.summary.matching": "مطابق",
  "stk.summary.shortage": "نقص",
  "stk.summary.surplus": "زيادة",
  "stk.summary.unavailable": "بلا أساس",
  "stk.approveNote":
    "يُسجَّل الاعتماد لمستخدم الجلسة التجريبي. ليس تفويضًا متعدد المستخدمين.",
  "stk.applyNote":
    "كل فرق يستخدم operationId تسوية غير قابل للتكرار. ليست معاملة قاعدة بيانات.",
  "stk.demoPersist":
    "بيانات جرد محلية في المتصفح. ليست متعددة المستخدمين وليست قاعدة إنتاج.",
  "stk.import": "استيراد",
  "stk.export": "تصدير",
  "stk.importUnavailable":
    "استيراد الجرد بالجملة غير متاح في هذا البناء الواجهي.",
  "stk.toast.exported": "تم تصدير الجلسات.",
  "stk.filter.allWarehouses": "كل المخازن",
  "stk.close": "إغلاق",
  "stk.col.item": "الصنف",
  "stk.confirm.ok": "تأكيد",
};

export function tst(locale: Locale, key: StocktakingKey): string {
  return (locale === "ar" ? ar : en)[key];
}
