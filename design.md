# Cheq Design System

Extracted from Figma: Multi-project (Copy)

## Color Palette

### Backgrounds (warm off-whites)
| Token    | Hex       | Usage                          |
| -------- | --------- | ------------------------------ |
| bg-base  | `#ffffff` | Primary background             |
| bg-500   | `#e7e5de` | Secondary background           |
| bg-400   | `#eceae4` | Tertiary / card surfaces       |
| bg-300   | `#f1f0eb` | Lighter surface / hover states |
| bg-200   | `#f5f5f2` | Lightest background            |

### Text/Dark
| Token     | Hex       | Usage                     |
| --------- | --------- | ------------------------- |
| text-base | `#080808` | Primary text (near-black) |
| text-500  | `#313131` | Secondary text / headings |
| text-400  | `#5a5a5a` | Tertiary text / body      |
| text-300  | `#adadad` | Muted / disabled text     |
| text-200  | `#cecece` | Placeholders              |

### Neutral Grays
| Token       | Hex       | Usage              |
| ----------- | --------- | ------------------ |
| neutral-base| `#464646` | Mid-dark gray      |
| neutral-500 | `#656565` | Medium gray        |
| neutral-400 | `#848484` | Medium-light gray  |
| neutral-300 | `#a3a3a3` | Light gray         |
| neutral-200 | `#c1c1c1` | Borders            |

### Accent Green ("Jason")
| Token      | Hex       | Usage                       |
| ---------- | --------- | --------------------------- |
| accent     | `#4BFE0C` | Primary CTA / brand accent  |
| accent-500 | `#69fe34` | Lighter green               |
| accent-400 | `#87fe5d` | Hover state                 |
| accent-300 | `#a5ff86` | Light green                 |
| accent-200 | `#DBFFCE` | Subtle green background     |

### Semantic Colors
| Color  | Base      | Light     | Usage           |
| ------ | --------- | --------- | --------------- |
| Mint   | `#5CFE9D` | `#C5FFDC` | Success         |
| Orange | `#E4813F` | `#FFDB99` | Warning/pending |
| Blue   | `#425EB9` | `#B0CCFF` | Info/links      |

### Icon Color
- `#5F6368` (Google Material gray)

## Typography

**Font:** ABC Diatype (Dinamo) — fallback: Arial, Helvetica, sans-serif
**Letter spacing:** -6% globally

| Style     | Size | Line Height |
| --------- | ---- | ----------- |
| Display   | 56px | —           |
| H1        | 40px | 50px        |
| H2        | 24px | 30px        |
| H3        | 20px | 25px        |
| Body      | 16px | 20px        |
| Button    | 15px | 19px        |
| Caption   | 13px | 16px        |
| Footnote  | 11px | 14px        |

**Weight:** Bold is the primary weight.

## Spacing

| Token | Value | Usage                         |
| ----- | ----- | ----------------------------- |
| xs    | 4px   | Internal micro spacing        |
| sm    | 8px   | Small gaps, icon padding      |
| md    | 16px  | Component gaps                |
| lg    | 24px  | Card padding, section sub-gap |
| xl    | 32px  | Inter-section gap             |
| 2xl   | 48px  | Major section gap             |
| 3xl   | 68px  | Page section separation       |

## Border Radius
- Pill (full): buttons, filter chips, avatars
- Medium: ~12px — cards
- Small: ~8px — inputs, dropdowns

## Component Patterns

### Buttons
- **Primary:** 40-48px height, black (#080808) fill, white text, pill radius
- **Secondary:** 40px height, outlined or subtle bg
- **Text:** 40px height, no fill, text only
- **Large CTA:** 56px height, full-width green fill

### Inputs
- 40px height, 10px horizontal padding
- Warm background fill (#f1f0eb or #eceae4)
- Subtle border or no border

### Cards
- 270px height (standard), warm bg (#eceae4 or #f1f0eb)
- Subtle dividers between sections (1px lines)

## Icons
Google Material Symbols — Outlined, weight 400, grade 0, 24dp
Color: `#5F6368`

## Layout
- Page width: 1512px (MacBook Pro 14")
- Content margins: ~95-124px
- Content area: ~1264-1322px
