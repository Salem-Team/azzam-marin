import type { Locale } from "@/types/i18n";

export type SupplierKey =
  | "suppliers.title"
  | "suppliers.listTitle"
  | "suppliers.add"
  | "suppliers.edit"
  | "suppliers.export"
  | "suppliers.import"
  | "suppliers.importSoon"
  | "suppliers.searchPlaceholder"
  | "suppliers.filters"
  | "suppliers.applyFilters"
  | "suppliers.clearFilters"
  | "suppliers.resultCount"
  | "suppliers.showingRange"
  | "suppliers.kpi.total"
  | "suppliers.kpi.active"
  | "suppliers.kpi.inactive"
  | "suppliers.kpi.purchases"
  | "suppliers.kpi.payments"
  | "suppliers.kpi.outstanding"
  | "suppliers.kpi.openOrders"
  | "suppliers.kpi.openOrdersValue"
  | "suppliers.kpi.lastSupply"
  | "suppliers.kpi.daysAgo"
  | "suppliers.kpi.reliability"
  | "suppliers.col.select"
  | "suppliers.col.index"
  | "suppliers.col.name"
  | "suppliers.col.country"
  | "suppliers.col.category"
  | "suppliers.col.taxId"
  | "suppliers.col.purchases"
  | "suppliers.col.amount"
  | "suppliers.col.balance"
  | "suppliers.col.status"
  | "suppliers.col.lastTx"
  | "suppliers.col.actions"
  | "suppliers.status.active"
  | "suppliers.status.inactive"
  | "suppliers.category.engines"
  | "suppliers.category.spareParts"
  | "suppliers.category.electrical"
  | "suppliers.category.oilsFilters"
  | "suppliers.category.other"
  | "suppliers.filter.country"
  | "suppliers.filter.category"
  | "suppliers.filter.status"
  | "suppliers.filter.balance"
  | "suppliers.filter.all"
  | "suppliers.filter.withBalance"
  | "suppliers.filter.zeroBalance"
  | "suppliers.actions"
  | "suppliers.action.view"
  | "suppliers.action.edit"
  | "suppliers.action.activate"
  | "suppliers.action.deactivate"
  | "suppliers.action.remove"
  | "suppliers.openRecord"
  | "suppliers.empty"
  | "suppliers.emptyFiltered"
  | "suppliers.emptyAction"
  | "suppliers.form.addTitle"
  | "suppliers.form.editTitle"
  | "suppliers.form.basic"
  | "suppliers.form.contact"
  | "suppliers.form.bank"
  | "suppliers.form.nameEn"
  | "suppliers.form.nameAr"
  | "suppliers.form.country"
  | "suppliers.form.category"
  | "suppliers.form.taxId"
  | "suppliers.form.code"
  | "suppliers.form.codeAuto"
  | "suppliers.form.contactPerson"
  | "suppliers.form.paymentTerms"
  | "suppliers.form.notesEn"
  | "suppliers.form.notesAr"
  | "suppliers.form.commercial"
  | "suppliers.form.invalidCode"
  | "suppliers.form.duplicateCode"
  | "suppliers.form.phone"
  | "suppliers.form.email"
  | "suppliers.form.whatsapp"
  | "suppliers.form.website"
  | "suppliers.form.addressEn"
  | "suppliers.form.addressAr"
  | "suppliers.form.status"
  | "suppliers.form.bankName"
  | "suppliers.form.accountName"
  | "suppliers.form.iban"
  | "suppliers.bank.show"
  | "suppliers.bank.hide"
  | "suppliers.bank.copy"
  | "suppliers.bank.copied"
  | "suppliers.form.swift"
  | "suppliers.form.save"
  | "suppliers.form.cancel"
  | "suppliers.form.required"
  | "suppliers.form.invalidEmail"
  | "suppliers.form.invalidPhone"
  | "suppliers.form.unsaved"
  | "suppliers.form.discard"
  | "suppliers.form.keepEditing"
  | "suppliers.form.review"
  | "suppliers.wizard.step1"
  | "suppliers.wizard.step2"
  | "suppliers.wizard.step3"
  | "suppliers.wizard.step4"
  | "suppliers.wizard.step5"
  | "suppliers.wizard.step6"
  | "suppliers.wizard.docsOptional"
  | "suppliers.wizard.docsCount"
  | "suppliers.wizard.commercialHint"
  | "suppliers.wizard.next"
  | "suppliers.wizard.back"
  | "suppliers.wizard.create"
  | "suppliers.wizard.creating"
  | "suppliers.wizard.saving"
  | "suppliers.wizard.saveChanges"
  | "suppliers.wizard.existingDocs"
  | "suppliers.wizard.markRemove"
  | "suppliers.wizard.removePending"
  | "suppliers.wizard.openProfile"
  | "suppliers.wizard.done"
  | "suppliers.wizard.stepLabel"
  | "suppliers.wizard.bankOptional"
  | "suppliers.remove.titleDelete"
  | "suppliers.remove.titleDeactivate"
  | "suppliers.remove.bodyDelete"
  | "suppliers.remove.bodyDeactivate"
  | "suppliers.remove.confirmDelete"
  | "suppliers.remove.confirmDeactivate"
  | "suppliers.toast.created"
  | "suppliers.toast.updated"
  | "suppliers.toast.activated"
  | "suppliers.toast.deactivated"
  | "suppliers.toast.deleted"
  | "suppliers.toast.exported"
  | "suppliers.toast.error"
  | "suppliers.toast.persistError"
  | "suppliers.pageSize"
  | "suppliers.pagination"
  | "suppliers.pagination.prev"
  | "suppliers.pagination.next"
  | "suppliers.pagination.first"
  | "suppliers.pagination.last"
  | "suppliers.selected"
  | "suppliers.details.back"
  | "suppliers.details.notFound"
  | "suppliers.details.overview"
  | "suppliers.details.contact"
  | "suppliers.details.commercial"
  | "suppliers.details.bank"
  | "suppliers.details.orders"
  | "suppliers.details.purchases"
  | "suppliers.details.payments"
  | "suppliers.details.activityTab"
  | "suppliers.details.activityHint"
  | "suppliers.details.bankHint"
  | "suppliers.details.call"
  | "suppliers.details.emailAction"
  | "suppliers.details.whatsappAction"
  | "suppliers.details.openWebsite"
  | "suppliers.details.copyValue"
  | "suppliers.details.copied"
  | "suppliers.details.unavailableAction"
  | "suppliers.details.expectedDelivery"
  | "suppliers.details.currency"
  | "suppliers.details.method"
  | "suppliers.details.paymentStatus"
  | "suppliers.details.goodsReceiptNote"
  | "suppliers.demo.ledgerBanner"
  | "suppliers.statement.search"
  | "suppliers.statement.type"
  | "suppliers.statement.typeAll"
  | "suppliers.statement.typeDebit"
  | "suppliers.statement.typeCredit"
  | "suppliers.statement.print"
  | "suppliers.statement.export"
  | "suppliers.statement.empty"
  | "suppliers.doc.retry"
  | "suppliers.doc.uploading"
  | "suppliers.doc.status.ready"
  | "suppliers.doc.status.failed"
  | "suppliers.doc.status.pending"
  | "suppliers.loading"
  | "suppliers.pay.posted"
  | "suppliers.pay.pending"
  | "suppliers.statusConfirm.titleActivate"
  | "suppliers.statusConfirm.titleDeactivate"
  | "suppliers.statusConfirm.bodyActivate"
  | "suppliers.statusConfirm.bodyDeactivate"
  | "suppliers.statusConfirm.confirmActivate"
  | "suppliers.statusConfirm.confirmDeactivate"
  | "suppliers.origin.seed"
  | "suppliers.origin.user"
  | "suppliers.filter.period"
  | "suppliers.doc.confirmRemoveTitle"
  | "suppliers.doc.confirmRemoveBody"
  | "suppliers.doc.confirmRemove"
  | "suppliers.details.relatedActions"
  | "suppliers.details.balance"
  | "suppliers.details.debit"
  | "suppliers.details.credit"
  | "suppliers.details.reference"
  | "suppliers.details.statement"
  | "suppliers.details.history"
  | "suppliers.details.sectionReady"
  | "suppliers.details.taxId"
  | "suppliers.details.founded"
  | "suppliers.details.website"
  | "suppliers.details.notes"
  | "suppliers.details.address"
  | "suppliers.details.documents"
  | "suppliers.details.items"
  | "suppliers.details.itemsEmpty"
  | "suppliers.details.itemsEmptyAction"
  | "suppliers.details.itemsLoading"
  | "suppliers.details.itemsError"
  | "suppliers.details.itemsHint"
  | "suppliers.details.items.col.code"
  | "suppliers.details.items.col.name"
  | "suppliers.details.items.col.type"
  | "suppliers.details.items.col.supplierItemCode"
  | "suppliers.details.items.col.price"
  | "suppliers.details.items.col.currency"
  | "suppliers.details.items.col.leadTime"
  | "suppliers.details.items.col.status"
  | "suppliers.details.items.viewItem"
  | "suppliers.details.items.missingItem"
  | "suppliers.details.items.inactiveItem"
  | "suppliers.details.documentsUnavailable"
  | "suppliers.details.documentsHint"
  | "suppliers.details.documentsEmpty"
  | "suppliers.details.documentsUpload"
  | "suppliers.details.documentsDrop"
  | "suppliers.details.documentsBrowse"
  | "suppliers.details.documentsRemove"
  | "suppliers.details.documentsDownload"
  | "suppliers.details.documentsPreview"
  | "suppliers.details.documentsReplace"
  | "suppliers.details.documentsCategory"
  | "suppliers.details.documentsUploadedBy"
  | "suppliers.details.documentsSize"
  | "suppliers.doc.commercialRegistration"
  | "suppliers.doc.taxRegistration"
  | "suppliers.doc.agreement"
  | "suppliers.doc.bank"
  | "suppliers.doc.certificate"
  | "suppliers.doc.quotation"
  | "suppliers.doc.other"
  | "suppliers.doc.err.too-large"
  | "suppliers.doc.err.invalid-type"
  | "suppliers.doc.err.empty"
  | "suppliers.doc.err.storage-unavailable"
  | "suppliers.doc.err.write-failed"
  | "suppliers.doc.err.not-found"
  | "suppliers.toast.docUploaded"
  | "suppliers.toast.docRemoved"
  | "suppliers.toast.docFailed"
  | "suppliers.details.activity"
  | "suppliers.details.activityEmpty"
  | "suppliers.activity.filters"
  | "suppliers.activity.filterAll"
  | "suppliers.activity.cat.profile"
  | "suppliers.activity.cat.status"
  | "suppliers.activity.cat.document"
  | "suppliers.activity.cat.order"
  | "suppliers.activity.cat.purchase"
  | "suppliers.activity.cat.payment"
  | "suppliers.activity.create"
  | "suppliers.activity.update"
  | "suppliers.activity.activate"
  | "suppliers.activity.deactivate"
  | "suppliers.activity.deactivateHistory"
  | "suppliers.activity.delete"
  | "suppliers.activity.docUpload"
  | "suppliers.activity.docRemove"
  | "suppliers.activity.docReplace"
  | "suppliers.activity.po"
  | "suppliers.activity.purchase"
  | "suppliers.activity.payment"
  | "suppliers.activity.fieldsChanged"
  | "suppliers.activity.expectedDelivery"
  | "suppliers.activity.actorDemo"
  | "suppliers.activity.actorPurchasing"
  | "suppliers.activity.actorFinance"
  | "suppliers.activity.byActor"
  | "suppliers.activity.openRecord"
  | "suppliers.activity.openRelated"
  | "suppliers.activity.detailTitle"
  | "suppliers.activity.userLabel"
  | "suppliers.activity.dateLabel"
  | "suppliers.activity.timeLabel"
  | "suppliers.col.code"
  | "suppliers.details.newAction"
  | "suppliers.details.moreActions"
  | "suppliers.details.importShipments"
  | "suppliers.details.importCosts"
  | "suppliers.chart.purchasesPayments"
  | "suppliers.chart.12months"
  | "suppliers.chart.byCategory"
  | "suppliers.chart.poStatus"
  | "suppliers.chart.poTotal"
  | "suppliers.recent.orders"
  | "suppliers.recent.purchases"
  | "suppliers.recent.payments"
  | "suppliers.recent.id"
  | "suppliers.recent.viewAll"
  | "suppliers.po.open"
  | "suppliers.po.inProgress"
  | "suppliers.po.partial"
  | "suppliers.po.completed"
  | "suppliers.purchase.received"
  | "suppliers.purchase.pending"
  | "suppliers.pay.bankTransfer"
  | "suppliers.pay.swift"
  | "suppliers.pay.cash"
  | "suppliers.master.title"
  | "suppliers.master.type"
  | "suppliers.master.typeManufacturer"
  | "suppliers.preview.contact"
  | "suppliers.preview.fullProfile"
  | "suppliers.preview.more"
  | "suppliers.preview.message"
  | "suppliers.preview.messageSoon"
  | "suppliers.sort.nameAsc"
  | "suppliers.sort.nameDesc"
  | "suppliers.sort.balanceDesc"
  | "suppliers.sort.purchasesDesc"
  | "suppliers.sort.lastTxDesc"
  | "suppliers.sort.label";

