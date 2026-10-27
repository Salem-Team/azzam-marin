import { Suspense } from "react";

import { SparePartDetailsView } from "@/components/spare-parts/spare-part-details-view";
import { PageFrame, PageSurface } from "@/components/layout/page-frame";
import { SPARE_PARTS } from "@/config/mock-catalog";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return SPARE_PARTS.map((part) => ({ id: part.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function SpareDetailsFallback() {
  return (
    <PageFrame>
      <PageSurface className="items-center justify-center p-8 text-center">
        <p className="text-[13px] text-[var(--am-text-secondary)]">…</p>
      </PageSurface>
    </PageFrame>
  );
}

export default async function SparePartDetailsPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeRecordParam(raw);
  return (
    <Suspense fallback={<SpareDetailsFallback />}>
      <SparePartDetailsView partId={id} />
    </Suspense>
  );
}
