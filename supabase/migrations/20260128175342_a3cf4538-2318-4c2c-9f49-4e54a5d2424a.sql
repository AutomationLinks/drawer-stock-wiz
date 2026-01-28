-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule volunteer reminders to run daily at 9:00 AM Central (15:00 UTC)
SELECT cron.schedule(
  'send-volunteer-reminders-daily',
  '0 15 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://xrzxchkxeofbgkuypzqo.supabase.co/functions/v1/send-volunteer-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyenhjaGt4ZW9mYmdrdXlwenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTgzMDcsImV4cCI6MjA3NjAzNDMwN30.-0kFoOGeDPtIlkrfU4F-qElzyZuYPhuiKkAcZL66XZ0"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);