/** USD/EGP exchange rate record — frontend pricing support. */

export interface ExchangeRateRecord {
  id: string;
  /** Units of EGP per 1 USD */
  egpPerUsd: number;
  effectiveDate: string;
  source: "manual" | "system" | "bank_demo";
  notes: string;
  createdAt: string;
}

export interface ExchangeRateFormValues {
  egpPerUsd: string;
  effectiveDate: string;
  notes: string;
}
