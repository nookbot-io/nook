const PROMPTS = [
  { title: 'Price check', description: "What's the current price of SOL?", prompt: "What's the current price of SOL?" },
  { title: 'Trending', description: 'Show me trending tokens right now', prompt: 'Show me trending tokens right now' },
  { title: 'Analyze token', description: 'Deep dive into a specific token', prompt: 'Analyze BONK token — price, holders, volume, and recent trades' },
  { title: 'Safe gems', description: 'Find tokens with strong fundamentals', prompt: 'Find tokens with high holder count, good liquidity, and growing volume' },
  { title: 'Wallet lookup', description: 'Inspect any wallet holdings', prompt: "Show me the token holdings for wallet address" },
  { title: 'Market sentiment', description: 'Analyze broader market trends', prompt: 'What are the most actively traded tokens in the last 24 hours?' },
];

export default function WelcomeView({ onSend }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <img src="/nook.png" alt="Nook" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">
            Nook
          </h2>
          <p className="text-sm text-text-tertiary">
            Solana blockchain intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROMPTS.map((item) => (
            <button
              key={item.title}
              onClick={() => onSend(item.prompt)}
              className="text-left px-4 py-3 rounded-xl border border-border-subtle bg-surface hover:bg-elevated transition-colors group"
            >
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
