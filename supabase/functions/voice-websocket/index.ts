import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoiceSession {
  sessionId: string;
  shopId: string;
  conversationId: string | null;
  conversationHistory: Array<{ role: string; content: string }>;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  startTime: Date;
  customerIdentifier?: string;
}

// In-memory session storage (in production, consider Redis for multi-instance)
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

  socket.onopen = () => {
    console.log("WebSocket connection opened for shop:", shopDomain);
    sessionId = crypto.randomUUID();
    
    voiceSession = {
      sessionId,
      shopId: shop.id,
      conversationId: null,
      conversationHistory: [],
      transcript: [],
      startTime: new Date(),
    };
    
    sessions.set(sessionId, voiceSession);
    
    socket.send(JSON.stringify({
      type: "connection_established",
      sessionId,
      greeting: agentConfig?.greeting_message || "Hi! How can I help you today?",
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

// Handler functions
async function handleAudioChunk(
  socket: WebSocket,
  data: any,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session) return;

  // Audio chunk is base64 encoded WebM/MP4
  const audioBase64 = data.audio;
  
  console.log("Processing audio chunk, size:", audioBase64?.length || 0);
  
  // TODO: Send to Deepgram for STT
  // const transcribedText = await transcribeAudio(audioBase64);
  
  // For now, acknowledge receipt
  socket.send(JSON.stringify({
    type: "audio_received",
    sessionId: session.sessionId,
  }));
}

async function handleTextMessage(
  socket: WebSocket,
  data: any,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session) return;
  
  const userMessage = data.text;
  console.log("Text message:", userMessage);
  
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
    role: "customer",
    content: userMessage,
    timestamp: new Date().toISOString(),
  });
  
  // Send transcript update
  socket.send(JSON.stringify({
    type: "transcript_update",
    role: "customer",
    text: userMessage,
  }));
  
  // Get AI response
  await getAIResponse(socket, userMessage, session, supabase);
}

async function getAIResponse(
  socket: WebSocket,
  userMessage: string,
  session: VoiceSession,
  supabase: any
) {
  // Add user message to history
  session.conversationHistory.push({
    role: "user",
    content: userMessage,
  });
  
  // TODO: Call Lovable AI or OpenAI for response
  // For now, simulate response
  const aiResponse = generateSimpleResponse(userMessage);
  
  // Add AI response to history
  session.conversationHistory.push({
    role: "assistant",
    content: aiResponse,
  });
  
  // Add to transcript
  session.transcript.push({
    role: "assistant",
    content: aiResponse,
    timestamp: new Date().toISOString(),
  });
  
  // Send text response
  socket.send(JSON.stringify({
    type: "transcript_update",
    role: "assistant",
    text: aiResponse,
  }));
  
  // TODO: Generate TTS audio
  socket.send(JSON.stringify({
    type: "audio_response",
    text: aiResponse,
  }));
  
  // Update database transcript
  if (session.conversationId) {
    await supabase
      .from('voice_conversations')
      .update({ transcript: session.transcript })
      .eq('id', session.conversationId);
  }
}

function generateSimpleResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "I'd be happy to help you with pricing information. Could you tell me which product you're interested in?";
  }
  
  if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
    return "I can help you track your order. What's your order number?";
  }
  
  if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
    return "I understand you'd like to process a return. I can help you with that. What's your order number?";
  }
  
  if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
    return "We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Would you like more details?";
  }
  
  if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
    return "I'd be happy to help you find the perfect product! What are you looking for today?";
  }
  
  // Default response
  return "I'm here to help! Could you tell me more about what you're looking for?";
}

async function handleEndSession(
  socket: WebSocket,
  session: VoiceSession | null,
  supabase: any
) {
  if (!session) return;
  
  console.log("Ending session:", session.sessionId);
  await saveSessionToDatabase(session, supabase);
  
  socket.send(JSON.stringify({
    type: "session_ended",
    sessionId: session.sessionId,
  }));
}

async function saveSessionToDatabase(session: VoiceSession, supabase: any) {
  console.log("Saving session to database:", session.sessionId);
  
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

