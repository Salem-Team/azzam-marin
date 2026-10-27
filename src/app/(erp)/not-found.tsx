import { ErrorScreen } from "@/components/brand/error-screen";
import { PageFrame } from "@/components/layout/page-frame";
import { getRequestDocumentPreferences } from "@/lib/request-preferences";

export default async function ErpNotFoundPage() {
  const doc = await getRequestDocumentPreferences();

  return (
    <PageFrame>
      <ErrorScreen
        kind="not-found"
        standalone={false}
        locale={doc.preferences.locale}
        className="min-h-0 flex-1"
      />
    </PageFrame>
  );
}
