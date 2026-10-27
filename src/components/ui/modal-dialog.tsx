"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  /** Called before close when user hits Escape / backdrop; return false to block. */
  onRequestClose?: () => boolean | void;
}

export function ModalDialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "lg",
  onRequestClose,
}: ModalDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const ok = onRequestClose?.();
      if (ok === false) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onRequestClose]);

  if (!open || !mounted) return null;

  function requestClose() {
    const ok = onRequestClose?.();
    if (ok === false) return;
    onClose();
  }

  const maxWidth =
    size === "xl"
      ? "sm:max-w-3xl"
      : size === "lg"
        ? "sm:max-w-2xl"
        : "sm:max-w-md";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--am-navy-950)_40%,transparent)] backdrop-blur-[1px] am-transition-colors"
        aria-label="Close"
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] mx-auto flex max-h-[min(92dvh,840px)] w-full flex-col overflow-hidden rounded-t-[var(--am-radius-xl)] border border-[var(--am-border-default)] bg-[var(--am-surface-raised)] shadow-[var(--am-shadow-lg)] sm:rounded-[var(--am-radius-xl)]",
          maxWidth,
        )}
      >
        <div className="relative flex shrink-0 items-center justify-center border-b border-[var(--am-border-default)] px-4 py-3.5 sm:px-6">
          <h2
            id={titleId}
            className="max-w-[calc(100%-3rem)] truncate text-center text-[15px] font-bold text-[var(--am-navy-900)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="am-touch-target am-focus-ring absolute end-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[var(--am-radius-md)] text-[var(--am-text-secondary)] hover:bg-[var(--am-surface-page)] sm:end-4"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-[var(--am-border-default)] bg-[var(--am-surface-page)] px-4 py-3.5 sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
