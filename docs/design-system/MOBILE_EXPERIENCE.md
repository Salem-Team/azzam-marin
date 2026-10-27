# Mobile Experience (Mandatory)

Mobile (`<lg`) is a **premium AZZAM MARINE ERP application shell**, not a compressed website.

## Brand

Preserve Precision Marine Enterprise:

- Deep navy structure  
- Industrial blue interaction  
- White surfaces / cool page background  
- Restrained red accents  
- Lucide icons, official logo only  
- Content discipline (no filler copy)

## Mobile shell anatomy

1. **Mobile top app bar** — menu, page title, search, notifications, user  
2. **Scrollable main** — with bottom padding for fixed nav + safe area  
3. **Bottom navigation** — up to five primary destinations  
4. **Full module drawer** — “More” / menu opens the complete approved IA  

**MUST NOT** keep the desktop sidebar permanently visible on mobile.  
**MUST NOT** dump all 42 destinations into the bottom bar.

## Bottom navigation

Primary destinations (source of truth: `src/config/mobile-navigation.ts`):

| Slot | Destination | Route |
|------|-------------|-------|
| 1 | Dashboard | `/dashboard` |
| 2 | Inventory | `/products` |
| 3 | Sales | `/customers` |
| 4 | Purchasing | `/purchase-orders` |
| 5 | More | Opens mobile drawer |

“More” **MUST** expose the full centralized navigation (`src/config/navigation.ts`) via the existing drawer.  
**MUST NOT** invent routes or remove approved destinations.

Each bottom item **MUST** have: icon, concise label, selected state, ≥44px touch target, accessible name.

## Mobile drawer

- Full-height slide-over from inline-start  
- Backdrop, Escape to close, body scroll lock  
- Scrollable groups from `NAVIGATION_GROUPS`  
- Close control + clear headings  
- Correct RTL/LTR transform  

## Mobile header

Prioritize: navigation access · current page title · search · notifications · user.  
Secondary desktop chrome (breadcrumbs, extra toggles) **MUST** collapse or move into menus.  
Long titles truncate. Controls **MUST NOT** collide at 320px.  
Respect `env(safe-area-inset-*)`.

## Mobile dashboard

- KPIs: 2 columns from `sm`, 1 column when cramped  
- Charts: stack vertically; shorter chart frames; readable legends  
- Lists/tables: card or stacked rows when density requires  
- Progressive disclosure over squeezing every desktop widget  

## Safe areas & viewport

- Use `dvh` / safe-area insets for fixed chrome  
- Main content **MUST** clear the bottom nav (`--am-bottom-nav-height` + inset)  
- Forms remain usable with virtual keyboards  
- Fixed chrome **MUST NOT** cover the last interactive control  

## Motion

Drawer: 220–280ms (`--am-duration-drawer`).  
Bottom sheet / sheet-like panels: 180–260ms.  
Respect `prefers-reduced-motion`. See [MOTION_AND_TRANSITIONS.md](./MOTION_AND_TRANSITIONS.md).
