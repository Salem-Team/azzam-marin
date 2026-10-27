"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/brand/error-screen";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorScreen kind="fault" standalone onReload={reset} />;
}
