"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/brand/error-screen";
import { PageFrame } from "@/components/layout/page-frame";

export default function ErpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageFrame>
      <ErrorScreen
        kind="fault"
        standalone={false}
        onReload={reset}
        className="min-h-0 flex-1"
      />
    </PageFrame>
  );
}
