/** Canonical frontend record detail routes (mock-friendly, App Router). */

export function itemDetailsHref(itemCode: string): string {
  return `/items/${encodeURIComponent(itemCode)}`;
}

export function sparePartDetailsHref(id: string): string {
  return `/spare-parts/${encodeURIComponent(id)}`;
}

export function marineEngineDetailsHref(id: string): string {
  return `/marine-engines/${encodeURIComponent(id)}`;
}

/**
 * Legacy helper used by low-stock / older mocks keyed by part number.
 * Prefers spare-part detail when a part match exists; otherwise item by part number.
 */
export function productDetailsHref(partNumber: string): string {
  return `/products/${encodeURIComponent(partNumber)}`;
}

export function purchaseOrderDetailsHref(id: string): string {
  return `/purchase-orders/${encodeURIComponent(id)}`;
}

export function purchaseInvoiceDetailsHref(id: string): string {
  return `/purchases/${encodeURIComponent(id)}`;
}

export function supplierPaymentDetailsHref(id: string): string {
  return `/supplier-payments/${encodeURIComponent(id)}`;
}

export function supplierDetailsHref(
  id: string,
  options?: { tab?: string },
): string {
  const base = `/suppliers/${encodeURIComponent(id)}`;
  if (!options?.tab) return base;
  return `${base}?tab=${encodeURIComponent(options.tab)}`;
}

export function decodeRecordParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}
