import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'install') {
      // Step 1: Start OAuth flow - redirect merchant to Shopify
      const shop = url.searchParams.get('shop');
      
      if (!shop) {
        throw new Error('Missing shop parameter');
      }

      const clientId = Deno.env.get('SHOPIFY_API_KEY');
      const scopes = 'read_products,read_orders,read_customers,write_script_tags';
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth?action=callback`;
      const nonce = crypto.randomUUID();

      // Store nonce for verification
      await supabase.from('oauth_states').insert({
        nonce,
        shop,
        created_at: new Date().toISOString(),
      });

      const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': authUrl,
        },
      });

    } else if (action === 'callback') {
      // Step 2: Handle OAuth callback from Shopify
      const code = url.searchParams.get('code');
      const shop = url.searchParams.get('shop');
      const state = url.searchParams.get('state');

      if (!code || !shop || !state) {
        throw new Error('Missing required OAuth parameters');
      }

      // Verify nonce
      const { data: oauthState, error: stateError } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('nonce', state)
        .eq('shop', shop)
        .single();

      if (stateError || !oauthState) {
        throw new Error('Invalid OAuth state');
      }

      // Exchange code for access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('SHOPIFY_API_KEY'),
          client_secret: Deno.env.get('SHOPIFY_API_SECRET'),
          code,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange OAuth code for token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const scope = tokenData.scope;

      // Store shop credentials
      const { data: shop_data, error: shopError } = await supabase
        .from('shops')
        .upsert({
          shop_domain: shop,
          access_token: accessToken,
          scope,
          is_active: true,
        })
        .select()
        .single();

      if (shopError) {
        console.error('Error storing shop:', shopError);
        throw new Error('Failed to store shop credentials');
      }

      // Create installation record
      await supabase.from('installations').insert({
        shop_id: shop_data.id,
        status: 'active',
      });

      // Initialize default agent config
      await supabase.from('agent_config').upsert({
        shop_id: shop_data.id,
        is_enabled: false,
      });

      // Initialize default widget config
      await supabase.from('widget_config').upsert({
        shop_id: shop_data.id,
      });

      // Delete used nonce
      await supabase.from('oauth_states').delete().eq('nonce', state);

      // Redirect to app dashboard
      const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.com';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}?shop=${shop}&installed=true`,
        },
      });

    } else {
      throw new Error('Invalid action parameter');
    }

  } catch (error) {
    console.error('OAuth error:', error);
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
