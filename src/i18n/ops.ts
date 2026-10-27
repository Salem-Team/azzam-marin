import type { Locale } from "@/types/i18n";

export type OpsKey =
  | "ops.demoPersist"
  | "ops.loading"
  | "ops.save"
  | "ops.cancel"
  | "ops.add"
  | "ops.edit"
  | "ops.search"
  | "ops.empty"
  | "ops.required"
  | "ops.duplicateCode"
  | "ops.saveSuccess"
  | "ops.saveError"
  | "ops.status.active"
  | "ops.status.inactive"
  | "ops.actions"
  | "warehouses.title"
  | "warehouses.add"
  | "warehouses.code"
  | "warehouses.nameEn"
  | "warehouses.nameAr"
  | "warehouses.kind"
  | "warehouses.address"
  | "warehouses.notes"
  | "warehouses.stock"
  | "warehouses.kind.main"
  | "warehouses.kind.new_parts"
  | "warehouses.kind.used_parts"
  | "warehouses.kind.engines"
  | "warehouses.kind.other"
  | "customers.title"
  | "customers.add"
  | "customers.code"
  | "customers.nameEn"
  | "customers.nameAr"
  | "customers.phone"
  | "customers.email"
  | "customers.balance"
  | "customers.country"
  | "customers.taxId"
  | "customers.notes"
  | "customers.demoBalance"
  | "po.title"
  | "po.add"
  | "po.number"
  | "po.supplier"
  | "po.date"
  | "po.expected"
  | "po.currency"
  | "po.total"
  | "po.status"
  | "po.notes"
  | "po.lines"
  | "po.addLine"
  | "po.item"
  | "po.qty"
  | "po.unitPrice"
  | "po.lineTotal"
  | "po.received"
  | "po.outstanding"
  | "po.submit"
  | "po.approve"
  | "po.cancelOrder"
  | "po.status.draft"
  | "po.status.submitted"
  | "po.status.approved"
  | "po.status.partially_received"
  | "po.status.received"
  | "po.status.cancelled"
  | "po.notExternal"
  | "po.empty"
  | "gr.title"
  | "gr.add"
  | "gr.po"
  | "gr.warehouse"
  | "gr.date"
  | "gr.empty"
  | "gr.success"
  | "stock.movements"
  | "stock.transfers"
  | "stock.from"
  | "stock.to"
  | "stock.qty"
  | "stock.reason"
  | "stock.insufficient"
  | "stock.transferSuccess";

const en: Record<OpsKey, string> = {
  "ops.demoPersist":
    "Browser-local demo data. Not multi-user. Not a production database.",
  "ops.loading": "Loading…",
  "ops.save": "Save",
  "ops.cancel": "Cancel",
  "ops.add": "Add",
  "ops.edit": "Edit",
  "ops.search": "Search…",
  "ops.empty": "No records yet.",
  "ops.required": "Required",
  "ops.duplicateCode": "This code is already in use.",
  "ops.saveSuccess": "Saved.",
  "ops.saveError": "Could not save.",
  "ops.status.active": "Active",
  "ops.status.inactive": "Inactive",
  "ops.actions": "Actions",
  "warehouses.title": "Warehouses",
  "warehouses.add": "Add warehouse",
  "warehouses.code": "Code",
  "warehouses.nameEn": "Name (English)",
  "warehouses.nameAr": "Name (Arabic)",
  "warehouses.kind": "Type",
  "warehouses.address": "Address",
  "warehouses.notes": "Notes",
  "warehouses.stock": "Stock on hand",
  "warehouses.kind.main": "Main",
  "warehouses.kind.new_parts": "New spare parts",
  "warehouses.kind.used_parts": "Used parts",
  "warehouses.kind.engines": "Complete engines",
  "warehouses.kind.other": "Other",
  "customers.title": "Customers",
  "customers.add": "Add customer",
  "customers.code": "Code",
  "customers.nameEn": "Name (English)",
  "customers.nameAr": "Name (Arabic)",
  "customers.phone": "Phone",
  "customers.email": "Email",
  "customers.balance": "Balance",
  "customers.country": "Country",
  "customers.taxId": "Tax ID",
  "customers.notes": "Notes",
  "customers.demoBalance":
    "Balance is a demo field (sales − receipts). Not a posted AR ledger.",
  "po.title": "Purchase orders",
  "po.add": "New purchase order",
  "po.number": "PO number",
  "po.supplier": "Supplier",
  "po.date": "Order date",
  "po.expected": "Expected delivery",
  "po.currency": "Currency",
  "po.total": "Total",
  "po.status": "Status",
  "po.notes": "Notes",
  "po.lines": "Lines",
  "po.addLine": "Add line",
  "po.item": "Item",
  "po.qty": "Qty",
  "po.unitPrice": "Unit price",
  "po.lineTotal": "Line total",
  "po.received": "Received",
  "po.outstanding": "Outstanding",
  "po.submit": "Submit",
  "po.approve": "Approve",
  "po.cancelOrder": "Cancel order",
  "po.status.draft": "Draft",
  "po.status.submitted": "Submitted",
  "po.status.approved": "Approved",
  "po.status.partially_received": "Partially received",
  "po.status.received": "Received",
  "po.status.cancelled": "Cancelled",
  "po.notExternal":
    "Statuses are local workflow only — not sent to or acknowledged by the supplier.",
  "po.empty": "No purchase orders yet. Create a draft using an existing supplier and items.",
  "gr.title": "Goods receipts",
  "gr.add": "Receive goods",
  "gr.po": "Purchase order",
  "gr.warehouse": "Warehouse",
  "gr.date": "Receipt date",
  "gr.empty": "No goods receipts yet.",
  "gr.success": "Goods received and stock updated.",
  "stock.movements": "Stock movements",
  "stock.transfers": "Stock transfers",
  "stock.from": "From warehouse",
  "stock.to": "To warehouse",
  "stock.qty": "Quantity",
  "stock.reason": "Reason",
  "stock.insufficient": "Insufficient stock at source warehouse.",
  "stock.transferSuccess": "Transfer recorded.",
};

