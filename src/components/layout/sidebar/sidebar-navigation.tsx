"use client";

import { NavigationGroup } from "@/components/layout/sidebar/navigation-group";
import {
  canViewNavItem,
  MOCK_USER_PERMISSIONS,
} from "@/config/permissions";
import { NAVIGATION_GROUPS } from "@/config/navigation";
import type { NavGroup } from "@/types/navigation";

interface SidebarNavigationProps {
  forceExpanded?: boolean;
}

function filterGroups(groups: readonly NavGroup[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canViewNavItem(item.permissionKey, MOCK_USER_PERMISSIONS),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function SidebarNavigation({
  forceExpanded = false,
}: SidebarNavigationProps) {
  const groups = filterGroups(NAVIGATION_GROUPS);

  return (
    <nav
      className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.18)_transparent]"
      aria-label="Primary"
    >
      <div className="flex flex-col gap-2.5 pb-2">
        {groups.map((group) => (
          <NavigationGroup
            key={group.id}
            group={group}
            forceExpanded={forceExpanded}
          />
        ))}
      </div>
    </nav>
  );
}
