-- Add index for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_volunteer_events_type ON volunteer_events(event_type);