const { createProvider } = require('./providers');
const { getTools, getToolMap } = require('./toolRegistry');
const { createClient, callTool } = require('./nookClient');
const { trimResponse } = require('./trimmer');
const { filterResponse } = require('./responseFilter');
const { createSession, getSession, addMessage, getMessages } = require('./sessions');
const { cacheResolution, getKnownAddresses, formatKnownAddressesContext, extractResolutions } = require('./resolverCache');

// Re-use the same system prompt from agent.js
const { SYSTEM_PROMPT } = require('./agent');

async function* runAgentStream(sessionId, userMessage, settings) {
  // Get or create session
  let session;
  if (sessionId) {
    session = getSession(sessionId);
  }
  if (!session) {
    session = createSession();
    const systemContent = settings.systemPrompt
      ? `${SYSTEM_PROMPT}\n\nAdditional instructions:\n${settings.systemPrompt}`
      : SYSTEM_PROMPT;
    addMessage(session.id, { role: 'system', content: systemContent });
  }

  // Add user message
  addMessage(session.id, { role: 'user', content: userMessage });

  // Create provider and tools
  const provider = createProvider(settings);
  const canonicalTools = getTools();
  const formattedTools = provider.formatTools(canonicalTools);
  const toolMap = getToolMap();
  const nookClient = createClient(settings);

  const toolCallLog = [];
  let iterations = 0;
  let totalToolCalls = 0;
  const maxIterations = settings.maxToolCalls || 10;
  const maxToolCalls = maxIterations;
  const AGENT_TIMEOUT = 120_000;
  const agentStart = Date.now();
  let fullText = '';

  while (iterations < maxIterations) {
    iterations++;

    // Wall-clock timeout
    if (Date.now() - agentStart > AGENT_TIMEOUT) {
      const note = 'This request took too long to process. Here\'s what I found so far based on the data retrieved above.';
      addMessage(session.id, { role: 'assistant', content: note });
      yield { type: 'token', content: note };
      yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
      return;
    }

    // Clone messages to avoid mutating session state; inject context into system message
    const rawMessages = getMessages(session.id);
    const messages = rawMessages.map((m, i) =>
      i === 0 && m.role === 'system' ? { ...m } : m
    );
    const knownAddresses = getKnownAddresses(session.id);
    if (messages.length > 0 && messages[0].role === 'system') {
      let extra = '';
      if (knownAddresses) {
        extra += formatKnownAddressesContext(knownAddresses);
      }
      extra += `\n\nCurrent UTC time: ${new Date().toISOString()} (unix ms: ${Date.now()})`;
      messages[0].content += extra;
    }

    const formatted = provider.formatMessages(messages);
    let tokensYielded = 0;

    try {
      let gotToolCalls = false;

      for await (const event of provider.chatStream(formatted, formattedTools)) {
        if (event.type === 'token') {
          fullText += event.content;
          tokensYielded++;
          yield { type: 'token', content: event.content };
        } else if (event.type === 'usage') {
          yield { type: 'usage', usage: event.usage };
        } else if (event.type === 'tool_calls') {
          gotToolCalls = true;

          // Yield usage if attached to tool_calls event
          if (event.usage) {
            yield { type: 'usage', usage: event.usage };
          }

          // Store the tool_calls message in session
          addMessage(session.id, { role: 'tool_calls', calls: event.calls, text: '' });

          // Yield all tool_call_start events immediately
          const t0 = Date.now();
          for (const call of event.calls) {
            yield { type: 'tool_call_start', id: call.id, name: call.name, args: call.args };
          }

          // Execute all tool calls in parallel
          const results = await Promise.allSettled(
            event.calls.map(async (call) => {
              const endpoint = toolMap.get(call.name);
              if (!endpoint) {
                return { error: true, message: `Unknown tool: ${call.name}` };
              }
              let result = await callTool(nookClient, endpoint, call.args || {});
              if (result.data) {
                result = trimResponse(filterResponse(call.name, result.data));
              }
              return result;
            })
          );

          const totalDuration = Date.now() - t0;

          // Process results in order
          for (let i = 0; i < event.calls.length; i++) {
            const call = event.calls[i];
            const result = results[i].status === 'fulfilled'
              ? results[i].value
              : { error: true, message: results[i].reason?.message || 'Tool call failed' };

            yield { type: 'tool_call_end', id: call.id, name: call.name, duration: totalDuration };

            // Cache symbol → address resolutions
            const resolutions = extractResolutions(call.name, result);
            for (const r of resolutions) {
              cacheResolution(session.id, r.symbol, r.address, r.name);
            }

            toolCallLog.push({
              name: call.name,
              args: call.args,
              result: typeof result === 'string' ? result : (result?.error ? result : '[data]'),
            });

            // Add tool result to session
            const toolResultMsg = provider.formatToolResult(call.id, call.name, result);
            addMessage(session.id, toolResultMsg);
          }

          totalToolCalls += event.calls.length;
        }
      }

      if (!gotToolCalls) {
        // Text response complete — save to session and done
        if (fullText) {
          addMessage(session.id, { role: 'assistant', content: fullText });
        }
        yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
        return;
      }

      if (totalToolCalls >= maxToolCalls) break;

      // Reset for next iteration (tool results fed back)
      fullText = '';

    } catch (err) {
      // If we already streamed tokens, don't fall back — save partial and report error
      if (tokensYielded > 0) {
        if (fullText) {
          addMessage(session.id, { role: 'assistant', content: fullText });
        }
        yield { type: 'error', code: 'stream_error', message: err.message || 'Streaming failed mid-response' };
        yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
        return;
      }

      // Streaming failed before any tokens — try non-streaming fallback
      try {
        const response = await provider.chat(formatted, formattedTools);

        if (response.type === 'error') {
          yield { type: 'error', code: response.code, message: response.message };
          yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
          return;
        }

        if (response.type === 'text') {
          addMessage(session.id, { role: 'assistant', content: response.content });
          yield { type: 'token', content: response.content };
          yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
          return;
        }

        if (response.type === 'tool_calls') {
          addMessage(session.id, { role: 'tool_calls', calls: response.calls, text: response.text || '' });

          // Yield all tool_call_start events immediately
          const t0 = Date.now();
          for (const call of response.calls) {
            yield { type: 'tool_call_start', id: call.id, name: call.name, args: call.args };
          }

          // Execute all tool calls in parallel
          const results = await Promise.allSettled(
            response.calls.map(async (call) => {
              const endpoint = toolMap.get(call.name);
              if (!endpoint) {
                return { error: true, message: `Unknown tool: ${call.name}` };
              }
              let result = await callTool(nookClient, endpoint, call.args || {});
              if (result.data) {
                result = trimResponse(filterResponse(call.name, result.data));
              }
              return result;
            })
          );

          const totalDuration = Date.now() - t0;

          for (let i = 0; i < response.calls.length; i++) {
            const call = response.calls[i];
            const result = results[i].status === 'fulfilled'
              ? results[i].value
              : { error: true, message: results[i].reason?.message || 'Tool call failed' };

            yield { type: 'tool_call_end', id: call.id, name: call.name, duration: totalDuration };

            // Cache symbol → address resolutions
            const resolutions = extractResolutions(call.name, result);
            for (const r of resolutions) {
              cacheResolution(session.id, r.symbol, r.address, r.name);
            }

            toolCallLog.push({
              name: call.name,
              args: call.args,
              result: typeof result === 'string' ? result : (result?.error ? result : '[data]'),
            });

            const toolResultMsg = provider.formatToolResult(call.id, call.name, result);
            addMessage(session.id, toolResultMsg);
          }

          totalToolCalls += response.calls.length;
          if (totalToolCalls >= maxToolCalls) break;

          // Continue loop after fallback tool calls
          fullText = '';
          continue;
        }
      } catch (fallbackErr) {
        yield { type: 'error', code: 'stream_error', message: fallbackErr.message || 'Streaming failed' };
        yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
        return;
      }
    }
  }

  // Max iterations or tool calls hit
  const note = 'I\'ve reached the maximum number of tool calls for this response. Here\'s what I found so far based on the data retrieved above.';
  addMessage(session.id, { role: 'assistant', content: note });
  yield { type: 'token', content: note };
  yield { type: 'done', sessionId: session.id, toolCalls: toolCallLog };
}

module.exports = { runAgentStream };
