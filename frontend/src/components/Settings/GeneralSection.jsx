import { Sun, Moon, Monitor } from 'lucide-react';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function GeneralSection({ theme, onSetTheme }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSetTheme(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border-default bg-surface text-text-secondary hover:border-border-focus'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-border-subtle">
        <p className="text-xs text-text-tertiary">Nook Agent v1.1</p>
      </div>
    </div>
  );
}
