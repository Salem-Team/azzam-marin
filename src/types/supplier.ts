/** Frontend supplier record — mock-layer only; replace with API later. */

export type SupplierStatus = "active" | "inactive";

/** Catalog provenance — seed demo rows vs user-created in this browser. */
export type SupplierOrigin = "seed" | "user";

export type SupplierCategoryId =
  | "engines"
  | "spareParts"
  | "electrical"
  | "oilsFilters"
  | "other";

export type SupplierCountryCode =
  | "JP"
  | "DE"
  | "CN"
  | "AE"
  | "EG"
  | "NL"
  | "KR"
  | "IT"
  | "US"
  | "GB";

/** All monetary fields on a supplier use this reporting currency. */
export type SupplierReportingCurrency = "USD";

export type SupplierDocumentCategory =
  | "commercialRegistration"
  | "taxRegistration"
  | "agreement"
  | "bank"
  | "certificate"
  | "quotation"
  | "other";

export interface SupplierBankAccount {
  bankName: string;
  accountName: string;
  iban: string;
  swift: string;
  currency: SupplierReportingCurrency;
}

export interface SupplierDocumentMeta {
  id: string;
  supplierId: string;
  category: SupplierDocumentCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** ISO timestamp */
  uploadedAt: string;
  uploadedBy: string;
}

export interface SupplierRecord {
  id: string;
  /** Human-facing supplier code (unique within the catalog). */
  code: string;
  /** `seed` = INITIAL demo catalog; `user` = created in this browser. Normalized on read. */
  origin?: SupplierOrigin;
  nameEn: string;
  nameAr: string;
  countryCode: SupplierCountryCode;
  category: SupplierCategoryId;
  taxId: string;
  phone: string;
  email: string;
  whatsapp: string;
  contactPerson?: string;
  website?: string;
  addressEn?: string;
  addressAr?: string;
  paymentTerms?: string;
  bank: SupplierBankAccount;
  status: SupplierStatus;
  /** Total purchases in reporting currency (USD). */
  totalPurchases: number;
  /** Total payments in reporting currency (USD). */
  totalPayments: number;
  /** Outstanding balance = purchases − payments (USD). */
  balance: number;
  /** ISO date YYYY-MM-DD of last purchase/payment activity. */
  lastTransactionDate: string;
  foundedYear?: number;
  notesEn?: string;
  notesAr?: string;
  purchaseOrderIds: readonly string[];
  purchaseIds: readonly string[];
  paymentIds: readonly string[];
}

export interface SupplierFormValues {
  code: string;
  nameEn: string;
  nameAr: string;
  countryCode: SupplierCountryCode;
  category: SupplierCategoryId;
  taxId: string;
  phone: string;
  email: string;
  whatsapp: string;
  contactPerson: string;
  website: string;
  addressEn: string;
  addressAr: string;
  paymentTerms: string;
  notesEn: string;
  notesAr: string;
  bankName: string;
  accountName: string;
  iban: string;
  swift: string;
  status: SupplierStatus;
}

/** Outcome of a delete attempt — history-bearing suppliers must deactivate. */
export type SupplierRemovalMode = "delete" | "deactivate";

export interface SupplierRemovalPlan {
  mode: SupplierRemovalMode;
  hasHistory: boolean;
}

/** Pending upload held in the create wizard before supplier id exists. */
export interface PendingSupplierDocument {
  localId: string;
  file: File;
  category: SupplierDocumentCategory;
}
