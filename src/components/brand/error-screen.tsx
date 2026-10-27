"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useSyncExternalStore } from "react";

import { te } from "@/i18n/errors";
import { cn } from "@/lib/cn";
import {
  getLocaleServerSnapshot,
  getLocaleSnapshot,
  subscribePreferences,
} from "@/lib/preference-store";
import type { Locale } from "@/types/i18n";
import { localeDirection } from "@/types/i18n";

export type ErrorScreenKind = "not-found" | "fault";

interface ErrorScreenProps {
  kind: ErrorScreenKind;
  /** Full-viewport brand stage (root / global errors). */
  standalone?: boolean;
  onReload?: () => void;
  /** Override locale (e.g. SSR cookie). */
  locale?: Locale;
  className?: string;
}

export function ErrorScreen({
  kind,
  standalone = false,
  onReload,
  locale: localeProp,
  className,
}: ErrorScreenProps) {
  const storedLocale = useSyncExternalStore(
    subscribePreferences,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );
  const router = useRouter();
  const locale = localeProp ?? storedLocale;
  const dir = localeDirection(locale);
  const isFault = kind === "fault";

  const code = te(locale, isFault ? "error.fault.code" : "error.notFound.code");
  const title = te(
    locale,
    isFault ? "error.fault.title" : "error.notFound.title",
  );
  const body = te(locale, isFault ? "error.fault.body" : "error.notFound.body");

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  }

  function handleReload() {
    if (onReload) {
      onReload();
      return;
    }
    window.location.reload();
  }

  return (
    <div
      dir={dir}
      lang={locale}
      className={cn(
        "am-error-screen",
        standalone ? "am-error-screen--standalone" : "am-error-screen--embedded",
        className,
      )}
    >
      <div className="am-error-screen__glow" aria-hidden />
      <div className="am-error-screen__mesh" aria-hidden />

      <div className="am-error-screen__stage">
        <div className="am-error-screen__brand am-error-enter">
          <span className="am-error-screen__logo-ring">
            <Image
              src="/brand/azzam-marine-logo.png"
              alt={te(locale, "error.brand")}
              width={128}
              height={128}
              className="am-error-screen__logo"
              priority
            />
          </span>
          <p className="am-error-screen__product">{te(locale, "error.brand")}</p>
        </div>

        <div className="am-error-screen__panel am-error-enter am-error-enter--delay">
          <span className="am-error-screen__code" aria-hidden>
            {code}
          </span>
          <h1 className="am-error-screen__title">{title}</h1>
          <p className="am-error-screen__body">{body}</p>

          <div className="am-error-screen__actions">
            {isFault ? (
              <button
                type="button"
                onClick={handleReload}
                className="am-error-btn am-error-btn--primary"
              >
                <RefreshCw className="size-3.5" aria-hidden />
                {te(locale, "error.action.reload")}
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="am-error-btn am-error-btn--primary"
              >
                <Home className="size-3.5" aria-hidden />
                {te(locale, "error.action.dashboard")}
              </Link>
            )}

            <button
              type="button"
              onClick={handleBack}
              className="am-error-btn am-error-btn--ghost"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
              {te(locale, "error.action.back")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
