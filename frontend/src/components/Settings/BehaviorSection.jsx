export default function BehaviorSection({ draft, onChange }) {
  return (
    <div className="space-y-5">
      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Temperature</label>
          <span className="text-sm text-text-primary font-mono">{draft.temperature}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={draft.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-accent"
        />
        <p className="text-xs text-text-tertiary mt-1">Lower = more focused, higher = more creative</p>
      </div>

      {/* Max Tokens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Max Tokens</label>
          <span className="text-sm text-text-primary font-mono">{draft.maxTokens}</span>
        </div>
        <input
          type="range"
          min="256"
          max="32768"
          step="256"
          value={draft.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value, 10) })}
          className="w-full accent-accent"
        />
      </div>

      {/* Max Tool Calls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Max Tool Calls</label>
          <span className="text-sm text-text-primary font-mono">{draft.maxToolCalls}</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={draft.maxToolCalls}
          onChange={(e) => onChange({ maxToolCalls: parseInt(e.target.value, 10) })}
          className="w-full accent-accent"
        />
        <p className="text-xs text-text-tertiary mt-1">Max API calls per response</p>
      </div>

      {/* Rate Limit */}
      <div>
        <label className="label">Rate Limit</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={draft.agentRateLimit}
            onChange={(e) => onChange({ agentRateLimit: parseInt(e.target.value, 10) })}
            className="input-field w-24"
          />
          <span className="text-sm text-text-tertiary">msg/min</span>
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="label">Custom System Prompt</label>
        <textarea
          value={draft.systemPrompt || ''}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={4}
          className="input-field resize-none"
          placeholder="Additional instructions for the agent..."
        />
        <p className="text-xs text-text-tertiary mt-1">Appended to the default system prompt</p>
      </div>
    </div>
  );
}
