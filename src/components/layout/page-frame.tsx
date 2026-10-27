import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface PageFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * Vertical page flex frame that fills the shell main area on large screens.
 * Children decide what stretches (typically `.am-page-surface`).
 */
export function PageFrame({ children, className }: PageFrameProps) {
  return (
    <div className={cn("am-page", className)}>{children}</div>
  );
}

interface PageSurfaceProps {
  children: ReactNode;
  className?: string;
  /** When true, surface grows to fill remaining viewport height (lg+). */
  fill?: boolean;
}

/** Primary content panel / card surface for a module page. */
export function PageSurface({
  children,
  className,
  fill = true,
}: PageSurfaceProps) {
  return (
    <section
      className={cn(
        "am-surface-card flex min-h-0 flex-col",
        fill && "am-page-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}
