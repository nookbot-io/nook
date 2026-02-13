import { useState } from 'react';
import { Eye, EyeOff, X as XIcon } from 'lucide-react';

export default function TelegramSection({ draft, onChange }) {
  const [showToken, setShowToken] = useState(false);

  const enabled = draft.telegramEnabled || false;
  const chatIds = draft.telegramAllowedChatIds || [];

  const handleRemoveChatId = (id) => {
    onChange({ telegramAllowedChatIds: chatIds.filter((c) => c !== id) });
  };

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Enable Bot</p>
          <p className="text-xs text-text-tertiary">Run a Telegram bot connected to this agent</p>
        </div>
        <button
          onClick={() => onChange({ telegramEnabled: !enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-accent' : 'bg-elevated border border-border-default'
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Bot token */}
      <div>
        <label className="label">Bot Token</label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={draft.telegramBotToken || ''}
            onChange={(e) => onChange({ telegramBotToken: e.target.value })}
            className="input-field pr-10"
            placeholder="123456:ABC-DEF..."
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-text-tertiary mt-1">Create a bot via @BotFather on Telegram</p>
      </div>

      {/* Chat IDs */}
      {chatIds.length > 0 && (
        <div>
          <label className="label">Allowed Chat IDs</label>
          <div className="flex flex-wrap gap-2">
            {chatIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-elevated text-sm font-mono text-text-primary"
              >
                {id}
                <button
                  onClick={() => handleRemoveChatId(id)}
                  className="p-0.5 rounded hover:bg-input text-text-tertiary hover:text-danger transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {chatIds.length === 0 && (
        <p className="text-xs text-text-tertiary">
          If no chat IDs are set, the first user to message the bot will be auto-added.
        </p>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 pt-2">
        <div className={`w-2 h-2 rounded-full ${enabled && draft.telegramBotToken ? 'bg-success' : 'bg-text-tertiary'}`} />
        <span className="text-xs text-text-secondary">
          {enabled && draft.telegramBotToken ? 'Bot will start on save' : 'Bot stopped'}
        </span>
      </div>
    </div>
  );
}
