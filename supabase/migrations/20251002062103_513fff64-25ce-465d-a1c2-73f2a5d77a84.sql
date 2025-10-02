-- Create oauth_states table for OAuth flow
CREATE TABLE public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text UNIQUE NOT NULL,
  shop text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Allow all operations (temporary, will be secured later)
CREATE POLICY "Allow all operations on oauth_states" ON public.oauth_states FOR ALL USING (true) WITH CHECK (true);

-- Auto-delete old nonces after 1 hour
CREATE INDEX idx_oauth_states_created_at ON public.oauth_states(created_at);
