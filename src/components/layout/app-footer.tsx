import { APP_VERSION } from "@/lib/app-version";

/** Slim shell footer — product version only (no marketing copy). */
export function AppFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-[var(--am-border-default)] pt-2.5 pb-1">
      <p
        className="text-center text-[var(--am-text-2xs)] tabular-nums text-[var(--am-text-muted)]"
        dir="ltr"
      >
        v{APP_VERSION}
      </p>
    </footer>
  );
}
