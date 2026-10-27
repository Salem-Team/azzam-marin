# Date & Time Formatting (MUST)

**Status:** Mandatory product standard  
**Authoritative helpers:** `src/lib/format.ts`  
**Cursor rule:** `.cursor/rules/date-time-12h.mdc`

## Clock (MUST)

- **Always use a 12-hour clock** in every UI surface (EN and AR).
- English: `am` / `pm` (locale `en-GB` / product helper).
- Arabic: `ص` / `م` via `ar-EG`.
- **MUST NOT** use 24-hour time (`14:30`, `hour12: false`, or locale defaults that emit 24h).

## Shared helpers (MUST)

| Helper | Use for |
|--------|---------|
| `formatIsoDate(iso, locale)` | Calendar date only (`YYYY-MM-DD` or date part) |
| `formatTime(value, locale)` | Clock time only — always `hour12: true` |
| `formatDateTime(value, locale, opts?)` | Date + time — always `hour12: true` |
| `localeTag(locale)` | `ar-EG` / `en-GB` for `Intl` |

## MUST

- Format user-visible dates/times through `src/lib/format.ts` (or thin wrappers that call it).
- Keep timestamps `dir="ltr"` when mixed into Arabic copy so digits/am-pm stay stable.
- Prefer ISO strings in data; format only at display time.

## MUST NOT

- Call `toLocaleString` / `toLocaleTimeString` / raw `Intl.DateTimeFormat` with clock fields in components.
- Invent per-module formatters that bypass `hour12: true`.
- Store localized prose timestamps in persistence — store ISO, display via helpers.

## Examples

```ts
import { formatDateTime, formatIsoDate, formatTime } from "@/lib/format";

formatIsoDate("2026-10-21", locale);           // 21 Oct 2026
formatTime("2026-10-21T22:04:00.000Z", locale); // 10:04 pm / ١٠:٠٤ م
formatDateTime(iso, locale);                   // 21 Oct 2026, 10:04 pm
```

## Related

- Date **range** picker (period filter): `RESPONSIVE_COMPONENTS.md` § Date range picker — calendar dates only; no clock.
- Activity timelines: use `formatTime` / `formatDateTime` (see supplier activity).
