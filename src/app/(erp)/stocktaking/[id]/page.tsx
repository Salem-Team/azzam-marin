import { Suspense } from "react";

import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { StocktakingSessionView } from "@/components/stocktaking/stocktaking-session-view";
import { decodeRecordParam } from "@/lib/record-routes";

/** Dynamic client sessions — ids live in browser storage, not a static catalog. */
export const instant = false;

export function generateStaticParams() {
  return [{ id: "_" }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function Fallback() {
  return (
    <PageFrame className="am-page--flow">
      <PageSurface
        fill={false}
        className="min-h-[240px] animate-pulse bg-[color-mix(in_srgb,var(--am-surface-page)_60%,white)]"
        aria-hidden
      >
        <span className="sr-only">Loading</span>
      </PageSurface>
    </PageFrame>
  );
}

export default async function StocktakingSessionPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeRecordParam(raw);
  return (
    <Suspense fallback={<Fallback />}>
      <StocktakingSessionView id={id} />
    </Suspense>
  );
}
