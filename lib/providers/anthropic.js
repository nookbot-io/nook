const Anthropic = require('@anthropic-ai/sdk');
const BaseProvider = require('./base');

class AnthropicProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.client = new Anthropic({ apiKey: settings.anthropicApiKey });
    this.model = settings.anthropicModel || 'claude-sonnet-4-5';
  }

  formatTools(canonicalTools) {
    return canonicalTools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }

  formatMessages(messages) {
    const out = [];
    let system = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
        continue;
      }
      if (msg.role === 'user') {
        out.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        out.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'tool_calls') {
        const blocks = [];
        if (msg.text) {
          blocks.push({ type: 'text', text: msg.text });
        }
        for (const c of msg.calls) {
          blocks.push({
            type: 'tool_use',
            id: c.id,
            name: c.name,
            input: c.args,
          });
        }
        out.push({ role: 'assistant', content: blocks });
      } else if (msg.role === 'tool_result') {
        // Check if previous message in output is also a user message with tool_result — merge
        const last = out[out.length - 1];
        const block = {
          type: 'tool_result',
          tool_use_id: msg.callId,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        };
        if (last && last.role === 'user' && Array.isArray(last.content)) {
          last.content.push(block);
        } else {
          out.push({ role: 'user', content: [block] });
        }
      }
    }

    return { system, messages: out };
  }

  async chat(messages, tools) {
    try {
      // messages here is already the { system, messages } from formatMessages
      // But the agent core passes formatted provider messages directly
      // We need to handle both cases — detect if system is separate
      let system, msgs;
      if (messages.system !== undefined && messages.messages) {
        system = messages.system;
        msgs = messages.messages;
      } else {
        // Raw formatted messages — extract system
        system = '';
        msgs = messages;
      }

      const params = {
        model: this.model,
        messages: msgs,
        temperature: this.settings.temperature ?? 0.7,
        max_tokens: this.settings.maxTokens ?? 16384,
      };
      if (system) params.system = system;
      if (tools && tools.length) params.tools = tools;

      const response = await this.client.messages.create(params);
      const usage = response.usage
        ? { promptTokens: response.usage.input_tokens, completionTokens: response.usage.output_tokens, totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0) }
        : null;

      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      if (toolUseBlocks.length) {
        const textBlocks = response.content.filter((b) => b.type === 'text');
        const text = textBlocks.map((b) => b.text).join('\n');
        return {
          type: 'tool_calls',
          text,
          calls: toolUseBlocks.map((b) => ({
            id: b.id,
            name: b.name,
            args: b.input,
          })),
          usage,
        };
      }

      const textBlocks = response.content.filter((b) => b.type === 'text');
      return { type: 'text', content: textBlocks.map((b) => b.text).join('\n'), usage };
    } catch (err) {
      return this._normalizeError(err);
    }
  }

  async *chatStream(messages, tools) {
    let system, msgs;
    if (messages.system !== undefined && messages.messages) {
      system = messages.system;
      msgs = messages.messages;
    } else {
      system = '';
      msgs = messages;
    }

    const params = {
      model: this.model,
      messages: msgs,
      temperature: this.settings.temperature ?? 0.7,
      max_tokens: this.settings.maxTokens ?? 16384,
    };
    if (system) params.system = system;
    if (tools && tools.length) params.tools = tools;

    const stream = this.client.messages.stream(params);

    // Track tool use blocks being built
    const toolCalls = [];
    let currentToolId = null;
    let currentToolName = null;
    let currentToolJson = '';
    let usage = null;

    for await (const event of stream) {
      if (event.type === 'message_start' && event.message?.usage) {
        usage = { promptTokens: event.message.usage.input_tokens, completionTokens: 0, totalTokens: event.message.usage.input_tokens };
      } else if (event.type === 'message_delta' && event.usage) {
        const outputTokens = event.usage.output_tokens || 0;
        if (usage) {
          usage.completionTokens = outputTokens;
          usage.totalTokens = usage.promptTokens + outputTokens;
        } else {
          usage = { promptTokens: 0, completionTokens: outputTokens, totalTokens: outputTokens };
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolId = event.content_block.id;
          currentToolName = event.content_block.name;
          currentToolJson = '';
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'token', content: event.delta.text };
        } else if (event.delta.type === 'input_json_delta') {
          currentToolJson += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolId) {
          let args;
          try { args = currentToolJson ? JSON.parse(currentToolJson) : {}; } catch { args = {}; }
          toolCalls.push({
            id: currentToolId,
            name: currentToolName,
            args,
          });
          currentToolId = null;
          currentToolName = null;
          currentToolJson = '';
        }
      }
    }

    // Yield completed tool calls after stream ends
    if (toolCalls.length) {
      yield { type: 'tool_calls', calls: toolCalls, usage };
    }

    // Yield usage for text-only responses
    if (!toolCalls.length && usage) {
      yield { type: 'usage', usage };
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
    if (err.status === 429) {
      return { type: 'error', code: 'rate_limit', message: 'Anthropic rate limit exceeded. Please wait a moment and try again.' };
    }
    if (err.status === 401) {
      return { type: 'error', code: 'auth', message: 'Your Anthropic API key is invalid. Update it in Settings.' };
    }
    if (err.error?.type === 'invalid_request_error' && err.message?.includes('content')) {
      return { type: 'error', code: 'content_filter', message: 'The response was filtered by Anthropic\'s content policy.' };
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return { type: 'error', code: 'network', message: 'Could not connect to Anthropic. Check your internet connection.' };
    }
    return { type: 'error', code: 'unknown', message: err.message || 'Unknown Anthropic error' };
  }
}

module.exports = AnthropicProvider;
