// Per-endpoint response filtering — strips unnecessary fields BEFORE the generic trimmer runs.
// Uses pick-list pattern: only explicitly listed fields are kept. Unknown fields are dropped.
// If data shape is unexpected, returns data unchanged (never crashes).

function pick(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const f of fields) {
    if (f in obj) out[f] = obj[f];
  }
  return out;
}

// ── Token array filter (token_search, get_tokens_by_deployer) ──

const TOKEN_FIELDS = [
  'name', 'symbol', 'mint', 'address',
  'price', 'priceUsd', 'marketCap', 'marketCapUsd',
  'liquidity', 'liquidityUsd',
  'holders', 'riskScore', 'lpBurn',
  'freezeAuthority', 'mintAuthority',
  'top10', 'dev', 'insiders', 'snipers',
  'createdAt', 'graduatedAt', 'status', 'launchpad', 'market',
  'volume', 'volume_5m', 'volume_15m', 'volume_30m',
  'volume_1h', 'volume_6h', 'volume_12h', 'volume_24h',
  'buys', 'sells', 'totalTransactions',
];

function filterToken(token) {
  const out = pick(token, TOKEN_FIELDS);

  // Flatten events → extract only 24h price change
  if (token.events) {
    const e24h = token.events['24h'];
    if (e24h && e24h.priceChangePercentage !== undefined) {
      out.priceChange24h = e24h.priceChangePercentage;
    }
    // Also keep other timeframe price changes if present (compact)
    for (const tf of ['1m', '5m', '15m', '30m', '1h', '6h', '12h']) {
      const e = token.events[tf];
      if (e && e.priceChangePercentage !== undefined) {
        if (!out.priceChanges) out.priceChanges = {};
        out.priceChanges[tf] = e.priceChangePercentage;
      }
    }
    if (out.priceChange24h !== undefined && out.priceChanges) {
      out.priceChanges['24h'] = out.priceChange24h;
    }
  }

  // Flatten bundlers → keep count + percentage only
  if (token.bundlers && typeof token.bundlers === 'object') {
    out.bundlerCount = token.bundlers.count;
    out.bundlerPercentage = token.bundlers.percentage;
  }

  // Flatten fees → keep total only
  if (token.fees && typeof token.fees === 'object') {
    out.feesTotal = token.fees.total;
  }

  return out;
}

function filterTokenArray(data) {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== 'object') return item;
    // Skip metadata entries (e.g., _note, _aggregateStats)
    if (item._note || item._aggregateStats) return item;
    return filterToken(item);
  });
}

// ── get_token_information ──

function filterTokenInformation(data) {
  if (!data || typeof data !== 'object') return data;

  const out = {};

  // token metadata
  if (data.token) {
    out.token = pick(data.token, ['symbol', 'name', 'mint', 'decimals', 'deployer', 'description', 'creator']);
  }

  // pools — slim each pool
  if (Array.isArray(data.pools)) {
    out.pools = data.pools.map((pool) => {
      const p = {};
      if (pool.market) p.market = pool.market;
      if (pool.liquidity) p.liquidityUsd = pool.liquidity.usd ?? pool.liquidity;
      if (pool.lpBurn !== undefined) p.lpBurn = pool.lpBurn;
      if (pool.price) p.tokenPrice = pool.price.usd ?? pool.price;
      if (pool.marketCap !== undefined) p.marketCap = pool.marketCap;
      // Volume from txns
      if (pool.txns) {
        p.volume24h = pool.txns.volume24h ?? pool.txns.volume ?? undefined;
        p.buys = pool.txns.buys;
        p.sells = pool.txns.sells;
      }
      if (pool.deployer) p.deployer = pool.deployer;
      return p;
    });
  }

  // risk — keep counts, strip wallet arrays
  if (data.risk) {
    const r = data.risk;
    out.risk = {
      score: r.score,
      top10: r.top10,
      rugged: r.rugged,
      jupiterVerified: r.jupiterVerified,
    };
    if (r.dev) {
      out.risk.dev = typeof r.dev === 'object'
        ? { percentage: r.dev.percentage, amount: r.dev.amount }
        : r.dev;
    }
    if (Array.isArray(r.risks)) {
      out.risk.risks = r.risks;
    }
    // Snipers/insiders/bundlers — counts only, no wallet arrays
    if (r.snipers) {
      out.risk.snipersCount = r.snipers.count ?? (Array.isArray(r.snipers.wallets) ? r.snipers.wallets.length : undefined);
    }
    if (r.insiders) {
      out.risk.insidersCount = r.insiders.count ?? (Array.isArray(r.insiders.wallets) ? r.insiders.wallets.length : undefined);
      out.risk.insidersPercentage = r.insiders.percentage;
    }
    if (r.bundlers) {
      out.risk.bundlersCount = r.bundlers.count ?? (Array.isArray(r.bundlers.wallets) ? r.bundlers.wallets.length : undefined);
      out.risk.bundlersPercentage = r.bundlers.totalPercentage ?? r.bundlers.percentage;
    }
  }

  // events — keep as-is (already compact)
  if (data.events) out.events = data.events;

  // holders count
  if (data.holders !== undefined) out.holders = data.holders;

  return out;
}

// ── get_token_holders_top_100 ──

