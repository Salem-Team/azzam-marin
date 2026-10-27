"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { WorldCountrySelect } from "@/components/ui/world-country-select";
import { tc, type CatalogKey } from "@/i18n/catalog";
import type { ItemFilters } from "@/lib/catalog-query";
import { cn } from "@/lib/cn";
import type {
  ItemCategoryId,
  ItemStatusId,
  ItemTypeId,
  StockLevelFilterId,
} from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const FIELD =
  "am-focus-ring h-10 w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-2.5 text-[12.5px] text-[var(--am-navy-900)] outline-none";

interface ItemFiltersDialogProps {
  open: boolean;
  locale: Locale;
  draft: ItemFilters;
  onDraftChange: (next: ItemFilters) => void;
  /** Form manufacturers ∪ catalog data. */
  manufacturers: readonly string[];
  /** Form units ∪ catalog data. */
  units: readonly string[];
  itemTypes: readonly ItemTypeId[];
  categories: readonly ItemCategoryId[];
  statuses: readonly ItemStatusId[];
  stockLevels: readonly StockLevelFilterId[];
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-[var(--am-radius-lg)] border border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_55%,white)] p-3 sm:p-3.5">
      <h3 className="text-[12px] font-bold text-[var(--am-navy-900)]">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid min-w-0 gap-1.5 text-[12px]", className)}>
      <span className="font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ItemFiltersDialog({
  open,
  locale,
  draft,
  onDraftChange,
  manufacturers,
  units,
  itemTypes,
  categories,
  statuses,
  stockLevels,
  onClose,
  onClear,
  onApply,
}: ItemFiltersDialogProps) {
  const patch = (partial: Partial<ItemFilters>) =>
    onDraftChange({ ...draft, ...partial });

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={tc(locale, "items.filters.title")}
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 min-w-[7rem] flex-1 items-center justify-center rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-4 text-[12.5px] font-semibold text-[var(--am-navy-900)] sm:flex-none"
            onClick={onClear}
          >
            {tc(locale, "catalog.clearFilters")}
          </button>
          <button
            type="button"
            className="am-focus-ring inline-flex h-10 min-w-[8.5rem] flex-1 items-center justify-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-4 text-[12.5px] font-semibold text-white hover:opacity-95 sm:flex-none"
            onClick={onApply}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            {tc(locale, "catalog.applyFilters")}
          </button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Section title={tc(locale, "items.filters.section.classify")}>
          <Field label={tc(locale, "items.filter.type")}>
            <select
              value={draft.type}
              onChange={(e) =>
                patch({ type: e.target.value as ItemTypeId | "" })
              }
              className={FIELD}
            >
              <option value="">{tc(locale, "catalog.filter.all")}</option>
              {itemTypes.map((type) => (
                <option key={type} value={type}>
                  {tc(locale, `items.type.${type}` as CatalogKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tc(locale, "items.filter.category")}>
            <select
              value={draft.category}
              onChange={(e) =>
                patch({ category: e.target.value as ItemCategoryId | "" })
              }
              className={FIELD}
            >
              <option value="">{tc(locale, "catalog.filter.all")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {tc(locale, `items.category.${cat}` as CatalogKey)}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title={tc(locale, "items.filters.section.source")}>
          <Field label={tc(locale, "catalog.filter.manufacturer")}>
            <select
              value={draft.manufacturer}
              onChange={(e) => patch({ manufacturer: e.target.value })}
              className={FIELD}
            >
              <option value="">{tc(locale, "catalog.filter.all")}</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tc(locale, "items.filter.origin")}>
            <WorldCountrySelect
              value={draft.countryCode}
              locale={locale}
              label={tc(locale, "items.filter.origin")}
              allowEmpty
              emptyLabel={tc(locale, "catalog.filter.all")}
              searchPlaceholder={tc(locale, "items.form.originSearch")}
              onChange={(code) => patch({ countryCode: code })}
            />
          </Field>
        </Section>

        <Section title={tc(locale, "items.filters.section.status")}>
          <Field label={tc(locale, "items.filter.status")}>
            <select
              value={draft.statuses}
              onChange={(e) =>
                patch({ statuses: e.target.value as ItemStatusId | "" })
              }
              className={FIELD}
            >
              <option value="">{tc(locale, "catalog.filter.all")}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {tc(locale, `items.status.${status}` as CatalogKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tc(locale, "items.filter.uom")}>
            <select
              value={draft.unitOfMeasure}
              onChange={(e) => patch({ unitOfMeasure: e.target.value })}
              className={FIELD}
            >
              <option value="">{tc(locale, "catalog.filter.all")}</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={tc(locale, "items.filter.stockLevel")}
            className="sm:col-span-2"
          >
            <select
              value={draft.stockLevel}
              onChange={(e) =>
                patch({
                  stockLevel: e.target.value as StockLevelFilterId,
                })
              }
              className={FIELD}
            >
              {stockLevels.map((level) => (
                <option key={level} value={level}>
                  {tc(locale, `items.stockLevel.${level}` as CatalogKey)}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title={tc(locale, "items.filters.section.price")}>
          <Field label={tc(locale, "items.filter.priceFrom")}>
            <input
              inputMode="decimal"
              value={draft.priceMinEgp}
              onChange={(e) => patch({ priceMinEgp: e.target.value })}
              placeholder="0"
              className={FIELD}
              dir="ltr"
            />
          </Field>
          <Field label={tc(locale, "items.filter.priceTo")}>
            <input
              inputMode="decimal"
              value={draft.priceMaxEgp}
              onChange={(e) => patch({ priceMaxEgp: e.target.value })}
              placeholder="0"
              className={FIELD}
              dir="ltr"
            />
          </Field>
        </Section>
      </div>
    </ModalDialog>
  );
}
