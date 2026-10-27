# Design Principles

**Art direction:** [BRAND_IDENTITY.md](./BRAND_IDENTITY.md) — *AZZAM MARINE — Precision Marine Enterprise*

## Mandatory principles

### A. Consistency over individual preference
**MUST** reuse tokens, shared components, and existing patterns.  
**MUST** follow one brand language across all modules — never invent a page-local look.  
**Why:** ERP trust comes from predictability.  
**Verify:** New UI matches shell spacing, type, and interaction states.

### B. Clarity over decoration
**MUST NOT** add gradients, glow, or ornament without a functional purpose.  
**Why:** Operators scan dense data under time pressure.

### B2. Content discipline (strict minimalism)
**MUST NOT** add unnecessary descriptions under page titles, section headings, cards, or navigation.  
**MUST** follow [CONTENT_DISCIPLINE.md](./CONTENT_DISCIPLINE.md).  
**Why:** Operational software rewards density and scanability, not filler copy.

### C. Information hierarchy over visual noise
**MUST** establish one primary action / focus per section.  
**Verify:** Removing borders/shadows does not destroy meaning unless interaction needs a container.

### D. Reuse over duplication
**MUST** extend shared components before creating page-local variants.  
**Why:** Divergent buttons/inputs create permanent debt.

### E. Predictable interactions
**MUST** keep hover/focus/active/disabled consistent across controls.  
**MUST NOT** invent surprising motion or layout jumps for routine actions.

### F. Accessibility by default
**MUST** meet rules in [ACCESSIBILITY.md](./ACCESSIBILITY.md).  
Keyboard, focus-visible, contrast, and names are not optional.

### G. Responsive as first-class
**MUST** support mobile drawer + adaptive header/search.  
**MUST NOT** “solve” overflow by shrinking text unreadably.

### H. RTL and LTR parity
**MUST** deliver equal quality in Arabic and English.  
**MUST** use logical properties (`start`/`end`, `ms`/`me`, `ps`/`pe`).

### I. Performance-conscious animation
**MUST** follow [MOTION_AND_TRANSITIONS.md](./MOTION_AND_TRANSITIONS.md).  
Prefer `transform`/`opacity`; respect `prefers-reduced-motion`.

### J. Explicit frontend/backend boundaries
**MUST NOT** invent APIs or pretend mock UI is authorized security.  
Label demo/mock session content clearly.

### K. Maintainability over one-off styling
**MUST NOT** scatter raw hex colors in feature pages when a token exists.  
**SHOULD** prefer semantic utilities (`.am-text-*`, motion classes).

### L. Measurable visual quality
**MUST** validate visually after non-trivial shell/UI changes (see Testing doc).
