"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted,
  );

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--am-mobile-nav-height,64px)+12px)] z-[90] flex flex-col items-center gap-2 px-3 lg:bottom-6"
              aria-live="polite"
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  role="status"
                  className={cn(
                    "pointer-events-auto flex max-w-md items-start gap-2 rounded-[var(--am-radius-lg)] border px-3.5 py-2.5 text-[13px] font-medium shadow-[var(--am-shadow-md)]",
                    item.tone === "success" &&
                      "border-[#C6EBD8] bg-[#F3FBF7] text-[#16865A]",
                    item.tone === "error" &&
                      "border-[#F5C6C9] bg-[#FDF4F4] text-[#C62832]",
                    item.tone === "info" &&
                      "border-[var(--am-border-default)] bg-[var(--am-surface-raised)] text-[var(--am-navy-900)]",
                  )}
                >
                  {item.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">{item.message}</span>
                  <button
                    type="button"
                    className="am-focus-ring -me-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100"
                    onClick={() =>
                      setItems((prev) => prev.filter((t) => t.id !== item.id))
                    }
                    aria-label="Dismiss"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}
