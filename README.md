# Shopify AI Voice Assistant

A Shopify app that provides an AI-powered voice assistant for e-commerce stores, enabling customers to interact with your store using natural voice conversations.

## Features

- **Voice Conversations**: Real-time voice interaction using Deepgram STT and ElevenLabs TTS
- **AI Intelligence**: Powered by OpenAI GPT for natural, context-aware responses
- **Customizable Widget**: Configurable position, colors, and greeting messages
- **Analytics Dashboard**: Track conversations, sentiment, and engagement metrics
- **Shopify Integration**: Seamless OAuth integration with Shopify stores

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Services**: OpenAI GPT, Deepgram, ElevenLabs
- **Platform**: Lovable Cloud

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
- `src/components/voice/VoiceWidget.tsx` (line ~55)

### 6. Database Schema

All database tables and RLS policies are defined in `supabase/migrations/`. Key tables:
- `shops` - Shopify store credentials
- `voice_conversations` - Conversation history
- `agent_config` - AI agent configuration
- `widget_config` - Widget appearance settings

### 7. Things to Keep in Mind

- **Edge Functions**: Must be deployed to Supabase (can't run locally in production)
- **RLS Policies**: Already configured for security, but review for your use case
- **API Costs**: OpenAI, Deepgram, and ElevenLabs charge per usage
- **Secrets Management**: Never commit API keys to git - use Supabase secrets
- **CORS**: Already configured in edge functions for browser access

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── voice/          # Voice widget components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # shadcn-ui components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── integrations/       # External integrations
│       └── supabase/       # Supabase client
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── voice-websocket/    # Voice AI handler
│   │   ├── shopify-oauth/      # Shopify auth
│   │   └── shopify-webhook/    # Shopify webhooks
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Key Files

- `src/components/voice/VoiceWidget.tsx` - Main voice interface
- `src/utils/audioUtils.ts` - Audio recording/playback
- `supabase/functions/voice-websocket/index.ts` - Voice processing backend
- `src/pages/Dashboard.tsx` - Analytics dashboard

## Documentation

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Deepgram API](https://developers.deepgram.com/)
- [ElevenLabs API](https://docs.elevenlabs.io/)
- [OpenAI API](https://platform.openai.com/docs/)

## Support

For issues or questions:
- Lovable: [Discord Community](https://discord.gg/lovable)
- Project Issues: Use GitHub Issues on this repository

## License

MIT
