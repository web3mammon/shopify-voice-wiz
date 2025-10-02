import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoiceSession {
  sessionId: string;
  shopId: string;
  shopDomain: string;
  conversationId: string | null;
  conversationHistory: Array<{ role: string; content: string }>;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  startTime: Date;
  customerIdentifier?: string;
  openAIWebSocket: WebSocket | null;
  isOpenAIConnected: boolean;
  audioBuffer: string[];
  systemPrompt: string;
}

// In-memory session storage
const sessions = new Map<string, VoiceSession>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  // Extract shop parameter
  const url = new URL(req.url);
  const shopDomain = url.searchParams.get('shop') || 'demo-store.myshopify.com';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Verify shop exists
  const { data: shop } = await supabase
    .from('shops')
    .select('id, is_active')
    .eq('shop_domain', shopDomain)
    .maybeSingle();

  if (!shop || !shop.is_active) {
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
    .maybeSingle();

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let sessionId: string | null = null;
  let voiceSession: VoiceSession | null = null;

  socket.onopen = async () => {
    console.log("WebSocket connection opened for shop:", shopDomain);
    sessionId = crypto.randomUUID();
    
    // Build system prompt with Shopify context
    const systemPrompt = buildSystemPrompt(agentConfig, shopDomain);
    
    voiceSession = {
      sessionId,
      shopId: shop.id,
      shopDomain,
      conversationId: null,
      conversationHistory: [],
      transcript: [],
      startTime: new Date(),
      openAIWebSocket: null,
      isOpenAIConnected: false,
      audioBuffer: [],
      systemPrompt,
    };
    
    sessions.set(sessionId, voiceSession);
    
    // Connect to OpenAI Realtime API
    await initializeOpenAIConnection(socket, voiceSession, agentConfig);
    
    socket.send(JSON.stringify({
      type: "connection_established",
      sessionId,
      greeting: agentConfig?.greeting_message || "Hi! I'm your AI shopping assistant. How can I help you today?",
    }));
    
    console.log(`Session created: ${sessionId}`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message:", data.type);

      switch (data.type) {
        case "audio_chunk":
          await handleAudioChunk(socket, data, voiceSession, supabase);
          break;
          
        case "text_message":
          await handleTextMessage(socket, data, voiceSession, supabase);
          break;
          
        case "end_session":
          await handleEndSession(socket, voiceSession, supabase);
          break;
          
        default:
          console.warn("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = async () => {
    console.log("WebSocket connection closed");
    if (sessionId && voiceSession) {
      await saveSessionToDatabase(voiceSession, supabase);
      sessions.delete(sessionId);
    }
  };

  return response;
});

// Initialize OpenAI Realtime API connection
async function initializeOpenAIConnection(
  clientSocket: WebSocket,
  session: VoiceSession,
  agentConfig: any
) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || 'sk-dummy-key-replace-later';
  const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  
  console.log('Connecting to OpenAI Realtime API...');
  
  try {
    const openAISocket = new WebSocket(OPENAI_WS_URL, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });
    
    session.openAIWebSocket = openAISocket;
    
    openAISocket.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
      session.isOpenAIConnected = true;
      
      // Send session configuration
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: session.systemPrompt,
          voice: agentConfig?.voice_model || 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000,
          },
          temperature: 0.8,
          max_response_output_tokens: 4096,
        },
      };
      
      console.log('Sending session configuration to OpenAI');
      openAISocket.send(JSON.stringify(sessionConfig));
    };
    
    openAISocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await handleOpenAIMessage(clientSocket, data, session);
    };
    
    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      session.isOpenAIConnected = false;
      clientSocket.send(JSON.stringify({
        type: 'error',
        error: 'OpenAI connection error',
      }));
    };
    
    openAISocket.onclose = () => {
      console.log('OpenAI WebSocket closed');
      session.isOpenAIConnected = false;
    };
    
  } catch (error) {
    console.error('Failed to connect to OpenAI:', error);
    throw error;
  }
}

