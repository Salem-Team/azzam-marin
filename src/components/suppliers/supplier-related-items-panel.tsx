"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Package } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageSurface } from "@/components/layout/page-frame";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { ts } from "@/i18n/suppliers";
import { formatMoney } from "@/lib/format";
import { effectiveItemOnHandQty } from "@/lib/item-on-hand";
import { primarySpareForItem } from "@/lib/inventory-cross-module";
import {
  useItemSupplierLinks,
  useItemSupplierLinksHydrated,
} from "@/lib/item-suppliers-store";
import { useItems, useItemsHydrated } from "@/lib/items-store";
import {
  itemDetailsHref,
  sparePartDetailsHref,
} from "@/lib/record-routes";
import { useSpareParts } from "@/lib/spare-parts-store";
import { useWarehouseStock } from "@/lib/inventory-stock-store";
import type { Locale } from "@/types/i18n";

export function SupplierRelatedItemsPanel({
  supplierId,
  locale,
}: {
  supplierId: string;
  locale: Locale;
}) {
  const links = useItemSupplierLinks();
  const linksHydrated = useItemSupplierLinksHydrated();
  const items = useItems();
  const itemsHydrated = useItemsHydrated();
  const spareParts = useSpareParts();
  useWarehouseStock();

  const related = useMemo(
    () => links.filter((l) => l.supplierId === supplierId),
    [links, supplierId],
  );

  const itemById = useMemo(() => {
    const map = new Map(items.map((i) => [i.id, i]));
    return map;
  }, [items]);

  const ready = linksHydrated && itemsHydrated;

  return (
    <PageSurface fill={false} className="overflow-hidden !shadow-none">
      <div className="border-b border-[var(--am-border-default)] px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-[var(--am-navy-900)]">
          {ts(locale, "suppliers.details.items")}
        </h2>
      </div>

      {!ready ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {ts(locale, "suppliers.details.itemsLoading")}
        </div>
      ) : related.length === 0 ? (
        <div className="space-y-3 px-4 py-8 text-center">
          <p className="text-[12.5px] text-[var(--am-text-secondary)]">
            {ts(locale, "suppliers.details.itemsEmpty")}
          </p>
          <Link
            href="/items"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
          >
            <Package className="size-3.5" aria-hidden />
            {ts(locale, "suppliers.details.itemsEmptyAction")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.code")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.name")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.type")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.supplierItemCode")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.price")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.leadTime")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.onHand")}
                </th>
                <th className="px-3 py-2.5">
                  {ts(locale, "suppliers.details.items.col.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {related.map((link) => {
                const item = itemById.get(link.itemId);
                const spare = item
                  ? primarySpareForItem(item.id, spareParts)
                  : undefined;
                const name = item
                  ? locale === "ar"
                    ? item.nameAr
                    : item.nameEn
                  : ts(locale, "suppliers.details.items.missingItem");
                return (
                  <tr
                    key={link.id}
                    className="border-t border-[var(--am-border-default)]"
                  >
                    <td className="px-3 py-2.5 font-mono tabular-nums" dir="ltr">
                      {item ? (
                        <Link
                          href={itemDetailsHref(item.itemCode)}
                          className="am-focus-ring font-semibold text-[var(--am-blue-700)] hover:underline"
                        >
                          {item.itemCode}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        {item ? (
                          <Link
                            href={itemDetailsHref(item.itemCode)}
                            className="am-focus-ring font-semibold text-[var(--am-navy-900)] hover:text-[var(--am-blue-700)] hover:underline"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="text-[var(--am-text-secondary)]">
                            {name}
                          </span>
                        )}
                        {spare ? (
                          <Link
                            href={sparePartDetailsHref(spare.id)}
                            className="am-focus-ring text-[11px] font-semibold text-[var(--am-blue-700)] hover:underline"
                          >
                            {ts(locale, "suppliers.details.items.viewSpare")}
                          </Link>
                        ) : null}
                        {item && item.status !== "active" ? (
                          <span className="text-[11px] text-[var(--am-warning-600)]">
                            {ts(locale, "suppliers.details.items.inactiveItem")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {item
                        ? tc(
                            locale,
                            `items.type.${item.itemType}` as CatalogKey,
                          )
                        : "—"}
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
                    <td className="px-3 py-2.5 font-semibold tabular-nums" dir="ltr">
                      {item ? effectiveItemOnHandQty(item) : "—"}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-[var(--am-border-default)] px-4 py-2 text-[11.5px] text-[var(--am-text-secondary)]">
        {ts(locale, "suppliers.details.itemsHint")}
      </p>
    </PageSurface>
  );
}
