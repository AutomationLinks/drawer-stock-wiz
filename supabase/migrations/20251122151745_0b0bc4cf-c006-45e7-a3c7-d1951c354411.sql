-- Update the trigger function to call both Zapier and email functions
CREATE OR REPLACE FUNCTION public.notify_zapier_volunteer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Make async HTTP request to Zapier webhook
  SELECT INTO request_id net.http_post(
    url := 'https://xrzxchkxeofbgkuypzqo.supabase.co/functions/v1/notify-zapier-volunteer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyenhjaGt4ZW9mYmdrdXlwenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTgzMDcsImV4cCI6MjA3NjAzNDMwN30.-0kFoOGeDPtIlkrfU4F-qElzyZuYPhuiKkAcZL66XZ0'
    ),
    body := payload
  );

  -- Make async HTTP request to email confirmation function
  SELECT INTO request_id net.http_post(
    url := 'https://xrzxchkxeofbgkuypzqo.supabase.co/functions/v1/send-volunteer-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyenhjaGt4ZW9mYmdrdXlwenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTgzMDcsImV4cCI6MjA3NjAzNDMwN30.-0kFoOGeDPtIlkrfU4F-qElzyZuYPhuiKkAcZL66XZ0'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;