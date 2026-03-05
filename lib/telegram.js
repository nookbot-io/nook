const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const { runAgent } = require('./agent');
const { loadSettings } = require('./settings');
const { toTelegramMarkdown, toTelegramHTML, splitMessage, parseFollowUps } = require('./telegramFormatter');
const { startTyping, sendProgress, deleteProgress } = require('./telegramProgress');
const { registerCommands } = require('./telegramCommands');
const { registerCallbacks, init: initCallbacks } = require('./telegramCallbacks');
const { getMessages } = require('./sessions');

let bot = null;
let running = false;

// In-memory caches
const suggestionCache = new Map(); // hexId → [suggestion strings]
const paginationCache = new Map(); // hexId → [page strings]
const activeRequests = new Map();  // chatId → AbortController

// Telegram system prompt addition for concise responses
const TELEGRAM_INSTRUCTIONS = `

## Telegram-specific formatting rules
You are responding in a Telegram chat. Keep responses concise and mobile-friendly:
- Use bullet points instead of long paragraphs
- Limit tables to 5 rows maximum; summarize if more data exists
- Keep total response under 2000 characters when possible
- Skip lengthy introductions; lead with data
- For discovery queries, show top 5 results instead of 10
- Omit the "Analyst Notes" section unless the user specifically asks for analysis`;

// Solana address pattern
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isRunning() {
  return running;
}

function startBot(settings) {
  if (running) return;

  const token = settings.telegramBotToken;
  if (!token) {
    console.log('Telegram bot: no token configured, skipping.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    running = true;
    console.log('Telegram bot started (polling).');

    const checkAllowed = (chatId) => {
      const s = loadSettings();
      return isAllowed(chatId, s);
    };

    // Initialize callback caches
    initCallbacks(suggestionCache, paginationCache);

    // Register commands
    registerCommands(bot, checkAllowed, handleMessage);

    // Register callback query handlers
    registerCallbacks(bot, checkAllowed, handleMessage, sendFormatted);

    // /cancel command — handled here because it needs activeRequests
    bot.onText(/\/cancel/, (msg) => {
      const chatId = msg.chat.id;
      if (!checkAllowed(chatId)) return;

      const controller = activeRequests.get(chatId);
      if (controller) {
        controller.abort();
        activeRequests.delete(chatId);
        bot.sendMessage(chatId, 'Request cancelled.');
      } else {
        bot.sendMessage(chatId, 'No active request to cancel.');
      }
    });

    // Handle all non-command messages
    bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      const chatId = msg.chat.id;
      if (!checkAllowed(chatId)) {
        bot.sendMessage(chatId, 'You are not authorized to use this bot.');
        return;
      }
      handleMessage(msg);
    });

    // Handle polling errors
    bot.on('polling_error', (err) => {
      console.error('Telegram polling error:', err.message);
    });

    // Cache cleanup every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of suggestionCache) {
        if (val._expires && val._expires < now) suggestionCache.delete(key);
      }
      for (const [key, val] of paginationCache) {
        if (val._expires && val._expires < now) paginationCache.delete(key);
      }
    }, 5 * 60 * 1000).unref();

  } catch (err) {
    console.error('Failed to start Telegram bot:', err.message);
    running = false;
  }
}

