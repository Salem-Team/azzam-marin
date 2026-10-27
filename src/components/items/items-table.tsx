"use client";

import { Package } from "lucide-react";

import { CatalogActionsMenu } from "@/components/catalog/catalog-actions-menu";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ItemCountryFlag } from "@/components/items/item-country-flag";
import { RecordCardLink, RecordTableRow } from "@/components/ui/record-row";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, type CatalogKey } from "@/i18n/catalog";
import { formatMoney } from "@/lib/format";
import { itemDetailsHref } from "@/lib/record-routes";
import type { CatalogItem, ItemStatusId, ItemTypeId } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface ItemsTableProps {
  rows: readonly CatalogItem[];
  locale: Locale;
  rowOffset: number;
  selectedIds: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: readonly string[]) => void;
  onEdit: (item: CatalogItem) => void;
  onOpen: (itemCode: string) => void;
}

function statusTone(status: ItemStatusId) {
  if (status === "active") return "approved" as const;
  if (status === "discontinued") return "out" as const;
  return "pending" as const;
}

function typeTone(type: ItemTypeId) {
  if (type === "operating_supplies") return "pending" as const;
  if (type === "raw_materials") return "out" as const;
  if (type === "other_materials") return "inventory" as const;
  if (type === "spare_part") return "inTransit" as const;
  if (type === "uncategorized") return "pending" as const;
  return "pricing" as const;
}

function thumbTone(type: ItemTypeId): string {
  if (type === "operating_supplies") {
    return "from-[color-mix(in_srgb,var(--am-warning-600)_22%,white)] to-[var(--am-blue-100)]";
  }
  if (type === "raw_materials") {
    return "from-[color-mix(in_srgb,var(--am-success-600)_18%,white)] to-[var(--am-blue-100)]";
  }
  if (type === "other_materials") {
    return "from-[color-mix(in_srgb,var(--am-navy-900)_12%,white)] to-[var(--am-blue-100)]";
  }
  if (type === "spare_part") {
    return "from-[color-mix(in_srgb,var(--am-blue-700)_16%,white)] to-white";
  }
  if (type === "uncategorized") {
    return "from-[var(--am-surface-page)] to-[var(--am-blue-100)]";
  }
  return "from-[var(--am-blue-100)] to-white";
}

function ItemThumb({ item }: { item: CatalogItem }) {
  const src = useItemImageSrc(item.id, item.imageSrc);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="size-10 rounded-[var(--am-radius-md)] object-cover ring-1 ring-[var(--am-border-default)]"
      />
    );
  }
  return (
    <span
      className={`inline-flex size-10 items-center justify-center rounded-[var(--am-radius-md)] bg-gradient-to-br ${thumbTone(item.itemType)} text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]`}
      aria-hidden
    >
      <Package className="size-4 opacity-80" />
    </span>
  );
}

