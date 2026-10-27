# AZZAM MARINE ERP — Official Design System

**Status:** Mandatory product standard  
**Scope:** Entire frontend (shell, modules, future pages, AI agents)  
**Stack:** Next.js 16 · React · TypeScript · Tailwind CSS 4 · Lucide · App Router

This directory is the **source of truth** for visual language, interaction,
motion, accessibility, RTL/LTR, and frontend engineering quality.

## Start here (required for every UI change)

1. Read this README.
2. Read the documents relevant to your change (table below).
3. Inspect existing reusable components under `src/components/`.
4. Reuse tokens from `src/styles/tokens.css` and utilities from `src/styles/utilities.css`.
5. Preserve Arabic + English and RTL + LTR.
6. Run `npm run lint`, `npm run typecheck`, and `npm run build` when the change is non-trivial.
7. Document justified exceptions in the PR / change notes.

## Document index

| Document | Purpose |
|----------|---------|
| [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) | Product-wide principles (MUST) |
| [DESIGN_CONSISTENCY.md](./DESIGN_CONSISTENCY.md) | Visual harmony — cards, grids, charts, tables (MUST) |
| [DESIGN_CONSISTENCY_AUDIT.md](./DESIGN_CONSISTENCY_AUDIT.md) | Audit log & verification evidence |
| [CONTENT_DISCIPLINE.md](./CONTENT_DISCIPLINE.md) | No unnecessary descriptions (MUST) |
| [BRAND_IDENTITY.md](./BRAND_IDENTITY.md) | Official logo analysis + Precision Marine Enterprise art direction |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Color, space, radius, elevation, chart tokens |
| [CHARTS_AND_DATA_VISUALIZATION.md](./CHARTS_AND_DATA_VISUALIZATION.md) | Chart palette meanings |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | Type scale EN/AR |
| [SPACING_AND_LAYOUT.md](./SPACING_AND_LAYOUT.md) | Spacing scale, page layouts & **adaptive full-height** (MUST) |
| [COMPONENT_STANDARDS.md](./COMPONENT_STANDARDS.md) | Shared component rules |
| [NAVIGATION_AND_INFORMATION_ARCHITECTURE.md](./NAVIGATION_AND_INFORMATION_ARCHITECTURE.md) | Sidebar IA (8 groups / 42 items) + record routes |
| [MOTION_AND_TRANSITIONS.md](./MOTION_AND_TRANSITIONS.md) | Motion tokens & usage |
| [RTL_AND_LOCALIZATION.md](./RTL_AND_LOCALIZATION.md) | AR/EN parity |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG-oriented rules |
| [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) | Global breakpoints, form factors & space distribution (MUST) |
| [MOBILE_EXPERIENCE.md](./MOBILE_EXPERIENCE.md) | Mobile app shell, bottom nav, safe areas (MUST) |
| [RESPONSIVE_COMPONENTS.md](./RESPONSIVE_COMPONENTS.md) | Tables, forms, charts, dialogs & **date range filter on dashboard + dense lists** (MUST) |
| [RESPONSIVE_QA.md](./RESPONSIVE_QA.md) | Viewport matrix & acceptance |
| [DATA_DENSE_INTERFACES.md](./DATA_DENSE_INTERFACES.md) | Tables, forms, KPIs & **data row navigation** (MUST) |
| [FRONTEND_ENGINEERING_STANDARDS.md](./FRONTEND_ENGINEERING_STANDARDS.md) | Code quality & **persistent preferences / zero-flicker** (MUST) |
| [DATE_AND_TIME.md](./DATE_AND_TIME.md) | **12-hour clock** + shared date/time helpers (MUST) |
| [TESTING_AND_VISUAL_QA.md](./TESTING_AND_VISUAL_QA.md) | Checks & visual QA |
| [CHANGE_GOVERNANCE.md](./CHANGE_GOVERNANCE.md) | Exceptions & reviews |
| [AI_AGENT_WORKFLOW.md](./AI_AGENT_WORKFLOW.md) | Mandatory Cursor / AI process |

## Implementation map

| Concern | Location |
|---------|----------|
| Tokens + utilities (bundled) | `src/app/globals.css` |
| TS token refs | `src/lib/design-tokens.ts` |
| Shell | `src/components/layout/` |
| Shared UI | `src/components/ui/` |
| Navigation config | `src/config/navigation.ts` |
| i18n | `src/i18n/` |
| Logo | `public/brand/azzam-marine-logo.png` |

## Keyword convention

| Keyword | Meaning |
|---------|---------|
| **MUST** | Required. Non-compliance is a defect. |
| **MUST NOT** | Forbidden. |
| **SHOULD** | Strong default; exception needs justification. |
| **SHOULD NOT** | Discouraged; exception needs justification. |
| **MAY** | Optional enhancement. |

## Non-goals

- No backend, database, Prisma, or API routes from design-system work.
- No inventing HR/CRM/fleet modules.
- No second navigation configuration.
- No new icon library without an approved exception.
