/**
 * Fire-and-forget client audit events for cross-module activity feed.
 * Always stamps current session user + precise ISO datetime.
 * Never throws into calling CRUD paths.
 */

import type { ActivityActorSnapshot } from "@/lib/activity-actor";
import { recordClientActivity } from "@/lib/client-activity-store";

export function logClientActivity(input: {
  entityType: string;
  entityId: string;
  action: string;
  summaryEn: string;
  summaryAr: string;
  actor?: ActivityActorSnapshot;
  createdAt?: string;
}): void {
  try {
    if (
      !input.entityType?.trim() ||
      !input.entityId?.trim() ||
      !input.action?.trim() ||
      !input.summaryEn?.trim() ||
      !input.summaryAr?.trim()
    ) {
      return;
    }
    recordClientActivity(input);
  } catch {
    /* activity log must not break CRUD */
  }
}
