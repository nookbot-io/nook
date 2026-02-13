const crypto = require('crypto');
const { deleteSessionCache } = require('./resolverCache');
const { loadSettings } = require('./settings');

const sessions = new Map();
const PRUNE_INTERVAL = 30 * 60 * 1000; // 30 min

function getMaxMessages() {
  return loadSettings().conversationMaxMessages;
}

function getSessionTtl() {
  return loadSettings().conversationTtlHours * 60 * 60 * 1000;
}

function createSession() {
  const id = crypto.randomBytes(16).toString('hex');
  const session = {
    id,
    messages: [],
    createdAt: Date.now(),
    lastActive: Date.now(),
    title: 'New Chat',
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  const session = sessions.get(id);
  if (session) session.lastActive = Date.now();
  return session || null;
}

function listSessions() {
  return Array.from(sessions.values())
    .sort((a, b) => b.lastActive - a.lastActive)
    .map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      messageCount: s.messages.filter((m) => m.role === 'user' || m.role === 'assistant').length,
    }));
}

function deleteSession(id) {
  deleteSessionCache(id);
  return sessions.delete(id);
}

function addMessage(id, msg) {
  const session = sessions.get(id);
  if (!session) return;
  session.messages.push(msg);
  session.lastActive = Date.now();

  // Auto-title from first user message
  if (msg.role === 'user' && session.title === 'New Chat') {
    session.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '');
  }

  // Sliding window: keep system message, trim oldest
  trimMessages(session);
}

function getMessages(id) {
  const session = sessions.get(id);
  if (!session) return [];
  return session.messages;
}

function trimMessages(session) {
  const maxMessages = getMaxMessages();
  if (session.messages.length <= maxMessages) return;

  const system = session.messages[0]?.role === 'system' ? session.messages[0] : null;
  const rest = system ? session.messages.slice(1) : session.messages;
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

  session.messages = system ? [system, ...kept] : kept;
}

// Prune inactive sessions
function pruneInactive() {
  const now = Date.now();
  const ttl = getSessionTtl();
  for (const [id, session] of sessions) {
    if (now - session.lastActive > ttl) {
      deleteSessionCache(id);
      sessions.delete(id);
    }
  }
}

setInterval(pruneInactive, PRUNE_INTERVAL).unref();

module.exports = { createSession, getSession, listSessions, deleteSession, addMessage, getMessages };
