"use client";

import { findNavItemByHref } from "@/config/navigation";
import { useLocale } from "@/providers/locale-provider";

interface PageHeaderProps {
  pathname: string;
}

export function PageHeader({ pathname }: PageHeaderProps) {
  const { t } = useLocale();
  const item = findNavItemByHref(pathname);
  const title = item ? t(item.labelKey) : t("app.name");

  return (
    <div className="shrink-0">
      <h1 className="am-text-page-title">{title}</h1>
    </div>
  );
}
