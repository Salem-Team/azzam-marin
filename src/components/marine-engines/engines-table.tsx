"use client";

import { Ship } from "lucide-react";

import { CatalogActionsMenu } from "@/components/catalog/catalog-actions-menu";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ItemCountryFlag } from "@/components/items/item-country-flag";
import { RecordCardLink, RecordTableRow } from "@/components/ui/record-row";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc } from "@/i18n/catalog";
import { marineEngineDetailsHref } from "@/lib/record-routes";
import { sparePartsCompatibleWithEngine } from "@/lib/spare-parts-store";
import { getCountryLabel } from "@/lib/world-countries";
import type {
  CatalogItem,
  MarineEngineRecord,
  SparePartRecord,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface EnginesTableProps {
  rows: readonly MarineEngineRecord[];
  itemsById: ReadonlyMap<string, CatalogItem>;
  spareParts: readonly SparePartRecord[];
  locale: Locale;
  rowOffset: number;
  onEdit: (engine: MarineEngineRecord) => void;
  onOpen: (id: string) => void;
  onDelete?: (engine: MarineEngineRecord) => void;
  onToggleStatus?: (engine: MarineEngineRecord) => void;
}

function EngineThumb({
  item,
}: {
  item: CatalogItem | undefined;
}) {
  const src = useItemImageSrc(item?.id ?? "", item?.imageSrc ?? null);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-[var(--am-radius-md)] object-cover ring-1 ring-[var(--am-border-default)]"
      />
    );
  }
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-100)] text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]"
      aria-hidden
    >
      <Ship className="size-3.5 opacity-80" />
    </span>
  );
}

