

# Implementation Plan: Inventory Reset, Sales Order Pairs & Volunteer Reminders

This plan addresses the client's four main requests from the spreadsheet:

---

## Summary of Changes

| Task | Description |
|------|-------------|
| 1. Inventory Reset | Update stock quantities to match the 2026 spreadsheet without deleting data |
| 2. Bombas Tees Separation | Create new Bombas Tees category with $10 pricing |
| 3. Total Pairs on Sales Orders | Add "Pairs" column to sales orders table and detail view |
| 4. Donation Counter Reset | Update historical baseline from 656,779 to 733,038 |
| 5. Volunteer Reminder Emails | Create and schedule edge function for day-before reminders |

---

## Task 1: Inventory Updates from Spreadsheet

The spreadsheet contains 59 inventory items with updated quantities. Key changes:

**New Items to Create:**
- Bombas Mens Tees XS/S (450 pairs @ $10)
- Bombas Mens Tees M/L (450 pairs @ $10)
- Bombas Womens Tees XS/S (300 pairs @ $10)
- Bombas Womens Tees M/L (1,600 pairs @ $10)
- Bombas Womens Tees XL/2XL (1,550 pairs @ $10)

**Items to Update (sample of key changes):**
- Bombas Socks XS: 1,875 (was 2,000)
- Bombas Socks S: 6,800 (was 7,375)
- Bombas Toddler socks: 11,677 (was 13,344)
- Mens socks: 1,613 (was 1,383)
- ...and 50+ more updates

**Approach:**
1. Update existing inventory items via SQL UPDATE statements
2. Insert new Bombas Tees items with proper category and $10 pricing
3. All historical transaction data remains intact

---

## Task 2: Bombas Tees Category

**New Category:** "Bombas Tees and Tanks"  
**Pricing:** $10.00 per item (matching Bombas Socks/Underwear)

**Items to add:**
| Item Name | Quantity | Price |
|-----------|----------|-------|
| Bombas Mens Tees XS/S | 450 | $10.00 |
| Bombas Mens Tees M/L | 450 | $10.00 |
| Bombas Mens Tees XL/2XL | 0 | $10.00 |
| Bombas Womens Tees XS/S | 300 | $10.00 |
| Bombas Womens Tees M/L | 1,600 | $10.00 |
| Bombas Womens Tees XL/2XL | 1,550 | $10.00 |

Regular tees remain at $2.00 (already configured correctly).

---

## Task 3: Total Pairs on Sales Orders

Add a "Pairs" column to sales orders, matching the invoice functionality.

**Changes to `SalesOrdersTable.tsx`:**
- Fetch `sales_order_items` with each order
- Add "Pairs" column header between "Shipment" and "Total"
- Calculate sum of `quantity_ordered` for each order
- Update empty state colSpan from 9 to 10

**Changes to `SalesOrderDetailDialog.tsx`:**
- Add "Total Pairs" summary line in the footer section
- Sum all `quantity_ordered` values from order items
- Display below subtotal: "Total Pairs: X pairs"

---

## Task 4: Donation Counter Adjustment

The client requests resetting the "total donated" counter to **733,038**.

**Current value:** 656,779 (hardcoded baseline)  
**Requested value:** 733,038

**Change in `DonationCounter.tsx`:**
```typescript
// Line 8 - Update the historical baseline
const HISTORICAL_DONATIONS = 733038;
```

The counter adds database transactions to this baseline, so adjusting this number will immediately reflect on the website.

---

## Task 5: Volunteer Reminder Emails

Currently missing - the `send-volunteer-reminders` edge function does not exist.

**Implementation:**

1. **Create new edge function:** `supabase/functions/send-volunteer-reminders/index.ts`
   - Query volunteer_signups for events happening tomorrow
   - Filter out signups where `reminder_sent = true`
   - Send reminder email via Resend API
   - Update `reminder_sent` to true after sending

2. **Configure function in `supabase/config.toml`:**
   ```toml
   [functions.send-volunteer-reminders]
   verify_jwt = false
   ```

3. **Schedule the function to run daily at 9:00 AM Central Time**
   - Uses pg_cron or an external scheduler
   - Checks for events occurring the next day

**Email Content:**
- Reminder of event date, time, and location
- Calendar link attachment
- Contact information for questions

---

## Technical Details

### Database Updates (via SQL)

```text
-- Update existing Bombas Socks quantities
UPDATE inventory SET stock_on_hand = 1875 WHERE item_name = 'Bombas XS Socks';
UPDATE inventory SET stock_on_hand = 6800 WHERE item_name = 'Bombas S socks';
-- ... (50+ similar updates)

-- Insert new Bombas Tees items
INSERT INTO inventory (item_name, category, stock_on_hand, price_per_unit, status)
VALUES 
  ('Bombas Mens Tees XS/S', 'Bombas Tees and Tanks', 450, 10.00, 'Active'),
  ('Bombas Mens Tees M/L', 'Bombas Tees and Tanks', 450, 10.00, 'Active'),
  -- ... (6 total)
```

### Files to Modify

1. **src/components/SalesOrdersTable.tsx**
   - Add `sales_order_items` to query
   - Add "Pairs" column with quantity sum

2. **src/components/SalesOrderDetailDialog.tsx**
   - Add "Total Pairs" summary line

3. **src/components/DonationCounter.tsx**
   - Update `HISTORICAL_DONATIONS` constant to 733,038

4. **supabase/functions/send-volunteer-reminders/index.ts** (new file)
   - Edge function for sending reminder emails

5. **supabase/config.toml**
   - Add configuration for new edge function

---

## Verification After Implementation

1. **Inventory page** - Verify all quantities match spreadsheet
2. **New Bombas Tees category** - Visible and priced at $10
3. **Sales Orders page** - "Pairs" column displays correctly
4. **Donation counter** - Shows 733,038+ on website
5. **Test volunteer signup** - Confirm reminder email sends next day

