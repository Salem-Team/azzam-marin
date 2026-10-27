"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ChartFrameProps {
  /** Fixed pixel height (skips responsive token heights). */
  height?: number;
  /** Apply `--am-chart-h-*` tokens. Default true when height is unset. */
  useTokenHeight?: boolean;
  className?: string;
  children: ReactNode;
}

/** Ensures Recharts has a measurable box after client mount. */
export function ChartFrame({
  height,
  useTokenHeight,
  className,
  children,
}: ChartFrameProps) {
  const [ready, setReady] = useState(false);
  const tokenHeight = useTokenHeight ?? height == null;

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "w-full min-w-0",
        tokenHeight &&
          "h-[var(--am-chart-h-mobile)] lg:h-[var(--am-chart-h-desktop)]",
        className,
      )}
      style={height != null ? { height, minHeight: height } : undefined}
    >
      {ready ? children : null}
    </div>
  );
}
