import { useState } from 'react';
import { Loader2, Check, X, ChevronRight } from 'lucide-react';

export default function ToolCallBlock({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = toolCall.status === 'running';
  const isFailed = toolCall.status === 'failed';
  const displayName = toolCall.name.replace(/_/g, ' ');

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          isRunning
            ? 'bg-accent/10 text-accent'
            : isFailed
            ? 'bg-danger/10 text-danger'
            : 'bg-success/10 text-success'
        } hover:opacity-80`}
      >
        {isRunning ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isFailed ? (
          <X className="w-3 h-3" />
        ) : (
          <Check className="w-3 h-3" />
        )}
        <span>{displayName}</span>
        {toolCall.duration && (
          <span className="opacity-60">{toolCall.duration}ms</span>
        )}
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-1 ml-2 p-2 rounded-lg bg-elevated border border-border-subtle text-xs font-mono max-w-md">
          {toolCall.args && Object.keys(toolCall.args).length > 0 && (
            <pre className="text-text-secondary whitespace-pre-wrap break-all">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          )}
          {toolCall.error && (
            <p className="text-danger mt-1">{toolCall.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
