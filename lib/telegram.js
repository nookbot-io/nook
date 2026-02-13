const TelegramBot = require('node-telegram-bot-api');
const { runAgent } = require('./agent');
const { loadSettings } = require('./settings');
const { toTelegramMarkdown, splitMessage } = require('./telegramFormatter');

let bot = null;
let running = false;

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

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      if (!isAllowed(chatId, settings)) return;
      bot.sendMessage(chatId, 'Welcome to Nook Agent! Send me a message to ask about Solana tokens, wallets, and market data.');
    });

    // Handle all other messages
    bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const currentSettings = loadSettings();

      if (!isAllowed(chatId, currentSettings)) {
        bot.sendMessage(chatId, 'You are not authorized to use this bot.');
        return;
      }

      // Send typing indicator
      bot.sendChatAction(chatId, 'typing');

      const sessionId = `tg_${chatId}`;
      try {
        const result = await runAgent(sessionId, msg.text, currentSettings);
        const formatted = toTelegramMarkdown(result.reply);
        const parts = splitMessage(formatted);

        for (const part of parts) {
          try {
            await bot.sendMessage(chatId, part, { parse_mode: 'MarkdownV2' });
          } catch {
            // Fallback to plain text if MarkdownV2 fails
            await bot.sendMessage(chatId, result.reply.slice(0, 4096));
            break;
          }
        }
      } catch (err) {
        console.error('Telegram bot error:', err.message);
        bot.sendMessage(chatId, 'Sorry, an error occurred while processing your request.');
      }
    });

    // Handle polling errors
    bot.on('polling_error', (err) => {
      console.error('Telegram polling error:', err.message);
    });

  } catch (err) {
    console.error('Failed to start Telegram bot:', err.message);
    running = false;
  }
}

function stopBot() {
  if (!running || !bot) return;

  try {
    bot.stopPolling();
    bot = null;
    running = false;
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
