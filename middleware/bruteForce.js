const { loadSettings } = require('../lib/settings');

const attempts = new Map();

function getMaxAttempts() {
  return loadSettings().maxLoginAttempts;
}

function getLockoutMs() {
  return loadSettings().loginLockoutMinutes * 60 * 1000;
}

function checkBrute(ip) {
  const record = attempts.get(ip);
  if (!record) return { allowed: true };

  const lockoutMs = getLockoutMs();

  // Check lockout
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 1000 / 60);
    return { allowed: false, message: `Too many failed attempts. Try again in ${remaining} minute(s).` };
  }

  // Decay after no attempts
  if (Date.now() - record.lastAttempt > lockoutMs) {
    attempts.delete(ip);
    return { allowed: true };
  }

  if (record.attempts >= getMaxAttempts()) {
    record.lockedUntil = Date.now() + lockoutMs;
    const remaining = Math.ceil(lockoutMs / 1000 / 60);
    return { allowed: false, message: `Too many failed attempts. Try again in ${remaining} minute(s).` };
  }

  return { allowed: true };
}

function recordFailure(ip) {
  const record = attempts.get(ip) || { attempts: 0, lastAttempt: 0, lockedUntil: null };
  record.attempts++;
  record.lastAttempt = Date.now();
  attempts.set(ip, record);
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

module.exports = { checkBrute, recordFailure, recordSuccess };
