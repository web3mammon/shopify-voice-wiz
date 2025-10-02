# Shopify AI Voice Assistant

A Shopify app that provides an AI-powered voice assistant for e-commerce stores, enabling customers to interact with your store using natural voice conversations.

## Features

### Core Capabilities
- **Voice Conversations**: Real-time voice interaction using Deepgram STT and ElevenLabs TTS
- **AI Intelligence**: Powered by OpenAI GPT for natural, context-aware responses
- **Shopify Order Lookup**: AI can look up customer orders using function calling
- **Real-time Dashboard**: Live updates of conversations using Supabase Realtime
- **Customer Ratings**: Collect feedback with star ratings after conversations
- **Lead Capture**: Optional customer information collection (commented out for now)

### Dashboard & Analytics
- **Live Conversation Monitoring**: See conversations as they happen
- **Sentiment Analysis**: Automatic sentiment detection for each conversation
- **Topic Categorization**: AI-powered topic classification
- **Conversation History**: Full transcript storage and search
- **Performance Metrics**: Track conversation duration, ratings, and engagement

### Customization
- **Widget Configuration**: Configurable position, colors, and greeting messages
- **AI Agent Setup**: Customize system prompts and voice models
- **Multi-Shop Support**: Manage multiple Shopify stores from one dashboard

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Supabase (Database, Auth, Edge Functions, Realtime)
- **AI Services**: OpenAI GPT (with function calling), Deepgram, ElevenLabs
- **Platform**: Lovable Cloud
- **Integration**: Shopify OAuth & Webhooks

## Development

### Prerequisites

- Node.js 18+ and npm
- A Lovable account (for easiest development)
- API Keys for: OpenAI, Deepgram, ElevenLabs (if self-hosting)

### Quick Start with Lovable

1. Visit the [Lovable Project](https://lovable.dev/projects/d04cf245-3674-4a98-bffa-154345b41afb)
2. Start prompting to make changes
3. Changes are automatically committed to the connected GitHub repo

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Self-Hosting Guide

If you want to deploy this project to your own infrastructure, here's what you need to know:

### 1. Backend Dependencies

This project uses **Lovable Cloud** which is built on Supabase. To self-host, you have two options:

**Option A: Keep Using Lovable Cloud (Recommended)**
- The project will continue to work with the existing Lovable Cloud backend
- No additional setup needed
- Edge functions are automatically deployed

**Option B: Set Up Your Own Supabase Project**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` against your database
3. Deploy edge functions using Supabase CLI:
   ```sh
   supabase functions deploy voice-websocket
   supabase functions deploy shopify-oauth
   supabase functions deploy shopify-webhook
   ```
4. Update `.env` with your Supabase credentials

### 2. Required API Keys & Secrets

Add these secrets to your Supabase project (via Supabase Dashboard > Project Settings > Secrets):

```
OPENAI_API_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
```

### 3. Environment Variables

The `.env` file contains Supabase connection details:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Frontend Deployment

You can deploy the frontend to any static hosting provider:

**Vercel / Netlify:**
```sh
npm run build
# Deploy the 'dist' folder
```

**Your Own Server:**
```sh
npm run build
# Serve the 'dist' folder with nginx, apache, etc.
```

### 5. WebSocket Endpoint

The voice widget connects to: `wss://[PROJECT_ID].supabase.co/functions/v1/voice-websocket`

If using your own Supabase project, update this URL in:
- `src/components/voice/VoiceWidget.tsx` (line 72)

### 6. Database Schema

All database tables and RLS policies are defined in `supabase/migrations/`. Key tables:
- `shops` - Shopify store credentials and access tokens
- `voice_conversations` - Conversation history with transcripts, ratings, and sentiment
- `customers` - Customer information and interaction history
- `agent_config` - AI agent configuration (voice model, system prompt, etc.)
- `widget_config` - Widget appearance settings
- `shop_subscriptions` - Subscription and billing information
- `subscription_plans` - Available pricing plans

### 7. Things to Keep in Mind

- **Edge Functions**: Must be deployed to Supabase (can't run locally in production)
- **RLS Policies**: Already configured for security, but review for your use case
- **API Costs**: OpenAI, Deepgram, and ElevenLabs charge per usage
- **Secrets Management**: Never commit API keys to git - use Supabase secrets
- **CORS**: Already configured in edge functions for browser access
- **Realtime**: Tables are configured for Supabase Realtime for live updates

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── voice/          # Voice widget components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # shadcn-ui components
│   ├── pages/              # Route pages
│   │   ├── Dashboard.tsx   # Main analytics dashboard
│   │   ├── Conversations.tsx # Conversation history
│   │   ├── AISetup.tsx     # AI agent configuration
│   │   └── Settings.tsx    # Widget settings
│   ├── hooks/              # Custom React hooks
│   │   ├── useDashboardData.ts # Real-time dashboard data
│   │   ├── useConversations.ts # Conversation management
│   │   └── useAgentConfig.ts   # Agent configuration
│   ├── utils/              # Utility functions
│   │   └── audioUtils.ts   # Audio recording/playback
│   └── integrations/       # External integrations
│       └── supabase/       # Supabase client
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── voice-websocket/    # Voice AI WebSocket handler
│   │   │   ├── index.ts        # Main WebSocket logic
│   │   │   └── customer-handler.ts # Customer info & rating handlers
│   │   ├── shopify-oauth/      # Shopify authentication
│   │   └── shopify-webhook/    # Shopify webhook processing
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Key Files

- `src/components/voice/VoiceWidget.tsx` - Main voice interface widget
- `src/utils/audioUtils.ts` - Audio recording/playback utilities
- `supabase/functions/voice-websocket/index.ts` - Voice processing backend with GPT
- `supabase/functions/voice-websocket/customer-handler.ts` - Customer & order handling
- `src/pages/Dashboard.tsx` - Real-time analytics dashboard
- `src/hooks/useDashboardData.ts` - Real-time data management

## Architecture

### Voice Conversation Flow
1. Customer clicks voice widget on Shopify storefront
2. Widget establishes WebSocket connection to `voice-websocket` edge function
3. Browser streams microphone audio to backend
4. Backend uses Deepgram for speech-to-text transcription
5. Transcription sent to OpenAI GPT for intelligent response
6. GPT can call functions (e.g., `lookup_order`) to fetch Shopify data
7. Response converted to speech using ElevenLabs TTS
8. Audio streamed back to customer in real-time
9. Full transcript saved to database with sentiment analysis
10. Dashboard updates in real-time via Supabase Realtime

### Function Calling
The AI can perform actions during conversations:
- **lookup_order**: Search for customer orders by email or order number
- Additional functions can be added in `voice-websocket/index.ts`

### Real-time Updates
Dashboard uses Supabase Realtime to instantly show:
- New conversations starting
- Live transcript updates
- Conversation completions
- Rating submissions

## Documentation

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Deepgram API](https://developers.deepgram.com/)
- [ElevenLabs API](https://docs.elevenlabs.io/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Shopify API](https://shopify.dev/docs/api)

## Support

For issues or questions:
- Lovable: [Discord Community](https://discord.gg/lovable)
- Project Issues: Use GitHub Issues on this repository

## License

MIT
