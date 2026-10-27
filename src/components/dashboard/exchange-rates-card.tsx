"use client";

import { ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react";

import { CurrencyFlag } from "@/components/dashboard/currency-flag";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import { td } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { useExchangeRates } from "@/lib/exchange-rates-store";
import { formatPercent } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

export function ExchangeRatesCard() {
  const { locale } = useLocale();
  const rates = useExchangeRates();
  const sorted = [...rates].sort((a, b) =>
    b.effectiveDate.localeCompare(a.effectiveDate),
  );
  const rows = sorted.slice(0, 5).map((row, index) => {
    const prev = sorted[index + 1];
    const changePct =
      prev && prev.egpPerUsd > 0
        ? ((row.egpPerUsd - prev.egpPerUsd) / prev.egpPerUsd) * 100
        : 0;
    return {
      id: row.id,
      code: "USD" as const,
      rate: row.egpPerUsd,
      changePct,
      date: row.effectiveDate,
    };
  });

  return (
    <DashboardCard
      title={td(locale, "fx.title")}
      href="/exchange-rates"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "fx.title")}`}
      icon={<ArrowLeftRight className="size-3.5" aria-hidden />}
      iconClassName="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--am-blue-700)] text-white"
      className="w-full min-w-0"
      bodyClassName="flex flex-col justify-center p-0"
      action={
        <ViewAllLink href="/exchange-rates" label={td(locale, "po.viewAll")} />
      }
    >
      <table className="w-full min-w-0 table-fixed border-collapse text-start text-[12.5px]">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[40%]" />
          <col className="w-[28%]" />
        </colgroup>
        <thead>
          <tr className="bg-[color-mix(in_srgb,var(--am-blue-100)_88%,white)] text-[11px] font-semibold text-[var(--am-navy-800)]">
            <th className="px-3.5 py-2.5 font-semibold">
              {td(locale, "fx.currency")}
            </th>
            <th
              className="px-2 py-2.5 text-center font-semibold"
              title={
                locale === "ar"
                  ? "مقابل الجنيه المصري"
                  : "Against Egyptian Pound"
              }
            >
              {td(locale, "fx.rate")}
            </th>
            <th className="px-3.5 py-2.5 text-end font-semibold">
              {td(locale, "fx.change")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-3.5 py-6 text-center text-[12px] text-[var(--am-text-secondary)]"
              >
                {locale === "ar" ? "لا توجد أسعار صرف محفوظة" : "No saved rates"}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const positive = row.changePct >= 0;
              const TrendIcon = positive ? ChevronUp : ChevronDown;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "am-transition-colors hover:bg-[var(--am-surface-page)]",
                    index > 0 && "border-t border-[var(--am-border-default)]",
                  )}
                >
                  <td className="px-3.5 py-3">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <CurrencyFlag code={row.code} />
                      <span className="text-[13px] font-bold tracking-wide text-[var(--am-navy-900)]">
                        {row.code}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-[13px] font-semibold tabular-nums text-[var(--am-navy-900)]">
                    <span className="inline-flex items-baseline justify-center gap-1">
                      <span>{row.rate.toFixed(2)}</span>
                      <span className="text-[10.5px] font-semibold text-[var(--am-text-secondary)]">
                        EGP
                      </span>
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-end">
                    <span
                      className={cn(
                        "inline-flex items-center justify-end gap-0.5 text-[12px] font-semibold tabular-nums",
                        positive
                          ? "text-[var(--am-success-600)]"
                          : "text-[var(--am-danger-600)]",
                      )}
                    >
                      <TrendIcon className="size-3.5 shrink-0" aria-hidden />
                      {formatPercent(Math.abs(row.changePct), locale)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </DashboardCard>
  );
}
