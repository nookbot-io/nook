const { isConfigured } = require('../lib/settings');

function setupGuard(req, res, next) {
  if (isConfigured()) return next();

  // Allow auth and setup routes through
  if (req.path.startsWith('/auth') || req.path.startsWith('/setup')) {
    return next();
  }

  // Allow static files and assets
  if (req.path === '/' || req.path.startsWith('/assets/') ||
      /\.(html|css|js|jsx|ico|svg|png|jpg|woff2?|ttf|eot|map)$/.test(req.path)) {
    return next();
  }

  return res.status(503).json({ error: 'Agent not configured', setupRequired: true });
}

module.exports = { setupGuard };
