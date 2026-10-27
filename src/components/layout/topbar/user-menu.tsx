"use client";

import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { DropdownBackdrop } from "@/components/ui/dropdown-panel";
import { MOCK_USER } from "@/config/mock-shell";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

const PANEL_WIDTH = 300;
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

export function UserMenu() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const name = locale === "ar" ? MOCK_USER.nameAr : MOCK_USER.name;
  const role = locale === "ar" ? MOCK_USER.roleAr : MOCK_USER.role;

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

    window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("a, button")
        ?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, close, updateCoords]);

  const panel =
    open && mounted && coords ? (
      <>
        <DropdownBackdrop onClose={close} />
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label={t("shell.user.accountMenu")}
          className={cn(
            "am-surface-panel am-dropdown-panel am-user-menu-panel",
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
          <div className="am-user-menu-hero relative overflow-hidden px-4 pb-3.5 pt-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.9]"
              aria-hidden
              style={{
                background:
                  "radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--am-blue-700) 16%, transparent) 0%, transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--am-surface-page) 70%, var(--am-surface-raised)) 0%, var(--am-surface-raised) 100%)",
              }}
            />
            <div className="relative flex items-start gap-3">
              <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--am-blue-600)_0%,var(--am-navy-900)_100%)] text-[13px] font-bold tracking-wide text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--am-navy-900)_22%,transparent)] ring-[3px] ring-[color-mix(in_srgb,var(--am-blue-700)_18%,white)]">
                {MOCK_USER.initials}
                <span
                  className="absolute end-0 top-0 size-2.5 rounded-full bg-[var(--am-success-600)] ring-2 ring-[var(--am-surface-raised)]"
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-[14px] font-bold leading-tight text-[var(--am-navy-900)]">
                  {name}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--am-blue-700)]">
                  {role}
                </p>
                <p className="mt-1 truncate text-[11.5px] text-[var(--am-text-secondary)]">
                  {MOCK_USER.email}
                </p>
              </div>
            </div>
            <div className="relative mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--am-blue-700)_18%,var(--am-border-default))] bg-[color-mix(in_srgb,var(--am-blue-700)_6%,var(--am-surface-raised))] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--am-navy-900)]">
              <ShieldCheck
                className="size-3 shrink-0 text-[var(--am-blue-700)]"
                aria-hidden
              />
              <span className="truncate">{t("shell.user.mockNote")}</span>
            </div>
          </div>

          <ul className="space-y-0.5 px-2 py-2" role="none">
            <li role="none">
              <Link
                href="/settings/users"
                role="menuitem"
                onClick={close}
                className={cn(
                  "am-user-menu-item group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 outline-none",
                  "text-[13px] font-medium text-[var(--am-navy-900)]",
                  "hover:bg-[var(--am-surface-page)] focus-visible:bg-[var(--am-surface-page)]",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]",
                  "am-transition-colors",
                )}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--am-blue-700)_10%,var(--am-surface-page))] text-[var(--am-blue-700)] am-transition-colors group-hover:bg-[color-mix(in_srgb,var(--am-blue-700)_14%,white)]">
                  <UserRound className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  {t("shell.user.profile")}
                </span>
              </Link>
            </li>
            <li role="none">
              <Link
                href="/settings/company"
                role="menuitem"
                onClick={close}
                className={cn(
                  "am-user-menu-item group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 outline-none",
                  "text-[13px] font-medium text-[var(--am-navy-900)]",
                  "hover:bg-[var(--am-surface-page)] focus-visible:bg-[var(--am-surface-page)]",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-blue-700)]",
                  "am-transition-colors",
                )}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--am-navy-900)_8%,var(--am-surface-page))] text-[var(--am-navy-900)] am-transition-colors group-hover:bg-[color-mix(in_srgb,var(--am-navy-900)_12%,white)]">
                  <Settings2 className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  {t("shell.user.settings")}
                </span>
              </Link>
            </li>
          </ul>

          <div className="border-t border-[var(--am-border-default)] px-2 py-2">
            <button
              type="button"
              role="menuitem"
              onClick={close}
              className={cn(
                "am-user-menu-item group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 outline-none",
                "text-[13px] font-semibold text-[var(--am-state-danger)]",
                "hover:bg-[color-mix(in_srgb,var(--am-danger-600)_8%,var(--am-surface-raised))]",
                "focus-visible:bg-[color-mix(in_srgb,var(--am-danger-600)_8%,var(--am-surface-raised))]",
                "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--am-danger-600)]",
                "am-transition-colors",
              )}
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--am-danger-600)_10%,var(--am-surface-page))] text-[var(--am-state-danger)]">
                <LogOut className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-start">
                {t("shell.user.signOut")}
              </span>
            </button>
          </div>
        </div>
      </>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        data-active={open ? "true" : undefined}
        className={cn(
          "am-topbar-control inline-flex h-8 max-w-[200px] items-center gap-1.5 rounded-[10px] pe-1 ps-1 outline-none",
          "border border-transparent",
          "hover:border-[var(--am-border-default)] hover:bg-[var(--am-surface-page)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--am-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--am-focus-ring-offset)]",
          open && "border-[var(--am-border-default)] bg-[var(--am-surface-page)]",
          "lg:pe-1.5",
        )}
        aria-label={t("shell.user.profile")}
        title={name}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <span
          className={cn(
            "relative inline-flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white",
            "bg-[linear-gradient(145deg,var(--am-blue-600)_0%,var(--am-navy-900)_100%)]",
            "ring-2 ring-[color-mix(in_srgb,var(--am-blue-700)_22%,transparent)]",
            "am-transition-transform",
            open &&
              "scale-105 ring-[color-mix(in_srgb,var(--am-blue-700)_40%,transparent)]",
          )}
        >
          {MOCK_USER.initials}
        </span>
        <span className="hidden min-w-0 text-start xl:block">
          <span className="block max-w-[110px] truncate text-[11.5px] font-semibold leading-tight text-[var(--am-text-primary)]">
            {name}
          </span>
          <span className="block max-w-[110px] truncate text-[10px] leading-tight text-[var(--am-text-secondary)]">
            {role}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "hidden size-3.5 text-[var(--am-text-secondary)] am-transition-transform xl:block",
            open && "rotate-180 text-[var(--am-blue-700)]",
          )}
          aria-hidden
        />
      </button>

      {panel && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
