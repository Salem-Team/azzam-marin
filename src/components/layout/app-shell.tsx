"use client";

import type { ReactNode } from "react";

import { AppFooter } from "@/components/layout/app-footer";
import { MobileBottomNav } from "@/components/layout/mobile/mobile-bottom-nav";
import { MobileSidebar } from "@/components/layout/sidebar/mobile-sidebar";
import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { Topbar } from "@/components/layout/topbar/topbar";
import { cn } from "@/lib/cn";
import { LocaleProvider, useLocale } from "@/providers/locale-provider";
import { ShellProvider, useShell } from "@/providers/shell-provider";
import { ThemeProvider } from "@/providers/theme-provider";

function ShellFrame({ children }: { children: ReactNode }) {
  const { collapsed } = useShell();
  const { dir, locale } = useLocale();

  return (
    <div
      className="flex h-dvh max-h-dvh overflow-hidden bg-[var(--am-surface-page)]"
      dir={dir}
      lang={locale}
    >
      <div
        className={cn(
          "sticky top-0 z-20 hidden h-dvh shrink-0 lg:block",
          "am-transition-layout motion-reduce:transition-none",
          collapsed
            ? "w-[var(--am-sidebar-collapsed)]"
            : "w-[var(--am-sidebar-expanded)]",
        )}
      >
        <Sidebar />
      </div>
      <MobileSidebar />
      {/*
        Always viewport-bound (all breakpoints). If this column grows with
        content, <main> gets overflow-y:auto with scrollHeight===clientHeight
        and traps wheel/touch — page looks frozen while document could scroll.
      */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={cn(
            "am-page-pad-bottom-nav flex min-h-0 flex-1 flex-col",
            "overflow-x-hidden overflow-y-auto overscroll-y-contain",
            "px-[var(--am-page-gutter-mobile)] py-3",
            "sm:px-[var(--am-page-gutter-tablet)]",
            "lg:px-[var(--am-page-gutter-desktop)] lg:py-3.5",
          )}
        >
          {/*
            min-h-full: at least the main viewport (full-height dashboards).
            Content may grow taller so main's overflow-y-auto becomes the scroller.
          */}
          <div className="mx-auto flex w-full min-h-full max-w-[var(--am-content-max)] flex-col">
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <AppFooter />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <ShellProvider>
          <ShellFrame>{children}</ShellFrame>
        </ShellProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
