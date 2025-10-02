import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCustomerInfo, handleConversationRating, lookupShopifyOrder } from "./customer-handler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceSession {
  shopDomain: string;
  shopId: string;
  conversationId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  startTime: number;
  conversationHistory: Array<{ role: string; content: string }>;
  deepgramConnection: WebSocket | null;
  isProcessing: boolean;
  accessToken: string | null;
}

const sessions = new Map<string, VoiceSession>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const shopDomain = url.searchParams.get('shop');

  if (!shopDomain) {
    return new Response("Shop domain required", { status: 400 });
  }

  console.log(`[WebSocket] Connection request from shop: ${shopDomain}`);

  // Verify shop exists and is active
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: shop, error: shopError } = await supabaseClient
    .from('shops')
    .select('id, is_active, shop_domain, access_token')
    .eq('shop_domain', shopDomain)
    .eq('is_active', true)
    .single();

  if (shopError || !shop) {
    console.error('[WebSocket] Shop not found or inactive:', shopDomain);
    return new Response("Shop not found or inactive", { status: 404 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const sessionId = crypto.randomUUID();

  socket.onopen = async () => {
    console.log(`[WebSocket] Connected - Session: ${sessionId}`);
    
    const session: VoiceSession = {
      shopDomain: shop.shop_domain,
      shopId: shop.id,
      conversationId: null,
      customerId: null,
      customerName: null,
      customerEmail: null,
      transcript: [],
      startTime: Date.now(),
      conversationHistory: [],
      deepgramConnection: null,
      isProcessing: false,
      accessToken: shop.access_token,
    };

    sessions.set(sessionId, session);

    // Initialize Deepgram connection and wait for it
    const deepgramReady = await initializeDeepgram(sessionId, socket);
    
    if (!deepgramReady) {
      console.error('[WebSocket] Failed to initialize Deepgram');
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to initialize voice recognition. Please check your Deepgram API key.'
      }));
      socket.close();
      return;
    }

    socket.send(JSON.stringify({
      type: 'connection.established',
      sessionId,
      message: 'Voice assistant ready'
    }));

    console.log(`[WebSocket] Session initialized: ${sessionId}`);
  };

  socket.onmessage = async (event) => {
    try {
      const session = sessions.get(sessionId);
      if (!session) {
        console.error('[WebSocket] Session not found:', sessionId);
        return;
      }

      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'audio.chunk':
          await handleAudioChunk(sessionId, data.audio, socket);
          break;
        case 'text.message':
          await handleTextMessage(sessionId, data.message, socket, shop.id);
          break;
        case 'customer.info':
          await handleCustomerInfo(sessionId, data.name, data.email, socket, sessions);
          break;
        case 'conversation.rate':
          await handleConversationRating(sessionId, data.rating, data.feedback, socket, sessions);
          break;
        case 'session.end':
          await handleEndSession(sessionId, socket);
          break;
        default:
          console.warn('[WebSocket] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[WebSocket] Message handling error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  socket.onclose = async () => {
    console.log(`[WebSocket] Connection closed - Session: ${sessionId}`);
    await saveSessionToDatabase(sessionId);
    
    const session = sessions.get(sessionId);
    if (session?.deepgramConnection) {
      session.deepgramConnection.close();
    }
    sessions.delete(sessionId);
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };

  return response;
});

async function initializeDeepgram(sessionId: string, clientSocket: WebSocket): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) {
    console.error('[Deepgram] Session not found:', sessionId);
    return false;
  }

  const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
  if (!DEEPGRAM_API_KEY) {
    console.error('[Deepgram] API key not configured');
    return false;
  }

  try {
    console.log('[Deepgram] Initializing connection for session:', sessionId);
    
    // Connect to Deepgram streaming API using Sec-WebSocket-Protocol for auth
    const deepgramWs = new WebSocket(
      'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
        encoding: 'linear16',
        sample_rate: '24000',
        channels: '1',
        interim_results: 'true',
        punctuate: 'true',
        endpointing: '300',
      }),
      ['token', DEEPGRAM_API_KEY] // Pass API key via Sec-WebSocket-Protocol
    );

    // Wait for connection to open
    const connectionPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.error('[Deepgram] Connection timeout');
        resolve(false);
      }, 10000);

      deepgramWs.onopen = () => {
        clearTimeout(timeout);
        console.log('[Deepgram] Connected for session:', sessionId);
        session.deepgramConnection = deepgramWs;
        resolve(true);
      };

    deepgramWs.onerror = (error) => {
      clearTimeout(timeout);
      console.error('[Deepgram] Connection error:', error);
      resolve(false);
    };
    });

    deepgramWs.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'Results') {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;
          
          if (transcript && transcript.trim()) {
            console.log(`[Deepgram] ${isFinal ? 'Final' : 'Interim'}: ${transcript}`);
            
            clientSocket.send(JSON.stringify({
              type: 'transcript.update',
              text: transcript,
              isFinal
            }));

            // Process final transcripts
            if (isFinal && !session.isProcessing) {
              session.isProcessing = true;
              
              session.transcript.push({
                role: 'customer',
                content: transcript,
                timestamp: new Date().toISOString()
              });

              // Get AI response
              await processWithGPT(sessionId, transcript, clientSocket);
            }
          }
        }
      } catch (error) {
        console.error('[Deepgram] Message parsing error:', error);
      }
    };

    deepgramWs.onclose = () => {
      console.log('[Deepgram] Connection closed for session:', sessionId);
    };

    const connected = await connectionPromise;
    
    if (!connected) {
      console.error('[Deepgram] Failed to establish connection');
      if (deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.close();
      }
    }
    
    return connected;

  } catch (error) {
    console.error('[Deepgram] Connection error:', error);
    return false;
  }
}

