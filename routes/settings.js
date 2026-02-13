const { Router } = require('express');
const { getMaskedSettings, saveSettings } = require('../lib/settings');
const { invalidateAll } = require('../middleware/auth');
const { startBot, stopBot, isRunning } = require('../lib/telegram');

const router = Router();

router.get('/', (_req, res) => {
  res.json(getMaskedSettings());
});

router.put('/', (req, res) => {
  const body = req.body || {};
  const update = {};

  // Only update fields that are present and not masked
  const fields = [
    'provider', 'openaiApiKey', 'openaiModel', 'anthropicApiKey', 'anthropicModel',
    'nookApiUrl', 'nookApiKey', 'maxToolCalls', 'temperature', 'maxTokens', 'systemPrompt',
    'agentRateLimit', 'telegramBotToken', 'telegramEnabled',
    'sessionMaxAgeHours', 'maxLoginAttempts', 'loginLockoutMinutes',
    'conversationMaxMessages', 'conversationTtlHours', 'trimmerMaxChars',
    'resolverCacheTtlMinutes',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      const val = body[field];
      // Skip masked API key values (contain "...")
      if (typeof val === 'string' && val.includes('...')) continue;
      update[field] = val;
    }
  }

  // Handle array fields
  if (Array.isArray(body.telegramAllowedChatIds)) {
    update.telegramAllowedChatIds = body.telegramAllowedChatIds;
  }

  // Handle password change separately
  if (body.password && typeof body.password === 'string' && body.password.length > 0) {
    update.password = body.password;
    invalidateAll();
  }

  if (Object.keys(update).length === 0) {
    return res.json(getMaskedSettings());
  }

  const saved = saveSettings(update);
  const masked = getMaskedSettings();

  // Restart telegram bot if relevant settings changed
  if ('telegramEnabled' in update || 'telegramBotToken' in update) {
    if (isRunning()) stopBot();
    if (saved.telegramEnabled && saved.telegramBotToken) {
      startBot(saved);
    }
  }

  res.json(masked);
});

module.exports = { prefix: '/settings', router };
