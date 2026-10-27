import { Info } from "lucide-react";

import { tc } from "@/i18n/catalog";
import type { Locale } from "@/types/i18n";

export function CatalogDesignBanner({ locale }: { locale: Locale }) {
  return (
    <div
      role="note"
      className="flex gap-2.5 rounded-[var(--am-radius-md)] border border-[color-mix(in_srgb,var(--am-blue-700)_28%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-blue-100)_55%,white)] px-3 py-2.5 text-[12px] leading-snug text-[var(--am-navy-900)]"
    >
      <Info
        className="mt-0.5 size-4 shrink-0 text-[var(--am-blue-700)]"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-semibold">{tc(locale, "catalog.designNotice")}</p>
        <p className="mt-0.5 text-[var(--am-text-secondary)]">
          {tc(locale, "catalog.designNoticeHint")}
        </p>
      </div>
    </div>
  );
}