async function handleAudioChunk(sessionId: string, audioBase64: string, socket: WebSocket) {
  const session = sessions.get(sessionId);
  if (!session || !session.deepgramConnection) {
    console.error('[Audio] Session or Deepgram connection not found');
    return;
  }

  try {
    // Decode base64 audio and send to Deepgram
    const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    
    if (session.deepgramConnection.readyState === WebSocket.OPEN) {
      session.deepgramConnection.send(audioData);
    }
  } catch (error) {
    console.error('[Audio] Error processing chunk:', error);
  }
}

async function processWithGPT(sessionId: string, userInput: string, socket: WebSocket) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('[GPT] API key not configured');
    session.isProcessing = false;
    return;
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get agent config for this shop
  const { data: agentConfig } = await supabaseClient
    .from('agent_config')
    .select('system_prompt, greeting_message')
    .eq('shop_id', session.shopId)
    .single();

  const systemPrompt = agentConfig?.system_prompt || buildSystemPrompt(session.shopDomain);
  
  // Add customer context if available
  const customerContext = session.customerName 
    ? `\nCustomer name: ${session.customerName}${session.customerEmail ? `, Email: ${session.customerEmail}` : ''}`
    : '';
  const fullSystemPrompt = systemPrompt + customerContext;

  try {
    const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...session.conversationHistory.slice(-10),
      { role: 'user', content: userInput }
    ];

    console.log('[GPT] Sending streaming request...');

    // Define function tools for Shopify order lookup
    const tools = session.accessToken ? [
      {
        type: 'function',
        function: {
          name: 'lookup_order',
          description: 'Look up order status and details from Shopify. Use this when customer asks about their order.',
          parameters: {
            type: 'object',
            properties: {
              order_number: {
                type: 'string',
                description: 'The order number or order ID'
              },
              email: {
                type: 'string',
                description: 'Customer email address'
              }
            },
            required: ['order_number']
          }
        }
      }
    ] : [];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 150,
        temperature: 0.7,
        stream: true,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`GPT API error: ${response.status}`);
    }

    // Stream the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let toolCalls: any[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              
              if (delta?.content) {
                fullResponse += delta.content;
              }
              
              if (delta?.tool_calls) {
                toolCalls = delta.tool_calls;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    // Handle function calls
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'lookup_order') {
          const args = JSON.parse(toolCall.function.arguments);
          const orderInfo = await lookupShopifyOrder(
            session.shopDomain,
            session.accessToken!,
            args.order_number,
            args.email
          );
          
          fullResponse = orderInfo || 'I was unable to find that order. Please check the order number and try again.';
        }
      }
    }

    const aiResponse = fullResponse || 'I apologize, I didn\'t catch that.';
    console.log('[GPT] Complete response:', aiResponse);

    // Send text response to client immediately
    socket.send(JSON.stringify({
      type: 'text.response',
      text: aiResponse
    }));

    // Update conversation history
    session.conversationHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: aiResponse }
    );

    session.transcript.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Generate audio with ElevenLabs (streaming)
    await generateSpeech(sessionId, aiResponse, socket);

  } catch (error) {
    console.error('[GPT] Error:', error);
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process request'
    }));
  } finally {
    session.isProcessing = false;
  }
}

