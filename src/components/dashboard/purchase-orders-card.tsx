"use client";

import {
  Activity,
  FileText,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import { RecordCardLink } from "@/components/ui/record-row";
import { td } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import { formatEgp, formatIsoDate } from "@/lib/format";
import {
  purchaseOrderTotal,
  usePurchaseOrders,
} from "@/lib/purchase-orders-store";
import { purchaseOrderDetailsHref } from "@/lib/record-routes";
import { getSupplierById } from "@/lib/suppliers-store";
import type { PurchaseOrderStatus } from "@/types/purchase-order";
import { useLocale } from "@/providers/locale-provider";

const STATUS_KEY = {
  pending: "po.status.pending",
  approved: "po.status.approved",
  inTransit: "po.status.inTransit",
  delivered: "po.status.delivered",
} as const;

type DashPoStatus = keyof typeof STATUS_KEY;

function mapStatus(status: PurchaseOrderStatus): DashPoStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "partially_received":
      return "inTransit";
    case "received":
      return "delivered";
    case "submitted":
    case "draft":
    default:
      return "pending";
  }
}

const ROW_META: {
  icon: keyof typeof ROW_ICONS;
  tone: keyof typeof ICON_TONE;
}[] = [
  { icon: "file", tone: "blue" },
  { icon: "warehouse", tone: "green" },
  { icon: "activity", tone: "orange" },
  { icon: "file", tone: "blue" },
];

const ROW_ICONS = {
  file: FileText,
  warehouse: Warehouse,
  activity: Activity,
} as const;

const ICON_TONE = {
  blue: "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]",
  green: "bg-[#E8F7EF] text-[var(--am-success-600)]",
  orange: "bg-[#FFF4E5] text-[#B7791F]",
} as const;

export function PurchaseOrdersCard() {
  const { locale } = useLocale();
  const orders = usePurchaseOrders();
  const rows = [...orders]
    .filter((o) => o.status !== "cancelled")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  return (
    <DashboardCard
      title={td(locale, "po.title")}
      href="/purchase-orders"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "po.title")}`}
      icon={<ShoppingCart className="size-3.5" strokeWidth={2.25} aria-hidden />}
      iconClassName="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[#FDECEC] text-[var(--am-danger-600)]"
      bodyClassName="flex flex-col p-0"
      className="@container/po"
      action={
        <ViewAllLink
          href="/purchase-orders"
          label={td(locale, "po.viewAll")}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[12.5px] text-[var(--am-text-secondary)]">
          {locale === "ar"
            ? "لا توجد أوامر شراء محفوظة بعد"
            : "No saved purchase orders yet"}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--am-border-default)]">
          {rows.map((po, index) => {
            const meta = ROW_META[index % ROW_META.length]!;
            const Icon = ROW_ICONS[meta.icon];
            const supplier = getSupplierById(po.supplierId);
            const dashStatus = mapStatus(po.status);
            const total = purchaseOrderTotal(po);
            return (
              <li key={po.id}>
                <RecordCardLink
                  href={purchaseOrderDetailsHref(po.id)}
                  label={`${td(locale, "po.openRecord")} ${po.number}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 px-4 py-3 @[440px]/po:grid-cols-[auto_minmax(0,1fr)_auto_auto] @[440px]/po:gap-x-3"
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                      ICON_TONE[meta.tone],
                    )}
                  >
                    <Icon className="size-4 stroke-[1.75]" aria-hidden />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-snug tracking-[-0.01em] text-[var(--am-navy-900)]">
                      {po.number}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] leading-snug text-[var(--am-text-secondary)]">
                      {supplier
                        ? locale === "ar"
                          ? supplier.nameAr
                          : supplier.nameEn
                        : po.supplierId}
                    </p>
                  </div>

                  <div className="col-start-2 row-start-2 @[440px]/po:col-start-auto @[440px]/po:row-start-auto @[440px]/po:flex @[440px]/po:min-w-[5.75rem] @[440px]/po:justify-center">
                    <StatusBadge
                      label={td(locale, STATUS_KEY[dashStatus])}
                      tone={dashStatus as StatusTone}
                      className="px-2.5"
                    />
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1 self-start pt-0.5 @[440px]/po:self-center">
                    <p className="whitespace-nowrap text-[12.5px] font-bold tabular-nums leading-snug text-[var(--am-navy-900)]">
                      {po.currency === "EGP"
                        ? formatEgp(total, locale)
                        : `${total.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} USD`}
                    </p>
                    <p className="whitespace-nowrap text-[11px] leading-none text-[var(--am-text-secondary)]">
                      {formatIsoDate(po.orderDate, locale)}
                    </p>
                  </div>
                </RecordCardLink>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