// Handle messages from OpenAI
async function handleOpenAIMessage(
  clientSocket: WebSocket,
  data: any,
  session: VoiceSession
) {
  console.log('OpenAI message:', data.type);
  
  switch (data.type) {
    case 'session.created':
      console.log('OpenAI session created');
      break;
      
    case 'session.updated':
      console.log('OpenAI session updated');
      break;
      
    case 'response.audio.delta':
      // Forward audio chunks to client
      clientSocket.send(JSON.stringify({
        type: 'audio_delta',
        audio: data.delta,
      }));
      break;
      
    case 'response.audio.done':
      clientSocket.send(JSON.stringify({
        type: 'audio_done',
      }));
      break;
      
    case 'response.audio_transcript.delta':
      // Accumulate assistant transcript
      break;
      
    case 'response.audio_transcript.done':
      const assistantText = data.transcript;
      console.log('Assistant transcript:', assistantText);
      
      session.transcript.push({
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
      });
      
      session.conversationHistory.push({
        role: 'assistant',
        content: assistantText,
      });
      
      clientSocket.send(JSON.stringify({
        type: 'transcript_update',
        role: 'assistant',
        text: assistantText,
      }));
      break;
      
    case 'conversation.item.input_audio_transcription.completed':
      const userText = data.transcript;
      console.log('User transcript:', userText);
      
      session.transcript.push({
        role: 'customer',
        content: userText,
        timestamp: new Date().toISOString(),
      });
      
      session.conversationHistory.push({
        role: 'user',
        content: userText,
      });
      
      clientSocket.send(JSON.stringify({
        type: 'transcript_update',
        role: 'customer',
        text: userText,
      }));
      break;
      
    case 'response.done':
      console.log('Response completed');
      break;
      
    case 'error':
      console.error('OpenAI error:', data.error);
      clientSocket.send(JSON.stringify({
        type: 'error',
        error: data.error.message || 'OpenAI API error',
      }));
      break;
      
    default:
      console.log('Unhandled OpenAI message type:', data.type);
  }
}

// Build system prompt with Shopify context
function buildSystemPrompt(agentConfig: any, shopDomain: string): string {
  const defaultPrompt = `You are a helpful AI shopping assistant for ${shopDomain}. 
You help customers with:
- Product information and recommendations
- Order tracking and status
- Shipping and delivery questions
- Returns and refunds
- General shopping assistance

Be friendly, concise, and helpful. If you don't know something, be honest and offer to help find the information.`;

  return agentConfig?.system_prompt || defaultPrompt;
}

// Handler functions
async function handleAudioChunk(
  socket: WebSocket,
  data: any,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session || !session.openAIWebSocket || !session.isOpenAIConnected) {
    console.warn('Cannot process audio: OpenAI not connected');
    return;
  }

  // Audio chunk is base64 encoded PCM16 at 24kHz from browser
  const audioBase64 = data.audio;
  
  console.log('Forwarding audio chunk to OpenAI, size:', audioBase64?.length || 0);
  
  try {
    // Forward audio directly to OpenAI
    session.openAIWebSocket.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioBase64,
    }));
  } catch (error) {
    console.error('Error forwarding audio to OpenAI:', error);
    socket.send(JSON.stringify({
      type: 'error',
      error: 'Failed to process audio',
    }));
  }
}

