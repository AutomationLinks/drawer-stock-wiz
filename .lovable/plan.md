

# Plan: Add Lowest Stock Report + Fix Chart Color Readability

## Problem
1. Charts use `--secondary` and `--muted` as bar/pie colors, which are near-white grays -- virtually invisible on white backgrounds (see screenshot).
2. No "lowest stock" report exists in the Inventory Analytics.

## Changes

### 1. Fix chart colors site-wide (`src/components/InventoryAnalytics.tsx`)

Replace the `COLORS` array with distinguishable, readable values:

```text
Old:  primary (blue), secondary (near-white), accent (blue), muted (near-white)
New:  primary blue, orange, teal, amber -- all high-contrast on white
```

Use explicit HSL values like `hsl(207, 79%, 39%)`, `hsl(25, 85%, 55%)`, `hsl(170, 60%, 40%)`, `hsl(45, 90%, 50%)` instead of CSS variables that resolve to background-like grays.

Also update the "Top 10 Moving Items" bar chart from `fill="hsl(var(--secondary))"` to a readable color (e.g., the primary blue or orange).

### 2. Add "Top 10 Lowest Stock Items" card (`src/components/InventoryAnalytics.tsx`)

- Compute: sort `inventory` by `stock_on_hand` ascending, take first 10
- Horizontal bar chart matching the existing "Top 10 Moving Items" style
- Bars colored with warning tones (amber/red gradient for items below 100)
- Simple table below: item name, category, stock level
- "Download CSV" button to export the 10 items

Place as a new card in the 2-column grid.

### Single file change
| File | What |
|------|------|
| `src/components/InventoryAnalytics.tsx` | New COLORS array, fix secondary bar fill, add lowest-stock card with chart + table + CSV export |

No backend changes needed.

