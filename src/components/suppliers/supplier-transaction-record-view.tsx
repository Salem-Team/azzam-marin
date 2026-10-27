"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import {
  findSupplierLinkedPayment,
  findSupplierLinkedPurchase,
} from "@/config/mock-supplier-ledger";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { formatIsoDate, formatMoney } from "@/lib/format";
import { supplierDetailsHref } from "@/lib/record-routes";
import { useLocale } from "@/providers/locale-provider";

export function SupplierPurchaseRecordView({ id }: { id: string }) {
  const { locale } = useLocale();
  const record = findSupplierLinkedPurchase(id);

  if (!record) {
    return <RecordNotFound id={id} backHref="/suppliers" />;
  }

  const supplier =
    locale === "ar" ? record.supplierAr : record.supplierEn;

  return (
    <PageFrame>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={supplierDetailsHref(record.supplierId, { tab: "purchases" })}
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {ts(locale, "suppliers.details.back")}
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.details.purchases")}
          </p>
          <h1 className="am-text-page-title mt-1 font-mono tracking-tight">
            {record.id}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--am-text-secondary)]">
            {supplier}
          </p>
        </div>
        <StatusBadge
          label={ts(
            locale,
            record.status === "received"
              ? "suppliers.purchase.received"
              : "suppliers.purchase.pending",
          )}
          tone={record.status === "received" ? "approved" : "pending"}
          className="px-2.5"
        />
      </div>
      <PageSurface fill={false} className="overflow-hidden">
        <dl className="divide-y divide-[var(--am-border-default)]">
          <InfoRow label={ts(locale, "suppliers.recent.id")} value={record.id} mono />
          <InfoRow label={ts(locale, "suppliers.col.name")} value={supplier} />
          <InfoRow
            label={ts(locale, "suppliers.col.amount")}
            value={formatMoney(record.amount, "USD", locale)}
          />
          <InfoRow
            label={ts(locale, "suppliers.col.lastTx")}
            value={formatIsoDate(record.date, locale)}
          />
        </dl>
      </PageSurface>
    </PageFrame>
  );
}

export function SupplierPaymentRecordView({ id }: { id: string }) {
  const { locale } = useLocale();
  const record = findSupplierLinkedPayment(id);

  if (!record) {
    return <RecordNotFound id={id} backHref="/suppliers" />;
  }

  const supplier =
    locale === "ar" ? record.supplierAr : record.supplierEn;
  const methodKey =
    record.method === "bankTransfer"
      ? "suppliers.pay.bankTransfer"
      : record.method === "swift"
        ? "suppliers.pay.swift"
        : "suppliers.pay.cash";

  return (
    <PageFrame>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={supplierDetailsHref(record.supplierId, { tab: "payments" })}
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {ts(locale, "suppliers.details.back")}
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.details.payments")}
          </p>
          <h1 className="am-text-page-title mt-1 font-mono tracking-tight">
            {record.id}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--am-text-secondary)]">
            {supplier}
          </p>
        </div>
        <StatusBadge
          label={ts(
            locale,
            record.status === "posted"
              ? "suppliers.pay.posted"
              : "suppliers.pay.pending",
          )}
          tone={record.status === "posted" ? "approved" : "pending"}
          className="px-2.5"
        />
      </div>
      <PageSurface fill={false} className="overflow-hidden">
        <dl className="divide-y divide-[var(--am-border-default)]">
          <InfoRow label={ts(locale, "suppliers.recent.id")} value={record.id} mono />
          <InfoRow label={ts(locale, "suppliers.col.name")} value={supplier} />
          <InfoRow
            label={ts(locale, "suppliers.details.method")}
            value={ts(locale, methodKey as SupplierKey)}
          />
          <InfoRow
            label={ts(locale, "suppliers.col.amount")}
            value={formatMoney(record.amount, "USD", locale)}
          />
          <InfoRow
            label={ts(locale, "suppliers.col.lastTx")}
            value={formatIsoDate(record.date, locale)}
          />
        </dl>
      </PageSurface>
    </PageFrame>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-[12px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-[13px] tabular-nums text-[var(--am-navy-900)]"
            : "text-[13px] font-medium text-[var(--am-navy-900)]"
        }
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function RecordNotFound({
  id,
  backHref,
}: {
  id: string;
  backHref: string;
}) {
  const { locale } = useLocale();
  return (
    <PageFrame>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={backHref}
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {ts(locale, "suppliers.details.back")}
        </Link>
      </div>
      <PageSurface className="items-center justify-center gap-3 p-8 text-center">
        <FileText
          className="size-8 text-[var(--am-text-secondary)]"
          aria-hidden
        />
        <p className="text-[14px] font-semibold text-[var(--am-text-primary)]">
          {ts(locale, "suppliers.details.notFound")}
        </p>
        <p
          className="font-mono text-[12px] text-[var(--am-text-secondary)]"
          dir="ltr"
        >
          {id}
        </p>
      </PageSurface>
    </PageFrame>
  );
}
