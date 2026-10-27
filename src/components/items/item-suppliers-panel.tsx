"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import {
  createItemSupplierLink,
  ItemSupplierLinkError,
  linkToFormValues,
  removeItemSupplierLink,
  updateItemSupplierLink,
  useItemSupplierLinks,
  useItemSupplierLinksHydrated,
} from "@/lib/item-suppliers-store";
import {
  EMPTY_ITEM_SUPPLIER_FORM,
  hasItemSupplierFieldErrors,
  validateItemSupplierForm,
  type ItemSupplierFieldErrors,
} from "@/lib/item-suppliers/item-supplier-validation";
import { supplierDetailsHref } from "@/lib/record-routes";
import { useSuppliers, useSuppliersHydrated } from "@/lib/suppliers-store";
import type { Locale } from "@/types/i18n";
import type {
  ItemSupplierLink,
  ItemSupplierLinkFormValues,
} from "@/types/item-supplier";
import type { SupplierRecord } from "@/types/supplier";

function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--am-border-default)] px-4 py-3">
      <h2 className="text-[13.5px] font-semibold text-[var(--am-navy-900)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12.5px] text-[var(--am-text-secondary)]">{children}</p>
  );
}

function supplierName(s: SupplierRecord, locale: Locale): string {
  return locale === "ar" ? s.nameAr : s.nameEn;
}

