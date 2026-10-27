/**
 * Official chart color meanings for AZZAM MARINE ERP.
 * Keep in sync with --am-chart-* in src/app/globals.css
 * and docs/design-system/CHARTS_AND_DATA_VISUALIZATION.md
 */

export const AM_CHART_PALETTE = {
  primary: "#075DE8",
  secondary: "#12345A",
  positive: "#16865A",
  negative: "#C62832",
  warning: "#B7791F",
  muted: "#8492A6",
  benchmark: "#94A3B8",
  grid: "#E2E8F0",
  axis: "#64748B",
  fill: "rgba(7, 93, 232, 0.12)",
} as const;

export type AmChartRole = keyof typeof AM_CHART_PALETTE;
