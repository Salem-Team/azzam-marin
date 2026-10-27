import { ErrorScreen } from "@/components/brand/error-screen";
import { getRequestDocumentPreferences } from "@/lib/request-preferences";

export default async function NotFoundPage() {
  const doc = await getRequestDocumentPreferences();

  return (
    <ErrorScreen kind="not-found" standalone locale={doc.preferences.locale} />
  );
}
