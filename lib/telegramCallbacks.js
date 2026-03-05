const { saveRating } = require('./ratings');
const { PRESETS } = require('./telegramCommands');

// In-memory caches shared with telegram.js
let suggestionCache = null;
let paginationCache = null;

function init(sugCache, pagCache) {
  suggestionCache = sugCache;
  paginationCache = pagCache;
}

function registerCallbacks(bot, isAllowed, handleMessage, sendFormatted) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (!isAllowed(chatId)) {
      bot.answerCallbackQuery(query.id, { text: 'Not authorized' });
      return;
    }

    const data = query.data;
    bot.answerCallbackQuery(query.id).catch(() => {});

    // Rating: rate:<msgIdx>:<up|down>
    if (data.startsWith('rate:')) {
      await handleRating(bot, query, data);
      return;
    }

    // Suggestion: s:<hexId>:<index>
    if (data.startsWith('s:')) {
      await handleSuggestion(bot, query, data, handleMessage);
      return;
    }

    // Preset: preset:<presetId>
    if (data.startsWith('preset:')) {
      await handlePreset(bot, query, data, handleMessage);
      return;
    }

    // Pagination: page:<hexId>:<pageNum>
    if (data.startsWith('page:')) {
      await handlePagination(bot, query, data, sendFormatted);
      return;
    }
  });
}

async function handleRating(bot, query, data) {
  const parts = data.split(':');
  const msgIdx = parseInt(parts[1], 10);
  const rating = parts[2]; // 'up' or 'down'
  const chatId = query.message.chat.id;
  const sessionId = `tg_${chatId}`;

  saveRating(sessionId, msgIdx, rating === 'up' ? 1 : -1);

  // Update button to show selection
  const selected = rating === 'up' ? '👍 Rated' : '👎 Rated';
  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: selected, callback_data: 'noop' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    );
  } catch {
    // Ignore if message can't be edited
  }
}

async function handleSuggestion(bot, query, data, handleMessage) {
  const parts = data.split(':');
  const hexId = parts[1];
  const index = parseInt(parts[2], 10);

  const suggestions = suggestionCache?.get(hexId);
  if (!suggestions || !suggestions[index]) {
    bot.sendMessage(query.message.chat.id, 'Suggestion expired. Please type your question.');
    return;
  }

  // Create a fake message object for handleMessage
  const fakeMsg = {
    chat: { id: query.message.chat.id },
    message_id: query.message.message_id,
  };
  handleMessage(fakeMsg, suggestions[index]);
}

async function handlePreset(bot, query, data, handleMessage) {
  const presetId = data.split(':')[1];
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  const fakeMsg = {
    chat: { id: query.message.chat.id },
    message_id: query.message.message_id,
  };
  handleMessage(fakeMsg, preset.prompt);
}

async function handlePagination(bot, query, data, sendFormatted) {
  const parts = data.split(':');
  const hexId = parts[1];
  const pageNum = parseInt(parts[2], 10);
  const chatId = query.message.chat.id;

  const pages = paginationCache?.get(hexId);
  if (!pages || !pages[pageNum]) {
    bot.sendMessage(chatId, 'Content expired. Please ask again.');
    return;
  }

  const isLast = pageNum >= pages.length - 1;
  const keyboard = isLast
    ? []
    : [[{ text: 'Show more ▼', callback_data: `page:${hexId}:${pageNum + 1}` }]];

  await sendFormatted(chatId, pages[pageNum], {
    reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined,
  });
}

module.exports = { registerCallbacks, init };
