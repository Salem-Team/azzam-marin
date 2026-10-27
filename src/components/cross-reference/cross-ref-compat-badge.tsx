import { cn } from "@/lib/cn";
import { tc } from "@/i18n/catalog";
import type { CompatibilityDegreeId } from "@/types/catalog";
import type { Locale } from "@/types/i18n";

const DEGREE_TONE: Record<
  CompatibilityDegreeId,
  { bg: string; text: string; dot: string }
> = {
  exact: {
    bg: "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)]",
    text: "text-[var(--am-success-600)]",
    dot: "bg-[var(--am-success-600)]",
  },
  high: {
    bg: "bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)]",
    text: "text-[var(--am-blue-700)]",
    dot: "bg-[var(--am-blue-700)]",
  },
  partial: {
    bg: "bg-[color-mix(in_srgb,var(--am-warning-600)_14%,white)]",
    text: "text-[var(--am-warning-600)]",
    dot: "bg-[var(--am-warning-600)]",
  },
  functional: {
    bg: "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)]",
    text: "text-[var(--am-danger-600)]",
    dot: "bg-[var(--am-danger-600)]",
  },
};

interface CrossRefCompatBadgeProps {
  degree: CompatibilityDegreeId;
  locale: Locale;
  className?: string;
  showDot?: boolean;
}

export function CrossRefCompatBadge({
  degree,
  locale,
  className,
  showDot = true,
}: CrossRefCompatBadgeProps) {
  const tone = DEGREE_TONE[degree];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-4",
        tone.bg,
        tone.text,
        className,
      )}
    >
      {showDot ? (
        <span className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} aria-hidden />
      ) : null}
      {tc(locale, `spare.compat.degree.${degree}`)}
    </span>
  );
}
