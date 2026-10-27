# Navigation & Information Architecture

## Source of truth
`src/config/navigation.ts` — **MUST NOT** duplicate arrays elsewhere.

## Scope (contractual)
Exactly **8 groups** and **43 leaf items** (Items + Spare Parts split; previously 42 when merged as one nav entry).  
**MUST NOT** add HR, payroll, CRM pipelines, fleet, maintenance, e-commerce, or advanced GL outside annex.

## Groups
1. Main  
2. Products & Inventory  
3. Purchasing & Import  
4. Sales & Customers  
5. Pricing & Exchange Rates  
6. Finance  
7. Reports & Control  
8. System Settings  

## Behaviors
- Active route highlighted  
- Parent group auto-expands  
- Collapsed: icons + tooltips  
- Mobile: off-canvas drawer from inline-start  
- Visibility filters are UI-only — **MUST NOT** claim authorization

## Labels
English + Arabic from `src/i18n/` — **MUST NOT** hardcode nav strings in components.

## Record details routes
Detail pages live under the owning module path, e.g.:
- Items: `/items/[itemCode]`
- Spare parts: `/spare-parts/[id]`
- Marine engines: `/marine-engines/[id]`
- Purchase orders: `/purchase-orders/[id]`
- Legacy: `/products` and `/products/[partNumber]` redirect into the catalog

`findNavItemByHref` already resolves prefixes (`/items/…` → Items).  
Row → details behavior: [DATA_DENSE_INTERFACES.md](./DATA_DENSE_INTERFACES.md) § Data row navigation.
