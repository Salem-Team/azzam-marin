/**
 * Unified supplier activity feed (frontend adapter).
 * Merges client audit events with demo ledger transactions.
 * Titles/details are resolved at display time via i18n — not stored as prose.
 */

import { MOCK_USER } from "@/config/mock-shell";
import {
  listSupplierPayments,
  listSupplierPos,
  listSupplierPurchases,
  type LedgerPaymentMethod,
  type LedgerPoStatus,
} from "@/config/mock-supplier-ledger";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { formatIsoDate, formatMoney, formatTime } from "@/lib/format";
import {
  purchaseInvoiceDetailsHref,
  purchaseOrderDetailsHref,
  supplierDetailsHref,
  supplierPaymentDetailsHref,
} from "@/lib/record-routes";
import {
  listSupplierAudit,
  type SupplierAuditAction,
  type SupplierAuditEvent,
  type SupplierAuditMeta,
} from "@/lib/suppliers/supplier-audit";
import type { Locale } from "@/types/i18n";
import type { SupplierDocumentCategory, SupplierRecord } from "@/types/supplier";

/** Known frontend demo actor ids (resolved at display time). */
export type SupplierActivityActorId =
  | "demo-user"
  | "purchasing"
  | "finance";

export type SupplierActivityCategory =
  | "profile"
  | "status"
  | "document"
  | "order"
  | "purchase"
  | "payment";

export type SupplierActivityKind =
  | SupplierAuditAction
  | "supplier.po"
  | "supplier.purchase"
  | "supplier.payment";

export interface SupplierActivityItem {
  id: string;
  at: string;
  kind: SupplierActivityKind;
  category: SupplierActivityCategory;
  source: "audit" | "ledger";
  actor?: string;
  href?: string;
  meta: SupplierAuditMeta & {
    amount?: number;
    currency?: "USD";
    poStatus?: LedgerPoStatus;
    purchaseStatus?: "received" | "pending";
    paymentStatus?: "posted" | "pending";
    paymentMethod?: LedgerPaymentMethod;
    referenceId?: string;
    expectedDeliveryDate?: string;
    documentCategory?: SupplierDocumentCategory;
  };
}

const FIELD_LABEL_KEYS: Record<string, SupplierKey> = {
  code: "suppliers.form.code",
  nameEn: "suppliers.form.nameEn",
  nameAr: "suppliers.form.nameAr",
  countryCode: "suppliers.form.country",
  category: "suppliers.form.category",
  taxId: "suppliers.form.taxId",
  phone: "suppliers.form.phone",
  email: "suppliers.form.email",
  whatsapp: "suppliers.form.whatsapp",
  contactPerson: "suppliers.form.contactPerson",
  website: "suppliers.form.website",
  addressEn: "suppliers.form.addressEn",
  addressAr: "suppliers.form.addressAr",
  paymentTerms: "suppliers.form.paymentTerms",
  notesEn: "suppliers.form.notesEn",
  notesAr: "suppliers.form.notesAr",
  bankName: "suppliers.form.bankName",
  accountName: "suppliers.form.accountName",
  iban: "suppliers.form.iban",
  swift: "suppliers.form.swift",
  status: "suppliers.form.status",
  master: "suppliers.details.overview",
};

function categoryForAction(action: SupplierAuditAction): SupplierActivityCategory {
  if (action === "supplier.activate" || action === "supplier.deactivate") {
    return "status";
  }
  if (action.startsWith("supplier.document.")) return "document";
  return "profile";
}

function auditHref(
  event: SupplierAuditEvent,
): string | undefined {
  const category = categoryForAction(event.action);
  if (category === "document") {
    return supplierDetailsHref(event.supplierId, { tab: "documents" });
  }
  if (category === "status" || category === "profile") {
    return supplierDetailsHref(event.supplierId, { tab: "overview" });
  }
  return undefined;
}

function auditToItem(event: SupplierAuditEvent): SupplierActivityItem {
  return {
    id: event.id,
    at: event.at,
    kind: event.action,
    category: categoryForAction(event.action),
    source: "audit",
    actor: event.actor,
    href: auditHref(event),
    meta: {
      ...(event.meta ?? {}),
      fields: event.meta?.fields ?? event.fields,
    },
  };
}

function ledgerAt(isoDate: string, salt: string): string {
  let h = 0;
  for (let i = 0; i < salt.length; i += 1) {
    h = (h * 31 + salt.charCodeAt(i)) >>> 0;
  }
  const hour = 8 + (h % 10);
  const minute = (h * 7) % 60;
  const sec = (h * 13) % 60;
  return `${isoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(sec).padStart(2, "0")}.000Z`;
}

