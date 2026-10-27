"use client";

import { usePathname } from "next/navigation";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { PageHeader } from "@/components/layout/page-header";
import { findNavItemByHref } from "@/config/navigation";
import { useLocale } from "@/providers/locale-provider";

export function ModulePlaceholder() {
  const pathname = usePathname();
  const { t } = useLocale();
  const item = findNavItemByHref(pathname);
  const Icon = item?.icon;

  return (
    <PageFrame>
      <div className="hidden shrink-0 lg:block">
        <PageHeader pathname={pathname} />
      </div>
      <PageSurface className="items-center justify-center p-5 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {Icon ? (
            <span className="inline-flex size-11 items-center justify-center rounded-[var(--am-radius-md)] bg-[var(--am-surface-page)] text-[var(--am-action-primary)]">
              <Icon className="size-5 stroke-[1.75]" aria-hidden />
            </span>
          ) : null}
          <p className="am-text-label text-[var(--am-text-secondary)]">
            {t("shell.module.comingSoon")}
          </p>
        </div>
      </PageSurface>
    </PageFrame>
  );
}
