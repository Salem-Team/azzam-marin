# RTL and Localization

## Languages
- English → `dir=ltr`  
- Arabic → `dir=rtl`  
Applied on `documentElement` and shell root (`LocaleProvider`).

Persisted via `azzam-marine:preferences:v1` + cookie mirror.  
**MUST** initialize `lang` / `dir` before first paint (boot script + SSR cookie) — see [FRONTEND_ENGINEERING_STANDARDS.md](./FRONTEND_ENGINEERING_STANDARDS.md) § Persistent Preferences & Zero-Flicker Initialization.

## MUST
- Logical CSS (`start`/`end`, `ms`/`me`, `ps`/`pe`, `text-start`)  
- Sidebar at inline-start  
- Drawer docks to `start-0`; closed transform mirrors by direction  
- Chevron/collapse icons flip meaningfully  
- Dropdowns align with `end-0` / `start-0` logically  
- Breadcrumb separators direction-aware  
- Translations from `src/i18n/` only

## MUST NOT
- `text-align: right` as the only RTL strategy  
- Hardcoded `left`/`right` for chrome layout  
- English-only empty states on Arabic UI

## Mixed content
OEM numbers, SKUs, serials, emails stay Latin.  
Currency/numbers: use tabular nums where aligned in tables.

## Verify
Expanded/collapsed sidebar · header · search dialog · menus · drawer — both locales.
