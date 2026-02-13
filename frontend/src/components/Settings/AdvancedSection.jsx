export default function AdvancedSection({ draft, onChange }) {
  return (
    <div className="space-y-5">
      {/* Response size limit */}
      <div>
        <label className="label">Response Size Limit</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10000"
            max="200000"
            step="1000"
            value={draft.trimmerMaxChars}
            onChange={(e) => onChange({ trimmerMaxChars: parseInt(e.target.value, 10) })}
            className="input-field w-32"
          />
          <span className="text-sm text-text-tertiary">chars</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">API responses larger than this are trimmed before sending to the LLM</p>
      </div>

      {/* Resolver cache TTL */}
      <div>
        <label className="label">Resolver Cache TTL</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="60"
            value={draft.resolverCacheTtlMinutes}
            onChange={(e) => onChange({ resolverCacheTtlMinutes: parseInt(e.target.value, 10) })}
            className="input-field w-24"
          />
          <span className="text-sm text-text-tertiary">minutes</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">How long resolved token addresses are cached per session</p>
      </div>

      {/* Auth session duration */}
      <div>
        <label className="label">Auth Session Duration</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="168"
            value={draft.sessionMaxAgeHours}
            onChange={(e) => onChange({ sessionMaxAgeHours: parseInt(e.target.value, 10) })}
            className="input-field w-24"
          />
          <span className="text-sm text-text-tertiary">hours</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">How long your login session stays valid</p>
      </div>

      <div className="pt-4 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary">Changes take effect on next request</p>
      </div>
    </div>
  );
}
