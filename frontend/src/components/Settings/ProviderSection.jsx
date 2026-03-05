import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const MODEL_LISTS = {
  openai: ['gpt-5.2', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'],
  anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-opus-4-6', 'claude-sonnet-4-0', 'claude-3-7-sonnet-latest'],
  ollama: ['llama3.1', 'llama3.2', 'mistral', 'mixtral', 'qwen2.5', 'gemma2', 'deepseek-r1', 'phi3', 'codellama'],
};

const PROVIDER_LABELS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
};

export default function ProviderSection({ draft, onChange }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showNookKey, setShowNookKey] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customModel, setCustomModel] = useState('');

  const provider = draft.provider;

  const getModelField = (p) => {
    if (p === 'openai') return 'openaiModel';
    if (p === 'anthropic') return 'anthropicModel';
    return 'ollamaModel';
  };

  const getApiKeyField = (p) => {
    if (p === 'openai') return 'openaiApiKey';
    if (p === 'anthropic') return 'anthropicApiKey';
    return null;
  };

  const modelField = getModelField(provider);
  const apiKeyField = getApiKeyField(provider);
  const activeModel = draft[modelField];
  const modelList = MODEL_LISTS[provider] || [];

  const handleCustomModelSubmit = () => {
    if (!customModel.trim()) return;
    onChange({ [modelField]: customModel.trim() });
    setCustomModel('');
    setShowCustom(false);
  };

  return (
    <div className="space-y-5">
      {/* Provider toggle */}
      <div>
        <label className="label">Provider</label>
        <div className="flex gap-1 p-1 bg-elevated rounded-lg">
          {['openai', 'anthropic', 'ollama'].map((p) => (
            <button
              key={p}
              onClick={() => onChange({ provider: p })}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                provider === p
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* API Key (OpenAI / Anthropic only) */}
      {apiKeyField && (
        <div>
          <label className="label">
            {PROVIDER_LABELS[provider]} API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={draft[apiKeyField] || ''}
              onChange={(e) => onChange({ [apiKeyField]: e.target.value })}
              className="input-field pr-10"
              placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-1">Required for LLM tool calling</p>
        </div>
      )}

      {/* Ollama URL */}
      {provider === 'ollama' && (
        <div>
          <label className="label">Ollama URL</label>
          <input
            type="text"
            value={draft.ollamaUrl || ''}
            onChange={(e) => onChange({ ollamaUrl: e.target.value })}
            className="input-field"
            placeholder="http://localhost:11434/v1"
          />
          <p className="text-xs text-text-tertiary mt-1">Ollama server URL (must be running with a model that supports tool calling)</p>
        </div>
      )}

      {/* Model */}
      <div>
        <label className="label">Model</label>
        <div className="flex gap-2">
          <select
            value={modelList.includes(activeModel) ? activeModel : ''}
            onChange={(e) => onChange({ [modelField]: e.target.value })}
            className="input-field flex-1"
          >
            {modelList.map((m) => <option key={m} value={m}>{m}</option>)}
            {!modelList.includes(activeModel) && activeModel && (
              <option value={activeModel}>{activeModel} (custom)</option>
            )}
          </select>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="ghost-button text-sm px-3"
            title="Custom model"
          >
            +
          </button>
        </div>
        {showCustom && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="Custom model ID"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomModelSubmit()}
            />
            <button onClick={handleCustomModelSubmit} className="accent-button text-sm px-3">
              Set
            </button>
          </div>
        )}
      </div>

      {/* Nook API */}
      <div>
        <label className="label">Nook API URL</label>
        <input
          type="text"
          value={draft.nookApiUrl || ''}
          onChange={(e) => onChange({ nookApiUrl: e.target.value })}
          className="input-field"
          placeholder="https://api.nookbot.io"
        />
        <p className="text-xs text-text-tertiary mt-1">Nook API base URL</p>
      </div>

      <div>
        <label className="label">Nook API Key</label>
        <div className="relative">
          <input
            type={showNookKey ? 'text' : 'password'}
            value={draft.nookApiKey || ''}
            onChange={(e) => onChange({ nookApiKey: e.target.value })}
            className="input-field pr-10"
            placeholder="nook_..."
          />
          <button
            type="button"
            onClick={() => setShowNookKey(!showNookKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
          >
            {showNookKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
