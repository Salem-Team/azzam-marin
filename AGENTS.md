<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:azzam-marine-technical-annex -->

## AZZAM MARINE ERP — Technical Annex & Compliance (Mandatory)

The Technical Annex is the authoritative contractual scope for this project. Design-system rules govern UI; they do **not** replace or narrow annex requirements.

1. Before any feature work or module change, read [`docs/TECHNICAL_ANNEX.md`](docs/TECHNICAL_ANNEX.md) for the affected sections.
2. Follow the pre-work compliance workflow in [`docs/PROJECT_COMPLIANCE_RULES.md`](docs/PROJECT_COMPLIANCE_RULES.md) (identify → read annex → inspect code → compare → detect conflicts → implement or escalate → update traceability → verify).
3. Consult and update [`docs/REQUIREMENTS_TRACEABILITY.md`](docs/REQUIREMENTS_TRACEABILITY.md) and the full-system [`docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md) for requirement IDs (`TA-*`), status, related files, verification evidence, gaps, and conflicts. Follow [`docs/FRONTEND_IMPLEMENTATION_ROADMAP.md`](docs/FRONTEND_IMPLEMENTATION_ROADMAP.md) for implementation order.
4. Do **not** treat route shells, placeholders, mock data, visible buttons, or screenshot similarity as completion or `VERIFIED` status.
5. Do **not** silently absorb out-of-scope work; flag Change Requests against the annex.
6. Frontend-only work is allowed, but never claim Backend/Database/APIs/authz/hardware/backup/financial persistence as complete unless they actually exist and are verified.
7. Preserve original annex meaning; never rewrite contractual requirements to match incomplete code. Record ambiguities and conflicts explicitly.
8. Keep the design system (`docs/design-system/`) in force alongside annex compliance.

<!-- END:azzam-marine-technical-annex -->

<!-- BEGIN:azzam-marine-design-system -->

## AZZAM MARINE ERP — Design System (Mandatory)

This product has an official design system. **Do not invent a parallel visual language.**

1. Read [`docs/design-system/README.md`](docs/design-system/README.md).
2. Read [`docs/design-system/BRAND_IDENTITY.md`](docs/design-system/BRAND_IDENTITY.md) (*Precision Marine Enterprise*).
3. Follow [`docs/design-system/AI_AGENT_WORKFLOW.md`](docs/design-system/AI_AGENT_WORKFLOW.md).
4. Use design tokens and `.am-*` utilities from [`src/app/globals.css`](src/app/globals.css) (`--am-*`). Chart colors: `--am-chart-*` / [`src/config/chart-palette.ts`](src/config/chart-palette.ts).
5. Official logo only: [`public/brand/azzam-marine-logo.png`](public/brand/azzam-marine-logo.png) — never redraw or replace.
6. Reuse shell/UI under `src/components/layout/` and `src/components/ui/`.
7. Preserve bilingual EN/AR + RTL/LTR, Lucide icons, and the 8×43 navigation scope (Items + Spare Parts are separate leaves).
8. **Content discipline:** no unnecessary descriptions — [`CONTENT_DISCIPLINE.md`](docs/design-system/CONTENT_DISCIPLINE.md).
9. Light workspace + navy structure + blue interaction + selective red — no neon/metallic UI effects.
10. **Responsive (mandatory):** follow [`RESPONSIVE_DESIGN.md`](docs/design-system/RESPONSIVE_DESIGN.md), [`MOBILE_EXPERIENCE.md`](docs/design-system/MOBILE_EXPERIENCE.md), [`RESPONSIVE_COMPONENTS.md`](docs/design-system/RESPONSIVE_COMPONENTS.md), and [`RESPONSIVE_QA.md`](docs/design-system/RESPONSIVE_QA.md). Mobile must use the app shell (bottom nav + drawer), not a shrunk desktop. Apply to every page/component — not dashboard-only.
11. **Space distribution (mandatory):** layouts must adapt width/height intelligently — no orphaned half-width cards, unintended empty grid cells, or accidental blank regions. Prefer flex/grid + `minmax(0, 1fr)` + `min-w-0`; use `.am-kpi-grid` / `.am-ops-grid` / orphan spanning per [`RESPONSIVE_DESIGN.md`](docs/design-system/RESPONSIVE_DESIGN.md) § Space distribution. Preserve approved desktop composition.
11a. **Design consistency (mandatory):** equivalent cards/charts/tables share structure, spacing, and same-row heights — [`DESIGN_CONSISTENCY.md`](docs/design-system/DESIGN_CONSISTENCY.md) and `.cursor/rules/azzam-design-consistency.mdc`. Fix shared components before page hacks; verify rendered EN/AR layouts.
12. **Adaptive full-height (mandatory):** shell `min-h-dvh` → main column flex → `PageFrame` (`.am-page`) → `PageSurface` (`.am-page-surface`) so primary panels fill available height on large screens. Do not stretch table rows; do not use arbitrary fixed heights; mobile may scroll naturally — see [`SPACING_AND_LAYOUT.md`](docs/design-system/SPACING_AND_LAYOUT.md) § Adaptive full-height.
13. **Data row navigation (mandatory):** when opening a record is the expected action, navigate to that record’s details using its stable unique ID (`src/lib/record-routes.ts`, `RecordCardLink` / `RecordTableRow`). Never send all rows to a listing page or a hardcoded ID — see [`DATA_DENSE_INTERFACES.md`](docs/design-system/DATA_DENSE_INTERFACES.md) § Data row navigation.
14. **Charts & viz (mandatory):** follow [`CHARTS_AND_DATA_VISUALIZATION.md`](docs/design-system/CHARTS_AND_DATA_VISUALIZATION.md) — container-driven sizing, donut+legend as one layout (`DonutChartPanel` / `ChartLegend`), no silent Arabic truncation, readable center labels, EN/AR + RTL/LTR.
15. **Date range filter (dashboard + dense lists only):** shared `DateRangeFilter` / `CalendarMonth` / `date-range.ts` is required on dashboard/KPI and dense list modules in suppliers / inventory / purchasing / sales (e.g. `/suppliers`, `/purchase-orders`) — **never** on record/detail pages (e.g. `/purchase-orders/PO-…`, `/suppliers/[id]`), settings, or pure forms. Place it in the list header/toolbar. See [`RESPONSIVE_COMPONENTS.md`](docs/design-system/RESPONSIVE_COMPONENTS.md) § Date range picker and `.cursor/rules/date-range-filter.mdc`.
15a. **Import & Export (dashboard + dense lists only):** Import + Export header actions are required on the same dense list / directory pages (suppliers, items/spare-parts/inventory, purchasing, sales) — **never** on record/detail pages. Export from the current filtered set; Import must stay honest (real path or unavailable dialog — never fake success). See [`.cursor/rules/import-export.mdc`](.cursor/rules/import-export.mdc) and [`COMPONENT_STANDARDS.md`](docs/design-system/COMPONENT_STANDARDS.md).
16. **Persistent preferences & zero-flicker (mandatory):** use `src/lib/preferences.ts` + `preference-store` + cookie mirror + head boot script. Saved theme/language/dir/sidebar must apply before first visible paint — no default English/light flash. See [`FRONTEND_ENGINEERING_STANDARDS.md`](docs/design-system/FRONTEND_ENGINEERING_STANDARDS.md) § Persistent Preferences & Zero-Flicker Initialization.
17. **Date & time — 12-hour clock (mandatory):** all UI clock times use 12-hour format via `formatTime` / `formatDateTime` / `formatIsoDate` in [`src/lib/format.ts`](src/lib/format.ts) — never 24-hour. See [`DATE_AND_TIME.md`](docs/design-system/DATE_AND_TIME.md) and `.cursor/rules/date-time-12h.mdc`.
17a. **Activity log precision (mandatory):** every mutating action that writes activity must stamp the session **user** (id + bilingual name/role) and a precise **ISO datetime**; display via `formatDateTime`. Use `currentActivityActor` / `logClientActivity` / `client-activity-store` — see `.cursor/rules/activity-log-precision.mdc`. Frontend-local only — not a server audit claim.
18. Frontend only — no backend/Prisma/API work unless explicitly requested.
19. Run `npm run lint`, `npm run typecheck`, and `npm run build` for non-trivial UI changes.

<!-- END:azzam-marine-design-system -->
