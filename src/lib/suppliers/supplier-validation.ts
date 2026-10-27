import { ts } from "@/i18n/suppliers";
import type { Locale } from "@/types/i18n";
import type { SupplierFormValues } from "@/types/supplier";

export type SupplierFieldErrors = Partial<
  Record<keyof SupplierFormValues, string>
>;

export type SupplierFormScope =
  | "all"
  | "basic"
  | "contact"
  | "commercial"
  | "bank";

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  code: "",
  nameEn: "",
  nameAr: "",
  countryCode: "EG",
  category: "other",
  taxId: "",
  phone: "",
  email: "",
  whatsapp: "",
  contactPerson: "",
  website: "",
  addressEn: "",
  addressAr: "",
  paymentTerms: "",
  notesEn: "",
  notesAr: "",
  bankName: "",
  accountName: "",
  iban: "",
  swift: "",
  status: "active",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,}$/;
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,23}$/;

export function validateSupplierForm(
  values: SupplierFormValues,
  locale: Locale,
  scope: SupplierFormScope = "all",
  options?: { duplicateCode?: boolean },
): SupplierFieldErrors {
  const errors: SupplierFieldErrors = {};

  if (scope === "all" || scope === "basic") {
    if (!values.nameEn.trim()) {
      errors.nameEn = ts(locale, "suppliers.form.required");
    }
    if (!values.countryCode) {
      errors.countryCode = ts(locale, "suppliers.form.required");
    }
    const code = values.code.trim();
    if (code) {
      if (!CODE_RE.test(code)) {
        errors.code = ts(locale, "suppliers.form.invalidCode");
      } else if (options?.duplicateCode) {
        errors.code = ts(locale, "suppliers.form.duplicateCode");
      }
    }
  }

  if (scope === "all" || scope === "contact") {
    if (!values.phone.trim()) {
      errors.phone = ts(locale, "suppliers.form.required");
    } else if (!PHONE_RE.test(values.phone.trim())) {
      errors.phone = ts(locale, "suppliers.form.invalidPhone");
    }
    if (!values.email.trim()) {
      errors.email = ts(locale, "suppliers.form.required");
    } else if (!EMAIL_RE.test(values.email.trim())) {
      errors.email = ts(locale, "suppliers.form.invalidEmail");
    }
  }

  // Commercial + banking are optional — no hard annex requirements on create.

  return errors;
}

export function hasSupplierFieldErrors(errors: SupplierFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
