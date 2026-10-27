"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { to } from "@/i18n/ops";
import { isoDateInRange, type DateRangeValue } from "@/lib/date-range";
import { formatMoney } from "@/lib/format";
import {
  createCustomer,
  customerToForm,
  EMPTY_CUSTOMER_FORM,
  updateCustomer,
  useCustomers,
  useCustomersHydrated,
} from "@/lib/customers-store";
import { useLocale } from "@/providers/locale-provider";
import type { CustomerFormValues, CustomerRecord } from "@/types/customer";

function CustomersInner() {
  const { locale } = useLocale();
  const toast = useToast();
  const hydrated = useCustomersHydrated();
  const customers = useCustomers();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<DateRangeValue | undefined>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (period && !isoDateInRange(c.updatedAt, period)) return false;
      if (!q) return true;
      return [c.code, c.nameEn, c.nameAr, c.email, c.phone, c.taxId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [customers, query, period]);

  const inputClass =
    "am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]";

  function openCreate() {
    setEditing(null);
    setValues({ ...EMPTY_CUSTOMER_FORM });
    setError("");
    setOpen(true);
  }

  function openEdit(c: CustomerRecord) {
    setEditing(c);
    setValues(customerToForm(c));
    setError("");
    setOpen(true);
  }

  function save() {
    try {
      if (!values.nameEn.trim() || !values.nameAr.trim()) {
        setError(to(locale, "ops.required"));
        return;
      }
      if (editing) updateCustomer(editing.id, values);
      else createCustomer(values);
      toast.push(to(locale, "ops.saveSuccess"));
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "duplicate-code"
          ? to(locale, "ops.duplicateCode")
          : to(locale, "ops.saveError");
      setError(msg);
      toast.push(msg, "error");
    }
  }

  return (
    <PageFrame className="am-page--flow gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="am-text-page-title">{to(locale, "customers.title")}</h1>
          <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
            {to(locale, "customers.demoBalance")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} />
          <button
            type="button"
            className="am-focus-ring inline-flex h-9 items-center gap-1.5 rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3 text-[12.5px] font-semibold text-white"
            onClick={openCreate}
          >
            <Plus className="size-3.5" aria-hidden />
            {to(locale, "customers.add")}
          </button>
        </div>
      </div>

      <PageSurface fill={false} className="overflow-hidden">
        <div className="border-b border-[var(--am-border-default)] p-3">
          <input
            className={inputClass}
            placeholder={to(locale, "ops.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!hydrated ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-start text-[12.5px]">
              <thead className="bg-[var(--am-surface-page)] text-[11px] font-semibold text-[var(--am-text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5">{to(locale, "customers.code")}</th>
                  <th className="px-3 py-2.5">{to(locale, "customers.nameEn")}</th>
                  <th className="px-3 py-2.5">{to(locale, "customers.phone")}</th>
                  <th className="px-3 py-2.5">{to(locale, "customers.balance")}</th>
                  <th className="px-3 py-2.5">{to(locale, "ops.status.active")}</th>
                  <th className="px-3 py-2.5">{to(locale, "ops.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--am-border-default)]"
                  >
                    <td className="px-3 py-2.5 font-mono" dir="ltr">
                      {c.code}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">
                      {locale === "ar" ? c.nameAr : c.nameEn}
                    </td>
                    <td className="px-3 py-2.5" dir="ltr">
                      {c.phone || "—"}
                    </td>
                    <td className="px-3 py-2.5" dir="ltr">
                      {formatMoney(c.balance, "USD", locale)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        label={to(
                          locale,
                          c.status === "active"
                            ? "ops.status.active"
                            : "ops.status.inactive",
                        )}
                        tone={c.status === "active" ? "approved" : "inventory"}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        className="text-[12.5px] font-semibold text-[var(--am-blue-700)] hover:underline"
                        onClick={() => openEdit(c)}
                      >
                        {to(locale, "ops.edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageSurface>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? to(locale, "ops.edit") : to(locale, "customers.add")}
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
        <div className="grid gap-3 sm:grid-cols-2">
          {error ? (
            <p className="sm:col-span-2 text-[12.5px] font-medium text-[var(--am-danger-600)]">
              {error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.code")}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              value={values.code}
              onChange={(e) => setValues({ ...values, code: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.country")}
            </span>
            <select
              className={inputClass}
              value={values.countryCode}
              onChange={(e) =>
                setValues({
                  ...values,
                  countryCode: e.target
                    .value as CustomerFormValues["countryCode"],
                })
              }
            >
              {["EG", "AE", "SA", "US", "GB", "DE", "IT", "CN", "JP", "OTHER"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.nameEn")}
            </span>
            <input
              className={inputClass}
              value={values.nameEn}
              onChange={(e) => setValues({ ...values, nameEn: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.nameAr")}
            </span>
            <input
              className={inputClass}
              dir="rtl"
              value={values.nameAr}
              onChange={(e) => setValues({ ...values, nameAr: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.phone")}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              value={values.phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
              {to(locale, "customers.email")}
            </span>
            <input
              className={inputClass}
              dir="ltr"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          </label>
        </div>
      </ModalDialog>
    </PageFrame>
  );
}

export function CustomersDirectory() {
  return (
    <ToastProvider>
      <CustomersInner />
    </ToastProvider>
  );
}
