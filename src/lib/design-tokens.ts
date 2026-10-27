/**
 * Typed references to official AZZAM MARINE design tokens.
 * Prefer CSS variables in styles; use these names in JS only when needed.
 * Charts: prefer `@/config/chart-palette` for hex series colors.
 */

export const AM_COLOR = {
  navy950: "var(--am-navy-950)",
  navy900: "var(--am-navy-900)",
  navy800: "var(--am-navy-800)",
  blue700: "var(--am-blue-700)",
  blue600: "var(--am-blue-600)",
  blue500: "var(--am-blue-500)",
  blue100: "var(--am-blue-100)",
  red600: "var(--am-red-600)",
  red700: "var(--am-red-700)",
  surfacePage: "var(--am-surface-page)",
  surfaceRaised: "var(--am-surface-raised)",
  surfaceSidebar: "var(--am-surface-sidebar)",
  textPrimary: "var(--am-text-primary)",
  textSecondary: "var(--am-text-secondary)",
  borderDefault: "var(--am-border-default)",
  actionPrimary: "var(--am-action-primary)",
  actionAccent: "var(--am-action-accent)",
  brandAccent: "var(--am-brand-accent)",
  stateSuccess: "var(--am-state-success)",
  stateWarning: "var(--am-state-warning)",
  stateDanger: "var(--am-state-danger)",
  chartPrimary: "var(--am-chart-primary)",
  chartSecondary: "var(--am-chart-secondary)",
  chartPositive: "var(--am-chart-positive)",
  chartNegative: "var(--am-chart-negative)",
} as const;

export const AM_SPACE = {
  1: "var(--am-space-1)",
  2: "var(--am-space-2)",
  3: "var(--am-space-3)",
  4: "var(--am-space-4)",
  5: "var(--am-space-5)",
  6: "var(--am-space-6)",
  8: "var(--am-space-8)",
  10: "var(--am-space-10)",
  12: "var(--am-space-12)",
  16: "var(--am-space-16)",
} as const;

export const AM_DURATION = {
  instant: "var(--am-duration-instant)",
  fast: "var(--am-duration-fast)",
  normal: "var(--am-duration-normal)",
  drawer: "var(--am-duration-drawer)",
  layout: "var(--am-duration-layout)",
} as const;

export const AM_EASE = {
  standard: "var(--am-ease-standard)",
  enter: "var(--am-ease-enter)",
  exit: "var(--am-ease-exit)",
} as const;

export const AM_LAYOUT = {
  sidebarExpanded: "var(--am-sidebar-expanded)",
  sidebarCollapsed: "var(--am-sidebar-collapsed)",
  topbarHeight: "var(--am-topbar-height)",
  mobileTopbarHeight: "var(--am-mobile-topbar-height)",
  bottomNavHeight: "var(--am-bottom-nav-height)",
  contentMax: "var(--am-content-max)",
  touchMin: "var(--am-touch-min)",
  chartHeightMobile: "var(--am-chart-h-mobile)",
  chartHeightDesktop: "var(--am-chart-h-desktop)",
} as const;

export const AM_ICON = {
  sm: "var(--am-icon-sm)",
  md: "var(--am-icon-md)",
  lg: "var(--am-icon-lg)",
  xl: "var(--am-icon-xl)",
} as const;