export function buildSupplierActivityFeed(
  supplier: SupplierRecord,
): SupplierActivityItem[] {
  const auditItems = listSupplierAudit(supplier.id).map(auditToItem);

  const orderItems: SupplierActivityItem[] = listSupplierPos(supplier.id).map(
    (po) => ({
      id: `act-po-${po.id}`,
      at: ledgerAt(po.date, po.id),
      kind: "supplier.po" as const,
      category: "order" as const,
      source: "ledger" as const,
      actor: "purchasing",
      href: purchaseOrderDetailsHref(po.id),
      meta: {
        referenceId: po.id,
        amount: po.amount,
        currency: po.currency,
        poStatus: po.status,
        expectedDeliveryDate: po.expectedDeliveryDate,
      },
    }),
  );

  const purchaseItems: SupplierActivityItem[] = listSupplierPurchases(
    supplier.id,
  ).map((pi) => ({
    id: `act-pi-${pi.id}`,
    at: ledgerAt(pi.date, pi.id),
    kind: "supplier.purchase" as const,
    category: "purchase" as const,
    source: "ledger" as const,
    actor: "purchasing",
    href: purchaseInvoiceDetailsHref(pi.id),
    meta: {
      referenceId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      purchaseStatus: pi.status,
    },
  }));

  const paymentItems: SupplierActivityItem[] = listSupplierPayments(
    supplier.id,
  ).map((pay) => ({
    id: `act-pay-${pay.id}`,
    at: ledgerAt(pay.date, pay.id),
    kind: "supplier.payment" as const,
    category: "payment" as const,
    source: "ledger" as const,
    actor: "finance",
    href: supplierPaymentDetailsHref(pay.id),
    meta: {
      referenceId: pay.id,
      amount: pay.amount,
      currency: pay.currency,
      paymentStatus: pay.status,
      paymentMethod: pay.method,
    },
  }));

  return [...auditItems, ...orderItems, ...purchaseItems, ...paymentItems].sort(
    (a, b) => {
      const byTime = Date.parse(b.at) - Date.parse(a.at);
      if (byTime !== 0) return byTime;
      return a.id.localeCompare(b.id);
    },
  );
}

