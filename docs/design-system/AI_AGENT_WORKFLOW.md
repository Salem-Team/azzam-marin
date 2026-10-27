# AI Agent / Cursor Workflow (MANDATORY)

Whenever an agent adds or modifies UI, it **MUST**:

1. Read `docs/design-system/README.md`.  
2. Read `docs/design-system/BRAND_IDENTITY.md` (Precision Marine Enterprise).  
3. Read the relevant domain docs (tokens, charts, motion, RTL, a11y, components, content discipline).  
4. Inspect existing reusable components before creating new ones.  
5. Reuse `--am-*` tokens and `.am-*` utilities from `src/app/globals.css`.  
6. Reuse existing interaction patterns (dropdown, drawer, search).  
7. Preserve Arabic + English via `src/i18n/`.  
8. Preserve RTL + LTR with logical CSS.  
9. Follow motion rules; respect reduced motion.  
10. Follow accessibility requirements.  
11. Avoid duplicating navigation or inventing modules outside scope.  
12. Follow [CONTENT_DISCIPLINE.md](./CONTENT_DISCIPLINE.md) — **no unnecessary descriptions**.  
13. Use chart colors from `--am-chart-*` / `AM_CHART_PALETTE` only.  
14. Follow [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) and [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md) — every UI change must remain usable on mobile, tablet, and desktop.  
15. Reuse mobile shell patterns (`MobileBottomNav`, drawer, safe-area padding) — do not invent a second mobile chrome.  
16. Apply **space distribution** rules (flex/grid, orphan spanning, `minmax(0, 1fr)`, `min-w-0`) — see RESPONSIVE_DESIGN § Space distribution; reuse `.am-kpi-grid` / `.am-ops-grid`.  
17. Apply **adaptive full-height** — shell → `PageFrame` / `.am-page` → `PageSurface` / `.am-page-surface`; see SPACING_AND_LAYOUT § Adaptive full-height. Do not leave accidental blank viewport under primary panels on large screens; do not stretch table rows to fill height.  
18. Apply **data row navigation** — when opening a record is the expected action, navigate to details with the record’s stable ID (`src/lib/record-routes.ts`, `RecordCardLink` / `RecordTableRow`); see DATA_DENSE_INTERFACES § Data row navigation.  
19. Apply **chart responsive** rules — see CHARTS_AND_DATA_VISUALIZATION; reuse `DonutChartPanel` / `ChartLegend`; never silently truncate Arabic category labels.  
20. Apply **persistent preferences & zero-flicker** — extend `src/lib/preferences.ts` / preference-store / cookie mirror / boot script; never flash default theme or language before saved prefs apply — see FRONTEND_ENGINEERING_STANDARDS § Persistent Preferences.  
21. Apply **date range filter on dashboard + dense lists only** — reuse `DateRangeFilter` / `CalendarMonth` / `date-range.ts` on dashboard and list modules in suppliers / inventory / purchasing / sales; **never** on record/detail pages; place it in the list header/toolbar; do not invent a second period picker — see RESPONSIVE_COMPONENTS § Date range picker.  
22. Apply **12-hour clock** for all UI times — use `formatTime` / `formatDateTime` / `formatIsoDate` from `src/lib/format.ts`; never 24-hour or ad-hoc `toLocaleString` for timestamps — see DATE_AND_TIME.md.  
23. Run `npm run lint`, `npm run typecheck`, and `npm run build` for non-trivial changes.  
24. Document justified exceptions.

## MUST NOT
- Invent a new design language or per-module palette  
- Introduce arbitrary colors, spacing, type, shadows, or animations  
- Copy logo chrome/glow/metallic effects into UI components  
- Add subtitles/paragraphs under titles “to fill space” or because a template has a description field  
- Redesign a shared component in isolation when a standard exists  
- Add backend/database/API for UI tasks  
- Claim visual QA without inspecting the running UI  
- Ship desktop-only layouts or “shrink the desktop” mobile pages  
- Leave orphaned half-width cards or unintended empty grid cells when spanning/reflow is appropriate  
- Leave large accidental blank regions under primary page surfaces on desktop  
- Navigate every table row to a generic listing or a hardcoded first record  
- Flash default theme/language/direction before applying saved preferences  
- Add a competing theme/locale store or hide the app to mask preference flicker  
- Ship a dashboard or dense list page without `DateRangeFilter`, invent a second period picker, or put the filter on record/detail pages  
- Put the full 42-item navigation into the bottom bar  
- Detect width with JavaScript when CSS media queries suffice  

## When a new pattern is needed
Decide: **shared system** vs **feature-specific**.  
If shared → update docs + tokens/components together in the same change.
