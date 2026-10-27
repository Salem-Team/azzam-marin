"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/brand/error-screen";
import { readStoredPreferences } from "@/lib/preferences";
import { localeDirection } from "@/types/i18n";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const prefs = readStoredPreferences();
  const lang = prefs.locale;
  const dir = localeDirection(lang);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={lang} dir={dir}>
      <body className="min-h-dvh bg-[var(--am-navy-950)] antialiased">
        <ErrorScreen
          kind="fault"
          standalone
          locale={lang}
          onReload={reset}
        />
      </body>
    </html>
  );
}
