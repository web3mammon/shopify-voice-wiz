import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleCustomerInfo(
  sessionId: string,
  name: string,
  email: string,
  socket: WebSocket,
  sessions: Map<string, any>
) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Check if customer exists
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('shop_id', session.shopId)
      .eq('email', email)
      .single();

    let customerId: string;

    if (existingCustomer) {
      // Update existing customer
      const { data } = await supabaseClient
        .from('customers')
        .update({
          name,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();
      
      customerId = data!.id;
      console.log('[Customer] Updated existing customer:', customerId);
    } else {
      // Create new customer
      const { data } = await supabaseClient
        .from('customers')
        .insert({
          shop_id: session.shopId,
          name,
          email,
        })
        .select()
        .single();
      
      customerId = data!.id;
      console.log('[Customer] Created new customer:', customerId);
    }

    // Update session
    session.customerId = customerId;
    session.customerName = name;
    session.customerEmail = email;

    // Create or update conversation with customer link
    if (session.conversationId) {
      await supabaseClient
        .from('voice_conversations')
        .update({ 
          customer_id: customerId,
          customer_identifier: email 
        })
        .eq('id', session.conversationId);
    } else {
      const { data } = await supabaseClient
        .from('voice_conversations')
        .insert({
          shop_id: session.shopId,
          customer_id: customerId,
          customer_identifier: email,
          transcript: [],
        })
        .select()
        .single();
      
      session.conversationId = data!.id;
    }

    socket.send(JSON.stringify({
      type: 'customer.info.saved',
      message: 'Thanks! Your information has been saved.'
    }));

  } catch (error) {
    console.error('[Customer] Error saving customer info:', error);
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to save customer information'
    }));
  }
}

export async function handleConversationRating(
  sessionId: string,
  rating: number,
  feedback: string | null,
  socket: WebSocket,
  sessions: Map<string, any>
) {
  const session = sessions.get(sessionId);
  if (!session || !session.conversationId) return;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    await supabaseClient
      .from('voice_conversations')
      .update({
        rating,
        feedback_text: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.conversationId);

    console.log(`[Rating] Conversation ${session.conversationId} rated: ${rating} stars`);

    socket.send(JSON.stringify({
      type: 'rating.saved',
      message: 'Thank you for your feedback!'
    }));

  } catch (error) {
    console.error('[Rating] Error saving rating:', error);
  }
}

export async function lookupShopifyOrder(
  shopDomain: string,
  accessToken: string,
  orderNumber: string,
  email?: string
): Promise<string | null> {
  try {
    const apiUrl = `https://${shopDomain}/admin/api/2024-01/orders.json?name=${encodeURIComponent(orderNumber)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Shopify] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    const status = order.fulfillment_status || 'pending';
    const total = order.total_price;
    const itemCount = order.line_items?.length || 0;

    return `Order #${orderNumber}: Status is ${status}. Total: $${total} for ${itemCount} item(s). ${
      order.tracking_number ? `Tracking number: ${order.tracking_number}` : 'No tracking info yet.'
    }`;

  } catch (error) {
    console.error('[Shopify] Order lookup error:', error);
    return null;
  }
}
