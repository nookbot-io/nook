# Changelog

All notable changes to this project will be documented in this file.

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
