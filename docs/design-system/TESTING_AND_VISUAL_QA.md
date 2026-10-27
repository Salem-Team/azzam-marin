# Testing and Visual QA

## Automated (exists)
| Command | Enforces |
|---------|----------|
| `npm run lint` | ESLint / React hooks |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production compile + routes |

These **do not** fully enforce design tokens or visual QA.

## Manual visual checklist (shell)
- [ ] Dashboard  
- [ ] Sidebar expanded + one group  
- [ ] Sidebar collapsed  
- [ ] Header breadcrumbs/search/lang/user  
- [ ] Arabic RTL  
- [ ] English LTR  
- [ ] Mobile drawer  
- [ ] Reduced motion (OS setting) spot-check  

## Motion QA
- No bounce · drawer ≤ ~280ms feel · nav not blocked by animation  

## RTL QA
- Logical alignment · menus · search dialog · chevrons  

## Claiming results
**MUST NOT** claim a check passed unless it ran.  
**MUST NOT** claim visual testing without inspecting the UI.
