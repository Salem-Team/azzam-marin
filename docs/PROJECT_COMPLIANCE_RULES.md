# Project Compliance Rules — AZZAM MARINE ERP

> **Authority:** These rules bind all current and future development to [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md).  
> **Traceability:** Implementation status lives in [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md).  
> **Full-system audit matrix:** [`TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md`](./TECHNICAL_ANNEX_COMPLIANCE_MATRIX.md).  
> **Frontend roadmap:** [`FRONTEND_IMPLEMENTATION_ROADMAP.md`](./FRONTEND_IMPLEMENTATION_ROADMAP.md).  
> **Design system:** Visual/UX rules remain in [`docs/design-system/`](./design-system/README.md) and must not contradict the annex.

---

## 1. Purpose

The Technical Annex is the agreed project scope. Screens, routes, mock data, and design polish do **not** redefine scope. Development may proceed frontend-first, but status reporting and acceptance claims must reflect what actually works.

---

## 2. Mandatory pre-work compliance check

Before implementing any new feature or modifying an existing module:

### STEP 1 — Identify the task

Determine the module, user workflow, requirements, and expected deliverables affected.

### STEP 2 — Read the relevant annex sections

Consult [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md). Do not rely exclusively on memory, previous prompts, screenshots, or assumptions.

### STEP 3 — Inspect the existing implementation

Inspect relevant routes, components, data structures, state management, localization, and tests.

### STEP 4 — Compare implementation against requirements

Identify missing requirements, incomplete workflows, incorrect behavior, conflicting implementations, missing acceptance criteria, and potential scope expansion.

### STEP 5 — Detect conflicts

Check whether the proposed change conflicts with:

- The technical annex
- Existing implemented behavior
- Design-system rules
- Related modules
- Financial calculations
- Data relationships
- Permissions
- Navigation
- Arabic/English behavior
- Responsive behavior

### STEP 6 — Decide how to proceed

| Situation | Action |
|-----------|--------|
| Compliant and unambiguous | Implement |
| Material conflict / contractual ambiguity | Explain the conflict; request clarification before choosing an interpretation |
| Partial safe work possible | Complete the safe portion; document the remainder |

### STEP 7 — Update traceability

Update [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md) with status, related files, verification evidence, and remaining gaps.

### STEP 8 — Verify

Run relevant checks and inspect the actual UI when appropriate. Do not claim VERIFIED without evidence.

---

## 3. Conflict detection (mandatory)

Agents and developers must proactively flag:

| Type | Rule |
|------|------|
| **A. Scope conflict** | Feature not explicitly in the annex → treat as potential Change Request; cite annex sections |
| **B. Functional conflict** | Screen/workflow differs from approved business process → identify difference and affected IDs |
| **C. Data conflict** | Fields/relationships/calculations contradict annex or model → do not invent relationships for UI theater |
| **D. Financial conflict** | USD/EGP mix without conversion rule, wrong FX, wrong landed cost / balances / profit → flag before implementing |
| **E. Pricing conflict** | Bypass of FX management, auto-repricing rules, exclusions, approval, or price history → flag |
| **F. Inventory conflict** | Ignoring warehouse stock, movements, transfers, adjustments, returns, or stocktaking → flag |
| **G. Permissions conflict** | UI exposes operations inconsistent with roles; frontend visibility ≠ real authorization |
| **H. UX / design conflict** | Violates design system, responsive rules, RTL/LTR, or navigation conventions → fix without breaking business requirements |
| **I. Acceptance conflict** | Declaring complete while acceptance criteria remain unimplemented/unverified → forbidden |

---

## 4. Governance scope

These rules apply to existing pages/components/navigation, new modules, refactors, bug fixes, responsive work, localization, financial workflows, reports/dashboards, and final delivery.

- Do not limit compliance checking to newly created files.
- When modifying a component, inspect dependencies for requirement breakage.
- Do not perform unrelated refactoring.
- Do not remove existing functionality unless authorized or required to fix a verified defect.
- When a change spans modules, update all relevant traceability rows.

