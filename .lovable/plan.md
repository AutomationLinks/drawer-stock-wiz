

# Plan: Named Regular Volunteer Shifts

## Problem Summary

The current Admin UI hides the "Event Name" field for regular volunteer shifts. It only shows when creating "Special Events". This means:
- All regular shifts are either unnamed or forced to be called "Drawer Knob Hours"
- The client cannot create a regular recurring shift called "Care Pair Shift"
- The quick-add templates don't allow custom naming

---

## Solution Overview

**Make the Event Name field visible for ALL event types**, so admins can name any shift (regular or special). This is a simple UI change with no database modifications needed.

---

## Changes Required

### 1. Admin UI: Show Event Name for All Event Types

**File:** `src/pages/VolunteerEvents.tsx`

**Current behavior (lines 715-726):**
```typescript
{formData.event_type === 'event' && (
  <div className="space-y-2">
    <Label htmlFor="event_name">Event Name *</Label>
    <Input ... />
  </div>
)}
```

**New behavior:**
- Always show the Event Name field regardless of event type
- Make it required for special events, optional for regular shifts
- Add helpful placeholder text based on event type

```typescript
<div className="space-y-2">
  <Label htmlFor="event_name">
    Event/Shift Name {formData.event_type === 'event' ? '*' : '(Optional)'}
  </Label>
  <Input
    id="event_name"
    placeholder={formData.event_type === 'event' 
      ? "e.g., Holiday Gift Wrapping" 
      : "e.g., Drawer Knob Hours, Care Pair Shift"}
    value={formData.event_name}
    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
    required={formData.event_type === 'event'}
  />
</div>
```

### 2. Update Quick-Add Templates

**File:** `src/pages/VolunteerEvents.tsx`

Add a new quick-add option for creating regular shifts with custom names:

| Template | Current Name | New Behavior |
|----------|-------------|--------------|
| Add Knob Hours | Pre-fills "Drawer Knob Hours" | Keep as-is |
| **NEW: Add Regular Shift** | N/A | Opens form with blank event_name, allows naming |
| Add Special Event | Blank name | Keep as-is |
| Add Ticket Event | Blank name | Keep as-is |
| Custom Event | Blank form | Keep as-is |

**Alternative approach:** Simply update the UI to always show the name field (as above), so "Add Knob Hours" can be modified before saving, and "Custom Event" works for any shift type.

### 3. Update Event Type Dropdown Label

**Current (line 709):**
```typescript
<SelectItem value="regular">Regular Hours (Drawer Knob)</SelectItem>
```

**New:**
```typescript
<SelectItem value="regular">Regular Volunteer Shift</SelectItem>
```

This removes the hardcoded "Drawer Knob" reference and makes it clear this can be any regular shift.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/VolunteerEvents.tsx` | Remove conditional on Event Name field, update Event Type label |

---

## No Database Changes Needed

The `event_name` column already exists in `volunteer_events` and works for both regular and special event types. This is purely a UI fix.

---

## User Workflow After Implementation

**Creating a new "Care Pair Shift":**
1. Go to `/volunteer-events`
2. Click **Add Event** → **Custom Event** (or **Add Knob Hours** and modify)
3. Fill in:
   - Date: The shift date
   - Time Slot: "5:00 PM – 6:30 PM"
   - **Event/Shift Name: "Care Pair Shift"** ← Now visible and editable!
   - Location/Capacity as needed
   - Event Type: **Regular Volunteer Shift**
4. Save

**Volunteer signup dropdown will show:**
- "Feb 10, 26 – Care Pair Shift (5:00 PM – 6:30 PM)" with blue badge
- "Feb 12, 26 – Drawer Knob Hours (10:00 AM – 12:00 PM)" with blue badge

---

## Summary

This is a **1-file, ~10 line change** that:
1. Shows the Event Name field for all event types (not just special events)
2. Updates the Event Type dropdown label to be more generic
3. Requires no database changes
4. Is fully backwards compatible with existing events

