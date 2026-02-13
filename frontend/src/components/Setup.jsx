import { useState, useEffect } from 'react';
import { apiPost } from '../api';

const MODEL_LISTS = {
  openai: ['gpt-5.2', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'],
  anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-opus-4-6', 'claude-sonnet-4-0', 'claude-3-7-sonnet-latest'],
};

export default function Setup({ onComplete }) {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState('openai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [model, setModel] = useState('gpt-5.2');
  const [nookApiKey, setNookApiKey] = useState('');
  const [nookApiUrl, setNookApiUrl] = useState('https://api.nookbot.io');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setModel(MODEL_LISTS[provider][0]);
  }, [provider]);

  const steps = ['Provider', 'Nook API', 'Password'];

  const handleNext = () => {
    setError('');
    if (step === 0) {
      const key = provider === 'openai' ? openaiApiKey : anthropicApiKey;
      if (!key.trim()) {
        setError(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key is required`);
        return;
      }
    } else if (step === 1) {
      if (!nookApiKey.trim()) {
        setError('Nook API key is required');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError('');
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const body = {
        provider,
        openaiApiKey,
        anthropicApiKey,
        [`${provider}Model`]: model,
        nookApiKey,
        nookApiUrl,
        password,
      };
      const result = await apiPost('/setup/complete', body);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Setup failed');
      }
    } catch (err) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-1">Setup Nook</h1>
          <p className="text-sm text-text-tertiary">Step {step + 1} of 3 — {steps[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-border-subtle rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="card">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-5">LLM Provider</h2>

              <div className="flex gap-2 mb-5">
                {['openai', 'anthropic'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      provider === p
                        ? 'bg-accent text-white'
                        : 'bg-elevated text-text-secondary hover:text-text-primary border border-border-default'
                    }`}
                  >
                    {p === 'openai' ? 'OpenAI' : 'Anthropic'}
                  </button>
                ))}
              </div>

              <label className="label">
                {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
              </label>
              <input
                type="password"
                value={provider === 'openai' ? openaiApiKey : anthropicApiKey}
                onChange={(e) =>
                  provider === 'openai'
                    ? setOpenaiApiKey(e.target.value)
                    : setAnthropicApiKey(e.target.value)
                }
                className="input-field mb-5"
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              />

              <label className="label">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
              >
                {MODEL_LISTS[provider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-5">Nook API</h2>

              <label className="label">API URL</label>
              <input
                type="text"
                value={nookApiUrl}
                onChange={(e) => setNookApiUrl(e.target.value)}
                className="input-field mb-5"
                placeholder="https://api.nookbot.io"
              />

              <label className="label">API Key</label>
              <input
                type="password"
                value={nookApiKey}
                onChange={(e) => setNookApiKey(e.target.value)}
                className="input-field"
                placeholder="nook_..."
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-5">Set Password</h2>

              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field mb-5"
                placeholder="At least 4 characters"
              />

              <label className="label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Repeat your password"
              />
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-danger">{error}</p>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => { setStep(step - 1); setError(''); }}
                className="flex-1 ghost-button"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={handleNext} className="flex-1 accent-button">
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 accent-button"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
