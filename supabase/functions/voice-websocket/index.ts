import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const upgrade = req.headers.get("upgrade") || "";
    
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Extract shop parameter from URL
    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop');
    
    if (!shopDomain) {
      return new Response("Missing shop parameter", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify shop exists and is active
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, is_active')
      .eq('shop_domain', shopDomain)
      .single();

    if (shopError || !shop || !shop.is_active) {
      return new Response("Invalid or inactive shop", { 
        status: 403,
        headers: corsHeaders 
      });
    }

    // Get agent config
    const { data: agentConfig } = await supabase
      .from('agent_config')
      .select('*')
      .eq('shop_id', shop.id)
      .single();

    if (!agentConfig || !agentConfig.is_enabled) {
      return new Response("Voice AI agent is not enabled", { 
        status: 403,
        headers: corsHeaders 
      });
    }

    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);

    let conversationId: string | null = null;
    const conversationStartTime = Date.now();

    socket.onopen = () => {
      console.log(`WebSocket connected for shop: ${shopDomain}`);
      
      // Send greeting message
      socket.send(JSON.stringify({
        type: 'greeting',
        message: agentConfig.greeting_message || "Hi! How can I help you today?",
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data.type);

        if (data.type === 'start_conversation') {
          // Create conversation record
          const { data: conversation, error: convError } = await supabase
            .from('voice_conversations')
            .insert({
              shop_id: shop.id,
              customer_identifier: data.customer_id || 'anonymous',
              transcript: [],
            })
            .select()
            .single();

          if (!convError && conversation) {
            conversationId = conversation.id;
            socket.send(JSON.stringify({
              type: 'conversation_started',
              conversation_id: conversationId,
            }));
          }

        } else if (data.type === 'audio_data') {
          // Handle incoming audio from customer
          // In production, this would process audio through your voice AI
          console.log('Processing audio data...');
          
          // Simulate AI response
          socket.send(JSON.stringify({
            type: 'ai_response',
            text: 'I received your message. How can I assist you further?',
          }));

        } else if (data.type === 'text_message') {
          // Handle text message from customer
          console.log('Text message:', data.text);
          
          // Update conversation transcript
          if (conversationId) {
            const { data: conv } = await supabase
              .from('voice_conversations')
              .select('transcript')
              .eq('id', conversationId)
              .single();

            if (conv) {
              const transcript = conv.transcript || [];
              transcript.push({
                role: 'user',
                content: data.text,
                timestamp: new Date().toISOString(),
              });

              await supabase
                .from('voice_conversations')
                .update({ transcript })
                .eq('id', conversationId);
            }
          }

          // Simulate AI response
          socket.send(JSON.stringify({
            type: 'ai_response',
            text: 'I understand. Let me help you with that.',
          }));
        }

      } catch (error) {
        console.error('Message handling error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        socket.send(JSON.stringify({
          type: 'error',
          message: errorMessage,
        }));
      }
    };

    socket.onclose = async () => {
      console.log(`WebSocket closed for shop: ${shopDomain}`);
      
      // Update conversation with duration
      if (conversationId) {
        const duration = Math.floor((Date.now() - conversationStartTime) / 1000);
        await supabase
          .from('voice_conversations')
          .update({ duration_seconds: duration })
          .eq('id', conversationId);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return response;

  } catch (error) {
    console.error('Voice WebSocket error:', error);
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
