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
  | "warehouses.addressEn"
  | "warehouses.addressAr"
  | "warehouses.notes"
  | "warehouses.form.createTitle"
  | "warehouses.form.editTitle"
  | "warehouses.form.create"
  | "warehouses.form.saveChanges"
  | "warehouses.form.sectionIdentity"
  | "warehouses.form.sectionStatus"
  | "warehouses.form.sectionLocation"
  | "warehouses.form.codeHint"
  | "warehouses.form.notesPlaceholder"
  | "warehouses.form.shortcutSave"
  | "warehouses.form.discardConfirm"
  | "warehouses.form.discardTitle"
  | "warehouses.form.discardConfirmAction"
  | "warehouses.form.keepEditing"
  | "warehouses.form.unsaved"
  | "warehouses.form.editStep"
  | "warehouses.wizard.step1"
  | "warehouses.wizard.step2"
  | "warehouses.wizard.step3"
  | "warehouses.wizard.step4"
  | "warehouses.wizard.stepLabel"
  | "warehouses.wizard.next"
  | "warehouses.wizard.back"
  | "warehouses.wizard.saving"
  | "warehouses.wizard.kindHint"
  | "warehouses.wizard.locationOptional"
  | "warehouses.wizard.notesOptional"
  | "warehouses.toast.created"
  | "warehouses.toast.updated"
  | "warehouses.toast.activated"
  | "warehouses.toast.deactivated"
  | "warehouses.toast.deleted"
  | "warehouses.statusConfirm.titleActivate"
  | "warehouses.statusConfirm.titleDeactivate"
  | "warehouses.statusConfirm.bodyActivate"
  | "warehouses.statusConfirm.bodyDeactivate"
  | "warehouses.statusConfirm.confirmActivate"
  | "warehouses.statusConfirm.confirmDeactivate"
  | "warehouses.statusConfirm.stockWarning"
  | "warehouses.delete"
  | "warehouses.delete.title"
  | "warehouses.delete.body"
  | "warehouses.delete.confirm"
  | "warehouses.delete.blocked"
  | "warehouses.stock"
  | "warehouses.kind.main"
  | "warehouses.kind.new_parts"
  | "warehouses.kind.used_parts"
  | "warehouses.kind.engines"
  | "warehouses.kind.other"
  | "warehouses.overviewTitle"
  | "warehouses.overviewHint"
  | "warehouses.kpi.active"
  | "warehouses.kpi.items"
  | "warehouses.kpi.lowStock"
  | "warehouses.kpi.movements"
  | "warehouses.balances"
  | "warehouses.searchBalances"
  | "warehouses.filterWarehouse"
  | "warehouses.filterStatus"
  | "warehouses.allWarehouses"
  | "warehouses.allStatuses"
  | "warehouses.col.row"
  | "warehouses.col.itemCode"
  | "warehouses.col.itemName"
  | "warehouses.col.partNumber"
  | "warehouses.col.oem"
  | "warehouses.col.manufacturer"
  | "warehouses.col.warehouse"
  | "warehouses.col.qty"
  | "warehouses.col.min"
  | "warehouses.col.status"
  | "warehouses.status.available"
  | "warehouses.status.low"
  | "warehouses.status.out"
  | "warehouses.lowStockTitle"
  | "warehouses.recentMovements"
  | "warehouses.receive"
  | "warehouses.issue"
  | "warehouses.transfer"
  | "warehouses.qtyUnits"
  | "warehouses.itemUnits"
  | "warehouses.shortage"
  | "warehouses.import"
  | "warehouses.export"
  | "warehouses.importUnavailable"
  | "warehouses.toast.exported"
  | "warehouses.emptyBalances"
  | "warehouses.emptyMovements"
  | "warehouses.emptyLowStock"
  | "warehouses.columns"
  | "warehouses.activate"
  | "warehouses.deactivate"
  | "warehouses.openItem"
  | "warehouses.sortBy"
  | "warehouses.ref"
  | "warehouses.col.date"
  | "warehouses.col.type"
  | "stock.type.receipt"
  | "stock.type.issue"
  | "stock.type.transfer_out"
  | "stock.type.transfer_in"
  | "stock.type.adjustment"
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
  "warehouses.addressEn": "Address (English)",
  "warehouses.addressAr": "Address (Arabic)",
  "warehouses.notes": "Notes",
  "warehouses.form.createTitle": "New warehouse",
  "warehouses.form.editTitle": "Edit warehouse",
  "warehouses.form.create": "Create warehouse",
  "warehouses.form.saveChanges": "Save changes",
  "warehouses.form.sectionIdentity": "Identity",
  "warehouses.form.sectionStatus": "Operating status",
  "warehouses.form.sectionLocation": "Location",
  "warehouses.form.codeHint":
    "Codes are stored uppercase. Leave as suggested or enter a unique code.",
  "warehouses.form.notesPlaceholder": "Internal notes for warehouse staff…",
  "warehouses.form.shortcutSave": "Ctrl/⌘ + Enter to save",
  "warehouses.form.discardConfirm":
    "Unsaved changes will be lost.",
  "warehouses.form.discardTitle": "Discard changes?",
  "warehouses.form.discardConfirmAction": "Discard",
  "warehouses.form.keepEditing": "Keep editing",
  "warehouses.form.unsaved": "You have unsaved changes.",
  "warehouses.form.editStep": "Edit",
  "warehouses.wizard.step1": "Identity",
  "warehouses.wizard.step2": "Location",
  "warehouses.wizard.step3": "Status & notes",
  "warehouses.wizard.step4": "Review",
  "warehouses.wizard.stepLabel": "Step {current} of {total}",
  "warehouses.wizard.next": "Continue",
  "warehouses.wizard.back": "Back",
  "warehouses.wizard.saving": "Saving…",
  "warehouses.wizard.kindHint":
    "Choose the warehouse role used across stock movements and filters.",
  "warehouses.wizard.locationOptional":
    "Location is optional and can be completed later from warehouse details.",
  "warehouses.wizard.notesOptional":
    "Operating status and internal notes for warehouse staff.",
  "warehouses.toast.created": "Warehouse created.",
  "warehouses.toast.updated": "Warehouse updated.",
  "warehouses.toast.activated": "Warehouse activated.",
  "warehouses.toast.deactivated": "Warehouse deactivated.",
  "warehouses.toast.deleted": "Warehouse deleted.",
  "warehouses.statusConfirm.titleActivate": "Activate warehouse",
  "warehouses.statusConfirm.titleDeactivate": "Deactivate warehouse",
  "warehouses.statusConfirm.bodyActivate":
    "This warehouse will appear as available for receipts, transfers, and adjustments.",
  "warehouses.statusConfirm.bodyDeactivate":
    "The warehouse stays in history and balances are kept. Prefer deactivate over delete when stock exists.",
  "warehouses.statusConfirm.confirmActivate": "Activate",
  "warehouses.statusConfirm.confirmDeactivate": "Deactivate",
  "warehouses.statusConfirm.stockWarning":
    "This warehouse still has ledger stock: {qty} qty across {items} item line(s). Balances are not removed.",
  "warehouses.delete": "Delete",
  "warehouses.delete.title": "Delete warehouse",
  "warehouses.delete.body":
    "This permanently removes the warehouse master record from browser storage. This cannot be undone.",
  "warehouses.delete.confirm": "Delete permanently",
  "warehouses.delete.blocked":
    "Cannot delete: ledger has {qty} qty on {items} line(s). Deactivate instead, or clear stock first.",
  "warehouses.stock": "Stock on hand",
  "warehouses.kind.main": "Main",
  "warehouses.kind.new_parts": "New spare parts",
  "warehouses.kind.used_parts": "Used parts",
  "warehouses.kind.engines": "Complete engines",
  "warehouses.kind.other": "Other",
  "warehouses.overviewTitle": "Inventory & warehouse management",
  "warehouses.overviewHint":
    "Monitor item balances across warehouses and manage stock movements.",
  "warehouses.kpi.active": "Active warehouses",
  "warehouses.kpi.items": "Catalog items",
  "warehouses.kpi.lowStock": "Items below minimum",
  "warehouses.kpi.movements": "Inventory movements",
  "warehouses.balances": "Inventory balances",
  "warehouses.searchBalances":
    "Search by item, code, OEM, Part No, or barcode",
  "warehouses.filterWarehouse": "Warehouse",
  "warehouses.filterStatus": "Stock status",
  "warehouses.allWarehouses": "All warehouses",
  "warehouses.allStatuses": "All statuses",
  "warehouses.col.row": "#",
  "warehouses.col.itemCode": "Item code",
  "warehouses.col.itemName": "Item name",
  "warehouses.col.partNumber": "Part number",
  "warehouses.col.oem": "OEM number",
  "warehouses.col.manufacturer": "Manufacturer",
  "warehouses.col.warehouse": "Warehouse",
  "warehouses.col.qty": "Balance",
  "warehouses.col.min": "Minimum",
  "warehouses.col.status": "Status",
  "warehouses.status.available": "Available",
  "warehouses.status.low": "Below min",
  "warehouses.status.out": "Out of stock",
  "warehouses.lowStockTitle": "Items below minimum",
  "warehouses.recentMovements": "Recent inventory movements",
  "warehouses.receive": "Receive goods",
  "warehouses.issue": "Issue stock",
  "warehouses.transfer": "Transfer stock",
  "warehouses.qtyUnits": "Total qty",
  "warehouses.itemUnits": "Items",
  "warehouses.shortage": "Shortage",
  "warehouses.import": "Import",
  "warehouses.export": "Export",
  "warehouses.importUnavailable":
    "Bulk warehouse/stock import is not available in this frontend build. Use goods receipts, transfers, and adjustments to post stock.",
  "warehouses.toast.exported": "Balances exported.",
  "warehouses.emptyBalances": "No warehouse ledger balances yet.",
  "warehouses.emptyMovements": "No inventory movements recorded yet.",
  "warehouses.emptyLowStock": "No ledger lines below minimum.",
  "warehouses.columns": "Columns",
  "warehouses.activate": "Activate",
  "warehouses.deactivate": "Deactivate",
  "warehouses.openItem": "Open item",
  "warehouses.sortBy": "Sort",
  "warehouses.ref": "Reference",
  "warehouses.col.date": "Date",
  "warehouses.col.type": "Type",
  "stock.type.receipt": "Receive",
  "stock.type.issue": "Issue",
  "stock.type.transfer_out": "Transfer out",
  "stock.type.transfer_in": "Transfer in",
  "stock.type.adjustment": "Adjustment",
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
  "warehouses.addressEn": "العنوان (إنجليزي)",
  "warehouses.addressAr": "العنوان (عربي)",
  "warehouses.notes": "ملاحظات",
  "warehouses.form.createTitle": "مخزن جديد",
  "warehouses.form.editTitle": "تعديل المخزن",
  "warehouses.form.create": "إنشاء المخزن",
  "warehouses.form.saveChanges": "حفظ التغييرات",
  "warehouses.form.sectionIdentity": "الهوية",
  "warehouses.form.sectionStatus": "حالة التشغيل",
  "warehouses.form.sectionLocation": "الموقع",
  "warehouses.form.codeHint":
    "يُحفظ الكود بأحرف كبيرة. اترك المقترح أو أدخل كوداً فريداً.",
  "warehouses.form.notesPlaceholder": "ملاحظات داخلية لفريق المخزن…",
  "warehouses.form.shortcutSave": "Ctrl/⌘ + Enter للحفظ",
  "warehouses.form.discardConfirm":
    "سيتم فقدان التغييرات غير المحفوظة.",
  "warehouses.form.discardTitle": "تجاهل التغييرات؟",
  "warehouses.form.discardConfirmAction": "تجاهل",
  "warehouses.form.keepEditing": "متابعة التعديل",
  "warehouses.form.unsaved": "لديك تغييرات غير محفوظة.",
  "warehouses.form.editStep": "تعديل",
  "warehouses.wizard.step1": "الهوية",
  "warehouses.wizard.step2": "الموقع",
  "warehouses.wizard.step3": "الحالة والملاحظات",
  "warehouses.wizard.step4": "المراجعة",
  "warehouses.wizard.stepLabel": "الخطوة {current} من {total}",
  "warehouses.wizard.next": "متابعة",
  "warehouses.wizard.back": "رجوع",
  "warehouses.wizard.saving": "جاري الحفظ…",
  "warehouses.wizard.kindHint":
    "اختر دور المخزن المستخدم في حركات المخزون والفلاتر.",
  "warehouses.wizard.locationOptional":
    "الموقع اختياري ويمكن استكماله لاحقًا من تفاصيل المخزن.",
  "warehouses.wizard.notesOptional":
    "حالة التشغيل وملاحظات داخلية لفريق المخزن.",
  "warehouses.toast.created": "تم إنشاء المخزن.",
  "warehouses.toast.updated": "تم تحديث المخزن.",
  "warehouses.toast.activated": "تم تفعيل المخزن.",
  "warehouses.toast.deactivated": "تم إيقاف المخزن.",
  "warehouses.toast.deleted": "تم حذف المخزن.",
  "warehouses.statusConfirm.titleActivate": "تفعيل المخزن",
  "warehouses.statusConfirm.titleDeactivate": "إيقاف المخزن",
  "warehouses.statusConfirm.bodyActivate":
    "سيظهر هذا المخزن متاحاً لاستلام البضائع والتحويلات والتسويات.",
  "warehouses.statusConfirm.bodyDeactivate":
    "يبقى المخزن في السجل وتُحفظ الأرصدة. يُفضّل الإيقاف على الحذف عند وجود مخزون.",
  "warehouses.statusConfirm.confirmActivate": "تفعيل",
  "warehouses.statusConfirm.confirmDeactivate": "إيقاف",
  "warehouses.statusConfirm.stockWarning":
    "لا يزال لهذا المخزن رصيد دفتري: {qty} كمية عبر {items} بند/بنود. لن تُحذف الأرصدة.",
  "warehouses.delete": "حذف",
  "warehouses.delete.title": "حذف المخزن",
  "warehouses.delete.body":
    "سيُحذف سجل المخزن نهائياً من تخزين المتصفح. لا يمكن التراجع.",
  "warehouses.delete.confirm": "حذف نهائي",
  "warehouses.delete.blocked":
    "تعذر الحذف: الدفتر يحتوي {qty} كمية على {items} بند/بنود. أوقف المخزن بدلاً من ذلك، أو صفِّ الرصيد أولاً.",
  "warehouses.stock": "الرصيد المتاح",
  "warehouses.kind.main": "رئيسي",
  "warehouses.kind.new_parts": "قطع غيار جديدة",
  "warehouses.kind.used_parts": "قطع مستعملة",
  "warehouses.kind.engines": "محركات كاملة",
  "warehouses.kind.other": "أخرى",
  "warehouses.overviewTitle": "إدارة المخزون والمستودعات",
  "warehouses.overviewHint":
    "متابعة أرصدة الأصناف عبر المخازن وإدارة حركات المخزون.",
  "warehouses.kpi.active": "المخازن النشطة",
  "warehouses.kpi.items": "أصناف الكتالوج",
  "warehouses.kpi.lowStock": "أصناف تحت الحد الأدنى",
  "warehouses.kpi.movements": "حركات المخزون",
  "warehouses.balances": "أرصدة المخزون",
  "warehouses.searchBalances":
    "بحث بالصنف أو الكود أو OEM أو رقم القطعة أو الباركود",
  "warehouses.filterWarehouse": "المخزن",
  "warehouses.filterStatus": "حالة الرصيد",
  "warehouses.allWarehouses": "كل المخازن",
  "warehouses.allStatuses": "كل الحالات",
  "warehouses.col.row": "#",
  "warehouses.col.itemCode": "كود الصنف",
  "warehouses.col.itemName": "اسم الصنف",
  "warehouses.col.partNumber": "رقم القطعة",
  "warehouses.col.oem": "رقم OEM",
  "warehouses.col.manufacturer": "الشركة المصنعة",
  "warehouses.col.warehouse": "المخزن",
  "warehouses.col.qty": "الرصيد الحالي",
  "warehouses.col.min": "الحد الأدنى",
  "warehouses.col.status": "الحالة",
  "warehouses.status.available": "متاح",
  "warehouses.status.low": "تحت الحد",
  "warehouses.status.out": "نفد المخزون",
  "warehouses.lowStockTitle": "أصناف تحت الحد الأدنى",
  "warehouses.recentMovements": "أحدث حركات المخزون",
  "warehouses.receive": "استلام بضاعة",
  "warehouses.issue": "صرف مخزون",
  "warehouses.transfer": "تحويل مخزون",
  "warehouses.qtyUnits": "إجمالي الكمية",
  "warehouses.itemUnits": "أصناف",
  "warehouses.shortage": "نقص",
  "warehouses.import": "استيراد",
  "warehouses.export": "تصدير",
  "warehouses.importUnavailable":
    "استيراد المخزون بالجملة غير متاح في هذا البناء الأمامي. استخدم استلام البضائع والتحويلات والتسويات لترحيل الرصيد.",
  "warehouses.toast.exported": "تم تصدير الأرصدة.",
  "warehouses.emptyBalances": "لا توجد أرصدة دفتر مخزني بعد.",
  "warehouses.emptyMovements": "لا توجد حركات مخزون مسجّلة بعد.",
  "warehouses.emptyLowStock": "لا توجد بنود دفتر تحت الحد الأدنى.",
  "warehouses.columns": "الأعمدة",
  "warehouses.activate": "تفعيل",
  "warehouses.deactivate": "إيقاف",
  "warehouses.openItem": "فتح الصنف",
  "warehouses.sortBy": "ترتيب",
  "warehouses.ref": "المرجع",
  "warehouses.col.date": "التاريخ",
  "warehouses.col.type": "النوع",
  "stock.type.receipt": "استلام",
  "stock.type.issue": "صرف",
  "stock.type.transfer_out": "تحويل خارج",
  "stock.type.transfer_in": "تحويل داخل",
  "stock.type.adjustment": "تسوية",
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

export function toCount(
  locale: Locale,
  key: Extract<OpsKey, "warehouses.wizard.stepLabel">,
  vars: Record<string, string | number>,
): string {
  let out = to(locale, key);
  for (const [name, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${name}}`, String(value));
  }
  return out;
}
