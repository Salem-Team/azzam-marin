# Responsive QA (Mandatory)

## Viewport matrix

Validate representative widths when changing shell or shared layout:

`320 · 360 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1536`

Check **both** English LTR and Arabic RTL for shell/navigation changes.

## Checklist

- [ ] No page-level horizontal overflow  
- [ ] Sidebar: drawer `<lg`, persistent `lg+`  
- [ ] Bottom nav visible `<lg`, hidden `lg+`  
- [ ] Header controls do not collide at 320px  
- [ ] Page title readable / truncates  
- [ ] Main content clears fixed bottom nav + safe area  
- [ ] KPI / card grids reflow with balanced space distribution  
- [ ] No orphaned half-width cards when full-span is preferable  
- [ ] No unintended empty grid cells or large accidental blank regions  
- [ ] Charts resize; labels not clipped; donut legends show full AR/EN names  
- [ ] Donut center labels fit the hole; no oversized donut vs legend  
- [ ] Tables usable (cards or intentional scroll); containers use `min-w-0`  
- [ ] Forms usable with soft keyboard  
- [ ] Dialogs/drawers: close, backdrop, scroll, focus  
- [ ] Touch targets adequate  
- [ ] Focus visible; reduced-motion respected  
- [ ] RTL drawer/bottom-nav order and alignment correct  

## Automation / inspection

When Playwright or browser tools are available, capture key widths.  
**MUST NOT** claim a viewport was tested unless it was.  
Report remaining untested routes explicitly.

## Acceptance

A change is acceptably responsive when:

1. It follows [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) and [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md).  
2. Shared components adapt without page-level overflow.  
3. Desktop approved layouts remain intact at ≥1024.  
4. Mobile feels like an intentional app shell.  
5. EN/AR + LTR/RTL still work.  
6. `npm run lint`, `typecheck`, and `build` pass for non-trivial UI work.
