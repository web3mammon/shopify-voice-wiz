import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
};

// Verify Shopify webhook signature
function verifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  const hash = createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return hash === hmacHeader;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');

    if (!hmacHeader || !shopDomain || !topic) {
      throw new Error('Missing required webhook headers');
    }

    // Get request body for verification
    const body = await req.text();
    
    // Verify webhook signature
    const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET') ?? '';
    if (!verifyWebhook(body, hmacHeader, secret)) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const payload = JSON.parse(body);
    console.log(`Webhook received: ${topic} from ${shopDomain}`, payload);

    // Handle different webhook topics
    if (topic === 'app/uninstalled') {
      // Mark shop as inactive when app is uninstalled
      await supabase
        .from('shops')
        .update({ is_active: false })
        .eq('shop_domain', shopDomain);

      // Update installation status
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_domain', shopDomain)
        .single();

      if (shop) {
        await supabase
          .from('installations')
          .update({
            uninstalled_at: new Date().toISOString(),
            status: 'uninstalled'
          })
          .eq('shop_id', shop.id)
          .eq('status', 'active');
      }

      console.log(`App uninstalled for shop: ${shopDomain}`);

    } else if (topic === 'shop/update') {
      // Handle shop updates if needed
      console.log(`Shop updated: ${shopDomain}`);
    
    } else if (topic === 'customers/data_request') {
      // GDPR: Customer data request
      console.log(`Customer data request from: ${shopDomain}`);
      // Implement data export logic here
    
    } else if (topic === 'customers/redact') {
      // GDPR: Customer data deletion
      console.log(`Customer redaction request from: ${shopDomain}`);
      // Implement customer data deletion logic here
    
    } else if (topic === 'shop/redact') {
      // GDPR: Shop data deletion (48 hours after uninstall)
      console.log(`Shop redaction request: ${shopDomain}`);
      // Implement shop data deletion logic here
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
