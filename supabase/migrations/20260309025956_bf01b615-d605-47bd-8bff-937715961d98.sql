
-- Analytics events table for product telemetry
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for querying by event name and time
CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name, created_at DESC);

-- Index for querying by user
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated or anonymous user to INSERT events (write-only)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin can read (we'll add admin role later)
-- For now, no SELECT policy = no one can read via client
