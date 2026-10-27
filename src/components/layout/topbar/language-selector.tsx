"use client";

import { TopbarControl } from "@/components/layout/topbar/topbar-control";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

export function LanguageSelector() {
  const { t, locale, toggleLocale } = useLocale();
  const nextLabel =
    locale === "ar" ? t("shell.language.switchToEn") : t("shell.language.switchToAr");
  const code = locale === "ar" ? "AR" : "EN";

  return (
    <TopbarControl label={nextLabel} onClick={toggleLocale}>
      <span
        key={locale}
        className={cn(
          "am-icon-locale inline-flex size-[22px] items-center justify-center rounded-[6px]",
          "bg-[color-mix(in_srgb,var(--am-navy-900)_92%,var(--am-blue-700))]",
          "text-[10px] font-bold leading-none tracking-wide text-white",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        )}
        aria-hidden
      >
        {code}
      </span>
    </TopbarControl>
  );
}
