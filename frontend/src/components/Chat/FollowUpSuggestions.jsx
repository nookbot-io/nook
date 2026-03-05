import { ArrowRight } from 'lucide-react';

export function parseFollowUps(content) {
  if (!content) return { text: content, suggestions: [] };

  const regex = /```suggestions\s*\n(\[[\s\S]*?\])\s*\n```\s*$/;
  const match = content.match(regex);

  if (!match) return { text: content, suggestions: [] };

  try {
    const suggestions = JSON.parse(match[1]);
    const text = content.slice(0, match.index).trimEnd();
    return { text, suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 3) : [] };
  } catch {
    return { text: content, suggestions: [] };
  }
}

export default function FollowUpSuggestions({ suggestions, onSend }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {suggestions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSend(q)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
        >
          <ArrowRight className="w-3 h-3" />
          {q}
        </button>
      ))}
    </div>
  );
}
