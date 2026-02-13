const { loadSettings } = require('../lib/settings');

// sessionId → [timestamps]
const windows = new Map();

// Clean old entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of windows) {
    const valid = timestamps.filter((t) => now - t < 60000);
    if (valid.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, valid);
    }
  }
}, 60000).unref();

function agentRateLimit(req, res, next) {
  const settings = loadSettings();
  const limit = settings.agentRateLimit || 20;
  const now = Date.now();
  const window = 60000; // 1 minute

  // Use session cookie token as key (or IP as fallback)
  const key = req.cookies?.nook_session || req.ip;
  if (!key) return next();

  const timestamps = windows.get(key) || [];
  const valid = timestamps.filter((t) => now - t < window);

  if (valid.length >= limit) {
    const oldest = valid[0];
    const retryAfter = Math.ceil((oldest + window - now) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded. Please slow down.',
      retryAfter,
    });
  }

  valid.push(now);
  windows.set(key, valid);
  next();
}

module.exports = { agentRateLimit };
