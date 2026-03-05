import { useState, useCallback, useRef } from 'react';
import { apiGet, apiDelete, streamChat } from '../api';

function exportSession(messages) {
  const lines = ['# Chat Export\n'];
  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push(`**User:** ${msg.content}\n`);
    } else if (msg.role === 'assistant') {
      if (msg.toolCalls?.length) {
        const tools = msg.toolCalls.map((tc) => `\`${tc.name}\``).join(', ');
        lines.push(`*Tools used: ${tools}*\n`);
      }
      lines.push(`**Assistant:** ${msg.content}\n`);
    }
    lines.push('---\n');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nook-chat-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeToolCalls, setActiveToolCalls] = useState([]);
  const abortRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiGet('/chat/sessions');
      setSessions(data);
    } catch {
      // Ignore
    }
  }, []);

  const loadSession = useCallback(async (id) => {
    try {
      const data = await apiGet(`/chat/sessions/${id}`);
      setActiveSessionId(id);
      setMessages(data.messages || []);
    } catch {
      // Session may have been deleted
    }
  }, []);

  const deleteSession = useCallback(async (id) => {
    try {
      await apiDelete(`/chat/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      // Ignore
    }
  }, [activeSessionId]);

  const newChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setStreamingText('');
    setActiveToolCalls([]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (streaming) return;

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingText('');
    setActiveToolCalls([]);

    let sessionId = activeSessionId;
    let finalText = '';
    const toolCalls = [];
    let tokenUsage = null;

    try {
      await streamChat({ message: text, sessionId }, (event) => {
        switch (event.type) {
          case 'token':
            finalText += event.content;
            setStreamingText(finalText);
            break;
          case 'tool_call_start':
            toolCalls.push({
              id: event.id,
              name: event.name,
              args: event.args,
              status: 'running',
            });
            setActiveToolCalls([...toolCalls]);
            break;
          case 'tool_call_end': {
            const tc = toolCalls.find((t) => t.id === event.id);
            if (tc) {
              tc.status = 'done';
              tc.duration = event.duration;
            }
            setActiveToolCalls([...toolCalls]);
            break;
          }
          case 'usage':
            if (event.usage) {
              if (!tokenUsage) {
                tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
              }
              tokenUsage.promptTokens += event.usage.promptTokens || 0;
              tokenUsage.completionTokens += event.usage.completionTokens || 0;
              tokenUsage.totalTokens += event.usage.totalTokens || 0;
            }
            break;
          case 'error':
            finalText += `\n\n**Error:** ${event.message}`;
            setStreamingText(finalText);
            break;
          case 'done':
            if (event.sessionId) {
              sessionId = event.sessionId;
              setActiveSessionId(event.sessionId);
            }
            break;
        }
      });

      if (finalText) {
        const assistantMsg = { role: 'assistant', content: finalText, timestamp: Date.now() };
        if (toolCalls.length) {
          assistantMsg.toolCalls = toolCalls;
        }
        if (tokenUsage) {
          assistantMsg.usage = tokenUsage;
        }
        setMessages((prev) => [...prev, assistantMsg]);
      }

      loadSessions();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**Error:** ${err.message}`, timestamp: Date.now() },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamingText('');
      setActiveToolCalls([]);
    }
  }, [streaming, activeSessionId, loadSessions]);

  const exportChat = useCallback(() => {
    if (messages.length > 0) {
      exportSession(messages);
    }
  }, [messages]);

  return {
    sessions,
    activeSessionId,
    messages,
    streaming,
    streamingText,
    activeToolCalls,
    loadSessions,
    loadSession,
    deleteSession,
    newChat,
    sendMessage,
    exportChat,
  };
}
