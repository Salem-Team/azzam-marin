"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  Copy,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FolderOpen,
  Globe,
  Hash,
  History,
  Landmark,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  NotebookPen,
  Package,
  Pencil,
  Phone,
  Printer,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { CountryFlag } from "@/components/suppliers/country-flag";
import { SupplierActivityPanel } from "@/components/suppliers/supplier-activity-panel";
import { SupplierDocumentsPanel } from "@/components/suppliers/supplier-documents-panel";
import { SupplierCreateWizard } from "@/components/suppliers/supplier-create-wizard";
import { SupplierOverviewPanel } from "@/components/suppliers/supplier-overview-panel";
import { SupplierRelatedItemsPanel } from "@/components/suppliers/supplier-related-items-panel";
import { SupplierRemoveDialog } from "@/components/suppliers/supplier-remove-dialog";
import { SupplierStatusDialog } from "@/components/suppliers/supplier-status-dialog";
import { DropdownPanel } from "@/components/ui/dropdown-panel";
import { RecordCardLink, RecordTableRow } from "@/components/ui/record-row";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  listSupplierPayments,
  listSupplierPos,
  listSupplierPurchases,
  type LedgerPoStatus,
  type SupplierLinkedPo,
} from "@/config/mock-supplier-ledger";
import { getSupplierAnalytics } from "@/config/mock-supplier-analytics";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { td } from "@/i18n/dashboard";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import { formatIsoDate, formatMoney, maskAccountNumber } from "@/lib/format";
import {
  purchaseOrderTotal,
  usePurchaseOrders,
} from "@/lib/purchase-orders-store";
import {
  purchaseInvoiceDetailsHref,
  purchaseOrderDetailsHref,
  supplierPaymentDetailsHref,
} from "@/lib/record-routes";
import {
  filterStatementLines,
  statementLinesToCsv,
  type StatementMovementType,
} from "@/lib/suppliers/supplier-statement";
import { useItemSupplierLinks } from "@/lib/item-suppliers-store";
import type { PurchaseOrderStatus } from "@/types/purchase-order";
import {
  getLastSupplierPersistError,
  planSupplierRemoval,
  removeSupplier,
  setSupplierStatus,
  updateSupplier,
  useSuppliers,
  useSuppliersHydrated,
} from "@/lib/suppliers-store";
import { useLocale } from "@/providers/locale-provider";
import type { Locale } from "@/types/i18n";
import type {
  SupplierFormValues,
  SupplierRecord,
  SupplierRemovalPlan,
  SupplierStatus,
} from "@/types/supplier";

type DetailTab =
  | "overview"
  | "contact"
  | "commercial"
  | "bank"
  | "items"
  | "orders"
  | "purchases"
  | "payments"
  | "statement"
  | "history"
  | "documents"
  | "activity";

const TABS: { id: DetailTab; labelKey: SupplierKey; icon: LucideIcon }[] = [
  {
    id: "overview",
    labelKey: "suppliers.details.overview",
    icon: LayoutDashboard,
  },
  { id: "contact", labelKey: "suppliers.details.contact", icon: Contact },
  {
    id: "commercial",
    labelKey: "suppliers.details.commercial",
    icon: NotebookPen,
  },
  { id: "bank", labelKey: "suppliers.details.bank", icon: Landmark },
  { id: "items", labelKey: "suppliers.details.items", icon: Package },
  { id: "orders", labelKey: "suppliers.details.orders", icon: ClipboardList },
  {
    id: "purchases",
    labelKey: "suppliers.details.purchases",
    icon: ShoppingCart,
  },
  { id: "payments", labelKey: "suppliers.details.payments", icon: Wallet },
  {
    id: "statement",
    labelKey: "suppliers.details.statement",
    icon: FileSpreadsheet,
  },
  { id: "history", labelKey: "suppliers.details.history", icon: History },
  {
    id: "documents",
    labelKey: "suppliers.details.documents",
    icon: FolderOpen,
  },
  {
    id: "activity",
    labelKey: "suppliers.details.activityTab",
    icon: Activity,
  },
];

const TAB_IDS: DetailTab[] = [
  "overview",
  "contact",
  "commercial",
  "bank",
  "items",
  "orders",
  "purchases",
  "payments",
  "statement",
  "history",
  "documents",
  "activity",
];

function parseTab(raw: string | null): DetailTab {
  if (raw && (TAB_IDS as string[]).includes(raw)) return raw as DetailTab;
  return "overview";
}

