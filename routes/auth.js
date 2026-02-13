const { Router } = require('express');
const { login, logout, setCookie, clearCookie, parseCookies, isValidSession } = require('../middleware/auth');
const { checkBrute, recordFailure, recordSuccess } = require('../middleware/bruteForce');
const { loadSettings, isConfigured } = require('../lib/settings');

const router = Router();

router.get('/auth/status', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.nook_session;
  const authenticated = token ? isValidSession(token) : false;
  res.json({ authenticated, setupRequired: !isConfigured() });
});

router.post('/auth/login', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const brute = checkBrute(ip);
  if (!brute.allowed) {
    return res.status(429).json({ error: brute.message });
  }

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const settings = loadSettings();
  const result = login(password, settings, ip);

  if (!result.success) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Invalid password' });
  }

  recordSuccess(ip);
  setCookie(res, result.token);
  res.json({ success: true });
});

router.post('/auth/logout', (req, res) => {
  logout(req.headers.cookie);
  clearCookie(res);
  res.json({ success: true });
});

module.exports = router;
