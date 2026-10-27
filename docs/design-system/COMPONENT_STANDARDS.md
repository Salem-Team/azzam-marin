# Component Standards

## Shared vs feature
- **Shared:** `src/components/ui/`, `src/components/layout/`  
- **Feature-specific:** under future module folders — **MUST NOT** redefine buttons/inputs that belong in shared UI.

## Existing shared components
| Component | Path |
|-----------|------|
| IconButton | `ui/icon-button.tsx` |
| Tooltip | `ui/tooltip.tsx` |
| DropdownPanel | `ui/dropdown-panel.tsx` |
| CalendarMonth | `ui/calendar-month.tsx` |
| ModalDialog | `ui/modal-dialog.tsx` |
| ToastProvider / useToast | `ui/toast.tsx` |
| PaginationBar | `ui/pagination-bar.tsx` |
| DateRangeFilter | `dashboard/date-range-filter.tsx` (dashboard + dense list modules only) |
| Sidebar* | `layout/sidebar/` |
| Topbar* | `layout/topbar/` |

## Directory modules (Suppliers pattern)
- **Feature folder:** `src/components/suppliers/` — directory, table, preview drawer, form dialog, details tabs.
- **Mock catalog:** `src/config/mock-suppliers.ts` + in-memory store `src/lib/suppliers-store.ts` (frontend-only; replaceable by API later).
- **i18n:** module dictionary `src/i18n/suppliers.ts` via `ts()` / `tsCount()` — do not hardcode AR/EN in components.
- **MUST** keep search/filter/pagination functional against the frontend catalog.
- **MUST** identify rows by stable supplier `id` (`supplierDetailsHref` / preview drawer).
- **Directory interaction:** row click opens the preview drawer; “View full profile” / actions navigate to `/suppliers/[id]`. Checkboxes and menus must not trigger row open.
- **MUST** use mobile cards + desktop table (not a squeezed desktop table).
- **MUST** show reporting currency explicitly; never sum mixed currencies silently.
- **MUST NOT** put analytics charts on the directory — keep Supplier Analytics separate.
- Country markers: reuse SVG `CountryFlag` (or country name). Do not fabricate brand logos or facility photos.
- Import: honest “not available yet” state unless a real client-side import path exists. Export may generate CSV from filtered rows.

## Date range filter (dashboard + dense list modules)
- **MUST** include `DateRangeFilter` on dashboard/KPI and dense list screens in suppliers / inventory / purchasing / sales.  
- **MUST** place it in that list page’s header / toolbar.  
- **MUST NOT** put it on record/detail pages, settings, or pure forms; **MUST NOT** invent a second period picker — see [RESPONSIVE_COMPONENTS.md](./RESPONSIVE_COMPONENTS.md) § Date range picker.

## Import & Export (dashboard + dense list modules)
- **MUST** include Import + Export header/toolbar actions on the same dense list screens as the date-range rule (suppliers / inventory / items / spare-parts / purchasing / sales directories).  
- **MUST** export from the current filtered rows (or documented dataset) via shared CSV helpers when available.  
- **MUST** keep Import honest: real client path, or visible control + unavailable dialog — never fake success.  
- **MUST NOT** put Import/Export chrome on record/detail pages — see [`.cursor/rules/import-export.mdc`](../../.cursor/rules/import-export.mdc).

## Cards & dashboard panels
- **MUST** follow [DESIGN_CONSISTENCY.md](./DESIGN_CONSISTENCY.md) for structure, same-row heights, and spacing.
- Prefer `DashboardCard` + `ViewAllLink` for operational panels.
- Same-row comparable panels **MUST** stretch equally; **MUST NOT** clip content only to equalize height.

## Universal rules
- **MUST** support hover, focus-visible, disabled where interactive.
- **MUST** expose accessible names for icon-only controls.
- **MUST** work in RTL (logical positioning).
- **MUST** use tokenized colors/radii/durations from `globals.css`.
- **MUST** follow [BRAND_IDENTITY.md](./BRAND_IDENTITY.md) — light workspace, navy structure, blue interaction, selective red.
- **MUST NOT** duplicate a second visual language for the same control.
- **MUST NOT** use metallic gradients, neon glow, or logo bloom effects on controls.

## Buttons / icon buttons
- Height tokens: 32 / 36 / 40  
- Radius: `--am-radius-md`  
- Primary uses blue; destructive uses danger — not brand red by default for all CTAs.

## Inputs / search
- Clear label or aria-label  
- Focus ring via `--am-focus-ring`  
- Search shortcut Ctrl/Cmd+K for navigation search only (not fake DB search)

## Navigation items
- Height 40px · icon 18px · stroke ~1.75  
- Active: soft blue fill + start indicator — not neon blocks

## Dropdowns / dialogs / drawers
- Escape closes · backdrop dismiss · focus trap for modal dialogs  
- Motion: enter/exit durations from motion tokens

## Empty / loading / error
- Empty states: one short line + next action — **MUST NOT** stack multiple explanatory paragraphs  
- Skeletons: subtle pulse; respect reduced motion  
- Errors: clear, actionable; do not invent success for mock ops  
- Page titles: **MUST NOT** include automatic subtitles (see [CONTENT_DISCIPLINE.md](./CONTENT_DISCIPLINE.md))

## Introduced shared patterns
- **ModalDialog / Toast / PaginationBar** — reuse for future directory modules (customers, products). Keep EN/AR + RTL QA when extending.
