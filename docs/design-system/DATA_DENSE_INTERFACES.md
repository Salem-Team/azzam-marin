# Data-Dense ERP Interfaces

## Tables (future + now)
- Readable headers; consistent row height  
- Numeric/financial columns right-aligned (logical end) + tabular nums  
- Empty state with clear next step  
- **MUST NOT** decorative sparklines without real data meaning

## Data row navigation (MUST)

When the expected action for a data row is **open this record**, the row **MUST** navigate to that record’s details route using its **stable unique identifier**.

### Identity
- Prefer a canonical ID already on the record (e.g. `partNumber`, PO `id`, invoice number).
- Build hrefs with helpers in `src/lib/record-routes.ts` (encode path segments).
- Mock data: resolve and render the matching mock record on the details page.
- **MUST NOT** send every row to a generic listing page.
- **MUST NOT** use display name or array index as the only identifier when a stable ID exists.
- **MUST NOT** hardcode a single product/PO id for all rows.

### Interaction
- Reuse `RecordCardLink` / `RecordTableRow` from `src/components/ui/record-row.tsx` where practical.
- Pointer cursor + hover + visible focus (light and dark).
- Keyboard: Enter / Space on the row (or a semantic link) opens the record.
- Preserve browser Back and open-in-new-tab (Cmd/Ctrl-click where supported).
- Accessible name **MUST** identify the record (e.g. “Open product 6LY2-12345 — Fuel Filter Element”).

### Nested controls
If a row contains buttons, checkboxes, links, or menus:
- Preserve their independent behavior.
- Do not let row navigation steal their clicks (`data-row-ignore` or native interactive elements).
- Avoid nested interactive elements; prefer one primary semantic link / row action.

### Scope
Apply after inspecting each table. Typical candidates: products, engines, customers, suppliers, purchase orders, sales invoices, shipments, stock movements.  
**MUST NOT** make every row clickable when opening a record is not the expected action.

Example (Low Stock): row for `6LY2-12345` → `/products/6LY2-12345` and details render that part only. Same for `8M-45678`, `876543-21`, `REC-358907`, `18-7789`.

Example (Suppliers Directory): row for `sup-yanmar` → `/suppliers/sup-yanmar`. Checkbox and row action menu **MUST NOT** trigger navigation. Search, filters, sort, and pagination **MUST** preserve identity (never index-based).

Example (Supplier detail → Orders): PO id `PO-2025-0032` → `/purchase-orders/PO-2025-0032`. Purchases/payments stay plain text until those detail routes exist.

Example (Recent Activities): only items with a known details route (e.g. purchase order `recordId`) are navigable; feed items without a record route stay non-clickable.

### Supplier directory table
- Columns: selection, name, country, category, tax ID (when space), purchases, balance, status, last transaction, actions.
- Status badges use text + tone (not color alone).
- Empty / filtered-empty states with a clear next action (add supplier or clear filters).
- Compact summary KPIs are secondary to the directory table.

## Forms
- Visible labels · grouped sections · primary/secondary actions clear  
- Validation near fields; no invented server successes  
- Add/Edit supplier: modal dialog with unsaved-change confirmation; update the frontend store and toast — do not claim server persistence  
- Prefill edit forms from the selected record’s stable ID

## Dashboards
- Decision-relevant hierarchy  
- KPI cards consistent  
- Restrained color — chart series **MUST** use [CHARTS_AND_DATA_VISUALIZATION.md](./CHARTS_AND_DATA_VISUALIZATION.md)  
- Mock metrics **MUST** be labeled as demo/frontend when present  
- **MUST NOT** add marketing intros or descriptions under every section (see [CONTENT_DISCIPLINE.md](./CONTENT_DISCIPLINE.md))

## Cards
Prefer fewer, larger compositions over card-in-card nesting.  
**MUST NOT** add a description line under a card title unless it is required to interpret the data.
