-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  max_conversations_per_month integer,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price_monthly, max_conversations_per_month, features) VALUES
  ('Free Trial', 0, 50, '["Basic voice AI", "50 conversations/month", "Email support"]'),
  ('Starter', 29.99, 500, '["Advanced voice AI", "500 conversations/month", "Priority support", "Custom branding"]'),
  ('Growth', 99.99, 2000, '["Advanced voice AI", "2000 conversations/month", "24/7 support", "Custom branding", "Analytics dashboard"]'),
  ('Enterprise', 299.99, 10000, '["Advanced voice AI", "10000 conversations/month", "Dedicated support", "Custom branding", "Advanced analytics", "Custom integrations"]');

-- Create shop subscriptions table
CREATE TABLE public.shop_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'past_due')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  conversations_used integer DEFAULT 0,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on shop_subscriptions" ON public.shop_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_shop_subscriptions_updated_at
  BEFORE UPDATE ON public.shop_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_shop_subscriptions_shop_id ON public.shop_subscriptions(shop_id);
CREATE INDEX idx_shop_subscriptions_status ON public.shop_subscriptions(status);