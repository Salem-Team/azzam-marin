import type { Locale } from "@/types/i18n";

export type CatalogKey =
  | "catalog.designNotice"
  | "catalog.designNoticeHint"
  | "catalog.demoData"
  | "catalog.compatDemo"
  | "catalog.compatUnverified"
  | "catalog.search"
  | "catalog.filters"
  | "catalog.applyFilters"
  | "catalog.clearFilters"
  | "catalog.resultCount"
  | "catalog.showingRange"
  | "catalog.sort"
  | "catalog.actions"
  | "catalog.action.view"
  | "catalog.action.edit"
  | "catalog.action.delete"
  | "catalog.action.add"
  | "catalog.openRecord"
  | "catalog.empty"
  | "catalog.emptyFiltered"
  | "catalog.pagination"
  | "catalog.pageSize"
  | "catalog.first"
  | "catalog.prev"
  | "catalog.next"
  | "catalog.last"
  | "catalog.filter.all"
  | "catalog.filter.manufacturer"
  | "catalog.col.actions"
  | "catalog.col.index"
  | "catalog.price.cost"
  | "catalog.price.sell"
  | "catalog.linkedItem"
  | "catalog.openItem"
  | "catalog.openSpare"
  | "catalog.openEngine"
  | "catalog.noLink"
  | "catalog.form.designOnly"
  | "catalog.form.close"
  | "catalog.importSoon"
  | "catalog.exportSoon"
  | "items.title"
  | "items.subtitle"
  | "items.add"
  | "items.import"
  | "items.export"
  | "items.exportSuccess"
  | "items.selected"
  | "items.bulk.deactivate"
  | "items.bulk.activate"
  | "items.bulk.clear"
  | "items.bulk.deactivateTitle"
  | "items.bulk.activateTitle"
  | "items.bulk.deactivateBody"
  | "items.bulk.activateBody"
  | "items.bulk.success"
  | "items.searchPlaceholder"
  | "items.searchAction"
  | "items.kpi.total"
  | "items.kpi.operating"
  | "items.kpi.other"
  | "items.kpi.raw"
  | "items.kpi.inactive"
  | "items.col.select"
  | "items.col.image"
  | "items.col.name"
  | "items.col.nameEn"
  | "items.col.nameAr"
  | "items.col.code"
  | "items.col.type"
  | "items.col.category"
  | "items.col.subCategory"
  | "items.col.manufacturer"
  | "items.col.origin"
  | "items.col.oem"
  | "items.col.part"
  | "items.col.uom"
  | "items.col.barcode"
  | "items.col.serial"
  | "items.col.cost"
  | "items.col.costUsd"
  | "items.col.costEgp"
  | "items.col.sell"
  | "items.col.sellUsd"
  | "items.col.sellEgp"
  | "items.col.margin"
  | "items.col.fxRate"
  | "items.col.fxSource"
  | "items.col.priceUpdated"
  | "items.col.status"
  | "items.col.stock"
  | "items.col.minStock"
  | "items.col.description"
  | "items.filter.type"
  | "items.filter.category"
  | "items.filter.status"
  | "items.filter.origin"
  | "items.filter.uom"
  | "items.filter.stockLevel"
  | "items.filter.priceRange"
  | "items.filter.priceFrom"
  | "items.filter.priceTo"
  | "items.filters.title"
  | "items.filters.section.classify"
  | "items.filters.section.source"
  | "items.filters.section.status"
  | "items.filters.section.price"
  | "items.filter.period"
  | "items.stockLevel.all"
  | "items.stockLevel.below_min"
  | "items.stockLevel.ok"
  | "items.stockLevel.out"
  | "items.sort.codeAsc"
  | "items.sort.codeDesc"
  | "items.sort.nameAsc"
  | "items.sort.nameDesc"
  | "items.sort.updatedDesc"
  | "items.type.operating_supplies"
  | "items.type.raw_materials"
  | "items.type.other_materials"
  | "items.type.spare_part"
  | "items.type.marine_engine"
  | "items.type.uncategorized"
  | "items.category.oils_supplies"
  | "items.category.electrical"
  | "items.category.rigging"
  | "items.category.cooling_fluids"
  | "items.category.coatings"
  | "items.category.hardware"
  | "items.category.hoses"
  | "items.category.sealing"
  | "items.category.engine_units"
  | "items.category.other"
  | "items.category.uncategorized"
  | "items.status.active"
  | "items.status.inactive"
  | "items.status.discontinued"
  | "items.fx.system"
  | "items.fx.manual"
  | "items.fx.bank"
  | "items.fx.custom"
  | "items.details"
  | "items.notFound"
  | "items.backToList"
  | "items.section.identity"
  | "items.section.commercial"
  | "items.section.stock"
  | "items.section.links"
  | "items.relatedSpare"
  | "items.relatedEngine"
  | "items.serialTracked"
  | "items.serialNotTracked"
  | "items.form.addTitle"
  | "items.form.tab.basic"
  | "items.form.tab.identity"
  | "items.form.tab.inventory"
  | "items.form.tab.pricing"
  | "items.form.image"
  | "items.form.imageAdd"
  | "items.form.imageHint"
  | "items.form.originSearch"
  | "items.form.barcodeHint"
  | "items.form.barcodeGenerate"
  | "items.form.barcodePlaceholder"
  | "items.form.save"
  | "items.form.cancel"
  | "items.form.activeToggle"
  | "items.form.required"
  | "items.form.invalidCode"
  | "items.form.duplicateCode"
  | "items.form.invalidNumber"
  | "items.form.editTitle"
  | "items.form.saveSuccess"
  | "items.form.saveError"
  | "items.form.imageSavePartial"
  | "items.form.priceHistory"
  | "items.form.priceHistoryHint"
  | "items.loading"
  | "items.edit"
  | "items.deactivate"
  | "items.activate"
  | "items.delete"
  | "items.deleteConfirm.title"
  | "items.deleteConfirm.body"
  | "items.deleteConfirm.confirm"
  | "items.deleteSuccess"
  | "items.statusConfirm.titleActivate"
  | "items.statusConfirm.titleDeactivate"
  | "items.statusConfirm.bodyActivate"
  | "items.statusConfirm.bodyDeactivate"
  | "items.statusConfirm.confirmActivate"
  | "items.statusConfirm.confirmDeactivate"
  | "items.tab.overview"
  | "items.tab.basic"
  | "items.tab.identity"
  | "items.tab.pricing"
  | "items.tab.inventory"
  | "items.tab.suppliers"
  | "items.tab.attachments"
  | "items.tab.activity"
  | "items.actions"
  | "items.header.availableQty"
  | "items.header.minStock"
  | "items.pricing.currencyEgp"
  | "items.pricing.currencyUsd"
  | "items.suppliers.title"
  | "items.suppliers.unavailable"
  | "items.suppliers.openModule"
  | "items.suppliers.col.name"
  | "items.suppliers.col.code"
  | "items.suppliers.col.supplierItemCode"
  | "items.suppliers.col.price"
  | "items.suppliers.col.currency"
  | "items.suppliers.col.leadTime"
  | "items.suppliers.col.moq"
  | "items.suppliers.col.status"
  | "items.suppliers.col.actions"
  | "items.suppliers.col.lastPurchase"
  | "items.suppliers.add"
  | "items.suppliers.edit"
  | "items.suppliers.remove"
  | "items.suppliers.view"
  | "items.suppliers.empty"
  | "items.suppliers.emptyAction"
  | "items.suppliers.pickFromDirectory"
  | "items.suppliers.directoryCount"
  | "items.suppliers.noDirectoryMatch"
  | "items.suppliers.loading"
  | "items.suppliers.error"
  | "items.suppliers.inactiveBadge"
  | "items.suppliers.missingSupplier"
  | "items.suppliers.days"
  | "items.link.titleAdd"
  | "items.link.titleEdit"
  | "items.link.save"
  | "items.link.cancel"
  | "items.link.searchSupplier"
  | "items.link.searchPlaceholder"
  | "items.link.noSuppliers"
  | "items.link.supplierItemCode"
  | "items.link.purchasePrice"
  | "items.link.currency"
  | "items.link.leadTimeDays"
  | "items.link.moq"
  | "items.link.notes"
  | "items.link.status"
  | "items.link.status.active"
  | "items.link.status.inactive"
  | "items.link.required"
  | "items.link.duplicate"
  | "items.link.unknownSupplier"
  | "items.link.unknownItem"
  | "items.link.unknownLink"
  | "items.link.inactiveSupplier"
  | "items.link.invalidNumber"
  | "items.link.invalidInteger"
  | "items.link.currencyRequired"
  | "items.link.priceRequiredWithCurrency"
  | "items.link.saveSuccess"
  | "items.link.saveError"
  | "items.link.removeTitle"
  | "items.link.removeBody"
  | "items.link.removeConfirm"
  | "items.link.removeSuccess"
  | "items.link.priceNote"
  | "items.link.selectSupplier"
  | "items.attachments.title"
  | "items.attachments.empty"
  | "items.attachments.galleryEmpty"
  | "items.attachments.uploadUnavailable"
  | "items.attachments.choose"
  | "items.attachments.replace"
  | "items.attachments.remove"
  | "items.attachments.localNote"
  | "items.attachments.error.tooLarge"
  | "items.attachments.error.invalidType"
  | "items.attachments.error.storage"
  | "items.attachments.success"
  | "items.attachments.removed"
  | "items.col.relatedEngineType"
  | "items.overview.features"
  | "items.overview.usage"
  | "items.overview.featuresEmpty"
  | "items.overview.usageEmpty"
  | "items.overview.descriptionEmpty"
  | "items.inventory.available"
  | "items.inventory.total"
  | "items.inventory.reserved"
  | "items.inventory.viewDetails"
  | "items.inventory.demoNote"
  | "items.gallery.noImage"
  | "items.overview.description"
  | "items.overview.quickInfo"
  | "items.overview.featuresUnavailable"
  | "items.inventory.liveUnavailable"
  | "items.inventory.minThreshold"
  | "items.inventory.demoOnHand"
  | "items.inventory.linkModule"
  | "items.activity.localNote"
  | "items.activity.empty"
  | "items.pricing.historyEmpty"
  | "items.pricing.noAutoFx"
  | "items.sort.label"
  | "items.createdAt"
  | "items.updatedAt"
  | "items.wizard.step1"
  | "items.wizard.step2"
  | "items.wizard.step3"
  | "items.wizard.step4"
  | "items.wizard.step5"
  | "items.wizard.stepLabel"
  | "items.wizard.next"
  | "items.wizard.back"
  | "items.wizard.unsaved"
  | "items.wizard.keepEditing"
  | "items.wizard.discard"
  | "items.wizard.codeAuto"
  | "items.wizard.stockHint"
  | "items.wizard.editStep"
  | "spare.title"
  | "spare.add"
  | "spare.import"
  | "spare.importUnavailable"
  | "spare.searchPlaceholder"
  | "spare.kpi.total"
  | "spare.kpi.active"
  | "spare.kpi.lowStock"
  | "spare.kpi.uncategorized"
  | "spare.kpi.inactive"
  | "spare.col.part"
  | "spare.col.oem"
  | "spare.col.mpn"
  | "spare.col.category"
  | "spare.col.manufacturer"
  | "spare.col.origin"
  | "spare.col.item"
  | "spare.col.engines"
  | "spare.col.alts"
  | "spare.col.availability"
  | "spare.col.price"
  | "spare.col.xrefs"
  | "spare.filter.category"
  | "spare.filter.subCategory"
  | "spare.filter.engine"
  | "spare.filter.status"
  | "spare.filter.stock"
  | "spare.filter.uom"
  | "spare.filter.origin"
  | "spare.filter.priceMin"
  | "spare.filter.priceMax"
  | "spare.filter.reset"
  | "spare.filter.advanced"
  | "spare.sort.partAsc"
  | "spare.sort.partDesc"
  | "spare.sort.oemAsc"
  | "spare.sort.manufacturerAsc"
  | "spare.sort.updatedDesc"
  | "spare.sort.nameAsc"
  | "spare.sort.priceAsc"
  | "spare.sort.priceDesc"
  | "spare.category.all"
  | "spare.category.filters"
  | "spare.category.engine_parts"
  | "spare.category.electrical"
  | "spare.category.cooling"
  | "spare.category.fuel"
  | "spare.category.other"
  | "spare.view.grid"
  | "spare.view.list"
  | "spare.badge.active"
  | "spare.badge.inactive"
  | "spare.badge.lowStock"
  | "spare.badge.outOfStock"
  | "spare.stock.inStock"
  | "spare.stock.outOfStock"
  | "spare.stock.demoHint"
  | "spare.action.compat"
  | "spare.action.editItem"
  | "spare.details"
  | "spare.notFound"
  | "spare.backToList"
  | "spare.loading"
  | "spare.edit"
  | "spare.actions"
  | "spare.openStock"
  | "spare.openItem"
  | "spare.copied"
  | "spare.specialized"
  | "spare.tab.overview"
  | "spare.tab.inventory"
  | "spare.tab.pricing"
  | "spare.tab.engines"
  | "spare.tab.alternatives"
  | "spare.tab.crossRef"
  | "spare.tab.suppliers"
  | "spare.tab.attachments"
  | "spare.tab.activity"
  | "spare.section.identity"
  | "spare.section.crossRef"
  | "spare.section.engines"
  | "spare.section.item"
  | "spare.section.pricing"
  | "spare.section.quickInfo"
  | "spare.section.description"
  | "spare.section.warehouseStock"
  | "spare.section.movements"
  | "spare.section.priceSummary"
  | "spare.section.stockSummary"
  | "spare.currentBalance"
  | "spare.minLevel"
  | "spare.col.engineType"
  | "spare.col.mainCategory"
  | "spare.col.subCategory"
  | "spare.warehouseEmpty"
  | "spare.movementsEmpty"
  | "spare.demoWarehouseNote"
  | "spare.movement.date"
  | "spare.movement.type"
  | "spare.movement.qty"
  | "spare.movement.ref"
  | "spare.movement.warehouse"
  | "spare.movement.receipt"
  | "spare.movement.issue"
  | "spare.movement.transfer_out"
  | "spare.movement.transfer_in"
  | "spare.movement.adjustment"
  | "spare.alternatives"
  | "spare.compatibleEngines"
  | "spare.noEngines"
  | "spare.noAlternatives"
  | "spare.form.addTitle"
  | "spare.form.editTitle"
  | "spare.form.addHint"
  | "spare.form.save"
  | "spare.form.saving"
  | "spare.form.saveSuccess"
  | "spare.form.saveError"
  | "spare.form.duplicatePart"
  | "spare.form.selectItem"
  | "spare.form.searchItems"
  | "spare.form.noItems"
  | "spare.form.newItemCode"
  | "spare.form.sectionIdentity"
  | "spare.form.sectionCatalog"
  | "spare.form.sectionCompat"
  | "spare.form.crossRefHint"
  | "spare.form.enginesHint"
  | "spare.form.altsHint"
  | "spare.wizard.step1"
  | "spare.wizard.step2"
  | "spare.wizard.step3"
  | "spare.wizard.step4"
  | "spare.wizard.step5"
  | "spare.wizard.stepLabel"
  | "spare.wizard.next"
  | "spare.wizard.back"
  | "spare.wizard.create"
  | "spare.wizard.saveChanges"
  | "spare.wizard.done"
  | "spare.wizard.openRecord"
  | "spare.wizard.compatOptional"
  | "spare.wizard.classifyHint"
  | "spare.wizard.enginesSelected"
  | "spare.wizard.altsSelected"
  | "spare.wizard.reviewHint"
  | "spare.delete"
  | "spare.deleteConfirm.title"
  | "spare.deleteConfirm.body"
  | "spare.deleteConfirm.confirm"
  | "spare.deleteSuccess"
  | "engines.title"
  | "engines.subtitle"
  | "engines.add"
  | "engines.searchPlaceholder"
  | "engines.searchAction"
  | "engines.kpi.total"
  | "engines.kpi.active"
  | "engines.kpi.manufacturers"
  | "engines.kpi.withParts"
  | "engines.kpi.withItem"
  | "engines.kpi.avgHp"
  | "engines.kpi.unlinked"
  | "engines.col.image"
  | "engines.col.manufacturer"
  | "engines.col.model"
  | "engines.col.year"
  | "engines.col.hp"
  | "engines.col.serial"
  | "engines.col.origin"
  | "engines.col.item"
  | "engines.col.parts"
  | "engines.col.status"
  | "engines.filter.yearFrom"
  | "engines.filter.yearTo"
  | "engines.filter.hpFrom"
  | "engines.filter.hpTo"
  | "engines.filter.linkStatus"
  | "engines.filter.linkLinked"
  | "engines.filter.linkUnlinked"
  | "engines.sort.modelAsc"
  | "engines.sort.modelDesc"
  | "engines.sort.hpDesc"
  | "engines.sort.yearDesc"
  | "engines.sort.manufacturerAsc"
  | "engines.details"
  | "engines.notFound"
  | "engines.backToList"
  | "engines.tab.overview"
  | "engines.tab.parts"
  | "engines.tab.alternatives"
  | "engines.tab.sales"
  | "engines.tab.documents"
  | "engines.tab.activity"
  | "engines.section.identity"
  | "engines.section.specs"
  | "engines.section.parts"
  | "engines.section.item"
  | "engines.section.description"
  | "engines.section.additional"
  | "engines.section.summary"
  | "engines.section.alternatives"
  | "engines.compatibleParts"
  | "engines.noParts"
  | "engines.noAlternatives"
  | "engines.docsEmpty"
  | "engines.specsEmpty"
  | "engines.descEmpty"
  | "engines.meta.created"
  | "engines.meta.updated"
  | "engines.meta.added"
  | "engines.detail.kpi.hp"
  | "engines.detail.kpi.year"
  | "engines.detail.kpi.sales"
  | "engines.detail.kpi.parts"
  | "engines.detail.edit"
  | "engines.detail.otherActions"
  | "engines.detail.manageLinks"
  | "engines.detail.copySerial"
  | "engines.detail.stock"
  | "engines.detail.salesUnavailable"
  | "engines.activity.localNote"
  | "engines.activity.empty"
  | "engines.statusConfirm.titleActivate"
  | "engines.statusConfirm.titleDeactivate"
  | "engines.statusConfirm.bodyActivate"
  | "engines.statusConfirm.bodyDeactivate"
  | "engines.statusConfirm.confirmActivate"
  | "engines.statusConfirm.confirmDeactivate"
  | "engines.hpUnit"
  | "engines.form.addTitle"
  | "engines.form.editTitle"
  | "engines.form.create"
  | "engines.form.save"
  | "engines.form.notes"
  | "engines.form.description"
  | "engines.form.stepLabel"
  | "engines.form.step.identity"
  | "engines.form.step.classify"
  | "engines.form.step.parts"
  | "engines.form.step.review"
  | "engines.form.hint.identity"
  | "engines.form.hint.classify"
  | "engines.form.hint.parts"
  | "engines.form.hint.review"
  | "engines.form.tab.basic"
  | "engines.form.tab.parts"
  | "engines.form.tab.more"
  | "engines.form.partsSearch"
  | "engines.form.partsEmpty"
  | "engines.form.partsSelected"
  | "engines.form.partsSelectedCount"
  | "engines.form.removePart"
  | "engines.form.imageHint"
  | "engines.form.duplicateSerial"
  | "engines.form.invalidYear"
  | "engines.form.persistFailed"
  | "engines.form.saveFailed"
  | "engines.form.saveSuccess"
  | "engines.form.openRecord"
  | "engines.form.unsavedTitle"
  | "engines.form.unsavedBody"
  | "engines.form.discard"
  | "engines.form.keepEditing"
  | "engines.deactivate"
  | "engines.activate"
  | "engines.deactivateSuccess"
  | "engines.activateSuccess"
  | "engines.delete"
  | "engines.deleteSuccess"
  | "engines.deleteConfirm.title"
  | "engines.deleteConfirm.body"
  | "engines.deleteConfirm.confirm"
  | "engines.section.sales"
  | "engines.salesEmpty"
  | "engines.export"
  | "engines.exportSuccess"
  | "engines.import"
  | "engines.importSoon"
  | "spare.compat.degree"
  | "spare.compat.degree.exact"
  | "spare.compat.degree.high"
  | "spare.compat.degree.partial"
  | "spare.compat.degree.functional"
  | "spare.compat.notes"
  | "xref.title"
  | "xref.subtitle"
  | "xref.add"
  | "xref.edit"
  | "xref.remove"
  | "xref.import"
  | "xref.export"
  | "xref.importSoon"
  | "xref.import.help"
  | "xref.import.template"
  | "xref.import.chooseFile"
  | "xref.import.total"
  | "xref.import.valid"
  | "xref.import.invalid"
  | "xref.import.duplicates"
  | "xref.import.missingParts"
  | "xref.import.downloadReport"
  | "xref.import.confirm"
  | "xref.import.commit"
  | "xref.import.summary"
  | "xref.import.parseError"
  | "xref.import.commitError"
  | "xref.searchPlaceholder"
  | "xref.resetFilters"
  | "xref.col.refType"
  | "xref.col.refValue"
  | "xref.refType.oem"
  | "xref.refType.part_number"
  | "xref.refType.mpn"
  | "xref.refType.alternative"
  | "xref.refType.compatible"
  | "xref.kpi.relationships"
  | "xref.kpi.withAlternatives"
  | "xref.kpi.multiRef"
  | "xref.kpi.needsReview"
  | "xref.kpi.originals"
  | "xref.kpi.withCodes"
  | "xref.kpi.exact"
  | "xref.col.original"
  | "xref.col.alternative"
  | "xref.col.degree"
  | "xref.col.notes"
  | "xref.col.oem"
  | "xref.col.altOem"
  | "xref.col.mpn"
  | "xref.col.item"
  | "xref.col.codes"
  | "xref.kind.alternative"
  | "xref.kind.compatible"
  | "xref.sort.originalAsc"
  | "xref.sort.originalDesc"
  | "xref.sort.altAsc"
  | "xref.sort.degreeAsc"
  | "xref.sort.updatedDesc"
  | "xref.empty"
  | "xref.emptyFiltered"
  | "xref.form.createTitle"
  | "xref.form.editTitle"
  | "xref.form.tab.basic"
  | "xref.form.tab.extra"
  | "xref.form.original"
  | "xref.form.alternative"
  | "xref.form.degree"
  | "xref.form.relationshipType"
  | "xref.form.notes"
  | "xref.form.codes"
  | "xref.form.codesHint"
  | "xref.form.pickPart"
  | "xref.form.searchParts"
  | "xref.form.noParts"
  | "xref.form.save"
  | "xref.form.saved"
  | "xref.form.error.self"
  | "xref.form.error.duplicate"
  | "xref.form.error.missing"
  | "xref.form.error.generic"
  | "xref.wizard.step1"
  | "xref.wizard.step2"
  | "xref.wizard.step3"
  | "xref.wizard.step4"
  | "xref.wizard.stepLabel"
  | "xref.wizard.step1Hint"
  | "xref.wizard.step2Hint"
  | "xref.wizard.step3Hint"
  | "xref.wizard.reviewHint"
  | "xref.wizard.next"
  | "xref.wizard.back"
  | "xref.wizard.create"
  | "xref.wizard.saveChanges"
  | "xref.wizard.saving"
  | "xref.wizard.done"
  | "xref.wizard.unsaved"
  | "xref.removeTitle"
  | "xref.removeBody"
  | "xref.removeConfirm"
  | "xref.removeSuccess"
  | "xref.overview"
  | "xref.detailTitle"
  | "xref.detail.updated"
  | "xref.openSpare"
  | "xref.selectOriginal";

