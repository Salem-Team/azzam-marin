import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type Tone = "navy" | "blue" | "green" | "orange" | "red";

const TONES: Record<Tone, { icon: string; accent: string }> = {
  navy: {
    icon: "bg-[color-mix(in_srgb,var(--am-navy-900)_8%,white)] text-[var(--am-navy-900)]",
    accent: "bg-[var(--am-navy-900)]",
  },
  blue: {
    icon: "bg-[var(--am-blue-100)] text-[var(--am-blue-700)]",
    accent: "bg-[var(--am-blue-700)]",
  },
  green: {
    icon: "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
    accent: "bg-[var(--am-success-600)]",
  },
  orange: {
    icon: "bg-[color-mix(in_srgb,var(--am-warning-600)_14%,white)] text-[var(--am-warning-600)]",
    accent: "bg-[var(--am-warning-600)]",
  },
  red: {
    icon: "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)]",
    accent: "bg-[var(--am-danger-600)]",
  },
};

export interface CatalogKpiCard {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
}

export function CatalogKpiStrip({ cards }: { cards: readonly CatalogKpiCard[] }) {
  return (
    <div
      className={cn(
        "am-kpi-grid",
        cards.length === 4 && "am-kpi-grid--quad",
      )}
      data-count={cards.length}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = TONES[card.tone];
        return (
          <article
            key={card.id}
            className="am-surface-card relative flex min-w-0 items-stretch overflow-hidden"
          >
            <span
              className={cn("absolute inset-y-0 start-0 w-[3px]", tone.accent)}
              aria-hidden
            />
            <div className="flex min-h-[4.25rem] min-w-0 flex-1 items-center gap-3 px-3 py-3 ps-4">
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--am-radius-md)]",
                  tone.icon,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[var(--am-text-secondary)]">
                  {card.label}
                </p>
                <p className="mt-0.5 truncate text-[20px] font-bold leading-none tabular-nums tracking-tight text-[var(--am-navy-900)]">
                  {card.value}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