---

## 5. Frontend-only implementation rule

The repository may be frontend-only at a given time.

**Allowed**

- Real UI interactions where possible
- Consistent mock data separated from UI components
- Clear distinction between mock behavior and real business processing
- Preserved future backend integration points

**Forbidden**

- Claiming backend-dependent requirements complete because UI exists
- Fabricating successful external integrations
- Claiming financial transactions are persisted when they exist only in frontend state
- Describing nav `permissionKey` stubs as real RBAC/security

The annex remains the target specification for the complete contracted system. Traceability status must reflect what exists today.

---

## 6. Verification discipline

Do **not** mark requirements `VERIFIED` merely because:

- A route exists
- A button is visible
- A placeholder page was created
- Mock data is displayed
- A component compiles
- A screenshot resembles the expected design

Examples of insufficient evidence:

- Backup button ≠ backup/restore works
- Supplier profile tab ≠ purchase history, payments, bank info, and statements work
- Price formula in UI ≠ automatic repricing, exclusions, approval, and price history work
- Stock table ≠ movements, transfers, adjustments, and stocktaking work correctly

Where inspection is impossible, record `NOT_INSPECTED` or `IMPLEMENTED_UNVERIFIED` with an explicit note.

### Status vocabulary

| Status | Meaning |
|--------|---------|
| `NOT_INSPECTED` | Not reviewed yet |
| `NOT_IMPLEMENTED` | No meaningful implementation |
| `PARTIALLY_IMPLEMENTED` | Some surface exists; workflow incomplete |
| `IMPLEMENTED_UNVERIFIED` | Appears implemented; not adequately tested |
| `VERIFIED` | Implemented and verified with recorded evidence |
| `BLOCKED` | Cannot proceed due to dependency/blocker |
| `CONFLICT_DETECTED` | Conflict with annex, design, or other modules |

---

## 7. Documentation maintenance

Whenever a relevant feature is implemented, corrected, or verified:

1. Update the corresponding traceability entry.
2. Record source files and verification performed.
3. Record remaining limitations and unresolved conflicts.

**Never** modify the original contractual requirement in [`TECHNICAL_ANNEX.md`](./TECHNICAL_ANNEX.md) to make the implementation appear compliant.

If the client explicitly approves a scope change:

- Document the approval separately
- Preserve the original annex text
- Do not treat informal technical assumptions as contractual amendments

---

## 8. Design system coexistence

Preserve and enforce the AZZAM MARINE design system (`docs/design-system/`) for:

- Brand identity and official logo
- Shell (sidebar, topbar), typography, spacing, tokens
- Cards, tables, icons, charts, dialogs
- Motion, loading/empty states, accessibility
- Desktop / tablet / mobile, AR RTL / EN LTR
- Persistent preferences, responsive distribution, record navigation, full-height behavior
- Shared `DateRangeFilter` on dashboard and dense list modules (suppliers / inventory / purchasing / sales) — never on record/detail pages

Do not invent a per-module visual language. Do not prioritize screenshot similarity over functional correctness. The design must support annex business workflows.

---

## 9. Change Requests

Any Module, report, integration, or material change not explicitly in the annex is a **Change Request**:

1. Technical study  
2. Schedule impact  
3. Cost impact (if any)  
4. Written approval by both parties  
5. Implementation only after approval  

Do not silently absorb out-of-scope work into the 45-working-day delivery commitment.

---

## 10. Agent instructions (summary)

1. Read annex → inspect code → compare → detect conflicts → implement or escalate → update traceability → verify.  
2. Prefer honest `PARTIALLY_IMPLEMENTED` / `NOT_IMPLEMENTED` over optimistic completion claims.  
3. Keep mock data and UI separate; label demo/mock behavior clearly in notes.  
4. Align navigation and modules with annex scope; do not invent out-of-scope modules without CR handling.  
5. After non-trivial UI work, still follow design-system QA (`lint` / `typecheck` / `build`) without treating that as annex VERIFIED.