export function EnginesTable({
  rows,
  itemsById,
  spareParts,
  locale,
  rowOffset,
  onEdit,
  onOpen,
  onDelete,
  onToggleStatus,
}: EnginesTableProps) {
  return (
    <>
      <ul className="grid gap-2.5 p-2.5 sm:p-3 xl:hidden">
        {rows.map((engine, index) => {
          const item = engine.itemId
            ? itemsById.get(engine.itemId)
            : undefined;
          const partsCount = sparePartsCompatibleWithEngine(
            engine.id,
            spareParts,
          ).length;
          return (
            <li key={engine.id} className="flex items-stretch gap-2">
              <RecordCardLink
                href={marineEngineDetailsHref(engine.id)}
                label={`${tc(locale, "catalog.openRecord")} ${engine.model}`}
                className="min-w-0 flex-1 overflow-hidden rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_40%,white)] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <EngineThumb item={item} />
                    <p className="truncate text-[13px] font-bold text-[var(--am-navy-900)]">
                      <span className="me-1 text-[11px] font-medium text-[var(--am-text-secondary)]">
                        {rowOffset + index + 1}.
                      </span>
                      {engine.manufacturer}
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      engine.status === "active"
                        ? tc(locale, "items.status.active")
                        : tc(locale, "items.status.inactive")
                    }
                    tone={engine.status === "active" ? "approved" : "out"}
                    className="shrink-0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 py-2.5 text-[11.5px]">
                  <div>
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      {tc(locale, "engines.col.model")}
                    </p>
                    <p className="mt-0.5 font-mono text-[13px] font-bold text-[var(--am-navy-900)]">
                      {engine.model}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      {tc(locale, "engines.col.year")}
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold tabular-nums">
                      {engine.year}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      {tc(locale, "engines.col.hp")}
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold tabular-nums">
                      {engine.horsepower} {tc(locale, "engines.hpUnit")}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      {tc(locale, "engines.col.origin")}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <ItemCountryFlag code={engine.countryCode} />
                      <span className="truncate">
                        {getCountryLabel(engine.countryCode, locale) ||
                          engine.countryOfOrigin}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-[var(--am-text-secondary)]">
                      {tc(locale, "engines.col.serial")}
                    </p>
                    <p
                      className="mt-0.5 break-all font-mono text-[12px] font-semibold text-[var(--am-navy-900)]"
                      dir="ltr"
                    >
                      {engine.serialNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--am-border-default)] px-3 py-2 text-[11px]">
                  <span className="font-semibold text-[var(--am-blue-700)]">
                    {partsCount} {tc(locale, "engines.col.parts")}
                  </span>
                  {item ? (
                    <span className="font-mono text-[var(--am-text-secondary)]">
                      {item.itemCode}
                    </span>
                  ) : null}
                </div>
              </RecordCardLink>
              <CatalogActionsMenu
                locale={locale}
                onView={() => onOpen(engine.id)}
                onEdit={() => onEdit(engine)}
                onDelete={onDelete ? () => onDelete(engine) : undefined}
                deleteLabel={tc(locale, "engines.delete")}
                onStatusAction={
                  onToggleStatus ? () => onToggleStatus(engine) : undefined
                }
                statusActionLabel={
                  engine.status === "active"
                    ? tc(locale, "engines.deactivate")
                    : tc(locale, "engines.activate")
                }
              />
            </li>
          );
        })}
      </ul>

      <div className="hidden min-w-0 overflow-x-auto xl:block">
        <table className="w-full min-w-[1080px] border-collapse text-start text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_55%,white)] text-[11px] font-semibold tracking-wide text-[var(--am-text-secondary)]">
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "catalog.col.index")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.image")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.manufacturer")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.model")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.year")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.hp")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.serial")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.origin")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.parts")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "engines.col.status")}
              </th>
              <th className="px-3 py-2.5 text-start">
                {tc(locale, "catalog.col.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((engine, index) => {
              const item = engine.itemId
                ? itemsById.get(engine.itemId)
                : undefined;
              const partsCount = sparePartsCompatibleWithEngine(
                engine.id,
                spareParts,
              ).length;
              return (
                <RecordTableRow key={engine.id}>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--am-text-secondary)]">
                    {rowOffset + index + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <EngineThumb item={item} />
                  </td>
                  <td className="max-w-[10rem] px-3 py-2.5 font-semibold text-[var(--am-navy-900)]">
                    <span className="line-clamp-2">{engine.manufacturer}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="am-focus-ring max-w-[9rem] truncate rounded font-mono text-[13px] font-bold text-[var(--am-blue-700)] hover:underline"
                      onClick={() => onOpen(engine.id)}
                    >
                      {engine.model}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{engine.year}</td>
                  <td className="px-3 py-2.5 font-bold tabular-nums text-[var(--am-navy-900)]">
                    {engine.horsepower}
                  </td>
                  <td
                    className="max-w-[9rem] truncate px-3 py-2.5 font-mono tabular-nums text-[var(--am-text-secondary)]"
                    dir="ltr"
                    title={engine.serialNumber}
                  >
                    {engine.serialNumber}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--am-text-secondary)]">
                    <span className="inline-flex max-w-[9rem] items-center gap-1.5">
                      <ItemCountryFlag code={engine.countryCode} />
                      <span className="truncate">
                        {getCountryLabel(engine.countryCode, locale) ||
                          engine.countryOfOrigin}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="am-focus-ring rounded font-semibold tabular-nums text-[var(--am-blue-700)] hover:underline"
                      onClick={() => onOpen(engine.id)}
                    >
                      {partsCount}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      label={
                        engine.status === "active"
                          ? tc(locale, "items.status.active")
                          : tc(locale, "items.status.inactive")
                      }
                      tone={engine.status === "active" ? "approved" : "out"}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <CatalogActionsMenu
                      locale={locale}
                      onView={() => onOpen(engine.id)}
                      onEdit={() => onEdit(engine)}
                      onDelete={onDelete ? () => onDelete(engine) : undefined}
                      deleteLabel={tc(locale, "engines.delete")}
                      onStatusAction={
                        onToggleStatus
                          ? () => onToggleStatus(engine)
                          : undefined
                      }
                      statusActionLabel={
                        engine.status === "active"
                          ? tc(locale, "engines.deactivate")
                          : tc(locale, "engines.activate")
                      }
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
