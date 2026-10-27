# Accessibility

Target: practical **WCAG 2.2 AA-oriented** behavior.

## MUST
- Semantic HTML (`nav`, `main`, `button`, `dialog`)  
- Keyboard operability for all chrome controls  
- Visible `:focus-visible` rings (`--am-focus-ring`)  
- Accessible names on icon-only buttons  
- `aria-expanded` / `aria-current` where applicable  
- Escape closes overlays  
- Contrast sufficient for text on navy and white  
- Touch targets ≥ ~36px for primary chrome controls  
- Respect reduced motion  
- Navigable data rows: accessible name identifying the record; Enter/Space (or link) opens details; nested controls keep independent activation — see [DATA_DENSE_INTERFACES.md](./DATA_DENSE_INTERFACES.md) § Data row navigation

## SHOULD
- Announce dialog titles  
- Keep focus order logical in RTL  
- Prefer text + icon over color-only status

## MUST NOT
- Hover-only essential actions  
- Color-only active route indication (use indicator + weight/bg)  
- Fake “success” for operations that did not run

## Manual checks
Tab through topbar + sidebar · open search with Ctrl/Cmd+K · Esc · screen reader spot-check labels.
