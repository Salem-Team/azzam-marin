"use client";

import { useMemo, useState } from "react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { to } from "@/i18n/ops";
import {
  activityActorDisplayName,
  activityActorDisplayRole,
} from "@/lib/activity-actor";
import { useClientActivity } from "@/lib/client-activity-store";
import { formatDateTime } from "@/lib/format";
import { useLocale } from "@/providers/locale-provider";

export function AuditLogDirectory() {
  const { locale } = useLocale();
  const events = useClientActivity();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [
        e.entityType,
        e.entityId,
        e.action,
        e.summaryEn,
        e.summaryAr,
        e.actorNameEn,
        e.actorNameAr,
        e.actorRoleEn,
        e.actorRoleAr,
        e.actorEmail,
        e.actorUserId,
        e.createdAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [events, query]);

  return (
    <PageFrame className="am-page--flow gap-3">
      <div>
        <h1 className="am-text-page-title">
          {locale === "ar" ? "سجل النشاط" : "Activity log"}
        </h1>
        <p className="mt-1 text-[12px] text-[var(--am-text-secondary)]">
          {locale === "ar"
            ? "كل حدث يُسجَّل بالمستخدم والتاريخ والوقت بدقة (واجهة محلية — ليس تدقيق خادم آمناً)."
            : "Each event records user, date, and time precisely (browser-local — not a secure server audit)."}{" "}
          {to(locale, "ops.demoPersist")}
        </p>
      </div>
      <PageSurface fill={false} className="overflow-hidden">
        <div className="border-b border-[var(--am-border-default)] p-3">
          <input
            className="am-focus-ring w-full rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2 text-[13px]"
            placeholder={to(locale, "ops.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[var(--am-text-secondary)]">
            {to(locale, "ops.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--am-border-default)]">
            {filtered.map((e) => {
              const actor = {
                nameEn: e.actorNameEn,
                nameAr: e.actorNameAr,
                roleEn: e.actorRoleEn,
                roleAr: e.actorRoleAr,
              };
              return (
                <li key={e.id} className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-[var(--am-navy-900)]">
                    {locale === "ar" ? e.summaryAr : e.summaryEn}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--am-navy-900)]">
                    <span className="font-semibold">
                      {activityActorDisplayName(locale, actor)}
                    </span>
                    <span className="text-[var(--am-text-secondary)]">
                      {" · "}
                      {activityActorDisplayRole(locale, actor)}
                    </span>
                  </p>
                  <p
                    className="mt-0.5 text-[11.5px] text-[var(--am-text-secondary)]"
                    dir="ltr"
                  >
                    {formatDateTime(e.createdAt, locale)}
                    {" · "}
                    {e.entityType}/{e.entityId}
                    {" · "}
                    {e.action}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </PageSurface>
    </PageFrame>
  );
}
