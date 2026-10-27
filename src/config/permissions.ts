/**
 * Frontend-only visibility configuration.
 * Hiding a menu item is NOT authorization — connect to real backend
 * permissions when available. Leave `null` to show all items.
 */
export type PermissionSet = ReadonlySet<string> | null;

/** Mock: show all navigation entries until backend permissions exist. */
export const MOCK_USER_PERMISSIONS: PermissionSet = null;

export function canViewNavItem(
  permissionKey: string | undefined,
  permissions: PermissionSet,
): boolean {
  if (!permissionKey || permissions === null) return true;
  return permissions.has(permissionKey);
}
