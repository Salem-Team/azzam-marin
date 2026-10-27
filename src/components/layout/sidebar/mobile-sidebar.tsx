"use client";

import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

export function MobileSidebar() {
  const { mobileOpen, closeMobile } = useShell();
  const { t, dir } = useLocale();

  return (
    <div className="lg:hidden" dir={dir}>
      <div
        className={cn(
          "am-drawer-backdrop fixed inset-0 z-40 bg-[var(--am-surface-overlay)] backdrop-blur-[4px] motion-reduce:transition-none",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("shell.openMenu")}
        className={cn(
          "am-drawer-panel fixed inset-y-0 start-0 z-50 flex w-[min(300px,92vw)] max-w-[300px] shadow-[var(--am-shadow-lg)] motion-reduce:transition-none",
          "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
          mobileOpen
            ? "translate-x-0 opacity-100"
            : dir === "rtl"
              ? "translate-x-[108%] opacity-0"
              : "-translate-x-[108%] opacity-0",
        )}
      >
        <div className="relative flex h-full w-full overflow-hidden">
          <button
            type="button"
            onClick={closeMobile}
            className="am-topbar-control am-touch-target absolute end-2 top-3 z-10 inline-flex items-center justify-center rounded-full text-white/70 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--am-action-accent)]"
            aria-label={t("shell.closeMenu")}
          >
            <X className="size-4" aria-hidden />
          </button>
          <Sidebar
            forceExpanded
            showCollapseControl={false}
            className="w-full"
            headerClassName="pe-11"
          />
        </div>
      </div>
    </div>
  );
}
