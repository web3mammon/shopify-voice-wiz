-- Create shops table to store Shopify store credentials
CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text UNIQUE NOT NULL,
  access_token text NOT NULL,
  scope text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Create installations table to track app installations
CREATE TABLE public.installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  installed_at timestamptz DEFAULT now(),
  uninstalled_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'uninstalled', 'suspended'))
);

-- Enable RLS on installations
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

-- Create voice_conversations table for storing call data
CREATE TABLE public.voice_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  customer_identifier text,
  transcript jsonb DEFAULT '[]'::jsonb,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  duration_seconds integer,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on voice_conversations
ALTER TABLE public.voice_conversations ENABLE ROW LEVEL SECURITY;

-- Create agent_config table for AI agent settings
CREATE TABLE public.agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE NOT NULL,
  voice_model text DEFAULT 'alloy',
  system_prompt text,
  greeting_message text DEFAULT 'Hi! How can I help you today?',
  max_duration_minutes integer DEFAULT 10,
  is_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on agent_config
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

-- Create widget_config table for voice widget customization
CREATE TABLE public.widget_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE NOT NULL,
  position text DEFAULT 'bottom-right' CHECK (position IN ('bottom-left', 'bottom-right')),
  primary_color text DEFAULT '#008060',
  button_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on widget_config
ALTER TABLE public.widget_config ENABLE ROW LEVEL SECURITY;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_conversations_updated_at
  BEFORE UPDATE ON public.voice_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_config_updated_at
  BEFORE UPDATE ON public.agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_config_updated_at
  BEFORE UPDATE ON public.widget_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (public access for now, will add proper auth later)
CREATE POLICY "Allow all operations on shops" ON public.shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on installations" ON public.installations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on voice_conversations" ON public.voice_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on agent_config" ON public.agent_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on widget_config" ON public.widget_config FOR ALL USING (true) WITH CHECK (true);