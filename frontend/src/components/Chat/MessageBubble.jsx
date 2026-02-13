import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import ToolCallBlock from './ToolCallBlock';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end group">
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="bg-accent text-white px-4 py-2.5 rounded-2xl rounded-br-md">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.content}</p>
          </div>
          <p className="text-xs text-text-tertiary mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            {timeAgo(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  if (message.role === 'assistant') {
    return (
      <div className="group">
        <div className="max-w-[90%]">
          {message.toolCalls?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.toolCalls.map((tc) => (
                <ToolCallBlock key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}
          <div className="text-text-primary">
            <MarkdownRenderer content={message.content} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-elevated transition-colors text-text-tertiary hover:text-text-secondary"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs text-text-tertiary">
              {timeAgo(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
