import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import SolanaAddress from './SolanaAddress';

const SOLANA_ADDR_RE = /([1-9A-HJ-NP-Za-km-z]{32,44})/g;

function processTextWithAddresses(text) {
  if (!text || typeof text !== 'string') return text;

  const parts = text.split(SOLANA_ADDR_RE);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (SOLANA_ADDR_RE.test(part)) {
      SOLANA_ADDR_RE.lastIndex = 0;
      return <SolanaAddress key={i} address={part} />;
    }
    return part;
  });
}

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="relative group">
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs rounded bg-elevated text-text-secondary hover:text-text-primary border border-border-default"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <code className={className}>{children}</code>
      </div>
    );
  }

  return <code className={className}>{children}</code>;
}

export default function MarkdownRenderer({ content }) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p>{processChildren(children)}</p>,
          li: ({ children }) => <li>{processChildren(children)}</li>,
          td: ({ children }) => <td>{processChildren(children)}</td>,
          th: ({ children }) => <th>{processChildren(children)}</th>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function processChildren(children) {
  if (!children) return children;
  if (typeof children === 'string') return processTextWithAddresses(children);
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') return <span key={i}>{processTextWithAddresses(child)}</span>;
      return child;
    });
  }
  return children;
}
