-- Create training_videos table
CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  vimeo_url TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for filtering and sorting
CREATE INDEX idx_training_videos_category ON public.training_videos(category);
CREATE INDEX idx_training_videos_order ON public.training_videos(display_order);
CREATE INDEX idx_training_videos_active ON public.training_videos(active);

-- Enable RLS
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access
CREATE POLICY "Allow public to read active videos"
  ON public.training_videos FOR SELECT
  USING (active = true);

CREATE POLICY "Allow public to insert videos"
  ON public.training_videos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update videos"
  ON public.training_videos FOR UPDATE
  USING (true);

CREATE POLICY "Allow public to delete videos"
  ON public.training_videos FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_training_videos_updated_at
  BEFORE UPDATE ON public.training_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial seed data
INSERT INTO public.training_videos (title, description, vimeo_url, category, display_order) VALUES
('Getting Started with Inventory', 'Learn the basics of managing inventory in the system', 'https://vimeo.com/123456789', 'inventory', 0),
('How to Accept Donations', 'Step-by-step guide to processing donations', 'https://vimeo.com/123456789', 'donate', 0),
('Volunteer Scheduling', 'Manage volunteer signups and schedules', 'https://vimeo.com/123456789', 'volunteer', 0),
('Understanding Analytics', 'Read and interpret system analytics', 'https://vimeo.com/123456789', 'analytics', 0),
('Company Management', 'Add and manage company records', 'https://vimeo.com/123456789', 'companies', 0),
('Creating Sales Orders', 'Process sales orders efficiently', 'https://vimeo.com/123456789', 'sales-orders', 0),
('Invoice Generation', 'Create and send invoices', 'https://vimeo.com/123456789', 'invoices', 0),
('Partner Locations', 'Map and manage partner locations', 'https://vimeo.com/123456789', 'partners', 0),
('Contact Management', 'Organize your contacts', 'https://vimeo.com/123456789', 'contacts', 0),
('Newsletter Setup', 'Create and send newsletters', 'https://vimeo.com/123456789', 'newsletters', 0),
('Website Editing', 'Make updates to your website', 'https://vimeo.com/123456789', 'website', 0),
('Automation Workflows', 'Set up automated processes', 'https://vimeo.com/123456789', 'automation', 0),
('Calendar Integration', 'Sync and manage calendars', 'https://vimeo.com/123456789', 'calendars', 0);