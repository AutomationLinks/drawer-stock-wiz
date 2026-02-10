

# Plan: Add Event Date Search & Chronological Sorting to Volunteer Signups

## Problem

The admin Signups page currently only lets you search by name or email. The client needs to quickly find all volunteers for a specific date, and wants the list sorted by event date (not by signup date).

## Changes (1 file)

**File:** `src/pages/VolunteerSignups.tsx`

### 1. Add a Date Picker Filter

Add a date input field next to the existing search bar that lets the admin pick a specific event date. When a date is selected, only signups for that date are shown.

- Add a new `dateSearch` state (string, empty by default)
- Render an `<Input type="date" />` with a calendar icon and "Filter by event date" label
- Add a clear button to reset the date filter

### 2. Update Search/Filter Logic

Expand the `filteredSignups` filter to also check against the selected date:

```text
Current:  matches name OR email
New:      matches (name OR email) AND matches selected event date (if set)
```

The existing All/Upcoming/Past toggle buttons continue to work alongside the date filter.

### 3. Sort by Event Date (Chronological)

Change the default sort from `created_at` (signup timestamp) to `event_date` (chronological):

- Sort the filtered results client-side by `volunteer_events.event_date` ascending
- This means upcoming dates appear first, making it easy to scan
- Secondary sort by time_slot so same-day events are ordered logically

### 4. Update Search Placeholder

Change the placeholder text from `"Search by name or email..."` to `"Search by name or email..."` (stays the same since date has its own input).

## UI Layout After Change

```text
[Search by name or email...] [Filter by event date: ____] [x]  [All] [Upcoming] [Past]  [Export CSV]
```

The date input sits between the text search and the toggle buttons, with a small clear button to reset it.

## No Database or Backend Changes Needed

All filtering and sorting happens client-side on already-fetched data.

