/**
 * Frontend data-access boundary for Supplier Management.
 *
 * UI components should prefer these entry points so a future API adapter
 * can replace browser persistence without rewriting every view.
 *
 * Persistence today:
 * - Supplier master → localStorage (`supplier-persist.ts` via `suppliers-store.ts`)
 * - Documents → IndexedDB blobs + localStorage meta (`supplier-documents.ts`)
 * - Audit → localStorage (`supplier-audit.ts`) — not a server audit trail
 * - PO / purchases / payments / statement → deterministic demo ledger
 *   (`mock-supplier-ledger.ts` / `mock-supplier-analytics.ts`)
 */

export {
  createSupplier,
  findSupplierInStore,
  generateSupplierCode,
  generateSupplierId,
  getLastSupplierPersistError,
  getSupplierById,
  getSuppliersSnapshot,
  isSupplierCodeTaken,
  listSuppliers,
  planSupplierRemoval,
  removeSupplier,
  setSupplierStatus,
  supplierToFormValues,
  updateSupplier,
  useSupplierSummary,
  useSuppliers,
  useSuppliersHydrated,
} from "@/lib/suppliers-store";

export {
  addSupplierDocument,
  getSupplierDocumentBlob,
  listSupplierDocuments,
  removeSupplierDocument,
  replaceSupplierDocument,
} from "@/lib/suppliers/supplier-documents";

export {
  listSupplierAudit,
  recordSupplierAudit,
} from "@/lib/suppliers/supplier-audit";

export {
  buildSupplierActivityFeed,
  formatActivityTitle,
  formatActivityDetail,
} from "@/lib/suppliers/supplier-activity";

export {
  findSupplierLinkedPayment,
  findSupplierLinkedPo,
  findSupplierLinkedPurchase,
  listSupplierPayments,
  listSupplierPos,
  listSupplierPurchases,
} from "@/config/mock-supplier-ledger";

export { getSupplierAnalytics } from "@/config/mock-supplier-analytics";

export {
  filterStatementLines,
  statementLinesToCsv,
  type StatementFilterInput,
  type StatementMovementType,
} from "@/lib/suppliers/supplier-statement";
