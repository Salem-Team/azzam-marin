# Design Tokens

**Bundled implementation:** `src/app/globals.css` (`:root` `--am-*`)  
**TS refs:** `src/lib/design-tokens.ts`  
**Chart hex helpers:** `src/config/chart-palette.ts`  
**Brand context:** [BRAND_IDENTITY.md](./BRAND_IDENTITY.md)

Tokens are inlined in `globals.css` so Next/Turbopack always ships them.

## Rules

- Components **MUST** use semantic `--am-*` tokens (or documented aliases).  
- Feature pages **MUST NOT** invent brand hex values.  
- Chart colors **MUST** use `--am-chart-*` / `AM_CHART_PALETTE`.  
- Exceptions **MUST** be documented in the change notes.

## Brand primitives (logo-aligned)

| Token | Value | Role |
|-------|-------|------|
| `--am-navy-950` | `#07182F` | Marine navy / sidebar base |
| `--am-navy-900` | `#0B2345` | Deep navy |
| `--am-navy-800` | `#12345A` | Structural navy |
| `--am-blue-700` | `#075DE8` | Primary blue |
| `--am-blue-600` | `#1674F5` | Interaction blue |
| `--am-blue-500` | `#2584FF` | Bright accent / nav indicator |
| `--am-blue-100` | `#EAF2FF` | Light blue surface tint |
| `--am-red-600` | `#D62F3B` | Brand red |
| `--am-red-700` | `#B92332` | Dark red |
| `--am-surface-page` | `#F4F7FC` | Cool workspace background |
| `--am-surface-raised` | `#FFFFFF` | Cards / surfaces |
| `--am-text-primary` | `#15243B` | Primary text |
| `--am-text-secondary` | `#64748B` | Secondary text |
| `--am-border-default` | `#E2E8F0` | Borders |

## Semantic surfaces

`--am-surface-page` · `--am-surface-raised` · `--am-surface-sidebar*` · `--am-surface-header` · `--am-surface-nav-active` · `--am-surface-nav-hover`

## Actions & status

`--am-action-primary` · `--am-action-accent` · `--am-brand-accent` ·  
`--am-state-success` · `--am-state-warning` · `--am-state-danger` · `--am-state-info`

## Charts

`--am-chart-primary` · `--am-chart-secondary` · `--am-chart-positive` · `--am-chart-negative` ·  
`--am-chart-warning` · `--am-chart-muted` · `--am-chart-benchmark` · `--am-chart-grid` · `--am-chart-axis` · `--am-chart-fill`

Full rules: [CHARTS_AND_DATA_VISUALIZATION.md](./CHARTS_AND_DATA_VISUALIZATION.md)

## Spacing · radius · elevation · motion · type

See `globals.css` and [SPACING_AND_LAYOUT.md](./SPACING_AND_LAYOUT.md), [TYPOGRAPHY.md](./TYPOGRAPHY.md), [MOTION_AND_TRANSITIONS.md](./MOTION_AND_TRANSITIONS.md).

## Layout

Sidebar 260/72 · Topbar 64 · Content max 1400.

## Legacy aliases

`--color-*` maps to `--am-*` for older class names. **SHOULD** use `--am-*` in new code.

## Forbidden

- Metallic/chrome gradients as global UI decoration.  
- Neon glow copied from the logo.  
- Red as default decorative accent on every card.  
- Dark theme as the default workspace.
