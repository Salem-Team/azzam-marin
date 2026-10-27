"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export interface ChartMenuOption<T extends string> {
  value: T;
  label: string;
}

interface ChartMenuSelectProps<T extends string> {
  value: T;
  options: readonly ChartMenuOption<T>[];
  onChange: (value: T) => void;
  label: string;
}

export function ChartMenuSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: ChartMenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 148);
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const openUp = spaceBelow < 160 && rect.top > spaceBelow;
      const top = openUp ? undefined : rect.bottom + gap;
      const bottom = openUp
        ? window.innerHeight - rect.top + gap
        : undefined;
      const isRtl = document.documentElement.dir === "rtl";
      setPanelStyle({
        position: "fixed",
        top,
        bottom,
        left: isRtl ? undefined : rect.right - width,
        right: isRtl ? window.innerWidth - rect.right : undefined,
        width,
        zIndex: 80,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      data-card-action=""
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={cn(
          "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-[var(--am-border-default)]",
          "bg-[var(--am-surface-page)] px-2.5 text-[11px] font-semibold text-[var(--am-navy-900)]",
          "outline-none am-transition-colors",
          "hover:border-[color-mix(in_srgb,var(--am-blue-700)_40%,var(--am-border-default))] hover:bg-white",
          "focus-visible:ring-2 focus-visible:ring-[var(--am-blue-700)]",
          open &&
            "border-[var(--am-blue-700)] bg-white text-[var(--am-blue-700)] shadow-[var(--am-shadow-sm)]",
        )}
      >
        {selected?.label}
        <ChevronDown
          className={cn(
            "size-3.5 text-[var(--am-text-secondary)] am-transition-transform",
            open && "rotate-180 text-[var(--am-blue-700)]",
          )}
          aria-hidden
        />
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={panelRef}
              id={menuId}
              role="listbox"
              aria-label={label}
              className="am-surface-panel overflow-hidden rounded-[var(--am-radius-md)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] py-1 shadow-[var(--am-shadow-md)]"
              style={panelStyle}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center px-3 py-2 text-start text-[12px] font-medium outline-none am-transition-colors",
                      active
                        ? "bg-[color-mix(in_srgb,var(--am-blue-700)_10%,transparent)] text-[var(--am-blue-700)]"
                        : "text-[var(--am-navy-900)] hover:bg-[var(--am-surface-page)]",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
