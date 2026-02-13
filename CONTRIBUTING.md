# Contributing to Nook

Thanks for your interest in contributing! This guide covers the Nook Agent — an open-source AI chat assistant for Solana.

## Prerequisites

- **Node.js 22+**
- **Nook API key** — free at [nookbot.io](https://nookbot.io)
- **LLM API key** — [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)

## Dev Setup

```bash
git clone https://github.com/nookbot-io/nook.git
cd nook
npm install

cp .env.example .env
# Fill in NOOK_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY, and AGENT_PASSWORD

npm start
```

Open [http://localhost:3001](http://localhost:3001) — the setup wizard will guide you if anything is missing.

## Project Structure

```
nook/
├── index.js               # Express server entry point
├── lib/
│   ├── agent.js           # Core loop — message → LLM → tool calls → response
│   ├── agentStream.js     # SSE streaming async generator
│   ├── endpoints.js       # 31 Nook API endpoint definitions
│   ├── toolRegistry.js    # Converts endpoints → LLM tool definitions
│   ├── nookClient.js      # HTTP client for calling the Nook API
│   ├── settings.js        # File-based settings with env var overrides
│   ├── telegram.js        # Telegram bot integration
│   └── providers/
│       ├── base.js        # Provider interface (abstract)
│       ├── openai.js      # OpenAI adapter
│       └── anthropic.js   # Anthropic adapter
├── routes/                # Express route handlers
├── middleware/             # Auth, rate limiting, setup guard
├── frontend/              # React + Vite + Tailwind v4
└── public/                # Pre-built frontend (served by Express)
```

## Frontend Development

```bash
npm run dev:frontend    # Vite dev server on :5173, proxies API to :3001
```

The frontend uses React 19, Vite 6, and Tailwind CSS v4. Tailwind v4 uses the `@theme` directive in CSS instead of `tailwind.config.js`.

Build the frontend for production:

```bash
npm run build:frontend  # Outputs to public/
```

## Adding a New LLM Provider

1. Create `lib/providers/yourprovider.js`
2. Extend `BaseProvider` from `base.js` and implement:
   - `formatTools(tools)` — convert canonical tool definitions to provider format
   - `formatMessages(messages)` — convert message history to provider format
   - `chat(messages, tools)` — single-response completion
   - `chatStream(messages, tools)` — streaming completion (async generator)
   - `formatToolResult(toolCallId, result)` — format tool results for the provider
3. Register the provider in `lib/agent.js` and `lib/agentStream.js`

## Code Style

- **Semicolons**: yes
- **Quotes**: single quotes
- **Indentation**: 2 spaces
- **Modules**: CommonJS (`require` / `module.exports`)
- **Naming**: camelCase for variables/functions, PascalCase for classes

## Submitting a PR

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test manually (run the agent, verify your changes work)
4. Keep PRs focused — one feature or fix per PR
5. Write a clear description of what changed and why

## Questions?

Open an [issue](https://github.com/nookbot-io/nook/issues) — we're happy to help.
