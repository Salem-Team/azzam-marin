"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_BOTTOM_TABS } from "@/config/mobile-navigation";
import {
  findGroupForItem,
  findNavItemByHref,
} from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

function isTabActive(
  pathname: string,
  tab: (typeof MOBILE_BOTTOM_TABS)[number],
): boolean {
  if (tab.kind === "more") return false;
  const active = findNavItemByHref(pathname);
  if (!active) return pathname === tab.href;
  if (tab.matchIds.includes(active.id)) return true;
  const group = findGroupForItem(active.id);
  if (tab.id === "inventory" && group?.id === "products-inventory") return true;
  if (tab.id === "sales" && group?.id === "sales-customers") return true;
  if (tab.id === "suppliers") {
    return (
      active.id === "suppliers" ||
      active.id === "supplier-balances" ||
      pathname.startsWith("/suppliers")
    );
  }
  if (
    tab.id === "purchasing" &&
    group?.id === "purchasing-import" &&
    active.id !== "suppliers" &&
    active.id !== "supplier-balances"
  ) {
    return true;
  }
  return pathname === tab.href;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { openMobile, mobileOpen } = useShell();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--am-border-default)] bg-[var(--am-surface-raised)]/95 backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label={t("shell.mobile.navLabel")}
    >
      <ul className="mx-auto grid h-[var(--am-bottom-nav-height)] max-w-[var(--am-content-max)] grid-cols-6">
        {MOBILE_BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.kind === "more"
              ? mobileOpen
              : isTabActive(pathname, tab);
          const label = t(tab.labelKey);

          if (tab.kind === "more") {
            return (
              <li key={tab.id} className="min-w-0">
                <button
                  type="button"
                  onClick={openMobile}
                  aria-label={label}
                  aria-expanded={mobileOpen}
                  className={cn(
                    "am-touch-target relative flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 outline-none am-transition-colors",
                    "focus-visible:bg-[var(--am-blue-100)] focus-visible:text-[var(--am-blue-700)]",
                    active
                      ? "text-[var(--am-blue-700)]"
                      : "text-[var(--am-text-secondary)]",
                  )}
                >
                  {active ? (
                    <span
                      className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-[var(--am-blue-700)]"
                      aria-hidden
                    />
                  ) : null}
                  <Icon className="size-5 stroke-[1.75]" aria-hidden />
                  <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                    {label}
                  </span>
                </button>
              </li>
            );
          }

          return (
            <li key={tab.id} className="min-w-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "am-touch-target relative flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 outline-none am-transition-colors",
                  "focus-visible:bg-[var(--am-blue-100)]",
                  active
                    ? "text-[var(--am-blue-700)]"
                    : "text-[var(--am-text-secondary)] hover:text-[var(--am-text-primary)]",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-[var(--am-blue-700)]"
                    aria-hidden
                  />
                ) : null}
                <Icon className="size-5 stroke-[1.75]" aria-hidden />
                <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
