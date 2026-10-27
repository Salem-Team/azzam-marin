#!/usr/bin/env node
/**
 * One-shot generator for docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md
 * Source IDs: docs/REQUIREMENTS_TRACEABILITY.md
 * Audit refresh: 2026-10-21
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = fs.readFileSync(
  path.join(root, "docs/REQUIREMENTS_TRACEABILITY.md"),
  "utf8",
);

const rows = [];
for (const line of text.split("\n")) {
  if (!line.startsWith("| TA-")) continue;
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  if (cells.length < 6) continue;
  const [id, section, req, module, status, verification, files, notes] = cells;
  rows.push({
    id,
    section,
    req,
    module,
    status,
    verification,
    files: files || "—",
    notes: notes || "",
  });
}

const map = {
  VERIFIED: "PASS",
  PARTIALLY_IMPLEMENTED: "PARTIAL",
  NOT_IMPLEMENTED: "MISSING",
  IMPLEMENTED_UNVERIFIED: "NOT_TESTED",
  BLOCKED: "BLOCKED",
  NOT_INSPECTED: "NOT_TESTED",
};

const blockedIds = new Set([
  "TA-DEL-DB",
  "TA-DEL-BE",
  "TA-DEL-API",
  "TA-QA-12",
  "TA-BK-01",
  "TA-BK-02",
  "TA-BK-03",
  "TA-BK-04",
  "TA-PERF-01",
  "TA-PERF-02",
  "TA-SEC-07",
  "TA-IP-01",
]);

const notRequiredIds = new Set(["TA-BK-05", "TA-HOST-01", "TA-PERF-04"]);

const backendDepIds = new Set([
  ...blockedIds,
  "TA-SEC-01",
  "TA-SEC-02",
  "TA-SEC-03",
  "TA-SEC-04",
  "TA-SEC-05",
  "TA-SEC-06",
  "TA-RBAC-01",
  "TA-AC-01",
  "TA-AC-22",
  "TA-AC-23",
  "TA-HW-01",
  "TA-HW-02",
  "TA-HW-03",
  "TA-AC-25",
  "TA-DEL-BC",
  "TA-DEL-IPR",
  "TA-DEL-BPR",
  "TA-DEL-BK",
  "TA-07-03",
  "TA-07-04",
  "TA-07-05",
  "TA-07-06",
  "TA-07-07",
  "TA-07-08",
  "TA-07-09",
  "TA-10-04-01",
  "TA-10-04-02",
  "TA-10-04-03",
  "TA-34-01",
  "TA-34-02",
  "TA-34-03",
  "TA-34-04",
  "TA-35-19",
  "TA-36-14",
]);

function priorityFor(id, module, st) {
  if (id.startsWith("TA-AC-") || id === "TA-SEC-01" || id === "TA-RBAC-01")
    return "P0";
  if (
    ["Auth", "Authz", "Users", "Users/RBAC", "Platform"].includes(module) &&
    st === "MISSING"
  )
    return "P0";
  if (
    [
      "Products",
      "Suppliers",
      "Purchasing",
      "Inventory",
      "Warehouses",
      "Customers",
      "Sales",
      "Dashboard",
      "i18n",
      "Import",
      "Import Costs",
      "Engines",
      "Pricing",
      "Exchange Rates",
      "Bulk Pricing",
      "Auto Repricing",
      "Price History",
      "Finance",
      "Cashboxes",
      "Banks",
      "AR",
      "AP",
      "Reports",
      "Cross Reference",
      "Audit",
      "Hardware",
      "Backup",
    ].includes(module)
  )
    return "P1";
  if (
    id.startsWith("TA-35-") ||
    id.startsWith("TA-36-") ||
    id.startsWith("TA-27-") ||
    id.startsWith("TA-28-") ||
    id.startsWith("TA-29-") ||
    id.startsWith("TA-30-") ||
    id.startsWith("TA-31-") ||
    id.startsWith("TA-32-") ||
    id.startsWith("TA-33-") ||
    id.startsWith("TA-34-")
  )
    return "P1";
  if (["QA", "Delivery", "Docs", "Governance", "Commercial", "Ops"].includes(module))
    return "P2";
  if (st === "NOT_REQUIRED") return "P3";
  return "P2";
}

const overrides = {
  "TA-QA-08": {
    status: "PARTIAL",
    evidence:
      "`npm test` 46/46 pass (2026-10-21); supplier-domain unit tests only",
    missing: "Full annex Supplier Testing + E2E browser suite",
    next: "Keep supplier tests green; expand when next module lands",
  },
  "TA-07-01": {
    status: "PARTIAL",
    evidence:
      "`/suppliers`, `/suppliers/[id]`; SUPPLIER_MODULE_VERIFICATION.md",
    missing: "Server-backed AP ledger/history",
    next: "Maintain; wire APIs when backend exists",
  },
  "TA-07-02": {
    status: "PARTIAL",
    evidence: "Wizard/form/validation + localStorage; 46 tests",
    missing: "Multi-user DB persistence",
    next: "API contract for supplier master",
  },
  "TA-AC-11": {
    status: "PARTIAL",
    evidence: "Supplier frontend provisionally accepted (frontend phase)",
    missing: "Production AP/RBAC",
    next: "Do not reopen unless regression",
  },
  "TA-DEL-SUP": {
    status: "PARTIAL",
    evidence: "Deepest frontend module",
    missing: "Backend deliverable",
    next: "Backend supplier APIs",
  },
  "TA-LANG-03": {
    status: "NOT_TESTED",
    evidence: "preferences + dir; supplier viewport QA AR/EN documented",
    missing: "Full visual QA on all future modules",
    next: "Viewport QA per module delivery",
  },
  "TA-12-13": {
    status: "PARTIAL",
    evidence: "DateRangeFilter on dashboard welcome",
    missing: "KPI/chart recompute from committed range",
    next: "Wire dashboard data to period",
  },
  "TA-TRN-03": {
    status: "PASS",
    evidence: "PROJECT_COMPLIANCE_RULES + annex text",
    missing: "—",
    next: "Preserve governance",
  },
  "TA-SCOPE-01": {
    status: "PASS",
    evidence: "TECHNICAL_ANNEX + compliance rules",
    missing: "—",
    next: "Preserve",
  },
  "TA-SCOPE-02": {
    status: "PASS",
    evidence: "PROJECT_COMPLIANCE_RULES §9",
    missing: "—",
    next: "Preserve",
  },
  "TA-WAR-02": {
    status: "PASS",
    evidence: "Annex warranty exclusions preserved",
    missing: "—",
    next: "Preserve",
  },
};

function needsBackend(id, module, notes) {
  if (backendDepIds.has(id)) return "Yes";
  if (["Backend", "Auth", "Authz", "Backup", "Hardware", "Ops"].includes(module))
    return "Yes";
  if (
    /posting|API|database|Prisma|server|multi-user|HTTPS|concurrent|100,?000|authorization|RBAC|backup|printer|scanner/i.test(
      notes || "",
    )
  )
    return "Yes";
  if (
    ["Finance", "AR", "AP", "Cashboxes", "Banks"].includes(module)
  )
    return "Yes (posting)";
  if (
    [
      "Pricing",
      "Exchange Rates",
      "Bulk Pricing",
      "Auto Repricing",
      "Price History",
      "Import Costs",
      "Inventory",
      "Warehouses",
      "Sales",
      "Invoices",
      "Quotations",
    ].includes(module)
  )
    return "Yes (for production)";
  if (
    ["Suppliers", "Dashboard", "i18n", "Products", "Purchasing"].includes(module)
  )
    return "Partial (UI now; APIs later)";
  if (["Governance", "Commercial", "Docs", "Delivery", "QA"].includes(module))
    return "No / process";
  return "Partial";
}

function esc(s, n = 120) {
  return String(s || "")
    .replace(/\|/g, "/")
    .slice(0, n);
}

const out = rows.map((r) => {
  let st = map[r.status] || "MISSING";
  if (notRequiredIds.has(r.id)) st = "NOT_REQUIRED";
  else if (blockedIds.has(r.id)) st = "BLOCKED";
  const ov = overrides[r.id];
  if (ov) st = ov.status;
  const prio = priorityFor(r.id, r.module, st);
  const be = needsBackend(r.id, r.module, r.notes);
  const evidence =
    ov?.evidence ||
    r.verification + (r.files && r.files !== "—" ? `; ${r.files}` : "");
  const missing =
    ov?.missing ||
    (st === "PASS" || st === "NOT_REQUIRED"
      ? "—"
      : st === "BLOCKED"
        ? "Requires backend/infra outside frontend-only scope"
        : st === "PARTIAL"
          ? r.notes || "Documented gap vs annex"
          : "Not implemented");
  const deps =
    r.module === "Purchasing"
      ? "Suppliers, Products"
      : r.module === "Import Costs"
        ? "Import shipments, Products, PO"
        : r.module === "Sales"
          ? "Customers, Products, Inventory"
          : "—";
  const next =
    ov?.next ||
    (st === "PASS"
      ? "Maintain"
      : st === "NOT_REQUIRED"
        ? "No action"
        : st === "BLOCKED"
          ? "Document API/infra contract; defer implementation"
          : st === "PARTIAL"
            ? "Close documented frontend gaps; do not claim production complete"
            : st === "NOT_TESTED"
              ? "Run verification against acceptance criteria"
              : "Implement frontend workflow per roadmap priority");
  return { ...r, st, prio, be, evidence, missing, deps, next };
});

const counts = {};
for (const r of out) counts[r.st] = (counts[r.st] || 0) + 1;
const denom = out.filter(
  (r) => r.st !== "NOT_REQUIRED" && r.st !== "BLOCKED",
).length;
const pass = counts.PASS || 0;
const partial = counts.PARTIAL || 0;
const missing = counts.MISSING || 0;
const notTested = counts.NOT_TESTED || 0;
const blocked = counts.BLOCKED || 0;
const notReq = counts.NOT_REQUIRED || 0;
const strict = ((100 * pass) / denom).toFixed(1);
const weighted = ((100 * (pass + 0.5 * partial)) / denom).toFixed(1);

const feRows = out.filter(
  (r) =>
    !["Backend", "Commercial", "Delivery", "Ops"].includes(r.module) &&
    r.st !== "NOT_REQUIRED",
);
const feDenom = feRows.filter((r) => r.st !== "BLOCKED").length;
const fePass = feRows.filter((r) => r.st === "PASS").length;
const fePartial = feRows.filter((r) => r.st === "PARTIAL").length;
const feWeighted = ((100 * (fePass + 0.5 * fePartial)) / feDenom).toFixed(1);

const navRoutes = [
  ["/dashboard", "Dashboard", "PARTIAL", "Rich mock KPIs/charts; DateRangeFilter not wired to data"],
  ["/products", "Products", "MISSING", "ModulePlaceholder"],
  ["/products/[partNumber]", "Products", "PARTIAL", "Thin mock detail from mock-products.ts"],
  ["/marine-engines", "Engines", "MISSING", "ModulePlaceholder"],
  ["/cross-reference", "Cross Reference", "MISSING", "ModulePlaceholder"],
  ["/warehouses", "Warehouses", "MISSING", "ModulePlaceholder"],
  ["/stock-movements", "Inventory", "MISSING", "ModulePlaceholder"],
  ["/stock-transfers", "Inventory", "MISSING", "ModulePlaceholder"],
  ["/stock-adjustments", "Inventory", "MISSING", "ModulePlaceholder"],
  ["/stocktaking", "Inventory", "MISSING", "ModulePlaceholder"],
  ["/low-stock", "Inventory", "PARTIAL", "Static mock table; no DateRangeFilter"],
  ["/suppliers", "Suppliers", "PARTIAL", "Directory CRUD + localStorage; provisionally accepted frontend phase"],
  ["/suppliers/[id]", "Suppliers", "PARTIAL", "Detail tabs, demo ledger/docs"],
  ["/purchase-orders", "Purchasing", "PARTIAL", "Mock list; DateRangeFilter UI not filtering"],
  ["/purchase-orders/[id]", "Purchasing", "PARTIAL", "Thin header detail; no line items"],
  ["/purchases/[id]", "Purchasing", "PARTIAL", "Supplier-linked mock purchase record"],
  ["/supplier-payments/[id]", "Purchasing/AP", "PARTIAL", "Supplier-linked mock payment record"],
  ["/goods-receipts", "Purchasing", "MISSING", "ModulePlaceholder"],
  ["/import-shipments", "Import", "MISSING", "ModulePlaceholder"],
  ["/import-costs", "Import Costs", "MISSING", "ModulePlaceholder"],
  ["/customers", "Customers", "MISSING", "ModulePlaceholder"],
  ["/quotations", "Sales", "MISSING", "ModulePlaceholder"],
  ["/sales-invoices", "Sales", "MISSING", "ModulePlaceholder"],
  ["/sales-returns", "Sales", "MISSING", "ModulePlaceholder"],
  ["/price-lists", "Pricing", "MISSING", "ModulePlaceholder"],
  ["/exchange-rates", "Exchange Rates", "MISSING", "ModulePlaceholder"],
  ["/bulk-price-updates", "Bulk Pricing", "MISSING", "ModulePlaceholder"],
  ["/automatic-repricing", "Auto Repricing", "MISSING", "ModulePlaceholder"],
  ["/price-history", "Price History", "MISSING", "ModulePlaceholder"],
  ["/finance", "Finance", "MISSING", "ModulePlaceholder"],
  ["/cashboxes", "Cashboxes", "MISSING", "ModulePlaceholder"],
  ["/bank-accounts", "Banks", "MISSING", "ModulePlaceholder"],
  ["/receipts-payments", "Finance", "MISSING", "ModulePlaceholder"],
  ["/customer-balances", "AR", "MISSING", "ModulePlaceholder"],
  ["/supplier-balances", "AP", "MISSING", "ModulePlaceholder"],
  ["/reports/sales", "Reports", "MISSING", "ModulePlaceholder"],
  ["/reports/inventory", "Reports", "MISSING", "ModulePlaceholder"],
  ["/reports/purchasing-import", "Reports", "MISSING", "ModulePlaceholder"],
  ["/reports/profit", "Reports", "MISSING", "ModulePlaceholder"],
  ["/reports/financial", "Reports", "MISSING", "ModulePlaceholder"],
  ["/audit-log", "Audit", "MISSING", "ModulePlaceholder"],
  ["/settings/users", "Users", "MISSING", "ModulePlaceholder"],
  ["/settings/company", "Settings", "MISSING", "ModulePlaceholder"],
  ["/settings/document-numbering", "Settings", "MISSING", "ModulePlaceholder"],
  ["/settings/languages", "Settings", "MISSING", "ModulePlaceholder (runtime language switch exists in shell)"],
  ["/settings/hardware", "Hardware", "MISSING", "ModulePlaceholder"],
  ["/settings/backup", "Backup", "MISSING", "ModulePlaceholder"],
  ["/", "Platform", "PASS", "Redirects to /dashboard"],
];

const md = [];
md.push("# Technical Annex Compliance Matrix — AZZAM MARINE ERP");
md.push("");
md.push(
  "> **Purpose:** Permanent, evidence-based requirements compliance matrix for the full annex.",
);
md.push(
  "> **Contract source:** [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) (found in repository; Arabic original authoritative).",
);
md.push(
  "> **ID registry (companion):** [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md)",
);
md.push(
  "> **Process:** [`PROJECT_COMPLIANCE_RULES.md`](./PROJECT_COMPLIANCE_RULES.md)",
);
md.push(
  "> **Roadmap:** [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md)",
);
md.push("> **Audit date:** 2026-10-21");
md.push(
  "> **Scope of this audit:** Frontend-only Next.js application. No Prisma, no `src/app/api`, no server auth.",
);
md.push("");
md.push("---");
md.push("");
md.push("## 1. Executive summary");
md.push("");
md.push(
  "The technical annex **is present** in the repository and was used as the sole contractual source. The app shell exposes **8 navigation groups / 42 items** with routes for nearly the full annex surface, but **38 of 42 primary nav destinations** are `ModulePlaceholder` (“coming soon”) shells.",
);
md.push("");
md.push(
  "**Supplier Management** is the only deep frontend module and is **provisionally accepted for the current frontend phase** (46/46 unit tests, lint/typecheck/build green, Playwright viewport smoke documented). Master data persists in browser `localStorage` / IndexedDB; purchase/payment/statement history remains **demo/mock** — not production AP.",
);
md.push("");
md.push("| Metric | Value | Rule |");
md.push("|--------|------:|------|");
md.push(
  `| Annex requirements traced (\`TA-*\`) | ${out.length} | From annex via REQUIREMENTS_TRACEABILITY |`,
);
md.push(`| PASS | ${pass} | Implemented and verified |`);
md.push(`| PARTIAL | ${partial} | Some implementation; documented gap |`);
md.push(`| MISSING | ${missing} | Required; not implemented |`);
md.push(
  `| NOT_TESTED | ${notTested} | Exists or process; inadequate verification |`,
);
md.push(
  `| BLOCKED | ${blocked} | Cannot complete in frontend-only scope |`,
);
md.push(
  `| NOT_REQUIRED | ${notReq} | Explicitly commercial/constraint clauses |`,
);
md.push(
  `| **Strict annex completion (PASS only)** | **${strict}%** | PASS ÷ (all − NOT_REQUIRED − BLOCKED) |`,
);
md.push(
  `| **Weighted progress (PASS=1, PARTIAL=0.5)** | **${weighted}%** | Same denominator; **not** production readiness |`,
);
md.push(
  `| **Frontend-scoped weighted progress** | **${feWeighted}%** | Excludes Backend/Delivery/Commercial/Ops modules |`,
);
md.push(
  "| Production readiness | **0% claimed** | No auth, DB, APIs, or multi-user persistence |",
);
md.push(
  "| Supplier frontend phase (module QA) | Provisionally accepted | See SUPPLIER_MODULE_VERIFICATION.md |",
);
md.push("");
md.push(
  "**Do not treat route shells, placeholders, or demo screens as completed operational workflows.** BLOCKED and NOT_TESTED are not counted as completed.",
);
md.push("");
md.push("### Key conflicts (still open)");
md.push("");
md.push("| ID | Issue |");
md.push("|----|-------|");
md.push("| CF-01 | No login while acceptance requires تسجيل الدخول |");
md.push("| CF-02 | Nav `permissionKey` ≠ real RBAC |");
md.push("| CF-03 | Backend / Database / APIs absent |");
md.push("| CF-04 | Backup placeholder; no daily backup/restore |");
md.push("| CF-05 | Hardware settings placeholder |");
md.push("| CF-06 | Pricing/FX routes placeholders |");
md.push("| CF-07 | Import cost multi-method allocation absent |");
md.push("| CF-08 | System audit log placeholder |");
md.push("| CF-09 | Supplier ledger/AP is demo, not posting |");
md.push("| CF-10 | Dashboard DateRangeFilter does not recompute KPIs |");
md.push("| CF-11 | Global search searches nav, not SKU/OEM/barcode |");
md.push("| CF-12 | Nav coverage ≠ requirement completion |");
md.push("");
md.push("---");
md.push("");
md.push("## 2. Status vocabulary");
md.push("");
md.push("| Status | Meaning | Counts as complete? |");
md.push("|--------|---------|---------------------|");
md.push("| PASS | Implemented and verified with evidence | Yes |");
md.push(
  "| PARTIAL | Some implementation; documented gap | No (0.5 in weighted only) |",
);
md.push("| MISSING | Required functionality not implemented | No |");
md.push(
  "| NOT_TESTED | Implementation/process exists; inadequate verification | No |",
);
md.push(
  "| BLOCKED | Cannot be completed in current frontend-only scope | No |",
);
md.push(
  "| NOT_REQUIRED | Explicitly not a product feature (commercial/constraint) | Excluded from denominator |",
);
md.push("");
md.push(
  "Priority: **P0** critical/acceptance blockers · **P1** core annex workflows · **P2** integration/QA/usability · **P3** optional/non-feature.",
);
md.push("");
md.push("---");
md.push("");
md.push("## 3. Audit evidence log");
md.push("");
md.push("| Check | Command / method | Result (2026-10-21) |");
md.push("|-------|------------------|---------------------|");
md.push(
  "| Unit tests | `npm test` | **46 pass / 0 fail** (8 suites, all supplier-domain) |",
);
md.push("| Lint | `npm run lint` | Pass |");
md.push("| Typecheck | `npm run typecheck` | Pass |");
md.push("| Build | `npm run build` | Pass (Next.js 16) |");
md.push("| Nav scope | `navigation.ts` | **42** leaf items / 8 groups |");
md.push("| Placeholder routes | grep `ModulePlaceholder` | **38** primary pages |");
md.push(
  "| Non-placeholder ERP pages | page inspection | dashboard, suppliers (+detail), PO list/detail, purchases/[id], supplier-payments/[id], products/[partNumber], low-stock |",
);
md.push("| Backend | filesystem | **No** `src/app/api`, **no** Prisma |");
md.push(
  "| Auth | code search | **No** login/access-denied routes; demo user in `mock-shell.ts` |",
);
md.push(
  "| Supplier viewport QA | `scripts/supplier-viewport-qa.mjs` (documented) | Prior run accepted from docs; **not re-run in this audit session** |",
);
md.push(
  "| Full app browser QA | — | **Not claimed** for non-supplier modules |",
);
md.push("");
md.push("### Unverified assumptions");
md.push("");
md.push(
  "- Playwright viewport results for suppliers are accepted from existing documentation; not re-executed in this audit turn.",
);
md.push(
  "- Design-system EN/AR parity outside suppliers/dashboard/shell was not visually re-labbed page-by-page.",
);
md.push(
  "- Concurrent-user and 100k-item performance cannot be validated without backend + representative data.",
);
md.push("");
md.push("### Missing source documents");
md.push("");
md.push(
  "- None for the annex: `docs/TECHNICAL_ANNEX.md` is present and complete through §36.",
);
md.push(
  "- No separate original PDF/DOCX annex was found; markdown annex is treated as the project’s contractual copy.",
);
md.push("");
md.push("---");
md.push("");
md.push("## 4. Module inventory (routes)");
md.push("");
md.push("| Route | Module | Frontend status | Evidence / notes |");
md.push("|-------|--------|-----------------|------------------|");
for (const [route, mod, st, note] of navRoutes) {
  md.push(`| \`${route}\` | ${mod} | ${st} | ${note} |`);
}
md.push("");
md.push("---");
md.push("");
md.push("## 5. Demo-data & frontend-persistence inventory");
md.push("");
md.push("| Asset | Kind | Used by | Production claim allowed? |");
md.push("|-------|------|---------|---------------------------|");
md.push(
  "| `src/config/mock-dashboard.ts` | Static mock | Dashboard, PO list | No |",
);
md.push(
  "| `src/config/mock-products.ts` | Static mock | Product detail, low-stock links | No |",
);
md.push(
  "| `src/config/mock-supplier-ledger.ts` | Static mock ledger | Supplier PO/purchase/payment/statement | No |",
);
md.push(
  "| `src/config/mock-supplier-analytics.ts` | Static mock charts | Supplier overview | No |",
);
md.push(
  "| `src/config/mock-shell.ts` | Demo user/session chrome | Shell | No |",
);
md.push(
  "| `src/lib/suppliers/supplier-persist.ts` | localStorage adapter | Supplier master CRUD | Browser-only demo persistence |",
);
md.push(
  "| `src/lib/suppliers/supplier-documents.ts` | IndexedDB adapter | Supplier documents | Browser-only; not DMS |",
);
md.push(
  "| `src/lib/suppliers/supplier-audit.ts` | Client audit log | Supplier mutations | Not server audit (TA-34) |",
);
md.push(
  "| `src/lib/preferences.ts` + cookie mirror | Preference persistence | Theme/lang/dir/sidebar | OK for UI prefs |",
);
md.push(
  "| `src/config/permissions.ts` | Stub (`null` = show all) | Nav visibility | Not authorization |",
);
md.push("");
md.push("---");
md.push("");
md.push("## 6. RTL/LTR, responsive, accessibility, performance");
md.push("");
md.push("| Area | Finding | Status |");
md.push("|------|---------|--------|");
md.push(
  "| EN/AR dictionaries | Shell + dashboard + suppliers rich; placeholders share generic strings | PARTIAL |",
);
md.push(
  "| RTL/LTR | `dir` via preferences + boot script; zero-flicker intent | NOT_TESTED app-wide; supplier viewport documented |",
);
md.push(
  "| Responsive shell | Bottom nav + drawer patterns exist | PARTIAL (most module pages are placeholders) |",
);
md.push(
  "| Accessibility | Focus/dialog patterns in shared UI; no a11y audit suite | NOT_TESTED |",
);
md.push(
  "| Catalog search <2s / 100k items | Product search not implemented; no indexed backend | BLOCKED to verify at scale |",
);
md.push("| >20 concurrent users | No multi-user backend | BLOCKED |");
md.push("");
md.push("---");
md.push("");
md.push("## 7. Backend dependency register");
md.push("");
md.push(
  "| Capability | Frontend-safe now | Future contract needed | Cannot verify until backend |",
);
md.push(
  "|------------|-------------------|------------------------|------------------------------|",
);
md.push(
  "| Supplier master CRUD | Yes (localStorage) | `GET/POST/PATCH/DELETE /suppliers` | Multi-user consistency, authz |",
);
md.push(
  "| Supplier documents | Yes (IndexedDB) | Upload/download DMS APIs | Durability, authz |",
);
md.push(
  "| Supplier AP ledger/statement | UI + mock movements | AP postings from PO/GR/payments | Real balances, aging |",
);
md.push(
  "| Auth / RBAC | Login & access-denied **UI** can be built | Session, roles, permission matrix APIs | Real enforcement |",
);
md.push(
  "| Products / search | Catalog UI + client filters on page size | Paginated search API (OEM/PN/barcode), indexes | 100k / <2s |",
);
md.push(
  "| Inventory movements | Forms + optimistic UI | Stock ledger APIs, warehouse balances | Correct qty/value |",
);
md.push(
  "| Purchasing / import costs | Wizards + allocation **preview** UI | PO/GR/shipment/cost allocation APIs | Landed cost posting |",
);
md.push(
  "| Pricing / FX / repricing | Screens + preview calculators | FX history, price apply jobs, approval | Financial correctness |",
);
md.push(
  "| Sales / finance | Document UIs | Invoice/payment posting, cash/bank ledgers | Statements, aging, profit |",
);
md.push(
  "| Backup / hardware | Settings UX + status | Host jobs, device bridges | Real backup/print/scan |",
);
md.push(
  "| Audit log | Client-side event list (limited) | Append-only server audit | Integrity, IP, non-repudiation |",
);
md.push("");
md.push("---");
md.push("");
md.push("## 8. Full requirements matrix");
md.push("");
md.push(
  "Columns: ID · Requirement · Module · Priority · Status · Evidence · Missing · Dependencies · Backend? · Next action",
);
md.push("");

const groups = [
  ["Project definition", (r) => r.id.startsWith("TA-01-")],
  [
    "RBAC & role capabilities",
    (r) => r.id.startsWith("TA-RBAC-") || r.id.startsWith("TA-02-"),
  ],
  ["Spare parts & catalog", (r) => r.id.startsWith("TA-03-")],
  ["Marine engines", (r) => r.id.startsWith("TA-04-")],
  ["Warehouses & inventory", (r) => r.id.startsWith("TA-05-")],
  ["Purchasing & import", (r) => r.id.startsWith("TA-06-")],
  ["Suppliers", (r) => r.id.startsWith("TA-07-")],
  ["Customers", (r) => r.id.startsWith("TA-08-")],
  ["Sales", (r) => r.id.startsWith("TA-09-")],
  ["Accounting & finance", (r) => r.id.startsWith("TA-10-")],
  ["Reports", (r) => r.id.startsWith("TA-11-")],
  ["Dashboard", (r) => r.id.startsWith("TA-12-")],
  ["Hardware", (r) => r.id.startsWith("TA-HW-")],
  ["Backup", (r) => r.id.startsWith("TA-BK-")],
  ["Languages", (r) => r.id.startsWith("TA-LANG-")],
  ["Performance", (r) => r.id.startsWith("TA-PERF-")],
  ["Security", (r) => r.id.startsWith("TA-SEC-")],
  ["QA phase", (r) => r.id.startsWith("TA-QA-")],
  [
    "Training, phases, commercial, IP",
    (r) =>
      r.id.startsWith("TA-TRN-") ||
      r.id.startsWith("TA-PH-") ||
      r.id.startsWith("TA-SCOPE-") ||
      r.id.startsWith("TA-HOST-") ||
      r.id.startsWith("TA-WAR-") ||
      r.id.startsWith("TA-IP-"),
  ],
  ["Acceptance criteria (basic)", (r) => r.id.startsWith("TA-AC-")],
  ["Deliverables", (r) => r.id.startsWith("TA-DEL-")],
  ["§27 Multi-currency pricing", (r) => r.id.startsWith("TA-27-")],
  ["§28 Exchange rates", (r) => r.id.startsWith("TA-28-")],
  ["§29 Automatic repricing", (r) => r.id.startsWith("TA-29-")],
  ["§30 Bulk price updates", (r) => r.id.startsWith("TA-30-")],
  ["§31 Price history", (r) => r.id.startsWith("TA-31-")],
  ["§32 Cross reference", (r) => r.id.startsWith("TA-32-")],
  ["§33 Import cost allocation", (r) => r.id.startsWith("TA-33-")],
  ["§34 Audit log", (r) => r.id.startsWith("TA-34-")],
  ["§35 Additional acceptance", (r) => r.id.startsWith("TA-35-")],
  ["§36 In-scope confirmation", (r) => r.id.startsWith("TA-36-")],
];

const used = new Set();
for (const [title, pred] of groups) {
  const slice = out.filter(pred);
  slice.forEach((r) => used.add(r.id));
  md.push(`### ${title}`);
  md.push("");
  md.push(
    "| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |",
  );
  md.push(
    "|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|",
  );
  for (const r of slice) {
    md.push(
      `| ${r.id} | ${esc(r.req)} | ${r.module} | ${r.prio} | ${r.st} | ${esc(r.evidence)} | ${esc(r.missing, 100)} | ${esc(r.deps, 60)} | ${r.be} | ${esc(r.next, 80)} |`,
    );
  }
  md.push("");
}

const orphan = out.filter((r) => !used.has(r.id));
if (orphan.length) {
  md.push("### Other");
  md.push("");
  md.push(
    "| ID | Requirement | Module | Pri | Status | Evidence | Missing | Deps | Backend? | Next action |",
  );
  md.push(
    "|----|-------------|--------|-----|--------|----------|---------|------|----------|-------------|",
  );
  for (const r of orphan) {
    md.push(
      `| ${r.id} | ${esc(r.req)} | ${r.module} | ${r.prio} | ${r.st} | ${esc(r.evidence)} | ${esc(r.missing, 100)} | ${esc(r.deps, 60)} | ${r.be} | ${esc(r.next, 80)} |`,
    );
  }
  md.push("");
}

md.push("---");
md.push("");
md.push("## 9. Confirmed functional gaps (high signal)");
md.push("");
md.push(
  "1. **Authentication & access-denied UI** — absent (TA-AC-01, TA-SEC-01).",
);
md.push(
  "2. **Users/roles/permissions administration** — placeholder (TA-RBAC-*, TA-AC-02).",
);
md.push(
  "3. **Products list + annex item fields + catalog search** — list placeholder; detail thin; global search is nav-only (TA-03-*, TA-AC-03/04).",
);
md.push(
  "4. **Marine engines + parts linkage** — placeholder (TA-04-*, TA-AC-05/06).",
);
md.push(
  "5. **Warehouses & stock operations** — placeholders (TA-05-*, TA-AC-07–09).",
);
md.push(
  "6. **PO create/lines/qty/price** — mock list/detail only (TA-06-01-*, TA-AC-10).",
);
md.push(
  "7. **Goods receipts, shipments, import cost allocation methods** — placeholders (TA-06-02/03, TA-33-*, TA-AC-12/13).",
);
md.push(
  "8. **Customers & full sales cycle** (quote PDF/WhatsApp/email, invoices, returns) — placeholders (TA-08/09, TA-AC-14–17).",
);
md.push(
  "9. **Cashboxes, banks, receipts/payments, AR/AP balances & aging** — placeholders (TA-10-*, TA-AC-18–20).",
);
md.push("10. **Reports modules** — placeholders (TA-11-*, TA-AC-21).");
md.push(
  "11. **Pricing/FX/repricing/bulk/history** — placeholders (TA-27–31, TA-35-*).",
);
md.push("12. **Cross-reference / alternatives** — placeholder (TA-32-*).");
md.push(
  "13. **System audit log** — placeholder; supplier has client-only audit (TA-34-*).",
);
md.push(
  "14. **Backup & hardware integrations** — placeholders (TA-BK-*, TA-HW-*, TA-AC-23/25).",
);
md.push(
  "15. **Dashboard period filter → live metrics** — UI only (TA-12-13).",
);
md.push("");
md.push("---");
md.push("");
md.push("## 10. Recommended next module");
md.push("");
md.push(
  "See [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md) § Recommended next module: **Products / Spare Parts (Item Master + Search)**.",
);
md.push("");
md.push("---");
md.push("");
md.push("## 11. Maintenance");
md.push("");
md.push("1. Update this matrix when a requirement’s status changes.");
md.push(
  "2. Keep `TA-*` IDs stable; sync notes with `REQUIREMENTS_TRACEABILITY.md`.",
);
md.push("3. Never edit `TECHNICAL_ANNEX.md` to match incomplete code.");
md.push(
  "4. Frontend-only work may move MISSING → PARTIAL; production PASS for backend-dependent rows requires verified APIs/DB/authz.",
);
md.push("");
md.push("---");
md.push("");
md.push(
  `*Generated from REQUIREMENTS_TRACEABILITY.md + 2026-10-21 audit refresh. Regenerator: \`scripts/generate-compliance-matrix.mjs\`.*`,
);
md.push("");

fs.writeFileSync(
  path.join(root, "docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md"),
  md.join("\n"),
);
console.log("Wrote docs/TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md", {
  total: out.length,
  pass,
  partial,
  missing,
  notTested,
  blocked,
  notReq,
  strict,
  weighted,
  feWeighted,
});
