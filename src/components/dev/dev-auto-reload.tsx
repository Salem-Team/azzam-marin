"use client";

import { useEffect, useRef } from "react";

/**
 * Local-only: polls /dev-build.json and reloads when the live server finishes a rebuild.
 * Production builds omit public/dev-build.json so this is a no-op.
 */
export function DevAutoReload() {
  const stampRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (host !== "127.0.0.1" && host !== "localhost") return;

    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/dev-build.json?_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { t?: string | number };
        const stamp = String(data.t ?? "");
        if (!stamp) return;
        if (stampRef.current === null) {
          stampRef.current = stamp;
          return;
        }
        if (stampRef.current !== stamp) {
          stampRef.current = stamp;
          window.location.reload();
        }
      } catch {
        /* server rebuilding */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
