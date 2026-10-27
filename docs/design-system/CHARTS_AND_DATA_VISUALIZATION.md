# Charts and Data Visualization

**Status:** Mandatory for all analytics, reports, and dashboard charts  
**Tokens:** `--am-chart-*` in `src/app/globals.css`  
**JS helpers:** `src/config/chart-palette.ts`

## Principles

1. Analytical accuracy over decoration.  
2. One coherent palette across the product.  
3. Color encodes meaning — not page personality.  
4. Readable axes, grids, and tooltips in EN and AR.

## Semantic series (MUST)

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Primary series | `--am-chart-primary` | `#075DE8` | Main metric / volume |
| Secondary series | `--am-chart-secondary` | `#12345A` | Comparison series |
| Positive | `--am-chart-positive` | `#16865A` | Gains, favorable variance |
| Negative | `--am-chart-negative` | `#C62832` | Losses, unfavorable |
| Warning | `--am-chart-warning` | `#B7791F` | Caution thresholds |
| Muted / historical | `--am-chart-muted` | `#8492A6` | Prior period, secondary history |
| Benchmark / target | `--am-chart-benchmark` | `#94A3B8` | Goals (prefer dashed stroke) |
| Grid | `--am-chart-grid` | `#E2E8F0` | Subtle grid lines |
| Axis labels | `--am-chart-axis` | `#64748B` | Axis text |
| Area fill | `--am-chart-fill` | blue @ 12% | Soft area under primary line |

## MUST NOT

- Assign random colors per page or widget.  
- Use red because the logo contains red.  
- Apply gradients on every bar/line/area.  
- Use 3D, neon glow, or metallic chart chrome.  
- Animate every datapoint on ordinary re-render.

## Chart chrome

- Grid: hairline, low contrast (`--am-chart-grid`).  
- Tooltips: white surface, border, compact type — follow component standards.  
- Legends: concise labels; no paragraph descriptions.  
- Motion: purposeful enter/hover only; respect reduced motion.

## Accessibility

- Do not rely on color alone — use pattern, label, or icon where series overlap.  
- Maintain contrast for labels on light backgrounds.  
- RTL: preserve numeric axis readability; mirror layout with logical CSS where applicable.

## Implementation

```ts
import { AM_CHART_PALETTE } from "@/config/chart-palette";
// Use AM_CHART_PALETTE.primary, .secondary, etc. with chart libraries.
```

When adding a chart library later, map series to these tokens — do not invent a local palette.

## Responsive charts (Mandatory)

Charts **MUST** derive width from their parent. Height is intentional per visualization — not `100vh` and not one global fixed height for every chart.

| Rule | Requirement |
|------|-------------|
| Container | Wrap Recharts in `ChartFrame` + `ResponsiveContainer` |
| Flex/Grid | Parent children use `min-w-0` (and `min-h-0` when nested scroll/flex) |
| Overflow | Chart must not expand the page; tooltips stay in-viewport |
| Labels | Axes/ticks reduce density on narrow widths; do not clip meaning |
| Resize | Chart must reflow when the parent column width changes |

**MUST NOT** hardcode desktop-only chart widths.  
**MUST NOT** use `overflow: hidden` on the card solely to hide broken chart overflow.

## Donut / pie + legend (Mandatory)

Treat the donut and legend as **one layout**. Reuse:

- `DonutChartPanel` — container-driven chart + center label  
- `ChartLegend` — color · wrapping label · value  
- CSS: `.am-donut-panel`, `.am-donut-layout`, `.am-chart-legend-*` in `globals.css`

### Layout

- Use **CSS container queries** on `.am-donut-panel` (not viewport alone).  
- Narrow container: **stack** chart above legend.  
- Wide enough container (~300px+): **side-by-side** with balanced tracks (`minmax(0, …)`).  
- Donut diameter is measured from the chart box; radii scale with that box — no oversized fixed desktop radii on mobile.

### Legend text (AR + EN)

- Prefer complete labels; **do not** default to ellipsis (`truncate`) for category names.  
- Legend row: `auto minmax(0, 1fr) auto` — value must not crush the label.  
- Allow wrapping (`overflow-wrap`) for long Arabic names.  
- Ellipsis only when there is an accessible full-text reveal (e.g. `title` + intentional truncation).

### Center label

- Fit inside the hole (`clamp` / `cqmin`).  
- Compact currency formatting when needed (`formatEgpCompact`).  
- No overflow into segments; keep RTL/LTR readable.

### Space

- No large empty regions from inappropriate `min-height`.  
- No tiny legend beside an oversized donut.  
- Intentional whitespace OK; accidental blank space from fixed sizes is not.

## Chart QA

At `320 · 360 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1536`, EN LTR + AR RTL:

1. Labels readable (no silent `م…` / `ق…` fragments).  
2. Percentages/values visible.  
3. Donut does not dominate; legend has enough width.  
4. Center label fits.  
5. No clipping or page-level horizontal overflow.  
6. Desktop reference composition preserved when the container is wide.