function fill(
  locale: Locale,
  key: SupplierKey,
  vars: Record<string, string | number>,
): string {
  let out = ts(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function activityCategoryLabel(
  locale: Locale,
  category: SupplierActivityCategory,
): string {
  return ts(locale, `suppliers.activity.cat.${category}` as SupplierKey);
}

export function activityFieldLabels(
  locale: Locale,
  fields: string[] | undefined,
): string[] {
  if (!fields?.length) return [];
  return fields.map((field) => {
    const key = FIELD_LABEL_KEYS[field];
    return key ? ts(locale, key) : field;
  });
}

export function formatActivityTitle(
  locale: Locale,
  item: SupplierActivityItem,
): string {
  const code = item.meta.code ?? "";
  const fileName = item.meta.fileName ?? "";
  const ref = item.meta.referenceId ?? "";

  switch (item.kind) {
    case "supplier.create":
      return fill(locale, "suppliers.activity.create", { code });
    case "supplier.update":
      return fill(locale, "suppliers.activity.update", { code });
    case "supplier.activate":
      return fill(locale, "suppliers.activity.activate", { code });
    case "supplier.deactivate":
      return fill(
        locale,
        item.meta.reason === "history-present"
          ? "suppliers.activity.deactivateHistory"
          : "suppliers.activity.deactivate",
        { code },
      );
    case "supplier.delete":
      return fill(locale, "suppliers.activity.delete", { code });
    case "supplier.document.upload":
      return fill(locale, "suppliers.activity.docUpload", { fileName });
    case "supplier.document.remove":
      return fill(locale, "suppliers.activity.docRemove", {
        fileName: fileName || item.meta.documentId || "",
      });
    case "supplier.document.replace":
      return fill(locale, "suppliers.activity.docReplace", { fileName });
    case "supplier.po":
      return fill(locale, "suppliers.activity.po", { id: ref });
    case "supplier.purchase":
      return fill(locale, "suppliers.activity.purchase", { id: ref });
    case "supplier.payment":
      return fill(locale, "suppliers.activity.payment", { id: ref });
    default:
      return ts(locale, "suppliers.details.activity");
  }
}

export function formatActivityDetail(
  locale: Locale,
  item: SupplierActivityItem,
): string | null {
  const parts: string[] = [];

  if (item.kind === "supplier.update") {
    const labels = activityFieldLabels(locale, item.meta.fields);
    if (labels.length) {
      parts.push(
        fill(locale, "suppliers.activity.fieldsChanged", {
          fields: labels.join(locale === "ar" ? "، " : ", "),
        }),
      );
    }
  }

  if (item.meta.documentCategory) {
    parts.push(
      ts(
        locale,
        `suppliers.doc.${item.meta.documentCategory}` as SupplierKey,
      ),
    );
  }

  if (item.meta.amount != null && item.meta.currency) {
    parts.push(formatMoney(item.meta.amount, item.meta.currency, locale));
  }

  if (item.meta.poStatus) {
    parts.push(ts(locale, `suppliers.po.${item.meta.poStatus}` as SupplierKey));
  }
  if (item.meta.expectedDeliveryDate) {
    parts.push(
      fill(locale, "suppliers.activity.expectedDelivery", {
        date: formatIsoDate(item.meta.expectedDeliveryDate, locale),
      }),
    );
  }
  if (item.meta.purchaseStatus) {
    parts.push(
      ts(
        locale,
        item.meta.purchaseStatus === "received"
          ? "suppliers.purchase.received"
          : "suppliers.purchase.pending",
      ),
    );
  }
  if (item.meta.paymentMethod) {
    parts.push(
      ts(
        locale,
        item.meta.paymentMethod === "bankTransfer"
          ? "suppliers.pay.bankTransfer"
          : item.meta.paymentMethod === "swift"
            ? "suppliers.pay.swift"
            : "suppliers.pay.cash",
      ),
    );
  }
  if (item.meta.paymentStatus) {
    parts.push(
      ts(
        locale,
        item.meta.paymentStatus === "posted"
          ? "suppliers.pay.posted"
          : "suppliers.pay.pending",
      ),
    );
  }

  if (!parts.length) return null;
  return parts.join(locale === "ar" ? " · " : " · ");
}

export function formatActivityDate(
  locale: Locale,
  iso: string,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Clock portion — product standard 12-hour via `formatTime`. */
export function formatActivityTime(
  locale: Locale,
  iso: string,
): string {
  return formatTime(iso, locale);
}

/** Combined date · time for compact contexts. */
export function formatActivityWhen(
  locale: Locale,
  iso: string,
): string {
  const date = formatActivityDate(locale, iso);
  const time = formatActivityTime(locale, iso);
  if (!time) return date;
  return `${date} · ${time}`;
}

export function formatActivityActor(
  locale: Locale,
  actor: string | undefined,
): string {
  const id = (actor ?? "demo-user") as SupplierActivityActorId | string;
  if (id === "demo-user" || id === "user-ahmed-azzam") {
    return locale === "ar" ? MOCK_USER.nameAr : MOCK_USER.name;
  }
  if (id === "purchasing") {
    return ts(locale, "suppliers.activity.actorPurchasing");
  }
  if (id === "finance") {
    return ts(locale, "suppliers.activity.actorFinance");
  }
  return actor ?? (locale === "ar" ? MOCK_USER.nameAr : MOCK_USER.name);
}

/** Compare master records for audit field lists (no secret values). */
export function diffSupplierMasterFields(
  before: SupplierRecord,
  after: SupplierRecord,
): string[] {
  const pairs: [string, string | number | undefined, string | number | undefined][] =
    [
      ["code", before.code, after.code],
      ["nameEn", before.nameEn, after.nameEn],
      ["nameAr", before.nameAr, after.nameAr],
      ["countryCode", before.countryCode, after.countryCode],
      ["category", before.category, after.category],
      ["taxId", before.taxId, after.taxId],
      ["phone", before.phone, after.phone],
      ["email", before.email, after.email],
      ["whatsapp", before.whatsapp, after.whatsapp],
      ["contactPerson", before.contactPerson, after.contactPerson],
      ["website", before.website, after.website],
      ["addressEn", before.addressEn, after.addressEn],
      ["addressAr", before.addressAr, after.addressAr],
      ["paymentTerms", before.paymentTerms, after.paymentTerms],
      ["notesEn", before.notesEn, after.notesEn],
      ["notesAr", before.notesAr, after.notesAr],
      ["bankName", before.bank.bankName, after.bank.bankName],
      ["accountName", before.bank.accountName, after.bank.accountName],
      ["iban", before.bank.iban, after.bank.iban],
      ["swift", before.bank.swift, after.bank.swift],
      ["status", before.status, after.status],
    ];
  return pairs
    .filter(([, a, b]) => (a ?? "") !== (b ?? ""))
    .map(([key]) => key);
}
