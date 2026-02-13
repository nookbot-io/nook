import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import Login from './components/Login';
import Setup from './components/Setup';
import ChatLayout from './components/Chat/ChatLayout';
import SettingsPanel from './components/Settings/SettingsPanel';
import HttpWarning from './components/shared/HttpWarning';
import Toast from './components/shared/Toast';

export default function App() {
  const auth = useAuth();
  const chat = useChat();
  const settingsHook = useSettings();
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // Load sessions and settings when authenticated
  useEffect(() => {
    if (auth.authenticated) {
      chat.loadSessions();
      settingsHook.loadSettings();
    }
  }, [auth.authenticated]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+N — New chat
      if (mod && e.key === 'n') {
        e.preventDefault();
        if (auth.authenticated) chat.newChat();
      }

      // Ctrl+, — Open settings
      if (mod && e.key === ',') {
        e.preventDefault();
        if (auth.authenticated) setShowSettings(true);
      }

      // Escape — Close settings
      // (handled inside SettingsPanel for finer control)
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [auth.authenticated, chat.newChat]);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auth.setupRequired) {
    return (
      <>
        <HttpWarning />
        <Setup onComplete={auth.checkAuth} />
        <Toast />
      </>
    );
  }

  if (!auth.authenticated) {
    return (
      <>
        <HttpWarning />
        <Login onLogin={auth.login} />
        <Toast />
      </>
    );
  }

  return (
    <>
      <HttpWarning />
      <ChatLayout
        sessions={chat.sessions}
        activeSessionId={chat.activeSessionId}
        messages={chat.messages}
        streaming={chat.streaming}
        streamingText={chat.streamingText}
        activeToolCalls={chat.activeToolCalls}
        onSendMessage={chat.sendMessage}
        onLoadSession={chat.loadSession}
        onDeleteSession={chat.deleteSession}
        onNewChat={chat.newChat}
        onOpenSettings={() => setShowSettings(true)}
        onExportChat={chat.exportChat}
        settings={settingsHook.settings}
      />
      {showSettings && (
        <SettingsPanel
          settings={settingsHook.settings}
          loading={settingsHook.loading}
          saving={settingsHook.saving}
          onLoad={settingsHook.loadSettings}
          onSave={settingsHook.saveSettings}
          onClose={() => setShowSettings(false)}
          onLogout={auth.logout}
          theme={theme}
          onSetTheme={setTheme}
        />
      )}
      <Toast />
    </>
  );
}
