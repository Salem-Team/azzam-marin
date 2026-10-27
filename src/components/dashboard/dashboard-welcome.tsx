"use client";

import Image from "next/image";
import { Award, Globe2, ShieldCheck } from "lucide-react";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { WELCOME_TRUST } from "@/config/mock-dashboard";
import { td } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

const TRUST_ICONS = [Award, Globe2, ShieldCheck] as const;

export function DashboardWelcome() {
  const { locale, dir } = useLocale();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-navy-900)] shadow-[var(--am-shadow-sm)]",
        /* Compact on large screens; keep vessel framed via object-position */
        "min-h-[148px] sm:min-h-[168px]",
        "lg:min-h-0 lg:h-[188px] xl:h-[200px]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
        <Image
          src="/brand/dashboard-welcome-banner.jpg"
          alt=""
          fill
          priority
          className={cn(
            "object-cover",
            /* Mobile: bias toward the vessel; large: keep ship + harbor in a shorter crop */
            "object-[72%_42%] lg:object-[50%_46%]",
          )}
          sizes="(max-width: 1023px) 100vw, (max-width: 1536px) 1100px, 1400px"
        />
        <div
          className="am-welcome-scrim absolute inset-0"
          style={{
            background:
              dir === "rtl"
                ? "linear-gradient(260deg, rgba(7,24,47,0.94) 0%, rgba(11,35,69,0.82) 36%, rgba(7,93,232,0.22) 64%, rgba(7,24,47,0.1) 100%)"
                : "linear-gradient(100deg, rgba(7,24,47,0.94) 0%, rgba(11,35,69,0.82) 36%, rgba(7,93,232,0.22) 64%, rgba(7,24,47,0.1) 100%)",
          }}
        />
      </div>

      <div
        className={cn(
          "relative flex h-full flex-col gap-2.5 px-4 pb-7 pt-3.5",
          "sm:gap-3 sm:px-6 sm:pb-8 sm:pt-[18px]",
          "lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:px-7 lg:pb-5 lg:pt-5",
        )}
      >
        <div className="max-w-xl">
          <h1 className="text-[16px] font-bold leading-tight tracking-tight text-white sm:text-[18px] lg:text-[19px]">
            {td(locale, "welcome.greeting")}
          </h1>

          <ul className="mt-2.5 flex flex-wrap gap-2 lg:mt-3">
            {WELCOME_TRUST.map((item, index) => {
              const Icon = TRUST_ICONS[index] ?? Award;
              return (
                <li
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white"
                >
                  <Icon className="size-3.5 opacity-90" aria-hidden />
                  {td(locale, item.labelKey)}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative z-20 flex shrink-0 self-end lg:self-start">
          <DateRangeFilter />
        </div>
      </div>
    </section>
  );
}
