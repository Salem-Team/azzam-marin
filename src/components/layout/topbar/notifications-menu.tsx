"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  BellOff,
  Info,
  PackageCheck,
  Ship,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { TopbarControl } from "@/components/layout/topbar/topbar-control";
import { DropdownBackdrop } from "@/components/ui/dropdown-panel";
import {
  MOCK_NOTIFICATIONS,
  type NotificationTone,
} from "@/config/mock-shell";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

const TONE_ICON = {
  alert: AlertTriangle,
  success: PackageCheck,
  info: Info,
  finance: Banknote,
  shipping: Ship,
} as const;

const TONE_STYLE: Record<NotificationTone, string> = {
  alert:
    "bg-[color-mix(in_srgb,var(--am-danger-600)_12%,white)] text-[var(--am-danger-600)]",
  success:
    "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
  info: "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
  finance:
    "bg-[color-mix(in_srgb,var(--am-success-600)_12%,white)] text-[var(--am-success-600)]",
  shipping:
    "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,white)] text-[var(--am-blue-700)]",
};

const PANEL_WIDTH = 380;
const PANEL_GAP = 8;
const VIEWPORT_PAD = 8;

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

type PanelCoords = { top: number; left: number; width: number };

function computePanelCoords(trigger: HTMLElement): PanelCoords {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_PAD * 2);
  const isRtl = document.documentElement.dir === "rtl";
  let left = isRtl ? rect.left : rect.right - width;
  left = Math.min(
    Math.max(left, VIEWPORT_PAD),
    window.innerWidth - width - VIEWPORT_PAD,
  );
  const top = Math.min(
    rect.bottom + PANEL_GAP,
    window.innerHeight - VIEWPORT_PAD,
  );
  return { top, left, width };
}

export function NotificationsMenu() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );
  const [unreadIds, setUnreadIds] = useState(
    () =>
      new Set(
        MOCK_NOTIFICATIONS.filter((item) => item.unread).map((item) => item.id),
      ),
  );
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = unreadIds.size;

  const close = useCallback(() => setOpen(false), []);

  const updateCoords = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setCoords(computePanelCoords(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
  }, [open, updateCoords, locale]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const onReposition = () => updateCoords();

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      "button, a, [href]",
    );
    window.requestAnimationFrame(() => firstFocusable?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, close, updateCoords]);

  const items = useMemo(() => MOCK_NOTIFICATIONS, []);

  const panel =
    open && mounted && coords ? (
      <>
        <DropdownBackdrop onClose={close} />
        <div
          ref={panelRef}
          id={menuId}
          role="dialog"
          aria-label={t("shell.notifications")}
          aria-modal="true"
          className={cn(
            "am-surface-panel am-dropdown-panel am-notifications-panel",
            "fixed z-[60] overflow-hidden p-0 shadow-[var(--am-shadow-lg)]",
          )}
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
            ["--am-dropdown-origin-x" as string]:
              document.documentElement.dir === "rtl" ? "start" : "end",
          }}
        >
          <div className="flex max-h-[min(70vh,440px)] flex-col">
            <header className="flex shrink-0 items-center gap-2 border-b border-[var(--am-border-default)] bg-[color-mix(in_srgb,var(--am-surface-page)_55%,var(--am-surface-raised))] px-4 py-3">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--am-blue-700)_12%,white)] text-[var(--am-blue-700)]">
                <Bell className="size-3.5" aria-hidden />
              </span>
              <p className="min-w-0 text-[13.5px] font-bold text-[var(--am-navy-900)]">
                {t("shell.notifications")}
              </p>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--am-surface-page)] text-[var(--am-text-secondary)] ring-1 ring-[var(--am-border-default)]">
                  <BellOff className="size-5" aria-hidden />
                </span>
                <p className="text-[13px] font-semibold text-[var(--am-text-primary)]">
                  {t("shell.notificationsEmpty")}
                </p>
              </div>
            ) : (
              <ul
                className="am-notifications-list min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
                role="list"
              >
                {items.map((item) => {
                  const Icon = TONE_ICON[item.tone];
                  const isUnread = unreadIds.has(item.id);
                  const title = locale === "ar" ? item.titleAr : item.titleEn;
                  const body = locale === "ar" ? item.bodyAr : item.bodyEn;
                  const time = locale === "ar" ? item.timeAr : item.timeEn;

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          "am-transition-colors group relative flex w-full gap-3 px-3.5 py-3 outline-none",
                          "hover:bg-[var(--am-surface-page)] focus-visible:bg-[var(--am-surface-page)]",
                          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]",
                          isUnread &&
                            "bg-[color-mix(in_srgb,var(--am-blue-700)_4%,var(--am-surface-raised))]",
                        )}
                        onClick={close}
                      >
                        {isUnread ? (
                          <span
                            className="absolute inset-y-3 start-0 w-[3px] rounded-e-full bg-[var(--am-blue-700)]"
                            aria-hidden
                          />
                        ) : null}

                        <span
                          className={cn(
                            "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                            TONE_STYLE[item.tone],
                          )}
                          aria-hidden
                        >
                          <Icon className="size-4 stroke-[1.8]" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[13px] font-semibold text-[var(--am-navy-900)]">
                              {title}
                              {isUnread ? (
                                <span className="sr-only">
                                  {" "}
                                  ({t("shell.notificationsNew")})
                                </span>
                              ) : null}
                            </p>
                            {isUnread ? (
                              <span
                                className="mt-1 inline-flex size-1.5 shrink-0 rounded-full bg-[var(--am-blue-700)]"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--am-text-secondary)]">
                            {body}
                          </p>
                          <p className="mt-1.5 text-[11px] text-[var(--am-text-muted)]">
                            {time}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <footer className="shrink-0 border-t border-[var(--am-border-default)] bg-[var(--am-surface-raised)] px-3 py-2">
              <Link
                href="/audit-log"
                onClick={close}
                className="am-transition-colors inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-semibold text-[var(--am-blue-700)] outline-none hover:bg-[color-mix(in_srgb,var(--am-blue-700)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--am-blue-700)]"
              >
                {t("shell.notificationsViewAll")}
                <ArrowRight
                  className="size-3.5 rtl:rotate-180"
                  aria-hidden
                />
              </Link>
            </footer>
          </div>
        </div>
      </>
    ) : null;

  return (
    <div className="relative">
      <TopbarControl
        ref={triggerRef}
        label={t("shell.notifications")}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) setUnreadIds((prev) => (prev.size === 0 ? prev : new Set()));
            return next;
          });
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        active={open}
      >
        <Bell
          className={cn(
            "size-4 stroke-[1.75] am-transition-transform",
            open && "scale-110 -rotate-12",
          )}
          aria-hidden
        />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute end-0.5 top-0.5 inline-flex h-[15px] min-w-[15px] items-center justify-center",
              "rounded-full bg-[var(--am-red-600)] px-0.5 text-[8px] font-bold leading-none text-white",
              "shadow-[0_0_0_1.5px_var(--am-surface-raised)]",
              "am-badge-pulse",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </TopbarControl>

      {panel && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
