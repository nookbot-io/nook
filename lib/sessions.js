const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const { deleteSessionCache } = require('./resolverCache');
const { loadSettings } = require('./settings');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'sessions.db');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let db = null;

function getDb() {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'New Chat',
        messages TEXT NOT NULL DEFAULT '[]',
        createdAt INTEGER NOT NULL,
        lastActive INTEGER NOT NULL
      )
    `);
  }
  return db;
}

function getMaxMessages() {
  return loadSettings().conversationMaxMessages;
}

function getSessionTtl() {
  return loadSettings().conversationTtlHours * 60 * 60 * 1000;
}

function createSession() {
  const id = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const session = {
    id,
    messages: [],
    createdAt: now,
    lastActive: now,
    title: 'New Chat',
  };

  getDb().prepare(
    'INSERT INTO sessions (id, title, messages, createdAt, lastActive) VALUES (?, ?, ?, ?, ?)'
  ).run(id, session.title, '[]', now, now);

  return session;
}

function getSession(id) {
  const row = getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!row) return null;

  // Update lastActive
  const now = Date.now();
  getDb().prepare('UPDATE sessions SET lastActive = ? WHERE id = ?').run(now, id);

  return {
    id: row.id,
    title: row.title,
    messages: JSON.parse(row.messages),
    createdAt: row.createdAt,
    lastActive: now,
  };
}

function listSessions() {
  const rows = getDb().prepare(
    'SELECT id, title, messages, createdAt, lastActive FROM sessions ORDER BY lastActive DESC'
  ).all();

  return rows.map((row) => {
    const messages = JSON.parse(row.messages);
    return {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      lastActive: row.lastActive,
      messageCount: messages.filter((m) => m.role === 'user' || m.role === 'assistant').length,
    };
  });
}

function deleteSession(id) {
  deleteSessionCache(id);
  const result = getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

function addMessage(id, msg) {
  const row = getDb().prepare('SELECT messages, title FROM sessions WHERE id = ?').get(id);
  if (!row) return;

  const messages = JSON.parse(row.messages);
  messages.push(msg);

  // Auto-title from first user message
  let title = row.title;
  if (msg.role === 'user' && title === 'New Chat') {
    title = msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '');
  }

  // Sliding window trim
  const trimmed = trimMessages(messages);

  const now = Date.now();
  getDb().prepare(
    'UPDATE sessions SET messages = ?, title = ?, lastActive = ? WHERE id = ?'
  ).run(JSON.stringify(trimmed), title, now, id);
}

function getMessages(id) {
  const row = getDb().prepare('SELECT messages FROM sessions WHERE id = ?').get(id);
  if (!row) return [];
  return JSON.parse(row.messages);
}

function trimMessages(messages) {
  const maxMessages = getMaxMessages();
  if (messages.length <= maxMessages) return messages;

  const system = messages[0]?.role === 'system' ? messages[0] : null;
  const rest = system ? messages.slice(1) : messages;
  const budget = system ? maxMessages - 1 : maxMessages;

  // Group tool_calls + following tool_result messages as atomic units
  const groups = [];
  let i = 0;
  while (i < rest.length) {
    if (rest[i].role === 'tool_calls') {
      const group = [rest[i]];
      i++;
      while (i < rest.length && rest[i].role === 'tool_result') {
        group.push(rest[i]);
        i++;
      }
      groups.push(group);
    } else {
      groups.push([rest[i]]);
      i++;
    }
  }

  // Keep groups from the end until budget exhausted
  const kept = [];
  let count = 0;
  for (let g = groups.length - 1; g >= 0; g--) {
    if (count + groups[g].length > budget) break;
    kept.unshift(...groups[g]);
    count += groups[g].length;
  }

  return system ? [system, ...kept] : kept;
}

// Prune inactive sessions
function pruneInactive() {
  const now = Date.now();
  const ttl = getSessionTtl();
  const cutoff = now - ttl;

  const stale = getDb().prepare('SELECT id FROM sessions WHERE lastActive < ?').all(cutoff);
  for (const row of stale) {
    deleteSessionCache(row.id);
  }
  getDb().prepare('DELETE FROM sessions WHERE lastActive < ?').run(cutoff);
}

const PRUNE_INTERVAL = 30 * 60 * 1000; // 30 min
setInterval(pruneInactive, PRUNE_INTERVAL).unref();

module.exports = { createSession, getSession, listSessions, deleteSession, addMessage, getMessages };
