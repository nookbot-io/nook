const BASE = '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('nook:unauthorized'));
    throw new Error('Unauthorized');
  }

  return res;
}

export async function apiGet(path) {
  const res = await apiFetch(path);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(path, body) {
  const res = await apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path) {
  const res = await apiFetch(path, { method: 'DELETE' });
  return res.json();
}

export async function streamChat(body, onEvent) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('nook:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (res.status === 429) {
    const data = await res.json();
    onEvent({ type: 'error', code: 'rate_limit', message: data.error, retryAfter: data.retryAfter });
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Stream failed' }));
    onEvent({ type: 'error', code: 'stream_error', message: data.error || data.detail });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // Keep incomplete event in buffer

    for (const part of parts) {
      if (!part.trim()) continue;

      let eventType = 'message';
      let data = '';

      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          data = line.slice(6);
        }
      }

      if (data) {
        try {
          const parsed = JSON.parse(data);
          onEvent({ ...parsed, type: eventType });
        } catch {
          // Ignore unparseable events
        }
      }
    }
  }
}
