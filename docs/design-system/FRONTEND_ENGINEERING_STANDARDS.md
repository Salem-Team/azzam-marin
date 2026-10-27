# Frontend Engineering Standards

## Stack (verified)
Next.js 16 · React 19 · TypeScript strict · Tailwind 4 (`@import "tailwindcss"`) · App Router · Lucide · centralized nav + i18n

## MUST
- Strict TypeScript; no casual `any`  
- Reuse `src/styles/tokens.css`  
- Client components only when interaction requires  
- Keep mock data in `src/config/` separate from presentation  
- Valid Lucide imports only  
- Single navigation config

## MUST NOT
- Backend / Prisma / API routes for UI work  
- Duplicate design languages per page  
- Unnecessary dependencies  
- Giant monolithic components  
- Unsafe assertions as shortcuts  
- Second icon library

## File organization
```
src/
  app/                 # routes
  components/layout/   # shell
  components/ui/       # shared primitives
  config/              # nav, mocks, permissions
  i18n/
  styles/              # tokens + utilities
  providers/
  lib/
  types/
```

## Naming
- Components: PascalCase files matching export  
- Tokens: `--am-*`  
- Utilities: `.am-*`

## Persistent Preferences & Zero-Flicker Initialization (MUST)

Authoritative modules:
- `src/lib/preferences.ts` — schema, validation, storage, boot script, document apply
- `src/lib/preference-store.ts` — subscribe / snapshots for React
- `src/lib/request-preferences.ts` — cookie read for App Router SSR
- `src/providers/preferences-hydrator.tsx` — seed store for hydration parity
- Providers: `theme-provider`, `locale-provider`, `shell-provider`

### Storage
| Layer | Key | Role |
|-------|-----|------|
| localStorage | `azzam-marine:preferences:v1` | Source of truth (versioned JSON) |
| Cookie | `azzam-marine-preferences` | SSR mirror for first HTML (lang/dir/theme) |
| Legacy keys | `azzam-marine-erp.*` | Migrated automatically into v1 |

Supported fields: `locale` (`en` \| `ar`), `theme` (`light` \| `dark` \| `system`), `sidebarCollapsed`, `expandedGroups`.

### Initialization sequence
1. **Blocking boot script** in root `<head>` reads v1 (or migrates legacy), validates, writes cookie, applies `lang` / `dir` / `data-theme` / `color-scheme` before first paint.
2. **Root layout** reads the cookie and renders `<html>` with matching attributes; seeds `PreferencesHydrator`.
3. **React** `useSyncExternalStore` server snapshots use the seeded values so hydration matches SSR.
4. **After mount** (`useEffect`, not `useLayoutEffect`), localStorage is re-read via `adoptClientPreferences` without mutating the frozen client `serverSeed`; cookie is refreshed; system theme listens to `prefers-color-scheme`.

### Rules
- **MUST NOT** flash default English/light before saved Arabic/dark when the request cookie matches storage.
- **MUST NOT** invent a second theme or locale provider.
- **MUST NOT** hide the whole app behind a loading gate to mask flicker.
- **MUST** update state → DOM → storage (localStorage + cookie) immediately on change.
- **MUST** treat invalid / missing / corrupt values as safe defaults without crashing.
- **MUST NOT** overwrite valid saved preferences with defaults on mount.
- **MUST NOT** mutate `get*ServerSnapshot` / frozen client `serverSeed` from localStorage sync (causes React #418 when nested islands hydrate late).
- **MUST** allow re-seeding `serverSeed` on the server per request (module state is shared across requests).
- New persistent UI settings **MUST** extend the v1 schema + boot script + cookie mirror + docs.
- `suppressHydrationWarning` on `<html>` is justified for preference attributes only.

### Testing
Arabic+dark refresh · English+light refresh · system theme OS change · navigate + refresh nested route · clear storage · invalid JSON · mobile refresh.

## Date & time formatting (MUST)

See [`DATE_AND_TIME.md`](./DATE_AND_TIME.md).

- **MUST** display clock times with a **12-hour** clock (`hour12: true`) in EN and AR.
- **MUST** use `formatTime` / `formatDateTime` / `formatIsoDate` from `src/lib/format.ts`.
- **MUST NOT** use 24-hour UI times or ad-hoc `toLocaleString` for timestamps in components.
