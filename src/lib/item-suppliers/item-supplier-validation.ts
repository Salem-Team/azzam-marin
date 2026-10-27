import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";
import type { ItemSupplierLinkFormValues } from "@/types/item-supplier";

export type ItemSupplierFieldErrors = Partial<
  Record<keyof ItemSupplierLinkFormValues | "form", string>
>;

export const EMPTY_ITEM_SUPPLIER_FORM: ItemSupplierLinkFormValues = {
  supplierId: "",
  supplierItemCode: "",
  purchasePrice: "",
  currency: "",
  leadTimeDays: "",
  minimumOrderQuantity: "",
  notes: "",
  status: "active",
};

const NUM_RE = /^(?:\d+|\d*\.\d+)$/;

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!NUM_RE.test(t)) return Number.NaN;
  return Number(t);
}

export function validateItemSupplierForm(
  values: ItemSupplierLinkFormValues,
  locale: Locale,
  options?: {
    duplicate?: boolean;
    unknownSupplier?: boolean;
    inactiveSupplier?: boolean;
    unknownItem?: boolean;
  },
): ItemSupplierFieldErrors {
  const errors: ItemSupplierFieldErrors = {};
  const required = tc(locale, "items.link.required");

  if (!values.supplierId.trim()) {
    errors.supplierId = required;
  } else if (options?.unknownSupplier) {
    errors.supplierId = tc(locale, "items.link.unknownSupplier");
  } else if (options?.inactiveSupplier) {
    errors.supplierId = tc(locale, "items.link.inactiveSupplier");
  } else if (options?.duplicate) {
    errors.supplierId = tc(locale, "items.link.duplicate");
  }

  if (options?.unknownItem) {
    errors.form = tc(locale, "items.link.unknownItem");
  }

  // Purchase price is optional. Currency is required only when a price is entered.
  const price = parseOptionalNumber(values.purchasePrice);
  if (values.purchasePrice.trim()) {
    if (price == null || Number.isNaN(price) || price < 0) {
      errors.purchasePrice = tc(locale, "items.link.invalidNumber");
    } else if (!values.currency) {
      errors.currency = tc(locale, "items.link.currencyRequired");
    }
  }

  const lead = parseOptionalNumber(values.leadTimeDays);
  if (
    values.leadTimeDays.trim() &&
    (lead == null || Number.isNaN(lead) || lead < 0 || !Number.isInteger(lead))
  ) {
    errors.leadTimeDays = tc(locale, "items.link.invalidInteger");
  }

  const moq = parseOptionalNumber(values.minimumOrderQuantity);
  if (
    values.minimumOrderQuantity.trim() &&
    (moq == null || Number.isNaN(moq) || moq < 0)
  ) {
    errors.minimumOrderQuantity = tc(locale, "items.link.invalidNumber");
  }

  return errors;
}

export function hasItemSupplierFieldErrors(
  errors: ItemSupplierFieldErrors,
): boolean {
  return Object.keys(errors).length > 0;
}
