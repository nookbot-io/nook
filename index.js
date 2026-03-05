const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { loadSettings, isConfigured } = require('./lib/settings');
const { setupGuard } = require('./middleware/setup');
const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const setupRoutes = require('./routes/setup');
const chatRoutes = require('./routes/chat');
const settingsRoutes = require('./routes/settings');
const presetsRoutes = require('./routes/presets');

const app = express();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Setup guard — blocks non-setup routes when unconfigured
app.use(setupGuard);

// Public routes (no auth required)
app.use(authRoutes);
app.use(setupRoutes);

// Protected routes — require auth
app.use(chatRoutes.prefix, requireAuth, chatRoutes.router);
app.use(settingsRoutes.prefix, requireAuth, settingsRoutes.router);
app.use(presetsRoutes.prefix, requireAuth, presetsRoutes.router);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
async function start() {
  // Interactive terminal setup on first run
  if (!isConfigured() && process.stdin.isTTY) {
    try {
      const { runTerminalSetup } = require('./lib/setup');
      await runTerminalSetup();
    } catch (err) {
      console.error('Terminal setup error:', err.message || err);
      console.log('Falling back to browser setup wizard.');
    }
  } else if (!isConfigured()) {
    console.log('Nook Agent is not configured.');
    console.log('Open the web UI in your browser to complete setup.');
  }

  const settings = loadSettings();
  const port = settings.port || 3001;

  app.listen(port, () => {
    console.log(`Nook Agent running on port ${port}`);

    // Auto-start Telegram bot if configured
    if (settings.telegramEnabled && settings.telegramBotToken) {
      const { startBot } = require('./lib/telegram');
      startBot(settings);
    }
  });
}

start();
