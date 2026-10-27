"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  findGroupForItem,
  findNavItemByHref,
} from "@/config/navigation";
import { tc } from "@/i18n/catalog";
import {
  getMarineEngineById,
  useMarineEngines,
} from "@/lib/marine-engines-store";
import { decodeRecordParam } from "@/lib/record-routes";
import { useLocale } from "@/providers/locale-provider";

/** Detail-record crumb when pathname is nested under a directory leaf. */
function detailCrumbLabel(
  pathname: string,
  locale: "en" | "ar",
): string | null {
  const engineMatch = pathname.match(/^\/marine-engines\/([^/]+)/);
  if (engineMatch) {
    const engine = getMarineEngineById(decodeRecordParam(engineMatch[1]));
    if (engine) return `${engine.manufacturer} ${engine.model}`;
    return tc(locale, "engines.details");
  }
  if (/^\/spare-parts\/[^/]+/.test(pathname)) {
    return tc(locale, "spare.details");
  }
  if (/^\/items\/[^/]+/.test(pathname)) {
    return tc(locale, "items.details");
  }
  return null;
}

export function TopbarBreadcrumbs() {
  const pathname = usePathname();
  const { t, dir, locale } = useLocale();
  useMarineEngines();
  const item = findNavItemByHref(pathname);
  const group = item ? findGroupForItem(item.id) : undefined;
  const Separator = dir === "rtl" ? ChevronLeft : ChevronRight;
  const detailLabel = detailCrumbLabel(pathname, locale);
  const onDirectory = Boolean(item && pathname === item.href);

  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden min-w-0 md:block"
    >
      <ol className="flex min-w-0 items-center gap-1 text-[12.5px]">
        <li className="shrink-0">
          <Link
            href="/dashboard"
            className="rounded-sm text-[var(--color-text-secondary)] outline-none transition-colors hover:text-[var(--color-primary-blue)] focus-visible:text-[var(--color-primary-blue)]"
          >
            {t("shell.breadcrumbs.home")}
          </Link>
        </li>

        {group && item && item.href !== "/dashboard" ? (
          <>
            <li aria-hidden className="shrink-0 text-[var(--color-text-secondary)]/50">
              <Separator className="size-3.5" />
            </li>
            <li className="hidden min-w-0 truncate text-[var(--color-text-secondary)] lg:block">
              {t(group.labelKey)}
            </li>
            <li aria-hidden className="shrink-0 text-[var(--color-text-secondary)]/50">
              <Separator className="size-3.5" />
            </li>
            <li
              className={
                detailLabel
                  ? "min-w-0 truncate text-[var(--color-text-secondary)]"
                  : "min-w-0 truncate font-medium text-[var(--color-text-primary)]"
              }
            >
              {detailLabel && !onDirectory ? (
                <Link
                  href={item.href}
                  className="rounded-sm outline-none transition-colors hover:text-[var(--color-primary-blue)] focus-visible:text-[var(--color-primary-blue)]"
                >
                  {t(item.labelKey)}
                </Link>
              ) : (
                <span aria-current="page">{t(item.labelKey)}</span>
              )}
            </li>
            {detailLabel && !onDirectory ? (
              <>
                <li aria-hidden className="shrink-0 text-[var(--color-text-secondary)]/50">
                  <Separator className="size-3.5" />
                </li>
                <li className="min-w-0 truncate font-medium text-[var(--color-text-primary)]">
                  <span aria-current="page">{detailLabel}</span>
                </li>
              </>
            ) : null}
          </>
        ) : item ? (
          <>
            <li aria-hidden className="shrink-0 text-[var(--color-text-secondary)]/50">
              <Separator className="size-3.5" />
            </li>
            <li className="min-w-0 truncate font-medium text-[var(--color-text-primary)]">
              <span aria-current="page">{t(item.labelKey)}</span>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
