const OpenAI = require('openai');
const BaseProvider = require('./base');

// Models that require max_completion_tokens instead of max_tokens
const COMPLETION_TOKENS_MODELS = /^(o[1-9]|o[1-9]-|gpt-5)/;

class OpenAIProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.client = new OpenAI({ apiKey: settings.openaiApiKey });
    this.model = settings.openaiModel || 'gpt-5.2';
    this.useCompletionTokens = COMPLETION_TOKENS_MODELS.test(this.model);
  }

  formatTools(canonicalTools) {
    return canonicalTools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  formatMessages(messages) {
    const out = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        out.push({ role: 'system', content: msg.content });
      } else if (msg.role === 'user') {
        out.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        out.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'tool_calls') {
        out.push({
          role: 'assistant',
          content: msg.text || null,
          tool_calls: msg.calls.map((c) => ({
            id: c.id,
            type: 'function',
            function: { name: c.name, arguments: JSON.stringify(c.args) },
          })),
        });
      } else if (msg.role === 'tool_result') {
        out.push({
          role: 'tool',
          tool_call_id: msg.callId,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        });
      }
    }
    return out;
  }

  async chat(messages, tools) {
    try {
      const maxTokens = this.settings.maxTokens ?? 16384;
      const params = {
        model: this.model,
        messages,
        temperature: this.settings.temperature ?? 0.7,
        ...(this.useCompletionTokens
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }),
      };
      if (tools && tools.length) params.tools = tools;

      const response = await this.client.chat.completions.create(params);
      const choice = response.choices[0];
      const msg = choice.message;

      if (msg.tool_calls && msg.tool_calls.length) {
        return {
          type: 'tool_calls',
          text: msg.content || '',
          calls: msg.tool_calls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}'),
          })),
        };
      }

      return { type: 'text', content: msg.content || '' };
    } catch (err) {
      return this._normalizeError(err);
    }
  }

  async *chatStream(messages, tools) {
    const maxTokens = this.settings.maxTokens ?? 16384;
    const params = {
      model: this.model,
      messages,
      temperature: this.settings.temperature ?? 0.7,
      ...(this.useCompletionTokens
        ? { max_completion_tokens: maxTokens }
        : { max_tokens: maxTokens }),
      stream: true,
    };
    if (tools && tools.length) params.tools = tools;

    const stream = await this.client.chat.completions.create(params);

    // Accumulate tool calls across chunks (streamed as indexed deltas)
    const toolCallAccum = new Map(); // index -> { id, name, args }
    let hasToolCalls = false;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // Text content
      if (delta.content) {
        yield { type: 'token', content: delta.content };
      }

      // Tool call deltas
      if (delta.tool_calls) {
        hasToolCalls = true;
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCallAccum.has(idx)) {
            toolCallAccum.set(idx, { id: '', name: '', args: '' });
          }
          const accum = toolCallAccum.get(idx);
          if (tc.id) accum.id = tc.id;
          if (tc.function?.name) accum.name = tc.function.name;
          if (tc.function?.arguments) accum.args += tc.function.arguments;
        }
      }
    }

    // Yield completed tool calls after stream ends
    if (hasToolCalls) {
      const calls = Array.from(toolCallAccum.values()).map((tc) => {
        let args;
        try { args = JSON.parse(tc.args || '{}'); } catch { args = {}; }
        return { id: tc.id, name: tc.name, args };
      });
      yield { type: 'tool_calls', calls };
    }
  }

  formatToolResult(callId, _name, result) {
    return {
      role: 'tool_result',
      callId,
      content: typeof result === 'string' ? result : JSON.stringify(result),
    };
  }

  _normalizeError(err) {
    if (err.status === 429 || err.code === 'rate_limit_exceeded') {
      return { type: 'error', code: 'rate_limit', message: 'OpenAI rate limit exceeded. Please wait a moment and try again.' };
    }
    if (err.status === 401) {
      return { type: 'error', code: 'auth', message: 'Your OpenAI API key is invalid. Update it in Settings.' };
    }
    if (err.code === 'content_filter') {
      return { type: 'error', code: 'content_filter', message: 'The response was filtered by OpenAI\'s content policy.' };
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return { type: 'error', code: 'network', message: 'Could not connect to OpenAI. Check your internet connection.' };
    }
    return { type: 'error', code: 'unknown', message: err.message || 'Unknown OpenAI error' };
  }
}

module.exports = OpenAIProvider;
