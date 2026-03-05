# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-03-05

### Added
- **Ollama support** — third LLM provider for running local models (Llama, Mistral, Qwen, etc.) via the Ollama API
- **Prompt presets** — save, edit, and reuse common prompts via the web UI or Telegram bot
- **Response ratings** — thumbs up/down on every response, persisted to disk for feedback tracking
- **Follow-up suggestions** — agent returns 3 contextual follow-up questions after every response, rendered as clickable buttons in both web UI and Telegram
- **Telegram bot overhaul:**
  - Bot commands: `/help`, `/new`, `/presets`, `/settings`, `/price`, `/trending`, `/wallet`, `/cancel`
  - Inline keyboard buttons for follow-up suggestions, rating, and presets
  - Typing indicator + progress messages during tool execution
  - Auto-detection of Solana addresses — paste an address to look it up
  - Pagination with "Show more" button for long responses
  - Triple fallback formatting: MarkdownV2 → HTML → plain text
  - Telegram-specific system prompt for concise, mobile-friendly responses
  - Cancel active requests with `/cancel`
- **Skeleton loading states** — shimmer animations in the web UI while waiting for data
- **Presets API** — `GET/POST/PUT/DELETE /presets` for managing prompt presets
- **Settings route** — dedicated `/settings` route with Telegram bot start/stop control

### Changed
- **Sessions migrated to SQLite** — replaced in-memory Map with `better-sqlite3` for persistence across restarts
- **Telegram formatter** — added `toTelegramHTML()` converter and `parseFollowUps()` for extracting suggestion blocks

### Fixed
- Secure cookie flag now based on request protocol instead of NODE_ENV
- Deployment script updated for curl|bash support with mandatory Caddy/systemd

## [1.1.0] - 2025-02-13

### Added
- Multi-provider LLM support (OpenAI + Anthropic) with unified interface
- SSE streaming for real-time responses in the web UI
- Telegram bot integration with MarkdownV2 formatting
- Token search with 50+ advanced filters (liquidity, holders, risk, volume, bundlers, etc.)
- 8 curated discovery tools (trending, volume leaders, top performers, graduating/graduated)
- Smart tool defaults — agent auto-applies sensible defaults to every API call
- Response filtering and trimming to keep LLM context efficient
- Per-session symbol-to-address resolver cache
- Session management with sliding-window message trimming
- Setup wizard for guided first-run configuration
- Brute force protection on login
- Per-session rate limiting
- One-command Ubuntu deployment script with Caddy + systemd
- React frontend with dark/light theme, session history, and settings panel

## [1.0.0] - 2025-01-15

### Added
- Initial release
- AI chat agent with OpenAI tool calling
- 31 Nook API endpoint integrations
- Web UI with chat interface
- Cookie-based authentication
- File-based settings with env var overrides
