

# Plan: Fix Missing Bombas Pairs / Total Pairs Values in Invoice Detail

## Problem

In the invoice detail dialog, the "Total Pairs:" and "Bombas Pairs:" labels appear but the numeric values do not render visibly next to them. The `Bombas` column added to the `InvoicesTable` and the `InvoiceTemplate` print view appear to be working, but the dialog summary is broken.

## Root Cause

In `src/components/InvoiceDetailDialog.tsx` (lines 244–266), the totals block uses `flex justify-between` directly on a parent `<div className="border-t pt-4">` that does **not** have `flex` itself — each row inside is a `flex justify-between`, which is fine. However, the values use `item.quantity` which from the items query comes back as numeric, but when summed via `reduce` with `(item.quantity || 0)`, numeric `0` is truthy-falsy correct.

The likely real cause: `item.quantity` is returned from Supabase as a **string** (since the column is `numeric`), so `sum + "25"` produces string concatenation like `"02525..."`. The list above renders fine because it just prints `{item.quantity}`. The reduce produces a long string that may overflow off-screen to the right — explaining why nothing visible appears next to the label inside the dialog width.

Same issue exists in `InvoicesTable.tsx` (lines 145–153) and `InvoiceTemplate.tsx` totals reduce.

## Fix

Coerce `item.quantity` to a number in every `reduce` accumulator across the three files:

### 1. `src/components/InvoiceDetailDialog.tsx`
Wrap quantity with `Number(...)`:
- `Total Pairs` reducer: `sum + Number(item.quantity || 0)`
- `Bombas Pairs` reducer: `sum + (isBombas ? Number(item.quantity || 0) : 0)`

### 2. `src/components/InvoicesTable.tsx`
Same `Number()` coercion on `totalPairs` and `bombasPairs` reducers (lines 145–153).

### 3. `src/components/InvoiceTemplate.tsx`
The IIFE on lines around `totalPairs`/`bombasPairs` already has a subtle bug — `Number(...) || 0` outside the parens means `||` applies to the entire `sum + Number(...)`. Restructure as:
```ts
const qty = Number(isInvoice ? it.quantity : it.quantity_ordered) || 0;
return sum + qty;
```

## Verification

After the fix, open any invoice (e.g. INV-000031 from the screenshot) and confirm:
- "Total Pairs:" shows `290` (25+25+25+25+45+45+100)
- "Bombas Pairs:" shows `200` (only Bombas-named items)
- Invoices list table `Pairs` and `Bombas` columns show correct integers
- Printed/PDF invoice shows the same numbers in its summary box

## Files Touched

- `src/components/InvoiceDetailDialog.tsx`
- `src/components/InvoicesTable.tsx`
- `src/components/InvoiceTemplate.tsx`

No backend, schema, or other component changes.

