# Requirements Traceability Matrix — AZZAM MARINE ERP

> **Source of truth (contract):** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md)  
> **Compliance process:** [`PROJECT_COMPLIANCE_RULES.md`](./PROJECT_COMPLIANCE_RULES.md)  
> **Full-system audit matrix (PASS/PARTIAL/MISSING…):** [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md)  
> **Frontend roadmap:** [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md)  
> **Baseline inspection date:** 2026-03-25 (initial); **full-system audit refresh:** 2026-10-21  
> **Important:** Status reflects what exists in the repo today — not the contracted end state.

---

## 1. How to read this matrix

| Column | Meaning |
|--------|---------|
| **ID** | Stable requirement identifier (`TA-…`) |
| **Annex Section** | Section heading / number in the Technical Annex |
| **Requirement** | Short English restatement for engineering use (Arabic original remains authoritative) |
| **Module** | Product module / area |
| **Current Status** | See status vocabulary below |
| **Verification** | Evidence method / result |
| **Related Files** | Primary routes/components/config when identifiable |
| **Notes** | Gaps, dependencies, conflicts |

### Status vocabulary

| Status | Meaning |
|--------|---------|
| `NOT_INSPECTED` | Not reviewed |
| `NOT_IMPLEMENTED` | No meaningful implementation (placeholder-only counts as not implemented for business behavior) |
| `PARTIALLY_IMPLEMENTED` | Some UI/data exists; workflow incomplete vs annex |
| `IMPLEMENTED_UNVERIFIED` | Appears present; not adequately tested against acceptance criteria |
| `VERIFIED` | Implemented and verified with recorded evidence |
| `BLOCKED` | Blocked by missing dependency |
| `CONFLICT_DETECTED` | Conflict with annex, design, or other modules |

### Baseline posture (applies to almost all rows)

| Topic | Finding |
|-------|---------|
| Backend / Database / APIs | **Absent** — no `src/app/api`, no Prisma/ORM, no server persistence for domain data |
| Authentication | **Absent** — no login route/middleware; demo user in `src/config/mock-shell.ts` |
| Real RBAC | **Stub only** — `permissionKey` on nav; `MOCK_USER_PERMISSIONS = null` shows all (`src/config/permissions.ts`) |
| Tests | **Supplier-domain only** — `npm test` → 46 pass (2026-10-21); no app-wide E2E in `package.json` |
| Most nav routes | **`ModulePlaceholder`** (“coming soon”) — **38/42** primary nav pages; Suppliers is the deep exception |

**Verification rule used in this baseline:** A `ModulePlaceholder` page is recorded as `NOT_IMPLEMENTED` for the business requirement (route existence alone is insufficient). Rich mock UI without persistence/backend is at best `PARTIALLY_IMPLEMENTED`.

---

## 2. Ambiguities (recorded without rewriting the annex)

| Ambiguity ID | Topic | Note |
|--------------|-------|------|
| AMB-01 | Early section numbering | Sections before §27 use mixed numbering (2.x, 3.x, 6.x, 9.x, 10.x) and unnumbered headings. Trace IDs use stable `TA-*` keys; annex headings are cited as written. |
| AMB-02 | WhatsApp / Email send | Annex requires sending quotations via WhatsApp and email. Third-party service fees are excluded unless agreed. Integration mechanism (API vs deep-link vs manual) is not fully specified. |
| AMB-03 | Hardware protocols | Scanner/printers depend on device compatibility; exact protocols/drivers not named. |
| AMB-04 | Frontend-first delivery | Repo is frontend-only while annex Deliverables include Backend, Database, APIs. This is an implementation-phase gap, not an annex rewrite. |
| AMB-05 | Document numbering / company settings | Settings routes exist in nav; annex mentions system settings under Admin role but does not detail every settings screen. Treat as supporting Admin/Settings unless CR expands. |

---

## 3. Known conflicts and structural gaps

| Conflict ID | Type | Description | Affected IDs |
|-------------|------|-------------|--------------|
| CF-01 | Acceptance | No login / authentication exists while Acceptance Criteria require تسجيل الدخول | TA-AC-01, TA-SEC-01, TA-DEL-USER |
| CF-02 | Permissions | Frontend nav keys are not authorization; claiming RBAC complete would be false | TA-RBAC-*, TA-AC-22 |
| CF-03 | Deliverables | Backend, Database, APIs not present | TA-DEL-DB, TA-DEL-BE, TA-DEL-API, phase Core Development |
| CF-04 | Backup | Backup settings page is placeholder; no automatic daily backup/restore | TA-BK-*, TA-AC-23 |
| CF-05 | Hardware | Hardware settings placeholder; no device integration code | TA-HW-*, TA-AC-25 |
| CF-06 | Pricing engine | Pricing/FX routes are placeholders; dashboard FX card is display mock only | TA-27-*, TA-28-*, TA-29-*, TA-30-*, TA-31-*, TA-35-* |
| CF-07 | Import cost methods | Import cost page placeholder; §33 multi-method allocation absent | TA-33-*, TA-06-03, TA-AC-13 |
| CF-08 | Audit Log | Audit route placeholder; dashboard “recent activities” is decorative mock | TA-34-*, TA-AC-ADD-AUDIT |
| CF-09 | Supplier depth | Directory + details UI with mock analytics/ledger tabs + linked record routes; master CRUD + localStorage persist — must not be reported as full AP ledger. See `docs/SUPPLIER_MODULE_IMPLEMENTATION.md` | TA-07-* |
| CF-10 | Date range filter | Dashboard `DateRangeFilter` is uncontrolled and does not recompute KPIs/charts; `/purchase-orders` keeps period state but never filters `PURCHASE_ORDERS` (only `/suppliers` wires the filter) | TA-12-13, purchasing list |
| CF-11 | Product search | Global search searches navigation items, not SKUs / OEM / barcode | TA-03-02-* |
| CF-12 | Scope vs UI | ~38 of 42 nav items are coming-soon shells — nav coverage ≠ requirement completion | All module rows |

---

## 4. Traceability matrix

