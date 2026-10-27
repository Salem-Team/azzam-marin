import { EngineDetailsView } from "@/components/marine-engines/engine-details-view";
import { MARINE_ENGINES } from "@/config/mock-catalog";
import { decodeRecordParam } from "@/lib/record-routes";

export const instant = false;

export function generateStaticParams() {
  return MARINE_ENGINES.map((engine) => ({ id: engine.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarineEngineDetailsPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeRecordParam(raw);
  return <EngineDetailsView engineId={id} />;
}