async function generateSpeech(sessionId: string, text: string, socket: WebSocket) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] API key not configured');
    return;
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get shop ID
  const { data: shopData } = await supabaseClient
    .from('shops')
    .select('id')
    .eq('shop_domain', session.shopDomain)
    .single();

  // Get voice configuration
  const { data: agentConfig } = await supabaseClient
    .from('agent_config')
    .select('voice_model')
    .eq('shop_id', shopData?.id)
    .single();

  const voiceId = agentConfig?.voice_model || 'Kft8nAqXain1XJjJLVz7'; // Custom voice

  try {
    console.log('[ElevenLabs] Generating speech...');

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        voiceId,
        endpoint: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`
      });
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Stream audio chunks with buffering for complete MP3 frames
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let totalBytes = 0;
    let chunkCount = 0;
    let buffer: Uint8Array[] = [];
    let bufferSize = 0;
    const MIN_BUFFER_SIZE = 16384; // 16KB - ensures complete MP3 frames
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (value) {
        buffer.push(value);
        bufferSize += value.byteLength;
        totalBytes += value.byteLength;
      }
      
      // Send when buffer is large enough or stream is done
      if ((bufferSize >= MIN_BUFFER_SIZE || done) && buffer.length > 0) {
        // Combine buffered chunks
        const combinedBuffer = new Uint8Array(bufferSize);
        let offset = 0;
        for (const chunk of buffer) {
          combinedBuffer.set(chunk, offset);
          offset += chunk.byteLength;
        }
        
        chunkCount++;
        
        // Convert to base64
        const audioBase64 = btoa(String.fromCharCode(...combinedBuffer));
        
        // Send combined chunk
        socket.send(JSON.stringify({
          type: 'audio.response',
          audio: audioBase64,
          format: 'mp3',
          chunkIndex: chunkCount
        }));
        
        // Reset buffer
        buffer = [];
        bufferSize = 0;
      }
      
      if (done) break;
    }
    
    console.log(`[ElevenLabs] Streamed ${chunkCount} chunks (${totalBytes} bytes)`);
    
    // Send completion marker
    socket.send(JSON.stringify({
      type: 'audio.complete',
      totalChunks: chunkCount,
      totalBytes
    }));

    console.log(`[ElevenLabs] Streamed ${totalBytes} bytes of audio`);

  } catch (error) {
    console.error('[ElevenLabs] Error:', error);
  }
}

async function handleTextMessage(sessionId: string, message: string, socket: WebSocket, shopId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Create conversation if not exists
  if (!session.conversationId) {
    const { data, error } = await supabaseClient
      .from('voice_conversations')
      .insert({
        shop_id: shopId,
        customer_identifier: 'web-customer',
        transcript: [],
      })
      .select()
      .single();

    if (!error && data) {
      session.conversationId = data.id;
    }
  }

  session.transcript.push({
    role: 'customer',
    content: message,
    timestamp: new Date().toISOString()
  });

  await processWithGPT(sessionId, message, socket);
}

async function handleEndSession(sessionId: string, socket: WebSocket) {
  console.log('[Session] Ending session:', sessionId);
  
  const session = sessions.get(sessionId);
  if (session?.deepgramConnection) {
    session.deepgramConnection.close();
  }

  socket.send(JSON.stringify({
    type: 'session.ended',
    message: 'Session ended successfully'
  }));

  socket.close();
}

async function saveSessionToDatabase(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.transcript.length === 0) return;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const duration = Math.floor((Date.now() - session.startTime) / 1000);
    const transcriptText = session.transcript.map(t => t.content).join(' ');
    
    const sentiment = calculateSentiment(transcriptText);
    const topic = extractTopic(transcriptText);

    if (session.conversationId) {
      await supabaseClient
        .from('voice_conversations')
        .update({
          transcript: session.transcript,
          duration_seconds: duration,
          sentiment,
          topic,
          customer_id: session.customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.conversationId);
    } else {
      await supabaseClient
        .from('voice_conversations')
        .insert({
          shop_id: session.shopId,
          customer_identifier: session.customerEmail || session.customerName || 'web-customer',
          transcript: session.transcript,
          duration_seconds: duration,
          sentiment,
          topic,
          customer_id: session.customerId,
        });
    }

    console.log('[Database] Session saved:', sessionId);
  } catch (error) {
    console.error('[Database] Error saving session:', error);
  }
}

function buildSystemPrompt(shopDomain: string): string {
  return `You are a helpful AI voice assistant for ${shopDomain}. 
Keep responses concise (under 50 words) and natural for voice conversation.
Be professional, friendly, and helpful. Answer customer questions about products, orders, and general inquiries.`;
}

function calculateSentiment(transcript: string): string {
  const positive = ['great', 'good', 'thanks', 'thank', 'excellent', 'happy', 'love'];
  const negative = ['bad', 'poor', 'terrible', 'angry', 'frustrated', 'disappointed'];
  
  const text = transcript.toLowerCase();
  const positiveCount = positive.filter(word => text.includes(word)).length;
  const negativeCount = negative.filter(word => text.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractTopic(transcript: string): string {
  const topics = {
    'product': ['product', 'item', 'price', 'cost', 'buy', 'purchase'],
    'order': ['order', 'shipping', 'delivery', 'track', 'status'],
    'support': ['help', 'support', 'problem', 'issue', 'question'],
    'return': ['return', 'refund', 'exchange', 'cancel'],
  };
  
  const text = transcript.toLowerCase();
  let maxCount = 0;
  let detectedTopic = 'general';
  
  for (const [topic, keywords] of Object.entries(topics)) {
    const count = keywords.filter(keyword => text.includes(keyword)).length;
    if (count > maxCount) {
      maxCount = count;
      detectedTopic = topic;
    }
  }
  
  return detectedTopic;
}
