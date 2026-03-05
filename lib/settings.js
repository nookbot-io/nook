const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULTS = {
  provider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-5.2',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-5',
  ollamaUrl: 'http://localhost:11434/v1',
  ollamaModel: 'llama3.1',
  nookApiUrl: 'https://api.nookbot.io',
  nookApiKey: '',
  password: '',
  maxToolCalls: 25,
  temperature: 0.7,
  maxTokens: 16384,
  systemPrompt: '',
  agentRateLimit: 20,
  telegramBotToken: '',
  telegramAllowedChatIds: [],
  telegramEnabled: false,
  port: 3001,
  sessionMaxAgeHours: 24,
  maxLoginAttempts: 5,
  loginLockoutMinutes: 15,
  conversationMaxMessages: 40,
  conversationTtlHours: 2,
  trimmerMaxChars: 64000,
  resolverCacheTtlMinutes: 10,
};

const MODEL_LISTS = {
  openai: ['gpt-5.2', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'],
  anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-opus-4-6', 'claude-sonnet-4-0', 'claude-3-7-sonnet-latest'],
  ollama: ['llama3.1', 'llama3.2', 'mistral', 'mixtral', 'qwen2.5', 'gemma2', 'deepseek-r1', 'phi3', 'codellama'],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSettings() {
  ensureDataDir();

  let stored = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      stored = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch {
      stored = {};
    }
  }

  const settings = { ...DEFAULTS, ...stored };

  // Env var overrides
  if (process.env.LLM_PROVIDER) settings.provider = process.env.LLM_PROVIDER;
  if (process.env.OPENAI_API_KEY) settings.openaiApiKey = process.env.OPENAI_API_KEY;
  if (process.env.OPENAI_MODEL) settings.openaiModel = process.env.OPENAI_MODEL;
  if (process.env.ANTHROPIC_API_KEY) settings.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.ANTHROPIC_MODEL) settings.anthropicModel = process.env.ANTHROPIC_MODEL;
  if (process.env.OLLAMA_URL) settings.ollamaUrl = process.env.OLLAMA_URL;
  if (process.env.OLLAMA_MODEL) settings.ollamaModel = process.env.OLLAMA_MODEL;
  if (process.env.NOOK_API_URL) settings.nookApiUrl = process.env.NOOK_API_URL;
  if (process.env.NOOK_API_KEY) settings.nookApiKey = process.env.NOOK_API_KEY;
  if (process.env.AGENT_PASSWORD) settings.password = process.env.AGENT_PASSWORD;
  if (process.env.AGENT_PORT) settings.port = parseInt(process.env.AGENT_PORT, 10);
  if (process.env.AGENT_RATE_LIMIT) settings.agentRateLimit = parseInt(process.env.AGENT_RATE_LIMIT, 10);
  if (process.env.TELEGRAM_BOT_TOKEN) settings.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (process.env.TELEGRAM_ENABLED) settings.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true';
  if (process.env.SESSION_MAX_AGE_HOURS) settings.sessionMaxAgeHours = parseInt(process.env.SESSION_MAX_AGE_HOURS, 10);
  if (process.env.MAX_LOGIN_ATTEMPTS) settings.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10);
  if (process.env.LOGIN_LOCKOUT_MINUTES) settings.loginLockoutMinutes = parseInt(process.env.LOGIN_LOCKOUT_MINUTES, 10);
  if (process.env.CONVERSATION_MAX_MESSAGES) settings.conversationMaxMessages = parseInt(process.env.CONVERSATION_MAX_MESSAGES, 10);
  if (process.env.CONVERSATION_TTL_HOURS) settings.conversationTtlHours = parseInt(process.env.CONVERSATION_TTL_HOURS, 10);
  if (process.env.TRIMMER_MAX_CHARS) settings.trimmerMaxChars = parseInt(process.env.TRIMMER_MAX_CHARS, 10);
  if (process.env.RESOLVER_CACHE_TTL_MINUTES) settings.resolverCacheTtlMinutes = parseInt(process.env.RESOLVER_CACHE_TTL_MINUTES, 10);

  return settings;
}

function saveSettings(partial) {
  ensureDataDir();

  let stored = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      stored = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch {
      stored = {};
    }
  }

  Object.assign(stored, partial);
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(stored, null, 2));

  return loadSettings();
}

function isConfigured() {
  const s = loadSettings();
  if (!s.password) return false;
  if (!s.nookApiKey) return false;

  // Active provider must have its key (Ollama doesn't need one)
  if (s.provider === 'openai' && !s.openaiApiKey) return false;
  if (s.provider === 'anthropic' && !s.anthropicApiKey) return false;

  // At least one LLM provider must be usable
  if (!s.openaiApiKey && !s.anthropicApiKey && s.provider !== 'ollama') return false;

  return true;
}

function maskKey(key) {
  if (!key || key.length < 8) return '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

function getMaskedSettings() {
  const s = loadSettings();
  return {
    provider: s.provider,
    openaiApiKey: maskKey(s.openaiApiKey),
    openaiModel: s.openaiModel,
    anthropicApiKey: maskKey(s.anthropicApiKey),
    anthropicModel: s.anthropicModel,
    ollamaUrl: s.ollamaUrl,
    ollamaModel: s.ollamaModel,
    nookApiUrl: s.nookApiUrl,
    nookApiKey: maskKey(s.nookApiKey),
    maxToolCalls: s.maxToolCalls,
    temperature: s.temperature,
    maxTokens: s.maxTokens,
    systemPrompt: s.systemPrompt,
    agentRateLimit: s.agentRateLimit,
    telegramBotToken: maskKey(s.telegramBotToken),
    telegramAllowedChatIds: s.telegramAllowedChatIds,
    telegramEnabled: s.telegramEnabled,
    port: s.port,
    sessionMaxAgeHours: s.sessionMaxAgeHours,
    maxLoginAttempts: s.maxLoginAttempts,
    loginLockoutMinutes: s.loginLockoutMinutes,
    conversationMaxMessages: s.conversationMaxMessages,
    conversationTtlHours: s.conversationTtlHours,
    trimmerMaxChars: s.trimmerMaxChars,
    resolverCacheTtlMinutes: s.resolverCacheTtlMinutes,
  };
}

module.exports = { loadSettings, saveSettings, isConfigured, getMaskedSettings, DEFAULTS, MODEL_LISTS };
