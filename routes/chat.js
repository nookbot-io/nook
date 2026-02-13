const { Router } = require('express');
const { runAgent } = require('../lib/agent');
const { runAgentStream } = require('../lib/agentStream');
const { loadSettings } = require('../lib/settings');
const { listSessions, getSession, deleteSession, getMessages } = require('../lib/sessions');
const { agentRateLimit } = require('../middleware/agentRateLimit');

const router = Router();

router.post('/', agentRateLimit, async (req, res) => {
  const { message, sessionId } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 10000) {
    return res.status(400).json({ error: 'Message too long (max 10,000 characters)' });
  }

  try {
    const settings = loadSettings();
    const result = await runAgent(sessionId || null, message.trim(), settings);
    res.json(result);
  } catch (err) {
    console.error('Agent error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/stream', agentRateLimit, async (req, res) => {
  const { message, sessionId } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 10000) {
    return res.status(400).json({ error: 'Message too long (max 10,000 characters)' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const settings = loadSettings();
    const stream = runAgentStream(sessionId || null, message.trim(), settings);

    for await (const event of stream) {
      const eventType = event.type;
      const data = JSON.stringify(event);
      res.write(`event: ${eventType}\ndata: ${data}\n\n`);
    }
  } catch (err) {
    console.error('Stream error:', err);
    const data = JSON.stringify({ code: 'stream_error', message: 'Something went wrong' });
    res.write(`event: error\ndata: ${data}\n\n`);
  }

  res.end();
});

router.get('/sessions', (_req, res) => {
  res.json(listSessions());
});

router.get('/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const messages = getMessages(session.id);
  res.json({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    lastActive: session.lastActive,
    messages: messages.filter((m) => m.role !== 'system'),
  });
});

router.delete('/sessions/all', (_req, res) => {
  const sessions = listSessions();
  for (const s of sessions) {
    deleteSession(s.id);
  }
  res.json({ success: true, deleted: sessions.length });
});

router.delete('/sessions/:id', (req, res) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true });
});

module.exports = { prefix: '/chat', router };
