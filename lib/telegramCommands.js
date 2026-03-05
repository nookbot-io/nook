const { deleteSession } = require('./sessions');
const { loadSettings } = require('./settings');

const HELP_TEXT = `<b>Nook Agent</b> — Solana AI Assistant

<b>Commands:</b>
/help — Show this help message
/new — Start a new conversation
/presets — Quick prompts for common queries
/settings — Show current provider and model
/price &lt;token&gt; — Quick price check
/trending — What's trending right now
/wallet &lt;address&gt; — Wallet overview
/cancel — Cancel active request

Just send any message to chat with the AI.
You can also paste a Solana address directly to look it up.`;

const PRESETS = [
  { id: 'trending', label: '📈 Trending', prompt: "What's trending right now?" },
  { id: 'gems', label: '💎 Low-cap Gems', prompt: 'Find safe low-cap gems under $5M market cap' },
  { id: 'graduated', label: '🎓 Recently Graduated', prompt: 'Show me recently graduated tokens' },
  { id: 'volume', label: '📊 Volume Leaders', prompt: "What are today's volume leaders?" },
  { id: 'sentiment', label: '🌡️ Market Sentiment', prompt: 'What is the current market sentiment?' },
  { id: 'new', label: '🆕 New Tokens', prompt: 'Show me promising new tokens launched in the last 24 hours' },
];

function registerCommands(bot, isAllowed, handleMessage) {
  // Set bot command menu
  bot.setMyCommands([
    { command: 'help', description: 'Show help and available commands' },
    { command: 'new', description: 'Start a new conversation' },
    { command: 'presets', description: 'Quick prompts for common queries' },
    { command: 'settings', description: 'Show current provider and model' },
    { command: 'price', description: 'Quick price check — /price SOL' },
    { command: 'trending', description: "What's trending right now" },
    { command: 'wallet', description: 'Wallet overview — /wallet <address>' },
    { command: 'cancel', description: 'Cancel active request' },
  ]).catch(() => {});

  // /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    bot.sendMessage(chatId, HELP_TEXT, { parse_mode: 'HTML' });
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    bot.sendMessage(chatId, HELP_TEXT, { parse_mode: 'HTML' });
  });

  // /new
  bot.onText(/\/new/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    const sessionId = `tg_${chatId}`;
    deleteSession(sessionId);
    bot.sendMessage(chatId, '🔄 New conversation started.');
  });

  // /presets
  bot.onText(/\/presets/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    const keyboard = PRESETS.map((p) => [
      { text: p.label, callback_data: `preset:${p.id}` },
    ]);
    bot.sendMessage(chatId, 'Choose a preset:', {
      reply_markup: { inline_keyboard: keyboard },
    });
  });

  // /settings
  bot.onText(/\/settings/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    const s = loadSettings();
    const provider = s.provider;
    const model =
      provider === 'openai' ? s.openaiModel :
      provider === 'anthropic' ? s.anthropicModel :
      s.ollamaModel;
    bot.sendMessage(
      chatId,
      `<b>Provider:</b> ${provider}\n<b>Model:</b> ${model}\n<b>Max tool calls:</b> ${s.maxToolCalls}`,
      { parse_mode: 'HTML' }
    );
  });

  // /price <token>
  bot.onText(/\/price\s+(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    handleMessage(msg, `What is the price of ${match[1]}?`);
  });

  // /trending
  bot.onText(/\/trending/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    handleMessage(msg, "What's trending right now?");
  });

  // /wallet <address>
  bot.onText(/\/wallet\s+(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(chatId)) return;
    handleMessage(msg, `Show me wallet ${match[1]}`);
  });

  // /cancel is handled in telegram.js via activeRequests map
}

module.exports = { registerCommands, PRESETS };
