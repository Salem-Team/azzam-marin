/** Customer master — frontend AR/sales party. */

export type CustomerStatus = "active" | "inactive";

export type CustomerCountryCode =
  | "EG"
  | "AE"
  | "SA"
  | "US"
  | "GB"
  | "DE"
  | "IT"
  | "CN"
  | "JP"
  | "OTHER";

export interface CustomerRecord {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  countryCode: CustomerCountryCode;
  phone: string;
  email: string;
  whatsapp: string;
  taxId: string;
  addressEn: string;
  addressAr: string;
  notes: string;
  status: CustomerStatus;
  /** Demo AR fields — not a posted ledger. */
  totalSales: number;
  totalReceipts: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormValues {
  code: string;
  nameEn: string;
  nameAr: string;
  countryCode: CustomerCountryCode;
  phone: string;
  email: string;
  whatsapp: string;
  taxId: string;
  addressEn: string;
  addressAr: string;
  notes: string;
  status: CustomerStatus;
}
