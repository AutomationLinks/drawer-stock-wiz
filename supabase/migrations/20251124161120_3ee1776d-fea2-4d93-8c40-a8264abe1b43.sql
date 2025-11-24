-- Add event_name and event_type columns to volunteer_events table
ALTER TABLE volunteer_events 
ADD COLUMN event_name TEXT,
ADD COLUMN event_type TEXT NOT NULL DEFAULT 'regular';

-- Create index for better query performance
CREATE INDEX idx_volunteer_events_type ON volunteer_events(event_type);

-- Set all existing events to 'regular' type (Drawer Knob Hours)
UPDATE volunteer_events SET event_type = 'regular';

-- Update the Dec 14th event to be a special event
UPDATE volunteer_events 
SET event_type = 'event', 
    event_name = 'Holiday Event'
WHERE event_date = '2025-12-14';