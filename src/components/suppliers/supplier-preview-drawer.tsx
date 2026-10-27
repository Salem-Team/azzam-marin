"use client";

import Link from "next/link";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Building2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { CountryFlag } from "@/components/suppliers/country-flag";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import { formatMoney, maskAccountNumber } from "@/lib/format";
import { supplierDetailsHref } from "@/lib/record-routes";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord } from "@/types/supplier";

type PreviewTab =
  | "overview"
  | "contact"
  | "bank"
  | "orders"
  | "purchases"
  | "more";

interface SupplierPreviewDrawerProps {
  supplier: SupplierRecord | null;
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onEdit: (supplier: SupplierRecord) => void;
}

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

function supplierInitials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!cleaned) return "—";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function SupplierPreviewDrawer({
  supplier,
  locale,
  open,
  onClose,
  onEdit,
}: SupplierPreviewDrawerProps) {
  const titleId = useId();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open || !supplier) return null;

  return createPortal(
    <div className="fixed inset-0 z-[75] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--am-navy-950)_36%,transparent)] backdrop-blur-[1px]"
        aria-label={ts(locale, "suppliers.form.cancel")}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] flex h-full w-full flex-col",
          "border-s border-[var(--am-border-default)] bg-[var(--am-surface-raised)]",
          "shadow-[-12px_0_40px_color-mix(in_srgb,var(--am-navy-950)_14%,transparent)]",
          "max-w-none sm:max-w-[min(440px,92vw)] lg:max-w-[min(480px,40vw)]",
        )}
      >
        <PreviewBody
          key={supplier.id}
          supplier={supplier}
          locale={locale}
          titleId={titleId}
          onClose={onClose}
          onEdit={onEdit}
        />
      </aside>
    </div>,
    document.body,
  );
}

