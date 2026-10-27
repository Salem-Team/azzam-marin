"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { TopbarControl } from "@/components/layout/topbar/topbar-control";
import { useLocale } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { t } = useLocale();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const label =
    theme === "light"
      ? t("shell.theme.toDark")
      : theme === "dark"
        ? t("shell.theme.toSystem")
        : t("shell.theme.toLight");

  return (
    <TopbarControl
      label={label}
      onClick={toggleTheme}
      aria-pressed={resolvedTheme === "dark"}
      active={resolvedTheme === "dark"}
    >
      <span key={theme} className="am-icon-theme inline-flex">
        {theme === "system" ? (
          <Monitor className="size-4 stroke-[1.75]" aria-hidden />
        ) : resolvedTheme === "dark" ? (
          <Sun className="size-4 stroke-[1.75]" aria-hidden />
        ) : (
          <Moon className="size-4 stroke-[1.75]" aria-hidden />
        )}
      </span>
    </TopbarControl>
  );
}
