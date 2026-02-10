

# Plan: Fix Calendar Times, Email Display, and Donation Receipt Wording

## Issue 1: Calendar Events Show Wrong Times (e.g., 5am-7am instead of 10am-12pm)

### Root Cause

This is a **timezone bug**. All calendar file generators treat local times (Central Time) as UTC by appending the "Z" suffix.

For example, a 10:00 AM Central shift gets encoded as `DTSTART:20260210T100000Z` -- meaning 10:00 AM **UTC**, which is 4:00 AM Central (or 5:00 AM during daylight saving). That's why volunteers see 5am-7am.

### Affected Files (4 total)

| File | What It Generates | Where It Runs |
|------|------------------|---------------|
| `supabase/functions/send-volunteer-confirmation/index.ts` | .ics attachment in confirmation email | Server (Deno/UTC) |
| `supabase/functions/send-volunteer-reminders/index.ts` | Email body text only (no calendar) | Server (Deno/UTC) |
| `src/utils/generateCalendarFile.ts` | .ics file download from browser | Browser (local) |
| `src/utils/calendarLinks.ts` | Google Calendar and Outlook URLs | Browser (local) |

### Fix

Replace the UTC "Z" format with timezone-aware local time format in all ICS generators and calendar link builders:

**ICS files** -- use `DTSTART;TZID=America/Chicago:20260210T100000` instead of `DTSTART:20260210T100000Z`, and add a `VTIMEZONE` block to the calendar file.

**Google Calendar links** -- stop converting to UTC; instead format as local time without "Z" and add a `ctz=America/Chicago` parameter.

**Outlook Calendar links** -- similar approach, format times as local Central Time.

---

## Issue 2: Reminder Email Shows "12 AM" Instead of "12 PM"

### Root Cause

The reminder email at line 132 of `send-volunteer-reminders/index.ts` simply outputs the `time_slot` field directly: `${event.time_slot}`. The database contains the correct value "10:00 AM - 12:00 PM".

This is likely either:
- A rendering issue with the em dash character (–) in some email clients
- Or an older event that was entered with incorrect data

### Fix

- Verify the actual data in the database for the events the client is referring to
- The time_slot values currently stored are "10:00 AM - 12:00 PM" and "5:00 PM - 6:30 PM" which are correct
- No code change needed for the email display itself, but we should confirm with a database query on the specific events the client saw

---

## Issue 3: Donation Receipt Says "Purchase" Instead of "Donation"

### Root Cause

When donors go through Stripe Checkout, the Stripe-hosted page shows the line item as **"Donation - [Campaign]"** (line 134 of `create-checkout-session/index.ts`). However, the Stripe receipt email that Stripe sends automatically may use generic purchase/payment language that The Drawer doesn't control.

The app's own receipt (`DonationReceipt.tsx`) already correctly says "Thank You for Your Donation!" -- this wording is fine.

The issue is likely the **Stripe-generated email receipt** which uses words like "purchase" or "payment". To fix this:

### Fix

Update the Stripe Checkout session configuration to use `submit_type: 'donate'` -- this changes the Stripe checkout button text from "Pay" to "Donate" and adjusts the receipt language accordingly.

```typescript
session = await stripe.checkout.sessions.create({
  submit_type: 'donate',  // <-- Add this
  // ... rest of config
});
```

Note: `submit_type` is only available for `mode: 'payment'` (one-time donations), not `mode: 'subscription'`. For monthly donations, Stripe doesn't support custom submit types, but the product name "Monthly Donation" should convey the right intent.

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/send-volunteer-confirmation/index.ts` | Fix ICS timezone: use `TZID=America/Chicago` instead of UTC "Z" |
| `src/utils/generateCalendarFile.ts` | Fix ICS timezone: use `TZID=America/Chicago` instead of UTC "Z" |
| `src/utils/calendarLinks.ts` | Fix Google/Outlook calendar link timezone handling |
| `supabase/functions/create-checkout-session/index.ts` | Add `submit_type: 'donate'` to one-time payment sessions |

## Technical Details

### ICS Timezone Fix (both server and client files)

Before:
```
DTSTART:20260210T100000Z
DTEND:20260210T120000Z
```

After:
```
VTIMEZONE block for America/Chicago
DTSTART;TZID=America/Chicago:20260210T100000
DTEND;TZID=America/Chicago:20260210T120000
```

### Google Calendar Link Fix

Before: Appends "Z" to times, causing UTC interpretation
After: Format times without "Z" and add `&ctz=America/Chicago` parameter

### Outlook Calendar Link Fix

Before: Uses `.toISOString()` which outputs UTC
After: Format as local time string with timezone offset for Central Time

### Stripe Checkout Fix

Add one line to the one-time payment session creation:
```typescript
submit_type: 'donate',
```

