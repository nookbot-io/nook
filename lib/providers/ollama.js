const OpenAI = require('openai');
const BaseProvider = require('./base');

class OllamaProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    const baseURL = settings.ollamaUrl || 'http://localhost:11434/v1';
    this.client = new OpenAI({ apiKey: 'ollama', baseURL });
    this.model = settings.ollamaModel || 'llama3.1';
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
      const params = {
        model: this.model,
        messages,
        temperature: this.settings.temperature ?? 0.7,
        max_tokens: this.settings.maxTokens ?? 16384,
      };
      if (tools && tools.length) params.tools = tools;

      const response = await this.client.chat.completions.create(params);
      const choice = response.choices[0];
      const msg = choice.message;
      const usage = response.usage
        ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens, totalTokens: response.usage.total_tokens }
        : null;

      if (msg.tool_calls && msg.tool_calls.length) {
        return {
          type: 'tool_calls',
          text: msg.content || '',
          calls: msg.tool_calls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}'),
          })),
          usage,
        };
      }

      return { type: 'text', content: msg.content || '', usage };
    } catch (err) {
      return this._normalizeError(err);
    }
  }

  async *chatStream(messages, tools) {
    const params = {
      model: this.model,
      messages,
      temperature: this.settings.temperature ?? 0.7,
      max_tokens: this.settings.maxTokens ?? 16384,
      stream: true,
    };
    if (tools && tools.length) params.tools = tools;

    const stream = await this.client.chat.completions.create(params);

    const toolCallAccum = new Map();
    let hasToolCalls = false;

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: 'token', content: delta.content };
      }

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
    if (err.code === 'ECONNREFUSED') {
      return { type: 'error', code: 'network', message: 'Could not connect to Ollama. Make sure Ollama is running and the URL is correct in settings.' };
    }
    if (err.code === 'ENOTFOUND') {
      return { type: 'error', code: 'network', message: 'Could not resolve the Ollama URL. Check ollamaUrl in settings.' };
    }
    return { type: 'error', code: 'unknown', message: err.message || 'Unknown Ollama error' };
  }
}

module.exports = OllamaProvider;
