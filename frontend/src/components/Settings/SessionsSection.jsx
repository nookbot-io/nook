import { useState } from 'react';
import { apiDelete } from '../../api';
import { showToast } from '../shared/Toast';
import ConfirmDialog from '../shared/ConfirmDialog';

export default function SessionsSection({ draft, onChange }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearSessions = async () => {
    setConfirmClear(false);
    try {
      await apiDelete('/chat/sessions/all');
      showToast('All sessions cleared', 'success');
    } catch {
      showToast('Failed to clear sessions', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Conversation window */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Conversation Window</label>
          <span className="text-sm text-text-primary font-mono">{draft.conversationMaxMessages} msgs</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={draft.conversationMaxMessages}
          onChange={(e) => onChange({ conversationMaxMessages: parseInt(e.target.value, 10) })}
          className="w-full accent-accent"
        />
        <p className="text-xs text-text-tertiary mt-1">Max messages kept in each conversation</p>
      </div>

      {/* Session expiry */}
      <div>
        <label className="label">Session Expiry</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="168"
            value={draft.conversationTtlHours}
            onChange={(e) => onChange({ conversationTtlHours: parseInt(e.target.value, 10) })}
            className="input-field w-24"
          />
          <span className="text-sm text-text-tertiary">hours</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">Inactive sessions are pruned after this duration</p>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border-subtle">
        <button
          onClick={() => setConfirmClear(true)}
          className="text-sm text-danger hover:text-danger/80 transition-colors"
        >
          Clear all sessions
        </button>
      </div>

      {confirmClear && (
        <ConfirmDialog
          title="Clear all sessions?"
          message="This will permanently delete all conversation history. This cannot be undone."
          confirmLabel="Clear all"
          danger
          onConfirm={handleClearSessions}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}
