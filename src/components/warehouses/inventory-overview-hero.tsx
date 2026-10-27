"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  PackageMinus,
  PackagePlus,
  Plus,
  Warehouse,
} from "lucide-react";

import { to } from "@/i18n/ops";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

interface InventoryOverviewHeroProps {
  onAddWarehouse: () => void;
}

const secondaryBtn =
  "am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] border border-white/35 bg-white/10 px-3 text-[12.5px] font-semibold text-white backdrop-blur-sm hover:bg-white/16";

/**
 * Compact inventory hero — title + operational actions only.
 * No subtitle (CONTENT_DISCIPLINE). Date range lives on the balances toolbar.
 */
export function InventoryOverviewHero({
  onAddWarehouse,
}: InventoryOverviewHeroProps) {
  const { locale, dir } = useLocale();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-navy-900)] shadow-[var(--am-shadow-sm)]",
        "min-h-[120px] sm:min-h-[132px]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
        <Image
          src="/brand/dashboard-welcome-banner.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[68%_42%]"
          sizes="(max-width: 1023px) 100vw, 1400px"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              dir === "rtl"
                ? "linear-gradient(260deg, rgba(7,24,47,0.94) 0%, rgba(11,35,69,0.84) 38%, rgba(7,93,232,0.2) 68%, rgba(7,24,47,0.12) 100%)"
                : "linear-gradient(100deg, rgba(7,24,47,0.94) 0%, rgba(11,35,69,0.84) 38%, rgba(7,93,232,0.2) 68%, rgba(7,24,47,0.12) 100%)",
          }}
        />
      </div>

      <div className="relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white ring-1 ring-white/20">
            <Warehouse className="size-4" aria-hidden />
          </span>
          <h1 className="text-[16px] font-bold leading-tight tracking-tight text-white sm:text-[18px]">
            {to(locale, "warehouses.overviewTitle")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white shadow-sm hover:brightness-110"
            onClick={onAddWarehouse}
          >
            <Plus className="size-3.5" aria-hidden />
            {to(locale, "warehouses.add")}
          </button>
          <Link href="/stock-transfers" className={secondaryBtn}>
            <ArrowLeftRight className="size-3.5" aria-hidden />
            {to(locale, "warehouses.transfer")}
          </Link>
          <Link href="/stock-adjustments" className={secondaryBtn}>
            <PackageMinus className="size-3.5" aria-hidden />
            {to(locale, "warehouses.issue")}
          </Link>
          <Link href="/goods-receipts" className={secondaryBtn}>
            <PackagePlus className="size-3.5" aria-hidden />
            {to(locale, "warehouses.receive")}
          </Link>
        </div>
      </div>
    </section>
  );
}
