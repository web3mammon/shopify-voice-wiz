-- Create customers table for lead capture
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow all operations on customers" 
  ON public.customers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add customer_id and rating to voice_conversations
ALTER TABLE public.voice_conversations 
  ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN feedback_text TEXT;

-- Create index for customer conversations
CREATE INDEX idx_voice_conversations_customer_id ON public.voice_conversations(customer_id);

-- Add trigger for customers updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for voice_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_conversations;