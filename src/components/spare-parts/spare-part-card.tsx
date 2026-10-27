"use client";

import type { ReactNode } from "react";
import { Cog, GitCompareArrows, Package, Pencil } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { CatalogActionsMenu } from "@/components/catalog/catalog-actions-menu";
import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { tc, tcCount, type CatalogKey } from "@/i18n/catalog";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
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

interface SparePartCardProps {
  part: SparePartRecord;
  item: CatalogItem | undefined;
  locale: Locale;
  onOpen: (id: string) => void;
  onEdit: (part: SparePartRecord) => void;
  onDelete?: (part: SparePartRecord) => void;
}

export function SparePartCard({
  part,
  item,
  locale,
  onOpen,
  onEdit,
  onDelete,
}: SparePartCardProps) {
  const imageSrc = useItemImageSrc(item?.id ?? part.itemId, item?.imageSrc ?? null);
  const badge = resolveSpareStockBadge(item);
  const names = sparePartDisplayNames(part, item);
  const primaryName = locale === "ar" ? names.nameAr : names.nameEn;
  const secondaryName = locale === "ar" ? names.nameEn : names.nameAr;
  const qty = item ? effectiveSpareOnHandQty(item) : undefined;
  const stockOk = qty != null && qty > 0;
  const stockLabel =
    qty == null
      ? "—"
      : stockOk
        ? tcCount(locale, "spare.stock.inStock", { count: qty })
        : tc(locale, "spare.stock.outOfStock");

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-[var(--am-radius-lg)]",
        "border border-[var(--am-border-default)] bg-[var(--am-surface-raised)]",
        "shadow-[var(--am-shadow-sm)] transition-[border-color,box-shadow]",
        "hover:border-[color-mix(in_srgb,var(--am-blue-700)_35%,var(--am-border-default))]",
        "hover:shadow-[var(--am-shadow-md)]",
      )}
    >
      <div className="relative flex items-start justify-between gap-2 px-3 pt-3">
        <StatusBadge
          label={tc(locale, BADGE_KEY[badge])}
          tone={BADGE_TONE[badge]}
          className="z-[1]"
        />
        <CatalogActionsMenu
          locale={locale}
          onView={() => onOpen(part.id)}
          onEdit={() => onEdit(part)}
          onDelete={onDelete ? () => onDelete(part) : undefined}
        />
      </div>

      <button
        type="button"
        className="am-focus-ring mx-3 mt-1 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--am-radius-md)] bg-[color-mix(in_srgb,var(--am-navy-900)_4%,white)] outline-none"
        onClick={() => onOpen(part.id)}
        aria-label={`${tc(locale, "catalog.openRecord")} ${primaryName}`}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic public / blob URLs
          <img
            src={imageSrc}
            alt=""
            className="size-full object-contain p-3"
          />
        ) : (
          <span className="inline-flex flex-col items-center gap-1.5 text-[var(--am-text-muted)]">
            <Package className="size-10 opacity-50" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {tc(locale, "items.gallery.noImage")}
            </span>
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
        <button
          type="button"
          className="am-focus-ring min-w-0 rounded text-start outline-none"
          onClick={() => onOpen(part.id)}
        >
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--am-navy-900)]">
            {primaryName}
          </h3>
          <p
            className="mt-0.5 line-clamp-1 text-[11.5px] text-[var(--am-text-secondary)]"
            dir={locale === "ar" ? "ltr" : undefined}
          >
            {secondaryName}
          </p>
        </button>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span className="inline-flex max-w-full items-center gap-1 truncate font-semibold text-[var(--am-navy-900)]">
            <Cog className="size-3 shrink-0 text-[var(--am-blue-700)]" aria-hidden />
            <span className="truncate">{part.manufacturer}</span>
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-1 text-[11px]">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <dt className="shrink-0 font-semibold text-[var(--am-text-secondary)]">
              {tc(locale, "spare.col.oem")}
            </dt>
            <dd
              className="truncate font-mono font-semibold tabular-nums text-[var(--am-navy-900)]"
              dir="ltr"
            >
              {part.oemNumber || "—"}
            </dd>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <dt className="shrink-0 font-semibold text-[var(--am-text-secondary)]">
              PN
            </dt>
            <dd
              className="truncate font-mono font-semibold tabular-nums text-[var(--am-navy-900)]"
              dir="ltr"
            >
              {part.partNumber}
            </dd>
          </div>
          {item?.itemCode ? (
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <dt className="shrink-0 font-semibold text-[var(--am-text-secondary)]">
                SKU
              </dt>
              <dd
                className="truncate font-mono font-semibold tabular-nums text-[var(--am-blue-700)]"
                dir="ltr"
              >
                {item.itemCode}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--am-border-default)] pt-2.5">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[12px] font-semibold tabular-nums",
                stockOk
                  ? "text-[var(--am-success-600)]"
                  : "text-[var(--am-danger-600)]",
              )}
              title={tc(locale, "spare.stock.demoHint")}
            >
              {stockLabel}
            </p>
            <p
              className="mt-0.5 text-[15px] font-bold tabular-nums tracking-tight text-[var(--am-navy-900)]"
              dir="ltr"
            >
              {item ? formatMoney(item.sellEgp, "EGP", locale) : "—"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5" data-row-ignore>
            <IconAction
              label={tc(locale, "spare.action.compat")}
              onClick={() => onOpen(part.id)}
            >
              <GitCompareArrows className="size-3.5" aria-hidden />
            </IconAction>
            <IconAction
              label={tc(locale, "catalog.action.edit")}
              onClick={() => onEdit(part)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </IconAction>
          </div>
        </div>
      </div>
    </article>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="am-focus-ring inline-flex size-8 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
