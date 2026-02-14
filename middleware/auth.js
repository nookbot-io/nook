const crypto = require('crypto');
const { loadSettings } = require('../lib/settings');

const sessions = new Map();
const TOKEN_LENGTH = 32;
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 min

function getMaxAge() {
  return loadSettings().sessionMaxAgeHours * 3600;
}

function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;

  // Legacy plaintext — no colon means unhashed
  if (!stored.includes(':')) {
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  const [salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(derived, Buffer.from(hash, 'hex'));
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  }
  return cookies;
}

function login(password, settings, ip) {
  if (!verifyPassword(password, settings.password)) {
    return { success: false };
  }
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), ip });
  return { success: true, token };
}

function logout(cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  const token = cookies.nook_session;
  if (token) sessions.delete(token);
}

function invalidateAll() {
  sessions.clear();
}

function isValidSession(token) {
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > getMaxAge() * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.nook_session;

  if (!token || !isValidSession(token)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

function setCookie(res, token, req) {
  const secure = req && (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `nook_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${getMaxAge()}${secure}`);
}

function clearCookie(res, req) {
  const secure = req && (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `nook_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
}

// Cleanup expired sessions
function cleanup() {
  const now = Date.now();
  const maxAge = getMaxAge();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > maxAge * 1000) {
      sessions.delete(token);
    }
  }
}

setInterval(cleanup, CLEANUP_INTERVAL).unref();

module.exports = { requireAuth, login, logout, invalidateAll, setCookie, clearCookie, parseCookies, isValidSession, hashPassword, verifyPassword };