async function handleTextMessage(
  socket: WebSocket,
  data: any,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session || !session.openAIWebSocket || !session.isOpenAIConnected) {
    console.warn('Cannot process text: OpenAI not connected');
    return;
  }
  
  const userMessage = data.text;
  console.log('Text message:', userMessage);
  
  // Create conversation if not exists
  if (!session.conversationId) {
    const { data: conversation } = await supabase
      .from('voice_conversations')
      .insert({
        shop_id: session.shopId,
        customer_identifier: data.customer_id || 'anonymous',
        transcript: [],
        topic: 'General inquiry',
        sentiment: 'neutral',
      })
      .select()
      .maybeSingle();
    
    if (conversation) {
      session.conversationId = conversation.id;
    }
  }
  
  // Add to transcript
  session.transcript.push({
    role: 'customer',
    content: userMessage,
    timestamp: new Date().toISOString(),
  });
  
  session.conversationHistory.push({
    role: 'user',
    content: userMessage,
  });
  
  // Send transcript update to client
  socket.send(JSON.stringify({
    type: 'transcript_update',
    role: 'customer',
    text: userMessage,
  }));
  
  // Send text message to OpenAI
  try {
    session.openAIWebSocket.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: userMessage,
          }
        ]
      }
    }));
    
    // Trigger response
    session.openAIWebSocket.send(JSON.stringify({
      type: 'response.create',
    }));
  } catch (error) {
    console.error('Error sending text to OpenAI:', error);
    socket.send(JSON.stringify({
      type: 'error',
      error: 'Failed to process text message',
    }));
  }
}

async function handleEndSession(
  socket: WebSocket,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session) return;
  
  console.log('Ending session:', session.sessionId);
  
  // Close OpenAI connection
  if (session.openAIWebSocket) {
    try {
      session.openAIWebSocket.close();
    } catch (error) {
      console.error('Error closing OpenAI connection:', error);
    }
  }
  
  await saveSessionToDatabase(session, supabase);
  
  socket.send(JSON.stringify({
    type: 'session_ended',
    sessionId: session.sessionId,
  }));
}

async function saveSessionToDatabase(session: VoiceSession, supabase: any) {
  console.log('Saving session to database:', session.sessionId);
  
  const durationSeconds = Math.floor(
    (Date.now() - session.startTime.getTime()) / 1000
  );
  
  // Calculate sentiment
  const sentiment = calculateSentiment(session.transcript);
  
  // Extract topic
  const topic = extractTopic(session.transcript);
  
  if (session.conversationId) {
    // Update existing conversation
    await supabase
      .from('voice_conversations')
      .update({
        duration_seconds: durationSeconds,
        sentiment,
        topic,
        transcript: session.transcript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.conversationId);
  } else if (session.transcript.length > 0) {
    // Create new conversation record
    await supabase
      .from('voice_conversations')
      .insert({
        shop_id: session.shopId,
        customer_identifier: session.customerIdentifier || 'anonymous',
        duration_seconds: durationSeconds,
        sentiment,
        topic,
        transcript: session.transcript,
      });
  }
  
  console.log('Session saved successfully');
}

function calculateSentiment(transcript: Array<{ role: string; content: string }>): string {
  const positiveWords = ["great", "perfect", "thanks", "love", "happy", "excellent", "amazing", "wonderful"];
  const negativeWords = ["issue", "problem", "bad", "broken", "refund", "complaint", "frustrated", "angry"];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  transcript.forEach(msg => {
    const content = msg.content.toLowerCase();
    positiveWords.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });
  });
  
  if (positiveCount > negativeCount + 1) return "positive";
  if (negativeCount > positiveCount + 1) return "negative";
  return "neutral";
}

function extractTopic(transcript: Array<{ role: string; content: string }>): string {
  if (transcript.length === 0) return "General inquiry";
  
  const allText = transcript.map(t => t.content.toLowerCase()).join(" ");
  
  if (allText.includes("order") || allText.includes("track")) return "Order status";
  if (allText.includes("return") || allText.includes("refund")) return "Refund request";
  if (allText.includes("ship") || allText.includes("delivery")) return "Shipping";
  if (allText.includes("price") || allText.includes("cost")) return "Pricing";
  if (allText.includes("product") || allText.includes("item")) return "Product inquiry";
  if (allText.includes("stock") || allText.includes("available")) return "Availability";
  
  return "General inquiry";
}