async function handleMessage(msg, overrideText) {
  const chatId = msg.chat.id;
  let text = overrideText || msg.text;

  // Auto-detect Solana addresses
  if (SOLANA_ADDRESS_RE.test(text.trim())) {
    text = `Look up token or wallet: ${text.trim()}`;
  }

  const currentSettings = loadSettings();
  const sessionId = `tg_${chatId}`;

  // Clone settings and append Telegram instructions to system prompt
  const tgSettings = {
    ...currentSettings,
    systemPrompt: (currentSettings.systemPrompt || '') + TELEGRAM_INSTRUCTIONS,
  };

  // Abort any existing request for this chat
  const existing = activeRequests.get(chatId);
  if (existing) existing.abort();

  const controller = new AbortController();
  activeRequests.set(chatId, controller);

  // Start typing indicator
  const typing = startTyping(bot, chatId);
  let progressMsg = null;

  try {
    // Track tool call count for progress
    let toolCallCount = 0;

    const result = await Promise.race([
      runAgent(sessionId, text, tgSettings, {
        onToolCall(call) {
          toolCallCount++;
          const label = formatToolName(call.name);
          const progressText = `⏳ ${label}${toolCallCount > 1 ? ` (${toolCallCount} tools used)` : ''}`;
          sendProgress(bot, chatId, progressText, progressMsg).then((m) => {
            progressMsg = m;
          }).catch(() => {});
        },
      }),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('cancelled')));
      }),
    ]);

    activeRequests.delete(chatId);
    typing.stop();
    await deleteProgress(bot, chatId, progressMsg);

    // Parse follow-ups from response
    const { text: replyText, suggestions } = parseFollowUps(result.reply);

    // Build inline keyboard
    const keyboard = [];

    // Suggestion buttons
    if (suggestions.length > 0) {
      const hexId = crypto.randomBytes(4).toString('hex');
      const cached = suggestions.slice();
      cached._expires = Date.now() + 10 * 60 * 1000; // 10 min TTL
      suggestionCache.set(hexId, cached);

      for (let i = 0; i < suggestions.length; i++) {
        const label = suggestions[i].length > 40
          ? suggestions[i].slice(0, 37) + '...'
          : suggestions[i];
        keyboard.push([{ text: `💡 ${label}`, callback_data: `s:${hexId}:${i}` }]);
      }
    }

    // Rating buttons — use message count as index
    const messages = getMessages(sessionId);
    const msgIdx = messages.length - 1;
    keyboard.push([
      { text: '👍', callback_data: `rate:${msgIdx}:up` },
      { text: '👎', callback_data: `rate:${msgIdx}:down` },
    ]);

    // Handle pagination for long responses
    const formatted = toTelegramMarkdown(replyText);
    const parts = splitMessage(formatted);

    if (parts.length > 1) {
      // Store pages for pagination
      const hexId = crypto.randomBytes(4).toString('hex');
      const pages = parts.slice();
      pages._expires = Date.now() + 10 * 60 * 1000;
      paginationCache.set(hexId, pages);

      // Send first page with "Show more" button
      const pageKeyboard = [
        [{ text: 'Show more ▼', callback_data: `page:${hexId}:1` }],
        ...keyboard,
      ];

      await sendFormatted(chatId, parts[0], {
        reply_to_message_id: msg.message_id,
        reply_markup: { inline_keyboard: pageKeyboard },
      });
    } else {
      await sendFormatted(chatId, formatted, {
        reply_to_message_id: msg.message_id,
        reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined,
      });
    }

  } catch (err) {
    activeRequests.delete(chatId);
    typing.stop();
    await deleteProgress(bot, chatId, progressMsg);

    if (err.message === 'cancelled') return;

    console.error('Telegram bot error:', err.message);
    bot.sendMessage(chatId, 'Sorry, an error occurred while processing your request.');
  }
}

async function sendFormatted(chatId, text, opts = {}) {
  // Try MarkdownV2 first
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2', ...opts });
  } catch {
    // Fallback to HTML
  }

  // Try HTML
  try {
    const htmlText = toTelegramHTML(stripMarkdownV2Escapes(text));
    return await bot.sendMessage(chatId, htmlText, { parse_mode: 'HTML', ...opts });
  } catch {
    // Fallback to plain text
  }

  // Plain text — strip all formatting
  const plain = text
    .replace(/\\([_*[\]()~`>#+\-=|{}.!\\])/g, '$1')
    .slice(0, 4096);
  return await bot.sendMessage(chatId, plain, opts);
}

function stripMarkdownV2Escapes(text) {
  return text.replace(/\\([_*[\]()~`>#+\-=|{}.!\\])/g, '$1');
}

function formatToolName(name) {
  return name
    .replace(/^get_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stopBot() {
  if (!running || !bot) return;

  try {
    bot.stopPolling();
    bot = null;
    running = false;
    suggestionCache.clear();
    paginationCache.clear();
    activeRequests.clear();
    console.log('Telegram bot stopped.');
  } catch (err) {
    console.error('Error stopping Telegram bot:', err.message);
  }
}

function isAllowed(chatId, settings) {
  const allowedIds = settings.telegramAllowedChatIds || [];
  if (allowedIds.length === 0) return false;
  return allowedIds.includes(chatId) || allowedIds.includes(String(chatId));
}

module.exports = { startBot, stopBot, isRunning };
