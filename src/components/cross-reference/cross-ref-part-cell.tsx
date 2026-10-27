"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import { useItemImageSrc } from "@/hooks/use-item-image-src";
import { cn } from "@/lib/cn";
import { sparePartDetailsHref } from "@/lib/record-routes";
import type { CatalogItem, SparePartRecord } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

interface CrossRefPartCellProps {
  part: SparePartRecord;
  item?: CatalogItem;
  locale: Locale;
  className?: string;
  /** When false, render static (no link) — for drawer previews. */
  linkable?: boolean;
}

function PartThumb({ item }: { item?: CatalogItem }) {
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
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)] bg-gradient-to-br from-[color-mix(in_srgb,var(--am-blue-700)_16%,white)] to-white text-[var(--am-navy-900)] ring-1 ring-[var(--am-border-default)]"
      aria-hidden
    >
      <Package className="size-3.5 opacity-80" />
    </span>
  );
}

export function CrossRefPartCell({
  part,
  item,
  locale,
  className,
  linkable = true,
}: CrossRefPartCellProps) {
  const name =
    locale === "ar"
      ? item?.nameAr || part.partNumber
      : item?.nameEn || part.partNumber;
  const meta = [item?.itemCode, part.partNumber, part.oemNumber]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <>
      <PartThumb item={item} />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-[var(--am-navy-900)]">
          {name}
        </span>
        <span
          className="mt-0.5 block truncate font-mono text-[11px] font-medium text-[var(--am-text-secondary)]"
          dir="ltr"
        >
          {meta}
        </span>
      </span>
    </>
  );

  if (!linkable) {
    return (
      <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
        {body}
      </span>
    );
  }

  return (
    <Link
      href={sparePartDetailsHref(part.id)}
      className={cn(
        "am-focus-ring flex min-w-0 items-center gap-2.5 rounded-[var(--am-radius-sm)] hover:opacity-90",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </Link>
  );
}
