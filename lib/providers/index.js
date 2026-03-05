const OpenAIProvider = require('./openai');
const AnthropicProvider = require('./anthropic');
const OllamaProvider = require('./ollama');

function createProvider(settings) {
  if (settings.provider === 'anthropic') {
    if (!settings.anthropicApiKey) {
      throw new Error('Anthropic API key is required when using the Anthropic provider');
    }
    return new AnthropicProvider(settings);
  }

  if (settings.provider === 'ollama') {
    return new OllamaProvider(settings);
  }

  // Default to openai
  if (!settings.openaiApiKey) {
    throw new Error('OpenAI API key is required when using the OpenAI provider');
  }
  return new OpenAIProvider(settings);
}

module.exports = { createProvider };
