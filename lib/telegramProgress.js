const TYPING_INTERVAL = 4000;

function startTyping(bot, chatId) {
  let stopped = false;

  const send = () => {
    if (stopped) return;
    bot.sendChatAction(chatId, 'typing').catch(() => {});
  };

  send();
  const interval = setInterval(send, TYPING_INTERVAL);

  return {
    stop() {
      stopped = true;
      clearInterval(interval);
    },
  };
}

async function sendProgress(bot, chatId, text, existingMsg) {
  try {
    if (existingMsg) {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: existingMsg.message_id,
        parse_mode: 'HTML',
      });
      return existingMsg;
    }
    return await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch {
    // If edit fails (e.g. same content), return existing
    return existingMsg || null;
  }
}

async function deleteProgress(bot, chatId, msg) {
  if (!msg) return;
  try {
    await bot.deleteMessage(chatId, msg.message_id);
  } catch {
    // Silently ignore — message may already be deleted
  }
}

module.exports = { startTyping, sendProgress, deleteProgress };
