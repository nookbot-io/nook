import { useState, useEffect } from 'react';
import { TrendingUp, Search, Wallet, BarChart3, Shield, Users, Bookmark, Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../api';

const CATEGORIES = [
  {
    name: 'Discovery',
    icon: TrendingUp,
    prompts: [
      { title: 'Trending now', description: 'Top trending tokens right now', prompt: 'Show me trending tokens right now' },
      { title: 'Volume leaders', description: 'Most traded tokens in 24h', prompt: 'What are the most traded tokens by volume in the last 24 hours?' },
      { title: 'New graduates', description: 'Recently graduated tokens with real activity', prompt: 'Show me recently graduated tokens with real volume and holders' },
      { title: 'Low-cap gems', description: 'Tokens under $5M with strong fundamentals', prompt: 'Find tokens under $5M market cap with good liquidity, 100+ holders, and real volume' },
      { title: 'Top performers', description: 'Biggest gainers right now', prompt: 'Show me the top performing tokens right now' },
    ],
  },
  {
    name: 'Analysis',
    icon: Search,
    prompts: [
      { title: 'Token deep dive', description: 'Full analysis of a specific token', prompt: 'Analyze BONK token, price, holders, volume, risk, and liquidity' },
      { title: 'Price check', description: 'Current price with change %', prompt: "What's the current price of SOL?" },
      { title: 'Compare tokens', description: 'Side-by-side comparison', prompt: 'Compare WIF and BONK, price, market cap, holders, volume, and risk' },
      { title: 'Token stats', description: 'Trading activity breakdown', prompt: 'Show me detailed trading stats for BONK across all timeframes' },
      { title: 'Price history', description: 'Historical price snapshots', prompt: 'Show me the price history for SOL over the last 30 days' },
    ],
  },
  {
    name: 'Safety',
    icon: Shield,
    prompts: [
      { title: 'Rug check', description: 'Check if a token is safe', prompt: 'Is this token safe? Check the risk score, holder distribution, and security flags' },
      { title: 'Bundler check', description: 'Detect coordinated buying', prompt: 'Check bundler activity for this token, are there coordinated buyers?' },
      { title: 'Deployer history', description: "What else did the deployer create?", prompt: 'Look up the deployer of this token and show me what other tokens they created' },
      { title: 'Insider detection', description: 'Find early buyers and insiders', prompt: 'Show me the first buyers of this token and their current PnL' },
    ],
  },
  {
    name: 'Wallets',
    icon: Wallet,
    prompts: [
      { title: 'Wallet PnL', description: 'Profit and loss summary', prompt: 'Show me the PnL summary for this wallet' },
      { title: 'Wallet holdings', description: 'All tokens in a wallet', prompt: 'What tokens does this wallet hold?' },
      { title: 'Trade history', description: 'Recent trades by a wallet', prompt: 'Show me recent trades for this wallet' },
      { title: 'Top traders', description: 'Best traders for a token', prompt: 'Who are the top traders for BONK by profit?' },
    ],
  },
  {
    name: 'Market',
    icon: BarChart3,
    prompts: [
      { title: 'Market sentiment', description: 'Is the market bullish or bearish?', prompt: 'What is the current market sentiment on Solana? Are most tokens up or down?' },
      { title: 'Market overview', description: 'Newest quality tokens', prompt: 'Give me a market overview of the newest quality tokens on Solana' },
      { title: 'Volume by timeframe', description: 'Volume leaders in the last hour', prompt: 'Show me the top tokens by volume in the last hour' },
    ],
  },
  {
    name: 'Holders',
    icon: Users,
    prompts: [
      { title: 'Top holders', description: 'Biggest holders of a token', prompt: 'Show me the top 20 holders of BONK with their balances' },
      { title: 'Holder growth', description: 'How holder count changed over time', prompt: 'Show me the holder growth chart for BONK over the last 30 days' },
      { title: 'Whale watch', description: 'What do top holders hold?', prompt: 'Show me what the top 5 holders of BONK also hold in their wallets' },
    ],
  },
];

export default function WelcomeView({ onSend }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [presets, setPresets] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrompt, setNewPresetPrompt] = useState('');
  const [showAddPreset, setShowAddPreset] = useState(false);

  useEffect(() => {
    apiGet('/presets').then(setPresets).catch(() => {});
  }, []);

  const handleAddPreset = async () => {
    if (!newPresetName.trim() || !newPresetPrompt.trim()) return;
    try {
      const preset = await apiPost('/presets', { name: newPresetName.trim(), prompt: newPresetPrompt.trim() });
      setPresets((prev) => [...prev, preset]);
      setNewPresetName('');
      setNewPresetPrompt('');
      setShowAddPreset(false);
    } catch {
      // Ignore
    }
  };

  const handleDeletePreset = async (id) => {
    try {
      await apiDelete(`/presets/${id}`);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Ignore
    }
  };

  const category = showPresets ? null : CATEGORIES[activeCategory];

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

        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {CATEGORIES.map((cat, i) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => { setActiveCategory(i); setShowPresets(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !showPresets && i === activeCategory
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-secondary hover:bg-elevated'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
          {presets.length > 0 && (
            <button
              onClick={() => setShowPresets(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showPresets
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-elevated'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              My Presets
            </button>
          )}
        </div>

        {showPresets ? (
          <div className="space-y-2.5">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSend(preset.prompt)}
                  className="flex-1 text-left px-4 py-3 rounded-xl border border-border-subtle bg-surface hover:bg-elevated transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary">{preset.name}</p>
                  <p className="text-xs text-text-tertiary mt-0.5 truncate">{preset.prompt}</p>
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                  title="Delete preset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {category.prompts.map((item) => (
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
        )}

        {/* Add preset form */}
        <div className="mt-4 flex justify-center">
          {showAddPreset ? (
            <div className="w-full p-4 rounded-xl border border-border-subtle bg-surface space-y-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name"
                className="w-full px-3 py-2 rounded-lg bg-app border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-accent"
              />
              <textarea
                value={newPresetPrompt}
                onChange={(e) => setNewPresetPrompt(e.target.value)}
                placeholder="Prompt (e.g., Find trending tokens under $1M market cap)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-app border border-border-subtle text-text-primary text-sm resize-none focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddPreset(false); setNewPresetName(''); setNewPresetPrompt(''); }}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPreset}
                  disabled={!newPresetName.trim() || !newPresetPrompt.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  Save Preset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddPreset(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save a custom preset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
