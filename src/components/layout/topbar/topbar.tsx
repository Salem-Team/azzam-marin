"use client";

import { Menu } from "lucide-react";

import { TopbarBreadcrumbs } from "@/components/layout/topbar/breadcrumbs";
import { GlobalSearch } from "@/components/layout/topbar/global-search";
import { LanguageSelector } from "@/components/layout/topbar/language-selector";
import { NotificationsMenu } from "@/components/layout/topbar/notifications-menu";
import { ThemeToggle } from "@/components/layout/topbar/theme-toggle";
import { UserMenu } from "@/components/layout/topbar/user-menu";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useShell } from "@/providers/shell-provider";

export function Topbar() {
  const { t } = useLocale();
  const { openMobile } = useShell();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center gap-1.5 border-b border-[var(--am-border-default)] bg-[var(--am-surface-raised)]/95 px-2.5 backdrop-blur-md sm:gap-2 sm:px-4",
        "h-[var(--am-mobile-topbar-height)] lg:h-[var(--am-topbar-height)]",
        "pt-[env(safe-area-inset-top,0px)]",
        "am-transition-colors",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
        <IconButton
          label={t("shell.openMenu")}
          onClick={openMobile}
          className="am-touch-target lg:hidden"
        >
          <Menu className="size-4" aria-hidden />
        </IconButton>

        <div className="hidden h-4 w-px shrink-0 bg-[var(--am-border-default)] lg:block" />
        <div className="hidden min-w-0 lg:block">
          <TopbarBreadcrumbs />
        </div>
      </div>

      <div className="mx-auto hidden min-w-0 flex-1 justify-center px-2 lg:flex">
        <div className="w-full max-w-[560px]">
          <GlobalSearch />
        </div>
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <div className="lg:hidden">
          <GlobalSearch compact />
        </div>
        <div className="am-topbar-actions flex items-center gap-0.5 rounded-[12px] p-0.5 sm:gap-0.5">
          <LanguageSelector />
          <ThemeToggle />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