function PreviewBody({
  supplier,
  locale,
  titleId,
  onClose,
  onEdit,
}: {
  supplier: SupplierRecord;
  locale: Locale;
  titleId: string;
  onClose: () => void;
  onEdit: (supplier: SupplierRecord) => void;
}) {
  const [tab, setTab] = useState<PreviewTab>("overview");
  const [messageNote, setMessageNote] = useState(false);
  const name = locale === "ar" ? supplier.nameAr : supplier.nameEn;
  const country =
    locale === "ar"
      ? SUPPLIER_COUNTRY_LABELS[supplier.countryCode].ar
      : SUPPLIER_COUNTRY_LABELS[supplier.countryCode].en;
  const notes =
    locale === "ar"
      ? supplier.notesAr || supplier.notesEn
      : supplier.notesEn || supplier.notesAr;
  const address =
    locale === "ar"
      ? supplier.addressAr || supplier.addressEn
      : supplier.addressEn || supplier.addressAr;
  const categoryLabel = ts(
    locale,
    `suppliers.category.${supplier.category}` as SupplierKey,
  );

  const tabs: { id: PreviewTab; label: string; count?: number }[] = [
    { id: "overview", label: ts(locale, "suppliers.details.overview") },
    { id: "contact", label: ts(locale, "suppliers.preview.contact") },
    { id: "bank", label: ts(locale, "suppliers.details.bank") },
    {
      id: "orders",
      label: ts(locale, "suppliers.details.orders"),
      count: supplier.purchaseOrderIds.length,
    },
    {
      id: "purchases",
      label: ts(locale, "suppliers.details.purchases"),
      count: supplier.purchaseIds.length,
    },
    { id: "more", label: ts(locale, "suppliers.preview.more") },
  ];

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--am-border-default)] px-3.5 py-3 sm:px-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_8%,white)_100%)] text-[11px] font-bold tracking-wide text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]"
            title={name}
            aria-hidden
          >
            {supplierInitials(name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2
                id={titleId}
                className="text-[14px] font-semibold leading-snug text-[var(--am-navy-900)] break-words sm:text-[15px]"
              >
                {name}
              </h2>
              <StatusBadge
                label={ts(
                  locale,
                  supplier.status === "active"
                    ? "suppliers.status.active"
                    : "suppliers.status.inactive",
                )}
                tone={supplier.status === "active" ? "approved" : "out"}
                className="px-2"
              />
              <StatusBadge
                label={categoryLabel}
                tone="sales"
                className="px-2"
              />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[var(--am-text-secondary)]">
              <CountryFlag code={supplier.countryCode} />
              <span>{country}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          className="am-focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)]"
          onClick={onClose}
          aria-label={ts(locale, "suppliers.form.cancel")}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div
        className="flex shrink-0 gap-0.5 overflow-x-auto overscroll-x-contain border-b border-[var(--am-border-default)] px-1.5 [scrollbar-width:thin]"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={
              tab === t.id
                ? "am-focus-ring shrink-0 border-b-2 border-[var(--am-blue-700)] px-2.5 py-2 text-[11.5px] font-semibold text-[var(--am-blue-700)]"
                : "am-focus-ring shrink-0 border-b-2 border-transparent px-2.5 py-2 text-[11.5px] font-medium text-[var(--am-text-secondary)] hover:text-[var(--am-navy-900)]"
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count != null && t.count > 0 ? (
              <span className="ms-1 tabular-nums">({t.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:px-4 sm:py-4">
        {tab === "overview" ? (
          <div className="space-y-3.5">
            {/* Brand-safe banner — not a fabricated facility photo */}
            <div className="relative overflow-hidden rounded-[var(--am-radius-lg)] bg-[linear-gradient(135deg,var(--am-navy-900)_0%,var(--am-blue-700)_55%,var(--am-success-600)_100%)] px-4 py-7">
              <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_30%,white_0_1px,transparent_1.5px)] [background-size:14px_14px]" />
              <div className="relative flex items-center gap-3 text-white">
                <Building2 className="size-7 opacity-90" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{name}</p>
                  <p className="mt-0.5 text-[11px] text-white/75">
                    {categoryLabel} · {country}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: ts(locale, "suppliers.kpi.purchases"),
                  value: formatMoney(supplier.totalPurchases, "USD", locale),
                },
                {
                  label: ts(locale, "suppliers.col.balance"),
                  value: formatMoney(supplier.balance, "USD", locale),
                },
                {
                  label: ts(locale, "suppliers.details.orders"),
                  value: String(supplier.purchaseOrderIds.length),
                },
                {
                  label: ts(locale, "suppliers.details.payments"),
                  value: String(supplier.paymentIds.length),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 py-2.5 shadow-[var(--am-shadow-sm)]"
                >
                  <p className="truncate text-[10.5px] font-medium text-[var(--am-text-secondary)]">
                    {m.label}
                  </p>
                  <p className="mt-1 text-[13.5px] font-bold tabular-nums tracking-tight text-[var(--am-navy-900)]">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]">
              <div>
                <dt className="text-[11px] text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.col.category")}
                </dt>
                <dd className="mt-0.5 font-semibold text-[var(--am-navy-900)]">
                  {categoryLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.col.country")}
                </dt>
                <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-[var(--am-navy-900)]">
                  <CountryFlag code={supplier.countryCode} />
                  {country}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.details.founded")}
                </dt>
                <dd
                  className="mt-0.5 font-semibold text-[var(--am-navy-900)]"
                  dir="ltr"
                >
                  {supplier.foundedYear ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.details.taxId")}
                </dt>
                <dd
                  className="mt-0.5 font-mono text-[11.5px] font-semibold tabular-nums text-[var(--am-navy-900)]"
                  dir="ltr"
                >
                  {supplier.taxId || "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.details.website")}
                </dt>
                <dd className="mt-0.5 font-semibold text-[var(--am-blue-700)]">
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline"
                      dir="ltr"
                    >
                      <Globe className="size-3.5" aria-hidden />
                      {supplier.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>

            {notes ? (
              <div>
                <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {ts(locale, "suppliers.details.notes")}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--am-navy-900)]">
                  {notes}
                </p>
              </div>
            ) : null}

            <div className="space-y-2 border-t border-[var(--am-border-default)] pt-3">
              <p className="text-[11px] font-semibold text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.preview.contact")}
              </p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 py-2">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                    <Phone className="size-3.5" aria-hidden />
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                    {supplier.phone}
                  </span>
                </li>
                <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 py-2">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]">
                    <MessageCircle className="size-3.5" aria-hidden />
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                    {supplier.whatsapp}
                  </span>
                </li>
                <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 py-2 sm:col-span-2">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                    <Mail className="size-3.5" aria-hidden />
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                    {supplier.email}
                  </span>
                </li>
                {address ? (
                  <li className="inline-flex items-start gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 py-2 sm:col-span-2">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]">
                      <MapPin className="size-3.5" aria-hidden />
                    </span>
                    <span className="text-[12px] leading-relaxed text-[var(--am-navy-900)]">
                      {address}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "contact" ? (
          <ul className="grid grid-cols-1 gap-2">
            <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                <Phone className="size-3.5" aria-hidden />
              </span>
              <span className="truncate text-[13px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                {supplier.phone}
              </span>
            </li>
            <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]">
                <MessageCircle className="size-3.5" aria-hidden />
              </span>
              <span className="truncate text-[13px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                {supplier.whatsapp}
              </span>
            </li>
            <li className="inline-flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                <Mail className="size-3.5" aria-hidden />
              </span>
              <span className="truncate text-[13px] font-medium text-[var(--am-navy-900)]" dir="ltr">
                {supplier.email}
              </span>
            </li>
            {address ? (
              <li className="inline-flex items-start gap-2.5 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]">
                  <MapPin className="size-3.5" aria-hidden />
                </span>
                <span className="text-[12.5px] leading-relaxed text-[var(--am-navy-900)]">
                  {address}
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}

        {tab === "bank" ? (
          <dl className="space-y-3 text-[13px]">
            <div>
              <dt className="text-[12px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.form.bankName")}
              </dt>
              <dd className="font-medium text-[var(--am-navy-900)]">
                {supplier.bank.bankName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.form.accountName")}
              </dt>
              <dd className="font-medium text-[var(--am-navy-900)]">
                {supplier.bank.accountName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.form.iban")}
              </dt>
              <dd
                className="font-mono text-[12.5px] text-[var(--am-navy-900)]"
                dir="ltr"
              >
                {supplier.bank.iban
                  ? maskAccountNumber(supplier.bank.iban)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.form.swift")}
              </dt>
              <dd
                className="font-mono text-[12.5px] text-[var(--am-navy-900)]"
                dir="ltr"
              >
                {supplier.bank.swift || "—"}
              </dd>
            </div>
          </dl>
        ) : null}

        {tab === "orders" || tab === "purchases" ? (
          <ul className="divide-y divide-[var(--am-border-default)] rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)]">
            {(tab === "orders"
              ? supplier.purchaseOrderIds
              : supplier.purchaseIds
            ).length === 0 ? (
              <li className="px-3 py-4 text-[12.5px] text-[var(--am-text-secondary)]">
                {ts(locale, "suppliers.details.sectionReady")}
              </li>
            ) : (
              (tab === "orders"
                ? supplier.purchaseOrderIds
                : supplier.purchaseIds
              ).map((id) => (
                <li
                  key={id}
                  className="px-3 py-2.5 font-mono text-[12.5px] tabular-nums text-[var(--am-navy-900)]"
                  dir="ltr"
                >
                  {id}
                </li>
              ))
            )}
          </ul>
        ) : null}

        {tab === "more" ? (
          <div className="space-y-2">
            {(
              [
                {
                  key: "suppliers.details.payments" as const,
                  tab: "payments",
                },
                {
                  key: "suppliers.details.balance" as const,
                  tab: "overview",
                },
                {
                  key: "suppliers.details.statement" as const,
                  tab: "statement",
                },
                {
                  key: "suppliers.details.history" as const,
                  tab: "history",
                },
                {
                  key: "suppliers.details.documents" as const,
                  tab: "documents",
                },
              ] as const
            ).map((item) => (
              <Link
                key={item.key}
                href={supplierDetailsHref(supplier.id, {
                  tab: item.tab === "overview" ? undefined : item.tab,
                })}
                className="am-focus-ring flex items-center justify-between rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] px-3 py-2.5 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
              >
                {ts(locale, item.key)}
                <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3.5 py-3 sm:px-4">
        {messageNote ? (
          <p className="text-[11.5px] text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.preview.messageSoon")}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            className="am-focus-ring h-10 flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-blue-700)] bg-[var(--am-surface-raised)] text-[12.5px] font-semibold text-[var(--am-blue-700)]"
            onClick={() => setMessageNote(true)}
          >
            {ts(locale, "suppliers.preview.message")}
          </button>
          <Link
            href={supplierDetailsHref(supplier.id)}
            className="am-focus-ring inline-flex h-10 flex-[1.35] items-center justify-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
          >
            {ts(locale, "suppliers.preview.fullProfile")}
            <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        <button
          type="button"
          className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-raised)]"
          onClick={() => onEdit(supplier)}
        >
          {ts(locale, "suppliers.edit")}
        </button>
      </div>
    </>
  );
}
