import { useState, useMemo, useRef, useCallback } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { apiPost } from '../../api';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import ToolCallBlock from './ToolCallBlock';
import FollowUpSuggestions, { parseFollowUps } from './FollowUpSuggestions';

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

export default function MessageBubble({ message, sessionId, messageIndex, onSend }) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(message.rating || null);
  const contentRef = useRef(null);
  const parsed = useMemo(
    () => message.role === 'assistant' ? parseFollowUps(message.content) : null,
    [message.content, message.role]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = useCallback(async () => {
    if (!contentRef.current) return;
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#1a1a2e',
        pixelRatio: 2,
        style: { padding: '24px' },
      });
      const link = document.createElement('a');
      link.download = `nook-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fallback: copy text
      navigator.clipboard.writeText(message.content);
    }
  }, [message.content]);

  const handleRate = async (value) => {
    const newRating = rating === value ? null : value;
    setRating(newRating);
    if (newRating && sessionId) {
      try {
        await apiPost('/chat/rate', { sessionId, messageIndex, rating: newRating });
      } catch {
        // Silently fail — rating is non-critical
      }
    }
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
          <div ref={contentRef} className="text-text-primary">
            <MarkdownRenderer content={parsed?.text || message.content} />
          </div>
          {parsed?.suggestions?.length > 0 && onSend && (
            <FollowUpSuggestions suggestions={parsed.suggestions} onSend={onSend} />
          )}
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-elevated transition-colors text-text-tertiary hover:text-text-secondary"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleRate('up')}
              className={`p-1 rounded transition-colors ${
                rating === 'up'
                  ? 'text-success bg-success/10'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated'
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRate('down')}
              className={`p-1 rounded transition-colors ${
                rating === 'down'
                  ? 'text-error bg-error/10'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated'
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleShare}
              className="p-1 rounded hover:bg-elevated transition-colors text-text-tertiary hover:text-text-secondary"
              title="Export as image"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-text-tertiary ml-1">
              {timeAgo(message.timestamp)}
            </span>
            {message.usage && (
              <span className="text-xs text-text-tertiary ml-1" title={`Prompt: ${message.usage.promptTokens?.toLocaleString()} | Completion: ${message.usage.completionTokens?.toLocaleString()}`}>
                {message.usage.totalTokens?.toLocaleString()} tokens
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
