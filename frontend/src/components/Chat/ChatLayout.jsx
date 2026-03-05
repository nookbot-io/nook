import { useState } from 'react';
import { Menu, Download } from 'lucide-react';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import WelcomeView from './WelcomeView';

export default function ChatLayout({
  sessions,
  activeSessionId,
  messages,
  streaming,
  streamingText,
  activeToolCalls,
  onSendMessage,
  onLoadSession,
  onDeleteSession,
  onNewChat,
  onOpenSettings,
  onExportChat,
  settings,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasMessages = messages.length > 0 || streaming;
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title || 'New Chat';

  const activeModel = settings
    ? settings.provider === 'openai' ? settings.openaiModel : settings.anthropicModel
    : null;

  return (
    <div className="h-screen flex bg-app">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => { onLoadSession(id); setSidebarOpen(false); }}
          onDeleteSession={onDeleteSession}
          onNewChat={() => { onNewChat(); setSidebarOpen(false); }}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-border-subtle bg-app flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-elevated transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-text-secondary" />
            </button>
            <h1 className="text-sm font-medium text-text-primary truncate">
              {sessionTitle}
            </h1>
            {activeModel && (
              <button
                onClick={onOpenSettings}
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs text-text-tertiary bg-elevated hover:text-text-secondary transition-colors"
              >
                {activeModel}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasMessages && (
              <button
                onClick={onExportChat}
                className="p-1.5 rounded-md hover:bg-elevated transition-colors"
                title="Export chat"
                aria-label="Export chat"
              >
                <Download className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
          </div>
        </div>

        {/* Messages or welcome */}
        <div className="flex-1 overflow-hidden">
          {hasMessages ? (
            <MessageList
              messages={messages}
              streaming={streaming}
              streamingText={streamingText}
              activeToolCalls={activeToolCalls}
              sessionId={activeSessionId}
              onSend={onSendMessage}
            />
          ) : (
            <WelcomeView onSend={onSendMessage} />
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={onSendMessage}
          disabled={streaming}
        />
      </div>
    </div>
  );
}
