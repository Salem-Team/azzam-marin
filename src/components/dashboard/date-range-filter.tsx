"use client";

import {
  CalendarRange,
  Check,
  ChevronDown,
  Eraser,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CalendarMonth } from "@/components/ui/calendar-month";
import { td, type DashboardKey } from "@/i18n/dashboard";
import { cn } from "@/lib/cn";
import {
  addMonths,
  formatDateRangeLabel,
  formatSingleDate,
  normalizeRange,
  QUARTER_PRESET_IDS,
  QUICK_PRESET_IDS,
  resolveDatePreset,
  sameDay,
  startOfDay,
  type DatePresetId,
  type DateRangeValue,
} from "@/lib/date-range";
import { useLocale } from "@/providers/locale-provider";

const PRESET_LABEL: Record<Exclude<DatePresetId, "custom">, DashboardKey> = {
  today: "period.today",
  yesterday: "period.yesterday",
  last7: "period.last7",
  last30: "period.last30",
  thisMonth: "period.current",
  lastMonth: "period.lastMonth",
  thisQuarter: "period.thisQuarter",
  prevQuarter: "period.prevQuarter",
  thisYear: "period.thisYear",
  fiscalYear: "period.fiscalYear",
  q1: "period.q1",
  q2: "period.q2",
  q3: "period.q3",
  q4: "period.q4",
};

type MobileTab = "quick" | "calendar" | "quarters" | "year";

interface DateRangeFilterProps {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
  className?: string;
}

