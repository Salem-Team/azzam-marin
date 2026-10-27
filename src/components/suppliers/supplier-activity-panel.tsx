"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  ClipboardPlus,
  Clock3,
  FileMinus2,
  FilePenLine,
  FilePlus2,
  PackageCheck,
  Receipt,
  User,
  UserPlus,
  UserRoundPen,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { ts } from "@/i18n/suppliers";
import { cn } from "@/lib/cn";
import {
  activityCategoryLabel,
  buildSupplierActivityFeed,
  formatActivityActor,
  formatActivityDate,
  formatActivityDetail,
  formatActivityTime,
  formatActivityTitle,
  type SupplierActivityCategory,
  type SupplierActivityItem,
  type SupplierActivityKind,
} from "@/lib/suppliers/supplier-activity";
import { useSupplierAudit } from "@/lib/suppliers/supplier-audit";
import type { Locale } from "@/types/i18n";
import type { SupplierRecord } from "@/types/supplier";

type FilterId = "all" | SupplierActivityCategory;

const FILTERS: FilterId[] = [
  "all",
  "profile",
  "status",
  "document",
  "order",
  "purchase",
  "payment",
];

const KIND_ICON: Record<SupplierActivityKind, LucideIcon> = {
  "supplier.create": UserPlus,
  "supplier.update": UserRoundPen,
  "supplier.activate": BadgeCheck,
  "supplier.deactivate": CircleOff,
  "supplier.delete": UserX,
  "supplier.document.upload": FilePlus2,
  "supplier.document.remove": FileMinus2,
  "supplier.document.replace": FilePenLine,
  "supplier.po": ClipboardPlus,
  "supplier.purchase": PackageCheck,
  "supplier.payment": Banknote,
};

const KIND_TONE: Record<SupplierActivityKind, string> = {
  "supplier.create":
    "bg-[color-mix(in_srgb,var(--am-success-600)_14%,white)] text-[var(--am-success-600)] ring-1 ring-[color-mix(in_srgb,var(--am-success-600)_28%,transparent)]",
  "supplier.update":
    "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_24%,transparent)]",
  "supplier.activate":
    "bg-[color-mix(in_srgb,var(--am-success-600)_14%,white)] text-[var(--am-success-600)] ring-1 ring-[color-mix(in_srgb,var(--am-success-600)_28%,transparent)]",
  "supplier.deactivate":
    "bg-[color-mix(in_srgb,var(--am-navy-900)_10%,white)] text-[var(--am-navy-900)] ring-1 ring-[color-mix(in_srgb,var(--am-navy-900)_20%,transparent)]",
  "supplier.delete":
    "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)] ring-1 ring-[color-mix(in_srgb,var(--am-danger-600)_28%,transparent)]",
  "supplier.document.upload":
    "bg-[#FFF4E5] text-[#B7791F] ring-1 ring-[color-mix(in_srgb,#B7791F_28%,transparent)]",
  "supplier.document.remove":
    "bg-[color-mix(in_srgb,var(--am-danger-600)_10%,white)] text-[var(--am-danger-600)] ring-1 ring-[color-mix(in_srgb,var(--am-danger-600)_22%,transparent)]",
  "supplier.document.replace":
    "bg-[#FFF4E5] text-[#B7791F] ring-1 ring-[color-mix(in_srgb,#B7791F_28%,transparent)]",
  "supplier.po":
    "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_24%,transparent)]",
  "supplier.purchase":
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_22%,transparent)]",
  "supplier.payment":
    "bg-[color-mix(in_srgb,var(--am-success-600)_14%,white)] text-[var(--am-success-600)] ring-1 ring-[color-mix(in_srgb,var(--am-success-600)_28%,transparent)]",
};

const BADGE_TONE: Record<SupplierActivityCategory, string> = {
  profile:
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  status:
    "bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]",
  document: "bg-[#FFF4E5] text-[#B7791F]",
  order:
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  purchase:
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  payment:
    "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
};

