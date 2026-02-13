import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-app px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end rounded-2xl border border-border-default bg-surface px-4 py-2 focus-within:border-border-focus transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Nook..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary resize-none focus:outline-none disabled:opacity-50 py-1.5 max-h-[200px] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className={`ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              text.trim() && !disabled
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-elevated text-text-tertiary'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-text-tertiary text-center mt-1.5">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
