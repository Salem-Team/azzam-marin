"use client";

import { CatalogActionsMenu } from "@/components/catalog/catalog-actions-menu";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { RecordCardLink, RecordTableRow } from "@/components/ui/record-row";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { formatMoney } from "@/lib/format";
import { sparePartDetailsHref } from "@/lib/record-routes";
import {
  effectiveSpareOnHandQty,
  resolveSpareStockBadge,
  sparePartDisplayNames,
  type SpareStockBadgeId,
} from "@/lib/spare-parts-display";
import type { CatalogItem, SparePartRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const BADGE_TONE: Record<SpareStockBadgeId, StatusTone> = {
  active: "approved",
  inactive: "inventory",
  lowStock: "low",
  outOfStock: "out",
};

const BADGE_KEY: Record<SpareStockBadgeId, CatalogKey> = {
  active: "spare.badge.active",
  inactive: "spare.badge.inactive",
  lowStock: "spare.badge.lowStock",
  outOfStock: "spare.badge.outOfStock",
};

interface SparePartsTableProps {
  rows: readonly SparePartRecord[];
  itemsById: ReadonlyMap<string, CatalogItem>;
  locale: Locale;
  rowOffset: number;
  onEdit: (part: SparePartRecord) => void;
  onDelete?: (part: SparePartRecord) => void;
  onOpen: (id: string) => void;
}

export function SparePartsTable({
  rows,
  itemsById,
  locale,
  rowOffset,
  onEdit,
  onDelete,
  onOpen,
}: SparePartsTableProps) {
  return (
    <>
      <ul className="divide-y divide-[var(--am-border-default)] xl:hidden">
        {rows.map((part, index) => {
          const item = itemsById.get(part.itemId);
          const names = sparePartDisplayNames(part, item);
          const name = locale === "ar" ? names.nameAr : names.nameEn;
          const badge = resolveSpareStockBadge(item);
          return (
            <li
              key={part.id}
              className="flex items-stretch gap-2 px-2.5 py-2.5 sm:px-3"
            >
              <RecordCardLink
                href={sparePartDetailsHref(part.id)}
                label={`${tc(locale, "catalog.openRecord")} ${part.partNumber}`}
                className="min-w-0 flex-1 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--am-navy-900)_4%,white)_0%,white_55%)] p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
                      {rowOffset + index + 1}. {tc(locale, "spare.col.part")}
                    </p>
                    <p
                      className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {part.partNumber}
                    </p>
                  </div>
                  <StatusBadge
                    label={tc(locale, BADGE_KEY[badge])}
                    tone={BADGE_TONE[badge]}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="min-w-0 rounded-[var(--am-radius-sm)] bg-[var(--am-surface-page)] px-2 py-1.5">
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      OEM
                    </p>
                    <p
                      className="mt-0.5 truncate font-mono font-semibold text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {part.oemNumber || "—"}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[var(--am-radius-sm)] bg-[var(--am-surface-page)] px-2 py-1.5">
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      MPN
                    </p>
                    <p
                      className="mt-0.5 truncate font-mono font-semibold text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {part.manufacturerPartNumber}
                    </p>
                  </div>
                </div>
                <p className="mt-2 truncate text-[12px] font-medium text-[var(--am-navy-900)]">
                  {name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <StatusBadge
                    label={tc(
                      locale,
                      `spare.category.${part.partCategory}` as CatalogKey,
                    )}
                    tone="inventory"
                  />
                  <span className="inline-flex rounded-[var(--am-radius-sm)] bg-[var(--am-surface-page)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--am-text-secondary)]">
                    {part.compatibleEngineIds.length}{" "}
                    {tc(locale, "spare.col.engines")}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p
                    className="text-[11px] font-semibold tabular-nums text-[var(--am-text-secondary)]"
                    title={tc(locale, "spare.stock.demoHint")}
                  >
                    {item
                      ? effectiveSpareOnHandQty(item) > 0
                        ? tcCount(locale, "spare.stock.inStock", {
                            count: effectiveSpareOnHandQty(item),
                          })
                        : tc(locale, "spare.stock.outOfStock")
                      : "—"}
                  </p>
                  {item ? (
                    <p
                      className="text-[12px] font-bold tabular-nums text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {formatMoney(item.sellEgp, "EGP", locale)}
                    </p>
                  ) : null}
                </div>
              </RecordCardLink>
              <CatalogActionsMenu
                locale={locale}
                onView={() => onOpen(part.id)}
                onEdit={() => onEdit(part)}
                onDelete={onDelete ? () => onDelete(part) : undefined}
              />
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="w-full min-w-[1120px] border-collapse text-start text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-navy-900)_4%,white)] text-[11px] font-semibold uppercase tracking-wide text-[var(--am-text-secondary)]">
              <th className="px-3 py-2.5">{tc(locale, "catalog.col.index")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.part")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.oem")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.mpn")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.category")}</th>
              <th className="px-3 py-2.5">
                {tc(locale, "spare.col.manufacturer")}
              </th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.item")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.engines")}</th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.alts")}</th>
              <th className="px-3 py-2.5">
                {tc(locale, "spare.col.availability")}
              </th>
              <th className="px-3 py-2.5">{tc(locale, "spare.col.price")}</th>
              <th className="px-3 py-2.5">{tc(locale, "catalog.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((part, index) => {
              const item = itemsById.get(part.itemId);
              const names = sparePartDisplayNames(part, item);
              const badge = resolveSpareStockBadge(item);
              return (
                <RecordTableRow key={part.id}>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                    {rowOffset + index + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="am-focus-ring rounded font-mono text-[13px] font-bold text-[var(--am-blue-700)] hover:underline"
                      dir="ltr"
                      onClick={() => onOpen(part.id)}
                    >
                      {part.partNumber}
                    </button>
                    <p className="mt-0.5 max-w-[12rem] truncate text-[11px] text-[var(--am-text-secondary)]">
                      {locale === "ar" ? names.nameAr : names.nameEn}
                    </p>
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums text-[var(--am-navy-900)]"
                    dir="ltr"
                  >
                    {part.oemNumber || "—"}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums text-[var(--am-text-secondary)]"
                    dir="ltr"
                  >
                    {part.manufacturerPartNumber}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      label={tc(
                        locale,
                        `spare.category.${part.partCategory}` as CatalogKey,
                      )}
                      tone="inventory"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-[var(--am-navy-900)]">
                      {part.manufacturer}
                    </p>
                    <p className="text-[11px] text-[var(--am-text-secondary)]">
                      {part.countryOfOrigin}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--am-blue-700)]">
                    {item?.itemCode ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-[var(--am-navy-900)]">
                    {part.compatibleEngineIds.length}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                    {part.alternativeLinks.length}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      label={tc(locale, BADGE_KEY[badge])}
                      tone={BADGE_TONE[badge]}
                    />
                    {item ? (
                      <p
                        className="mt-1 text-[11px] font-semibold tabular-nums text-[var(--am-text-secondary)]"
                        title={tc(locale, "spare.stock.demoHint")}
                      >
                        {effectiveSpareOnHandQty(item) > 0
                          ? tcCount(locale, "spare.stock.inStock", {
                              count: effectiveSpareOnHandQty(item),
                            })
                          : tc(locale, "spare.stock.outOfStock")}
                      </p>
                    ) : null}
                  </td>
                  <td
                    className="px-3 py-2.5 font-bold tabular-nums text-[var(--am-navy-900)]"
                    dir="ltr"
                  >
                    {item
                      ? formatMoney(item.sellEgp, "EGP", locale)
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <CatalogActionsMenu
                      locale={locale}
                      onView={() => onOpen(part.id)}
                      onEdit={() => onEdit(part)}
                      onDelete={onDelete ? () => onDelete(part) : undefined}
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