function filterHoldersTop100(data) {
  if (!data || typeof data !== 'object') return data;

  const out = {};
  if (data.total !== undefined) out.total = data.total;

  if (Array.isArray(data.accounts)) {
    out.accounts = data.accounts.map((a) => {
      const entry = { wallet: a.wallet, percentage: a.percentage };
      // Flatten value
      if (a.value) {
        entry.valueUsd = typeof a.value === 'object' ? (a.value.usd ?? a.value) : a.value;
      }
      if (a.percentage > 3) {
        entry.highConcentration = true;
      }
      return entry;
    });
  }

  return out;
}

// ── get_wallet_tokens ──

const WALLET_TOKEN_FIELDS = ['address', 'symbol', 'name', 'value', 'balance'];

function filterWalletTokens(data) {
  if (!data || typeof data !== 'object') return data;

  const out = {};
  if (data.total !== undefined) out.total = data.total;
  if (data.totalSol !== undefined) out.totalSol = data.totalSol;

  if (Array.isArray(data.tokens)) {
    out.tokens = data.tokens.map((t) => pick(t, WALLET_TOKEN_FIELDS));
  }

  return out;
}

// ── Trade filters (get_token_trades, get_user_specific_token_trades, get_wallet_trades) ──

const TRADE_FIELDS = [
  'timestamp', 'time', 'date',
  'type', 'side',
  'amount', 'tokenAmount', 'baseAmount',
  'priceUsd', 'price',
  'wallet', 'buyer', 'seller', 'owner',
  'volume', 'volumeUsd',
  'token', 'tokenAddress', 'symbol',
];

function filterTrade(trade) {
  return pick(trade, TRADE_FIELDS);
}

function filterTrades(data) {
  if (Array.isArray(data)) {
    return data.map((t) => {
      if (!t || typeof t !== 'object') return t;
      if (t._note) return t;
      return filterTrade(t);
    });
  }
  // Some trade endpoints return { trades: [] }
  if (data && typeof data === 'object' && Array.isArray(data.trades)) {
    return { ...data, trades: data.trades.map((t) => (t && typeof t === 'object' && !t._note) ? filterTrade(t) : t) };
  }
  return data;
}

// ── get_first_token_buyers ──

const FIRST_BUYER_FIELDS = [
  'wallet', 'timestamp', 'buyTime',
  'amount', 'buyPrice', 'currentValue',
  'pnl', 'pnlPercentage', 'profit', 'profitPercentage',
  'holding', 'balance',
];

function filterFirstBuyers(data) {
  if (Array.isArray(data)) {
    return data.map((b) => {
      if (!b || typeof b !== 'object') return b;
      if (b._note) return b;
      return pick(b, FIRST_BUYER_FIELDS);
    });
  }
  return data;
}

// ── get_top_traders ──

const TOP_TRADER_FIELDS = [
  'wallet', 'profit', 'profitPercentage',
  'pnl', 'pnlPercentage',
  'trades', 'volume', 'bought', 'sold',
  'realized', 'unrealized',
];

function filterTopTraders(data) {
  if (Array.isArray(data)) {
    return data.map((t) => {
      if (!t || typeof t !== 'object') return t;
      if (t._note) return t;
      return pick(t, TOP_TRADER_FIELDS);
    });
  }
  return data;
}

// ── get_wallet_pnl ──

function filterWalletPnl(data) {
  if (!data || typeof data !== 'object') return data;

  const out = {};

  // summary is already compact — keep as-is
  if (data.summary) out.summary = data.summary;

  // Per-token breakdown — slim each entry
  const tokenList = data.tokens || data.pnl;
  if (Array.isArray(tokenList)) {
    const key = data.tokens ? 'tokens' : 'pnl';
    out[key] = tokenList.map((t) => {
      if (!t || typeof t !== 'object') return t;
      if (t._note) return t;
      return pick(t, [
        'symbol', 'address', 'mint', 'name',
        'invested', 'profit', 'currentValue', 'holding',
        'realized', 'unrealized', 'pnl',
        'buyAmount', 'sellAmount',
      ]);
    });
  }

  // pnl_since
  if (data.pnl_since !== undefined) out.pnl_since = data.pnl_since;

  return out;
}

// ── get_token_bundlers ──

function filterBundlers(data) {
  if (!data || typeof data !== 'object') return data;

  const out = {};
  if (data.total !== undefined) out.total = data.total;
  if (data.balance !== undefined) out.balance = data.balance;
  if (data.percentage !== undefined) out.percentage = data.percentage;

  if (Array.isArray(data.wallets)) {
    out.wallets = data.wallets.map((w) => pick(w, ['wallet', 'percentage']));
  }

  return out;
}

// ── Filter dispatch map ──

const FILTERS = {
  token_search: filterTokenArray,
  get_tokens_by_deployer: filterTokenArray,
  get_token_information: filterTokenInformation,
  get_token_holders_top_100: filterHoldersTop100,
  get_wallet_tokens: filterWalletTokens,
  get_token_trades: filterTrades,
  get_user_specific_token_trades: filterTrades,
  get_wallet_trades: filterTrades,
  get_first_token_buyers: filterFirstBuyers,
  get_top_traders: filterTopTraders,
  get_wallet_pnl: filterWalletPnl,
  get_token_bundlers: filterBundlers,
};

function filterResponse(toolName, data) {
  const fn = FILTERS[toolName];
  if (!fn) return data;
  try {
    return fn(data);
  } catch {
    // Defensive: if filter fails, return original data
    return data;
  }
}

module.exports = { filterResponse };
