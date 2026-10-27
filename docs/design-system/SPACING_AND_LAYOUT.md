# Spacing and Layout

## Scale (MUST)
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64  
Tokens: `--am-space-1` … `--am-space-16`

## Page chrome
| Region | Rule |
|--------|------|
| Main padding | `--am-page-gutter-mobile/tablet/desktop` + bottom nav safe pad `<lg` |
| Section gap | 12–16px |
| Card padding | `--am-card-pad-mobile` / desktop |
| Nav item | height 40px; gap icon↔label 12px |
| Topbar | desktop 50px · mobile 52px + safe-area |
| Bottom nav | 64px + safe-area (`<lg` only) |

See also [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) (including **Space distribution**) and [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md).

Reuse `.am-kpi-grid` / `.am-ops-grid` for metric and ops panel collections — do not leave orphaned half-width cards.

## Layout patterns
1. **List page:** Page title → filters → table → pagination  
2. **Detail page:** Title/actions → summary → sections  
3. **Form page:** Grouped fields → sticky/primary actions  
4. **Dashboard:** KPI row → primary chart/list → secondary widgets  
5. **Settings:** Grouped preference sections  
6. **Report:** Filters → results table/chart  

## Content width
`--am-content-max` (see tokens) centered in shell main.

## Adaptive full-height layout (MUST)

On large screens, pages **MUST** use available vertical space intelligently.
The main content surface **MUST NOT** stop early and leave a large accidental blank region under the primary panel.

### Shell height chain
| Layer | Rule |
|-------|------|
| Application shell | `min-height: 100dvh` |
| Main column (topbar + content) | `display: flex; flex-direction: column; min-height: 100dvh; min-width: 0` |
| `<main>` | `flex: 1; min-height: 0; display: flex; flex-direction: column` |
| Content wrapper | `flex: 1; min-height: 0; display: flex; flex-direction: column` |

Implementation: `src/components/layout/app-shell.tsx` + `.am-page` / `.am-page-surface` in `globals.css`.  
Reuse `PageFrame` / `PageSurface` from `src/components/layout/page-frame.tsx`.

### Page surface
- Primary module panels **SHOULD** use `.am-page-surface` / `PageSurface` so they grow into remaining height when the parent height chain is defined.
- **MUST NOT** assign arbitrary fixed heights (e.g. `800px`) to force fill.
- **MUST NOT** use `100vh` on every nested card.
- **MUST NOT** stretch individual table rows to fill the viewport.
- **MUST NOT** use absolute positioning or huge margins to fake fill.
- Intentional whitespace inside dense tables is acceptable; accidental empty viewport below a short card is not.

### Tables and empty space
When a table has few rows on a large screen:
- Let the **page surface** fill available height.
- Keep **row height** natural and consistent.
- Prefer a flexible table body / scroll region (`.am-table-scroll` + `min-h-0 flex-1`) when content overflows.
- Preserve header and column alignment.

### Responsive exceptions
| Viewport | Behavior |
|----------|----------|
| Desktop / large tablet | Fill available height via the shell → page → surface chain |
| Mobile | **MUST NOT** force every page into a fixed viewport height; allow natural document scrolling; respect safe areas and bottom nav (`.am-page-pad-bottom-nav`) |

### Scroll / overflow
- Prefer a single primary vertical scroll unless a nested scroll region is deliberate (e.g. table body).
- Use `min-height: 0` on flex/grid children that must shrink or scroll.
- **MUST NOT** use `overflow: hidden` to hide broken layouts.
- Prevent horizontal page overflow and clipping under header / behind sidebar / behind mobile bottom nav.

Validate at 320 · 390 · 768 · 1024 · 1280 · 1440 · 1536 and EN/AR (RTL/LTR).

## Cards
**SHOULD NOT** wrap every element in a card. Cards for interactive or grouped content only.
