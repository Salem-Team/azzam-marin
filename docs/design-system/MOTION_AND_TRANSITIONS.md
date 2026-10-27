# Motion and Transitions

## Goal
Premium, calm feedback — **not** marketing motion.

## Duration tokens (MUST)
| Token | Target | Use |
|-------|--------|-----|
| `--am-duration-instant` | ~120ms | Press/hover color |
| `--am-duration-fast` | ~160ms | Tooltips, small fades |
| `--am-duration-normal` | ~200ms | Dropdowns, standard |
| `--am-duration-drawer` | ~240ms | Mobile drawer |
| `--am-duration-layout` | ~260ms | Sidebar width |

## Easing
- Standard: `--am-ease-standard` `cubic-bezier(0.2, 0, 0, 1)`  
- Enter: `--am-ease-enter`  
- Exit: `--am-ease-exit`

## Utility classes
`.am-transition-colors`, `.am-transition-transform`, `.am-transition-layout`, `.am-transition-drawer`

## Allowed
Sidebar width, group expand (grid rows), drawer slide, dialog opacity/transform, dropdown fade, button color.

## Forbidden
- Bounce/elastic on business chrome  
- Parallax  
- Per-row table entrance animations on ordinary render  
- Blocking navigation until animation ends  
- Animating everything “for polish”  
- Neon glow or metallic light effects copied from the logo  
- Logo-style bloom as a global UI effect

## Reduced motion
Tokens collapse to ~1ms under `prefers-reduced-motion`.  
Global CSS also short-circuits transitions.  
**MUST** preserve state clarity without spatial motion.