const en: Record<CatalogKey, string> = {
  "catalog.designNotice": "Design preview",
  "catalog.designNoticeHint":
    "UI/UX only — save, import, export, and pricing calculations are not connected.",
  "catalog.demoData": "Demo presentation data",
  "catalog.compatDemo": "Demo compatibility",
  "catalog.compatUnverified":
    "Compatibility shown from demo links — not verified operational data.",
  "catalog.search": "Search",
  "catalog.filters": "Filters",
  "catalog.applyFilters": "Apply filters",
  "catalog.clearFilters": "Clear filters",
  "catalog.resultCount": "{count} results",
  "catalog.showingRange": "Showing {from}–{to} of {total}",
  "catalog.sort": "Sort",
  "catalog.actions": "Actions",
  "catalog.action.view": "View",
  "catalog.action.edit": "Edit",
  "catalog.action.delete": "Delete",
  "catalog.action.add": "Add",
  "catalog.openRecord": "Open record",
  "catalog.empty": "No records in this demo catalog.",
  "catalog.emptyFiltered": "No records match the current filters.",
  "catalog.pagination": "Pagination",
  "catalog.pageSize": "Rows",
  "catalog.first": "First",
  "catalog.prev": "Previous",
  "catalog.next": "Next",
  "catalog.last": "Last",
  "catalog.filter.all": "All",
  "catalog.filter.manufacturer": "Manufacturer",
  "catalog.col.actions": "Actions",
  "catalog.col.index": "#",
  "catalog.price.cost": "Cost",
  "catalog.price.sell": "Sell",
  "catalog.linkedItem": "Base item",
  "catalog.openItem": "Open item",
  "catalog.openSpare": "Open spare part",
  "catalog.openEngine": "Open engine",
  "catalog.noLink": "No linked record",
  "catalog.form.designOnly":
    "Design shell only — save is not connected.",
  "catalog.form.close": "Close",
  "catalog.importSoon":
    "CSV import requires a backend sync service and is not available in this browser-local frontend.",
  "catalog.exportSoon": "Export is a visual control in this design phase.",

  "items.title": "Items",
  "items.subtitle": "Manage the company’s general item and product catalog",
  "items.add": "Add new item",
  "items.import": "Import",
  "items.export": "Export CSV",
  "items.exportSuccess": "Items CSV downloaded (browser-local).",
  "items.selected": "{count} selected",
  "items.bulk.deactivate": "Deactivate selected",
  "items.bulk.activate": "Activate selected",
  "items.bulk.clear": "Clear selection",
  "items.bulk.deactivateTitle": "Deactivate selected items?",
  "items.bulk.activateTitle": "Activate selected items?",
  "items.bulk.deactivateBody":
    "Selected items will be marked inactive. Supplier links and local history are preserved.",
  "items.bulk.activateBody":
    "Selected items will be marked active again. Supplier links and local history are preserved.",
  "items.bulk.success": "{count} items updated.",
  "items.searchPlaceholder":
    "Name, SKU, Part Number, OEM, barcode, serial…",
  "items.searchAction": "Search",
  "items.kpi.total": "Total items",
  "items.kpi.operating": "Operating supplies",
  "items.kpi.other": "Other materials",
  "items.kpi.raw": "Raw materials",
  "items.kpi.inactive": "Inactive items",
  "items.col.select": "Select",
  "items.col.image": "Image",
  "items.col.name": "Item",
  "items.col.nameEn": "English name",
  "items.col.nameAr": "Arabic name",
  "items.col.code": "SKU",
  "items.col.type": "Item type",
  "items.col.category": "Main category",
  "items.col.subCategory": "Sub-category",
  "items.col.manufacturer": "Manufacturer",
  "items.col.origin": "Country of origin",
  "items.col.oem": "OEM number",
  "items.col.part": "Part number",
  "items.col.uom": "UoM",
  "items.col.barcode": "Barcode",
  "items.col.serial": "Serial",
  "items.col.cost": "Cost",
  "items.col.costUsd": "Purchase cost (USD)",
  "items.col.costEgp": "Purchase cost (EGP)",
  "items.col.sell": "Sell price",
  "items.col.sellUsd": "Sell price (USD)",
  "items.col.sellEgp": "Sell price (EGP)",
  "items.col.margin": "Target margin %",
  "items.col.fxRate": "Exchange rate used",
  "items.col.fxSource": "FX source / type",
  "items.col.priceUpdated": "Last price update",
  "items.col.status": "Status",
  "items.col.stock": "On hand",
  "items.col.minStock": "Min. stock",
  "items.col.description": "Description",
  "items.filter.type": "Item type",
  "items.filter.category": "Main category",
  "items.filter.status": "Item status",
  "items.filter.origin": "Country of origin",
  "items.filter.uom": "Unit of measure",
  "items.filter.stockLevel": "Min-stock status",
  "items.filter.priceRange": "Sell price (EGP)",
  "items.filter.priceFrom": "From",
  "items.filter.priceTo": "To",
  "items.filters.title": "Item filters",
  "items.filters.section.classify": "Classification",
  "items.filters.section.source": "Manufacturer & origin",
  "items.filters.section.status": "Status & measure",
  "items.filters.section.price": "Sell price (EGP)",
  "items.filter.period": "Date period",
  "items.stockLevel.all": "All",
  "items.stockLevel.below_min": "Below minimum",
  "items.stockLevel.ok": "At / above minimum",
  "items.stockLevel.out": "Out of stock",
  "items.sort.codeAsc": "SKU A–Z",
  "items.sort.codeDesc": "SKU Z–A",
  "items.sort.nameAsc": "Name A–Z",
  "items.sort.nameDesc": "Name Z–A",
  "items.sort.updatedDesc": "Recently updated",
  "items.type.operating_supplies": "Operating supplies",
  "items.type.raw_materials": "Raw materials",
  "items.type.other_materials": "Other materials",
  "items.type.spare_part": "Spare part",
  "items.type.marine_engine": "Marine engine",
  "items.type.uncategorized": "Uncategorized",
  "items.category.oils_supplies": "Oils & supplies",
  "items.category.electrical": "Electrical",
  "items.category.rigging": "Rigging",
  "items.category.cooling_fluids": "Cooling fluids",
  "items.category.coatings": "Coatings",
  "items.category.hardware": "Hardware",
  "items.category.hoses": "Hoses",
  "items.category.sealing": "Sealing",
  "items.category.engine_units": "Engine units",
  "items.category.other": "Other",
  "items.category.uncategorized": "Uncategorized",
  "items.status.active": "Active",
  "items.status.inactive": "Inactive",
  "items.status.discontinued": "Discontinued",
  "items.fx.system": "System rate",
  "items.fx.manual": "Manual",
  "items.fx.bank": "Bank rate",
  "items.fx.custom": "Custom",
  "items.details": "Item details",
  "items.notFound": "Item not found",
  "items.backToList": "Back to items list",
  "items.section.identity": "Identity",
  "items.section.commercial": "Pricing",
  "items.section.stock": "Stock summary",
  "items.section.links": "Related records",
  "items.relatedSpare": "Spare part view",
  "items.relatedEngine": "Engine record",
  "items.col.relatedEngineType": "Related engine type",
  "items.serialTracked": "Serial tracked",
  "items.serialNotTracked": "Not serial tracked",
  "items.form.addTitle": "Add new item",
  "items.form.tab.basic": "Basic data",
  "items.form.tab.identity": "Identity & measure",
  "items.form.tab.inventory": "Inventory",
  "items.form.tab.pricing": "Pricing",
  "items.form.image": "Item image",
  "items.form.imageAdd": "Add item image",
  "items.form.imageHint":
    "Optional PNG, JPG, or WebP (max 2 MB, browser-local).",
  "items.form.originSearch": "Search country name or code…",
  "items.form.barcodeHint":
    "Filled automatically. USB scan works here; icon regenerates.",
  "items.form.barcodeGenerate": "Generate barcode",
  "items.form.barcodePlaceholder": "Scan or auto-generate",
  "items.form.save": "Save item",
  "items.form.cancel": "Cancel",
  "items.form.activeToggle": "Active",
  "items.form.required": "Required",
  "items.form.invalidCode": "Use format ITM-XXXX",
  "items.form.duplicateCode": "Item code already exists",
  "items.form.invalidNumber": "Enter a valid non-negative number",
  "items.form.editTitle": "Edit item",
  "items.form.saveSuccess": "Item saved",
  "items.form.saveError": "Could not save item",
  "items.form.imageSavePartial":
    "Item saved. The image could not be stored — add it from the Attachments tab.",
  "items.form.priceHistory": "Price history",
  "items.form.priceHistoryHint":
    "Local snapshots from this session store. Not a server audit or FX engine.",
  "items.loading": "Loading item…",
  "items.edit": "Edit item",
  "items.deactivate": "Deactivate",
  "items.activate": "Activate",
  "items.delete": "Delete item",
  "items.deleteConfirm.title": "Delete item?",
  "items.deleteConfirm.body":
    "This permanently removes the item from the local catalog, including supplier links and the primary image. This cannot be undone.",
  "items.deleteConfirm.confirm": "Delete permanently",
  "items.deleteSuccess": "Item deleted",
  "items.statusConfirm.titleActivate": "Activate item?",
  "items.statusConfirm.titleDeactivate": "Deactivate item?",
  "items.statusConfirm.bodyActivate":
    "The item will become available for operational use. History is kept.",
  "items.statusConfirm.bodyDeactivate":
    "The item will be marked inactive. Master data and history are preserved.",
  "items.statusConfirm.confirmActivate": "Activate",
  "items.statusConfirm.confirmDeactivate": "Deactivate",
  "items.tab.overview": "Overview",
  "items.tab.basic": "Basic data",
  "items.tab.identity": "Identification & units",
  "items.tab.pricing": "Pricing",
  "items.tab.inventory": "Inventory",
  "items.tab.suppliers": "Suppliers",
  "items.tab.attachments": "Files & images",
  "items.tab.activity": "Activity log",
  "items.actions": "Actions",
  "items.header.availableQty": "Available qty",
  "items.header.minStock": "Min. stock",
  "items.pricing.currencyEgp": "EGP",
  "items.pricing.currencyUsd": "USD",
  "items.suppliers.title": "Linked suppliers",
  "items.suppliers.unavailable":
    "No suppliers linked to this item yet.",
  "items.suppliers.openModule": "Open suppliers directory",
  "items.suppliers.col.name": "Supplier",
  "items.suppliers.col.code": "Code",
  "items.suppliers.col.supplierItemCode": "Supplier item code",
  "items.suppliers.col.price": "Purchase price",
  "items.suppliers.col.currency": "Currency",
  "items.suppliers.col.leadTime": "Lead time",
  "items.suppliers.col.moq": "Min. order qty",
  "items.suppliers.col.status": "Link status",
  "items.suppliers.col.actions": "Actions",
  "items.suppliers.col.lastPurchase": "Last purchase",
  "items.suppliers.add": "Link supplier",
  "items.suppliers.edit": "Edit link",
  "items.suppliers.remove": "Remove link",
  "items.suppliers.view": "View supplier",
  "items.suppliers.empty": "No suppliers linked to this item yet.",
  "items.suppliers.emptyAction": "Link an existing supplier",
  "items.suppliers.pickFromDirectory":
    "Choose from your suppliers directory, then save the link.",
  "items.suppliers.directoryCount": "{count} suppliers available",
  "items.suppliers.noDirectoryMatch": "No matching suppliers in the directory.",
  "items.suppliers.loading": "Loading supplier links…",
  "items.suppliers.error": "Could not load supplier links.",
  "items.suppliers.inactiveBadge": "Inactive supplier",
  "items.suppliers.missingSupplier": "Missing supplier record",
  "items.suppliers.days": "{n} days",
  "items.link.titleAdd": "Link supplier",
  "items.link.titleEdit": "Edit supplier link",
  "items.link.save": "Save link",
  "items.link.cancel": "Cancel",
  "items.link.searchSupplier": "Select supplier",
  "items.link.searchPlaceholder": "Search by name, code, or country…",
  "items.link.noSuppliers": "No matching active suppliers.",
  "items.link.supplierItemCode": "Supplier item code",
  "items.link.purchasePrice": "Supplier purchase price",
  "items.link.currency": "Currency",
  "items.link.leadTimeDays": "Lead time (days)",
  "items.link.moq": "Minimum order quantity",
  "items.link.notes": "Notes",
  "items.link.status": "Link status",
  "items.link.status.active": "Active",
  "items.link.status.inactive": "Inactive",
  "items.link.required": "Required",
  "items.link.duplicate": "This supplier is already linked to this item.",
  "items.link.unknownSupplier": "Select an existing supplier.",
  "items.link.unknownItem": "Item record was not found.",
  "items.link.unknownLink": "Supplier link was not found.",
  "items.link.inactiveSupplier":
    "Inactive suppliers cannot be linked for new purchases.",
  "items.link.invalidNumber": "Enter a valid non-negative number.",
  "items.link.invalidInteger": "Enter a whole number of days.",
  "items.link.currencyRequired": "Select a currency when a price is set.",
  "items.link.priceRequiredWithCurrency":
    "Enter a purchase price when a currency is selected.",
  "items.link.saveSuccess": "Supplier link saved.",
  "items.link.saveError": "Could not save the supplier link.",
  "items.link.removeTitle": "Remove supplier link?",
  "items.link.removeBody":
    "This removes only the item–supplier relationship. The supplier and item records stay intact.",
  "items.link.removeConfirm": "Remove link",
  "items.link.removeSuccess": "Supplier link removed.",
  "items.link.priceNote":
    "Supplier price is a quoted/agreed purchase price — not the item master cost and not a purchase order.",
  "items.link.selectSupplier": "Choose a supplier",
  "items.attachments.title": "Files & images",
  "items.attachments.empty":
    "No general documents attached. Product documents require backend storage.",
  "items.attachments.galleryEmpty": "No product images uploaded yet.",
  "items.attachments.uploadUnavailable":
    "General document upload requires backend storage — not available here.",
  "items.attachments.choose": "Choose image",
  "items.attachments.replace": "Replace image",
  "items.attachments.remove": "Remove image",
  "items.attachments.localNote":
    "Images are stored in this browser only (IndexedDB) — not shared across users or devices.",
  "items.attachments.error.tooLarge": "Image must be 2 MB or smaller.",
  "items.attachments.error.invalidType": "Use PNG, JPG, or WebP only.",
  "items.attachments.error.storage": "Could not save the image in this browser.",
  "items.attachments.success": "Item image saved.",
  "items.attachments.removed": "Item image removed.",
  "items.overview.features": "Key features",
  "items.overview.usage": "Usage areas",
  "items.overview.featuresEmpty":
    "Feature bullets are not stored on the item master.",
  "items.overview.usageEmpty":
    "Usage areas are not stored on the item master.",
  "items.overview.descriptionEmpty": "No description for this item.",
  "items.inventory.available": "Available",
  "items.inventory.total": "Total",
  "items.inventory.reserved": "Reserved",
  "items.inventory.viewDetails": "View inventory details",
  "items.inventory.demoNote":
    "On-hand figures are demo thresholds only — not live warehouse balances.",
  "items.gallery.noImage": "No image",
  "items.overview.description": "Description",
  "items.overview.quickInfo": "Quick info",
  "items.overview.featuresUnavailable":
    "Feature bullets are not stored on the item master in this frontend phase.",
  "items.inventory.liveUnavailable":
    "Live warehouse quantities are not connected. Demo on-hand is for UI thresholds only.",
  "items.inventory.minThreshold": "Minimum stock threshold",
  "items.inventory.demoOnHand": "Demo on-hand (not live)",
  "items.inventory.linkModule": "Open inventory module",
  "items.activity.localNote":
    "Local UI activity from this browser store — not the annex server audit log.",
  "items.activity.empty": "No local activity yet.",
  "items.pricing.historyEmpty": "No local price history entries yet.",
  "items.pricing.noAutoFx":
    "Exchange rate is stored as entered. Automatic recalculation is not applied.",
  "items.sort.label": "Sort",
  "items.createdAt": "Created",
  "items.updatedAt": "Last updated",
  "items.wizard.step1": "Basic data",
  "items.wizard.step2": "Identity & measure",
  "items.wizard.step3": "Inventory",
  "items.wizard.step4": "Pricing",
  "items.wizard.step5": "Review",
  "items.wizard.stepLabel": "Step {current} of {total}",
  "items.wizard.next": "Continue",
  "items.wizard.back": "Back",
  "items.wizard.unsaved": "Discard unsaved item details?",
  "items.wizard.keepEditing": "Keep editing",
  "items.wizard.discard": "Discard",
  "items.wizard.codeAuto": "SKU is assigned automatically.",
  "items.wizard.stockHint":
    "On-hand quantity comes from warehouse movements — not entered here.",
  "items.wizard.editStep": "Edit",

  "spare.title": "Spare Parts",
  "spare.add": "Add spare part",
  "spare.import": "Import spare parts",
  "spare.importUnavailable":
    "Import requires backend catalog sync — not available in this frontend build.",
  "spare.searchPlaceholder":
    "Search name, code, part number, OEM, barcode…",
  "spare.kpi.total": "Total spare parts",
  "spare.kpi.active": "Active spare parts",
  "spare.kpi.lowStock": "Low stock",
  "spare.kpi.uncategorized": "Uncategorized",
  "spare.kpi.inactive": "Inactive",
  "spare.col.part": "Part number",
  "spare.col.oem": "OEM number",
  "spare.col.mpn": "Mfr part number",
  "spare.col.category": "Category",
  "spare.col.manufacturer": "Manufacturer",
  "spare.col.origin": "Origin",
  "spare.col.item": "Base item",
  "spare.col.engines": "Engines",
  "spare.col.alts": "Alternatives",
  "spare.col.availability": "Availability",
  "spare.col.price": "Sell price",
  "spare.col.xrefs": "Cross references",
  "spare.filter.category": "Main category",
  "spare.filter.subCategory": "Subcategory",
  "spare.filter.engine": "Engine type",
  "spare.filter.status": "Status",
  "spare.filter.stock": "Stock level",
  "spare.filter.uom": "Unit of measure",
  "spare.filter.origin": "Country of origin",
  "spare.filter.priceMin": "Min price (EGP)",
  "spare.filter.priceMax": "Max price (EGP)",
  "spare.filter.reset": "Reset",
  "spare.filter.advanced": "Advanced filters",
  "spare.sort.partAsc": "Part A–Z",
  "spare.sort.partDesc": "Part Z–A",
  "spare.sort.oemAsc": "OEM A–Z",
  "spare.sort.manufacturerAsc": "Manufacturer A–Z",
  "spare.sort.updatedDesc": "Newest first",
  "spare.sort.nameAsc": "Name A–Z",
  "spare.sort.priceAsc": "Price low–high",
  "spare.sort.priceDesc": "Price high–low",
  "spare.category.all": "All",
  "spare.category.filters": "Filters & consumables",
  "spare.category.engine_parts": "Engine parts",
  "spare.category.electrical": "Electrical system",
  "spare.category.cooling": "Cooling system",
  "spare.category.fuel": "Fuel system",
  "spare.category.other": "Other",
  "spare.view.grid": "Grid view",
  "spare.view.list": "List view",
  "spare.badge.active": "Active",
  "spare.badge.inactive": "Inactive",
  "spare.badge.lowStock": "Low stock",
  "spare.badge.outOfStock": "Out of stock",
  "spare.stock.inStock": "{count} in stock",
  "spare.stock.outOfStock": "0 out of stock",
  "spare.stock.demoHint": "Demo on-hand qty",
  "spare.action.compat": "Compatibility",
  "spare.action.editItem": "Edit base item",
  "spare.details": "Spare part details",
  "spare.notFound": "Spare part not found",
  "spare.backToList": "Back to spare parts",
  "spare.loading": "Loading spare part…",
  "spare.edit": "Edit",
  "spare.actions": "Actions",
  "spare.openStock": "Stock movements",
  "spare.openItem": "Open base item",
  "spare.copied": "Copied to clipboard",
  "spare.specialized": "Specialized",
  "spare.tab.overview": "Overview",
  "spare.tab.inventory": "Inventory",
  "spare.tab.pricing": "Pricing",
  "spare.tab.engines": "Engine compatibility",
  "spare.tab.alternatives": "Alternative parts",
  "spare.tab.crossRef": "Cross references",
  "spare.tab.suppliers": "Suppliers",
  "spare.tab.attachments": "Files & images",
  "spare.tab.activity": "Activity",
  "spare.section.identity": "Part identification",
  "spare.section.crossRef": "Cross reference & alternatives",
  "spare.section.engines": "Compatible engines",
  "spare.section.item": "Canonical item",
  "spare.section.pricing": "Pricing & availability",
  "spare.section.quickInfo": "Quick info",
  "spare.section.description": "Description",
  "spare.section.warehouseStock": "Warehouse stock",
  "spare.section.movements": "Recent stock movements",
  "spare.section.priceSummary": "Pricing",
  "spare.section.stockSummary": "Stock summary",
  "spare.currentBalance": "Current balance",
  "spare.minLevel": "Minimum level",
  "spare.col.engineType": "Engine type",
  "spare.col.mainCategory": "Main category",
  "spare.col.subCategory": "Subcategory",
  "spare.warehouseEmpty":
    "No warehouse balances for this part yet. Demo on-hand qty is shown in the summary.",
  "spare.movementsEmpty": "No stock movements recorded for this part yet.",
  "spare.demoWarehouseNote":
    "Warehouse rows come from the inventory stock store when present — not invented for display.",
  "spare.movement.date": "Date",
  "spare.movement.type": "Type",
  "spare.movement.qty": "Qty",
  "spare.movement.ref": "Reference",
  "spare.movement.warehouse": "Warehouse",
  "spare.movement.receipt": "Receipt",
  "spare.movement.issue": "Issue",
  "spare.movement.transfer_out": "Transfer out",
  "spare.movement.transfer_in": "Transfer in",
  "spare.movement.adjustment": "Adjustment",
  "spare.alternatives": "Alternative parts",
  "spare.compatibleEngines": "Compatible engines",
  "spare.noEngines": "No demo engine compatibility links.",
  "spare.noAlternatives": "No alternative parts in demo data.",
  "spare.form.addTitle": "Add spare part",
  "spare.form.editTitle": "Edit spare part",
  "spare.form.addHint":
    "Creates a specialized spare record and a linked catalog item (item type: spare part).",
  "spare.form.save": "Save spare part",
  "spare.form.saving": "Saving…",
  "spare.form.saveSuccess": "Spare part saved.",
  "spare.form.saveError": "Could not save spare part in this browser.",
  "spare.form.duplicatePart": "This part number already exists.",
  "spare.form.selectItem": "Select item from catalog…",
  "spare.form.searchItems": "Search by code, name, or part number…",
  "spare.form.noItems": "No matching items",
  "spare.form.newItemCode": "Generate new item code",
  "spare.form.sectionIdentity": "Part identification",
  "spare.form.sectionCatalog": "Catalog & pricing",
  "spare.form.sectionCompat": "Compatibility & cross-reference",
  "spare.form.crossRefHint": "Separate codes with commas.",
  "spare.form.enginesHint": "Demo engine links (optional).",
  "spare.form.altsHint": "Other spare records as alternatives (optional).",
  "spare.wizard.step1": "Identity",
  "spare.wizard.step2": "Classification",
  "spare.wizard.step3": "Pricing & stock",
  "spare.wizard.step4": "Compatibility",
  "spare.wizard.step5": "Review",
  "spare.wizard.stepLabel": "Step {current} of {total}",
  "spare.wizard.next": "Continue",
  "spare.wizard.back": "Back",
  "spare.wizard.create": "Create spare part",
  "spare.wizard.saveChanges": "Save changes",
  "spare.wizard.done": "Done",
  "spare.wizard.openRecord": "Open spare part",
  "spare.wizard.compatOptional":
    "Compatibility links are optional — you can finish without selecting engines or alternatives.",
  "spare.wizard.classifyHint":
    "Category and origin help operators find the right marine spare quickly.",
  "spare.wizard.enginesSelected": "{count} engine(s) selected",
  "spare.wizard.altsSelected": "{count} alternative(s) selected",
  "spare.wizard.reviewHint": "Confirm details before saving to this browser.",
  "spare.delete": "Delete spare part",
  "spare.deleteConfirm.title": "Delete spare part?",
  "spare.deleteConfirm.body":
    "Removes this specialized spare record and its linked spare-part catalog item from this browser. Supplier links for that item are cleared.",
  "spare.deleteConfirm.confirm": "Delete",
  "spare.deleteSuccess": "Spare part deleted.",

  "engines.title": "Marine Engines",
  "engines.subtitle":
    "Manage engine data and link them with compatible and alternative spare parts",
  "engines.add": "Add new engine",
  "engines.searchPlaceholder":
    "Search manufacturer, model, serial…",
  "engines.searchAction": "Search",
  "engines.kpi.total": "Total engines",
  "engines.kpi.active": "Active engines",
  "engines.kpi.manufacturers": "Manufacturers",
  "engines.kpi.withParts": "Linked to spare parts",
  "engines.kpi.withItem": "Linked to items",
  "engines.kpi.avgHp": "Average HP",
  "engines.kpi.unlinked": "Unlinked engines",
  "engines.col.image": "Image",
  "engines.col.manufacturer": "Manufacturer",
  "engines.col.model": "Model",
  "engines.col.year": "Year",
  "engines.col.hp": "HP",
  "engines.col.serial": "Serial Number",
  "engines.col.origin": "Country of origin",
  "engines.col.item": "Linked item",
  "engines.col.parts": "Linked spare parts",
  "engines.col.status": "Status",
  "engines.filter.yearFrom": "Year from",
  "engines.filter.yearTo": "Year to",
  "engines.filter.hpFrom": "HP from",
  "engines.filter.hpTo": "HP to",
  "engines.filter.linkStatus": "Spare-part link",
  "engines.filter.linkLinked": "Linked",
  "engines.filter.linkUnlinked": "Not linked",
  "engines.sort.modelAsc": "Model A–Z",
  "engines.sort.modelDesc": "Model Z–A",
  "engines.sort.hpDesc": "Highest HP",
  "engines.sort.yearDesc": "Newest year",
  "engines.sort.manufacturerAsc": "Manufacturer A–Z",
  "engines.details": "Engine details",
  "engines.notFound": "Engine not found",
  "engines.backToList": "Back to engines",
  "engines.tab.overview": "Overview",
  "engines.tab.parts": "Compatible spare parts",
  "engines.tab.alternatives": "Alternative parts",
  "engines.tab.sales": "Sales history",
  "engines.tab.documents": "Documents",
  "engines.tab.activity": "Activity",
  "engines.section.identity": "Engine identity",
  "engines.section.specs": "Technical specifications",
  "engines.section.parts": "Compatible spare parts",
  "engines.section.item": "Catalog item",
  "engines.section.description": "Description",
  "engines.section.additional": "Additional information",
  "engines.section.summary": "Engine summary",
  "engines.section.alternatives": "Alternative parts",
  "engines.compatibleParts": "Compatible spare parts",
  "engines.noParts": "No spare parts linked to this engine.",
  "engines.noAlternatives":
    "No alternative parts linked from this engine’s spare parts.",
  "engines.docsEmpty": "No documents attached yet.",
  "engines.specsEmpty": "No technical specifications recorded.",
  "engines.descEmpty": "No description recorded.",
  "engines.meta.created": "Created",
  "engines.meta.updated": "Updated",
  "engines.meta.added": "Date added",
  "engines.detail.kpi.hp": "Horsepower",
  "engines.detail.kpi.year": "Manufacture year",
  "engines.detail.kpi.sales": "Sales record",
  "engines.detail.kpi.parts": "Linked spare parts",
  "engines.detail.edit": "Edit",
  "engines.detail.otherActions": "Other actions",
  "engines.detail.manageLinks": "Manage links",
  "engines.detail.copySerial": "Copy serial number",
  "engines.detail.stock": "Stock",
  "engines.detail.salesUnavailable": "—",
  "engines.activity.localNote":
    "Activity is stored in this browser only — not a server audit log.",
  "engines.activity.empty": "No activity recorded yet.",
  "engines.statusConfirm.titleActivate": "Activate engine?",
  "engines.statusConfirm.titleDeactivate": "Deactivate engine?",
  "engines.statusConfirm.bodyActivate":
    "The engine will appear as active in directories and selection lists.",
  "engines.statusConfirm.bodyDeactivate":
    "The engine will be marked inactive. Spare-part links are kept.",
  "engines.statusConfirm.confirmActivate": "Activate",
  "engines.statusConfirm.confirmDeactivate": "Deactivate",
  "engines.hpUnit": "HP",
  "engines.form.addTitle": "Add new engine",
  "engines.form.editTitle": "Edit engine",
  "engines.form.create": "Save engine",
  "engines.form.save": "Save engine",
  "engines.form.notes": "Notes",
  "engines.form.description": "Engine description",
  "engines.form.stepLabel": "Step {current} of {total}",
  "engines.form.step.identity": "Identity",
  "engines.form.step.classify": "Origin & details",
  "engines.form.step.parts": "Link spare parts",
  "engines.form.step.review": "Review",
  "engines.form.hint.identity":
    "Enter the manufacturer, model, serial number, year, and horsepower.",
  "engines.form.hint.classify":
    "Set country of origin, status, optional catalog item link, and description.",
  "engines.form.hint.parts":
    "Optionally link compatible spare parts. You can change links later.",
  "engines.form.hint.review":
    "Confirm the engine details before saving. Use Edit to jump back to a step.",
  "engines.form.tab.basic": "Basic data",
  "engines.form.tab.parts": "Link spare parts",
  "engines.form.tab.more": "Additional info",
  "engines.form.partsSearch": "Search spare parts to link…",
  "engines.form.partsEmpty": "No spare parts match this search.",
  "engines.form.partsSelected": "Linked parts",
  "engines.form.partsSelectedCount": "{count} linked",
  "engines.form.removePart": "Remove",
  "engines.form.imageHint":
    "Engine photos use the linked catalog item image when available.",
  "engines.form.duplicateSerial": "Serial number already exists",
  "engines.form.invalidYear": "Enter a valid year",
  "engines.form.persistFailed": "Could not save engine locally",
  "engines.form.saveFailed": "Could not save engine",
  "engines.form.saveSuccess": "Engine saved",
  "engines.form.openRecord": "Open engine",
  "engines.form.unsavedTitle": "Discard changes?",
  "engines.form.unsavedBody":
    "You have unsaved changes. Close without saving?",
  "engines.form.discard": "Discard",
  "engines.form.keepEditing": "Keep editing",
  "engines.deactivate": "Deactivate",
  "engines.activate": "Activate",
  "engines.deactivateSuccess": "Engine deactivated",
  "engines.activateSuccess": "Engine activated",
  "engines.delete": "Delete",
  "engines.deleteSuccess": "Engine deleted.",
  "engines.deleteConfirm.title": "Delete engine?",
  "engines.deleteConfirm.body":
    "This permanently removes the engine and clears its spare-part compatibility links in this browser. This cannot be undone.",
  "engines.deleteConfirm.confirm": "Delete",
  "engines.section.sales": "Sales history",
  "engines.salesEmpty": "No sales history yet — sales module not connected.",
  "engines.export": "Export",
  "engines.exportSuccess": "Engines exported",
  "engines.import": "Import",
  "engines.importSoon":
    "Engine import is not available in this frontend build.",
  "spare.compat.degree": "Compatibility",
  "spare.compat.degree.exact": "Full match",
  "spare.compat.degree.high": "High compatibility",
  "spare.compat.degree.partial": "Medium compatibility",
  "spare.compat.degree.functional": "Low compatibility",
  "spare.compat.notes": "Notes",
  "xref.title": "Cross Reference & Alternative Parts",
  "xref.subtitle":
    "Manage original and alternative parts and cross-reference numbers across manufacturers",
  "xref.add": "Add new reference",
  "xref.edit": "Edit relationship",
  "xref.remove": "Remove",
  "xref.import": "Import",
  "xref.export": "Export",
  "xref.importSoon":
    "Bulk import of cross-reference relationships is not available in this frontend build.",
  "xref.import.help":
    "Upload a CSV of relationship and typed reference rows. Invalid rows are reported and never written. Valid rows commit only after you confirm.",
  "xref.import.template": "Download template",
  "xref.import.chooseFile": "Choose CSV",
  "xref.import.total": "Total rows",
  "xref.import.valid": "Valid",
  "xref.import.invalid": "Invalid",
  "xref.import.duplicates": "Duplicates",
  "xref.import.missingParts": "Missing parts",
  "xref.import.downloadReport": "Download validation report",
  "xref.import.confirm": "I confirm committing the valid rows",
  "xref.import.commit": "Commit import",
  "xref.import.summary":
    "Import finished — imported {imported}, skipped {skipped}, failed {failed}",
  "xref.import.parseError": "Could not read or parse the CSV file.",
  "xref.import.commitError": "Import commit failed.",
  "xref.searchPlaceholder":
    "Search by name, item code, OEM, part number, MPN, or cross-ref code…",
  "xref.resetFilters": "Reset",
  "xref.col.refType": "Reference type",
  "xref.col.refValue": "Reference number",
  "xref.refType.oem": "OEM number",
  "xref.refType.part_number": "Part number",
  "xref.refType.mpn": "Manufacturer part number",
  "xref.refType.alternative": "Alternative part number",
  "xref.refType.compatible": "Compatible part number",
  "xref.kpi.relationships": "Total relationships",
  "xref.kpi.withAlternatives": "Parts with alternatives",
  "xref.kpi.multiRef": "Parts with multiple references",
  "xref.kpi.needsReview": "Needs review",
  "xref.kpi.originals": "Original parts",
  "xref.kpi.withCodes": "Parts with codes",
  "xref.kpi.exact": "Exact matches",
  "xref.col.original": "Original part",
  "xref.col.alternative": "Alternative part",
  "xref.col.degree": "Compatibility",
  "xref.col.notes": "Notes",
  "xref.col.oem": "OEM / Part number",
  "xref.col.altOem": "Alt. OEM / Part number",
  "xref.col.mpn": "MPN",
  "xref.col.item": "Item code",
  "xref.col.codes": "Cross-ref codes",
  "xref.kind.alternative": "Alternative part",
  "xref.kind.compatible": "Compatible part",
  "xref.sort.originalAsc": "Original A–Z",
  "xref.sort.originalDesc": "Original Z–A",
  "xref.sort.altAsc": "Alternative A–Z",
  "xref.sort.degreeAsc": "Degree A–Z",
  "xref.sort.updatedDesc": "Recently updated",
  "xref.empty": "No alternative relationships yet.",
  "xref.emptyFiltered": "No relationships match the current filters.",
  "xref.form.createTitle": "Add new reference",
  "xref.form.editTitle": "Edit reference",
  "xref.form.tab.basic": "Basic information",
  "xref.form.tab.extra": "Additional information",
  "xref.form.original": "Original part",
  "xref.form.alternative": "Alternative part",
  "xref.form.degree": "Compatibility degree",
  "xref.form.relationshipType": "Relationship type",
  "xref.form.notes": "Notes",
  "xref.form.codes": "Cross-reference codes (original)",
  "xref.form.codesHint":
    "Freeform tags on the original part (e.g. OEM:…, ALT:…, XREF:…). Separate with commas.",
  "xref.form.pickPart": "Select a spare part…",
  "xref.form.searchParts": "Search name, code, OEM…",
  "xref.form.noParts": "No matching spare parts.",
  "xref.form.save": "Save reference",
  "xref.form.saved": "Relationship saved",
  "xref.form.error.self": "A part cannot be an alternative of itself.",
  "xref.form.error.duplicate": "This relationship already exists.",
  "xref.form.error.missing": "Select valid original and alternative parts.",
  "xref.form.error.generic": "Could not save the relationship.",
  "xref.wizard.step1": "Parts",
  "xref.wizard.step2": "Relationship",
  "xref.wizard.step3": "Details",
  "xref.wizard.step4": "Review",
  "xref.wizard.stepLabel": "Step {current} of {total}",
  "xref.wizard.step1Hint":
    "Choose the original spare part and its alternative or compatible counterpart.",
  "xref.wizard.step2Hint":
    "Set whether this is an alternative or compatible link, and the compatibility degree.",
  "xref.wizard.step3Hint":
    "Optional notes and freeform cross-reference codes on the original part.",
  "xref.wizard.reviewHint": "Confirm the relationship before saving.",
  "xref.wizard.next": "Continue",
  "xref.wizard.back": "Back",
  "xref.wizard.create": "Create reference",
  "xref.wizard.saveChanges": "Save changes",
  "xref.wizard.saving": "Saving…",
  "xref.wizard.done": "Done",
  "xref.wizard.unsaved": "Discard unsaved reference changes?",
  "xref.removeTitle": "Remove relationship?",
  "xref.removeBody":
    "This removes the alternative link from the original spare part. The spare records themselves are not deleted.",
  "xref.removeConfirm": "Remove link",
  "xref.removeSuccess": "Relationship removed",
  "xref.overview": "Original part references",
  "xref.detailTitle": "Reference details",
  "xref.detail.updated": "Last updated",
  "xref.openSpare": "Open spare",
  "xref.selectOriginal": "Select a relationship to inspect references.",
};

