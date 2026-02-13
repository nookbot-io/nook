import MarkdownRenderer from '../shared/MarkdownRenderer';

export default function StreamingText({ content }) {
  return (
    <div className="max-w-[90%]">
      <div className="text-text-primary">
        <MarkdownRenderer content={content} />
        <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 -mb-0.5" />
      </div>
    </div>
  );
}
