"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import { formatIsoDate } from "@/lib/format";
import {
  addExchangeRate,
  convertUsdToEgp,
  useExchangeRates,
} from "@/lib/exchange-rates-store";
import { useLocale } from "@/providers/locale-provider";

function ExchangeRatesInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const rates = useExchangeRates();
  const [open, setOpen] = useState(false);
  const [egpPerUsd, setEgpPerUsd] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const sorted = [...rates].sort((a, b) =>
    b.effectiveDate.localeCompare(a.effectiveDate),
  );
  const sample = convertUsdToEgp(100);

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  function save() {
    try {
      addExchangeRate({ egpPerUsd, effectiveDate, notes });
      toast.push(to(locale, "ops.saveSuccess"));
      setOpen(false);
      setEgpPerUsd("");
      setNotes("");
    } catch {
      toast.push(to(locale, "ops.saveError"), "error");
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="am-text-page-title">
            {locale === "ar" ? "أسعار الصرف" : "Exchange rates"}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.demoPersist")}{" "}
            {locale === "ar"
              ? "ليست أسعار سوق حية."
              : "Not live market data."}
          </p>
        </div>
        <button
          type="button"
          className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          {locale === "ar" ? "إضافة سعر" : "Add rate"}
        </button>
      </div>

      {sample != null ? (
        <PageSurface fill={false} className="p-4">
          <p className="text-[13px] font-semibold text-[var(--am-navy-900)]" dir="ltr">
            USD 100 → EGP {sample.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
          </p>
        </PageSurface>
      ) : null}

      <PageSurface fill={false} className="overflow-hidden">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <table className="w-full min-w-[32rem] text-start text-[12.5px]">
            <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">
                  {locale === "ar" ? "تاريخ السريان" : "Effective"}
                </th>
                <th className="px-3 py-2.5">EGP / USD</th>
                <th className="px-3 py-2.5">
                  {locale === "ar" ? "المصدر" : "Source"}
                </th>
                <th className="px-3 py-2.5">
                  {locale === "ar" ? "ملاحظات" : "Notes"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--am-border-default)]"
                >
                  <td className="px-3 py-2.5" dir="ltr">
                    {formatIsoDate(r.effectiveDate, locale)}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums" dir="ltr">
                    {r.egpPerUsd}
                  </td>
                  <td className="px-3 py-2.5">{r.source}</td>
                  <td className="px-3 py-2.5 text-[var(--am-text-secondary)]">
                    {r.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageSurface>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title={locale === "ar" ? "إضافة سعر صرف" : "Add exchange rate"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border px-3 text-[12.5px] font-semibold"
              onClick={() => setOpen(false)}
            >
              {to(locale, "ops.cancel")}
            </button>
            <button
              type="button"
              className="am-focus-ring h-9 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
              onClick={save}
            >
              {to(locale, "ops.save")}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              EGP per 1 USD
            </span>
            <input
              className={inputClass}
              dir="ltr"
              inputMode="decimal"
              value={egpPerUsd}
              onChange={(e) => setEgpPerUsd(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {locale === "ar" ? "تاريخ السريان" : "Effective date"}
            </span>
            <input
              type="date"
              className={inputClass}
              dir="ltr"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.notes")}
            </span>
            <textarea
              className={`${inputClass} min-h-16`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      </ModalDialog>
    </PageFrame>
  );
}

export function ExchangeRatesDirectory() {
  return (
    <ToastProvider>
      <ExchangeRatesInner />
    </ToastProvider>
  );
}
