"use client";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { CountryFlag } from "@/components/suppliers/country-flag";
import { SupplierActionsMenu } from "@/components/suppliers/supplier-actions-menu";
import { RecordTableRow } from "@/components/ui/record-row";
import { SUPPLIER_COUNTRY_LABELS } from "@/config/mock-suppliers";
import { ts, type SupplierKey } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import { formatIsoDate, formatMoney } from "@/lib/format";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord } from "@/types/supplier";

interface SuppliersTableProps {
  rows: readonly SupplierRecord[];
  locale: Locale;
  rowOffset: number;
  selectedIds: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: readonly string[]) => void;
  onPreview: (supplier: SupplierRecord) => void;
  onEdit: (supplier: SupplierRecord) => void;
  onToggleStatus: (supplier: SupplierRecord) => void;
  onRemove: (supplier: SupplierRecord) => void;
  onOpenProfile: (id: string) => void;
}

function initials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!cleaned) return "—";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function SuppliersTable({
  rows,
  locale,
  rowOffset,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onEdit,
  onToggleStatus,
  onRemove,
  onOpenProfile,
}: SuppliersTableProps) {
  const allIds = rows.map((r) => r.id);
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id)) && !allSelected;

  return (
    <>
      <ul className="divide-y divide-[var(--am-border-default)] xl:hidden">
        {rows.map((s, index) => {
          const name = locale === "ar" ? s.nameAr : s.nameEn;
          const country =
            locale === "ar"
              ? SUPPLIER_COUNTRY_LABELS[s.countryCode].ar
              : SUPPLIER_COUNTRY_LABELS[s.countryCode].en;
          return (
            <li
              key={s.id}
              className="flex items-center gap-2 px-2.5 py-2.5 sm:px-3 am-transition-colors hover:bg-[var(--am-surface-page)]"
            >
              <input
                type="checkbox"
                className="am-focus-ring size-4 shrink-0 rounded border-[var(--am-border-default)]"
                checked={selectedIds.has(s.id)}
                onChange={() => onToggleSelect(s.id)}
                aria-label={`${ts(locale, "suppliers.col.select")} ${name}`}
              />
              <button
                type="button"
                className="am-focus-ring grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-[var(--am-radius-md)] px-0.5 py-0.5 text-start"
                onClick={() => onPreview(s)}
                aria-label={`${ts(locale, "suppliers.openRecord")} ${name}`}
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_6%,white)_100%)] text-[10px] font-bold tracking-wide text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]">
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-snug text-[var(--am-navy-900)]">
                    <span className="me-1 text-[11px] font-medium text-[var(--am-text-secondary)]">
                      {rowOffset + index + 1}.
                    </span>
                    {name}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-[var(--am-radius-sm)] px-1.5 py-0.5 text-[10px] font-semibold leading-none ring-1",
                        s.origin === "user"
                          ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)] ring-[color-mix(in_srgb,var(--am-blue-700)_25%,transparent)]"
                          : "bg-[color-mix(in_srgb,var(--am-warning-600)_12%,white)] text-[var(--am-warning-600)] ring-[color-mix(in_srgb,var(--am-warning-600)_25%,transparent)]",
                      )}
                    >
                      {ts(
                        locale,
                        s.origin === "user"
                          ? "suppliers.origin.user"
                          : "suppliers.origin.seed",
                      )}
                    </span>
                    <span className="inline-flex max-w-[45%] shrink-0 items-center truncate rounded-[var(--am-radius-sm)] bg-[color-mix(in_srgb,var(--am-navy-900)_6%,white)] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                      {ts(
                        locale,
                        `suppliers.category.${s.category}` as SupplierKey,
                      )}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-[var(--am-text-secondary)]">
                      <CountryFlag code={s.countryCode} />
                      <span className="truncate">{country}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge
                    label={ts(
                      locale,
                      s.status === "active"
                        ? "suppliers.status.active"
                        : "suppliers.status.inactive",
                    )}
                    tone={s.status === "active" ? "approved" : "out"}
                  />
                  <p
                    className={cn(
                      "text-[12px] font-bold tabular-nums",
                      s.balance > 0
                        ? "text-[var(--am-danger-600)]"
                        : "text-[var(--am-navy-900)]",
                    )}
                  >
                    {formatMoney(s.balance, "USD", locale)}
                  </p>
                </div>
              </button>
              <div className="shrink-0" data-row-ignore>
                <SupplierActionsMenu
                  locale={locale}
                  status={s.status}
                  onView={() => onOpenProfile(s.id)}
                  onEdit={() => onEdit(s)}
                  onToggleStatus={() => onToggleStatus(s)}
                  onRemove={() => onRemove(s)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden w-full min-w-0 xl:block">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[880px] border-collapse text-start text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_88%,white)] text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--am-text-secondary)]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    className="am-focus-ring size-4 rounded border-[var(--am-border-default)]"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => onToggleSelectAll(allIds)}
                    aria-label={ts(locale, "suppliers.col.select")}
                  />
                </th>
                <th className="w-10 px-2 py-3">
                  {ts(locale, "suppliers.col.index")}
                </th>
                <th className="min-w-[240px] px-3 py-3">
                  {ts(locale, "suppliers.col.name")}
                </th>
                <th className="px-3 py-3">
                  {ts(locale, "suppliers.col.country")}
                </th>
                <th className="px-3 py-3">
                  {ts(locale, "suppliers.col.taxId")}
                </th>
                <th className="px-3 py-3 text-end">
                  {ts(locale, "suppliers.col.purchases")}
                </th>
                <th className="px-3 py-3 text-end">
                  {ts(locale, "suppliers.col.balance")}
                </th>
                <th className="px-3 py-3">
                  {ts(locale, "suppliers.col.status")}
                </th>
                <th className="px-3 py-3">
                  {ts(locale, "suppliers.col.lastTx")}
                </th>
                <th className="w-12 px-2 py-3 text-end">
                  <span className="sr-only">
                    {ts(locale, "suppliers.col.actions")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, index) => {
                const name = locale === "ar" ? s.nameAr : s.nameEn;
                const country =
                  locale === "ar"
                    ? SUPPLIER_COUNTRY_LABELS[s.countryCode].ar
                    : SUPPLIER_COUNTRY_LABELS[s.countryCode].en;
                return (
                  <RecordTableRow
                    key={s.id}
                    className="border-b border-[var(--am-border-default)] am-transition-colors last:border-b-0 hover:bg-[color-mix(in_srgb,var(--am-blue-100)_35%,transparent)]"
                  >
                    <td className="relative z-[2] px-3 py-2.5" data-row-ignore>
                      <input
                        type="checkbox"
                        className="am-focus-ring size-4 rounded border-[var(--am-border-default)]"
                        checked={selectedIds.has(s.id)}
                        onChange={() => onToggleSelect(s.id)}
                        aria-label={`${ts(locale, "suppliers.col.select")} ${name}`}
                      />
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                      {rowOffset + index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        className="am-stretched-link flex min-w-0 max-w-[300px] items-center gap-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]"
                        onClick={() => onPreview(s)}
                        aria-label={`${ts(locale, "suppliers.openRecord")} ${name}`}
                      >
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-lg)] bg-[linear-gradient(160deg,var(--am-blue-100)_0%,color-mix(in_srgb,var(--am-navy-900)_6%,white)_100%)] text-[10px] font-bold tracking-wide text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]">
                          {initials(name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold leading-snug text-[var(--am-navy-900)]">
                            {name}
                          </span>
                          <span
                            className="mt-0.5 block truncate font-mono text-[10.5px] tabular-nums text-[var(--am-text-muted)]"
                            dir="ltr"
                          >
                            {s.code}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-[var(--am-radius-sm)] px-1.5 py-0.5 text-[10px] font-semibold leading-none ring-1",
                                s.origin === "user"
                                  ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)] ring-[color-mix(in_srgb,var(--am-blue-700)_25%,transparent)]"
                                  : "bg-[color-mix(in_srgb,var(--am-warning-600)_12%,white)] text-[var(--am-warning-600)] ring-[color-mix(in_srgb,var(--am-warning-600)_25%,transparent)]",
                              )}
                            >
                              {ts(
                                locale,
                                s.origin === "user"
                                  ? "suppliers.origin.user"
                                  : "suppliers.origin.seed",
                              )}
                            </span>
                            <span className="inline-flex max-w-full items-center rounded-[var(--am-radius-sm)] bg-[color-mix(in_srgb,var(--am-navy-900)_6%,white)] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                              <span className="truncate">
                                {ts(
                                  locale,
                                  `suppliers.category.${s.category}` as SupplierKey,
                                )}
                              </span>
                            </span>
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <CountryFlag code={s.countryCode} />
                        <span className="text-[var(--am-text-primary)]">
                          {country}
                        </span>
                      </span>
                    </td>
                    <td
                      className="max-w-[150px] truncate px-3 py-2.5 font-mono text-[12px] tabular-nums text-[var(--am-text-secondary)]"
                      dir="ltr"
                      title={s.taxId}
                    >
                      {s.taxId || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-[var(--am-navy-900)]">
                      {formatMoney(s.totalPurchases, "USD", locale)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-end font-semibold tabular-nums",
                        s.balance > 0
                          ? "text-[var(--am-danger-600)]"
                          : "text-[var(--am-navy-900)]",
                      )}
                    >
                      {formatMoney(s.balance, "USD", locale)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        label={ts(
                          locale,
                          s.status === "active"
                            ? "suppliers.status.active"
                            : "suppliers.status.inactive",
                        )}
                        tone={s.status === "active" ? "approved" : "out"}
                        className="px-2.5"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                      {formatIsoDate(s.lastTransactionDate, locale)}
                    </td>
                    <td
                      className="relative z-[2] px-2 py-2.5 text-end"
                      data-row-ignore
                    >
                      <SupplierActionsMenu
                        locale={locale}
                        status={s.status}
                        onView={() => onOpenProfile(s.id)}
                        onEdit={() => onEdit(s)}
                        onToggleStatus={() => onToggleStatus(s)}
                        onRemove={() => onRemove(s)}
                      />
                    </td>
                  </RecordTableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
