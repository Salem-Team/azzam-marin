"use client";

import {
  ArrowLeftRight,
  Banknote,
  Clock3,
  FileBarChart2,
  Ship,
  ShoppingCart,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ViewAllLink } from "@/components/dashboard/view-all-link";
import { RecordCardLink } from "@/components/ui/record-row";
import { RECENT_ACTIVITIES } from "@/config/mock-dashboard";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { useClientActivity } from "@/lib/client-activity-store";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { purchaseOrderDetailsHref } from "@/lib/record-routes";
import { useLocale } from "@/providers/locale-provider";

const ICONS = {
  a1: Ship,
  a2: ShoppingCart,
  a3: Banknote,
  a4: FileBarChart2,
  a5: ArrowLeftRight,
} as const;

const ICON_TONE = {
  blue: "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)] ring-1 ring-[color-mix(in_srgb,var(--am-blue-700)_24%,transparent)]",
  red: "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)] ring-1 ring-[color-mix(in_srgb,var(--am-danger-600)_24%,transparent)]",
  green:
    "bg-[color-mix(in_srgb,var(--am-success-600)_14%,white)] text-[var(--am-success-600)] ring-1 ring-[color-mix(in_srgb,var(--am-success-600)_24%,transparent)]",
  orange:
    "bg-[#FFF4E5] text-[#B7791F] ring-1 ring-[color-mix(in_srgb,#B7791F_24%,transparent)]",
} as const;

const BADGE_TONE: Record<string, string> = {
  "act.cat.sales":
    "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
  "act.cat.purchase":
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  "act.cat.finance":
    "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
  "act.cat.inventory":
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  "act.cat.pricing": "bg-[#FFF4E5] text-[#B7791F]",
};

/** Keep document IDs / Latin codes visually stable inside Arabic titles. */
function ActivityTitle({ title }: { title: string }) {
  const match = title.match(/^(.*?)(\s*)(#?[A-Z]{2,4}-\d[\w-]*)$/);
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

function ActivityDetail({
  detail,
  highlight,
}: {
  detail: string;
  highlight?: string;
}) {
  if (!highlight || !detail.includes(highlight)) {
    return (
      <p className="mt-0.5 text-[12px] leading-snug text-[var(--am-text-secondary)]">
        {detail}
      </p>
    );
  }

  const [before, after] = detail.split(highlight);
  return (
    <p className="mt-0.5 text-[12px] leading-snug text-[var(--am-text-secondary)]">
      {before}
      <span
        dir="ltr"
        className="inline-block font-bold tabular-nums text-[var(--am-navy-900)]"
      >
        {highlight}
      </span>
      {after}
    </p>
  );
}

export function RecentActivitiesCard() {
  const { locale } = useLocale();
  const liveEvents = useClientActivity().slice(0, 5);
  const useLive = liveEvents.length > 0;
  const total = useLive ? liveEvents.length : RECENT_ACTIVITIES.length;

  return (
    <DashboardCard
      title={td(locale, "act.title")}
      href="/audit-log"
      hrefLabel={`${td(locale, "dash.goTo")} ${td(locale, "act.title")}`}
      icon={<Clock3 className="size-3.5" strokeWidth={2.25} aria-hidden />}
      bodyClassName="flex flex-col p-0"
      action={
        <ViewAllLink href="/audit-log" label={td(locale, "po.viewAll")} />
      }
    >
      <div className="am-activity-feed flex-1 px-3 py-2 sm:px-3.5">
        <ul className="am-activity-list">
          {useLive
            ? liveEvents.map((event, index) => {
                const isFirst = index === 0;
                const isLast = index === total - 1;
                return (
                  <li key={event.id} className="am-activity-row">
                    <div className="am-activity-item">
                      <div
                        className={cn(
                          "am-activity-track",
                          isFirst && "am-activity-track--first",
                          isLast && "am-activity-track--last",
                        )}
                        aria-hidden
                      >
                        <span
                          className={cn(
                            "am-activity-icon",
                            ICON_TONE.blue,
                          )}
                        >
                          <Clock3 className="size-3.5 stroke-[2]" aria-hidden />
                        </span>
                      </div>
                      <div className="am-activity-body min-w-0">
                        <p className="text-[13px] font-bold leading-snug text-[var(--am-navy-900)]">
                          {locale === "ar" ? event.summaryAr : event.summaryEn}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--am-text-secondary)]">
                          {locale === "ar"
                            ? event.actorNameAr || event.actorNameEn
                            : event.actorNameEn || event.actorNameAr}
                          {" · "}
                          {event.entityType} · {event.action}
                        </p>
                      </div>
                      <div className="am-activity-meta">
                        <span className="am-activity-time" dir="ltr">
                          {formatDateTime(event.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })
            : null}
          {!useLive
            ? RECENT_ACTIVITIES.map((item, index) => {
            const Icon = ICONS[item.id as keyof typeof ICONS] ?? Ship;
            const detail = locale === "ar" ? item.detailAr : item.detailEn;
            const highlight =
              "highlightEn" in item
                ? locale === "ar"
                  ? item.highlightAr
                  : item.highlightEn
                : undefined;
            const recordHref =
              "recordKind" in item &&
              item.recordKind === "purchase-order" &&
              "recordId" in item
                ? purchaseOrderDetailsHref(item.recordId)
                : null;
            const recordLabel = recordHref
              ? `${td(locale, "po.openRecord")} ${"recordId" in item ? item.recordId : ""}`
              : undefined;
            const isFirst = index === 0;
            const isLast = index === total - 1;

            const body = (
              <>
                <div
                  className={cn(
                    "am-activity-track",
                    isFirst && "am-activity-track--first",
                    isLast && "am-activity-track--last",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn("am-activity-icon", ICON_TONE[item.tone])}
                  >
                    <Icon className="size-3.5 stroke-[2]" aria-hidden />
                  </span>
                </div>

                <div className="am-activity-body min-w-0">
                  <ActivityTitle
                    title={td(locale, item.titleKey as DashboardKey)}
                  />
                  <ActivityDetail detail={detail} highlight={highlight} />
                </div>

                <div className="am-activity-meta">
                  <span className="am-activity-time">
                    {locale === "ar" ? item.timeAr : item.timeEn}
                  </span>
                  <span
                    className={cn(
                      "am-activity-badge",
                      BADGE_TONE[item.categoryKey],
                    )}
                  >
                    {td(locale, item.categoryKey as DashboardKey)}
                  </span>
                </div>
              </>
            );

            return (
              <li key={item.id} className="am-activity-row">
                {recordHref && recordLabel ? (
                  <RecordCardLink
                    href={recordHref}
                    label={recordLabel}
                    className="am-activity-item"
                  >
                    {body}
                  </RecordCardLink>
                ) : (
                  <div className="am-activity-item">{body}</div>
                )}
              </li>
            );
          })
            : null}
        </ul>
      </div>
    </DashboardCard>
  );
}
