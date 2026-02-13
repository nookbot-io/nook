import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import StreamingText from './StreamingText';
import ToolCallBlock from './ToolCallBlock';

export default function MessageList({
  messages,
  streaming,
  streamingText,
  activeToolCalls,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, activeToolCalls]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Active tool calls */}
        {activeToolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeToolCalls.map((tc) => (
              <ToolCallBlock key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Streaming text */}
        {streaming && streamingText && (
          <StreamingText content={streamingText} />
        )}

        {/* Loading indicator */}
        {streaming && !streamingText && activeToolCalls.length === 0 && (
          <div className="flex items-center gap-1.5 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
