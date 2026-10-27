"use client";

import type { CSSProperties } from "react";
import { Check, type LucideIcon } from "lucide-react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

export interface WizardStepItem {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface WizardStepperProps {
  steps: readonly WizardStepItem[];
  current: number;
  /** Label like "Step 3 of 6". */
  progressLabel: string;
  onStepSelect?: (stepId: number) => void;
  className?: string;
}

/**
 * Numbered wizard progress with icons, titles, and calm connector fill.
 * Mobile: compact icon rail + strong current title.
 * sm+: full labels under each step.
 */
export function WizardStepper({
  steps,
  current,
  progressLabel,
  onStepSelect,
  className,
}: WizardStepperProps) {
  const reducedMotion = usePrefersReducedMotion();
  const total = steps.length;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === current),
  );
  const progressPct =
    total <= 1 ? 100 : Math.round((currentIndex / (total - 1)) * 100);
  const active = steps[currentIndex] ?? steps[0]!;
  const ActiveIcon = active.icon;

  return (
    <nav
      className={cn("am-wizard-stepper", className)}
      aria-label={progressLabel}
      style={
        {
          "--am-wizard-step-count": total,
        } as CSSProperties
      }
    >
      <header className="am-wizard-stepper__head">
        <div className="am-wizard-stepper__head-main min-w-0">
          <p className="am-wizard-stepper__eyebrow">{progressLabel}</p>
          <p className="am-wizard-stepper__title">
            <span
              className={cn(
                "am-wizard-stepper__title-icon",
                !reducedMotion && "am-wizard-step-pulse",
              )}
            >
              <ActiveIcon className="size-4 stroke-[1.75]" aria-hidden />
            </span>
            <span className="min-w-0 truncate">{active.label}</span>
          </p>
        </div>
        <p className="am-wizard-stepper__count" dir="ltr">
          <span className="am-wizard-stepper__count-current">
            {currentIndex + 1}
          </span>
          <span className="am-wizard-stepper__count-sep">/</span>
          <span>{total}</span>
        </p>
      </header>

      <div
        className="am-wizard-track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={currentIndex + 1}
        aria-label={progressLabel}
      >
        <span
          className="am-wizard-track__fill"
          style={{
            width: `${progressPct}%`,
            transitionDuration: reducedMotion
              ? "1ms"
              : "var(--am-duration-layout)",
          }}
        />
      </div>

      <ol
        className="am-wizard-steps"
        style={
          {
            gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        {steps.map((item, index) => {
          const state =
            item.id < current
              ? "done"
              : item.id === current
                ? "current"
                : "todo";
          const clickable = Boolean(onStepSelect) && item.id < current;
          const Icon = item.icon;

          return (
            <li
              key={item.id}
              className={cn(
                "am-wizard-steps__item",
                state === "done" && "is-done",
                state === "current" && "is-current",
                state === "todo" && "is-todo",
              )}
            >
              {index > 0 ? (
                <span
                  className="am-wizard-steps__connector"
                  aria-hidden
                  data-filled={item.id <= current ? "true" : "false"}
                />
              ) : null}
              <button
                type="button"
                className={cn(
                  "am-wizard-steps__btn am-focus-ring",
                  clickable && "is-clickable",
                )}
                disabled={!clickable}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`${item.id}. ${item.label}`}
                onClick={() => {
                  if (clickable) onStepSelect?.(item.id);
                }}
              >
                <span className="am-wizard-steps__node">
                  <span className="am-wizard-steps__icon" aria-hidden>
                    {state === "done" ? (
                      <Check className="size-3.5 stroke-[2.5] sm:size-3.5" />
                    ) : (
                      <Icon className="size-3.5 stroke-[1.75]" />
                    )}
                  </span>
                  <span className="am-wizard-steps__num" aria-hidden>
                    {item.id}
                  </span>
                </span>
                <span className="am-wizard-steps__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
