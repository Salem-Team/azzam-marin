# Design Consistency & Visual Harmony (Mandatory)

**Status:** Permanent engineering standard  
**Scope:** Entire frontend — existing pages, in-progress work, and all future UI  
**Authority:** Extends (does not replace) [README.md](./README.md), tokens, responsive, and chart docs

Equivalent components **MUST** share sizing, spacing, typography, alignment, chart proportions, and responsive behavior. Arbitrary one-off differences are defects.

## Tokens are the single source of truth

- **MUST** use `--am-*` from `src/app/globals.css` / [DESIGN_TOKENS.md](./DESIGN_TOKENS.md).
- **MUST NOT** invent a second token system or per-page spacing scales.
- Same-purpose controls **MUST** share the same tokens; variants need a documented functional reason.

## Shared card structure

Use `DashboardCard` (or the same structure) for operational panels:

1. Container · 2. Header · 3. Title · 4. Header icon · 5. Optional action · 6. Body · 7. Optional footer

Equivalent cards **MUST** share header padding/height, icon container, title size, content padding, and action alignment.

### Equal heights (same row)

- Grid/flex rows that intentionally group comparable cards **MUST** use `align-items: stretch` and `min-w-0`.
- Cards in that row **MUST** fill the row height (`h-full` / flex column) without clipping content only to force equality.
- **MUST NOT** assign one universal fixed height to every card type.
- Chart cards in the same row **SHOULD** share a comparable chart-area height.
- Empty space below short content inside a stretched card is preferred over unequal bottoms or inner scrollbars when all rows already fit.
- Incomplete last rows: use deliberate orphan span (`.am-kpi-grid` / `.am-ops-grid` / `.am-dash-bottom-grid` rules) — **MUST NOT** leave awkward half-width orphans.

### Padding override rule

`DashboardCard` body defaults to `p-3.5`. Callers that need flush content **MUST** pass `bodyClassName` containing a `p-*` utility (e.g. `p-0`) so the default is omitted — the project `cn()` helper does not merge conflicting Tailwind classes.

## Dashboard grids

| Grid | Role |
|------|------|
| `.am-kpi-grid` | KPI metric row |
| `.am-ops-grid` | Inventory / PO / shipment ops trio |
| `.am-dash-bottom-grid` | Low stock · activities · FX |

- Columns depend on viewport; use `minmax(0, 1fr)` / spans from existing CSS.
- On `<xl`, FX (last child) spans full width.
- On `xl+`, bottom row uses 5 / 4 / 3 spans with **equal stretched heights**.

## Charts

Follow [CHARTS_AND_DATA_VISUALIZATION.md](./CHARTS_AND_DATA_VISUALIZATION.md):

- Container-driven sizing; donut + legend as one layout (`DonutChartPanel` / `ChartLegend`).
- Comparable donuts: consistent ring, center label, legend pairing.
- **MUST NOT** leave huge blank chart regions or crush the chart for legend width.
- Approved `--am-chart-*` palette only.

## Typography, tables, shell, RTL

- Type scale: [TYPOGRAPHY.md](./TYPOGRAPHY.md) — equivalent roles share sizes.
- Tables: [DATA_DENSE_INTERFACES.md](./DATA_DENSE_INTERFACES.md) — shared header/row/cell rhythm; mobile cards when needed.
- Shell: [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md) + layout components — no page-specific sidebar forks.
- RTL/LTR: logical properties — [RTL_AND_LOCALIZATION.md](./RTL_AND_LOCALIZATION.md).

## Implementation workflow

1. Search for an existing equivalent component.
2. Reuse or extend shared UI — prefer shared fixes over page hacks.
3. **MUST NOT** introduce arbitrary one-off CSS without justification.
4. **MUST NOT** remove business functionality for cosmetics.
5. After non-trivial UI: `npm run lint`, `npm run typecheck`, `npm run build`, and visual check EN/AR at key viewports ([RESPONSIVE_QA.md](./RESPONSIVE_QA.md)).

## Retrospective audit (ongoing)

When changing shared cards/grids/charts, re-check at least:

Dashboard (KPI, sales trend, categories, ops trio, low stock, activities, FX) · suppliers directory/details/forms · shared dialogs · modules using `DashboardCard` / tables / donuts.

Record verification evidence in the change notes or [TESTING_AND_VISUAL_QA.md](./TESTING_AND_VISUAL_QA.md) — a green build alone is not visual verification.
