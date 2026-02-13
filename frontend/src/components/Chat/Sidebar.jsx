import { useMemo } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';

function groupSessionsByDate(sessions) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };

  for (const session of sessions) {
    const d = new Date(session.lastActive);
    if (d >= today) groups.Today.push(session);
    else if (d >= yesterday) groups.Yesterday.push(session);
    else if (d >= weekAgo) groups['Previous 7 Days'].push(session);
    else groups.Older.push(session);
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onOpenSettings,
}) {
  const grouped = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  return (
    <div className="h-full flex flex-col bg-surface border-r border-border-subtle">
      {/* Header */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <img src="/nook.png" alt="Nook" className="w-6 h-6 rounded-md" />
          <span className="text-sm font-semibold text-text-primary tracking-tight">Nook</span>
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-primary bg-elevated hover:bg-input rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New chat</span>
          <span className="kbd ml-auto">Ctrl+N</span>
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 && (
          <p className="text-text-tertiary text-xs text-center py-8">No chats yet</p>
        )}
        {grouped.map(([label, items]) => (
          <div key={label} className="mb-3">
            <p className="text-xs text-text-tertiary font-medium px-2 py-1">{label}</p>
            {items.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer mb-0.5 ${
                    isActive
                      ? 'bg-elevated text-text-primary'
                      : 'text-text-secondary hover:bg-elevated/50 hover:text-text-primary'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <span className="flex-1 truncate text-sm">
                    {session.title}
                  </span>
                  <span className="text-xs text-text-tertiary flex-shrink-0">
                    {session.messageCount}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-input rounded transition-opacity"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-text-tertiary" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border-subtle">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
          <span className="kbd ml-auto">Ctrl+,</span>
        </button>
      </div>
    </div>
  );
}