const ar: Record<OpsKey, string> = {
  "ops.demoPersist":
    "بيانات تجريبية محلية في المتصفح. ليست متعددة المستخدمين وليست قاعدة إنتاج.",
  "ops.loading": "جاري التحميل…",
  "ops.save": "حفظ",
  "ops.cancel": "إلغاء",
  "ops.add": "إضافة",
  "ops.edit": "تعديل",
  "ops.search": "بحث…",
  "ops.empty": "لا توجد سجلات بعد.",
  "ops.required": "مطلوب",
  "ops.duplicateCode": "هذا الكود مستخدم بالفعل.",
  "ops.saveSuccess": "تم الحفظ.",
  "ops.saveError": "تعذر الحفظ.",
  "ops.status.active": "نشط",
  "ops.status.inactive": "غير نشط",
  "ops.actions": "إجراءات",
  "warehouses.title": "المخازن",
  "warehouses.add": "إضافة مخزن",
  "warehouses.code": "الكود",
  "warehouses.nameEn": "الاسم (إنجليزي)",
  "warehouses.nameAr": "الاسم (عربي)",
  "warehouses.kind": "النوع",
  "warehouses.address": "العنوان",
  "warehouses.notes": "ملاحظات",
  "warehouses.stock": "الرصيد المتاح",
  "warehouses.kind.main": "رئيسي",
  "warehouses.kind.new_parts": "قطع غيار جديدة",
  "warehouses.kind.used_parts": "قطع مستعملة",
  "warehouses.kind.engines": "محركات كاملة",
  "warehouses.kind.other": "أخرى",
  "customers.title": "العملاء",
  "customers.add": "إضافة عميل",
  "customers.code": "الكود",
  "customers.nameEn": "الاسم (إنجليزي)",
  "customers.nameAr": "الاسم (عربي)",
  "customers.phone": "الهاتف",
  "customers.email": "البريد",
  "customers.balance": "الرصيد",
  "customers.country": "الدولة",
  "customers.taxId": "الرقم الضريبي",
  "customers.notes": "ملاحظات",
  "customers.demoBalance":
    "الرصيد حقل تجريبي (مبيعات − مقبوضات). ليس دفتر ذمم مدينة مرحّل.",
  "po.title": "أوامر الشراء",
  "po.add": "أمر شراء جديد",
  "po.number": "رقم الأمر",
  "po.supplier": "المورد",
  "po.date": "تاريخ الأمر",
  "po.expected": "التوريد المتوقع",
  "po.currency": "العملة",
  "po.total": "الإجمالي",
  "po.status": "الحالة",
  "po.notes": "ملاحظات",
  "po.lines": "البنود",
  "po.addLine": "إضافة بند",
  "po.item": "الصنف",
  "po.qty": "الكمية",
  "po.unitPrice": "سعر الوحدة",
  "po.lineTotal": "إجمالي البند",
  "po.received": "المستلم",
  "po.outstanding": "المتبقي",
  "po.submit": "إرسال",
  "po.approve": "اعتماد",
  "po.cancelOrder": "إلغاء الأمر",
  "po.status.draft": "مسودة",
  "po.status.submitted": "مُرسل",
  "po.status.approved": "معتمد",
  "po.status.partially_received": "استلام جزئي",
  "po.status.received": "مستلم",
  "po.status.cancelled": "ملغى",
  "po.notExternal":
    "الحالات سير عمل محلي فقط — لا تُرسل إلى المورد ولا تعني قبوله.",
  "po.empty":
    "لا توجد أوامر شراء بعد. أنشئ مسودة باستخدام مورد وأصناف موجودة.",
  "gr.title": "استلام البضائع",
  "gr.add": "استلام بضاعة",
  "gr.po": "أمر الشراء",
  "gr.warehouse": "المخزن",
  "gr.date": "تاريخ الاستلام",
  "gr.empty": "لا توجد إيصالات استلام بعد.",
  "gr.success": "تم استلام البضاعة وتحديث المخزون.",
  "stock.movements": "حركات المخزون",
  "stock.transfers": "تحويلات المخزون",
  "stock.from": "من مخزن",
  "stock.to": "إلى مخزن",
  "stock.qty": "الكمية",
  "stock.reason": "السبب",
  "stock.insufficient": "رصيد غير كافٍ في المخزن المصدر.",
  "stock.transferSuccess": "تم تسجيل التحويل.",
};

export function to(locale: Locale, key: OpsKey): string {
  return (locale === "ar" ? ar : en)[key];
}