const en: Record<SupplierKey, string> = {
  "suppliers.title": "Suppliers",
  "suppliers.listTitle": "Suppliers List",
  "suppliers.add": "Add New Supplier",
  "suppliers.edit": "Edit",
  "suppliers.export": "Export",
  "suppliers.import": "Import",
  "suppliers.importSoon": "CSV import will be available when backend sync is ready.",
  "suppliers.searchPlaceholder": "Search name, code, phone, email, tax ID…",
  "suppliers.filters": "Filters",
  "suppliers.applyFilters": "Apply",
  "suppliers.clearFilters": "Clear",
  "suppliers.resultCount": "{count} suppliers",
  "suppliers.showingRange": "Showing {from}–{to} of {count}",
  "suppliers.kpi.total": "Total Suppliers",
  "suppliers.kpi.active": "Active",
  "suppliers.kpi.inactive": "Inactive",
  "suppliers.kpi.purchases": "Total Purchases",
  "suppliers.kpi.payments": "Total Payments",
  "suppliers.kpi.outstanding": "Outstanding Balances",
  "suppliers.kpi.openOrders": "Open Purchase Orders",
  "suppliers.kpi.openOrdersValue": "Value",
  "suppliers.kpi.lastSupply": "Last Supply Date",
  "suppliers.kpi.daysAgo": "{n} days ago",
  "suppliers.kpi.reliability": "Supply commitment",
  "suppliers.col.select": "Select",
  "suppliers.col.index": "#",
  "suppliers.col.name": "Supplier",
  "suppliers.col.country": "Country",
  "suppliers.col.category": "Category",
  "suppliers.col.taxId": "Tax ID",
  "suppliers.col.purchases": "Purchases",
  "suppliers.col.amount": "Amount",
  "suppliers.col.balance": "Balance",
  "suppliers.col.status": "Status",
  "suppliers.col.lastTx": "Last transaction",
  "suppliers.col.actions": "Actions",
  "suppliers.status.active": "Active",
  "suppliers.status.inactive": "Inactive",
  "suppliers.category.engines": "Engines",
  "suppliers.category.spareParts": "Spare Parts",
  "suppliers.category.electrical": "Electrical",
  "suppliers.category.oilsFilters": "Oils & Filters",
  "suppliers.category.other": "Other",
  "suppliers.filter.country": "Country",
  "suppliers.filter.category": "Category",
  "suppliers.filter.status": "Status",
  "suppliers.filter.balance": "Balance",
  "suppliers.filter.all": "All",
  "suppliers.filter.withBalance": "With balance",
  "suppliers.filter.zeroBalance": "Zero balance",
  "suppliers.actions": "Actions",
  "suppliers.action.view": "View details",
  "suppliers.action.edit": "Edit",
  "suppliers.action.activate": "Activate",
  "suppliers.action.deactivate": "Deactivate",
  "suppliers.action.remove": "Remove",
  "suppliers.openRecord": "Open supplier",
  "suppliers.empty": "No suppliers yet",
  "suppliers.emptyFiltered": "No suppliers match your search or filters",
  "suppliers.emptyAction": "Add a supplier to get started",
  "suppliers.form.addTitle": "Add Supplier",
  "suppliers.form.editTitle": "Edit Supplier",
  "suppliers.form.basic": "Basic information",
  "suppliers.form.contact": "Contact",
  "suppliers.form.bank": "Bank account",
  "suppliers.form.nameEn": "Supplier name (English)",
  "suppliers.form.nameAr": "Supplier name (Arabic)",
  "suppliers.form.country": "Country",
  "suppliers.form.category": "Category",
  "suppliers.form.taxId": "Tax registration number",
  "suppliers.form.phone": "Phone",
  "suppliers.form.email": "Email",
  "suppliers.form.whatsapp": "WhatsApp",
  "suppliers.form.website": "Website",
  "suppliers.form.addressEn": "Address (English)",
  "suppliers.form.addressAr": "Address (Arabic)",
  "suppliers.form.status": "Status",
  "suppliers.form.bankName": "Bank name",
  "suppliers.form.accountName": "Account name",
  "suppliers.form.iban": "IBAN / Account number",
  "suppliers.bank.show": "Show full number",
  "suppliers.bank.hide": "Hide number",
  "suppliers.bank.copy": "Copy",
  "suppliers.bank.copied": "Copied to clipboard",
  "suppliers.form.swift": "SWIFT / BIC",
  "suppliers.form.save": "Save",
  "suppliers.form.cancel": "Cancel",
  "suppliers.form.required": "Required",
  "suppliers.form.invalidEmail": "Enter a valid email",
  "suppliers.form.invalidPhone": "Enter a valid phone number",
  "suppliers.form.unsaved": "Discard unsaved changes?",
  "suppliers.form.discard": "Discard",
  "suppliers.form.keepEditing": "Keep editing",
  "suppliers.form.review": "Review",
  "suppliers.wizard.step1": "Identity",
  "suppliers.wizard.step2": "Contact",
  "suppliers.wizard.step3": "Commercial",
  "suppliers.wizard.step4": "Banking",

  "suppliers.form.code": "Supplier code",
  "suppliers.form.codeAuto": "Generated automatically",
  "suppliers.form.contactPerson": "Contact person",
  "suppliers.form.paymentTerms": "Payment terms",
  "suppliers.form.notesEn": "Notes (English)",
  "suppliers.form.notesAr": "Notes (Arabic)",
  "suppliers.form.commercial": "Commercial",
  "suppliers.form.invalidCode": "Use 2–24 letters, numbers, - or _",
  "suppliers.form.duplicateCode": "This supplier code is already in use",
  "suppliers.wizard.step5": "Documents",
  "suppliers.wizard.step6": "Review",
  "suppliers.wizard.docsOptional": "Attach supporting documents now, or add them later from the supplier profile.",
  "suppliers.wizard.docsCount": "{count} file(s) ready",
  "suppliers.wizard.commercialHint": "Reporting currency for this catalog is USD. Balances are calculated from purchases and payments — not entered manually.",
  "suppliers.details.documentsHint": "Files are stored in this browser only (demo adapter). Not a multi-user document system.",
  "suppliers.details.documentsEmpty": "No documents attached yet",
  "suppliers.details.documentsUpload": "Upload document",
  "suppliers.details.documentsDrop": "Drop files here or browse",
  "suppliers.details.documentsBrowse": "Browse files",
  "suppliers.details.documentsRemove": "Remove",
  "suppliers.details.documentsDownload": "Download",
  "suppliers.details.documentsPreview": "Preview",
  "suppliers.details.documentsReplace": "Replace",
  "suppliers.details.documentsCategory": "Category",
  "suppliers.details.documentsUploadedBy": "Uploaded by",
  "suppliers.details.documentsSize": "Size",
  "suppliers.doc.commercialRegistration": "Commercial registration",
  "suppliers.doc.taxRegistration": "Tax registration",
  "suppliers.doc.agreement": "Supplier agreement",
  "suppliers.doc.bank": "Bank documentation",
  "suppliers.doc.certificate": "Certificate",
  "suppliers.doc.quotation": "Quotation",
  "suppliers.doc.other": "Other",
  "suppliers.doc.err.too-large": "File exceeds 5 MB",
  "suppliers.doc.err.invalid-type": "Unsupported file type",
  "suppliers.doc.err.empty": "File is empty",
  "suppliers.doc.err.storage-unavailable": "Document storage unavailable",
  "suppliers.doc.err.write-failed": "Could not store the file",
  "suppliers.doc.err.not-found": "Document not found",
  "suppliers.toast.docUploaded": "Document uploaded",
  "suppliers.toast.docRemoved": "Document removed",
  "suppliers.toast.docFailed": "Document action failed",
  "suppliers.details.activity": "Supplier activity",
  "suppliers.details.activityEmpty": "No recorded supplier activity yet",
  "suppliers.details.activityTab": "Activity & audit",
  "suppliers.activity.filters": "Activity filters",
  "suppliers.activity.filterAll": "All",
  "suppliers.activity.cat.profile": "Profile",
  "suppliers.activity.cat.status": "Status",
  "suppliers.activity.cat.document": "Documents",
  "suppliers.activity.cat.order": "Orders",
  "suppliers.activity.cat.purchase": "Purchases",
  "suppliers.activity.cat.payment": "Payments",
  "suppliers.activity.create": "Supplier created {code}",
  "suppliers.activity.update": "Supplier profile updated {code}",
  "suppliers.activity.activate": "Supplier activated {code}",
  "suppliers.activity.deactivate": "Supplier deactivated {code}",
  "suppliers.activity.deactivateHistory":
    "Supplier deactivated (history retained) {code}",
  "suppliers.activity.delete": "Supplier deleted {code}",
  "suppliers.activity.docUpload": "Document uploaded {fileName}",
  "suppliers.activity.docRemove": "Document removed {fileName}",
  "suppliers.activity.docReplace": "Document replaced {fileName}",
  "suppliers.activity.po": "Purchase order {id}",
  "suppliers.activity.purchase": "Purchase {id}",
  "suppliers.activity.payment": "Payment {id}",
  "suppliers.activity.fieldsChanged": "Changed: {fields}",
  "suppliers.activity.expectedDelivery": "Expected delivery {date}",
  "suppliers.activity.actorDemo": "Demo user",
  "suppliers.activity.actorPurchasing": "Purchasing officer",
  "suppliers.activity.actorFinance": "Finance officer",
  "suppliers.activity.byActor": "By {actor}",
  "suppliers.activity.openRecord": "Open record",
  "suppliers.activity.openRelated": "Open related",
  "suppliers.activity.detailTitle": "Activity details",
  "suppliers.activity.userLabel": "User",
  "suppliers.activity.dateLabel": "Date",
  "suppliers.activity.timeLabel": "Time",
  "suppliers.details.activityHint":
    "Client-side activity only. Not a secure server audit trail.",
  "suppliers.details.bankHint":
    "Visibility controls are frontend-only and do not enforce server authorization.",
  "suppliers.details.call": "Call",
  "suppliers.details.emailAction": "Email",
  "suppliers.details.whatsappAction": "WhatsApp",
  "suppliers.details.openWebsite": "Open website",
  "suppliers.details.copyValue": "Copy",
  "suppliers.details.copied": "Copied",
  "suppliers.details.unavailableAction": "Not available",
  "suppliers.details.expectedDelivery": "Expected delivery",
  "suppliers.details.currency": "Currency",
  "suppliers.details.method": "Method",
  "suppliers.details.paymentStatus": "Status",
  "suppliers.details.goodsReceiptNote":
    "Received = goods receipt recorded in demo data. A purchase order alone is not proof of receipt.",
  "suppliers.demo.ledgerBanner":
    "Demo ledger — simulated frontend records, not verified accounting.",
  "suppliers.statement.search": "Search reference or description…",
  "suppliers.statement.type": "Type",
  "suppliers.statement.typeAll": "All movements",
  "suppliers.statement.typeDebit": "Debit only",
  "suppliers.statement.typeCredit": "Credit only",
  "suppliers.statement.print": "Print",
  "suppliers.statement.export": "Export CSV",
  "suppliers.statement.empty": "No movements match the current filters",
  "suppliers.doc.retry": "Retry",
  "suppliers.doc.uploading": "Uploading…",
  "suppliers.doc.status.ready": "Ready",
  "suppliers.doc.status.failed": "Failed",
  "suppliers.doc.status.pending": "Pending save",
  "suppliers.loading": "Loading suppliers…",
  "suppliers.pay.posted": "Posted",
  "suppliers.pay.pending": "Pending",
  "suppliers.statusConfirm.titleActivate": "Activate supplier",
  "suppliers.statusConfirm.titleDeactivate": "Deactivate supplier",
  "suppliers.statusConfirm.bodyActivate":
    "This supplier will appear as active in the directory and can be used in purchasing workflows.",
  "suppliers.statusConfirm.bodyDeactivate":
    "This supplier will be marked inactive. Related history remains available.",
  "suppliers.statusConfirm.confirmActivate": "Activate",
  "suppliers.statusConfirm.confirmDeactivate": "Deactivate",
  "suppliers.origin.seed": "Demo",
  "suppliers.origin.user": "Local",
  "suppliers.filter.period": "Period",
  "suppliers.doc.confirmRemoveTitle": "Remove document",
  "suppliers.doc.confirmRemoveBody":
    "This removes the file from this browser’s local document store. It cannot be undone.",
  "suppliers.doc.confirmRemove": "Remove document",
  "suppliers.details.relatedActions": "Related",
  "suppliers.col.code": "Code",
  "suppliers.wizard.next": "Continue",
  "suppliers.wizard.back": "Back",
  "suppliers.wizard.create": "Create supplier",
  "suppliers.wizard.creating": "Creating…",
  "suppliers.wizard.saving": "Saving…",
  "suppliers.wizard.saveChanges": "Save changes",
  "suppliers.wizard.existingDocs": "Existing documents",
  "suppliers.wizard.markRemove": "Remove on save",
  "suppliers.wizard.removePending": "{count} document(s) will be removed on save",
  "suppliers.wizard.openProfile": "Open profile",
  "suppliers.wizard.done": "Done",
  "suppliers.wizard.stepLabel": "Step {current} of {total}",
  "suppliers.wizard.bankOptional": "Banking details are optional and can be added later.",
  "suppliers.remove.titleDelete": "Delete supplier",
  "suppliers.remove.titleDeactivate": "Deactivate supplier",
  "suppliers.remove.bodyDelete": "This supplier has no purchase, payment, or order history. Permanent deletion cannot be undone.",
  "suppliers.remove.bodyDeactivate": "This supplier has related records. It will be deactivated so history remains available. Permanent deletion is not allowed.",
  "suppliers.remove.confirmDelete": "Delete permanently",
  "suppliers.remove.confirmDeactivate": "Deactivate",
  "suppliers.toast.created": "Supplier added",
  "suppliers.toast.updated": "Supplier updated",
  "suppliers.toast.activated": "Supplier activated",
  "suppliers.toast.deactivated": "Supplier deactivated",
  "suppliers.toast.deleted": "Supplier deleted",
  "suppliers.toast.exported": "Export downloaded",
  "suppliers.toast.error": "Something went wrong",
  "suppliers.toast.persistError": "Could not save to local storage",
  "suppliers.pageSize": "Rows",
  "suppliers.pagination": "Page {page} of {pages}",
  "suppliers.pagination.prev": "Previous page",
  "suppliers.pagination.next": "Next page",
  "suppliers.pagination.first": "First page",
  "suppliers.pagination.last": "Last page",
  "suppliers.selected": "{count} selected",
  "suppliers.details.back": "Back to suppliers",
  "suppliers.details.notFound": "Supplier not found",
  "suppliers.details.overview": "General Overview",
  "suppliers.details.contact": "Contact Information",
  "suppliers.details.commercial": "Commercial",
  "suppliers.details.bank": "Bank Accounts",
  "suppliers.details.orders": "Purchase Orders",
  "suppliers.details.purchases": "Purchases & goods receipts",
  "suppliers.details.payments": "Payments",
  "suppliers.details.balance": "Current Balance",
  "suppliers.details.debit": "Debit",
  "suppliers.details.credit": "Credit",
  "suppliers.details.reference": "Reference",
  "suppliers.details.statement": "Account Statement",
  "suppliers.details.history": "Transaction History",
  "suppliers.details.sectionReady": "Section prepared for future records",
  "suppliers.details.taxId": "Tax ID",
  "suppliers.details.founded": "Established",
  "suppliers.details.website": "Website",
  "suppliers.details.notes": "Notes",
  "suppliers.details.address": "Address",
  "suppliers.details.documents": "Documents",
  "suppliers.details.items": "Related items",
  "suppliers.details.itemsEmpty": "No catalog items linked to this supplier.",
  "suppliers.details.itemsEmptyAction": "Open items directory",
  "suppliers.details.itemsLoading": "Loading related items…",
  "suppliers.details.itemsError": "Could not load related items.",
  "suppliers.details.itemsHint":
    "Links are stored in this browser only. Linking does not create purchase orders or change balances.",
  "suppliers.details.items.col.code": "Item code",
  "suppliers.details.items.col.name": "Item name",
  "suppliers.details.items.col.type": "Type",
  "suppliers.details.items.col.supplierItemCode": "Supplier item code",
  "suppliers.details.items.col.price": "Supplier price",
  "suppliers.details.items.col.currency": "Currency",
  "suppliers.details.items.col.leadTime": "Lead time",
  "suppliers.details.items.col.status": "Link status",
  "suppliers.details.items.viewItem": "View item",
  "suppliers.details.items.missingItem": "Missing item record",
  "suppliers.details.items.inactiveItem": "Inactive item",
  "suppliers.details.documentsUnavailable":
    "Document storage is not available in this frontend build.",
  "suppliers.details.newAction": "New Action",
  "suppliers.details.moreActions": "More actions",
  "suppliers.details.importShipments": "Import shipments",
  "suppliers.details.importCosts": "Import costs",
  "suppliers.chart.purchasesPayments": "Purchases and Payments",
  "suppliers.chart.12months": "Last 12 months",
  "suppliers.chart.byCategory": "Purchase Distribution by Category",
  "suppliers.chart.poStatus": "Purchase Order Status",
  "suppliers.chart.poTotal": "Total orders",
  "suppliers.recent.orders": "Recent Purchase Orders",
  "suppliers.recent.purchases": "Recent Purchases",
  "suppliers.recent.payments": "Recent Payments",
  "suppliers.recent.id": "Number",
  "suppliers.recent.viewAll": "View all",
  "suppliers.po.open": "Open",
  "suppliers.po.inProgress": "In Progress",
  "suppliers.po.partial": "Partially Received",
  "suppliers.po.completed": "Completed",
  "suppliers.purchase.received": "Received",
  "suppliers.purchase.pending": "Pending",
  "suppliers.pay.bankTransfer": "Bank Transfer",
  "suppliers.pay.swift": "SWIFT",
  "suppliers.pay.cash": "Cash",
  "suppliers.master.title": "Basic Supplier Data",
  "suppliers.master.type": "Type",
  "suppliers.master.typeManufacturer": "Manufacturing company",
  "suppliers.preview.contact": "Contact",
  "suppliers.preview.fullProfile": "View full profile",
  "suppliers.preview.more": "More",
  "suppliers.preview.message": "Send message",
  "suppliers.preview.messageSoon": "Messaging will be available with backend sync.",
  "suppliers.sort.nameAsc": "Name A–Z",
  "suppliers.sort.nameDesc": "Name Z–A",
  "suppliers.sort.balanceDesc": "Highest balance",
  "suppliers.sort.purchasesDesc": "Highest purchases",
  "suppliers.sort.lastTxDesc": "Latest activity",
  "suppliers.sort.label": "Sort",
};