const ar: Record<CatalogKey, string> = {
  "catalog.designNotice": "معاينة تصميم",
  "catalog.designNoticeHint":
    "واجهة فقط — الحفظ والاستيراد والتصدير وحسابات التسعير غير متصلة.",
  "catalog.demoData": "بيانات عرض تجريبية",
  "catalog.compatDemo": "توافق تجريبي",
  "catalog.compatUnverified":
    "التوافق المعروض من روابط تجريبية — وليس بيانات تشغيل مؤكدة.",
  "catalog.search": "بحث",
  "catalog.filters": "تصفية",
  "catalog.applyFilters": "تطبيق الفلاتر",
  "catalog.clearFilters": "مسح الفلاتر",
  "catalog.resultCount": "{count} نتيجة",
  "catalog.showingRange": "عرض {from}–{to} من {total}",
  "catalog.sort": "ترتيب",
  "catalog.actions": "إجراءات",
  "catalog.action.view": "عرض",
  "catalog.action.edit": "تعديل",
  "catalog.action.delete": "حذف",
  "catalog.action.add": "إضافة",
  "catalog.openRecord": "فتح السجل",
  "catalog.empty": "لا توجد سجلات في كتالوج العرض.",
  "catalog.emptyFiltered": "لا توجد سجلات مطابقة للتصفية الحالية.",
  "catalog.pagination": "ترقيم الصفحات",
  "catalog.pageSize": "الصفوف",
  "catalog.first": "الأولى",
  "catalog.prev": "السابق",
  "catalog.next": "التالي",
  "catalog.last": "الأخيرة",
  "catalog.filter.all": "الكل",
  "catalog.filter.manufacturer": "الشركة المصنعة",
  "catalog.col.actions": "إجراءات",
  "catalog.col.index": "#",
  "catalog.price.cost": "التكلفة",
  "catalog.price.sell": "سعر البيع",
  "catalog.linkedItem": "الصنف الأساسي",
  "catalog.openItem": "فتح الصنف",
  "catalog.openSpare": "فتح قطعة الغيار",
  "catalog.openEngine": "فتح المحرك",
  "catalog.noLink": "لا يوجد سجل مرتبط",
  "catalog.form.designOnly": "غلاف تصميم فقط — الحفظ غير متصل.",
  "catalog.form.close": "إغلاق",
  "catalog.importSoon":
    "استيراد CSV يتطلب مزامنة خادم وغير متاح في الواجهة المحلية للمتصفح.",
  "catalog.exportSoon": "التصدير عنصر مرئي في مرحلة التصميم.",

  "items.title": "الأصناف",
  "items.subtitle": "إدارة جميع الأصناف والمنتجات في الشركة",
  "items.add": "إضافة صنف جديد",
  "items.import": "استيراد",
  "items.export": "تصدير CSV",
  "items.exportSuccess": "تم تنزيل CSV للأصناف (محليًا في المتصفح).",
  "items.selected": "{count} محدد",
  "items.bulk.deactivate": "إلغاء تنشيط المحدد",
  "items.bulk.activate": "تنشيط المحدد",
  "items.bulk.clear": "مسح التحديد",
  "items.bulk.deactivateTitle": "إلغاء تنشيط الأصناف المحددة؟",
  "items.bulk.activateTitle": "تنشيط الأصناف المحددة؟",
  "items.bulk.deactivateBody":
    "سيتم تعليم الأصناف المحددة كغير نشطة. تُحفظ روابط الموردين والسجل المحلي.",
  "items.bulk.activateBody":
    "سيتم إعادة تنشيط الأصناف المحددة. تُحفظ روابط الموردين والسجل المحلي.",
  "items.bulk.success": "تم تحديث {count} أصناف.",
  "items.searchPlaceholder":
    "الاسم، كود الصنف، Part Number، OEM، الباركود، الرقم التسلسلي…",
  "items.searchAction": "بحث",
  "items.kpi.total": "إجمالي الأصناف",
  "items.kpi.operating": "مستلزمات تشغيل",
  "items.kpi.other": "مواد أخرى",
  "items.kpi.raw": "مواد خام",
  "items.kpi.inactive": "أصناف غير نشطة",
  "items.col.select": "تحديد",
  "items.col.image": "الصورة",
  "items.col.name": "الصنف",
  "items.col.nameEn": "اسم الصنف بالإنجليزية",
  "items.col.nameAr": "اسم الصنف بالعربية",
  "items.col.code": "كود الصنف",
  "items.col.type": "نوع الصنف",
  "items.col.category": "التصنيف الرئيسي",
  "items.col.subCategory": "التصنيف الفرعي",
  "items.col.manufacturer": "الشركة المصنعة",
  "items.col.origin": "بلد المنشأ",
  "items.col.oem": "رقم OEM",
  "items.col.part": "رقم القطعة",
  "items.col.uom": "وحدة القياس",
  "items.col.barcode": "الباركود",
  "items.col.serial": "الرقم التسلسلي",
  "items.col.cost": "التكلفة",
  "items.col.costUsd": "تكلفة الشراء بالدولار",
  "items.col.costEgp": "تكلفة الشراء بالجنيه",
  "items.col.sell": "سعر البيع",
  "items.col.sellUsd": "سعر البيع بالدولار",
  "items.col.sellEgp": "سعر البيع بالجنيه",
  "items.col.margin": "نسبة الربح المستهدفة",
  "items.col.fxRate": "سعر الصرف المستخدم",
  "items.col.fxSource": "مصدر / نوع سعر الصرف",
  "items.col.priceUpdated": "تاريخ آخر تحديث للسعر",
  "items.col.status": "حالة الصنف",
  "items.col.stock": "الرصيد",
  "items.col.minStock": "الحد الأدنى للمخزون",
  "items.col.description": "وصف الصنف",
  "items.filter.type": "نوع الصنف",
  "items.filter.category": "التصنيف الرئيسي",
  "items.filter.status": "حالة الصنف",
  "items.filter.origin": "بلد المنشأ",
  "items.filter.uom": "وحدة القياس",
  "items.filter.stockLevel": "حالة الحد الأدنى للمخزون",
  "items.filter.priceRange": "سعر البيع (ج.م)",
  "items.filter.priceFrom": "من",
  "items.filter.priceTo": "إلى",
  "items.filters.title": "فلاتر الأصناف",
  "items.filters.section.classify": "التصنيف",
  "items.filters.section.source": "المصنّع وبلد المنشأ",
  "items.filters.section.status": "الحالة والقياس",
  "items.filters.section.price": "سعر البيع (ج.م)",
  "items.filter.period": "الفترة الزمنية",
  "items.stockLevel.all": "الكل",
  "items.stockLevel.below_min": "أقل من الحد الأدنى",
  "items.stockLevel.ok": "عند / فوق الحد الأدنى",
  "items.stockLevel.out": "نفد المخزون",
  "items.sort.codeAsc": "الكود أ–ي",
  "items.sort.codeDesc": "الكود ي–أ",
  "items.sort.nameAsc": "الاسم أ–ي",
  "items.sort.nameDesc": "الاسم ي–أ",
  "items.sort.updatedDesc": "الأحدث تحديثًا",
  "items.type.operating_supplies": "مستلزمات تشغيل",
  "items.type.raw_materials": "مواد خام",
  "items.type.other_materials": "مواد أخرى",
  "items.type.spare_part": "قطعة غيار",
  "items.type.marine_engine": "محرك بحري",
  "items.type.uncategorized": "غير مصنف",
  "items.category.oils_supplies": "زيوت ومستلزمات",
  "items.category.electrical": "كهربائية",
  "items.category.rigging": "تجهيزات",
  "items.category.cooling_fluids": "سوائل تبريد",
  "items.category.coatings": "طلاءات",
  "items.category.hardware": "معدات تثبيت",
  "items.category.hoses": "خراطيم",
  "items.category.sealing": "عزل وإحكام",
  "items.category.engine_units": "وحدات محركات",
  "items.category.other": "أخرى",
  "items.category.uncategorized": "غير مصنف",
  "items.status.active": "نشط",
  "items.status.inactive": "غير نشط",
  "items.status.discontinued": "موقوف",
  "items.fx.system": "سعر النظام",
  "items.fx.manual": "يدوي",
  "items.fx.bank": "سعر البنك",
  "items.fx.custom": "مخصص",
  "items.details": "تفاصيل الصنف",
  "items.notFound": "الصنف غير موجود",
  "items.backToList": "العودة إلى قائمة الأصناف",
  "items.section.identity": "الهوية",
  "items.section.commercial": "التسعير",
  "items.section.stock": "ملخص المخزون",
  "items.section.links": "السجلات المرتبطة",
  "items.relatedSpare": "عرض قطعة الغيار",
  "items.relatedEngine": "سجل المحرك",
  "items.col.relatedEngineType": "نوع المحرك المرتبط",
  "items.serialTracked": "يتتبع بالرقم التسلسلي",
  "items.serialNotTracked": "بدون تتبع تسلسلي",
  "items.form.addTitle": "إضافة صنف جديد",
  "items.form.tab.basic": "البيانات الأساسية",
  "items.form.tab.identity": "التعريف والقياس",
  "items.form.tab.inventory": "المخزون",
  "items.form.tab.pricing": "التسعير",
  "items.form.image": "صورة الصنف",
  "items.form.imageAdd": "إضافة صورة الصنف",
  "items.form.imageHint":
    "اختياري PNG أو JPG أو WebP (حد أقصى 2 ميجابايت، محلي في المتصفح).",
  "items.form.originSearch": "بحث باسم الدولة أو الكود…",
  "items.form.barcodeHint":
    "يُملأ تلقائياً. الماسح USB يعمل هنا؛ الأيقونة تعيد التوليد.",
  "items.form.barcodeGenerate": "توليد باركود تلقائي",
  "items.form.barcodePlaceholder": "امسح أو يُولَّد تلقائياً",
  "items.form.save": "حفظ الصنف",
  "items.form.cancel": "إلغاء",
  "items.form.activeToggle": "نشط",
  "items.form.required": "مطلوب",
  "items.form.invalidCode": "استخدم الصيغة ITM-XXXX",
  "items.form.duplicateCode": "كود الصنف مستخدم بالفعل",
  "items.form.invalidNumber": "أدخل رقمًا صالحًا غير سالب",
  "items.form.editTitle": "تعديل الصنف",
  "items.form.saveSuccess": "تم حفظ الصنف",
  "items.form.saveError": "تعذر حفظ الصنف",
  "items.form.imageSavePartial":
    "تم حفظ الصنف. تعذر تخزين الصورة — أضفها من تبويب المرفقات.",
  "items.form.priceHistory": "سجل الأسعار",
  "items.form.priceHistoryHint":
    "لقطات محلية من مخزن المتصفح. ليست سجل تدقيق خادميًا أو محرك صرف.",
  "items.loading": "جاري تحميل الصنف…",
  "items.edit": "تعديل الصنف",
  "items.deactivate": "إلغاء تنشيط",
  "items.activate": "تنشيط",
  "items.delete": "حذف الصنف",
  "items.deleteConfirm.title": "حذف الصنف؟",
  "items.deleteConfirm.body":
    "سيُحذف الصنف نهائيًا من الكتالوج المحلي، بما في ذلك روابط الموردين والصورة الرئيسية. لا يمكن التراجع.",
  "items.deleteConfirm.confirm": "حذف نهائي",
  "items.deleteSuccess": "تم حذف الصنف",
  "items.statusConfirm.titleActivate": "تنشيط الصنف؟",
  "items.statusConfirm.titleDeactivate": "إلغاء تنشيط الصنف؟",
  "items.statusConfirm.bodyActivate":
    "سيصبح الصنف متاحًا للاستخدام التشغيلي. يُحتفظ بالسجل.",
  "items.statusConfirm.bodyDeactivate":
    "سيُعلَّم الصنف كغير نشط. تُحفظ البيانات الرئيسية والسجل.",
  "items.statusConfirm.confirmActivate": "تنشيط",
  "items.statusConfirm.confirmDeactivate": "إلغاء التنشيط",
  "items.tab.overview": "نظرة عامة",
  "items.tab.basic": "البيانات الأساسية",
  "items.tab.identity": "التعريف والقياس",
  "items.tab.pricing": "التسعير",
  "items.tab.inventory": "المخزون",
  "items.tab.suppliers": "الموردون",
  "items.tab.attachments": "الملفات والصور",
  "items.tab.activity": "سجل النشاط",
  "items.actions": "إجراءات",
  "items.header.availableQty": "الكمية المتاحة",
  "items.header.minStock": "حد المخزون الأدنى",
  "items.pricing.currencyEgp": "الجنيه المصري",
  "items.pricing.currencyUsd": "الدولار الأمريكي",
  "items.suppliers.title": "الموردون المرتبطون",
  "items.suppliers.unavailable": "لا يوجد موردون مرتبطون بهذا الصنف بعد.",
  "items.suppliers.openModule": "فتح دليل الموردين",
  "items.suppliers.col.name": "المورد",
  "items.suppliers.col.code": "الكود",
  "items.suppliers.col.supplierItemCode": "كود الصنف لدى المورد",
  "items.suppliers.col.price": "سعر الشراء",
  "items.suppliers.col.currency": "العملة",
  "items.suppliers.col.leadTime": "مدة التوريد",
  "items.suppliers.col.moq": "الحد الأدنى للطلب",
  "items.suppliers.col.status": "حالة الرابط",
  "items.suppliers.col.actions": "إجراءات",
  "items.suppliers.col.lastPurchase": "آخر شراء",
  "items.suppliers.add": "ربط مورد",
  "items.suppliers.edit": "تعديل الرابط",
  "items.suppliers.remove": "إزالة الرابط",
  "items.suppliers.view": "عرض المورد",
  "items.suppliers.empty": "لا يوجد موردون مرتبطون بهذا الصنف بعد.",
  "items.suppliers.emptyAction": "ربط مورد موجود",
  "items.suppliers.pickFromDirectory":
    "اختر من دليل الموردين الموجود، ثم احفظ الرابط.",
  "items.suppliers.directoryCount": "{count} مورد متاح",
  "items.suppliers.noDirectoryMatch": "لا يوجد موردون مطابقون في الدليل.",
  "items.suppliers.loading": "جاري تحميل روابط الموردين…",
  "items.suppliers.error": "تعذر تحميل روابط الموردين.",
  "items.suppliers.inactiveBadge": "مورد غير نشط",
  "items.suppliers.missingSupplier": "سجل المورد غير موجود",
  "items.suppliers.days": "{n} يوم",
  "items.link.titleAdd": "ربط مورد",
  "items.link.titleEdit": "تعديل رابط المورد",
  "items.link.save": "حفظ الرابط",
  "items.link.cancel": "إلغاء",
  "items.link.searchSupplier": "اختيار المورد",
  "items.link.searchPlaceholder": "بحث بالاسم أو الكود أو الدولة…",
  "items.link.noSuppliers": "لا يوجد موردون نشطون مطابقون.",
  "items.link.supplierItemCode": "كود الصنف لدى المورد",
  "items.link.purchasePrice": "سعر الشراء لدى المورد",
  "items.link.currency": "العملة",
  "items.link.leadTimeDays": "مدة التوريد (أيام)",
  "items.link.moq": "الحد الأدنى لكمية الطلب",
  "items.link.notes": "ملاحظات",
  "items.link.status": "حالة الرابط",
  "items.link.status.active": "نشط",
  "items.link.status.inactive": "غير نشط",
  "items.link.required": "مطلوب",
  "items.link.duplicate": "هذا المورد مرتبط بالفعل بهذا الصنف.",
  "items.link.unknownSupplier": "اختر مورداً موجوداً.",
  "items.link.unknownItem": "سجل الصنف غير موجود.",
  "items.link.unknownLink": "رابط المورد غير موجود.",
  "items.link.inactiveSupplier":
    "لا يمكن ربط الموردين غير النشطين لمشتريات جديدة.",
  "items.link.invalidNumber": "أدخل رقماً صالحاً غير سالب.",
  "items.link.invalidInteger": "أدخل عدداً صحيحاً من الأيام.",
  "items.link.currencyRequired": "اختر العملة عند إدخال السعر.",
  "items.link.priceRequiredWithCurrency":
    "أدخل سعر الشراء عند اختيار العملة.",
  "items.link.saveSuccess": "تم حفظ رابط المورد.",
  "items.link.saveError": "تعذر حفظ رابط المورد.",
  "items.link.removeTitle": "إزالة رابط المورد؟",
  "items.link.removeBody":
    "يزيل هذا الإجراء علاقة الصنف–المورد فقط. سجلات المورد والصنف تبقى كما هي.",
  "items.link.removeConfirm": "إزالة الرابط",
  "items.link.removeSuccess": "تم إزالة رابط المورد.",
  "items.link.priceNote":
    "سعر المورد هو سعر شراء متفق عليه — وليس تكلفة الصنف الرئيسية وليس أمر شراء.",
  "items.link.selectSupplier": "اختر مورداً",
  "items.attachments.title": "الملفات والصور",
  "items.attachments.empty":
    "لا توجد مستندات عامة. مستندات المنتج تتطلب تخزين خادم.",
  "items.attachments.galleryEmpty": "لا توجد صور منتج مرفوعة بعد.",
  "items.attachments.uploadUnavailable":
    "رفع المستندات العامة يتطلب تخزين خادم — غير متاح هنا.",
  "items.attachments.choose": "اختيار صورة",
  "items.attachments.replace": "استبدال الصورة",
  "items.attachments.remove": "إزالة الصورة",
  "items.attachments.localNote":
    "الصور تُخزَّن في هذا المتصفح فقط (IndexedDB) — وليست مشتركة بين المستخدمين أو الأجهزة.",
  "items.attachments.error.tooLarge": "يجب ألا تزيد الصورة عن 2 ميجابايت.",
  "items.attachments.error.invalidType": "استخدم PNG أو JPG أو WebP فقط.",
  "items.attachments.error.storage": "تعذر حفظ الصورة في هذا المتصفح.",
  "items.attachments.success": "تم حفظ صورة الصنف.",
  "items.attachments.removed": "تم إزالة صورة الصنف.",
  "items.overview.features": "أهم المميزات",
  "items.overview.usage": "مجالات الاستخدام",
  "items.overview.featuresEmpty":
    "نقاط المميزات غير مخزّنة على بطاقة الصنف.",
  "items.overview.usageEmpty":
    "مجالات الاستخدام غير مخزّنة على بطاقة الصنف.",
  "items.overview.descriptionEmpty": "لا يوجد وصف لهذا الصنف.",
  "items.inventory.available": "المتاح",
  "items.inventory.total": "الإجمالي",
  "items.inventory.reserved": "المحجوز",
  "items.inventory.viewDetails": "عرض تفاصيل المخزون",
  "items.inventory.demoNote":
    "أرقام الكمية تجريبية للعتبات فقط — وليست أرصدة مستودع حية.",
  "items.gallery.noImage": "لا توجد صورة",
  "items.overview.description": "الوصف",
  "items.overview.quickInfo": "معلومات سريعة",
  "items.overview.featuresUnavailable":
    "نقاط المميزات غير مخزّنة على بطاقة الصنف في هذه المرحلة الأمامية.",
  "items.inventory.liveUnavailable":
    "كميات المستودع الحية غير متصلة. الكمية التجريبية للعتبات فقط.",
  "items.inventory.minThreshold": "حد المخزون الأدنى",
  "items.inventory.demoOnHand": "كمية تجريبية (ليست حية)",
  "items.inventory.linkModule": "فتح وحدة المخزون",
  "items.activity.localNote":
    "نشاط واجهة محلي من مخزن المتصفح — وليس سجل التدقيق الخادمي في الملحق.",
  "items.activity.empty": "لا يوجد نشاط محلي بعد.",
  "items.pricing.historyEmpty": "لا توجد إدخالات سجل أسعار محلية بعد.",
  "items.pricing.noAutoFx":
    "يُحفظ سعر الصرف كما أُدخل. لا يُعاد الحساب تلقائيًا.",
  "items.sort.label": "ترتيب",
  "items.createdAt": "تاريخ الإنشاء",
  "items.updatedAt": "آخر تحديث",
  "items.wizard.step1": "البيانات الأساسية",
  "items.wizard.step2": "التعريف والقياس",
  "items.wizard.step3": "المخزون",
  "items.wizard.step4": "التسعير",
  "items.wizard.step5": "المراجعة",
  "items.wizard.stepLabel": "الخطوة {current} من {total}",
  "items.wizard.next": "متابعة",
  "items.wizard.back": "رجوع",
  "items.wizard.unsaved": "تجاهل بيانات الصنف غير المحفوظة؟",
  "items.wizard.keepEditing": "متابعة التعديل",
  "items.wizard.discard": "تجاهل",
  "items.wizard.codeAuto": "يُنشأ كود الصنف تلقائيًا.",
  "items.wizard.stockHint":
    "رصيد المخزون يأتي من حركات المخازن — ولا يُدخل من هنا.",
  "items.wizard.editStep": "تعديل",

  "spare.title": "قطع الغيار",
  "spare.add": "إضافة قطعة غيار",
  "spare.import": "استيراد قطع غيار",
  "spare.importUnavailable":
    "الاستيراد يتطلب مزامنة كتالوج من الخادم — غير متاح في هذه النسخة الأمامية.",
  "spare.searchPlaceholder":
    "بحث بالاسم أو الكود أو رقم القطعة أو OEM أو الباركود…",
  "spare.kpi.total": "إجمالي قطع الغيار",
  "spare.kpi.active": "قطع غيار نشطة",
  "spare.kpi.lowStock": "منخفضة المخزون",
  "spare.kpi.uncategorized": "غير مصنفة",
  "spare.kpi.inactive": "متوقفة",
  "spare.col.part": "رقم القطعة",
  "spare.col.oem": "رقم OEM",
  "spare.col.mpn": "رقم القطعة لدى المصنّع",
  "spare.col.category": "التصنيف",
  "spare.col.manufacturer": "الشركة المصنعة",
  "spare.col.origin": "بلد المنشأ",
  "spare.col.item": "الصنف الأساسي",
  "spare.col.engines": "المحركات",
  "spare.col.alts": "البدائل",
  "spare.col.availability": "التوفر",
  "spare.col.price": "سعر البيع",
  "spare.col.xrefs": "المراجع المتقاطعة",
  "spare.filter.category": "التصنيف الرئيسي",
  "spare.filter.subCategory": "التصنيف الفرعي",
  "spare.filter.engine": "نوع المحرك",
  "spare.filter.status": "الحالة",
  "spare.filter.stock": "مستوى المخزون",
  "spare.filter.uom": "وحدة القياس",
  "spare.filter.origin": "بلد المنشأ",
  "spare.filter.priceMin": "أقل سعر (ج.م)",
  "spare.filter.priceMax": "أعلى سعر (ج.م)",
  "spare.filter.reset": "إعادة تعيين",
  "spare.filter.advanced": "بحث متقدم",
  "spare.sort.partAsc": "رقم القطعة أ–ي",
  "spare.sort.partDesc": "رقم القطعة ي–أ",
  "spare.sort.oemAsc": "OEM أ–ي",
  "spare.sort.manufacturerAsc": "المصنّع أ–ي",
  "spare.sort.updatedDesc": "الأحدث أولاً",
  "spare.sort.nameAsc": "الاسم أ–ي",
  "spare.sort.priceAsc": "السعر من الأقل",
  "spare.sort.priceDesc": "السعر من الأعلى",
  "spare.category.all": "الكل",
  "spare.category.filters": "فلاتر ومواد استهلاكية",
  "spare.category.engine_parts": "قطع المحرك",
  "spare.category.electrical": "نظام الكهرباء",
  "spare.category.cooling": "نظام التبريد",
  "spare.category.fuel": "نظام الوقود",
  "spare.category.other": "أخرى",
  "spare.view.grid": "عرض الشبكة",
  "spare.view.list": "عرض القائمة",
  "spare.badge.active": "نشط",
  "spare.badge.inactive": "متوقف",
  "spare.badge.lowStock": "منخفض المخزون",
  "spare.badge.outOfStock": "نفد المخزون",
  "spare.stock.inStock": "{count} متوفر",
  "spare.stock.outOfStock": "0 نفد المخزون",
  "spare.stock.demoHint": "كمية تجريبية",
  "spare.action.compat": "التوافق",
  "spare.action.editItem": "تعديل الصنف الأساسي",
  "spare.details": "تفاصيل قطعة الغيار",
  "spare.notFound": "قطعة الغيار غير موجودة",
  "spare.backToList": "العودة إلى قطع الغيار",
  "spare.loading": "جاري تحميل قطعة الغيار…",
  "spare.edit": "تعديل",
  "spare.actions": "إجراءات",
  "spare.openStock": "حركة المخزون",
  "spare.openItem": "فتح الصنف الأساسي",
  "spare.copied": "تم النسخ إلى الحافظة",
  "spare.specialized": "متخصص",
  "spare.tab.overview": "نظرة عامة",
  "spare.tab.inventory": "المخزون",
  "spare.tab.pricing": "الأسعار",
  "spare.tab.engines": "التوافق مع المحركات",
  "spare.tab.alternatives": "القطع البديلة",
  "spare.tab.crossRef": "العلامات والأرقام المرجعية",
  "spare.tab.suppliers": "الموردون",
  "spare.tab.attachments": "المرفقات والصور",
  "spare.tab.activity": "سجل النشاط",
  "spare.section.identity": "تعريف القطعة",
  "spare.section.crossRef": "الأرقام المرجعية والبدائل",
  "spare.section.engines": "المحركات المتوافقة",
  "spare.section.item": "الصنف المعتمد",
  "spare.section.pricing": "التسعير والتوفر",
  "spare.section.quickInfo": "معلومات سريعة",
  "spare.section.description": "الوصف",
  "spare.section.warehouseStock": "المخزون حسب المخازن",
  "spare.section.movements": "حركة المخزون الأخيرة",
  "spare.section.priceSummary": "التسعير",
  "spare.section.stockSummary": "ملخص المخزون",
  "spare.currentBalance": "الرصيد الحالي",
  "spare.minLevel": "الحد الأدنى",
  "spare.col.engineType": "نوع المحرك",
  "spare.col.mainCategory": "التصنيف الرئيسي",
  "spare.col.subCategory": "التصنيف الفرعي",
  "spare.warehouseEmpty":
    "لا توجد أرصدة مخازن لهذه القطعة بعد. الكمية التجريبية تظهر في الملخص.",
  "spare.movementsEmpty": "لا توجد حركات مخزون مسجّلة لهذه القطعة بعد.",
  "spare.demoWarehouseNote":
    "صفوف المخازن تأتي من مخزن أرصدة المخزون عند توفرها — ولا تُختلق للعرض.",
  "spare.movement.date": "التاريخ",
  "spare.movement.type": "النوع",
  "spare.movement.qty": "الكمية",
  "spare.movement.ref": "المرجع",
  "spare.movement.warehouse": "المخزن",
  "spare.movement.receipt": "استلام",
  "spare.movement.issue": "صرف",
  "spare.movement.transfer_out": "تحويل صادر",
  "spare.movement.transfer_in": "تحويل وارد",
  "spare.movement.adjustment": "تسوية",
  "spare.alternatives": "القطع البديلة",
  "spare.compatibleEngines": "المحركات المتوافقة",
  "spare.noEngines": "لا توجد روابط توافق محركات في بيانات العرض.",
  "spare.noAlternatives": "لا توجد قطع بديلة في بيانات العرض.",
  "spare.form.addTitle": "إضافة قطعة غيار",
  "spare.form.editTitle": "تعديل قطعة غيار",
  "spare.form.addHint":
    "ينشئ سجل قطعة غيار متخصصًا وصنفًا مرتبطًا في الكتالوج (نوع الصنف: قطعة غيار).",
  "spare.form.save": "حفظ قطعة الغيار",
  "spare.form.saving": "جاري الحفظ…",
  "spare.form.saveSuccess": "تم حفظ قطعة الغيار.",
  "spare.form.saveError": "تعذر حفظ قطعة الغيار في هذا المتصفح.",
  "spare.form.duplicatePart": "رقم القطعة موجود مسبقًا.",
  "spare.form.selectItem": "اختر صنفًا من الكتالوج…",
  "spare.form.searchItems": "ابحث بالكود أو الاسم أو رقم القطعة…",
  "spare.form.noItems": "لا توجد أصناف مطابقة",
  "spare.form.newItemCode": "توليد كود صنف جديد",
  "spare.form.sectionIdentity": "تعريف القطعة",
  "spare.form.sectionCatalog": "الكتالوج والتسعير",
  "spare.form.sectionCompat": "التوافق والأرقام المرجعية",
  "spare.form.crossRefHint": "افصل الأكواد بفواصل.",
  "spare.form.enginesHint": "روابط محركات تجريبية (اختياري).",
  "spare.form.altsHint": "قطع غيار أخرى كبدائل (اختياري).",
  "spare.wizard.step1": "الهوية",
  "spare.wizard.step2": "التصنيف",
  "spare.wizard.step3": "التسعير والمخزون",
  "spare.wizard.step4": "التوافق",
  "spare.wizard.step5": "المراجعة",
  "spare.wizard.stepLabel": "الخطوة {current} من {total}",
  "spare.wizard.next": "متابعة",
  "spare.wizard.back": "رجوع",
  "spare.wizard.create": "إنشاء قطعة الغيار",
  "spare.wizard.saveChanges": "حفظ التغييرات",
  "spare.wizard.done": "تم",
  "spare.wizard.openRecord": "فتح قطعة الغيار",
  "spare.wizard.compatOptional":
    "روابط التوافق اختيارية — يمكنك الإنهاء دون اختيار محركات أو بدائل.",
  "spare.wizard.classifyHint":
    "التصنيف وبلد المنشأ يساعدان الفريق على إيجاد القطعة البحرية بسرعة.",
  "spare.wizard.enginesSelected": "{count} محرك محدد",
  "spare.wizard.altsSelected": "{count} بديل محدد",
  "spare.wizard.reviewHint": "راجع البيانات قبل الحفظ في هذا المتصفح.",
  "spare.delete": "حذف قطعة الغيار",
  "spare.deleteConfirm.title": "حذف قطعة الغيار؟",
  "spare.deleteConfirm.body":
    "يزيل سجل قطعة الغيار المتخصص والصنف المرتبط من هذا المتصفح. تُمسح روابط الموردين لذلك الصنف.",
  "spare.deleteConfirm.confirm": "حذف",
  "spare.deleteSuccess": "تم حذف قطعة الغيار.",

  "engines.title": "المحركات البحرية",
  "engines.subtitle":
    "إدارة بيانات المحركات وربطها بقطع الغيار المتوافقة والبديلة",
  "engines.add": "إضافة محرك جديد",
  "engines.searchPlaceholder":
    "بحث بالشركة المصنعة أو الموديل أو الرقم المسلسل…",
  "engines.searchAction": "بحث",
  "engines.kpi.total": "إجمالي المحركات",
  "engines.kpi.active": "محركات نشطة",
  "engines.kpi.manufacturers": "الشركات المصنعة",
  "engines.kpi.withParts": "محركات مرتبطة بقطع الغيار",
  "engines.kpi.withItem": "محركات مرتبطة بأصناف",
  "engines.kpi.avgHp": "متوسط القدرة",
  "engines.kpi.unlinked": "محركات بدون ربط",
  "engines.col.image": "الصورة",
  "engines.col.manufacturer": "الشركة المصنعة",
  "engines.col.model": "الموديل",
  "engines.col.year": "سنة الصنع",
  "engines.col.hp": "القدرة (HP)",
  "engines.col.serial": "الرقم المسلسل",
  "engines.col.origin": "بلد المنشأ",
  "engines.col.item": "الصنف المرتبط",
  "engines.col.parts": "قطع الغيار المرتبطة",
  "engines.col.status": "الحالة",
  "engines.filter.yearFrom": "سنة من",
  "engines.filter.yearTo": "سنة إلى",
  "engines.filter.hpFrom": "قدرة من",
  "engines.filter.hpTo": "قدرة إلى",
  "engines.filter.linkStatus": "ربط قطع الغيار",
  "engines.filter.linkLinked": "مرتبط",
  "engines.filter.linkUnlinked": "بدون ربط",
  "engines.sort.modelAsc": "الموديل أ–ي",
  "engines.sort.modelDesc": "الموديل ي–أ",
  "engines.sort.hpDesc": "أعلى قدرة",
  "engines.sort.yearDesc": "الأحدث سنة",
  "engines.sort.manufacturerAsc": "المصنّع أ–ي",
  "engines.details": "تفاصيل المحرك",
  "engines.notFound": "المحرك غير موجود",
  "engines.backToList": "العودة إلى المحركات",
  "engines.tab.overview": "نظرة عامة",
  "engines.tab.parts": "قطع الغيار المتوافقة",
  "engines.tab.alternatives": "القطع البديلة",
  "engines.tab.sales": "سجل المبيعات",
  "engines.tab.documents": "المستندات",
  "engines.tab.activity": "النشاط",
  "engines.section.identity": "هوية المحرك",
  "engines.section.specs": "المواصفات الفنية",
  "engines.section.parts": "قطع الغيار المتوافقة",
  "engines.section.item": "صنف الكتالوج",
  "engines.section.description": "الوصف",
  "engines.section.additional": "معلومات إضافية",
  "engines.section.summary": "ملخص المحرك",
  "engines.section.alternatives": "القطع البديلة",
  "engines.compatibleParts": "قطع الغيار المتوافقة",
  "engines.noParts": "لا توجد قطع غيار مرتبطة بهذا المحرك.",
  "engines.noAlternatives":
    "لا توجد قطع بديلة مرتبطة من قطع غيار هذا المحرك.",
  "engines.docsEmpty": "لا توجد مستندات مرفقة بعد.",
  "engines.specsEmpty": "لا توجد مواصفات فنية مسجّلة.",
  "engines.descEmpty": "لا يوجد وصف مسجّل.",
  "engines.meta.created": "تاريخ الإنشاء",
  "engines.meta.updated": "آخر تحديث",
  "engines.meta.added": "تاريخ الإضافة",
  "engines.detail.kpi.hp": "القدرة بالحصان",
  "engines.detail.kpi.year": "سنة الصنع",
  "engines.detail.kpi.sales": "سجل المبيعات",
  "engines.detail.kpi.parts": "قطع الغيار المرتبطة",
  "engines.detail.edit": "تعديل",
  "engines.detail.otherActions": "إجراءات أخرى",
  "engines.detail.manageLinks": "إدارة الربط",
  "engines.detail.copySerial": "نسخ الرقم المسلسل",
  "engines.detail.stock": "رصيد المخزون",
  "engines.detail.salesUnavailable": "—",
  "engines.activity.localNote":
    "النشاط محفوظ في هذا المتصفح فقط — وليس سجل تدقيق على الخادم.",
  "engines.activity.empty": "لا يوجد نشاط مسجّل بعد.",
  "engines.statusConfirm.titleActivate": "تنشيط المحرك؟",
  "engines.statusConfirm.titleDeactivate": "إلغاء تنشيط المحرك؟",
  "engines.statusConfirm.bodyActivate":
    "سيظهر المحرك كنشط في القوائم وخيارات الاختيار.",
  "engines.statusConfirm.bodyDeactivate":
    "سيُعلَّم المحرك كغير نشط. تُحتفظ بروابط قطع الغيار.",
  "engines.statusConfirm.confirmActivate": "تنشيط",
  "engines.statusConfirm.confirmDeactivate": "إلغاء التنشيط",
  "engines.hpUnit": "HP",
  "engines.form.addTitle": "إضافة محرك جديد",
  "engines.form.editTitle": "تعديل محرك",
  "engines.form.create": "حفظ المحرك",
  "engines.form.save": "حفظ المحرك",
  "engines.form.notes": "ملاحظات",
  "engines.form.description": "وصف المحرك",
  "engines.form.stepLabel": "الخطوة {current} من {total}",
  "engines.form.step.identity": "الهوية",
  "engines.form.step.classify": "المنشأ والتفاصيل",
  "engines.form.step.parts": "ربط قطع الغيار",
  "engines.form.step.review": "المراجعة",
  "engines.form.hint.identity":
    "أدخل الشركة المصنعة والموديل والرقم المسلسل وسنة الصنع والقدرة بالحصان.",
  "engines.form.hint.classify":
    "حدد بلد المنشأ والحالة وربط الصنف الاختياري والوصف.",
  "engines.form.hint.parts":
    "اربط قطع الغيار المتوافقة اختياريًا. يمكن تعديل الربط لاحقًا.",
  "engines.form.hint.review":
    "راجع بيانات المحرك قبل الحفظ. استخدم تعديل للرجوع إلى أي خطوة.",
  "engines.form.tab.basic": "البيانات الأساسية",
  "engines.form.tab.parts": "ربط قطع الغيار",
  "engines.form.tab.more": "معلومات إضافية",
  "engines.form.partsSearch": "ابحث عن قطع غيار للربط…",
  "engines.form.partsEmpty": "لا توجد قطع غيار مطابقة لهذا البحث.",
  "engines.form.partsSelected": "القطع المرتبطة",
  "engines.form.partsSelectedCount": "{count} مرتبطة",
  "engines.form.removePart": "إزالة",
  "engines.form.imageHint":
    "تظهر صورة المحرك من الصنف المرتبط عند توفرها.",
  "engines.form.duplicateSerial": "الرقم المسلسل موجود مسبقًا",
  "engines.form.invalidYear": "أدخل سنة صحيحة",
  "engines.form.persistFailed": "تعذر حفظ المحرك محليًا",
  "engines.form.saveFailed": "تعذر حفظ المحرك",
  "engines.form.saveSuccess": "تم حفظ المحرك",
  "engines.form.openRecord": "فتح المحرك",
  "engines.form.unsavedTitle": "تجاهل التغييرات؟",
  "engines.form.unsavedBody":
    "لديك تغييرات غير محفوظة. هل تريد الإغلاق دون حفظ؟",
  "engines.form.discard": "تجاهل",
  "engines.form.keepEditing": "متابعة التعديل",
  "engines.deactivate": "إلغاء التنشيط",
  "engines.activate": "تنشيط",
  "engines.deactivateSuccess": "تم إلغاء تنشيط المحرك",
  "engines.activateSuccess": "تم تنشيط المحرك",
  "engines.delete": "حذف",
  "engines.deleteSuccess": "تم حذف المحرك.",
  "engines.deleteConfirm.title": "حذف المحرك؟",
  "engines.deleteConfirm.body":
    "سيتم حذف المحرك نهائيًا ومسح روابط قطع الغيار المتوافقة معه في هذا المتصفح. لا يمكن التراجع عن هذا الإجراء.",
  "engines.deleteConfirm.confirm": "حذف",
  "engines.section.sales": "سجل المبيعات",
  "engines.salesEmpty":
    "لا يوجد سجل مبيعات بعد — وحدة المبيعات غير متصلة.",
  "engines.export": "تصدير",
  "engines.exportSuccess": "تم تصدير المحركات",
  "engines.import": "استيراد",
  "engines.importSoon":
    "استيراد المحركات غير متاح في هذا البناء الأمامي.",
  "spare.compat.degree": "درجة التوافق",
  "spare.compat.degree.exact": "تطابق كامل",
  "spare.compat.degree.high": "متوافق عالي",
  "spare.compat.degree.partial": "متوافق متوسط",
  "spare.compat.degree.functional": "متوافق منخفض",
  "spare.compat.notes": "ملاحظات",
  "xref.title": "المرجعيات والبدائل لقطع الغيار",
  "xref.subtitle":
    "إدارة القطع الأصلية والبديلة وأرقام المرجعيات بين الشركات المصنعة",
  "xref.add": "إضافة مرجعية جديدة",
  "xref.edit": "تعديل العلاقة",
  "xref.remove": "إزالة",
  "xref.import": "استيراد",
  "xref.export": "تصدير",
  "xref.importSoon":
    "استيراد علاقات الأرقام المرجعية بالجملة غير متاح في هذا البناء الأمامي.",
  "xref.import.help":
    "ارفع ملف CSV لعلاقات المرجعيات والأرقام المصنّفة. الصفوف غير الصالحة تُعرض ولا تُحفظ. الصفوف الصالحة تُحفظ فقط بعد التأكيد.",
  "xref.import.template": "تنزيل القالب",
  "xref.import.chooseFile": "اختيار CSV",
  "xref.import.total": "إجمالي الصفوف",
  "xref.import.valid": "صالحة",
  "xref.import.invalid": "غير صالحة",
  "xref.import.duplicates": "مكررة",
  "xref.import.missingParts": "قطع غير موجودة",
  "xref.import.downloadReport": "تنزيل تقرير التحقق",
  "xref.import.confirm": "أؤكد حفظ الصفوف الصالحة",
  "xref.import.commit": "تنفيذ الاستيراد",
  "xref.import.summary":
    "اكتمل الاستيراد — مستورد {imported}، متجاوز {skipped}، فاشل {failed}",
  "xref.import.parseError": "تعذر قراءة أو تحليل ملف CSV.",
  "xref.import.commitError": "فشل تنفيذ الاستيراد.",
  "xref.searchPlaceholder":
    "بحث بالاسم أو كود الصنف أو OEM أو رقم القطعة أو MPN أو كود مرجعي…",
  "xref.resetFilters": "إعادة تعيين",
  "xref.col.refType": "نوع المرجعية",
  "xref.col.refValue": "رقم المرجعية",
  "xref.refType.oem": "رقم OEM",
  "xref.refType.part_number": "رقم القطعة",
  "xref.refType.mpn": "رقم الشركة المصنعة",
  "xref.refType.alternative": "رقم قطعة بديلة",
  "xref.refType.compatible": "رقم قطعة متوافقة",
  "xref.kpi.relationships": "إجمالي علاقات المرجعيات",
  "xref.kpi.withAlternatives": "قطع لها بدائل",
  "xref.kpi.multiRef": "قطع لها أكثر من مرجعية",
  "xref.kpi.needsReview": "تحتاج مراجعة",
  "xref.kpi.originals": "قطع أصلية",
  "xref.kpi.withCodes": "قطع لها أكواد",
  "xref.kpi.exact": "تطابق تام",
  "xref.col.original": "القطعة الأصلية",
  "xref.col.alternative": "القطعة البديلة",
  "xref.col.degree": "درجة التوافق",
  "xref.col.notes": "ملاحظات",
  "xref.col.oem": "رقم OEM / القطعة",
  "xref.col.altOem": "رقم OEM / القطعة البديلة",
  "xref.col.mpn": "MPN",
  "xref.col.item": "كود الصنف",
  "xref.col.codes": "أكواد مرجعية",
  "xref.kind.alternative": "قطعة بديلة",
  "xref.kind.compatible": "قطعة متوافقة",
  "xref.sort.originalAsc": "الأصلية أ–ي",
  "xref.sort.originalDesc": "الأصلية ي–أ",
  "xref.sort.altAsc": "البديلة أ–ي",
  "xref.sort.degreeAsc": "الدرجة أ–ي",
  "xref.sort.updatedDesc": "الأحدث تحديثًا",
  "xref.empty": "لا توجد علاقات بدائل بعد.",
  "xref.emptyFiltered": "لا توجد علاقات مطابقة للمرشحات الحالية.",
  "xref.form.createTitle": "إضافة مرجعية جديدة",
  "xref.form.editTitle": "تعديل المرجعية",
  "xref.form.tab.basic": "معلومات أساسية",
  "xref.form.tab.extra": "معلومات إضافية",
  "xref.form.original": "القطعة الأصلية",
  "xref.form.alternative": "القطعة البديلة",
  "xref.form.degree": "درجة التوافق",
  "xref.form.relationshipType": "نوع العلاقة",
  "xref.form.notes": "ملاحظات",
  "xref.form.codes": "أكواد مرجعية (للأصلية)",
  "xref.form.codesHint":
    "وسوم حرة على القطعة الأصلية (مثل OEM:… أو ALT:… أو XREF:…). افصل بفواصل.",
  "xref.form.pickPart": "اختر قطعة غيار…",
  "xref.form.searchParts": "بحث بالاسم أو الكود أو OEM…",
  "xref.form.noParts": "لا توجد قطع مطابقة.",
  "xref.form.save": "حفظ المرجعية",
  "xref.form.saved": "تم حفظ العلاقة",
  "xref.form.error.self": "لا يمكن أن تكون القطعة بديلاً لنفسها.",
  "xref.form.error.duplicate": "هذه العلاقة موجودة مسبقًا.",
  "xref.form.error.missing": "اختر قطعة أصلية وبديلة صالحتين.",
  "xref.form.error.generic": "تعذر حفظ العلاقة.",
  "xref.wizard.step1": "القطع",
  "xref.wizard.step2": "العلاقة",
  "xref.wizard.step3": "التفاصيل",
  "xref.wizard.step4": "المراجعة",
  "xref.wizard.stepLabel": "الخطوة {current} من {total}",
  "xref.wizard.step1Hint":
    "اختر قطعة الغيار الأصلية والقطعة البديلة أو المتوافقة معها.",
  "xref.wizard.step2Hint":
    "حدد إن كانت العلاقة بديلًا أو توافقًا، ودرجة التوافق.",
  "xref.wizard.step3Hint":
    "ملاحظات اختيارية وأكواد مرجعية حرة على القطعة الأصلية.",
  "xref.wizard.reviewHint": "راجع العلاقة قبل الحفظ.",
  "xref.wizard.next": "متابعة",
  "xref.wizard.back": "رجوع",
  "xref.wizard.create": "إنشاء المرجعية",
  "xref.wizard.saveChanges": "حفظ التغييرات",
  "xref.wizard.saving": "جاري الحفظ…",
  "xref.wizard.done": "تم",
  "xref.wizard.unsaved": "تجاهل تغييرات المرجعية غير المحفوظة؟",
  "xref.removeTitle": "إزالة العلاقة؟",
  "xref.removeBody":
    "يزيل رابط البديل من قطعة الغيار الأصلية. سجلات القطع نفسها لا تُحذف.",
  "xref.removeConfirm": "إزالة الرابط",
  "xref.removeSuccess": "تمت إزالة العلاقة",
  "xref.overview": "مراجع القطعة الأصلية",
  "xref.detailTitle": "تفاصيل المرجعية",
  "xref.detail.updated": "آخر تحديث",
  "xref.openSpare": "فتح القطعة",
  "xref.selectOriginal": "اختر علاقة لمعاينة المراجع.",
};

export function tc(locale: Locale, key: CatalogKey): string {
  return (locale === "ar" ? ar : en)[key];
}

export function tcCount(
  locale: Locale,
  key: CatalogKey,
  vars: Record<string, string | number>,
): string {
  let out = tc(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}
