# Plan: Multi-Date Volunteer Signup

## Confirmation: Lovable, not GoHighLevel

The "Drawer Knobs" volunteer signup form is built into this Lovable app (`src/components/VolunteerSignupForm.tsx`, used on `/signup`, `/embed/signup`, `VolunteerEvents`, `Events`, etc.). It writes directly to the `volunteer_events` and `volunteer_signups` tables in our backend. **This is fully a Lovable feature** — no GoHighLevel involvement. We can absolutely add multi-date selection.

## Answer to the client

Today the form only allows one date per submission. We can update it so a volunteer fills out their name/email/group size once, then ticks every date they want to attend and submits a single time. Below is how we'd build it.

## What changes

Replace the single "Choose Your Date" dropdown (Step 1) with a multi-select list of upcoming events. Everything else (name, email, group size, attendee names) stays the same and applies to **every** selected date.

### UI

- Step 1 becomes a scrollable checkbox list of available events (same data already loaded), each row showing the date, time, location, badge (Regular / Special / Ticket), and spots remaining.
- A small summary line: "X dates selected".
- Validation: at least 1 date required; group size cannot exceed the smallest "spots remaining" across selected dates.
- Ticket-required events: only allow selecting **one** ticket event at a time (since each requires a separate purchase) — or hide the multi-select for ticket events and keep single-select. Recommend: exclude ticket events from multi-select; they remain single-signup only.

### Submission logic (`signupMutation` in `VolunteerSignupForm.tsx`)

- Loop the selected event IDs and insert one `volunteer_signups` row per date (same first/last/email/quantity/comment).
- For each signup, also insert the same `volunteer_signup_attendees` rows.
- Run inserts sequentially; if one fails, show which date failed and which succeeded.
- Existing DB trigger `update_event_slots` already increments `slots_filled` per insert — no DB changes needed.
- Existing trigger `notify_zapier_volunteer` will fire one Zapier + one confirmation email per signup, which is what we want (one calendar invite per date).

### Confirmation screen

- Show a list of all confirmed dates instead of a single event block.
- "Add to Google Calendar / Outlook / .ics" buttons render once per confirmed date (or a single .ics file containing all events — simpler: one button per date, grouped).

## Files touched

- `src/components/VolunteerSignupForm.tsx` — swap Select for checkbox list, change state from `selectedEventId: string` to `selectedEventIds: string[]`, update validation, mutation, and confirmation view.
- `src/utils/generateCalendarFile.ts` — optionally add a helper to bundle multiple VEVENTs into one `.ics` (nice-to-have).

## What is NOT touched

- Database schema, RLS, triggers
- Edge functions (`send-volunteer-confirmation`, `notify-zapier-volunteer`) — they already handle one signup at a time, which is exactly what we'll send them, once per date
- `VolunteerSignups.tsx` admin page, cancel flow, invoices, Bombas totals, donation counter, or any unrelated feature
