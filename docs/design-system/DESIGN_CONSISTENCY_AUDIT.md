# Design Consistency — Audit & Verification Log

**Date:** 2026-10-21  
**Standard:** [DESIGN_CONSISTENCY.md](./DESIGN_CONSISTENCY.md)  
**Cursor rule:** `.cursor/rules/azzam-design-consistency.mdc`

## Permanent rules updated

| Artifact | Change |
|----------|--------|
| `docs/design-system/DESIGN_CONSISTENCY.md` | New mandatory standard |
| `.cursor/rules/azzam-design-consistency.mdc` | Always-on agent rule |
| `docs/design-system/README.md` | Index entry |
| `docs/design-system/COMPONENT_STANDARDS.md` | Cards section |
| `AGENTS.md` | Item 11a |
| `.cursor/rules/azzam-marine-design-system.mdc` | Cross-link |

## Shared components corrected

| Component | Fix |
|-----------|-----|
| `DashboardCard` | Padding override when `bodyClassName` includes `p-*` |
| `.am-dash-bottom-grid` | All children stretch equal height; FX full-width `<xl` |
| `LowStockTable` (widget) | Stretch with row; no content-only `h-auto` |
| `RecentActivitiesCard` | Shared header + `ViewAllLink` |
| `PurchaseOrdersCard` | Shared header/action; standard icon size |
| `ShipmentStatusCard` | Removed arbitrary `min-h-[280px]` |
| `SalesTrendChart` / `ProductCategoriesChart` | Same-row stretch + body flex |
| `InventoryStatusCard` | Body flex for ops-row height |
| `ExchangeRatesCard` | Full-bleed table; body centered in stretched card |

## Affected surfaces (retrospective)

- Dashboard home (KPI, charts, ops, bottom row)
- Modules using `DashboardCard` / `ViewAllLink` / donut panels
- Suppliers directory/details (shared tokens/components; no layout rewrite this pass)

## Verification executed

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Playwright 1440×900 heights | Bottom row 375/375/375 · Ops 400/400/400 · Charts 227/227 |
| Server | `http://localhost:3000/dashboard` |

## Remaining / follow-ups

- Suppliers and other module pages: spot-check headers/tables against the same card rhythm on next touch.
- Automated screenshot regression not introduced (no new dependency); rely on RESPONSIVE_QA manual matrix.
- Chart token heights (`--am-chart-h-*`) already shared; further donut size unification across inventory vs categories MAY continue when both sit in comparable slots.
