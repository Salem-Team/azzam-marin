# Responsive Components (Mandatory)

Shared patterns for tables, forms, charts, and overlays. Prefer improving shared components over page-local hacks.

## Touch targets

- Preferred minimum: **44×44 CSS px** (`--am-touch-min`)  
- Primary actions may be larger  
- Icon-only controls **MUST** have accessible names  
- **MUST NOT** rely on hover-only actions for critical workflows  

## Cards & KPIs

- Consistent padding via `--am-card-pad-*`  
- Mobile: reduce decorative chrome (sparklines may hide below `sm` if unreadable)  
- Keep numeric hierarchy readable  
- **Space distribution:** use `.am-kpi-grid` for five (or similar) metric cards; do not leave a single card stranded at half width on 2-col layouts — orphan spans full width, or use a balanced multi-track grid (see [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) § Space distribution).  
- Cards in the same row: `align-items: stretch` / `h-full` on the card shell; do **not** invent large fixed `min-height` to fake equal height.  
- Ops / panel trios: use `.am-ops-grid` (tablet: last item spans).  
- Bottom dashboard row with 3 panels on `md:grid-cols-2`: give the third panel `md:col-span-2` (or equivalent) until `xl` restores the 12-col reference.  

## Data tables

Never treat `overflow-x-auto` alone as “done.”

| Strategy | When |
|----------|------|
| A. Full table | Wide desktop |
| B. Compact columns | Tablet |
| C. Structured record cards | Phone (preferred for operational lists) |
| D. Intentional horizontal scroll | Many-column comparison is the task |

**MUST** preserve essential fields (IDs, status, amounts, actions).  
If secondary fields collapse, expose a clear reveal (expand row / details).  
Use `.am-table-scroll` for intentional scroll containers that do not overflow the page.

## Forms

| Viewport | Layout |
|----------|--------|
| Desktop | Multi-column when efficient |
| Tablet | Fewer columns |
| Mobile | Single column, full-width controls |

Touch-friendly inputs, inline errors, logical sections. Sticky Save/Cancel when forms are long.

## Charts

- Always in a responsive container (`ChartFrame` / `ResponsiveContainer`)  
- Adjust height via `--am-chart-h-mobile` / `--am-chart-h-desktop` (line/area); donuts use measured box + container queries  
- Reduce tick density on narrow screens  
- Keep tooltips inside the viewport  
- Preserve analytical meaning — do not miniaturize unreadably  
- **Donut/pie:** reuse `DonutChartPanel` + `ChartLegend`; stack vs side-by-side via `@container donut` — see [CHARTS_AND_DATA_VISUALIZATION.md](./CHARTS_AND_DATA_VISUALIZATION.md)  
- **Legend labels:** wrap complete AR/EN names; do not crush labels with `truncate` next to percentages  
- Flex/grid chart parents: `min-w-0` / `min-h-0` as needed  

## Date range picker (Mandatory — dashboard + dense list modules)

Shared period control: `DateRangeFilter` + `CalendarMonth` + `src/lib/date-range.ts`.

**Scope (MUST):** include this control on **dashboard / KPI** screens and **dense list / directory** screens in suppliers, inventory, purchasing, and sales (e.g. `/suppliers`, `/purchase-orders`, products/stock lists, sales invoice lists when built). **MUST NOT** put it on record/detail pages (e.g. `/purchase-orders/PO-…`, `/suppliers/[id]`, single payment/purchase records), settings, pure forms, or auth. Place it in the list header / toolbar (welcome banner on dashboard). Do **not** invent a second period picker or copy the navy welcome banner solely to host the filter on list pages.

| Surface | Behavior |
|---------|----------|
| Trigger | Compact chip: calendar icon + formatted range + chevron |
| Desktop (≥1024) | Centered dialog: quick presets column + dual month calendars + From/To + Apply / Cancel / Clear |
| Tablet (768–1023) | Centered dialog with horizontal tabs (Quick / Calendar / Quarters / Year) |
| Mobile (<768) | Bottom sheet + safe-area; same tabs; single calendar |

Rules:

- Pending draft vs committed range — Apply commits; Cancel discards; Clear → this month.  
- Presets and calendar update draft only until Apply.  
- End date cannot precede start (auto-normalized).  
- Locale-aware formatting (`ar-EG` / `en-GB`) and week start (Sat AR / Sun EN).  
- RTL/LTR via shell `dir` + logical CSS; do not fork components per language.  
- Motion: sheet/dialog enter via existing duration tokens; respect `prefers-reduced-motion`.  
- Wire `value` / `onChange` (or equivalent page state) so KPIs, tables, and charts on time-scoped pages respect the committed range.  
- New dashboard or dense list pages in those domains: ship with `DateRangeFilter` in the header/actions cluster; verify mobile sheet, tablet tabs, desktop dual calendar, and EN/AR. Detail/record pages must omit it.

## Modals & drawers

| Viewport | Pattern |
|----------|---------|
| Desktop | Centered dialog, constrained width |
| Mobile | Full-screen or bottom sheet when content is long |

Visible close, backdrop, scrollable body, no clipped actions, focus trap, Escape.  
Reuse existing dropdown/drawer primitives under `src/components/ui/` and `src/components/layout/`.

## Module placeholders

Module workspaces **MUST** use the same gutters, card radii, and mobile bottom padding as the dashboard so every route feels part of one app.