function matchesSupplierQuery(s: SupplierRecord, q: string): boolean {
  if (!q) return true;
  const country = SUPPLIER_COUNTRY_LABELS[s.countryCode];
  const hay = [
    s.nameEn,
    s.nameAr,
    s.code,
    s.email,
    s.phone,
    s.countryCode,
    country?.en,
    country?.ar,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function ItemSuppliersPanel({
  itemId,
  locale,
  onToast,
}: {
  itemId: string;
  locale: Locale;
  onToast: (message: string, tone?: "success" | "error") => void;
}) {
  const links = useItemSupplierLinks();
  const linksHydrated = useItemSupplierLinksHydrated();
  const suppliers = useSuppliers();
  const suppliersHydrated = useSuppliersHydrated();
  const itemLinks = useMemo(
    () => links.filter((l) => l.itemId === itemId),
    [links, itemId],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemSupplierLink | null>(null);
  const [prefillSupplierId, setPrefillSupplierId] = useState<string | null>(
    null,
  );
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<ItemSupplierLink | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  const supplierById = useMemo(() => {
    const map = new Map<string, SupplierRecord>();
    for (const s of suppliers) map.set(s.id, s);
    return map;
  }, [suppliers]);

  const linkedSupplierIds = useMemo(() => {
    const set = new Set(
      itemLinks.filter((l) => l.status === "active").map((l) => l.supplierId),
    );
    return set;
  }, [itemLinks]);

  const directoryCandidates = useMemo(() => {
    return suppliers
      .filter((s) => {
        if (s.status !== "active") return false;
        if (linkedSupplierIds.has(s.id)) return false;
        return matchesSupplierQuery(s, directoryQuery.trim());
      })
      .slice()
      .sort((a, b) =>
        supplierName(a, locale).localeCompare(
          supplierName(b, locale),
          locale === "ar" ? "ar" : "en",
          { sensitivity: "base" },
        ),
      );
  }, [suppliers, linkedSupplierIds, directoryQuery, locale]);

  const ready = linksHydrated && suppliersHydrated;

  function openAdd(supplierId?: string) {
    setEditing(null);
    setPrefillSupplierId(supplierId ?? null);
    setDialogOpen(true);
  }

  function openEdit(link: ItemSupplierLink) {
    setEditing(link);
    setPrefillSupplierId(null);
    setDialogOpen(true);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      removeItemSupplierLink(removeTarget.id);
      onToast(tc(locale, "items.link.removeSuccess"));
      setRemoveTarget(null);
    } catch {
      onToast(tc(locale, "items.link.saveError"), "error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <PageSurface fill={false} className="overflow-hidden !shadow-none">
        <CardHeader
          title={tc(locale, "items.suppliers.title")}
          action={
            <button
              type="button"
              className="am-focus-ring am-transition-colors inline-flex h-8 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-2.5 text-[12px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
              onClick={() => openAdd()}
            >
              <Plus className="size-3.5" aria-hidden />
              {tc(locale, "items.suppliers.add")}
            </button>
          }
        />

        {!ready ? (
          <div className="px-4 py-8 text-center">
            <EmptyNote>{tc(locale, "items.suppliers.loading")}</EmptyNote>
          </div>
        ) : itemLinks.length === 0 ? (
          <div className="space-y-3 px-4 py-4">
            <div className="space-y-1">
              <p className="text-[12.5px] text-[var(--am-text-secondary)]">
                {tc(locale, "items.suppliers.empty")}
              </p>
              <p className="text-[12.5px] font-medium text-[var(--am-navy-900)]">
                {tc(locale, "items.suppliers.pickFromDirectory")}
              </p>
              <p className="text-[11.5px] text-[var(--am-text-secondary)]">
                {tcCount(locale, "items.suppliers.directoryCount", {
                  count: directoryCandidates.length,
                })}
              </p>
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-secondary)]"
                aria-hidden
              />
              <input
                type="search"
                className="am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-2 pe-3 ps-8 text-[13px] text-[var(--am-navy-900)]"
                placeholder={tc(locale, "items.link.searchPlaceholder")}
                value={directoryQuery}
                onChange={(e) => setDirectoryQuery(e.target.value)}
                aria-label={tc(locale, "items.link.searchSupplier")}
              />
            </div>
            <SupplierDirectoryList
              locale={locale}
              suppliers={directoryCandidates}
              emptyLabel={tc(locale, "items.suppliers.noDirectoryMatch")}
              onSelect={(id) => openAdd(id)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.name")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.code")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.supplierItemCode")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.price")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.leadTime")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.moq")}
                  </th>
                  <th className="px-3 py-2.5">
                    {tc(locale, "items.suppliers.col.status")}
                  </th>
                  <th className="px-3 py-2.5 text-end">
                    {tc(locale, "items.suppliers.col.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemLinks.map((link) => {
                  const supplier = supplierById.get(link.supplierId);
                  const name = supplier
                    ? supplierName(supplier, locale)
                    : tc(locale, "items.suppliers.missingSupplier");
                  const inactiveSupplier =
                    supplier != null && supplier.status !== "active";
                  return (
                    <tr
                      key={link.id}
                      className="border-t border-[var(--am-border-default)]"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          {supplier ? (
                            <Link
                              href={supplierDetailsHref(supplier.id)}
                              className="am-focus-ring font-semibold text-[var(--am-blue-700)] hover:underline"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[var(--am-text-secondary)]">
                              {name}
                            </span>
                          )}
                          {inactiveSupplier ? (
                            <span className="text-[11px] text-[var(--am-warning-600)]">
                              {tc(locale, "items.suppliers.inactiveBadge")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums" dir="ltr">
                        {supplier?.code ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 font-mono" dir="ltr">
                        {link.supplierItemCode || "—"}
                      </td>
                      <td className="px-3 py-2.5" dir="ltr">
                        {link.purchasePrice != null && link.currency
                          ? formatMoney(
                              link.purchasePrice,
                              link.currency,
                              locale,
                            )
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5" dir="ltr">
                        {link.leadTimeDays != null
                          ? tcCount(locale, "items.suppliers.days", {
                              n: link.leadTimeDays,
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                        {link.minimumOrderQuantity ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={tc(
                            locale,
                            `items.link.status.${link.status}` as CatalogKey,
                          )}
                          tone={
                            link.status === "active" ? "approved" : "inventory"
                          }
                          className="px-2"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {supplier ? (
                            <Link
                              href={supplierDetailsHref(supplier.id)}
                              className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                              aria-label={tc(locale, "items.suppliers.view")}
                              title={tc(locale, "items.suppliers.view")}
                            >
                              <ExternalLink className="size-3.5" aria-hidden />
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]"
                            aria-label={tc(locale, "items.suppliers.edit")}
                            title={tc(locale, "items.suppliers.edit")}
                            onClick={() => openEdit(link)}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-danger-600)] hover:bg-[var(--am-surface-page)]"
                            aria-label={tc(locale, "items.suppliers.remove")}
                            title={tc(locale, "items.suppliers.remove")}
                            onClick={() => setRemoveTarget(link)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-[var(--am-border-default)] px-4 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.link.priceNote")}
        </p>
      </PageSurface>

      {dialogOpen ? (
        <ItemSupplierLinkDialog
          key={editing?.id ?? `new-${prefillSupplierId ?? "blank"}`}
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setPrefillSupplierId(null);
          }}
          itemId={itemId}
          locale={locale}
          editing={editing}
          initialSupplierId={prefillSupplierId}
          suppliers={suppliers}
          existingLinks={itemLinks}
          onToast={onToast}
        />
      ) : null}

      <ModalDialog
        open={Boolean(removeTarget)}
        onClose={() => (removing ? undefined : setRemoveTarget(null))}
        title={tc(locale, "items.link.removeTitle")}
        size="md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
              disabled={removing}
              onClick={() => setRemoveTarget(null)}
            >
              {tc(locale, "items.link.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-danger-600)] px-3 text-[12.5px] font-semibold text-white"
              disabled={removing}
              onClick={() => void confirmRemove()}
            >
              {tc(locale, "items.link.removeConfirm")}
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.link.removeBody")}
        </p>
      </ModalDialog>
    </>
  );
}

/** Compact overview card — shows up to 3 real links. */
export function ItemSuppliersOverviewCard({
  itemId,
  locale,
  onManage,
}: {
  itemId: string;
  locale: Locale;
  onManage: () => void;
}) {
  const hydrated = useItemSupplierLinksHydrated();
  const suppliers = useSuppliers();
  const allLinks = useItemSupplierLinks();
  const itemLinks = useMemo(
    () => allLinks.filter((l) => l.itemId === itemId).slice(0, 3),
    [allLinks, itemId],
  );

  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <CardHeader
        title={tc(locale, "items.suppliers.title")}
        action={
          <button
            type="button"
            className="am-focus-ring text-[12px] font-semibold text-[var(--am-blue-700)] hover:underline"
            onClick={onManage}
          >
            {tc(locale, "items.suppliers.add")}
          </button>
        }
      />
      <div className="space-y-2 px-4 py-3">
        {!hydrated ? (
          <EmptyNote>{tc(locale, "items.suppliers.loading")}</EmptyNote>
        ) : itemLinks.length === 0 ? (
          <>
            <EmptyNote>{tc(locale, "items.suppliers.empty")}</EmptyNote>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
              onClick={onManage}
            >
              <TruckIcon />
              {tc(locale, "items.suppliers.emptyAction")}
            </button>
          </>
        ) : (
          <ul className="space-y-2">
            {itemLinks.map((link) => {
              const s = suppliers.find((x) => x.id === link.supplierId);
              const name = s
                ? supplierName(s, locale)
                : tc(locale, "items.suppliers.missingSupplier");
              return (
                <li key={link.id} className="flex items-center justify-between gap-2">
                  {s ? (
                    <Link
                      href={supplierDetailsHref(s.id)}
                      className="min-w-0 truncate text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="text-[12.5px] text-[var(--am-text-secondary)]">
                      {name}
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[11px] text-[var(--am-text-secondary)]" dir="ltr">
                    {s?.code ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageSurface>
  );
}

function TruckIcon() {
  return <Link2 className="size-3.5" aria-hidden />;
}

function SupplierDirectoryList({
  locale,
  suppliers,
  selectedId,
  emptyLabel,
  onSelect,
}: {
  locale: Locale;
  suppliers: readonly SupplierRecord[];
  selectedId?: string;
  emptyLabel: string;
  onSelect: (supplierId: string) => void;
}) {
  if (suppliers.length === 0) {
    return (
      <p className="rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 py-6 text-center text-[12.5px] text-[var(--am-text-secondary)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div
      className="max-h-64 overflow-y-auto rounded-[var(--am-radius-md)] border border-[var(--am-border-default)]"
      role="listbox"
      aria-label={tc(locale, "items.link.selectSupplier")}
    >
      {suppliers.map((s) => {
        const selected = selectedId === s.id;
        const country =
          SUPPLIER_COUNTRY_LABELS[s.countryCode]?.[
            locale === "ar" ? "ar" : "en"
          ] ?? s.countryCode;
        return (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={selected}
            className={cn(
              "flex w-full flex-col gap-0.5 border-b border-[var(--am-border-default)] px-3 py-2.5 text-start last:border-b-0",
              selected
                ? "bg-[var(--am-blue-100)]"
                : "hover:bg-[var(--am-surface-page)]",
            )}
            onClick={() => onSelect(s.id)}
          >
            <span className="text-[13px] font-semibold text-[var(--am-navy-900)]">
              {supplierName(s, locale)}
            </span>
            <span
              className="text-[11.5px] text-[var(--am-text-secondary)]"
              dir="ltr"
            >
              {s.code} · {country}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ItemSupplierLinkDialog({
  open,
  onClose,
  itemId,
  locale,
  editing,
  initialSupplierId,
  suppliers,
  existingLinks,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
  locale: Locale;
  editing: ItemSupplierLink | null;
  initialSupplierId?: string | null;
  suppliers: readonly SupplierRecord[];
  existingLinks: readonly ItemSupplierLink[];
  onToast: (message: string, tone?: "success" | "error") => void;
}) {
  const [values, setValues] = useState<ItemSupplierLinkFormValues>(() => {
    if (editing) return linkToFormValues(editing);
    return {
      ...EMPTY_ITEM_SUPPLIER_FORM,
      supplierId: initialSupplierId ?? "",
    };
  });
  const [errors, setErrors] = useState<ItemSupplierFieldErrors>({});
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const linkedIds = useMemo(() => {
    const set = new Set(
      existingLinks
        .filter((l) => l.status === "active" && l.id !== editing?.id)
        .map((l) => l.supplierId),
    );
    return set;
  }, [existingLinks, editing]);

  const selectable = useMemo(() => {
    return suppliers
      .filter((s) => {
        if (editing && s.id === editing.supplierId) return true;
        if (s.status !== "active") return false;
        if (linkedIds.has(s.id)) return false;
        return matchesSupplierQuery(s, query.trim());
      })
      .slice()
      .sort((a, b) =>
        supplierName(a, locale).localeCompare(
          supplierName(b, locale),
          locale === "ar" ? "ar" : "en",
          { sensitivity: "base" },
        ),
      );
  }, [suppliers, editing, linkedIds, query, locale]);

  function setField<K extends keyof ItemSupplierLinkFormValues>(
    key: K,
    value: ItemSupplierLinkFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const supplier = suppliers.find((s) => s.id === values.supplierId);
    const fieldErrors = validateItemSupplierForm(values, locale, {
      unknownSupplier: Boolean(values.supplierId) && !supplier,
      inactiveSupplier:
        !editing &&
        supplier != null &&
        supplier.status !== "active",
      duplicate:
        Boolean(values.supplierId) &&
        linkedIds.has(values.supplierId) &&
        values.status === "active",
    });
    if (hasItemSupplierFieldErrors(fieldErrors)) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        updateItemSupplierLink(editing.id, values);
      } else {
        createItemSupplierLink(itemId, values);
      }
      onToast(tc(locale, "items.link.saveSuccess"));
      onClose();
    } catch (err) {
      const code =
        err instanceof ItemSupplierLinkError ? err.code : "persist-failed";
      const key =
        code === "duplicate"
          ? "items.link.duplicate"
          : code === "inactive-supplier"
            ? "items.link.inactiveSupplier"
            : code === "unknown-supplier"
              ? "items.link.unknownSupplier"
              : code === "unknown-item"
                ? "items.link.unknownItem"
                : code === "unknown-link"
                  ? "items.link.unknownLink"
                  : "items.link.saveError";
      setErrors({ form: tc(locale, key) });
      onToast(tc(locale, key), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px] text-[var(--am-navy-900)]";

  return (
    <ModalDialog
      open={open}
      onClose={() => (submitting ? undefined : onClose())}
      title={tc(
        locale,
        editing ? "items.link.titleEdit" : "items.link.titleAdd",
      )}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] px-3 text-[12.5px] font-semibold"
            disabled={submitting}
            onClick={onClose}
          >
            {tc(locale, "items.link.cancel")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            disabled={submitting}
            onClick={handleSave}
          >
            {tc(locale, "items.link.save")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {errors.form ? (
          <p className="rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-danger-600)_10%,white)] px-3 py-2 text-[12.5px] font-medium text-[var(--am-danger-600)]">
            {errors.form}
          </p>
        ) : null}

        <Field
          label={tc(locale, "items.link.searchSupplier")}
          error={errors.supplierId}
        >
          {editing ? (
            <div className="rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2 text-[13px] font-semibold">
              {(() => {
                const s = suppliers.find((x) => x.id === editing.supplierId);
                return s
                  ? `${supplierName(s, locale)} (${s.code})`
                  : editing.supplierId;
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--am-text-secondary)]"
                  aria-hidden
                />
                <input
                  type="search"
                  className={cn(inputClass, "ps-8")}
                  placeholder={tc(locale, "items.link.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <SupplierDirectoryList
                locale={locale}
                suppliers={selectable}
                selectedId={values.supplierId || undefined}
                emptyLabel={tc(locale, "items.link.noSuppliers")}
                onSelect={(id) => setField("supplierId", id)}
              />
            </div>
          )}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tc(locale, "items.link.supplierItemCode")}>
            <input
              className={inputClass}
              dir="ltr"
              value={values.supplierItemCode}
              onChange={(e) => setField("supplierItemCode", e.target.value)}
            />
          </Field>
          <Field
            label={tc(locale, "items.link.status")}
          >
            <select
              className={inputClass}
              value={values.status}
              onChange={(e) =>
                setField(
                  "status",
                  e.target.value === "inactive" ? "inactive" : "active",
                )
              }
            >
              <option value="active">
                {tc(locale, "items.link.status.active")}
              </option>
              <option value="inactive">
                {tc(locale, "items.link.status.inactive")}
              </option>
            </select>
          </Field>
          <Field
            label={tc(locale, "items.link.purchasePrice")}
            error={errors.purchasePrice}
          >
            <input
              className={inputClass}
              dir="ltr"
              inputMode="decimal"
              value={values.purchasePrice}
              onChange={(e) => setField("purchasePrice", e.target.value)}
            />
          </Field>
          <Field
            label={tc(locale, "items.link.currency")}
            error={errors.currency}
          >
            <select
              className={inputClass}
              value={values.currency}
              onChange={(e) =>
                setField(
                  "currency",
                  e.target.value === "USD" || e.target.value === "EGP"
                    ? e.target.value
                    : "",
                )
              }
            >
              <option value="">—</option>
              <option value="USD">
                {tc(locale, "items.pricing.currencyUsd")}
              </option>
              <option value="EGP">
                {tc(locale, "items.pricing.currencyEgp")}
              </option>
            </select>
          </Field>
          <Field
            label={tc(locale, "items.link.leadTimeDays")}
            error={errors.leadTimeDays}
          >
            <input
              className={inputClass}
              dir="ltr"
              inputMode="numeric"
              value={values.leadTimeDays}
              onChange={(e) => setField("leadTimeDays", e.target.value)}
            />
          </Field>
          <Field
            label={tc(locale, "items.link.moq")}
            error={errors.minimumOrderQuantity}
          >
            <input
              className={inputClass}
              dir="ltr"
              inputMode="decimal"
              value={values.minimumOrderQuantity}
              onChange={(e) =>
                setField("minimumOrderQuantity", e.target.value)
              }
            />
          </Field>
        </div>

        <Field label={tc(locale, "items.link.notes")}>
          <textarea
            className={cn(inputClass, "min-h-20 resize-y")}
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </Field>

        <p className="text-[11.5px] text-[var(--am-text-secondary)]">
          {tc(locale, "items.link.priceNote")}
        </p>
      </div>
    </ModalDialog>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-[var(--am-danger-600)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