export function ItemsTable({
  rows,
  locale,
  rowOffset,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onOpen,
}: ItemsTableProps) {
  const allIds = rows.map((r) => r.id);
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected =
    rows.some((r) => selectedIds.has(r.id)) && !allSelected;

  return (
    <>
      <ul className="divide-y divide-[var(--am-border-default)] xl:hidden">
        {rows.map((item, index) => {
          const name = locale === "ar" ? item.nameAr : item.nameEn;
          const secondary = locale === "ar" ? item.nameEn : item.nameAr;
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 px-2.5 py-2.5 sm:px-3 am-transition-colors hover:bg-[var(--am-surface-page)]"
            >
              <input
                type="checkbox"
                className="am-focus-ring size-4 shrink-0 rounded border-[var(--am-border-default)]"
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
                aria-label={`${tc(locale, "items.col.select")} ${name}`}
              />
              <RecordCardLink
                href={itemDetailsHref(item.itemCode)}
                label={`${tc(locale, "catalog.openRecord")} ${name}`}
                className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5"
              >
                <ItemThumb item={item} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]">
                    <span className="me-1 text-[11px] font-medium text-[var(--am-text-secondary)]">
                      {rowOffset + index + 1}.
                    </span>
                    {name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--am-text-secondary)]">
                    {secondary}
                  </p>
                  <p
                    className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--am-text-secondary)]"
                    dir="ltr"
                  >
                    {item.itemCode}
                    {item.partNumber ? ` · ${item.partNumber}` : ""}
                    {item.oemNumber ? ` · OEM ${item.oemNumber}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <StatusBadge
                      label={tc(
                        locale,
                        `items.type.${item.itemType}` as CatalogKey,
                      )}
                      tone={typeTone(item.itemType)}
                    />
                    <StatusBadge
                      label={tc(
                        locale,
                        `items.status.${item.status}` as CatalogKey,
                      )}
                      tone={statusTone(item.status)}
                    />
                  </div>
                </div>
                <div className="text-end">
                  <p
                    className="text-[12px] font-bold tabular-nums text-[var(--am-navy-900)]"
                    dir="ltr"
                  >
                    {formatMoney(item.sellEgp, "EGP", locale)}
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-[var(--am-text-secondary)]">
                    {tc(locale, "items.col.minStock")}: {item.minStock}
                  </p>
                </div>
              </RecordCardLink>
              <CatalogActionsMenu
                locale={locale}
                onView={() => onOpen(item.itemCode)}
                onEdit={() => onEdit(item)}
              />
            </li>
          );
        })}
      </ul>

      <div className="am-table-scroll hidden min-w-0 xl:block">
        <table className="w-full min-w-[1280px] border-collapse text-start text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_70%,white)] text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
              <th className="px-2 py-2.5">
                <input
                  type="checkbox"
                  className="am-focus-ring size-4 rounded border-[var(--am-border-default)]"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => onToggleSelectAll(allIds)}
                  aria-label={tc(locale, "items.col.select")}
                />
              </th>
              <th className="px-2 py-2.5">{tc(locale, "items.col.image")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.name")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.code")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.category")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.part")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.oem")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.type")}</th>
              <th className="px-3 py-2.5">
                {tc(locale, "items.col.manufacturer")}
              </th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.origin")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.uom")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.costUsd")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.sellEgp")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.minStock")}</th>
              <th className="px-3 py-2.5">{tc(locale, "items.col.status")}</th>
              <th className="px-3 py-2.5">{tc(locale, "catalog.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const nameAr = item.nameAr;
              const nameEn = item.nameEn;
              return (
                <RecordTableRow key={item.id}>
                  <td className="px-2 py-2.5" data-row-ignore>
                    <input
                      type="checkbox"
                      className="am-focus-ring size-4 rounded border-[var(--am-border-default)]"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                      aria-label={tc(locale, "items.col.select")}
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <ItemThumb item={item} />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="am-focus-ring max-w-[14rem] rounded text-start"
                      onClick={() => onOpen(item.itemCode)}
                    >
                      <p className="truncate font-semibold text-[var(--am-navy-900)]">
                        {locale === "ar" ? nameAr : nameEn}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--am-text-secondary)]">
                        {locale === "ar" ? nameEn : nameAr}
                      </p>
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="font-mono text-[12.5px] font-semibold text-[var(--am-blue-700)]"
                      dir="ltr"
                    >
                      {item.itemCode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--am-navy-900)]">
                    {tc(
                      locale,
                      `items.category.${item.mainCategory}` as CatalogKey,
                    )}
                  </td>
                  <td
                    className="max-w-[8rem] truncate px-3 py-2.5 font-mono text-[var(--am-text-secondary)]"
                    dir="ltr"
                    title={item.partNumber ?? undefined}
                  >
                    {item.partNumber || "—"}
                  </td>
                  <td
                    className="max-w-[8rem] truncate px-3 py-2.5 font-mono text-[var(--am-text-secondary)]"
                    dir="ltr"
                    title={item.oemNumber ?? undefined}
                  >
                    {item.oemNumber || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      label={tc(
                        locale,
                        `items.type.${item.itemType}` as CatalogKey,
                      )}
                      tone={typeTone(item.itemType)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <ItemCountryFlag code={item.countryCode} />
                      <span className="font-medium text-[var(--am-navy-900)]">
                        {item.manufacturer}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--am-text-secondary)]">
                    {item.countryOfOrigin}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[var(--am-text-secondary)]">
                    {item.unitOfMeasure}
                  </td>
                  <td
                    className="px-3 py-2.5 tabular-nums text-[var(--am-navy-900)]"
                    dir="ltr"
                  >
                    {formatMoney(item.costUsd, "USD", locale)}
                  </td>
                  <td
                    className="px-3 py-2.5 font-bold tabular-nums text-[var(--am-navy-900)]"
                    dir="ltr"
                  >
                    {formatMoney(item.sellEgp, "EGP", locale)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--am-navy-900)]">
                    {item.minStock}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      label={tc(
                        locale,
                        `items.status.${item.status}` as CatalogKey,
                      )}
                      tone={statusTone(item.status)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <CatalogActionsMenu
                      locale={locale}
                      onView={() => onOpen(item.itemCode)}
                      onEdit={() => onEdit(item)}
                    />
                  </td>
                </RecordTableRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