### 4.1 Project definition

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-01-01 | تعريف المشروع | Central ERP platform covering listed operational domains | Platform | PARTIALLY_IMPLEMENTED | Repo inspection | `src/config/navigation.ts`, `src/app/(erp)/**` | Navigation maps most domains; majority modules are placeholders |
| TA-01-02 | تعريف المشروع | Users & permissions management | Users/RBAC | PARTIALLY_IMPLEMENTED | Repo inspection | `settings/users`, `permissions.ts` | Route shell + nav stubs only |
| TA-01-03 | تعريف المشروع | Spare parts catalog | Products | PARTIALLY_IMPLEMENTED | SPARE_PARTS_MODULE_IMPLEMENTATION.md | `/items`, `/spare-parts` | Directory + details CRUD via spare-parts-store (browser persist); live warehouse/server APIs open |
| TA-01-04 | تعريف المشروع | Marine engines | Engines | PARTIALLY_IMPLEMENTED | system A–J + build 2026-10-27 | `/marine-engines`, `marine-engines-store`, `MARINE_ENGINES_MODULE_IMPLEMENTATION.md` | Frontend CRUD + directory UI; browser localStorage only |
| TA-01-05 | تعريف المشروع | Warehouses & inventory | Inventory | PARTIALLY_IMPLEMENTED | Repo inspection | warehouse/stock routes; `/low-stock` | Only low-stock mock list beyond shells |
| TA-01-06 | تعريف المشروع | Purchasing & import | Purchasing/Import | PARTIALLY_IMPLEMENTED | Repo inspection | `/purchase-orders`, import routes | Thin PO list/detail; import shells |
| TA-01-07 | تعريف المشروع | Suppliers | Suppliers | PARTIALLY_IMPLEMENTED | Repo inspection | `/suppliers`, suppliers store | Deepest frontend mock module |
| TA-01-08 | تعريف المشروع | Customers | Customers | NOT_IMPLEMENTED | Repo inspection | `/customers` | ModulePlaceholder |
| TA-01-09 | تعريف المشروع | Sales | Sales | NOT_IMPLEMENTED | Repo inspection | quotations/invoices/returns | ModulePlaceholder |
| TA-01-10 | تعريف المشروع | Cashbox & bank accounts | Finance | NOT_IMPLEMENTED | Repo inspection | cashboxes/banks | ModulePlaceholder |
| TA-01-11 | تعريف المشروع | Customer & supplier balances | Finance | NOT_IMPLEMENTED | Repo inspection | balance routes | ModulePlaceholder (supplier mock balance fields only) |
| TA-01-12 | تعريف المشروع | Import expenses & costs | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | ModulePlaceholder |
| TA-01-13 | تعريف المشروع | Reports & statistics | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/*` | ModulePlaceholder |
| TA-01-14 | تعريف المشروع | Backup & restore | Backup | NOT_IMPLEMENTED | Repo inspection | `/settings/backup` | ModulePlaceholder |
| TA-01-15 | تعريف المشروع | External device integrations | Hardware | NOT_IMPLEMENTED | Repo inspection | `/settings/hardware` | ModulePlaceholder |
| TA-01-16 | تعريف المشروع | Arabic & English support | i18n | PARTIALLY_IMPLEMENTED | UI/code inspection | `src/i18n/*`, locale providers | Shell/dashboard/suppliers dictionaries; not full module coverage |

---

### 4.2 Users, roles & permissions (RBAC)

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-RBAC-01 | المستخدمون والصلاحيات | Full RBAC for users/roles/permissions | Users/RBAC | NOT_IMPLEMENTED | Repo inspection | `permissions.ts`, `settings/users` | Keys exist for nav filtering only |
| TA-02-01-01 | 2.1 مدير النظام | Add users | Users | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | Placeholder |
| TA-02-01-02 | 2.1 مدير النظام | Edit users | Users | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | Placeholder |
| TA-02-01-03 | 2.1 مدير النظام | Disable/delete users per permissions | Users | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | Placeholder |
| TA-02-01-04 | 2.1 مدير النظام | Create/manage roles | Roles | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | No role editor |
| TA-02-01-05 | 2.1 مدير النظام | Assign permissions | Roles | NOT_IMPLEMENTED | Repo inspection | `permissions.ts` | Stub only |
| TA-02-01-06 | 2.1 مدير النظام | System settings management | Settings | NOT_IMPLEMENTED | Repo inspection | `/settings/*` | All settings pages placeholders |
| TA-02-01-07 | 2.1 مدير النظام | Access reports & statistics | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/*` | Placeholder reports |
| TA-02-01-08 | 2.1 مدير النظام | Monitor main system operations | Audit/Ops | NOT_IMPLEMENTED | Repo inspection | `/audit-log` | Placeholder |
| TA-02-02-01 | 2.2 مدير المخازن | Add products | Products | NOT_IMPLEMENTED | Repo inspection | `/products` | No create flow |
| TA-02-02-02 | 2.2 مدير المخازن | Edit products per permissions | Products | NOT_IMPLEMENTED | Repo inspection | product detail | Read-only mock detail |
| TA-02-02-03 | 2.2 مدير المخازن | Receive goods | Goods Receipts | NOT_IMPLEMENTED | Repo inspection | `/goods-receipts` | Placeholder |
| TA-02-02-04 | 2.2 مدير المخازن | Add stock | Stock | NOT_IMPLEMENTED | Repo inspection | stock routes | Placeholder |
| TA-02-02-05 | 2.2 مدير المخازن | Issue/stock out | Stock | NOT_IMPLEMENTED | Repo inspection | `/stock-movements` | Placeholder |
| TA-02-02-06 | 2.2 مدير المخازن | Transfer between warehouses | Transfers | NOT_IMPLEMENTED | Repo inspection | `/stock-transfers` | Placeholder |
| TA-02-02-07 | 2.2 مدير المخازن | Perform stocktaking | Stocktaking | NOT_IMPLEMENTED | Repo inspection | `/stocktaking` | Placeholder |
| TA-02-02-08 | 2.2 مدير المخازن | Monitor stock balances | Inventory | PARTIALLY_IMPLEMENTED | Repo inspection | `/low-stock`, dashboard | Mock quantities only |
| TA-02-02-09 | 2.2 مدير المخازن | Monitor low & slow-moving items | Inventory | PARTIALLY_IMPLEMENTED | Repo inspection | `/low-stock` | Low-stock mock list; slow-moving not implemented |
| TA-02-02-10 | 2.2 مدير المخازن | Monitor stock movements | Movements | NOT_IMPLEMENTED | Repo inspection | `/stock-movements` | Placeholder |
| TA-02-03-01 | 2.3 قسم المبيعات | Manage customers | Customers | NOT_IMPLEMENTED | Repo inspection | `/customers` | Placeholder |
| TA-02-03-02 | 2.3 قسم المبيعات | Create quotations | Sales | NOT_IMPLEMENTED | Repo inspection | `/quotations` | Placeholder |
| TA-02-03-03 | 2.3 قسم المبيعات | Issue sales invoices | Sales | NOT_IMPLEMENTED | Repo inspection | `/sales-invoices` | Placeholder |
| TA-02-03-04 | 2.3 قسم المبيعات | Record sales returns | Sales | NOT_IMPLEMENTED | Repo inspection | `/sales-returns` | Placeholder |
| TA-02-03-05 | 2.3 قسم المبيعات | Follow sales operations | Sales | NOT_IMPLEMENTED | Repo inspection | sales routes | Placeholder |
| TA-02-03-06 | 2.3 قسم المبيعات | Follow customer balances | Finance/AR | NOT_IMPLEMENTED | Repo inspection | `/customer-balances` | Placeholder |
| TA-02-03-07 | 2.3 قسم المبيعات | Search products & prices | Products/Pricing | NOT_IMPLEMENTED | Repo inspection | global-search, products | Nav search ≠ product search |
| TA-02-04-01 | 2.4 قسم الحسابات | Record receipts | Finance | NOT_IMPLEMENTED | Repo inspection | `/receipts-payments` | Placeholder |
| TA-02-04-02 | 2.4 قسم الحسابات | Record payments | Finance | NOT_IMPLEMENTED | Repo inspection | `/receipts-payments` | Placeholder |
| TA-02-04-03 | 2.4 قسم الحسابات | Manage cashbox | Cashboxes | NOT_IMPLEMENTED | Repo inspection | `/cashboxes` | Placeholder |
| TA-02-04-04 | 2.4 قسم الحسابات | Manage bank accounts | Banks | NOT_IMPLEMENTED | Repo inspection | `/bank-accounts` | Placeholder |
| TA-02-04-05 | 2.4 قسم الحسابات | Customer balances | AR | NOT_IMPLEMENTED | Repo inspection | `/customer-balances` | Placeholder |
| TA-02-04-06 | 2.4 قسم الحسابات | Supplier balances | AP | NOT_IMPLEMENTED | Repo inspection | `/supplier-balances` | Placeholder |
| TA-02-04-07 | 2.4 قسم الحسابات | Issue account statements | Statements | NOT_IMPLEMENTED | Repo inspection | supplier/customer details | Supplier statement tab empty |
| TA-02-04-08 | 2.4 قسم الحسابات | Debt aging | Aging | NOT_IMPLEMENTED | Repo inspection | finance/reports | Not found |
| TA-02-04-09 | 2.4 قسم الحسابات | Extract financial reports | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/financial` | Placeholder |
| TA-02-05-01 | 2.5 قسم المشتريات | Create purchase orders | Purchasing | PARTIALLY_IMPLEMENTED | Repo inspection | `/purchase-orders` | Mock list/detail; no create/lines |
| TA-02-05-02 | 2.5 قسم المشتريات | Manage suppliers | Suppliers | PARTIALLY_IMPLEMENTED | UI inspection | `/suppliers` | Frontend CRUD-like in-memory |
| TA-02-05-03 | 2.5 قسم المشتريات | Record import operations | Import | NOT_IMPLEMENTED | Repo inspection | import routes | Placeholder |
| TA-02-05-04 | 2.5 قسم المشتريات | Track shipments | Import | NOT_IMPLEMENTED | Repo inspection | `/import-shipments` | Placeholder (dashboard shipment card is mock display) |
| TA-02-05-05 | 2.5 قسم المشتريات | Record container data | Import | NOT_IMPLEMENTED | Repo inspection | `/import-shipments` | Placeholder |
| TA-02-05-06 | 2.5 قسم المشتريات | Record freight/insurance/customs/expenses | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | Placeholder |
| TA-02-05-07 | 2.5 قسم المشتريات | Allocate import costs to items | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | Placeholder; see §33 |
| TA-02-05-08 | 2.5 قسم المشتريات | Track shipment status | Import | NOT_IMPLEMENTED | Repo inspection | `/import-shipments` | Placeholder |

---

### 4.3 Spare parts & product catalog

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-03-00 | إدارة الأصناف وقطع الغيار | Integrated parts/products module | Products | PARTIALLY_IMPLEMENTED | `npm test` + build | `/items`, `items-store`, `ITEMS_MODULE_IMPLEMENTATION.md` | Frontend CRUD+details localStorage; spare/engines separate & incomplete |
| TA-03-01-01 | 3.1 بيانات الصنف | Item code | Products | PARTIALLY_IMPLEMENTED | unit tests | `CatalogItem.itemCode`, items-store | Browser-local persist; duplicate prevention |
| TA-03-01-02 | 3.1 بيانات الصنف | Arabic name | Products | PARTIALLY_IMPLEMENTED | unit tests | items wizard/detail | Browser-local persist |
| TA-03-01-03 | 3.1 بيانات الصنف | English name | Products | PARTIALLY_IMPLEMENTED | unit tests | items wizard/detail | Browser-local persist |
| TA-03-01-04 | 3.1 بيانات الصنف | Manufacturer | Products | PARTIALLY_IMPLEMENTED | UI + store | items list/filter/wizard | Browser-local persist |
| TA-03-01-05 | 3.1 بيانات الصنف | Country of origin | Products | PARTIALLY_IMPLEMENTED | UI + store | items list/filter/wizard | Browser-local persist |
| TA-03-01-06 | 3.1 بيانات الصنف | OEM Number | Products | PARTIALLY_IMPLEMENTED | unit tests | items search + identity tab | Spare specialized workflows incomplete |
| TA-03-01-07 | 3.1 بيانات الصنف | Part Number | Products | PARTIALLY_IMPLEMENTED | unit tests | items + `/spare-parts/[id]` | Legacy `/products/[partNumber]` redirects |
| TA-03-01-08 | 3.1 بيانات الصنف | Linked engine type | Products | PARTIALLY_IMPLEMENTED | UI inspection | spare↔engine demo links | Presentation links only; not verified ops |
| TA-03-01-09 | 3.1 بيانات الصنف | Product image | Products | PARTIALLY_IMPLEMENTED | UI inspection | Items thumb/placeholder + disabled upload tile | No media storage / upload API |
| TA-03-01-10 | 3.1 بيانات الصنف | Unit of measure | Products | PARTIALLY_IMPLEMENTED | UI + store | items wizard/detail | Browser-local persist |
| TA-03-01-11 | 3.1 بيانات الصنف | Minimum stock | Products | PARTIALLY_IMPLEMENTED | UI + store | items inventory tab | Threshold vs demo qty; live warehouse unavailable |
| TA-03-01-12 | 3.1 بيانات الصنف | Cost price | Products | PARTIALLY_IMPLEMENTED | unit tests | items pricing tab/wizard | Local persist; no FX engine |
| TA-03-01-13 | 3.1 بيانات الصنف | Selling price | Products | PARTIALLY_IMPLEMENTED | unit tests | items pricing tab/wizard | Local persist; no FX engine |
| TA-03-01-14 | 3.1 بيانات الصنف | Item status | Products | PARTIALLY_IMPLEMENTED | unit tests | `setItemStatus` + confirm dialog | Local persist; history kept |
| TA-03-02-01 | 3.2 البحث | Search by name | Products | PARTIALLY_IMPLEMENTED | unit tests | `filterItems` | Client-side over demo set |
| TA-03-02-02 | 3.2 البحث | Search by item code | Products | PARTIALLY_IMPLEMENTED | unit tests | items directory | Client-side demo |
| TA-03-02-03 | 3.2 البحث | Search by Part Number | Products | PARTIALLY_IMPLEMENTED | unit tests | items + spare directories | Client-side demo |
| TA-03-02-04 | 3.2 البحث | Search by OEM Number | Products | PARTIALLY_IMPLEMENTED | unit tests | items + spare directories | Client-side demo |
| TA-03-02-05 | 3.2 البحث | Search by Serial Number | Products | PARTIALLY_IMPLEMENTED | unit tests | linked engine serial in `filterItems` | Demo linkage only |
| TA-03-02-06 | 3.2 البحث | Search by Barcode | Products | PARTIALLY_IMPLEMENTED | unit tests | items directory | Client-side demo |
| TA-03-02-07 | 3.2 البحث | Search suitable for large catalogs | Products | NOT_IMPLEMENTED | Repo inspection | — | No indexed search; 100k scale unmet |

---

### 4.4 Marine engines

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-04-01 | إدارة المحركات البحرية | Independent engines module | Engines | PARTIALLY_IMPLEMENTED | system A–J + build 2026-10-27 | `/marine-engines`, `engines-directory`, `MARINE_ENGINES_MODULE_IMPLEMENTATION.md` | Independent module + nav; FE persist only |
| TA-04-02 | بيانات المحرك | Manufacturer, model, year, HP, serial, origin, basics | Engines | PARTIALLY_IMPLEMENTED | unit + system tests 2026-10-27 | `MarineEngineRecord`, wizard form, validation | Required fields + unique serial; browser persist |
| TA-04-03 | ربط المحرك بقطع الغيار | Compatible parts for engine | Engines/Products | PARTIALLY_IMPLEMENTED | system + spare-engine integration 2026-10-27 | `syncEngineCompatibleSpares`, `compatibleEngineIds`, `countCompatibleSparesForEngine` | Live SoT on spare; both-direction views |
| TA-04-04 | ربط المحرك بقطع الغيار | Alternative parts via engine | Engines | PARTIALLY_IMPLEMENTED | `alternativePartsForEngine` + system test C | spare `alternativeLinks` (distinct from compatibility) | Via spare links; not engine sales graph |
| TA-04-05 | ربط المحرك بقطع الغيار | Parts linked to a model | Engines | PARTIALLY_IMPLEMENTED | system B/C/I | live reverse links + directory search | Model association via engine record + spare links |
| TA-04-06 | ربط المحرك بقطع الغيار | Sales history for engine when available | Engines/Sales | NOT_IMPLEMENTED | Repo inspection + system test G | engine details sales empty KPI/tab | Honest empty; Sales module not connected |

---

### 4.5 Warehouses & inventory

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-05-01 | إدارة المخازن والمخزون | Multi-warehouse independent management | Warehouses | NOT_IMPLEMENTED | Repo inspection | `/warehouses` | Placeholder |
| TA-05-02 | أمثلة للمخازن | Support warehouse types (main/new/used/engines) | Warehouses | NOT_IMPLEMENTED | Repo inspection | — | Examples are illustrative; no warehouse master |
| TA-05-03 | عمليات المخزون | Add stock | Inventory | NOT_IMPLEMENTED | Repo inspection | stock routes | Placeholder |
| TA-05-04 | عمليات المخزون | Goods receipt | Inventory | NOT_IMPLEMENTED | Repo inspection | `/goods-receipts` | Placeholder |
| TA-05-05 | عمليات المخزون | Stock issue | Inventory | NOT_IMPLEMENTED | Repo inspection | `/stock-movements` | Placeholder |
| TA-05-06 | عمليات المخزون | Transfer between warehouses | Transfers | NOT_IMPLEMENTED | Repo inspection | `/stock-transfers` | Placeholder |
| TA-05-07 | عمليات المخزون | Stock adjustment | Adjustments | NOT_IMPLEMENTED | Repo inspection | `/stock-adjustments` | Placeholder |
| TA-05-08 | عمليات المخزون | Periodic stocktaking | Stocktaking | NOT_IMPLEMENTED | Repo inspection | `/stocktaking` | Placeholder |
| TA-05-09 | عمليات المخزون | Surprise stocktaking | Stocktaking | NOT_IMPLEMENTED | Repo inspection | `/stocktaking` | Placeholder |
| TA-05-10 | عمليات المخزون | Item movement history | Movements | NOT_IMPLEMENTED | Repo inspection | `/stock-movements` | Placeholder |
| TA-05-11 | عمليات المخزون | Current balance per warehouse | Inventory | NOT_IMPLEMENTED | Repo inspection | — | No per-warehouse ledger |
| TA-05-12 | تقارير المخزون | Qty per item | Reports/Inventory | NOT_IMPLEMENTED | Repo inspection | `/reports/inventory` | Placeholder |
| TA-05-13 | تقارير المخزون | Current inventory value | Reports/Inventory | NOT_IMPLEMENTED | Repo inspection | dashboard mock KPI | Display mock only |
| TA-05-14 | تقارير المخزون | Low stock items | Inventory | PARTIALLY_IMPLEMENTED | UI inspection | `/low-stock`, dashboard table | Static mock list |
| TA-05-15 | تقارير المخزون | Slow-moving items | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-05-16 | تقارير المخزون | Best-selling items | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-05-17 | تقارير المخزون | Fast-moving items | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-05-18 | تقارير المخزون | Stock movement reports | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-05-19 | تقارير المخزون | Inter-warehouse transfer reports | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.6 Purchasing & import

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-06-00 | إدارة المشتريات والاستيراد | Full purchase/import cycle | Purchasing | PARTIALLY_IMPLEMENTED | Repo inspection | purchasing routes | Incomplete |
| TA-06-01-01 | 6.1 أمر الشراء | PO number | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | `mock-dashboard.ts`, PO pages | Mock IDs |
| TA-06-01-02 | 6.1 أمر الشراء | Supplier on PO | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | PO detail | Header field only |
| TA-06-01-03 | 6.1 أمر الشراء | Purchase date | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | PO cards | Mock |
| TA-06-01-04 | 6.1 أمر الشراء | Currency | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | PO detail | Limited |
| TA-06-01-05 | 6.1 أمر الشراء | Line items | Purchasing | NOT_IMPLEMENTED | UI inspection | PO detail | No lines |
| TA-06-01-06 | 6.1 أمر الشراء | Quantities | Purchasing | NOT_IMPLEMENTED | UI inspection | — | Missing |
| TA-06-01-07 | 6.1 أمر الشراء | Purchase prices | Purchasing | NOT_IMPLEMENTED | UI inspection | — | Missing |
| TA-06-01-08 | 6.1 أمر الشراء | PO total | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | PO cards | Mock totals |
| TA-06-01-09 | 6.1 أمر الشراء | PO status | Purchasing | PARTIALLY_IMPLEMENTED | UI inspection | PO cards | Mock status |
| TA-06-02-01 | 6.2 متابعة الشحنة | Container number | Import | NOT_IMPLEMENTED | Repo inspection | `/import-shipments` | Placeholder |
| TA-06-02-02 | 6.2 متابعة الشحنة | Shipping company | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-06-02-03 | 6.2 متابعة الشحنة | Loading port | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-06-02-04 | 6.2 متابعة الشحنة | Arrival port | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-06-02-05 | 6.2 متابعة الشحنة | Ship date | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-06-02-06 | 6.2 متابعة الشحنة | ETA | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-06-02-07 | 6.2 متابعة الشحنة | Shipment status | Import | NOT_IMPLEMENTED | Repo inspection | dashboard shipment card | Display mock ≠ module |
| TA-06-03-01 | 6.3 توزيع تكاليف الاستيراد | Record goods value / freight / insurance / customs / admin / other | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | Placeholder |
| TA-06-03-02 | 6.3 توزيع تكاليف الاستيراد | Allocate costs to items for final unit cost | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | See §33 for methods |

---

### 4.7 Suppliers

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-07-01 | إدارة الموردين | Integrated supplier profile | Suppliers | PARTIALLY_IMPLEMENTED | UI + audit 2026-10-21 | `supplier-details-view.tsx`, `supplier-overview-panel.tsx`, `docs/SUPPLIER_MODULE_AUDIT.md` | Identity, tabs (`?tab=`), KPIs, charts, master data — mock analytics |
| TA-07-02 | بيانات المورد | Name, country, phone, email, WhatsApp, bank, basics | Suppliers | PARTIALLY_IMPLEMENTED | UI + tests 2026-10-21 | `types/supplier.ts`, 6-step wizard, form dialog, code/contact/commercial | Fields + validation; localStorage master CRUD + browser docs/audit adapters — see IMPLEMENTATION.md |
| TA-07-03 | سجل المورد | Purchase orders history | Suppliers | PARTIALLY_IMPLEMENTED | UI + route smoke | `mock-supplier-ledger.ts`, PO details fallback | Linked POs resolve to detail pages (USD); not full PO workflow |
| TA-07-04 | سجل المورد | Purchases history | Suppliers | PARTIALLY_IMPLEMENTED | UI + route smoke | `/purchases/[id]`, ledger catalog | Mock purchase records; not goods-receipt posting |
| TA-07-05 | سجل المورد | Payments history | Suppliers | PARTIALLY_IMPLEMENTED | UI + route smoke | `/supplier-payments/[id]` | Mock payment records; not bank reconciliation |
| TA-07-06 | سجل المورد | Current balance | Suppliers | PARTIALLY_IMPLEMENTED | Seed invariant check | directory + details KPIs | Seed `balance = purchases − payments` (USD); not AP posting |
| TA-07-07 | سجل المورد | Account statement | Suppliers | PARTIALLY_IMPLEMENTED | Code inspection | statement tab + analytics | Debit/credit/reference + running balance; period recompute; ends at supplier.balance; demo only |
| TA-07-08 | سجل المورد | Transaction history | Suppliers | PARTIALLY_IMPLEMENTED | UI inspection | history tab | Same movements as statement without running-balance column |
| TA-07-09 | إدارة الموردين | Persistence of supplier data | Suppliers | PARTIALLY_IMPLEMENTED | Tests 2026-10-21 | `supplier-persist.ts`, `suppliers-store.ts`, `supplier-documents.ts`, `supplier-audit.ts` | Browser localStorage + IndexedDB adapters; not multi-user DB / DMS / RBAC — see `docs/SUPPLIER_MODULE_IMPLEMENTATION.md` |

---

### 4.8 Customers

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-08-01 | إدارة العملاء | Integrated customer profile | Customers | NOT_IMPLEMENTED | Repo inspection | `/customers` | Placeholder; no `/customers/[id]` |
| TA-08-02 | بيانات العميل | Name, phone, address, optional tax id, basics | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-08-03 | سجل العميل | Purchases / invoices / payments / returns | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-08-04 | سجل العميل | Outstanding balance & last transaction | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-08-05 | سجل العميل | Account statement & operations log | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.9 Sales

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-09-00 | إدارة المبيعات | Full sales cycle | Sales | NOT_IMPLEMENTED | Repo inspection | sales routes | Placeholders |
| TA-09-01-01 | 9.1 عروض الأسعار | Create quotation | Quotations | NOT_IMPLEMENTED | Repo inspection | `/quotations` | Placeholder |
| TA-09-01-02 | 9.1 عروض الأسعار | Add items/qty/prices & totals | Quotations | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-01-03 | 9.1 عروض الأسعار | Generate PDF | Quotations | NOT_IMPLEMENTED | Repo inspection | package.json | No PDF library |
| TA-09-01-04 | 9.1 عروض الأسعار | Send via WhatsApp | Quotations | NOT_IMPLEMENTED | Repo inspection | — | Missing (AMB-02) |
| TA-09-01-05 | 9.1 عروض الأسعار | Send via email | Quotations | NOT_IMPLEMENTED | Repo inspection | — | Missing (AMB-02) |
| TA-09-02-01 | 9.2 فواتير البيع | Cash sale | Invoices | NOT_IMPLEMENTED | Repo inspection | `/sales-invoices` | Placeholder |
| TA-09-02-02 | 9.2 فواتير البيع | Credit sale | Invoices | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-02-03 | 9.2 فواتير البيع | Bank transfer sale | Invoices | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-02-04 | 9.2 فواتير البيع | Invoice with customer/items/qty/prices/totals | Invoices | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-03-01 | 9.3 مرتجعات المبيعات | Record return | Returns | NOT_IMPLEMENTED | Repo inspection | `/sales-returns` | Placeholder |
| TA-09-03-02 | 9.3 مرتجعات المبيعات | Restock per approved condition | Returns/Inventory | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-03-03 | 9.3 مرتجعات المبيعات | Update stock qty | Returns/Inventory | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-03-04 | 9.3 مرتجعات المبيعات | Update customer account | Returns/AR | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-09-03-05 | 9.3 مرتجعات المبيعات | Record financial impact | Returns/Finance | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.10 Accounting & finance

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-10-01-01 | 10.1 الصندوق | Daily cash movement | Cashboxes | NOT_IMPLEMENTED | Repo inspection | `/cashboxes` | Placeholder |
| TA-10-01-02 | 10.1 الصندوق | Receipts & payments in cashbox | Cashboxes | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-01-03 | 10.1 الصندوق | Current cash balance & statement | Cashboxes | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-02-01 | 10.2 البنوك | Manage bank accounts | Banks | NOT_IMPLEMENTED | Repo inspection | `/bank-accounts` | Placeholder |
| TA-10-02-02 | 10.2 البنوك | Record bank movements & balances | Banks | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-02-03 | 10.2 البنوك | Bank transfers & statements | Banks | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-03-01 | 10.3 حسابات العملاء | Customer balances / payments / dues | AR | NOT_IMPLEMENTED | Repo inspection | `/customer-balances` | Placeholder |
| TA-10-03-02 | 10.3 حسابات العملاء | Debt aging | AR | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-03-03 | 10.3 حسابات العملاء | Customer statements | AR | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-04-01 | 10.4 حسابات الموردين | Supplier balances / payments / dues | AP | NOT_IMPLEMENTED | Repo inspection | `/supplier-balances` | Placeholder |
| TA-10-04-02 | 10.4 حسابات الموردين | Debt aging | AP | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-10-04-03 | 10.4 حسابات الموردين | Supplier statements | AP | NOT_IMPLEMENTED | Repo inspection | supplier statement tab | Incomplete |

---

### 4.11 Reports & statistics

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-11-01 | تقارير المبيعات | Daily/weekly/monthly/yearly sales reports | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/sales` | Placeholder |
| TA-11-02 | تقارير المبيعات | Sales by customer / by item | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-11-03 | تقارير الأرباح | Sales total, COGS, gross profit, net profit | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/profit` | Placeholder |
| TA-11-04 | تقارير المخزون | Inventory value, low/slow/fast, movements, warehouse balances | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/inventory` | Placeholder |
| TA-11-05 | التقارير المالية | Customer/supplier statements, cash/bank movement, aging | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/financial` | Placeholder |
| TA-11-06 | التقارير | Purchasing/import reports route | Reports | NOT_IMPLEMENTED | Repo inspection | `/reports/purchasing-import` | Placeholder (nav exists) |

---

### 4.12 Dashboard

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-12-00 | Dashboard | Main dashboard with role-based KPIs | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | `dashboard-home.tsx`, `mock-dashboard.ts` | Rich mock UI; not role-filtered |
| TA-12-01 | Dashboard | Total sales KPI | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | KPI cards | Static mock |
| TA-12-02 | Dashboard | Total purchases KPI | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | KPI cards | Static mock |
| TA-12-03 | Dashboard | Inventory value KPI | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | KPI cards | Static mock |
| TA-12-04 | Dashboard | Customer balances KPI | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | KPI cards | Static mock |
| TA-12-05 | Dashboard | Supplier balances KPI | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | KPI cards | Static mock |
| TA-12-06 | Dashboard | Cash movement indicator | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | finance-related cards | Mock/limited |
| TA-12-07 | Dashboard | Bank movement indicator | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | — | Mock/limited |
| TA-12-08 | Dashboard | Profits indicator | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | — | Mock |
| TA-12-09 | Dashboard | Low stock list | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | `low-stock-table.tsx` | Mock |
| TA-12-10 | Dashboard | Best-selling items | Dashboard | NOT_IMPLEMENTED | UI inspection | — | Not clearly present as annex KPI |
| TA-12-11 | Dashboard | Recent operations | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | `recent-activities-card.tsx` | Decorative mock ≠ audit |
| TA-12-12 | Dashboard | KPIs respect user permissions | Dashboard | NOT_IMPLEMENTED | Code inspection | permissions stub | All widgets shown |
| TA-12-13 | Dashboard | Period filter affects metrics | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | `date-range-filter.tsx` | Filter UI present; does not recompute data (CF-10) |

---

### 4.13 Hardware integration

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-HW-01 | التكامل مع الأجهزة | Barcode Scanner integration | Hardware | NOT_IMPLEMENTED | Repo inspection | `/settings/hardware` | Placeholder; AMB-03 |
| TA-HW-02 | التكامل مع الأجهزة | Invoice Printer integration | Hardware | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-HW-03 | التكامل مع الأجهزة | Barcode Printer integration | Hardware | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.14 Backup & restore

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-BK-01 | النسخ الاحتياطي | Automatic daily backups | Backup | NOT_IMPLEMENTED | Repo inspection | `/settings/backup` | Placeholder; needs backend/hosting |
| TA-BK-02 | النسخ الاحتياطي | Suitable backup storage | Backup | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-BK-03 | النسخ الاحتياطي | Data restore capability | Backup | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-BK-04 | النسخ الاحتياطي | Backup protection per hosting settings | Backup | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-BK-05 | النسخ الاحتياطي | Cloud/hosting fees independent unless contract says otherwise | Commercial | NOT_INSPECTED | Contractual note | annex text | Commercial clause; not a UI feature |

---

### 4.15 Languages

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-LANG-01 | اللغات | Arabic language | i18n | PARTIALLY_IMPLEMENTED | UI/code inspection | `src/i18n/ar.ts`, locale provider | Shell + selected modules |
| TA-LANG-02 | اللغات | English language | i18n | PARTIALLY_IMPLEMENTED | UI/code inspection | `src/i18n/en.ts` | Shell + selected modules |
| TA-LANG-03 | اللغات | Appropriate text direction (RTL/LTR) | i18n | IMPLEMENTED_UNVERIFIED | Code inspection | preferences, layout dir | Persisted prefs + RTL/LTR; needs full visual QA across all future pages |
| TA-LANG-04 | اللغات | Languages settings page (admin) | Settings | NOT_IMPLEMENTED | Repo inspection | `/settings/languages` | Placeholder (runtime language switch exists in topbar) |

---

### 4.16 Performance & scalability

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-PERF-01 | الأداء وقابلية التوسع | Support >100,000 items | Platform | NOT_IMPLEMENTED | Repo inspection | mock catalog size | Tiny mock catalog; no backend indexing |
| TA-PERF-02 | الأداء وقابلية التوسع | Support >20 concurrent users | Platform | NOT_IMPLEMENTED | Repo inspection | — | No multi-user backend |
| TA-PERF-03 | الأداء وقابلية التوسع | Search <2s under normal conditions | Products | NOT_IMPLEMENTED | Repo inspection | — | Product search not implemented |
| TA-PERF-04 | الأداء وقابلية التوسع | Actual performance depends on server/data/network/DB | Platform | NOT_INSPECTED | N/A | annex clause | Constraint note, not a feature |

---

### 4.17 Security & access

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-SEC-01 | الأمان وإدارة الوصول | Authentication | Auth | NOT_IMPLEMENTED | Repo inspection | no login/middleware | Demo session only |
| TA-SEC-02 | الأمان وإدارة الوصول | Role-Based Access Control | Authz | NOT_IMPLEMENTED | Repo inspection | `permissions.ts` | Stub; not enforcement |
| TA-SEC-03 | الأمان وإدارة الوصول | User Permissions | Authz | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-SEC-04 | الأمان وإدارة الوصول | Role Permissions | Authz | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-SEC-05 | الأمان وإدارة الوصول | Protect sensitive operations | Authz | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-SEC-06 | الأمان وإدارة الوصول | Access permission management | Settings | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | Placeholder |
| TA-SEC-07 | الأمان وإدارة الوصول | HTTPS in supporting production environments | Ops | NOT_INSPECTED | Deployment not reviewed | — | Environment-dependent |

---

### 4.18 Testing & QA (phase requirements)

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-QA-01 | الاختبار وضمان الجودة | Functional Testing | QA | NOT_IMPLEMENTED | Repo inspection | no test suite | Missing |
| TA-QA-02 | الاختبار وضمان الجودة | User Flow Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-03 | الاختبار وضمان الجودة | Inventory Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-04 | الاختبار وضمان الجودة | Sales Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-05 | الاختبار وضمان الجودة | Purchase Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-06 | الاختبار وضمان الجودة | Import Cost Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-07 | الاختبار وضمان الجودة | Customer Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-08 | الاختبار وضمان الجودة | Supplier Testing | QA | PARTIALLY_IMPLEMENTED | `npm test` 2026-10-21 | `src/**/*.test.ts` (46 cases / 8 suites) | Validation, persist, CRUD, query, ledger, documents, audit, statement |
| TA-QA-09 | الاختبار وضمان الجودة | Accounting Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-10 | الاختبار وضمان الجودة | Reports Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-11 | الاختبار وضمان الجودة | Permissions Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-12 | الاختبار وضمان الجودة | API Testing | QA | BLOCKED | Repo inspection | no APIs | CF-03 |
| TA-QA-13 | الاختبار وضمان الجودة | Backup & Restore Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-14 | الاختبار وضمان الجودة | Device Integration Testing | QA | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-QA-15 | الاختبار وضمان الجودة | Fix in-scope defects before final delivery | QA | NOT_INSPECTED | Process | — | Delivery-phase obligation |

---

### 4.19 Training, support, phases, commercial clauses

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-TRN-01 | التدريب والدعم الفني | Train core staff on main operations | Delivery | NOT_IMPLEMENTED | Process | — | Delivery-phase |
| TA-TRN-02 | التدريب والدعم الفني | 12-month post Go-Live support for agreed functions | Delivery | NOT_INSPECTED | Contractual | — | Warranty/support clause |
| TA-TRN-03 | التدريب والدعم الفني | Support excludes new modules/features/scope/integrations (CR) | Governance | VERIFIED | Documented | this compliance set | Encoded in PROJECT_COMPLIANCE_RULES |
| TA-PH-01 | مراحل التنفيذ | 45 working days (excl. Fri/Sat/holidays/client delays) | Delivery | NOT_INSPECTED | Schedule | — | Project management |
| TA-PH-02 | المرحلة الأولى | Discovery & Analysis (5 days) | Delivery | NOT_INSPECTED | Process | — | Phase obligation |
| TA-PH-03 | المرحلة الثانية | UX/UI (7 days) | Delivery | PARTIALLY_IMPLEMENTED | Repo inspection | `docs/design-system/*` | Design system advanced; not formal phase sign-off |
| TA-PH-04 | المرحلة الثالثة | Core Development incl. Backend/DB/UI/modules (23 days) | Delivery | PARTIALLY_IMPLEMENTED | Repo inspection | frontend shell | Backend/DB missing |
| TA-PH-05 | المرحلة الرابعة | Integration & QA (7 days) | Delivery | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-PH-06 | المرحلة الخامسة | Final Handover (3 days) | Delivery | NOT_IMPLEMENTED | Process | — | Not reached |
| TA-SCOPE-01 | حدود نطاق العمل | Only annex features in scope; others are CR | Governance | VERIFIED | Documented | TECHNICAL_ANNEX + compliance rules | Process established |
| TA-SCOPE-02 | حدود نطاق العمل | CR study → impact → cost → written approval | Governance | VERIFIED | Documented | PROJECT_COMPLIANCE_RULES §9 | Process |
| TA-HOST-01 | الاستضافة والخدمات الخارجية | Third-party fees excluded unless agreed | Commercial | NOT_INSPECTED | Contractual | annex | Commercial clause |
| TA-WAR-01 | الضمان والدعم | 12-month warranty from Go-Live for in-scope defects | Delivery | NOT_INSPECTED | Contractual | annex | Not started |
| TA-WAR-02 | الضمان والدعم | Warranty exclusions (new features, 3rd-party edits, hosting, incompatible devices) | Governance | VERIFIED | Documented | annex preserved | Text preserved in TECHNICAL_ANNEX |
| TA-IP-01 | الملكية الفكرية | Deliver Source Code/DB/Backend/APIs/docs after full payment | Delivery | NOT_IMPLEMENTED | Process | — | Backend/DB/APIs absent today |

---

### 4.20 Acceptance Criteria (basic)

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-AC-01 | Acceptance Criteria | Login | Auth | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-02 | Acceptance Criteria | Users & permissions management | Users | NOT_IMPLEMENTED | Repo inspection | `/settings/users` | Placeholder |
| TA-AC-03 | Acceptance Criteria | Products management | Products | PARTIALLY_IMPLEMENTED | Repo inspection | products routes | Incomplete |
| TA-AC-04 | Acceptance Criteria | Product search | Products | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-05 | Acceptance Criteria | Marine engines management | Engines | PARTIALLY_IMPLEMENTED | system A–J + build 2026-10-27 | `/marine-engines`, store + directory UI | Frontend CRUD + SoT map; no server/authz |
| TA-AC-06 | Acceptance Criteria | Link parts to engines | Engines | PARTIALLY_IMPLEMENTED | integration tests 2026-10-27 | `syncEngineCompatibleSpares`, `deleteMarineEngineAndUnlink`, spare form | Bidirectional via spare SoT; FE only |
| TA-AC-07 | Acceptance Criteria | Warehouses management | Warehouses | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-08 | Acceptance Criteria | Stock in/out/transfer | Inventory | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-09 | Acceptance Criteria | Stocktaking operations | Stocktaking | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-10 | Acceptance Criteria | Create purchase orders | Purchasing | PARTIALLY_IMPLEMENTED | Repo inspection | PO pages | Mock only; no create |
| TA-AC-11 | Acceptance Criteria | Suppliers management | Suppliers | PARTIALLY_IMPLEMENTED | UI inspection | suppliers module | Frontend mock |
| TA-AC-12 | Acceptance Criteria | Record shipment data | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-13 | Acceptance Criteria | Allocate import costs | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-14 | Acceptance Criteria | Customers management | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-15 | Acceptance Criteria | Create quotations | Sales | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-16 | Acceptance Criteria | Issue sales invoices | Sales | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-17 | Acceptance Criteria | Record returns | Sales | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-18 | Acceptance Criteria | Cashbox management | Finance | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-19 | Acceptance Criteria | Bank accounts management | Finance | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-20 | Acceptance Criteria | Customer & supplier balances | Finance | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-21 | Acceptance Criteria | Basic reports | Reports | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-AC-22 | Acceptance Criteria | Permissions system operating | Authz | NOT_IMPLEMENTED | Repo inspection | permissions stub | CF-02 |
| TA-AC-23 | Acceptance Criteria | Backup operating | Backup | NOT_IMPLEMENTED | Repo inspection | — | CF-04 |
| TA-AC-24 | Acceptance Criteria | Arabic & English support | i18n | PARTIALLY_IMPLEMENTED | UI inspection | i18n system | Incomplete module coverage |
| TA-AC-25 | Acceptance Criteria | Agreed device integrations operating | Hardware | NOT_IMPLEMENTED | Repo inspection | — | CF-05 |

---

### 4.21 Deliverables

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-DEL-SYS | Deliverables | Company management system | Platform | PARTIALLY_IMPLEMENTED | Repo inspection | app shell | Frontend shell |
| TA-DEL-DASH | Deliverables | Dashboard | Dashboard | PARTIALLY_IMPLEMENTED | UI inspection | `/dashboard` | Mock KPIs |
| TA-DEL-USER | Deliverables | User Management | Users | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-ROLE | Deliverables | Roles & Permissions | Authz | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-INV | Deliverables | Inventory Management | Inventory | NOT_IMPLEMENTED | Repo inspection | — | Shells only |
| TA-DEL-WH | Deliverables | Warehouse Management | Warehouses | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-PARTS | Deliverables | Spare Parts Management | Products | PARTIALLY_IMPLEMENTED | SPARE_PARTS_MODULE_IMPLEMENTATION.md; SPARE_PARTS_CROSS_SYSTEM_INTEGRATION.md; integration+store tests 2026-10-26 | `/spare-parts`, spare-parts-store, shared UoM/FX/suppliers/engines reverse | Browser-local CRUD + shared-source wiring verified; dynamic category/engines masters + server still gaps |
| TA-DEL-ENG | Deliverables | Marine Engines Management | Engines | PARTIALLY_IMPLEMENTED | system A–J + build 2026-10-27 | `MARINE_ENGINES_MODULE_IMPLEMENTATION.md` | Frontend deliverable; backend open |
| TA-DEL-PUR | Deliverables | Purchasing Management | Purchasing | PARTIALLY_IMPLEMENTED | Repo inspection | — | Thin PO mock |
| TA-DEL-IMP | Deliverables | Import Management | Import | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-SUP | Deliverables | Suppliers Management | Suppliers | PARTIALLY_IMPLEMENTED | UI inspection | suppliers | Frontend mock |
| TA-DEL-CUS | Deliverables | Customers Management | Customers | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-SAL | Deliverables | Sales Management | Sales | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-FIN | Deliverables | Basic Accounting & Financial Management | Finance | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-REP | Deliverables | Reports & Dashboard | Reports | PARTIALLY_IMPLEMENTED | Repo inspection | dashboard vs reports | Dashboard partial; reports missing |
| TA-DEL-BC | Deliverables | Barcode Integration | Hardware | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-IPR | Deliverables | Invoice Printer Integration | Hardware | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-BPR | Deliverables | Barcode Printer Integration | Hardware | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-DB | Deliverables | Database | Backend | NOT_IMPLEMENTED | Repo inspection | — | CF-03 |
| TA-DEL-BE | Deliverables | Backend | Backend | NOT_IMPLEMENTED | Repo inspection | — | CF-03 |
| TA-DEL-API | Deliverables | APIs | Backend | NOT_IMPLEMENTED | Repo inspection | — | CF-03 |
| TA-DEL-BK | Deliverables | Backup System | Backup | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-DEL-I18N | Deliverables | Arabic & English Interface | i18n | PARTIALLY_IMPLEMENTED | UI inspection | i18n | Partial |
| TA-DEL-DOC | Deliverables | Basic Documentation | Docs | PARTIALLY_IMPLEMENTED | Repo inspection | `docs/**` | Design system + this annex set |
| TA-DEL-TRN | Deliverables | User Training | Delivery | NOT_IMPLEMENTED | Process | — | Delivery-phase |
| TA-DEL-WALK | Deliverables | Operational Walkthrough | Delivery | NOT_IMPLEMENTED | Process | — | Delivery-phase |
| TA-DEL-SRC | Deliverables | Source Code after full payment | Delivery | PARTIALLY_IMPLEMENTED | Repo exists | git repo | Frontend source present; full stack incomplete |

---

### 4.22 §27 Multi-currency pricing

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-27-01 | 27 | Multi-currency pricing USD/EGP | Pricing | NOT_IMPLEMENTED | Repo inspection | `/price-lists` | Placeholder |
| TA-27-02 | 27 بيانات التسعير | Purchase cost USD | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-03 | 27 بيانات التسعير | Purchase cost local when needed | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-04 | 27 بيانات التسعير | Sell price USD | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-05 | 27 بيانات التسعير | Target profit % | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-06 | 27 بيانات التسعير | Sell price EGP | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-07 | 27 بيانات التسعير | FX used in price calculation | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-08 | 27 بيانات التسعير | Last price update date | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-09 | 27 بيانات التسعير | FX source/type | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-10 | 27 احتساب سعر البيع | Auto EGP = USD × approved FX | Pricing | NOT_IMPLEMENTED | Repo inspection | dashboard FX card | Formula not operational |
| TA-27-11 | 27 احتساب سعر البيع | Price from profit % per item/category | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-27-12 | 27 احتساب سعر البيع | Retain FX used at last pricing | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.23 §28 Exchange rate management

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-28-01 | 28 | Dedicated FX management screen | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | `/exchange-rates` | Placeholder |
| TA-28-02 | 28 | Show current approved USD rate | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | dashboard FX mock | Display only |
| TA-28-03 | 28 | Update USD rate | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-28-04 | 28 | Record update date/time & user | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Needs auth |
| TA-28-05 | 28 | Keep previous FX history | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-28-06 | 28 | Know rate used at each repricing | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-28-07 | 28 | Approved FX is basis for auto pricing | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.24 §29 Automatic repricing

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-29-01 | 29 | Auto reprice on FX update | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | `/automatic-repricing` | Placeholder |
| TA-29-02 | 29 | Recalculate EGP sell prices | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-29-03 | 29 | Preserve USD sell price when needed | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-29-04 | 29 | Preserve item profit % | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-29-05 | 29 | Select items to reprice | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-29-06 | 29 | Preview changes before commit | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-29-07 | 29 | Authorized confirmation required for bulk price apply | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Needs authz |

---

### 4.25 §30 Bulk price updates

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-30-01 | 30 | Bulk price updates tools | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | `/bulk-price-updates` | Placeholder |
| TA-30-02 | 30 | Raise/lower prices by percentage with preview & commit | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-30-03 | 30 | Update by category / selected set / product type | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-30-04 | 30 | Update by brand/manufacturer | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-30-05 | 30 | Manual exclusions | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-30-06 | 30 | Protected from automatic update | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-30-07 | 30 | Items unaffected by FX change | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.26 §31 Price & FX history

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-31-01 | 31 | Full historical price-change log | Price History | NOT_IMPLEMENTED | Repo inspection | `/price-history` | Placeholder |
| TA-31-02 | 31 | Old/new price, % change, old/new FX | Price History | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-31-03 | 31 | Timestamp, user, reason, affected items | Price History | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-31-04 | 31 | Change type & source (manual/auto/bulk) | Price History | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.27 §32 Cross Reference & alternative parts

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-32-01 | 32 | Cross Reference capability | Cross Reference | PARTIALLY_IMPLEMENTED | `cross-reference.test.ts`; CSV tests; UI `/cross-reference` | directory, drawer, import dialog, spare store | Frontend CRUD + typed refs + CSV; browser-local; server BLOCKED |
| TA-32-02 | 32 Cross Reference | Link multiple OEM/Part/MPN/Alt/Compatible numbers | Cross Reference | PARTIALLY_IMPLEMENTED | typed-ref migrate/search/CSV tests | `typedReferences` + spine OEM/PN/MPN; codes mirror | Server durability still missing |
| TA-32-03 | 32 القطع البديلة | Define original vs alternative with manufacturer, number, compatibility, notes | Cross Reference | PARTIALLY_IMPLEMENTED | CRUD + relationshipType tests + drawer/CSV; wizard review shows manufacturer + numbers | `alternativeLinks.relationshipType` + degree + notes; content-discipline page header | Browser-local only |
| TA-32-04 | 32 | Show alternatives when searching a part | Cross Reference | PARTIALLY_IMPLEMENTED | Search tests + 5k bench; details tabs | `searchBlob` + spare alts/cross-ref | 100k/<2s BLOCKED (no backend) |

---

### 4.28 §33 Import cost allocation methods

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-33-01 | 33 | Multiple allocation methods | Import Costs | NOT_IMPLEMENTED | Repo inspection | `/import-costs` | Placeholder |
| TA-33-02 | 33 التوزيع حسب القيمة | Allocate by value share | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-03 | 33 التوزيع حسب الكمية | Allocate by quantity | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-04 | 33 التوزيع حسب الوزن | Allocate by weight when available | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-05 | 33 التوزيع اليدوي | Manual allocation by authorized user | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-06 | 33 اختيار طريقة التوزيع | Choose method per additional cost | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-07 | 33 | Preview pre/post allocation per item | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-33-08 | 33 | Review, approve, update final costs, keep allocation log | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.29 §34 Audit Log

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-34-01 | 34 | Audit Log for sensitive operations | Audit | NOT_IMPLEMENTED | Repo inspection | `/audit-log` | Placeholder |
| TA-34-02 | 34 | Capture create/update/delete & domain events listed | Audit | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-34-03 | 34 بيانات Audit Log | User, action type, module, record, old/new, timestamp, IP, details | Audit | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-34-04 | 34 | Management review of who/when/what changed | Audit | NOT_IMPLEMENTED | Repo inspection | dashboard activities | Decorative mock only |

---

### 4.30 §35 Additional acceptance criteria

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-35-01 | 35 | Record item cost in USD | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-02 | 35 | Record sell price in USD | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-03 | 35 | Set profit percentage | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-04 | 35 | Compute EGP sell via approved FX | Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-05 | 35 | Edit USD rate from dedicated screen | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-06 | 35 | Persist FX history | Exchange Rates | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-07 | 35 | Reprice items from new FX | Auto Repricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-08 | 35 | Raise/lower group prices by % | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-09 | 35 | Update prices by category | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-10 | 35 | Update prices by brand | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-11 | 35 | Exclude items from repricing | Bulk Pricing | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-12 | 35 | Full price-change history | Price History | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-13 | 35 | Cross Reference support | Cross Reference | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-14 | 35 | Alternative parts support | Cross Reference | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-15 | 35 | Import cost allocation by value | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-16 | 35 | Import cost allocation by quantity | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-17 | 35 | Import cost allocation by weight | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-18 | 35 | Manual import cost allocation | Import Costs | NOT_IMPLEMENTED | Repo inspection | — | Missing |
| TA-35-19 | 35 | Audit Log for sensitive ops | Audit | NOT_IMPLEMENTED | Repo inspection | — | Missing |

---

### 4.31 §36 In-scope confirmation (pricing / audit / import cost)

| ID | Annex Section | Requirement | Module | Current Status | Verification | Related Files | Notes |
|----|---------------|-------------|--------|----------------|--------------|---------------|-------|
| TA-36-01 | 36 | Multi-Currency Pricing in scope (not CR) | Governance/Pricing | NOT_IMPLEMENTED | Scope documented; feature absent | annex §36 | In scope contractually |
| TA-36-02 | 36 | USD/EGP Pricing in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-03 | 36 | Exchange Rate Management in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-04 | 36 | Automatic Repricing in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-05 | 36 | Bulk Price Updates in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-06 | 36 | Category-Based Price Updates in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-07 | 36 | Brand-Based Price Updates in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-08 | 36 | Price Exclusions in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-09 | 36 | Price History in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-10 | 36 | Exchange Rate History in scope | Pricing | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-11 | 36 | Cross Reference in scope | Cross Reference | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-12 | 36 | Alternative Parts in scope | Cross Reference | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-13 | 36 | Multiple Import Cost Allocation Methods in scope | Import Costs | NOT_IMPLEMENTED | — | — | In scope |
| TA-36-14 | 36 | Audit Log in scope | Audit | NOT_IMPLEMENTED | — | — | In scope |

---

## 5. Module inspection rollup

| Module | Route(s) | Inspection result | Dominant status |
|--------|----------|-------------------|-----------------|
| Dashboard | `/dashboard` | Rich mock UI + charts; period filter incomplete | PARTIALLY_IMPLEMENTED |
| Items / Spare Parts / Engines | `/items`, `/spare-parts`, `/marine-engines` (+ detail routes) | Design directories + linked details; legacy `/products*` redirects | PARTIALLY_IMPLEMENTED |
| Marine engines | `/marine-engines`, `/marine-engines/[id]` | FE wizard CRUD + delete cascade + spare/alt/stock/pricing SoT (localStorage); A–J verified 2026-10-27 | PARTIALLY_IMPLEMENTED |
| Cross reference | `/cross-reference` | Directory + alt CRUD on spare `alternativeLinks`; browser-local | PARTIALLY_IMPLEMENTED |
| Warehouses | `/warehouses` | Placeholder | NOT_IMPLEMENTED |
| Stock movements/transfers/adjustments/stocktaking | respective routes | Placeholder | NOT_IMPLEMENTED |
| Low stock | `/low-stock` | Mock list | PARTIALLY_IMPLEMENTED |
| Suppliers | `/suppliers`, `/suppliers/[id]` | Deepest frontend module; in-memory | PARTIALLY_IMPLEMENTED |
| Purchase orders | `/purchase-orders`, `/[id]` | Mock list + thin detail | PARTIALLY_IMPLEMENTED |
| Goods receipts | `/goods-receipts` | Placeholder | NOT_IMPLEMENTED |
| Import shipments/costs | import routes | Placeholder | NOT_IMPLEMENTED |
| Customers / quotations / invoices / returns | sales-customer routes | Placeholder | NOT_IMPLEMENTED |
| Pricing / FX / bulk / auto / history | pricing routes | Placeholder | NOT_IMPLEMENTED |
| Finance (all) | finance routes | Placeholder | NOT_IMPLEMENTED |
| Reports (all) | `/reports/*` | Placeholder | NOT_IMPLEMENTED |
| Audit log | `/audit-log` | Placeholder | NOT_IMPLEMENTED |
| Settings (all) | `/settings/*` | Placeholder | NOT_IMPLEMENTED |
| i18n runtime | shell language controls | EN/AR + RTL/LTR prefs | PARTIALLY_IMPLEMENTED / IMPLEMENTED_UNVERIFIED (direction) |
| Auth / Backend / APIs / DB / Tests | — | Absent | NOT_IMPLEMENTED |

---

## 6. Status counts (baseline)

Approximate counts from this matrix (including governance/process rows):

| Status | Approx. count | Notes |
|--------|---------------|-------|
| `VERIFIED` | 4 | Governance process clauses only (CR rules / warranty exclusion text preserved / support exclusion encoded) — **no business workflow verified** |
| `IMPLEMENTED_UNVERIFIED` | 1 | RTL/LTR direction plumbing |
| `PARTIALLY_IMPLEMENTED` | ~55 | Dashboard, suppliers, thin products/POs/low-stock/i18n/docs, role shells |
| `NOT_IMPLEMENTED` | majority | Placeholder modules + missing backend workflows |
| `BLOCKED` | 1+ | API testing blocked by missing APIs |
| `NOT_INSPECTED` | several | Commercial/deployment/phase schedule items |
| `CONFLICT_DETECTED` | tracked in §3 | CF-01 … CF-12 |

**No business acceptance criterion is `VERIFIED` in this baseline.**

---

## 7. Maintenance instructions

When implementing or verifying a requirement:

1. Locate the `TA-*` ID(s).  
2. Update **Current Status**, **Verification**, **Related Files**, and **Notes**.  
3. Resolve or add **Conflict** rows if needed.  
4. Never edit the contractual text in `TECHNICAL_ANNEX.md` to match the code.  
5. If a written CR changes scope, add a separate CR note and keep original annex IDs for historical requirements.