function cloneRange(range: DateRangeValue): DateRangeValue {
  return {
    preset: range.preset,
    start: new Date(range.start),
    end: new Date(range.end),
  };
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const { locale } = useLocale();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState<DateRangeValue>(() =>
    resolveDatePreset("thisMonth"),
  );
  const [draft, setDraft] = useState<DateRangeValue>(() =>
    resolveDatePreset("thisMonth"),
  );
  const [pickPhase, setPickPhase] = useState<"start" | "end">("start");
  const [viewMonth, setViewMonth] = useState(() =>
    startOfDay(new Date(resolveDatePreset("thisMonth").start)),
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("quick");

  const active = value ?? committed;
  const triggerLabel = useMemo(
    () => formatDateRangeLabel(active, locale),
    [active, locale],
  );
  const draftLabel = useMemo(
    () => formatDateRangeLabel(draft, locale),
    [draft, locale],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openPicker = () => {
    const source = value ?? committed;
    setDraft(cloneRange(source));
    setViewMonth(
      startOfDay(
        new Date(source.start.getFullYear(), source.start.getMonth(), 1),
      ),
    );
    setPickPhase("start");
    setMobileTab("quick");
    setOpen(true);
  };

  const applyPreset = (preset: DatePresetId) => {
    if (preset === "custom") return;
    const next = resolveDatePreset(preset, new Date());
    setDraft(next);
    setViewMonth(startOfDay(new Date(next.start.getFullYear(), next.start.getMonth(), 1)));
    setPickPhase("start");
  };

  const onSelectDay = (day: Date) => {
    const d = startOfDay(day);
    if (pickPhase === "start" || !draft.start) {
      setDraft({
        preset: "custom",
        start: d,
        end: d,
      });
      setPickPhase("end");
      return;
    }

    const normalized = normalizeRange(draft.start, d);
    setDraft({
      preset: "custom",
      start: normalized.start,
      end: normalized.end,
    });
    setPickPhase("start");
  };

  const apply = () => {
    const next = cloneRange(draft);
    if (!value) setCommitted(next);
    onChange?.(next);
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  const clear = () => {
    const next = resolveDatePreset("thisMonth", new Date());
    setDraft(next);
    setViewMonth(startOfDay(new Date(next.start.getFullYear(), next.start.getMonth(), 1)));
    setPickPhase("start");
  };

  const tabs: { id: MobileTab; label: DashboardKey }[] = [
    { id: "quick", label: "period.quick" },
    { id: "calendar", label: "period.calendar" },
    { id: "quarters", label: "period.quarters" },
    { id: "year", label: "period.year" },
  ];

  return (
    <div className={cn("relative z-20", className)}>
      <button
        type="button"
        onClick={openPicker}
        aria-label={td(locale, "period.selectTitle")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        data-active={open ? "true" : undefined}
        className={cn(
          "am-topbar-control group inline-flex max-w-[min(100vw-2rem,280px)] items-center gap-1.5 rounded-[10px] border border-white/35 bg-white px-2.5 py-1.5 outline-none",
          "text-[11px] font-semibold text-[var(--am-text-primary)] shadow-[var(--am-shadow-sm)]",
          "hover:border-[color-mix(in_srgb,var(--am-blue-700)_40%,white)] hover:bg-[var(--am-blue-100)]",
          "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-navy-900)]",
          open && "border-[var(--am-blue-700)] bg-[var(--am-blue-100)]",
        )}
      >
        <CalendarRange
          className="size-3.5 shrink-0 text-[var(--am-blue-700)]"
          aria-hidden
        />
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[var(--am-text-secondary)] am-transition-transform",
            open && "rotate-180 text-[var(--am-blue-700)]",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="am-date-picker-root" role="presentation">
          <button
            type="button"
            className="am-date-picker-backdrop"
            aria-label={td(locale, "period.close")}
            onClick={cancel}
          />

          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${menuId}-title`}
            className="am-date-picker-panel"
          >
            <header className="am-date-picker-header">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--am-blue-100)] text-[var(--am-blue-700)]">
                    <CalendarRange className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id={`${menuId}-title`}
                      className="text-[14px] font-bold text-[var(--am-text-primary)]"
                    >
                      {td(locale, "period.selectTitle")}
                    </h2>
                    <p className="truncate text-[11.5px] text-[var(--am-text-secondary)]">
                      {draftLabel}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={cancel}
                className="am-topbar-control inline-flex size-9 items-center justify-center rounded-[10px] text-[var(--am-text-secondary)] outline-none hover:bg-[var(--am-surface-page)] hover:text-[var(--am-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]"
                aria-label={td(locale, "period.close")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            {/* Mobile / tablet tabs */}
            <div className="am-date-picker-tabs lg:hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobileTab(tab.id)}
                  className={cn(
                    "am-date-picker-tab",
                    mobileTab === tab.id && "am-date-picker-tab-active",
                  )}
                >
                  {td(locale, tab.label)}
                </button>
              ))}
            </div>

            <div className="am-date-picker-body">
              {/* Desktop presets */}
              <aside className="am-date-picker-presets hidden lg:flex">
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-[var(--am-text-muted)]">
                  {td(locale, "period.quick")}
                </p>
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pe-1">
                  {QUICK_PRESET_IDS.map((preset) => (
                    <PresetButton
                      key={preset}
                      active={draft.preset === preset}
                      onClick={() => applyPreset(preset)}
                    >
                      {td(locale, PRESET_LABEL[preset])}
                    </PresetButton>
                  ))}
                </div>
              </aside>

              <div className="am-date-picker-main">
                {/* Mobile tab panels */}
                <div className="lg:hidden">
                  {mobileTab === "quick" ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {QUICK_PRESET_IDS.map((preset) => (
                        <PresetButton
                          key={preset}
                          active={draft.preset === preset}
                          onClick={() => applyPreset(preset)}
                          card
                        >
                          {td(locale, PRESET_LABEL[preset])}
                        </PresetButton>
                      ))}
                    </div>
                  ) : null}

                  {mobileTab === "calendar" ? (
                    <div className="space-y-3">
                      <DateFields
                        locale={locale}
                        draft={draft}
                      />
                      <CalendarMonth
                        month={viewMonth}
                        locale={locale}
                        rangeStart={draft.start}
                        rangeEnd={draft.end}
                        onSelectDay={onSelectDay}
                        onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
                        onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
                      />
                    </div>
                  ) : null}

                  {mobileTab === "quarters" ? (
                    <div className="grid grid-cols-2 gap-2">
                      {QUARTER_PRESET_IDS.map((preset) => {
                        const range = resolveDatePreset(preset, new Date());
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={cn(
                              "am-transition-colors flex flex-col items-start gap-1 rounded-[12px] border px-3 py-3 text-start outline-none",
                              "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]",
                              draft.preset === preset
                                ? "border-[var(--am-blue-700)] bg-[var(--am-blue-700)] text-white"
                                : "border-[var(--am-border-default)] bg-[var(--am-surface-page)] hover:border-[var(--am-blue-700)]",
                            )}
                          >
                            <span className="inline-flex items-center gap-1 text-[14px] font-bold">
                              {draft.preset === preset ? (
                                <Check className="size-3.5" aria-hidden />
                              ) : null}
                              {td(locale, PRESET_LABEL[preset])}
                            </span>
                            <span
                              className={cn(
                                "text-[10.5px]",
                                draft.preset === preset
                                  ? "text-white/85"
                                  : "text-[var(--am-text-secondary)]",
                              )}
                            >
                              {formatDateRangeLabel(range, locale)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {mobileTab === "year" ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(["thisYear", "fiscalYear"] as const).map((preset) => (
                        <PresetButton
                          key={preset}
                          active={draft.preset === preset}
                          onClick={() => applyPreset(preset)}
                          card
                        >
                          {td(locale, PRESET_LABEL[preset])}
                        </PresetButton>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Desktop calendars */}
                <div className="hidden lg:block">
                  <DateFields locale={locale} draft={draft} />
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <CalendarMonth
                      month={viewMonth}
                      locale={locale}
                      rangeStart={draft.start}
                      rangeEnd={draft.end}
                      onSelectDay={onSelectDay}
                      onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
                      onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
                      showNav
                    />
                    <CalendarMonth
                      month={addMonths(viewMonth, 1)}
                      locale={locale}
                      rangeStart={draft.start}
                      rangeEnd={draft.end}
                      onSelectDay={onSelectDay}
                      onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
                      onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
                      showNav
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="am-date-picker-footer">
              <button
                type="button"
                onClick={clear}
                className="am-transition-colors inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-semibold text-[var(--am-text-secondary)] outline-none hover:bg-[var(--am-surface-page)] hover:text-[var(--am-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]"
              >
                <Eraser className="size-3.5" aria-hidden />
                {td(locale, "period.clear")}
              </button>
              <div className="ms-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="am-transition-colors inline-flex h-10 items-center rounded-[10px] px-3.5 text-[12.5px] font-semibold text-[var(--am-text-secondary)] outline-none hover:bg-[var(--am-surface-page)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]"
                >
                  {td(locale, "period.cancel")}
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="am-transition-colors inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[var(--am-blue-700)] px-4 text-[12.5px] font-bold text-white outline-none hover:bg-[var(--am-blue-600)] focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)] focus-visible:ring-offset-2"
                >
                  <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                  {td(locale, "period.apply")}
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DateFields({
  locale,
  draft,
}: {
  locale: "en" | "ar";
  draft: DateRangeValue;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--am-text-muted)]">
          {td(locale, "period.from")}
        </p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--am-text-primary)]">
          {formatSingleDate(draft.start, locale)}
        </p>
      </div>
      <div className="rounded-[10px] border border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--am-text-muted)]">
          {td(locale, "period.to")}
        </p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--am-text-primary)]">
          {formatSingleDate(
            sameDay(draft.start, draft.end) && draft.preset === "custom"
              ? draft.start
              : draft.end,
            locale,
          )}
        </p>
      </div>
    </div>
  );
}

function PresetButton({
  active,
  onClick,
  children,
  card = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  card?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "am-transition-colors inline-flex w-full items-center gap-2 rounded-[10px] text-start text-[12.5px] font-semibold outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)]",
        card ? "min-h-11 border px-3 py-2.5" : "h-9 px-2.5",
        active
          ? "border-[var(--am-navy-900)] bg-[var(--am-navy-900)] text-white"
          : "border-[var(--am-border-default)] bg-transparent text-[var(--am-text-primary)] hover:bg-[var(--am-blue-100)] hover:text-[var(--am-blue-700)]",
        card && !active && "bg-[var(--am-surface-page)]",
      )}
    >
      {active ? <Check className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