function ActivityTitle({ title }: { title: string }) {
  const match = title.match(
    /^(.*?)(\s*)(#?[A-Z]{2,10}-[\w.-]+|[^\s]+\.\w{2,5})$/,
  );
  if (!match) {
    return (
      <p className="text-[13px] font-bold leading-snug tracking-[-0.01em] text-[var(--am-navy-900)]">
        {title}
      </p>
    );
  }
  const [, label, , code] = match;
  return (
    <p className="text-[13px] font-bold leading-snug tracking-[-0.01em] text-[var(--am-navy-900)]">
      <span>{label} </span>
      <span dir="ltr" className="inline-block font-bold tabular-nums">
        {code}
      </span>
    </p>
  );
}

function MetaChip({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <span
      className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-[var(--am-radius-md)] bg-[var(--am-surface-page)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]"
      title={`${label}: ${value}`}
    >
      <Icon
        className="size-3 shrink-0 text-[var(--am-blue-700)]"
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="sr-only">{label}: </span>
      <span
        className="min-w-0 truncate tabular-nums"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </span>
  );
}

function DetailRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="shrink-0 text-[11.5px] font-semibold text-[var(--am-text-secondary)]">
        {label}
      </span>
      <span
        className="min-w-0 text-[13px] font-semibold text-[var(--am-navy-900)] sm:text-end"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function SupplierActivityPanel({
  supplier,
  locale,
}: {
  supplier: SupplierRecord;
  locale: Locale;
}) {
  useSupplierAudit(supplier.id);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<SupplierActivityItem | null>(null);

  const feed = buildSupplierActivityFeed(supplier);
  const visible =
    filter === "all" ? feed : feed.filter((item) => item.category === filter);

  const counts: Record<FilterId, number> = {
    all: feed.length,
    profile: 0,
    status: 0,
    document: 0,
    order: 0,
    purchase: 0,
    payment: 0,
  };
  for (const item of feed) counts[item.category] += 1;

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="am-text-section-title min-w-0">
          {ts(locale, "suppliers.details.activity")}
        </h3>
        <span className="shrink-0 rounded-full bg-[var(--am-surface-page)] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
          {visible.length}
        </span>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={ts(locale, "suppliers.activity.filters")}
      >
        {FILTERS.map((id) => {
          const active = filter === id;
          const label =
            id === "all"
              ? ts(locale, "suppliers.activity.filterAll")
              : activityCategoryLabel(locale, id);
          const count = counts[id];
          if (id !== "all" && count === 0) return null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "am-focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold transition-colors",
                active
                  ? "bg-[var(--am-navy-900)] text-white"
                  : "bg-[var(--am-surface-raised)] text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)] hover:bg-[var(--am-surface-page)] hover:text-[var(--am-navy-900)]",
              )}
              onClick={() => setFilter(id)}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-white/80" : "text-[var(--am-text-muted)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[var(--am-radius-lg)] border border-dashed border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-4 py-8 text-center">
          <p className="text-[13px] font-medium text-[var(--am-navy-900)]">
            {ts(locale, "suppliers.details.activityEmpty")}
          </p>
        </div>
      ) : (
        <div className="am-activity-feed">
          <ul className="am-activity-list flex flex-col gap-2.5 sm:gap-3">
            {visible.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                locale={locale}
                isFirst={index === 0}
                isLast={index === visible.length - 1}
                onOpen={() => setSelected(item)}
              />
            ))}
          </ul>
        </div>
      )}

      <ActivityDetailDialog
        item={selected}
        locale={locale}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function ActivityRow({
  item,
  locale,
  isFirst,
  isLast,
  onOpen,
}: {
  item: SupplierActivityItem;
  locale: Locale;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
}) {
  const Icon = KIND_ICON[item.kind] ?? Receipt;
  const title = formatActivityTitle(locale, item);
  const detail = formatActivityDetail(locale, item);
  const actor = formatActivityActor(locale, item.actor);
  const date = formatActivityDate(locale, item.at);
  const time = formatActivityTime(locale, item.at);
  const openLabel = `${ts(locale, "suppliers.activity.openRecord")} — ${title}`;
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <li className="am-activity-row">
      <button
        type="button"
        className={cn(
          "am-focus-ring am-activity-item am-activity-item--supplier am-activity-item--card w-full text-start",
          "border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-sm)]",
        )}
        onClick={onOpen}
        aria-label={openLabel}
      >
        <div
          className={cn(
            "am-activity-track",
            isFirst && "am-activity-track--first",
            isLast && "am-activity-track--last",
          )}
          aria-hidden
        >
          <span className={cn("am-activity-icon", KIND_TONE[item.kind])}>
            <Icon className="size-3.5 stroke-[2.25]" aria-hidden />
          </span>
        </div>

        <div className="am-activity-body min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <ActivityTitle title={title} />
            <span
              className={cn(
                "am-activity-badge shrink-0",
                BADGE_TONE[item.category],
              )}
            >
              {activityCategoryLabel(locale, item.category)}
            </span>
          </div>
          {detail ? (
            <p className="mt-0.5 text-[12px] leading-snug text-[var(--am-text-secondary)]">
              {detail}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <MetaChip
              icon={User}
              label={ts(locale, "suppliers.activity.userLabel")}
              value={actor}
            />
            <MetaChip
              icon={CalendarDays}
              label={ts(locale, "suppliers.activity.dateLabel")}
              value={date}
              ltr
            />
            <MetaChip
              icon={Clock3}
              label={ts(locale, "suppliers.activity.timeLabel")}
              value={time}
              ltr
            />
          </div>
        </div>

        <span
          className="flex size-8 shrink-0 items-center justify-center self-center rounded-full text-[var(--am-blue-700)]"
          aria-hidden
        >
          <Chevron className="size-4" strokeWidth={2.25} />
        </span>
      </button>
    </li>
  );
}

function ActivityDetailDialog({
  item,
  locale,
  onClose,
}: {
  item: SupplierActivityItem | null;
  locale: Locale;
  onClose: () => void;
}) {
  if (!item) return null;

  const Icon = KIND_ICON[item.kind] ?? Receipt;
  const title = formatActivityTitle(locale, item);
  const detail = formatActivityDetail(locale, item);
  const actor = formatActivityActor(locale, item.actor);
  const date = formatActivityDate(locale, item.at);
  const time = formatActivityTime(locale, item.at);
  const relatedLabel =
    item.source === "ledger" && item.meta.referenceId
      ? `${ts(locale, "suppliers.activity.openRecord")} ${item.meta.referenceId}`
      : item.href
        ? ts(locale, "suppliers.activity.openRelated")
        : null;

  return (
    <ModalDialog
      open
      onClose={onClose}
      size="md"
      title={ts(locale, "suppliers.activity.detailTitle")}
      footer={
        <>
          <button
            type="button"
            className="am-focus-ring h-9 rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3.5 text-[12.5px] font-semibold text-[var(--am-navy-900)]"
            onClick={onClose}
          >
            {ts(locale, "suppliers.form.cancel")}
          </button>
          {item.href && relatedLabel ? (
            <Link
              href={item.href}
              className="am-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-blue-700)] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[var(--am-blue-600)]"
              onClick={onClose}
            >
              {relatedLabel}
            </Link>
          ) : null}
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "am-activity-icon shrink-0 !shadow-none",
              KIND_TONE[item.kind],
            )}
          >
            <Icon className="size-3.5 stroke-[2.25]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <ActivityTitle title={title} />
            <span
              className={cn(
                "am-activity-badge mt-1.5 inline-flex",
                BADGE_TONE[item.category],
              )}
            >
              {activityCategoryLabel(locale, item.category)}
            </span>
          </div>
        </div>

        {detail ? (
          <p className="text-[13px] leading-relaxed text-[var(--am-text-secondary)]">
            {detail}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <DetailRow
            label={ts(locale, "suppliers.activity.userLabel")}
            value={actor}
          />
          <DetailRow
            label={ts(locale, "suppliers.activity.dateLabel")}
            value={date}
            ltr
          />
          <DetailRow
            label={ts(locale, "suppliers.activity.timeLabel")}
            value={time}
            ltr
          />
          {item.meta.referenceId ? (
            <DetailRow
              label={ts(locale, "suppliers.details.reference")}
              value={item.meta.referenceId}
              ltr
            />
          ) : null}
          {item.meta.fileName ? (
            <DetailRow
              label={ts(locale, "suppliers.details.documents")}
              value={item.meta.fileName}
              ltr
            />
          ) : null}
        </div>
      </div>
    </ModalDialog>
  );
}
