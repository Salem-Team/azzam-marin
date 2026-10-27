# Content Discipline (Mandatory)

## Rule
**MUST NOT** add unnecessary descriptions beneath titles, headings, navigation items, or sections.

The product is an operational ERP. Clarity comes from structure and data — not filler copy.

## Default patterns (MUST)

### Page header
- One clear title.
- Breadcrumbs only when useful (shell topbar).
- Primary / secondary actions only when needed.
- **MUST NOT** add a subtitle that restates the title or page purpose.

### Section
- One concise heading.
- Optional contextual action.
- Description **only** when it prevents errors or explains a consequential workflow.

### Card
- Clear heading + relevant content.
- Supporting text only when required to interpret data.

### Navigation
- Concise labels only.
- **MUST NOT** place descriptions under nav items or group titles.

### Forms
- Clear labels.
- Short validation messages.
- Helper text only when genuinely necessary.

### Tables
- Column headers.
- **MUST NOT** add explanatory paragraphs above ordinary tables.

### Dashboards
- Concise KPI labels and values.
- **MUST NOT** add marketing intros or redundant section blurbs.

## Allowed exceptions (MAY)
Descriptions **MAY** exist when they:
1. Prevent a costly user error.
2. Explain a destructive or irreversible action.
3. Provide essential accessibility context.
4. Clarify that content is mock/demo (briefly, once, near the mock surface).

## Forbidden
- Marketing-style copy on operational screens.
- Repeating the same fact in title + subtitle + card + tooltip.
- Filling empty space with paragraphs.
- Auto-generating description fields because a template has a `description` prop.

## Verification
1. Remove the description. Does comprehension still hold for a trained operator? → Keep it removed.  
2. If not, rewrite to one short, actionable sentence — never a paragraph of context fluff.
