# Typography

## Fonts (implemented)
- Latin: **IBM Plex Sans** (`--font-app`)
- Arabic: **IBM Plex Sans Arabic** (`--font-arabic`)
- Loaded in `src/app/layout.tsx`

**MUST NOT** add Inter/Roboto/Arial as brand fonts.  
**MUST NOT** add extra font families without approval.

## Semantic classes (`src/styles/utilities.css`)
| Class | Use |
|-------|-----|
| `.am-text-page-title` | Page H1 |
| `.am-text-section-title` | Section H2 |
| `.am-text-card-title` | Card headings |
| `.am-text-body` | Body |
| `.am-text-support` | Secondary copy |
| `.am-text-label` | Labels |
| `.am-text-caption` | Captions / meta |
| `.am-text-nav` | Sidebar labels |
| `.am-text-financial` | Tabular nums for money/IDs |

## Size tokens
`--am-text-2xs` 11 → `--am-text-3xl` 24

## Rules
- **MUST** keep EN/AR visually balanced (weight, size, line-height).
- **MUST** preserve Latin OEM/part numbers in Arabic UI.
- **SHOULD** use tabular nums for finance columns.
- **MUST NOT** invent random `text-[15px]` sizes when a token/class exists.
- Uppercase tracking **SHOULD** be limited to English chrome labels; avoid forced uppercase on Arabic group titles (already handled in sidebar).
