# Second Brain

A universal knowledge capture system. Send anything to a Telegram bot — notes, links, code snippets, journal entries — and it gets auto-categorized and stored in your personal knowledge base.

## Architecture

- **Telegram Bot** — primary input interface (WhatsApp/Discord can be added later)
- **Vercel Functions** — serverless API layer (webhook handler + REST API)
- **Supabase** — PostgreSQL database + file storage

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations from `supabase/migrations/` in order via the Supabase SQL editor
3. Copy your project URL and service role key

### 2. Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=a-random-secret
```

### 4. Deploy to Vercel

```bash
npm install
vercel deploy
```

### 5. Set Telegram Webhook

After deploying, register the webhook with Telegram:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_URL>/api/webhook/telegram?secret=<YOUR_SECRET>"
```

## Usage

### Telegram Bot Commands

| Command | Description |
|---------|-------------|
| Send any message | Auto-saves as note/link/code/journal |
| `/search <query>` | Full-text search your entries |
| `/recent [n]` | Show last n entries (default 5) |
| `/tag <id> <tags...>` | Add tags to an entry |
| `/delete <id>` | Delete an entry |
| `/help` | Show available commands |

### REST API

```
GET    /api/entries              — list entries (query params: q, type, tags, limit, offset)
POST   /api/entries              — create entry (JSON body)
GET    /api/entries/:id          — get single entry
PUT    /api/entries/:id          — update entry
DELETE /api/entries/:id          — delete entry
GET    /api/health               — health check
```

## Project Structure

```
├── api/                        Vercel serverless functions
│   ├── entries/
│   │   ├── index.ts            GET (list/search), POST (create)
│   │   └── [id].ts             GET, PUT, DELETE single entry
│   ├── webhook/
│   │   └── telegram.ts         Telegram webhook handler
│   └── health.ts               Health check
├── src/
│   ├── lib/
│   │   ├── types.ts            TypeScript types
│   │   ├── supabase.ts         Supabase client
│   │   └── content-detector.ts Auto-detect content type
│   ├── services/
│   │   ├── entries.ts          CRUD + search operations
│   │   └── telegram.ts         Telegram bot message handler
│   └── config.ts               Environment config
├── supabase/
│   └── migrations/             Database migrations (run in order)
├── package.json
├── tsconfig.json
└── vercel.json
```