const ar: Record<SupplierKey, string> = {
  "suppliers.title": "الموردون",
  "suppliers.listTitle": "قائمة الموردين",
  "suppliers.add": "إضافة مورد جديد",
  "suppliers.edit": "تعديل",
  "suppliers.export": "تصدير",
  "suppliers.import": "استيراد",
  "suppliers.importSoon": "استيراد CSV سيكون متاحًا عند ربط الخادم.",
  "suppliers.searchPlaceholder": "بحث بالاسم أو الكود أو الهاتف أو البريد أو الرقم الضريبي…",
  "suppliers.filters": "تصفية",
  "suppliers.applyFilters": "تطبيق",
  "suppliers.clearFilters": "مسح",
  "suppliers.resultCount": "{count} مورد",
  "suppliers.showingRange": "عرض {from}–{to} من {count}",
  "suppliers.kpi.total": "إجمالي الموردين",
  "suppliers.kpi.active": "نشط",
  "suppliers.kpi.inactive": "غير نشط",
  "suppliers.kpi.purchases": "إجمالي المشتريات",
  "suppliers.kpi.payments": "إجمالي المدفوعات",
  "suppliers.kpi.outstanding": "الأرصدة المستحقة",
  "suppliers.kpi.openOrders": "أوامر شراء مفتوحة",
  "suppliers.kpi.openOrdersValue": "القيمة",
  "suppliers.kpi.lastSupply": "آخر توريد",
  "suppliers.kpi.daysAgo": "منذ {n} يوم",
  "suppliers.kpi.reliability": "التزام التوريد",
  "suppliers.col.select": "تحديد",
  "suppliers.col.index": "#",
  "suppliers.col.name": "المورد",
  "suppliers.col.country": "الدولة",
  "suppliers.col.category": "التصنيف",
  "suppliers.col.taxId": "الرقم الضريبي",
  "suppliers.col.purchases": "المشتريات",
  "suppliers.col.amount": "المبلغ",
  "suppliers.col.balance": "الرصيد",
  "suppliers.col.status": "الحالة",
  "suppliers.col.lastTx": "آخر حركة",
  "suppliers.col.actions": "إجراءات",
  "suppliers.status.active": "نشط",
  "suppliers.status.inactive": "غير نشط",
  "suppliers.category.engines": "محركات",
  "suppliers.category.spareParts": "قطع غيار",
  "suppliers.category.electrical": "كهربائية",
  "suppliers.category.oilsFilters": "زيوت وفلاتر",
  "suppliers.category.other": "أخرى",
  "suppliers.filter.country": "الدولة",
  "suppliers.filter.category": "التصنيف",
  "suppliers.filter.status": "الحالة",
  "suppliers.filter.balance": "الرصيد",
  "suppliers.filter.all": "الكل",
  "suppliers.filter.withBalance": "عليه رصيد",
  "suppliers.filter.zeroBalance": "رصيد صفر",
  "suppliers.actions": "إجراءات",
  "suppliers.action.view": "عرض التفاصيل",
  "suppliers.action.edit": "تعديل",
  "suppliers.action.activate": "تفعيل",
  "suppliers.action.deactivate": "إلغاء التفعيل",
  "suppliers.action.remove": "إزالة",
  "suppliers.openRecord": "فتح المورد",
  "suppliers.empty": "لا يوجد موردون بعد",
  "suppliers.emptyFiltered": "لا يوجد موردون مطابقون للبحث أو التصفية",
  "suppliers.emptyAction": "أضف موردًا للبدء",
  "suppliers.form.addTitle": "إضافة مورد",
  "suppliers.form.editTitle": "تعديل مورد",
  "suppliers.form.basic": "البيانات الأساسية",
  "suppliers.form.contact": "التواصل",
  "suppliers.form.bank": "الحساب البنكي",
  "suppliers.form.nameEn": "اسم المورد (إنجليزي)",
  "suppliers.form.nameAr": "اسم المورد (عربي)",
  "suppliers.form.country": "الدولة",
  "suppliers.form.category": "التصنيف",
  "suppliers.form.taxId": "الرقم الضريبي",
  "suppliers.form.phone": "الهاتف",
  "suppliers.form.email": "البريد الإلكتروني",
  "suppliers.form.whatsapp": "واتساب",
  "suppliers.form.website": "الموقع",
  "suppliers.form.addressEn": "العنوان (إنجليزي)",
  "suppliers.form.addressAr": "العنوان (عربي)",
  "suppliers.form.status": "الحالة",
  "suppliers.form.bankName": "اسم البنك",
  "suppliers.form.accountName": "اسم الحساب",
  "suppliers.form.iban": "رقم الحساب / IBAN",
  "suppliers.bank.show": "إظهار الرقم كاملًا",
  "suppliers.bank.hide": "إخفاء الرقم",
  "suppliers.bank.copy": "نسخ",
  "suppliers.bank.copied": "تم النسخ",
  "suppliers.form.swift": "SWIFT / BIC",
  "suppliers.form.save": "حفظ",
  "suppliers.form.cancel": "إلغاء",
  "suppliers.form.required": "مطلوب",
  "suppliers.form.invalidEmail": "أدخل بريدًا إلكترونيًا صالحًا",
  "suppliers.form.invalidPhone": "أدخل رقم هاتف صالحًا",
  "suppliers.form.unsaved": "تجاهل التغييرات غير المحفوظة؟",
  "suppliers.form.discard": "تجاهل",
  "suppliers.form.keepEditing": "متابعة التعديل",
  "suppliers.form.review": "مراجعة",
  "suppliers.wizard.step1": "هوية",
  "suppliers.wizard.step2": "تواصل",
  "suppliers.wizard.step3": "تجاري",
  "suppliers.wizard.step4": "بنكي",
  "suppliers.form.code": "كود المورد",
  "suppliers.form.codeAuto": "يُنشأ تلقائيًا",
  "suppliers.form.contactPerson": "شخص التواصل",
  "suppliers.form.paymentTerms": "شروط الدفع",
  "suppliers.form.notesEn": "ملاحظات (إنجليزي)",
  "suppliers.form.notesAr": "ملاحظات (عربي)",
  "suppliers.form.commercial": "بيانات تجارية",
  "suppliers.form.invalidCode": "استخدم 2–24 حرفًا أو رقمًا أو - أو _",
  "suppliers.form.duplicateCode": "كود المورد مستخدم بالفعل",
  "suppliers.wizard.step5": "مستندات",
  "suppliers.wizard.step6": "مراجعة",
  "suppliers.wizard.docsOptional": "أرفق المستندات الآن، أو أضفها لاحقًا من ملف المورد.",
  "suppliers.wizard.docsCount": "{count} ملف جاهز",
  "suppliers.wizard.commercialHint": "عملة التقارير في هذا الكتالوج هي الدولار. الأرصدة تُحسب من المشتريات والمدفوعات — وليست إدخالًا يدويًا.",
  "suppliers.details.documentsHint": "تُحفظ الملفات في هذا المتصفح فقط (محول تجريبي). ليست منظومة مستندات متعددة المستخدمين.",
  "suppliers.details.documentsEmpty": "لا توجد مستندات بعد",
  "suppliers.details.documentsUpload": "رفع مستند",
  "suppliers.details.documentsDrop": "أسقط الملفات هنا أو اختر",
  "suppliers.details.documentsBrowse": "اختيار ملفات",
  "suppliers.details.documentsRemove": "إزالة",
  "suppliers.details.documentsDownload": "تنزيل",
  "suppliers.details.documentsPreview": "معاينة",
  "suppliers.details.documentsReplace": "استبدال",
  "suppliers.details.documentsCategory": "التصنيف",
  "suppliers.details.documentsUploadedBy": "رفع بواسطة",
  "suppliers.details.documentsSize": "الحجم",
  "suppliers.doc.commercialRegistration": "سجل تجاري",
  "suppliers.doc.taxRegistration": "بطاقة ضريبية",
  "suppliers.doc.agreement": "اتفاقية مورد",
  "suppliers.doc.bank": "مستندات بنكية",
  "suppliers.doc.certificate": "شهادة",
  "suppliers.doc.quotation": "عرض سعر",
  "suppliers.doc.other": "أخرى",
  "suppliers.doc.err.too-large": "الملف أكبر من 5 ميجابايت",
  "suppliers.doc.err.invalid-type": "نوع ملف غير مدعوم",
  "suppliers.doc.err.empty": "الملف فارغ",
  "suppliers.doc.err.storage-unavailable": "تخزين المستندات غير متاح",
  "suppliers.doc.err.write-failed": "تعذر حفظ الملف",
  "suppliers.doc.err.not-found": "المستند غير موجود",
  "suppliers.toast.docUploaded": "تم رفع المستند",
  "suppliers.toast.docRemoved": "تم حذف المستند",
  "suppliers.toast.docFailed": "فشل إجراء المستند",
  "suppliers.details.activity": "نشاط المورد",
  "suppliers.details.activityEmpty": "لا يوجد نشاط مسجّل بعد",
  "suppliers.details.activityTab": "النشاط والتدقيق",
  "suppliers.activity.filters": "تصفية النشاط",
  "suppliers.activity.filterAll": "الكل",
  "suppliers.activity.cat.profile": "الملف",
  "suppliers.activity.cat.status": "الحالة",
  "suppliers.activity.cat.document": "المستندات",
  "suppliers.activity.cat.order": "الأوامر",
  "suppliers.activity.cat.purchase": "المشتريات",
  "suppliers.activity.cat.payment": "المدفوعات",
  "suppliers.activity.create": "تم إنشاء المورد {code}",
  "suppliers.activity.update": "تم تحديث ملف المورد {code}",
  "suppliers.activity.activate": "تم تفعيل المورد {code}",
  "suppliers.activity.deactivate": "تم إيقاف المورد {code}",
  "suppliers.activity.deactivateHistory":
    "تم إيقاف المورد مع الإبقاء على السجل {code}",
  "suppliers.activity.delete": "تم حذف المورد {code}",
  "suppliers.activity.docUpload": "تم رفع مستند {fileName}",
  "suppliers.activity.docRemove": "تم حذف مستند {fileName}",
  "suppliers.activity.docReplace": "تم استبدال مستند {fileName}",
  "suppliers.activity.po": "أمر شراء {id}",
  "suppliers.activity.purchase": "مشتريات {id}",
  "suppliers.activity.payment": "دفعة {id}",
  "suppliers.activity.fieldsChanged": "الحقول المتغيرة: {fields}",
  "suppliers.activity.expectedDelivery": "التسليم المتوقع {date}",
  "suppliers.activity.actorDemo": "مستخدم تجريبي",
  "suppliers.activity.actorPurchasing": "مسؤول المشتريات",
  "suppliers.activity.actorFinance": "مسؤول المالية",
  "suppliers.activity.byActor": "بواسطة {actor}",
  "suppliers.activity.openRecord": "فتح السجل",
  "suppliers.activity.openRelated": "فتح المرتبط",
  "suppliers.activity.detailTitle": "تفاصيل النشاط",
  "suppliers.activity.userLabel": "المستخدم",
  "suppliers.activity.dateLabel": "التاريخ",
  "suppliers.activity.timeLabel": "الوقت",
  "suppliers.details.activityHint":
    "نشاط من جهة العميل فقط. ليس سجل تدقيق آمنًا على الخادم.",
  "suppliers.details.bankHint":
    "ضوابط الإظهار واجهة فقط ولا تُفرض صلاحيات خادم.",
  "suppliers.details.call": "اتصال",
  "suppliers.details.emailAction": "بريد",
  "suppliers.details.whatsappAction": "واتساب",
  "suppliers.details.openWebsite": "فتح الموقع",
  "suppliers.details.copyValue": "نسخ",
  "suppliers.details.copied": "تم النسخ",
  "suppliers.details.unavailableAction": "غير متاح",
  "suppliers.details.expectedDelivery": "التسليم المتوقع",
  "suppliers.details.currency": "العملة",
  "suppliers.details.method": "الطريقة",
  "suppliers.details.paymentStatus": "الحالة",
  "suppliers.details.goodsReceiptNote":
    "مستلم = استلام بضائع مسجّل في بيانات العرض. أمر الشراء وحده ليس إثبات استلام.",
  "suppliers.demo.ledgerBanner":
    "دفتر تجريبي — سجلات واجهة محاكاة وليست محاسبة معتمدة.",
  "suppliers.statement.search": "بحث بالمرجع أو الوصف…",
  "suppliers.statement.type": "النوع",
  "suppliers.statement.typeAll": "كل الحركات",
  "suppliers.statement.typeDebit": "مدين فقط",
  "suppliers.statement.typeCredit": "دائن فقط",
  "suppliers.statement.print": "طباعة",
  "suppliers.statement.export": "تصدير CSV",
  "suppliers.statement.empty": "لا توجد حركات مطابقة للفلاتر الحالية",
  "suppliers.doc.retry": "إعادة المحاولة",
  "suppliers.doc.uploading": "جاري الرفع…",
  "suppliers.doc.status.ready": "جاهز",
  "suppliers.doc.status.failed": "فشل",
  "suppliers.doc.status.pending": "بانتظار الحفظ",
  "suppliers.loading": "جاري تحميل الموردين…",
  "suppliers.pay.posted": "مرحّل",
  "suppliers.pay.pending": "معلّق",
  "suppliers.statusConfirm.titleActivate": "تفعيل المورد",
  "suppliers.statusConfirm.titleDeactivate": "تعطيل المورد",
  "suppliers.statusConfirm.bodyActivate":
    "سيظهر المورد كنشط في الدليل ويمكن استخدامه في المشتريات.",
  "suppliers.statusConfirm.bodyDeactivate":
    "سيُعلَّم المورد كغير نشط. يبقى السجل المرتبط متاحًا.",
  "suppliers.statusConfirm.confirmActivate": "تفعيل",
  "suppliers.statusConfirm.confirmDeactivate": "تعطيل",
  "suppliers.origin.seed": "تجريبي",
  "suppliers.origin.user": "محلي",
  "suppliers.filter.period": "الفترة",
  "suppliers.doc.confirmRemoveTitle": "إزالة المستند",
  "suppliers.doc.confirmRemoveBody":
    "سيُحذف الملف من مخزن المستندات المحلي لهذا المتصفح. لا يمكن التراجع.",
  "suppliers.doc.confirmRemove": "إزالة المستند",
  "suppliers.details.relatedActions": "مرتبط",
  "suppliers.col.code": "الكود",
  "suppliers.wizard.next": "متابعة",
  "suppliers.wizard.back": "رجوع",
  "suppliers.wizard.create": "إنشاء المورد",
  "suppliers.wizard.creating": "جاري الإنشاء…",
  "suppliers.wizard.saving": "جاري الحفظ…",
  "suppliers.wizard.saveChanges": "حفظ التغييرات",
  "suppliers.wizard.existingDocs": "المستندات الحالية",
  "suppliers.wizard.markRemove": "إزالة عند الحفظ",
  "suppliers.wizard.removePending": "سيتم إزالة {count} مستند عند الحفظ",
  "suppliers.wizard.openProfile": "فتح الملف",
  "suppliers.wizard.done": "تم",
  "suppliers.wizard.stepLabel": "الخطوة {current} من {total}",
  "suppliers.wizard.bankOptional": "بيانات البنك اختيارية ويمكن إضافتها لاحقًا.",
  "suppliers.remove.titleDelete": "حذف المورد",
  "suppliers.remove.titleDeactivate": "إلغاء تفعيل المورد",
  "suppliers.remove.bodyDelete": "هذا المورد بلا سجل مشتريات أو مدفوعات أو أوامر. الحذف النهائي لا يمكن التراجع عنه.",
  "suppliers.remove.bodyDeactivate": "لهذا المورد سجلات مرتبطة. سيتم إلغاء تفعيله مع الإبقاء على السجل. الحذف النهائي غير مسموح.",
  "suppliers.remove.confirmDelete": "حذف نهائي",
  "suppliers.remove.confirmDeactivate": "إلغاء التفعيل",
  "suppliers.toast.created": "تمت إضافة المورد",
  "suppliers.toast.updated": "تم تحديث المورد",
  "suppliers.toast.activated": "تم تفعيل المورد",
  "suppliers.toast.deactivated": "تم إلغاء تفعيل المورد",
  "suppliers.toast.deleted": "تم حذف المورد",
  "suppliers.toast.exported": "تم تنزيل التصدير",
  "suppliers.toast.error": "حدث خطأ",
  "suppliers.toast.persistError": "تعذر الحفظ في التخزين المحلي",
  "suppliers.pageSize": "الصفوف",
  "suppliers.pagination": "صفحة {page} من {pages}",
  "suppliers.pagination.prev": "الصفحة السابقة",
  "suppliers.pagination.next": "الصفحة التالية",
  "suppliers.pagination.first": "الصفحة الأولى",
  "suppliers.pagination.last": "الصفحة الأخيرة",
  "suppliers.selected": "{count} محدد",
  "suppliers.details.back": "العودة للموردين",
  "suppliers.details.notFound": "المورد غير موجود",
  "suppliers.details.overview": "نظرة عامة",
  "suppliers.details.contact": "بيانات الاتصال",
  "suppliers.details.commercial": "تجاري",
  "suppliers.details.bank": "الحسابات البنكية",
  "suppliers.details.orders": "أوامر الشراء",
  "suppliers.details.purchases": "المشتريات واستلام البضائع",
  "suppliers.details.payments": "المدفوعات",
  "suppliers.details.balance": "الرصيد الحالي",
  "suppliers.details.debit": "مدين",
  "suppliers.details.credit": "دائن",
  "suppliers.details.reference": "المرجع",
  "suppliers.details.statement": "كشف الحساب",
  "suppliers.details.history": "سجل الحركات",
  "suppliers.details.sectionReady": "القسم جاهز لسجلات لاحقة",
  "suppliers.details.taxId": "الرقم الضريبي",
  "suppliers.details.founded": "تأسست",
  "suppliers.details.website": "الموقع",
  "suppliers.details.notes": "ملاحظات",
  "suppliers.details.address": "العنوان",
  "suppliers.details.documents": "المستندات",
  "suppliers.details.items": "الأصناف المرتبطة",
  "suppliers.details.itemsEmpty": "لا توجد أصناف مرتبطة بهذا المورد.",
  "suppliers.details.itemsEmptyAction": "فتح دليل الأصناف",
  "suppliers.details.itemsLoading": "جاري تحميل الأصناف المرتبطة…",
  "suppliers.details.itemsError": "تعذر تحميل الأصناف المرتبطة.",
  "suppliers.details.itemsHint":
    "الروابط مخزّنة في هذا المتصفح فقط. الربط لا ينشئ أوامر شراء ولا يغيّر الأرصدة.",
  "suppliers.details.items.col.code": "كود الصنف",
  "suppliers.details.items.col.name": "اسم الصنف",
  "suppliers.details.items.col.type": "النوع",
  "suppliers.details.items.col.supplierItemCode": "كود الصنف لدى المورد",
  "suppliers.details.items.col.price": "سعر المورد",
  "suppliers.details.items.col.currency": "العملة",
  "suppliers.details.items.col.leadTime": "مدة التوريد",
  "suppliers.details.items.col.status": "حالة الرابط",
  "suppliers.details.items.viewItem": "عرض الصنف",
  "suppliers.details.items.missingItem": "سجل الصنف غير موجود",
  "suppliers.details.items.inactiveItem": "صنف غير نشط",
  "suppliers.details.documentsUnavailable":
    "تخزين المستندات غير متاح في هذه النسخة الأمامية.",
  "suppliers.details.newAction": "إجراء جديد",
  "suppliers.details.moreActions": "المزيد",
  "suppliers.details.importShipments": "شحنات الاستيراد",
  "suppliers.details.importCosts": "تكاليف الاستيراد",
  "suppliers.chart.purchasesPayments": "المشتريات والمدفوعات",
  "suppliers.chart.12months": "آخر 12 شهرًا",
  "suppliers.chart.byCategory": "توزيع المشتريات حسب التصنيف",
  "suppliers.chart.poStatus": "حالة أوامر الشراء",
  "suppliers.chart.poTotal": "إجمالي الأوامر",
  "suppliers.recent.orders": "أحدث أوامر الشراء",
  "suppliers.recent.purchases": "أحدث المشتريات",
  "suppliers.recent.payments": "أحدث المدفوعات",
  "suppliers.recent.id": "الرقم",
  "suppliers.recent.viewAll": "عرض الكل",
  "suppliers.po.open": "مفتوح",
  "suppliers.po.inProgress": "قيد التنفيذ",
  "suppliers.po.partial": "استلام جزئي",
  "suppliers.po.completed": "مكتمل",
  "suppliers.purchase.received": "مستلم",
  "suppliers.purchase.pending": "معلق",
  "suppliers.pay.bankTransfer": "تحويل بنكي",
  "suppliers.pay.swift": "SWIFT",
  "suppliers.pay.cash": "نقدي",
  "suppliers.master.title": "بيانات المورد الأساسية",
  "suppliers.master.type": "النوع",
  "suppliers.master.typeManufacturer": "شركة تصنيع",
  "suppliers.preview.contact": "التواصل",
  "suppliers.preview.fullProfile": "عرض الملف الكامل",
  "suppliers.preview.more": "المزيد",
  "suppliers.preview.message": "إرسال رسالة",
  "suppliers.preview.messageSoon": "المراسلة ستكون متاحة عند ربط الخادم.",
  "suppliers.sort.nameAsc": "الاسم أ–ي",
  "suppliers.sort.nameDesc": "الاسم ي–أ",
  "suppliers.sort.balanceDesc": "أعلى رصيد",
  "suppliers.sort.purchasesDesc": "أعلى مشتريات",
  "suppliers.sort.lastTxDesc": "أحدث نشاط",
  "suppliers.sort.label": "ترتيب",
};

const dictionaries: Record<Locale, Record<SupplierKey, string>> = { en, ar };

export function ts(locale: Locale, key: SupplierKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export function tsCount(
  locale: Locale,
  key: Extract<
    SupplierKey,
    | "suppliers.resultCount"
    | "suppliers.selected"
    | "suppliers.pagination"
    | "suppliers.showingRange"
    | "suppliers.wizard.stepLabel"
    | "suppliers.wizard.docsCount"
    | "suppliers.wizard.removePending"
  >,
  vars: Record<string, string | number>,
): string {
  let out = ts(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(`{${k}}`, String(v));
  }
  return out;
}
