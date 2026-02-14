const { Router } = require('express');
const { isConfigured, saveSettings, loadSettings } = require('../lib/settings');
const { login, setCookie, hashPassword, parseCookies, isValidSession } = require('../middleware/auth');

const router = Router();

router.get('/setup/status', (_req, res) => {
  const configured = isConfigured();
  const needs = [];

  if (!configured) {
    const s = loadSettings();
    if (!s.password) needs.push('password');
    if (!s.nookApiKey) needs.push('nookApiKey');
    if (!s.openaiApiKey && !s.anthropicApiKey) needs.push('llmApiKey');
  }

  res.json({ configured, needs });
});

router.post('/setup/complete', (req, res) => {
  // If already configured, require authentication
  if (isConfigured()) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.nook_session;
    if (!token || !isValidSession(token)) {
      return res.status(403).json({ error: 'Agent is already configured. Authenticate first.' });
    }
  }

  const { provider, openaiApiKey, anthropicApiKey, nookApiKey, nookApiUrl, password } = req.body || {};

  // Validate required fields
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  if (!nookApiKey) {
    return res.status(400).json({ error: 'Nook API key is required' });
  }
  if (!provider || !['openai', 'anthropic'].includes(provider)) {
    return res.status(400).json({ error: 'Provider must be "openai" or "anthropic"' });
  }
  if (provider === 'openai' && !openaiApiKey) {
    return res.status(400).json({ error: 'OpenAI API key is required for the OpenAI provider' });
  }
  if (provider === 'anthropic' && !anthropicApiKey) {
    return res.status(400).json({ error: 'Anthropic API key is required for the Anthropic provider' });
  }

  // Save settings
  const toSave = { provider, nookApiKey, password: hashPassword(password) };
  if (nookApiUrl) toSave.nookApiUrl = nookApiUrl;
  if (openaiApiKey) toSave.openaiApiKey = openaiApiKey;
  if (anthropicApiKey) toSave.anthropicApiKey = anthropicApiKey;
  if (req.body.openaiModel) toSave.openaiModel = req.body.openaiModel;
  if (req.body.anthropicModel) toSave.anthropicModel = req.body.anthropicModel;

  saveSettings(toSave);

  // Auto-login
  const settings = loadSettings();
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const result = login(password, settings, ip);
  if (result.success) {
    setCookie(res, result.token, req);
  }

  res.json({ success: true, configured: isConfigured() });
});

module.exports = router;
