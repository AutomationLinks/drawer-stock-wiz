

# Plan: Add Filters to "Top 10 Lowest Stock Items" Report

## What

Make the Lowest Stock card customizable with toggle buttons to:
1. **Exclude negatives** -- toggle to hide items with stock <= 0, showing the true bottom 10 of positive-stock items
2. **Filter by gender** -- buttons for All / Men / Women / Kids (parsed from `item_name` patterns like "mens", "womens", "boys", "girls")
3. **Filter by product category** -- buttons derived from the existing `category` column (e.g., "Tees and Tanks", "Underwear", "Socks", etc.)

## Single file change: `src/components/InventoryAnalytics.tsx`

### State
Add three `useState` hooks:
- `excludeNegatives` (boolean, default false)
- `genderFilter` ("all" | "mens" | "womens" | "kids")
- `categoryFilter` (string, default "all")

### Filter logic
Before sorting/slicing for `lowestStockItems`, apply filters:
1. If `excludeNegatives`, filter out items where `stock_on_hand <= 0`
2. If `genderFilter` is set, match `item_name` lowercase against patterns: "mens"/"men " for men, "womens"/"women " for women, "boys"/"girls"/"kids"/"youth" for kids
3. If `categoryFilter` is not "all", match `item.category`

Then sort ascending and take 10.

### UI additions inside the Lowest Stock card header area
- A row of filter buttons/toggles above the chart+table:
  - **Toggle**: "Exclude Negatives" (switch or outline button)
  - **Gender**: Button group -- All | Men | Women | Kids
  - **Category**: Button group dynamically built from unique categories in inventory data
- Use existing `Button` component with `variant="outline"` for unselected and `variant="default"` for selected state
- CSV export updates to respect current filters

No backend changes needed.

