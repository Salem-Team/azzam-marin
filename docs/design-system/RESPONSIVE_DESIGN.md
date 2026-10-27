# Responsive Design (Mandatory)

**Status:** Global product standard  
**Applies to:** Every existing and future page, shell surface, form, table, chart, and dialog.

## Philosophy

AZZAM MARINE ERP is **one product** with four optimized form factors:

| Experience | Intent |
|------------|--------|
| Large desktop (≥1440) | High-density enterprise workspace |
| Desktop / laptop (1024–1439) | Full shell, productive grids |
| Tablet (768–1023) | Touch-friendly, collapsible chrome |
| Mobile (<768) | Purpose-built **mobile application shell** |

**MUST NOT** treat mobile as a shrunk desktop.  
**MUST NOT** declare a page “responsive” solely because it avoids horizontal overflow.

## Breakpoints

Align with Tailwind defaults used in the codebase:

| Token | Width | Primary behavior |
|-------|-------|------------------|
| `xs` / base | <375 | Single-column; compact chrome |
| `sm` | ≥640 | Slightly wider cards / KPIs |
| `md` | ≥768 | Tablet: expanded search; 2-col modules |
| `lg` | ≥1024 | Persistent sidebar; desktop grids |
| `xl` | ≥1280 | Wider content |
| `2xl` | ≥1536 | Reference desktop density |

Design references (not rigid device classes): 320 · 360 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1536.

**MUST** test 320px for collisions.  
**MUST** prefer content-driven wrapping over one-off media queries.  
**MUST** centralize dimensions in `--am-*` tokens (`src/app/globals.css`).

## Shell rules

| Surface | `<lg` | `lg+` |
|---------|-------|-------|
| Sidebar | Off-canvas drawer only | Persistent 244 / 72 |
| Top bar | Mobile app bar | Desktop header ~50px |
| Bottom nav | Fixed primary destinations | Hidden |
| Main padding | Compact + bottom safe inset for nav | Standard gutters |

Tokens:

- `--am-sidebar-expanded` / `--am-sidebar-collapsed`
- `--am-topbar-height` / `--am-mobile-topbar-height`
- `--am-bottom-nav-height`
- `--am-page-gutter-*`
- `--am-touch-min` (≥44px preferred)

## Layout adaptation

- Use CSS Grid / Flexbox / `minmax` / `clamp` / logical properties.
- Prefer Tailwind responsive utilities (`sm:`, `md:`, `lg:`) over JS width detection.
- Use JS viewport state **only** when behavior must change (drawer open, bottom-nav “More”).
- Avoid duplicate desktop + mobile React trees when one responsive tree suffices.

## Space distribution (Mandatory)

A layout is **not** complete merely because elements fit. It must also look balanced, intentional, and professional.

### Core principle

Every page **MUST** distribute available width and height according to content, viewport, and neighboring components.

**MUST NOT** leave large unintended blank areas, orphaned half-width cards, uneven card rows, or broken grids when content can be redistributed without harming readability or hierarchy.

Intentional whitespace for clarity is acceptable. Accidental whitespace from poor grid/flex rules is not.

### When to use `flex: 1` / `flex-1`

| Use | Do not use |
|-----|------------|
| Main content regions that should fill remaining shell space | Compact controls, icons, buttons |
| Text labels that share a row with a fixed icon (with `min-w-0`) | Every child in a group by default |
| Scrollable column bodies inside a flex column shell | Numeric table columns that must stay content-sized |
| Card body that should stretch under a fixed header | Forcing equal heights that create huge empty interiors |

Always pair growing flex children that may contain long text/tables/charts with `min-w-0` (and `min-h-0` when they scroll).

### When to use CSS Grid

Prefer Grid when:

- Items form a **metric or panel collection** with a known column count per breakpoint.
- Alignment of rows/columns matters more than content-driven wrapping alone.
- You need **column spanning** for orphans or featured panels (`grid-column: 1 / -1` or span utilities).

Prefer Flex when:

- A single row/column of mixed fixed + fluid parts (icon + label + action).
- Vertical stacking with one region that grows (`flex-col` + `flex-1`).

### `auto-fit` / `auto-fill` + `minmax`

| Pattern | When |
|---------|------|
| `repeat(auto-fit, minmax(min, 1fr))` | Card count varies; cards should grow to fill the row |
| `repeat(auto-fill, minmax(min, 1fr))` | Prefer keeping track size; empty tracks OK if intentional |
| `repeat(N, minmax(0, 1fr))` | Fixed column count; prevent overflow (`minmax(0, …)`) |

Use `minmax(0, 1fr)` (not bare `1fr`) when children can force overflow (tables, charts, long numbers).

### Incomplete final rows (orphans)

When a grid has fewer items than columns in the last row:

1. Prefer **full-width span** for a single orphan when equal-width cards are the goal (`.am-grid-fill-last-2` / KPI & ops utilities).
2. Or change column count so the last row is complete (e.g. KPI at `lg`: 6-track layout → 2+2+2 then 3+3).
3. Or regroup panels if the orphan belongs to another logical group.
4. **Preserve** approved content order — do not shuffle business data unpredictably.
5. Do **not** use absolute positioning, negative margins, or stretching unrelated cards to hide gaps.

### Shared utilities (`globals.css`)

| Class | Role |
|-------|------|
| `.am-kpi-grid` | Five dashboard KPI cards: 1 → 2 (orphan spans) → 6-track balanced → 5 equal |
| `.am-ops-grid` | Three ops panels: 1 → 2 (last spans) → 3 |
| `.am-grid-fill` | Generic stretch grid + `min-width: 0` children |
| `.am-grid-fill-last-2` | Odd last child spans full width on 2-col grids |

Reuse these instead of inventing one-off column hacks.

### Vertical space

- Prefer `min-height` over unnecessary fixed `height`.
- Use `height: auto` for content-driven blocks; controlled heights only for charts when readability requires it.
- Shell: `min-height: 100dvh` where appropriate; do **not** force every card to fill the viewport.
- Scrollable flex children: `min-height: 0` + intentional overflow.

### Containers

- Consistent page gutters (`--am-page-gutter-*` / `.am-page-pad-*`).
- `width: 100%` + `min-w-0` on fluid regions; `max-width` when constraining.
- `box-sizing: border-box` (global).
- `overflow-x: auto` only when horizontal scroll is intentional (`.am-table-scroll`).
- **MUST NOT** use `overflow: hidden` to conceal broken layouts.

### Space-distribution QA

At `320 · 360 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1536` (EN + AR):

- No unintended empty grid cells or orphaned half-width cards where spanning is better  
- No large accidental blank regions or uneven gaps  
- No overflow, clipping, overlap, or page-level horizontal scroll  
- Charts/tables remain readable; card padding/radii/typography stay consistent  

See [RESPONSIVE_QA.md](./RESPONSIVE_QA.md).

## RTL / LTR

**MUST** work identically in English LTR and Arabic RTL.  
Use logical properties (`ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`).  
See [RTL_AND_LOCALIZATION.md](./RTL_AND_LOCALIZATION.md) and [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md).

## Related docs

- [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md) — mobile app shell & navigation  
- [RESPONSIVE_COMPONENTS.md](./RESPONSIVE_COMPONENTS.md) — tables, forms, charts, dialogs  
- [RESPONSIVE_QA.md](./RESPONSIVE_QA.md) — test matrix & acceptance  
