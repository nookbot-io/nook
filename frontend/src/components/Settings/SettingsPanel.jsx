import { useEffect, useState } from 'react';
import { X, Settings, Cpu, Sliders, MessageSquare, Wrench, Send, Shield } from 'lucide-react';
import GeneralSection from './GeneralSection';
import ProviderSection from './ProviderSection';
import BehaviorSection from './BehaviorSection';
import SessionsSection from './SessionsSection';
import AdvancedSection from './AdvancedSection';
import TelegramSection from './TelegramSection';
import SecuritySection from './SecuritySection';
import { SkeletonCard } from '../shared/Skeleton';
import { showToast } from '../shared/Toast';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'provider', label: 'Provider', icon: Cpu },
  { id: 'behavior', label: 'Behavior', icon: Sliders },
  { id: 'sessions', label: 'Sessions', icon: MessageSquare },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPanel({
  settings,
  loading,
  saving,
  onLoad,
  onSave,
  onClose,
  onLogout,
  theme,
  onSetTheme,
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    onLoad();
  }, [onLoad]);

  useEffect(() => {
    if (settings) setDraft({ ...settings });
  }, [settings]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateDraft = (partial) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    if (!draft) return;
    const result = await onSave(draft);
    if (result.success) showToast('Settings saved', 'success');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8">
        <div className="bg-app sm:border sm:border-border-default sm:rounded-2xl shadow-2xl w-full max-w-3xl h-full sm:max-h-[700px] flex flex-col animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-elevated text-text-secondary transition-colors"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab pills — mobile */}
          <div className="sm:hidden flex overflow-x-auto gap-1 px-4 py-2 border-b border-border-subtle flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Tab sidebar — desktop */}
            <div className="hidden sm:flex flex-col w-44 border-r border-border-subtle py-2 flex-shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors mx-2 rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-elevated text-text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                {loading || !draft ? (
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : (
                  <>
                    {activeTab === 'general' && (
                      <GeneralSection theme={theme} onSetTheme={onSetTheme} />
                    )}
                    {activeTab === 'provider' && (
                      <ProviderSection draft={draft} onChange={updateDraft} />
                    )}
                    {activeTab === 'behavior' && (
                      <BehaviorSection draft={draft} onChange={updateDraft} />
                    )}
                    {activeTab === 'sessions' && (
                      <SessionsSection draft={draft} onChange={updateDraft} />
                    )}
                    {activeTab === 'advanced' && (
                      <AdvancedSection draft={draft} onChange={updateDraft} />
                    )}
                    {activeTab === 'telegram' && (
                      <TelegramSection draft={draft} onChange={updateDraft} />
                    )}
                    {activeTab === 'security' && (
                      <SecuritySection draft={draft} onChange={updateDraft} onSave={onSave} onLogout={onLogout} />
                    )}
                  </>
                )}
              </div>

              {/* Save bar */}
              {draft && activeTab !== 'security' && (
                <div className="px-4 sm:px-6 py-3 border-t border-border-subtle flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="accent-button text-sm px-6"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
