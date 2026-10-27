"use client";

import { AlertTriangle } from "lucide-react";

import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { td } from "@/i18n/dashboard";
import { useLocale } from "@/providers/locale-provider";

export default function LowStockPage() {
  const { locale } = useLocale();

  return (
    <PageFrame>
      <div className="hidden lg:flex items-center gap-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
          <AlertTriangle className="size-3.5" aria-hidden />
        </span>
        <h1 className="am-text-page-title">{td(locale, "lowStock.title")}</h1>
      </div>
      <PageSurface className="overflow-hidden p-0">
        <LowStockTable variant="page" />
      </PageSurface>
    </PageFrame>
  );
}
