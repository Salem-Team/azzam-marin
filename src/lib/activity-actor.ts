/**
 * Session actor snapshot for frontend activity / audit rows.
 * Until real auth exists, this mirrors the shell demo user (`MOCK_USER`).
 * Every activity record must stamp this actor + an ISO timestamp.
 */

import { MOCK_USER } from "@/config/mock-shell";
import type { Locale } from "@/types/i18n";

/** Stable demo session id — replace with auth subject when backend exists. */
export const DEMO_SESSION_USER_ID = "user-ahmed-azzam";

export interface ActivityActorSnapshot {
  userId: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  email: string;
}

/** Current signed-in (demo) user for activity stamps. */
export function currentActivityActor(): ActivityActorSnapshot {
  return {
    userId: DEMO_SESSION_USER_ID,
    nameEn: MOCK_USER.name,
    nameAr: MOCK_USER.nameAr,
    roleEn: MOCK_USER.role,
    roleAr: MOCK_USER.roleAr,
    email: MOCK_USER.email,
  };
}

export function activityActorDisplayName(
  locale: Locale,
  actor: Pick<ActivityActorSnapshot, "nameEn" | "nameAr"> | null | undefined,
): string {
  if (!actor) {
    return locale === "ar" ? MOCK_USER.nameAr : MOCK_USER.name;
  }
  return locale === "ar" ? actor.nameAr || actor.nameEn : actor.nameEn || actor.nameAr;
}

export function activityActorDisplayRole(
  locale: Locale,
  actor: Pick<ActivityActorSnapshot, "roleEn" | "roleAr"> | null | undefined,
): string {
  if (!actor) {
    return locale === "ar" ? MOCK_USER.roleAr : MOCK_USER.role;
  }
  return locale === "ar" ? actor.roleAr || actor.roleEn : actor.roleEn || actor.roleAr;
}

/** Precise ISO-8601 UTC stamp with milliseconds. */
export function activityTimestampIso(date: Date = new Date()): string {
  return date.toISOString();
}
