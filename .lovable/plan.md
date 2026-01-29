

# Inventory Reset - Second Pass Correction

## Problem Identified
The initial inventory update had many incorrect values. After comparing the new spreadsheet against the current database, I found **45+ items** with incorrect quantities. The client specifically noted:
- Womens underwear 2/3XL shows **-5** (negative!) but should be **405**
- Womens underwear 4/5XL shows **244** but should be **147**

---

## Items Requiring Correction

### Bombas Socks (6 items to fix + 1 to delete)
| Item | Current | Should Be |
|------|---------|-----------|
| Bombas M socks | 3,200 | 2,750 |
| Bombas L socks | 1,725 | 2,525 |
| Bombas XL socks | 5,000 | 2,500 |
| Bombas Youth socks | 4,825 | 2,813 |
| Bombas Junior socks | 87 | **DELETE** |

### Bombas Underwear (4 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| Womens Bombas UW M/L | 5,063 | 5,600 |
| Womens Bombas UW XL/2XL | 6,185 | 6,254 |
| Mens Bombas UW M/L | 5,021 | 4,679 |
| Mens Bombas UW XL/2XL | 8,817 | 7,488 |

### Regular Mens Tees (5 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| mens tees and tanks - small | 1,123 | 7 |
| mens tees and tanks - medium | 233 | 15 |
| mens tees and tanks - large | 0 | 40 |
| mens tees and tanks - XL | 0 | 14 |
| mens tees and tanks - 2XL | 0 | 6 |

### Socks - Non-Bombas (9 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| womens socks | 1,179 | 1,186 |
| boys socks-toddler | 397 | 445 |
| boys socks-small | 118 | 165 |
| boys socks-medium | 413 | 634 |
| boys socks-large | 295 | 619 |
| girls socks-toddler | 271 | 520 |
| girls socks-small | 24 | 159 |
| girls socks-medium | 516 | 578 |
| girls socks-large | 320 | 289 |

### Womens Underwear (6 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| womens underwear-small | 0 | 169 |
| womens underwear-medium | 54 | 212 |
| womens underwear-large | 0 | 101 |
| womens underwear-XL | 21 | 511 |
| womens underwear-2-3XL | **-5** | 405 |
| womens underwear-4XL-5XL | 244 | 147 |

### Mens Underwear (6 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| mens underwear-small | 140 | 403 |
| mens underwear-medium | 192 | 420 |
| mens underwear-large | 176 | 570 |
| mens underwear-XL | 176 | 750 |
| mens underwear-2XL | 216 | 110 |
| mens underwear-3XL | 95 | 86 |

### Boys Underwear (6 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| boys underwear-toddler | 346 | 293 |
| boys underwear-small | 215 | 184 |
| boys underwear-medium | 192 | 311 |
| boys underwear-large | 72 | 162 |
| boys underwear-XL | 240 | 10 |
| boys underwear-2XL | 75 | 5 |

### Girls Underwear (5 items to fix)
| Item | Current | Should Be |
|------|---------|-----------|
| girls underwear-toddler | 228 | 16 |
| girls underwear-small | 230 | 242 |
| girls underwear-medium | 152 | 740 |
| girls underwear-large | 107 | 692 |
| girls underwear-XL | 159 | 56 |

---

## Implementation Steps

1. **Delete Bombas Junior socks** - Per spreadsheet note "delete bombas junior socks"

2. **Execute SQL UPDATE statements** for all 46 inventory items with corrected quantities

3. **Verify total inventory count** matches spreadsheet total of **72,196**

---

## Technical Implementation

Run SQL data updates via the database insert tool to correct all inventory quantities. No schema changes needed - this is purely a data correction.

```text
UPDATE inventory SET stock_on_hand = 2750 WHERE item_name = 'Bombas M socks';
UPDATE inventory SET stock_on_hand = 2525 WHERE item_name = 'Bombas L socks';
-- ... (44 more UPDATE statements)

DELETE FROM inventory WHERE item_name = 'Bombas Junior socks';
```

---

## Summary

| Category | Items to Fix |
|----------|-------------|
| Bombas Socks | 5 updates + 1 delete |
| Bombas Underwear | 4 updates |
| Regular Mens Tees | 5 updates |
| Regular Socks | 9 updates |
| Womens Underwear | 6 updates |
| Mens Underwear | 6 updates |
| Boys Underwear | 6 updates |
| Girls Underwear | 5 updates |
| **Total** | **46 updates + 1 delete** |

After implementation, the inventory page will show correct quantities and the negative stock issue will be resolved.

