

# Plan: Volunteer Event Names & Bulk Contact Import Clarification

## Summary

| Item | Status | Action Needed |
|------|--------|---------------|
| Bulk Contact Import | Already exists | Just need training/clarification |
| Event Name on Admin Page | Already exists | No changes needed |
| Event Name in Signup Dropdown | Partially working | Minor UI improvement + data update |

---

## 1. Bulk Contact Import (Already Available)

**No code changes needed** - this feature already exists on the Companies page.

**How to use it:**
1. Go to the **Companies** page
2. Click the **Import Companies** button
3. Download the CSV template
4. Fill in your contacts (Company Name, Email, Address, etc.)
5. Upload and import

The system can import hundreds of contacts at once. It can either update existing companies or skip duplicates based on your preference.

---

## 2. Event Name Column on Admin Page (Already Working)

The `/volunteer-events` admin page already displays an "Event Name" column in the table. Events show their name if one is set, or "-" if blank.

**No changes needed.**

---

## 3. Event Name in Volunteer Signup Dropdown (Enhancement)

### Current Behavior
- Events WITH `event_name` set show: `"Jan 14, 25 - Serving with Santa - 1:30 PM - 3:00 PM"`
- Events WITHOUT `event_name` show: `"Jan 14, 25 - Burnsville - 10:00 AM - 12:00 PM"`

### Problem
The existing regular volunteer shifts (Drawer Knob Hours) don't have an `event_name` value set in the database, so they just show location and time.

### Solution

**Part A: Improve the dropdown display format**

Update the volunteer signup dropdown to always show the event name prominently:

```text
BEFORE: "Jan 14, 25 - Burnsville - 10:00 AM - 12:00 PM"
AFTER:  "Jan 14, 25 - Drawer Knob Hours (10:00 AM - 12:00 PM)"
```

For events with names, display format:
```text
"[Date] - [Event Name] ([Time])"
```

**Part B: Update existing events with names**

Run a data update to add "Drawer Knob Hours" as the event_name for all existing regular volunteer shifts:

```sql
UPDATE volunteer_events 
SET event_name = 'Drawer Knob Hours'
WHERE event_type = 'regular' 
  AND (event_name IS NULL OR event_name = '');
```

**Part C: Update the quick-add template**

When using "Add Knob Hours" quick-add, pre-fill the event name with "Drawer Knob Hours".

---

## Files to Modify

### `src/components/VolunteerSignupForm.tsx`
- Update `getEventDisplayName()` function to always show event name first
- Improve the dropdown item format for clarity

### `src/pages/VolunteerEvents.tsx`
- Update the "Add Knob Hours" quick-add template to pre-fill `event_name: "Drawer Knob Hours"`

### Database Update
- Set `event_name = 'Drawer Knob Hours'` for all existing regular events without names

---

## New Event Creation Going Forward

When creating a new monthly "Care Pair shift":

1. Go to `/volunteer-events`
2. Click **Add Event** then **Custom Event** (or Add Knob Hours as a starting point)
3. Fill in:
   - Date: The shift date
   - Time Slot: e.g., "10:00 AM - 12:00 PM"
   - Event Name: **"Care Pair shift"**
   - Location/Address/Capacity as needed
4. Save

Volunteers will then see: `"Feb 10, 25 - Care Pair shift (10:00 AM - 12:00 PM)"`

---

## Technical Details

### Dropdown Display Logic Change

```typescript
// Current logic in getEventDisplayName()
if (event.event_name) {
  return event.event_name;
}
return `${event.location} - ${event.time_slot}`;

// New logic - always show name if available, with time in parentheses
const displayName = event.event_name || event.location;
return `${displayName} (${event.time_slot})`;
```

### Quick-Add Template Update

```typescript
// In handleQuickAdd("knob"):
event_name: "Drawer Knob Hours",  // Add this line
```

---

## Summary of What Client Will See After Implementation

**In the signup dropdown:**
- `"Jan 13, 25 - Drawer Knob Hours (10:00 AM - 12:00 PM)"` (with blue badge)
- `"Jan 15, 25 - Care Pair shift (5:00 PM - 6:30 PM)"` (with blue badge)
- `"Feb 14, 25 - Valentine's Event (1:00 PM - 3:00 PM)"` (with green badge)

Each shift type is clearly named, making it easy for volunteers to know what they're signing up for.

