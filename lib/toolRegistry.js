const { endpoints } = require('./endpoints');

function toSnakeCase(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ── Extra query params not in endpoints.js ──

const EXTRA_QUERY_PARAMS = {
  token_search: [
    { name: 'symbol', required: false, description: 'Search for all tokens matching an exact symbol' },
    { name: 'cursor', required: false, description: 'Cursor for cursor-based pagination (faster for deep pagination)' },
    { name: 'showPriceChanges', required: false, description: 'Include price change data (true/false)' },
    { name: 'minLiquidity', required: false, description: 'Minimum liquidity in USD' },
    { name: 'maxLiquidity', required: false, description: 'Maximum liquidity in USD' },
    { name: 'minMarketCap', required: false, description: 'Minimum market cap in USD' },
    { name: 'maxMarketCap', required: false, description: 'Maximum market cap in USD' },
    { name: 'minHolders', required: false, description: 'Minimum number of holders' },
    { name: 'maxHolders', required: false, description: 'Maximum number of holders' },
    { name: 'minVolume_24h', required: false, description: 'Minimum 24h volume in USD' },
    { name: 'status', required: false, description: "Token status: 'graduating', 'graduated', or 'default'" },
    { name: 'launchpad', required: false, description: "Filter by launchpad (e.g. 'pumpfun', 'moonshot')" },
    { name: 'market', required: false, description: "Market identifier (e.g. 'pumpfun', 'raydium')" },
    { name: 'hasSocials', required: false, description: 'Filter tokens with social links (true/false)' },
    { name: 'minTop10', required: false, description: 'Min % held by top 10 holders (0-100)' },
    { name: 'maxTop10', required: false, description: 'Max % held by top 10 holders (0-100)' },
    { name: 'minRiskScore', required: false, description: 'Minimum risk score (0+)' },
    { name: 'maxRiskScore', required: false, description: 'Maximum risk score (0+)' },
    { name: 'minDev', required: false, description: 'Min % held by developer (0-100)' },
    { name: 'maxDev', required: false, description: 'Max % held by developer (0-100)' },
    { name: 'freezeAuthority', required: false, description: "Freeze authority address. Use 'null' for tokens with NO freeze authority (safe)" },
    { name: 'mintAuthority', required: false, description: "Mint authority address. Use 'null' for tokens with NO mint authority (safe)" },
    { name: 'minVolume', required: false, description: 'Minimum volume in USD (for default timeframe)' },
    { name: 'maxVolume', required: false, description: 'Maximum volume in USD (for default timeframe)' },
    { name: 'volumeTimeframe', required: false, description: "Timeframe for volume filtering: '5m', '15m', '30m', '1h', '6h', '12h', '24h'" },
    { name: 'minVolume_5m', required: false, description: 'Minimum 5m volume in USD' },
    { name: 'maxVolume_5m', required: false, description: 'Maximum 5m volume in USD' },
    { name: 'minVolume_15m', required: false, description: 'Minimum 15m volume in USD' },
    { name: 'maxVolume_15m', required: false, description: 'Maximum 15m volume in USD' },
    { name: 'minVolume_30m', required: false, description: 'Minimum 30m volume in USD' },
    { name: 'maxVolume_30m', required: false, description: 'Maximum 30m volume in USD' },
    { name: 'minVolume_1h', required: false, description: 'Minimum 1h volume in USD' },
    { name: 'maxVolume_1h', required: false, description: 'Maximum 1h volume in USD' },
    { name: 'minVolume_6h', required: false, description: 'Minimum 6h volume in USD' },
    { name: 'maxVolume_6h', required: false, description: 'Maximum 6h volume in USD' },
    { name: 'minVolume_12h', required: false, description: 'Minimum 12h volume in USD' },
    { name: 'maxVolume_12h', required: false, description: 'Maximum 12h volume in USD' },
    { name: 'minBuys', required: false, description: 'Minimum number of buy transactions' },
    { name: 'maxBuys', required: false, description: 'Maximum number of buy transactions' },
    { name: 'minSells', required: false, description: 'Minimum number of sell transactions' },
    { name: 'maxSells', required: false, description: 'Maximum number of sell transactions' },
    { name: 'minTotalTransactions', required: false, description: 'Minimum total number of transactions' },
    { name: 'maxTotalTransactions', required: false, description: 'Maximum total number of transactions' },
    { name: 'minInsiders', required: false, description: 'Minimum % held by insiders (0-100)' },
    { name: 'maxInsiders', required: false, description: 'Maximum % held by insiders (0-100)' },
    { name: 'minSnipers', required: false, description: 'Minimum % held by snipers (0-100)' },
    { name: 'maxSnipers', required: false, description: 'Maximum % held by snipers (0-100)' },
    { name: 'minBundlers', required: false, description: 'Minimum bundler wallet count' },
    { name: 'maxBundlers', required: false, description: 'Maximum bundler wallet count' },
    { name: 'minBundlerPercentage', required: false, description: 'Minimum % held by bundlers (0-100)' },
    { name: 'maxBundlerPercentage', required: false, description: 'Maximum % held by bundlers (0-100)' },
    { name: 'minCurvePercentage', required: false, description: 'Minimum bonding curve progress % (0-100)' },
    { name: 'maxCurvePercentage', required: false, description: 'Maximum bonding curve progress % (0-100)' },
    { name: 'minFeesTotal', required: false, description: 'Minimum total fees paid in SOL' },
    { name: 'maxFeesTotal', required: false, description: 'Maximum total fees paid in SOL' },
    { name: 'minFeesTrading', required: false, description: 'Minimum trading fees paid in SOL' },
    { name: 'maxFeesTrading', required: false, description: 'Maximum trading fees paid in SOL' },
    { name: 'minFeesTips', required: false, description: 'Minimum priority fees/tips paid in SOL (real traders pay Jito tips)' },
    { name: 'maxFeesTips', required: false, description: 'Maximum priority fees/tips paid in SOL' },
    { name: 'minCreatedAt', required: false, description: 'Minimum creation date in unix time (ms)' },
    { name: 'maxCreatedAt', required: false, description: 'Maximum creation date in unix time (ms)' },
    { name: 'minGraduatedAt', required: false, description: 'Minimum graduation date in unix time (ms)' },
    { name: 'maxGraduatedAt', required: false, description: 'Maximum graduation date in unix time (ms)' },
    { name: 'showAllPools', required: false, description: 'Return all pools for each token in search results (true/false)' },
    { name: 'hasImage', required: false, description: 'Filter tokens with/without images (true/false)' },
    { name: 'lpBurn', required: false, description: 'Exact LP burn percentage (0-100)' },
    { name: 'deployer', required: false, description: 'Deployer wallet address' },
    { name: 'creator', required: false, description: 'Token creator wallet address' },
  ],
  get_ohlcv_data: [
    { name: 'marketCap', required: false, description: 'Return market cap chart instead of price (true/false)' },
    { name: 'removeOutliers', required: false, description: 'Remove outlier data points (true/false, default true)' },
    { name: 'dynamicPools', required: false, description: 'Dynamically pick main pool over time for best chart (true/false, default true)' },
  ],
  get_token_trades: [
    { name: 'sortDirection', required: false, description: "Sort direction: 'DESC' (newest first) or 'ASC' (oldest first)" },
  ],
  get_user_specific_token_trades: [
    { name: 'sortDirection', required: false, description: "Sort direction: 'DESC' (newest first) or 'ASC' (oldest first)" },
  ],
};

// ── Rich data-aware tool descriptions ──

const TOOL_DESCRIPTIONS = {
  token_search: 'Search and discover tokens with 50+ filters. Returns FLAT objects per token: name, symbol, mint, price, marketCap, liquidity (MAIN POOL ONLY), holders, volume (5m-24h), top10%, dev%, insiders%, snipers%, bundlers{count,%}, riskScore, lpBurn, freezeAuthority, mintAuthority, fees{total,totalTrading,totalTips}, events with priceChangePercentage for 1m-24h. THIS IS YOUR PRIMARY DISCOVERY TOOL — use filters for custom searches. For common queries, prefer the curated tools (get_trending_tokens, get_tokens_by_volume, get_top_performing_tokens, etc.) which have quality filters built in. NOTE: liquidity shown is only the largest pool — tokens with multiple pools have more total liquidity. Use get_token_information when you need multi-pool data.',
  get_token_information: 'Full token details with nested pools[] array and risk breakdown. Returns: token metadata + pools[{poolId, liquidity{quote,usd}, price{quote,usd}, marketCap, market, lpBurn, security{freezeAuthority,mintAuthority}, deployer, txns{buys,sells,volume,volume24h}}] + events (price changes 1m-24h) + risk{snipers{count,wallets[]}, insiders{count,wallets[]}, bundlers{count,totalPercentage,wallets[]}, top10, dev{percentage,amount}, score, risks[{name,description,level,score}], rugged, jupiterVerified} + holders count. CRITICAL: This is the ONLY tool that returns ALL pools — use it when you need total liquidity across all pools, per-pool breakdown, or deployer addresses.',
  get_token_holders_top_100: 'Top 100 holders. Returns {total (total holder count), accounts[{wallet, amount, value{quote,usd}, percentage}]}. Use when chaining into wallet analysis (e.g., "what do top holders hold?") or when you need >20 holders.',
  get_top_20_token_holders: 'Top 20 holders with addresses + balances + percentages + values. Faster and smaller than top-100. Use for quick holder distribution checks or display-only queries.',
  get_all_time_high_price: 'Returns {highest_price, highest_market_cap, timestamp, pool_id}. Small response. Use for ATH comparison or to calculate distance from ATH.',
  get_token_bundlers: 'Returns {total (count), balance, percentage, wallets[{wallet,balance,percentage,bundleTime}]}. Use when analyzing coordination risk or when user asks specifically about bundlers.',
  get_tokens_by_deployer: 'All tokens deployed by a wallet address. Returns same rich flat data as token_search. Use to check deployer history for rug patterns.',
  get_token_price: 'Returns {price, priceQuote, liquidity (MAIN POOL ONLY), marketCap, lastUpdated, priceChanges{1m-24h}}. NOTE: liquidity is only the main pool, not total. Use when you need fresh price/price changes only.',
  get_historic_price_information: 'Returns {current, 1d, 3d, 5d, 7d, 14d, 30d} price snapshots. Good for understanding price trajectory over time.',
  get_price_at_specific_timestamp: 'Price at a specific unix timestamp. Returns {price, timestamp}.',
  get_lowest_highest_price_in_range: 'Returns {token, price{lowest{price,marketcap,time}, highest{price,marketcap,time}}} for a time range. Good for volatility analysis.',
  get_wallet_tokens: 'COMPLETE list of ALL tokens held by a wallet — use for comprehensive holder analysis, portfolio review, finding shared holdings across wallets. THIS is the right tool when you need to know WHAT tokens a wallet holds. Returns {tokens[{address, balance, value, price{usd,quote}, marketCap, liquidity}], total, totalSol}. Sorted by value, top 50 shown.',
  get_basic_wallet_information: 'Quick wallet overview — use ONLY for fast balance checks, NOT for comprehensive analysis. May not include all tokens. Returns {tokens[{address, balance, value, price, marketCap, liquidity}], total (USD), totalSol}. Small and fast.',
  get_wallet_trades: 'Recent trades by a wallet. Array of trade objects with amounts, prices, timestamps.',
  get_wallet_portfolio_chart: 'Portfolio value chart over time.',
  get_token_trades: 'Recent trades for a token. parseJupiter=true combines Jupiter multi-hop swaps, hideArb=true filters arbitrage.',
  get_user_specific_token_trades: 'Trades for a specific token by a specific wallet.',
  get_ohlcv_data: 'OHLCV candlestick data. Returns array of {open,high,low,close,volume,time}. Large, trimmed. Use 5m/15m for recent, 1d/1w for historical.',
  get_holders_chart_data: 'Holder count over time. Returns array of {time, count}. Good for growth trends.',
  get_wallet_pnl: 'Returns {summary{realized, unrealized, total, totalInvested, totalWins, totalLosses, averageBuyAmount, winPercentage, lossPercentage}, pnl_since}. hideDetails=true for summary only. hideDetails=false adds per-token breakdown (large).',
  get_first_token_buyers: 'First buyers with PnL data. Use to detect insiders.',
  get_top_traders: 'Top traders by profit for a token.',
  get_token_stats: 'Trading stats by timeframe (1m-24h). Each timeframe: {buyers, sellers, volume{buys,sells,total}, transactions, buys, sells, wallets, price, priceChangePercentage}. Good for activity analysis.',
  get_trending_tokens: 'Curated trending tokens — sorted by volume with quality filters (min liquidity $5K, 50+ holders, $10K+ 24h volume, 100+ txns, low risk, no freeze/mint authority). Returns same rich flat data as token_search. Use for a quick view of what\'s hot right now.',
  get_trending_tokens_by_timeframe: 'Curated trending tokens for a specific timeframe (5m to 24h). Same quality filters as trending but volume scoped to the given timeframe. Pass timeframe as path param.',
  get_tokens_by_volume: 'Curated volume leaders — sorted by volume with anti-wash-trading filters (min liquidity $10K, 30+ holders, $25K+ 24h volume, 20+ buys, 10+ sells, low risk). Returns same rich flat data as token_search.',
  get_tokens_by_volume_with_timeframe: 'Curated volume leaders for a specific timeframe. Same quality filters as volume but scoped to the given timeframe. Pass timeframe as path param.',
  get_top_performing_tokens: 'Curated top performers — sorted by market cap with strict quality filters (min liquidity $10K, 100+ holders, $10K+ volume, 200+ txns, very low risk, max 10% dev, max 50% top10, no freeze/mint authority). Filters out pump-and-dumps.',
  get_token_overview: 'Curated market overview — newest quality tokens sorted by creation date with filters (min liquidity $5K, 20+ holders, $5K+ volume, 50+ txns, low risk). Good for seeing what\'s new and legitimate.',
  get_graduating_tokens: 'Curated graduating tokens — on bonding curve with real activity. Filtered by curve progress, holders, transactions, and risk score. Accepts limit, minCurve, maxCurve, minHolders params.',
  get_graduated_tokens: 'Curated recently graduated tokens — post-graduation with real activity (min liquidity $5K, 30+ holders, $5K+ volume, 50+ txns, low risk). Filters out spam graduates.',
};

// ── Smart defaults applied before every API call ──

const TOOL_DEFAULTS = {
  token_search: {
    limit: '100',
    showPriceChanges: 'true',
  },
  get_token_price:                { priceChanges: 'true' },
  get_tokens_by_deployer:         { limit: '10' },
  get_wallet_pnl:                 { hideDetails: 'true' },
  get_ohlcv_data:                 { type: '1h', removeOutliers: 'true' },
  get_holders_chart_data:         { type: '1d' },
  get_token_trades:               { parseJupiter: 'true', hideArb: 'true' },
  get_user_specific_token_trades: { parseJupiter: 'true', hideArb: 'true' },
};

// ── Build tools ──

function buildTools() {
  const tools = [];
  const toolEndpoints = [];

  for (const ep of endpoints) {
    const name = toSnakeCase(ep.name);

    const properties = {};
    const required = [];

    // Path params are always required
    for (const p of ep.pathParams || []) {
      const prop = { type: 'string', description: p.description };
      if (p.enum) prop.enum = p.enum;
      properties[p.name] = prop;
      required.push(p.name);
    }

    // Query params from endpoints.js
    const existingParamNames = new Set();
    for (const p of ep.queryParams || []) {
      const prop = { type: 'string', description: p.description };
      if (p.default) prop.default = p.default;
      properties[p.name] = prop;
      existingParamNames.add(p.name);
      if (p.required) required.push(p.name);
    }

    // Merge extra query params
    const extras = EXTRA_QUERY_PARAMS[name] || [];
    for (const p of extras) {
      if (!existingParamNames.has(p.name)) {
        properties[p.name] = { type: 'string', description: p.description };
        if (p.required) required.push(p.name);
      }
    }

    const description = TOOL_DESCRIPTIONS[name] || `${ep.name} — ${ep.category}. API path: ${ep.path}`;

    tools.push({
      name,
      description,
      parameters: {
        type: 'object',
        properties,
        required: required.length ? required : undefined,
      },
    });

    toolEndpoints.push(ep);
  }

  return { tools, toolEndpoints };
}

let _tools = null;
let _toolEndpoints = null;
let _toolMap = null;

function getTools() {
  if (!_tools) {
    const result = buildTools();
    _tools = result.tools;
    _toolEndpoints = result.toolEndpoints;
  }
  return _tools;
}

function getToolMap() {
  if (!_toolMap) {
    _toolMap = new Map();
    const tools = getTools();
    for (let i = 0; i < tools.length; i++) {
      _toolMap.set(tools[i].name, _toolEndpoints[i]);
    }
  }
  return _toolMap;
}

function getToolDefaults() {
  return TOOL_DEFAULTS;
}

function getExtraQueryParams() {
  return EXTRA_QUERY_PARAMS;
}

module.exports = { getTools, getToolMap, getToolDefaults, getExtraQueryParams };
