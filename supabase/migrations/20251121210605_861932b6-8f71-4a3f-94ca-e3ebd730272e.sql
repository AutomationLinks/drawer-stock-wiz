-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to notify Zapier about new donations
CREATE OR REPLACE FUNCTION notify_zapier_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'name', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'organization', NEW.organization,
    'address', CONCAT_WS(', ', NEW.address_line_1, NEW.address_line_2, NEW.city, NEW.state, NEW.postal_code),
    'amount', NEW.amount,
    'frequency', NEW.frequency,
    'campaign', NEW.campaign,
    'date', NEW.created_at,
    'test_mode', COALESCE(NEW.is_test_mode, false)
  );

  -- Make async HTTP request to edge function
  SELECT INTO request_id net.http_post(
    url := 'https://xrzxchkxeofbgkuypzqo.supabase.co/functions/v1/notify-zapier-donation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyenhjaGt4ZW9mYmdrdXlwenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTgzMDcsImV4cCI6MjA3NjAzNDMwN30.-0kFoOGeDPtIlkrfU4F-qElzyZuYPhuiKkAcZL66XZ0'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Function to notify Zapier about new volunteer signups
CREATE OR REPLACE FUNCTION notify_zapier_volunteer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  event_record RECORD;
BEGIN
  -- Get event details
  SELECT event_date, time_slot, location, location_address
  INTO event_record
  FROM public.volunteer_events
  WHERE id = NEW.event_id;

  -- Build the payload
  payload := jsonb_build_object(
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'email', NEW.email,
    'event_date', event_record.event_date,
    'event_time', event_record.time_slot,
    'location', event_record.location,
    'location_address', event_record.location_address,
    'quantity', NEW.quantity,
    'comment', NEW.comment,
    'date', NEW.created_at
  );

  -- Make async HTTP request to edge function
  SELECT INTO request_id net.http_post(
    url := 'https://xrzxchkxeofbgkuypzqo.supabase.co/functions/v1/notify-zapier-volunteer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyenhjaGt4ZW9mYmdrdXlwenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTgzMDcsImV4cCI6MjA3NjAzNDMwN30.-0kFoOGeDPtIlkrfU4F-qElzyZuYPhuiKkAcZL66XZ0'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger for donations
DROP TRIGGER IF EXISTS trigger_notify_zapier_donation ON public.donations;
CREATE TRIGGER trigger_notify_zapier_donation
AFTER INSERT ON public.donations
FOR EACH ROW
EXECUTE FUNCTION notify_zapier_donation();

-- Create trigger for volunteer signups
DROP TRIGGER IF EXISTS trigger_notify_zapier_volunteer ON public.volunteer_signups;
CREATE TRIGGER trigger_notify_zapier_volunteer
AFTER INSERT ON public.volunteer_signups
FOR EACH ROW
EXECUTE FUNCTION notify_zapier_volunteer();