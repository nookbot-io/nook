<p align="center">
  <img src="public/nook.png" alt="Nook" width="128" />
</p>

<h1 align="center">Nook</h1>

<p align="center">
  <strong>Open-source AI assistant for Solana — powered by the Nook API</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#deploy-to-a-server">Deploy</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#nook-api">Nook API</a> &bull;
  <a href="#configuration">Configuration</a> &bull;
  <a href="LICENSE">MIT License</a>
</p>

---

## What is Nook?

Nook is an open-source AI chat assistant that queries real-time Solana blockchain data through the **Nook API** and explains it in natural language.

Ask things like *"What's the price of SOL?"*, *"Find tokens with over $1M volume in the last hour"*, or *"Show me the top holders of BONK"* — the agent translates your questions into API calls, analyzes the results, and responds in plain English.

**Nook API** is a Solana data service providing 31 endpoints — token search, prices, wallets, trades, charts, PnL, and more. Get a free API key and use it directly in your own apps, or pair it with the Nook Agent for an AI-powered experience.

## Features

- **AI-powered analysis** — natural language to API calls via LLM tool calling
- **Multi-provider LLM** — supports OpenAI (GPT-5.x) and Anthropic (Claude) with a unified interface
- **Streaming responses** — real-time SSE streaming in the web UI
- **Telegram bot** — optional Telegram integration with MarkdownV2 formatting
- **31 Solana data endpoints** — search, prices, tokens, wallets, trades, charts, PnL, top traders, stats
- **Smart tool selection** — the agent picks the right endpoints and chains multiple calls to answer complex questions
- **Token resolution** — automatically resolves symbols to addresses so you can ask about tokens by name
- **React frontend** — clean chat UI with dark/light theme, session history, and settings panel
- **Setup wizard** — guided first-run configuration in the browser
- **Self-hosted** — runs on your machine, your keys never leave your server

## Prerequisites

- **Node.js 22+**
- **Nook API key** — get a free key at [nookbot.io](https://nookbot.io)
- **LLM API key** — [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/nookbot-io/nook.git
cd nook
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `NOOK_API_KEY` — your Nook API key (get one at [nookbot.io](https://nookbot.io))
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` — your LLM provider key
- `AGENT_PASSWORD` — password for the web UI

### 3. Start

```bash
npm start
```

Open [http://localhost:3001](http://localhost:3001) — the setup wizard will guide you if anything is missing.

### 4. (Optional) Rebuild the frontend

A pre-built frontend ships in `public/` so this step is only needed if you modify the UI:

```bash
npm run build:frontend
```

## Deploy to a Server

### One-command setup (Ubuntu)

```bash
curl -fsSL https://raw.githubusercontent.com/nookbot-io/nook/main/deploy/setup.sh | sudo bash
```

This installs Node.js, the agent, and optionally Caddy (reverse proxy with auto-HTTPS) + systemd (auto-start on boot). Access the agent directly from your server's IP or domain — no port number needed.

### Manual deployment

See [deploy/](deploy/) for individual config files (Caddyfile, systemd service).

## Nook API

The Nook API is a Solana data service with 31 endpoints across 9 categories. You can use it directly with your API key or through the Nook Agent.

### Access Tiers

| | Free | Pro | Enterprise |
|---|------|-----|------------|
| **Rate limit** | 10 req/min | 60 req/min | 300 req/min |
| **Cache TTL** | 60s (30s price) | 30s (10s price) | 10s (5s price) |
| **Endpoints** | 10 of 31 | All 31 | All 31 |

### Endpoints

| Category | Count | Examples |
|----------|-------|----------|
| **Search** | 1 | Token search with filters |
| **Tokens** | 13 | Info, holders, ATH, bundlers, deployer, trending, volume, top performing, overview |
| **Price** | 4 | Current price, history, timestamp, range |
| **Wallet** | 4 | Tokens, basic info, trades, portfolio chart |
| **Trades** | 2 | Token trades, user-specific trades |
| **Chart** | 2 | OHLCV data, holders chart |
| **PnL** | 2 | Wallet PnL, first buyers |
| **Top Traders** | 1 | Top traders for a token |
| **Stats** | 2 | Token stats |

All endpoints are accessible via REST with your API key in the `x-api-key` header. See the [API docs](https://nookbot.io/docs) for full reference.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | No | `openai` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | If OpenAI | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-5.2` | OpenAI model name |
| `ANTHROPIC_API_KEY` | If Anthropic | — | Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-5` | Anthropic model name |
| `NOOK_API_URL` | No | `https://api.nookbot.io` | Nook API base URL |
| `NOOK_API_KEY` | Yes | — | Your Nook API key |
| `AGENT_PASSWORD` | Yes | — | Password for the web UI |
| `AGENT_PORT` | No | `3001` | Agent server port |
| `AGENT_RATE_LIMIT` | No | `20` | Max messages per minute per session |
| `TELEGRAM_ENABLED` | No | `false` | Enable Telegram bot |
| `TELEGRAM_BOT_TOKEN` | If Telegram | — | Bot token from @BotFather |
| `TELEGRAM_ALLOWED_CHAT_IDS` | No | — | Comma-separated allowed Telegram chat IDs |

You can also configure everything through the web UI settings page or the setup wizard on first run.

## Telegram Bot

1. Create a bot with [@BotFather](https://t.me/BotFather) on Telegram
2. Set `TELEGRAM_ENABLED=true` and `TELEGRAM_BOT_TOKEN=your_token` in `.env`
3. Restart the agent — the bot will start automatically
4. Add your chat ID to `TELEGRAM_ALLOWED_CHAT_IDS` (send `/start` to the bot and check the logs for your chat ID)

You can also configure Telegram through the agent web UI settings page.

## Architecture

```
  ┌──────────────────┐
  │  Blockchain Data  │
  │    (upstream)     │
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │    Nook API       │        ┌──────────────────┐
  │  (hosted service) │◄───────│  Your App / CLI  │
  │  31 endpoints     │        │  (direct API use)│
  │  3 access tiers   │        └──────────────────┘
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │   Nook Agent      │  ◄── this repo
  │  (self-hosted)    │
  │ ┌──────────────┐  │
  │ │  LLM Engine  │  │
  │ │  OpenAI /    │  │
  │ │  Anthropic   │  │
  │ └──────────────┘  │
  │  React UI         │
  │  Telegram Bot     │
  └──────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | Express 5, Node.js |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| LLM providers | OpenAI SDK, Anthropic SDK |
| Telegram | node-telegram-bot-api |
| Streaming | Server-Sent Events (SSE) |

## Development

### Frontend hot reload

```bash
npm run dev:frontend    # Vite dev server on :5173, proxies API to :3001
```

### Project structure

```
nook/
├── lib/                   # Core agent logic
│   ├── agent.js           # Agent loop — LLM tool calling
│   ├── agentStream.js     # Streaming agent (SSE)
│   ├── toolRegistry.js    # API endpoints → LLM tool definitions
│   ├── endpoints.js       # 31 Nook API endpoint definitions
│   ├── nookClient.js      # Nook API client
│   ├── providers/         # OpenAI + Anthropic adapters
│   └── ...
├── frontend/              # React + Vite + Tailwind
├── public/                # Pre-built frontend (ships with repo)
├── routes/                # Express route handlers
├── middleware/             # Auth, rate limiting, setup guard
├── deploy/                # Server deployment (Caddy, systemd)
└── index.js               # Entry point
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