function mapStorePoStatus(status: PurchaseOrderStatus): LedgerPoStatus {
  switch (status) {
    case "partially_received":
      return "partial";
    case "received":
      return "completed";
    case "approved":
    case "submitted":
      return "inProgress";
    default:
      return "open";
  }
}

function SupplierDetailsInner({ supplierId }: { supplierId: string }) {
  const { locale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const suppliers = useSuppliers();
  const hydrated = useSuppliersHydrated();
  const itemLinks = useItemSupplierLinks();
  const storePurchaseOrders = usePurchaseOrders();
  const supplier = suppliers.find((s) => s.id === supplierId);
  const tab = parseTab(searchParams.get("tab"));
  const relatedItemCount = itemLinks.filter(
    (l) => l.supplierId === supplierId,
  ).length;
  const [editOpen, setEditOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removePlan, setRemovePlan] = useState<SupplierRemovalPlan | null>(
    null,
  );
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusNext, setStatusNext] = useState<SupplierStatus | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  const moreRef = useRef<HTMLDivElement>(null);

  function setTab(next: DetailTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  if (!supplier) {
    if (!hydrated) {
      return (
        <PageFrame>
          <PageSurface className="items-center justify-center gap-3 p-8 text-center">
            <p className="text-[13px] text-[var(--am-text-secondary)]">
              {ts(locale, "suppliers.loading")}
            </p>
          </PageSurface>
        </PageFrame>
      );
    }
    return (
      <PageFrame>
        <div className="hidden lg:block">
          <h1 className="am-text-page-title">
            {ts(locale, "suppliers.title")}
          </h1>
        </div>
        <PageSurface className="items-center justify-center gap-3 p-8 text-center">
          <Building2
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
            {supplierId}
          </p>
          <Link
            href="/suppliers"
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {ts(locale, "suppliers.details.back")}
          </Link>
        </PageSurface>
      </PageFrame>
    );
  }

  const name = locale === "ar" ? supplier.nameAr : supplier.nameEn;
  const country =
    locale === "ar"
      ? SUPPLIER_COUNTRY_LABELS[supplier.countryCode].ar
      : SUPPLIER_COUNTRY_LABELS[supplier.countryCode].en;

  function openEdit() {
    setFormKey((k) => k + 1);
    setEditOpen(true);
  }

  function handleSave(values: SupplierFormValues): SupplierRecord {
    const updated = updateSupplier(supplierId, values);
    if (!updated) {
      throw new Error("not-found");
    }
    if (getLastSupplierPersistError()) {
      toast.push(ts(locale, "suppliers.toast.persistError"), "error");
    } else {
      toast.push(ts(locale, "suppliers.toast.updated"));
    }
    return updated;
  }

  function handleToggleStatus() {
    setStatusNext(supplier!.status === "active" ? "inactive" : "active");
    setStatusOpen(true);
    setMoreOpen(false);
  }

  function handleConfirmStatus() {
    if (!statusNext || statusSubmitting) return;
    setStatusSubmitting(true);
    try {
      setSupplierStatus(supplierId, statusNext);
      toast.push(
        ts(
          locale,
          statusNext === "active"
            ? "suppliers.toast.activated"
            : "suppliers.toast.deactivated",
        ),
      );
      setStatusOpen(false);
      setStatusNext(null);
    } finally {
      setStatusSubmitting(false);
    }
  }

  function openRemove() {
    const plan = planSupplierRemoval(supplierId);
    if (!plan) return;
    setRemovePlan(plan);
    setRemoveOpen(true);
    setMoreOpen(false);
  }

  function handleConfirmRemove() {
    if (removeSubmitting) return;
    setRemoveSubmitting(true);
    try {
      const result = removeSupplier(supplierId);
      if (!result.ok) {
        toast.push(ts(locale, "suppliers.toast.error"), "error");
        return;
      }
      toast.push(
        ts(
          locale,
          result.mode === "delete"
            ? "suppliers.toast.deleted"
            : "suppliers.toast.deactivated",
        ),
      );
      setRemoveOpen(false);
      if (result.mode === "delete") {
        router.push("/suppliers");
      }
    } finally {
      setRemoveSubmitting(false);
    }
  }

  const liveOrders: SupplierLinkedPo[] = storePurchaseOrders
    .filter((o) => o.supplierId === supplier.id && o.status !== "cancelled")
    .map((o) => ({
      id: o.id,
      supplierId: o.supplierId,
      supplierEn: supplier.nameEn,
      supplierAr: supplier.nameAr,
      date: o.orderDate,
      expectedDeliveryDate: o.expectedDeliveryDate || o.orderDate,
      amount: purchaseOrderTotal(o),
      // Ledger demo type is USD-only; live POs may be EGP — display uses runtime value.
      currency: o.currency as SupplierLinkedPo["currency"],
      status: mapStorePoStatus(o.status),
    }));
  const liveIds = new Set(liveOrders.map((o) => o.id));
  const demoOrders = listSupplierPos(supplier.id).filter(
    (o) => !liveIds.has(o.id),
  );
  const allOrders = [...liveOrders, ...demoOrders];
  const allPurchases = listSupplierPurchases(supplier.id);
  const allPayments = listSupplierPayments(supplier.id);

  const tabCounts: Partial<Record<DetailTab, number>> = {
    items: relatedItemCount,
    orders: allOrders.length,
    purchases: allPurchases.length,
    payments: allPayments.length,
  };

  return (
    <PageFrame className="am-page--flow pb-4 lg:pb-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href="/suppliers"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          {ts(locale, "suppliers.details.back")}
        </Link>
      </div>

      <PageSurface
        fill={false}
        className="min-w-0 overflow-visible p-0 shadow-[var(--am-shadow-sm)]"
      >
        <header className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)] px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <SupplierMark name={name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <h1 className="am-text-page-title max-w-full break-words !text-[17px] sm:!text-[18px] lg:!text-[20px]">
                    {name}
                  </h1>
                  <StatusBadge
                    label={ts(
                      locale,
                      supplier.status === "active"
                        ? "suppliers.status.active"
                        : "suppliers.status.inactive",
                    )}
                    tone={supplier.status === "active" ? "approved" : "out"}
                    className="shrink-0 px-2"
                  />
                </div>

                <ul className="mt-2 flex flex-wrap gap-1.5">
                  <MetaChip>
                    <Hash
                      className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                      aria-hidden
                    />
                    <span className="font-mono tabular-nums" dir="ltr">
                      {supplier.code}
                    </span>
                  </MetaChip>
                  <MetaChip>
                    <CountryFlag code={supplier.countryCode} />
                    <span className="truncate">{country}</span>
                  </MetaChip>
                  {supplier.foundedYear ? (
                    <MetaChip>
                      <CalendarDays
                        className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span dir="ltr">{supplier.foundedYear}</span>
                    </MetaChip>
                  ) : null}
                  <MetaChip>
                    <Package
                      className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                      aria-hidden
                    />
                    <span className="truncate">
                      {ts(
                        locale,
                        `suppliers.category.${supplier.category}` as SupplierKey,
                      )}
                    </span>
                  </MetaChip>
                  {supplier.taxId ? (
                    <MetaChip>
                      <Hash
                        className="size-3 shrink-0 text-[var(--am-text-secondary)]"
                        aria-hidden
                      />
                      <span
                        className="min-w-0 truncate font-mono text-[11px] tabular-nums"
                        dir="ltr"
                        title={supplier.taxId}
                      >
                        {supplier.taxId}
                      </span>
                    </MetaChip>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:gap-2 lg:w-auto lg:justify-end">
              <button
                type="button"
                className="am-focus-ring inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)] sm:flex-none"
                onClick={openEdit}
              >
                <Pencil className="size-3.5 shrink-0" aria-hidden />
                {ts(locale, "suppliers.edit")}
              </button>

              <div ref={moreRef} className="relative shrink-0">
                <button
                  type="button"
                  className="am-focus-ring am-touch-target inline-flex size-9 items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                  aria-label={ts(locale, "suppliers.details.moreActions")}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  aria-controls={moreId}
                  onClick={() => {
                    setMoreOpen((v) => !v);
                  }}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
                {moreOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-[50] cursor-default"
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setMoreOpen(false)}
                    />
                    <DropdownPanel
                      id={moreId}
                      role="menu"
                      className="z-[60] min-w-[160px]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                        onClick={handleToggleStatus}
                      >
                        {ts(
                          locale,
                          supplier.status === "active"
                            ? "suppliers.action.deactivate"
                            : "suppliers.action.activate",
                        )}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                        onClick={() => {
                          setMoreOpen(false);
                          setTab("statement");
                        }}
                      >
                        {ts(locale, "suppliers.details.statement")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-start text-[12.5px] font-medium text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                        onClick={openRemove}
                      >
                        {ts(locale, "suppliers.action.remove")}
                      </button>
                    </DropdownPanel>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div
          className="flex gap-0.5 overflow-x-auto overscroll-x-contain border-b border-[var(--am-border-default)] px-1.5 sm:px-2 [scrollbar-width:thin]"
          role="tablist"
          aria-label={name}
        >
          {TABS.map((t) => {
            const count = tabCounts[t.id];
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? "am-focus-ring inline-flex shrink-0 items-center gap-1.5 border-b-2 border-[var(--am-blue-700)] px-2.5 py-2.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] sm:px-3"
                    : "am-focus-ring inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 py-2.5 text-[12.5px] font-medium text-[var(--am-text-secondary)] hover:text-[var(--am-navy-900)] sm:px-3"
                }
                onClick={() => setTab(t.id)}
              >
                <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                {ts(locale, t.labelKey)}
                {count != null && count > 0 ? (
                  <span
                    className={
                      active
                        ? "rounded-full bg-[var(--am-blue-700)] px-1.5 py-px text-[10px] font-bold text-white"
                        : "rounded-full bg-[var(--am-surface-page)] px-1.5 py-px text-[10px] font-bold text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]"
                    }
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 p-3 sm:p-4 lg:p-5" role="tabpanel">
          {tab === "overview" ? (
            <SupplierOverviewPanel
              supplier={supplier}
              locale={locale}
              onNavigateTab={setTab}
            />
          ) : tab === "contact" ? (
            <ContactPanel
              supplier={supplier}
              locale={locale}
              onCopied={() =>
                toast.push(ts(locale, "suppliers.details.copied"))
              }
            />
          ) : tab === "commercial" ? (
            <InfoCardGrid
              rows={[
                {
                  label: ts(locale, "suppliers.form.category"),
                  value: ts(
                    locale,
                    `suppliers.category.${supplier.category}` as SupplierKey,
                  ),
                },
                {
                  label: ts(locale, "suppliers.form.status"),
                  value: ts(
                    locale,
                    supplier.status === "active"
                      ? "suppliers.status.active"
                      : "suppliers.status.inactive",
                  ),
                },
                {
                  label: ts(locale, "suppliers.form.taxId"),
                  value: supplier.taxId || "—",
                  ltr: true,
                },
                {
                  label: ts(locale, "suppliers.form.paymentTerms"),
                  value: supplier.paymentTerms || "—",
                },
                {
                  label: ts(locale, "suppliers.form.notesEn"),
                  value: supplier.notesEn || "—",
                },
                {
                  label: ts(locale, "suppliers.form.notesAr"),
                  value: supplier.notesAr || "—",
                },
              ]}
            />
          ) : tab === "bank" ? (
            <InfoCardGrid
              rows={[
                {
                  label: ts(locale, "suppliers.form.bankName"),
                  value: supplier.bank.bankName || "—",
                },
                {
                  label: ts(locale, "suppliers.form.accountName"),
                  value: supplier.bank.accountName || "—",
                },
                {
                  label: ts(locale, "suppliers.form.iban"),
                  value: supplier.bank.iban ? (
                    <MaskedCopyValue
                      value={supplier.bank.iban}
                      locale={locale}
                      onCopied={() =>
                        toast.push(ts(locale, "suppliers.bank.copied"))
                      }
                    />
                  ) : (
                    "—"
                  ),
                  ltr: true,
                },
                {
                  label: ts(locale, "suppliers.form.swift"),
                  value: supplier.bank.swift || "—",
                  ltr: true,
                },
                {
                  label: ts(locale, "suppliers.details.currency"),
                  value: supplier.bank.currency || "USD",
                  ltr: true,
                },
              ]}
            />
          ) : tab === "statement" || tab === "history" ? (
            <LedgerPanel
              supplier={supplier}
              locale={locale}
              mode={tab}
            />
          ) : tab === "documents" ? (
            <SupplierDocumentsPanel
              supplierId={supplier.id}
              locale={locale}
              onToast={(message, tone) =>
                toast.push(message, tone === "error" ? "error" : "success")
              }
            />
          ) : tab === "items" ? (
            <SupplierRelatedItemsPanel
              supplierId={supplier.id}
              locale={locale}
            />
          ) : tab === "activity" ? (
            <SupplierActivityPanel supplier={supplier} locale={locale} />
          ) : tab === "orders" ? (
            <TransactionTable
              locale={locale}
              columns={["date", "currency", "extra", "status", "amount"]}
              extraLabel={ts(locale, "suppliers.details.expectedDelivery")}
              rows={allOrders.map((r) => ({
                id: r.id,
                date: r.date,
                amount: r.amount,
                currency: r.currency,
                extra: formatIsoDate(r.expectedDeliveryDate, locale),
                status: ts(
                  locale,
                  `suppliers.po.${r.status}` as SupplierKey,
                ),
                href: purchaseOrderDetailsHref(r.id),
              }))}
            />
          ) : tab === "purchases" ? (
            <TransactionTable
              locale={locale}
              columns={["date", "currency", "status", "amount"]}
              rows={allPurchases.map((r) => ({
                id: r.id,
                date: r.date,
                amount: r.amount,
                currency: r.currency,
                status: ts(
                  locale,
                  r.status === "received"
                    ? "suppliers.purchase.received"
                    : "suppliers.purchase.pending",
                ),
                href: purchaseInvoiceDetailsHref(r.id),
              }))}
            />
          ) : (
            <TransactionTable
              locale={locale}
              columns={["date", "currency", "extra", "status", "amount"]}
              extraLabel={ts(locale, "suppliers.details.method")}
              rows={allPayments.map((r) => ({
                id: r.id,
                date: r.date,
                amount: r.amount,
                currency: r.currency,
                extra: ts(
                  locale,
                  r.method === "bankTransfer"
                    ? "suppliers.pay.bankTransfer"
                    : r.method === "swift"
                      ? "suppliers.pay.swift"
                      : "suppliers.pay.cash",
                ),
                status: ts(
                  locale,
                  r.status === "posted"
                    ? "suppliers.pay.posted"
                    : "suppliers.pay.pending",
                ),
                href: supplierPaymentDetailsHref(r.id),
              }))}
            />
          )}
        </div>
      </PageSurface>

      <SupplierCreateWizard
        open={editOpen}
        formKey={formKey}
        locale={locale}
        mode="edit"
        supplier={supplier}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSave}
        onOpenProfile={() => setEditOpen(false)}
      />

      <SupplierRemoveDialog
        open={removeOpen}
        locale={locale}
        supplier={supplier}
        plan={removePlan}
        submitting={removeSubmitting}
        onClose={() => {
          setRemoveOpen(false);
          setRemovePlan(null);
        }}
        onConfirm={handleConfirmRemove}
      />

      <SupplierStatusDialog
        open={statusOpen}
        locale={locale}
        supplier={supplier}
        nextStatus={statusNext}
        submitting={statusSubmitting}
        onClose={() => {
          setStatusOpen(false);
          setStatusNext(null);
        }}
        onConfirm={handleConfirmStatus}
      />
    </PageFrame>
  );
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function websiteHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ContactPanel({
  supplier,
  locale,
  onCopied,
}: {
  supplier: SupplierRecord;
  locale: Locale;
  onCopied: () => void;
}) {
  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      onCopied();
    } catch {
      /* clipboard may be unavailable */
    }
  }

  const phoneDigits = digitsOnly(supplier.phone);
  const waDigits = digitsOnly(supplier.whatsapp || supplier.phone);
  const site = websiteHref(supplier.website ?? "");

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {phoneDigits ? (
          <a
            href={`tel:${phoneDigits}`}
            className="am-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
          >
            <Phone className="size-3.5" aria-hidden />
            {ts(locale, "suppliers.details.call")}
          </a>
        ) : null}
        {supplier.email ? (
          <a
            href={`mailto:${supplier.email}`}
            className="am-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
          >
            <Mail className="size-3.5" aria-hidden />
            {ts(locale, "suppliers.details.emailAction")}
          </a>
        ) : null}
        {waDigits ? (
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="am-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12px] font-semibold text-[var(--am-success-600)] hover:bg-[color-mix(in_srgb,var(--am-success-600)_10%,white)]"
          >
            <Phone className="size-3.5" aria-hidden />
            {ts(locale, "suppliers.details.whatsappAction")}
          </a>
        ) : null}
        {site ? (
          <a
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            className="am-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12px] font-semibold text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
          >
            <Globe className="size-3.5" aria-hidden />
            {ts(locale, "suppliers.details.openWebsite")}
          </a>
        ) : null}
      </div>

      <InfoCardGrid
        rows={[
          {
            label: ts(locale, "suppliers.form.contactPerson"),
            value: supplier.contactPerson || "—",
          },
          {
            label: ts(locale, "suppliers.form.phone"),
            value: (
              <CopyableInline
                value={supplier.phone}
                locale={locale}
                onCopy={() => void copyText(supplier.phone)}
              />
            ),
            ltr: true,
          },
          {
            label: ts(locale, "suppliers.form.whatsapp"),
            value: (
              <CopyableInline
                value={supplier.whatsapp || "—"}
                locale={locale}
                onCopy={
                  supplier.whatsapp
                    ? () => void copyText(supplier.whatsapp)
                    : undefined
                }
              />
            ),
            ltr: true,
          },
          {
            label: ts(locale, "suppliers.form.email"),
            value: (
              <CopyableInline
                value={supplier.email}
                locale={locale}
                onCopy={() => void copyText(supplier.email)}
              />
            ),
            ltr: true,
          },
          {
            label: ts(locale, "suppliers.details.address"),
            value:
              (locale === "ar"
                ? supplier.addressAr || supplier.addressEn
                : supplier.addressEn || supplier.addressAr) ?? "—",
          },
          {
            label: ts(locale, "suppliers.details.website"),
            value: site ? (
              <a
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                className="am-focus-ring inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-[var(--am-radius-md)] font-semibold text-[var(--am-blue-700)] hover:underline"
              >
                <Globe className="size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-all">{supplier.website}</span>
              </a>
            ) : (
              "—"
            ),
            ltr: true,
          },
        ]}
      />
    </div>
  );
}

function CopyableInline({
  value,
  locale,
  onCopy,
}: {
  value: string;
  locale: Locale;
  onCopy?: () => void;
}) {
  if (!onCopy || value === "—") return <>{value}</>;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      <span className="min-w-0 break-all">{value}</span>
      <button
        type="button"
        className="am-focus-ring inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
        onClick={onCopy}
        aria-label={ts(locale, "suppliers.details.copyValue")}
      >
        <Copy className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

function MaskedCopyValue({
  value,
  locale,
  onCopied,
}: {
  value: string;
  locale: Locale;
  onCopied: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      onCopied();
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        className="am-focus-ring min-w-0 flex-1 rounded-[var(--am-radius-md)] text-start font-mono text-[13px] font-semibold tabular-nums text-[var(--am-navy-900)] hover:text-[var(--am-blue-700)]"
        onClick={() => setRevealed((v) => !v)}
        aria-pressed={revealed}
        aria-label={
          revealed
            ? ts(locale, "suppliers.bank.hide")
            : ts(locale, "suppliers.bank.show")
        }
        title={
          revealed
            ? ts(locale, "suppliers.bank.hide")
            : ts(locale, "suppliers.bank.show")
        }
      >
        <span className="inline-flex max-w-full items-center gap-1.5">
          <span className="min-w-0 break-all">
            {revealed ? value : maskAccountNumber(value)}
          </span>
          {revealed ? (
            <EyeOff
              className="size-3.5 shrink-0 text-[var(--am-text-secondary)]"
              aria-hidden
            />
          ) : (
            <Eye
              className="size-3.5 shrink-0 text-[var(--am-text-secondary)]"
              aria-hidden
            />
          )}
        </span>
      </button>
      <button
        type="button"
        className="am-focus-ring inline-flex h-8 shrink-0 items-center gap-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2 text-[11.5px] font-semibold text-[var(--am-blue-700)] hover:bg-[var(--am-blue-100)]"
        onClick={() => void copyValue()}
        aria-label={ts(locale, "suppliers.bank.copy")}
      >
        <Copy className="size-3.5" aria-hidden />
        {ts(locale, "suppliers.bank.copy")}
      </button>
    </div>
  );
}

function InfoCardGrid({
  rows,
}: {
  rows: { label: string; value: ReactNode; ltr?: boolean }[];
}) {
  return (
    <dl className="am-ops-grid">
      {rows.map((row) => (
        <div
          key={row.label}
          className="min-w-0 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 py-3 shadow-[var(--am-shadow-sm)]"
        >
          <dt className="text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
            {row.label}
          </dt>
          <dd
            className="mt-1 break-words text-[13px] font-semibold text-[var(--am-navy-900)]"
            dir={row.ltr ? "ltr" : undefined}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TransactionTable({
  locale,
  rows,
  columns = ["date", "status", "amount"],
  extraLabel,
}: {
  locale: "en" | "ar";
  columns?: Array<"date" | "currency" | "extra" | "status" | "amount">;
  extraLabel?: string;
  rows: {
    id: string;
    date: string;
    amount: number;
    status: string;
    href?: string;
    currency?: "USD";
    extra?: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-4 py-8 text-center text-[13px] text-[var(--am-text-secondary)]">
        {ts(locale, "suppliers.details.sectionReady")}
      </p>
    );
  }

  const show = (key: (typeof columns)[number]) => columns.includes(key);

  return (
    <div className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)]">
      <ul className="divide-y divide-[var(--am-border-default)] md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            {row.href ? (
              <RecordCardLink
                href={row.href}
                label={`${td(locale, "po.openRecord")} ${row.id}`}
                className="flex flex-col gap-1 px-3.5 py-3"
              >
                <span
                  className="font-mono text-[12.5px] font-semibold text-[var(--am-blue-700)]"
                  dir="ltr"
                >
                  {row.id}
                </span>
                <span className="flex items-center justify-between gap-2 text-[11.5px] text-[var(--am-text-secondary)]">
                  <span dir="ltr">{formatIsoDate(row.date, locale)}</span>
                  <span className="font-semibold tabular-nums text-[var(--am-navy-900)]">
                    {formatMoney(row.amount, row.currency ?? "USD", locale)}
                  </span>
                </span>
                {row.extra ? (
                  <span className="text-[11.5px] text-[var(--am-text-secondary)]">
                    {extraLabel ? `${extraLabel}: ` : ""}
                    {row.extra}
                  </span>
                ) : null}
                <span className="text-[12px] font-medium text-[var(--am-navy-900)]">
                  {row.status}
                </span>
              </RecordCardLink>
            ) : (
              <div className="flex flex-col gap-1 px-3.5 py-3">
                <span
                  className="font-mono text-[12.5px] font-semibold"
                  dir="ltr"
                >
                  {row.id}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] border-collapse text-start text-[12.5px]">
          <thead>
            <tr className="bg-[color-mix(in_srgb,var(--am-surface-page)_88%,white)] text-[10.5px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
              <th className="px-3 py-2.5">{ts(locale, "suppliers.col.index")}</th>
              <th className="px-3 py-2.5">{ts(locale, "suppliers.recent.id")}</th>
              {show("date") ? (
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.col.lastTx")}
                </th>
              ) : null}
              {show("currency") ? (
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.currency")}
                </th>
              ) : null}
              {show("extra") ? (
                <th className="px-3 py-2.5">{extraLabel ?? "—"}</th>
              ) : null}
              {show("amount") ? (
                <th className="px-3 py-2.5 text-end">
                  {ts(locale, "suppliers.col.amount")}
                </th>
              ) : null}
              {show("status") ? (
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.col.status")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <RecordTableRow
                key={row.id}
                className="border-t border-[var(--am-border-default)] am-transition-colors hover:bg-[color-mix(in_srgb,var(--am-blue-100)_28%,transparent)]"
              >
                <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                  {i + 1}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  {row.href ? (
                    <RecordCardLink
                      href={row.href}
                      label={`${td(locale, "po.openRecord")} ${row.id}`}
                      className="font-semibold text-[var(--am-blue-700)]"
                    >
                      <span dir="ltr">{row.id}</span>
                    </RecordCardLink>
                  ) : (
                    <span dir="ltr" className="text-[var(--am-navy-900)]">
                      {row.id}
                    </span>
                  )}
                </td>
                {show("date") ? (
                  <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                    {formatIsoDate(row.date, locale)}
                  </td>
                ) : null}
                {show("currency") ? (
                  <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--am-text-secondary)]">
                    {row.currency ?? "USD"}
                  </td>
                ) : null}
                {show("extra") ? (
                  <td className="px-3 py-2.5 text-[var(--am-navy-900)]">
                    {row.extra ?? "—"}
                  </td>
                ) : null}
                {show("amount") ? (
                  <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-navy-900)]">
                    {formatMoney(row.amount, row.currency ?? "USD", locale)}
                  </td>
                ) : null}
                {show("status") ? (
                  <td className="px-3 py-2.5 text-[12.5px] font-medium text-[var(--am-navy-900)]">
                    {row.status}
                  </td>
                ) : null}
              </RecordTableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LedgerPanel({
  supplier,
  locale,
  mode,
}: {
  supplier: SupplierRecord;
  locale: "en" | "ar";
  mode: "statement" | "history";
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<StatementMovementType>("all");

  const analytics = useMemo(
    () => getSupplierAnalytics(supplier),
    [supplier],
  );

  const rows = useMemo(() => {
    const source = analytics.statementLines;
    const movements = source.filter((row) => !row.id.endsWith("-opening"));
    const opening = source.find((row) => row.id.endsWith("-opening"));

    const openingBalance = opening?.balance ?? 0;
    let running = openingBalance;
    const withBalance = movements.map((row) => {
      running += row.debit - row.credit;
      return { ...row, balance: running };
    });

    if (mode === "statement" && opening) {
      return [
        {
          ...opening,
          balance: openingBalance,
        },
        ...withBalance,
      ];
    }
    return withBalance;
  }, [analytics.statementLines, mode]);

  const filtered = useMemo(
    () =>
      filterStatementLines(rows, { query, type }, locale),
    [rows, query, type, locale],
  );

  const activeFilters = Boolean(query.trim()) || type !== "all";

  function clearFilters() {
    setQuery("");
    setType("all");
  }

  function handleExport() {
    const csv = statementLinesToCsv(filtered, locale);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${supplier.id}-${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">{ts(locale, "suppliers.statement.search")}</span>
          <input
            className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[13px] text-[var(--am-navy-900)] placeholder:text-[var(--am-text-muted)]"
            placeholder={ts(locale, "suppliers.statement.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="min-w-[9rem]">
          <span className="sr-only">{ts(locale, "suppliers.statement.type")}</span>
          <select
            className="am-focus-ring h-9 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[13px]"
            value={type}
            onChange={(e) => setType(e.target.value as StatementMovementType)}
          >
            <option value="all">
              {ts(locale, "suppliers.statement.typeAll")}
            </option>
            <option value="debit">
              {ts(locale, "suppliers.statement.typeDebit")}
            </option>
            <option value="credit">
              {ts(locale, "suppliers.statement.typeCredit")}
            </option>
          </select>
        </label>
        <span className="inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2.5 text-[12px] font-semibold text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.details.currency")}: USD
        </span>
        {activeFilters ? (
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12px] font-semibold text-[var(--am-navy-900)]"
            onClick={clearFilters}
          >
            {ts(locale, "suppliers.clearFilters")}
          </button>
        ) : null}
        <button
          type="button"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12px] font-semibold text-[var(--am-navy-900)]"
          onClick={handleExport}
        >
          {ts(locale, "suppliers.statement.export")}
        </button>
        <button
          type="button"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 text-[12px] font-semibold text-[var(--am-navy-900)]"
          onClick={handlePrint}
        >
          <Printer className="size-3.5" aria-hidden />
          {ts(locale, "suppliers.statement.print")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] px-4 py-8 text-center text-[13px] text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.statement.empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)] print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-start text-[12.5px]">
              <thead>
                <tr className="bg-[color-mix(in_srgb,var(--am-surface-page)_88%,white)] text-[10.5px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
                  <th className="px-3 py-2.5">
                    {ts(locale, "suppliers.col.lastTx")}
                  </th>
                  <th className="px-3 py-2.5">
                    {ts(locale, "suppliers.details.reference")}
                  </th>
                  <th className="px-3 py-2.5 text-end">
                    {ts(locale, "suppliers.details.debit")}
                  </th>
                  <th className="px-3 py-2.5 text-end">
                    {ts(locale, "suppliers.details.credit")}
                  </th>
                  {mode === "statement" ? (
                    <th className="px-3 py-2.5 text-end">
                      {ts(locale, "suppliers.details.balance")}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isOpening = row.id.endsWith("-opening");
                  return (
                    <tr
                      key={`${row.id}-${row.debit}-${row.credit}-${row.balance}`}
                      className="border-t border-[var(--am-border-default)] am-transition-colors hover:bg-[color-mix(in_srgb,var(--am-blue-100)_28%,transparent)]"
                    >
                      <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                        {formatIsoDate(row.date, locale)}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--am-navy-900)]">
                        <span className="font-medium">
                          {locale === "ar" ? row.labelAr : row.labelEn}
                        </span>
                        {!isOpening ? (
                          <span
                            className="ms-1.5 font-mono text-[11px] text-[var(--am-text-secondary)]"
                            dir="ltr"
                          >
                            {row.id}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-navy-900)]">
                        {row.debit > 0
                          ? formatMoney(row.debit, "USD", locale)
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-success-600)]">
                        {row.credit > 0
                          ? formatMoney(row.credit, "USD", locale)
                          : "—"}
                      </td>
                      {mode === "statement" ? (
                        <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-navy-900)]">
                          {formatMoney(row.balance, "USD", locale)}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function supplierInitials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!cleaned) return "—";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

function SupplierMark({ name }: { name: string }) {
  const initials = supplierInitials(name);
  return (
    <span
      className="inline-flex size-12 shrink-0 flex-col items-center justify-center rounded-[var(--am-radius-xl)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_8%,white)_100%)] text-[var(--am-navy-900)] shadow-[var(--am-shadow-sm)] ring-1 ring-[var(--am-border-default)] sm:size-[3.25rem]"
      title={name}
      aria-hidden
    >
      <span className="text-[12px] font-bold leading-none tracking-wide sm:text-[13px]">
        {initials}
      </span>
    </span>
  );
}

function MetaChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-2 py-1 text-[11px] font-medium text-[var(--am-navy-900)] sm:text-[11.5px]",
        className,
      )}
    >
      {children}
    </li>
  );
}

export function SupplierDetailsView({ supplierId }: { supplierId: string }) {
  return (
    <ToastProvider>
      <SupplierDetailsInner supplierId={supplierId} />
    </ToastProvider>
  );
}
