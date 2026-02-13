const TIMEFRAME_OPTIONS = ['5m', '15m', '30m', '1h', '2h', '3h', '4h', '5h', '6h', '12h', '24h'];
const VOLUME_TIMEFRAME_OPTIONS = ['5m', '15m', '30m', '1h', '6h', '12h', '24h'];

const endpoints = [
  // ── Search ──
  {
    name: 'Token Search',
    category: 'Search',
    path: '/search',
    pathParams: [],
    queryParams: [
      { name: 'query', required: false, description: 'Search term (symbol, name, or address)' },
      { name: 'page', required: false, description: 'Page number', default: '1' },
      { name: 'limit', required: false, description: 'Results per page (max 500)', default: '100' },
      { name: 'sortBy', required: false, description: 'Sort field (e.g. createdAt, volume, marketCapUsd)', default: 'createdAt' },
      { name: 'sortOrder', required: false, description: 'asc or desc', default: 'desc' },
    ],
  },

  // ── Tokens ──
  {
    name: 'Get Token Information',
    category: 'Tokens',
    path: '/tokens/{tokenAddress}',
    pathParams: [{ name: 'tokenAddress', description: 'Token mint address' }],
    queryParams: [],
  },
  {
    name: 'Get Token Holders (Top 100)',
    category: 'Tokens',
    path: '/tokens/{tokenAddress}/holders',
    pathParams: [{ name: 'tokenAddress', description: 'Token mint address' }],
    queryParams: [],
  },
  {
    name: 'Get Top 20 Token Holders',
    category: 'Tokens',
    path: '/tokens/{tokenAddress}/holders/top',
    pathParams: [{ name: 'tokenAddress', description: 'Token mint address' }],
    queryParams: [],
  },
  {
    name: 'Get All-Time High Price',
    category: 'Tokens',
    path: '/tokens/{tokenAddress}/ath',
    pathParams: [{ name: 'tokenAddress', description: 'Token mint address' }],
    queryParams: [],
  },
  {
    name: 'Get Token Bundlers',
    category: 'Tokens',
    path: '/tokens/{token}/bundlers',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [],
  },
  {
    name: 'Get Tokens by Deployer',
    category: 'Tokens',
    path: '/deployer/{wallet}',
    pathParams: [{ name: 'wallet', description: 'Deployer wallet address' }],
    queryParams: [
      { name: 'page', required: false, description: 'Page number', default: '1' },
      { name: 'limit', required: false, description: 'Tokens per page', default: '250' },
    ],
  },
  {
    name: 'Get Trending Tokens',
    category: 'Tokens',
    path: '/tokens/trending',
    searchPreset: true,
    pathParams: [],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Trending Tokens by Timeframe',
    category: 'Tokens',
    path: '/tokens/trending/{timeframe}',
    searchPreset: true,
    pathParams: [{ name: 'timeframe', description: 'Timeframe', enum: TIMEFRAME_OPTIONS }],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Tokens by Volume',
    category: 'Tokens',
    path: '/tokens/volume',
    searchPreset: true,
    pathParams: [],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Tokens by Volume with Timeframe',
    category: 'Tokens',
    path: '/tokens/volume/{timeframe}',
    searchPreset: true,
    pathParams: [{ name: 'timeframe', description: 'Timeframe', enum: VOLUME_TIMEFRAME_OPTIONS }],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Top Performing Tokens',
    category: 'Tokens',
    path: '/top-performers/{timeframe}',
    searchPreset: true,
    pathParams: [{ name: 'timeframe', description: 'Timeframe', enum: VOLUME_TIMEFRAME_OPTIONS }],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Token Overview',
    category: 'Tokens',
    path: '/tokens/multi/all',
    searchPreset: true,
    pathParams: [],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },
  {
    name: 'Get Graduating Tokens',
    category: 'Tokens',
    path: '/tokens/multi/graduating',
    searchPreset: true,
    pathParams: [],
    queryParams: [
      { name: 'limit', required: false, description: 'Tokens to return (1-500)', default: '100' },
      { name: 'minCurve', required: false, description: 'Min curve % (0-100)', default: '40' },
      { name: 'maxCurve', required: false, description: 'Max curve % (0-100)', default: '100' },
      { name: 'minHolders', required: false, description: 'Min holders', default: '20' },
    ],
  },
  {
    name: 'Get Graduated Tokens',
    category: 'Tokens',
    path: '/tokens/multi/graduated',
    searchPreset: true,
    pathParams: [],
    queryParams: [
      { name: 'limit', required: false, description: 'Results to return (1-500)', default: '100' },
    ],
  },

  // ── Price ──
  {
    name: 'Get Token Price',
    category: 'Price',
    path: '/price',
    pathParams: [],
    queryParams: [
      { name: 'token', required: true, description: 'Token address' },
      { name: 'priceChanges', required: false, description: 'Include price change %s (true/false)' },
    ],
  },
  {
    name: 'Get Historic Price Information',
    category: 'Price',
    path: '/price/history',
    pathParams: [],
    queryParams: [
      { name: 'token', required: true, description: 'Token address' },
    ],
  },
  {
    name: 'Get Price at Specific Timestamp',
    category: 'Price',
    path: '/price/history/timestamp',
    pathParams: [],
    queryParams: [
      { name: 'token', required: true, description: 'Token address' },
      { name: 'timestamp', required: true, description: 'Unix timestamp' },
    ],
  },
  {
    name: 'Get Lowest/Highest Price in Range',
    category: 'Price',
    path: '/price/history/range',
    pathParams: [],
    queryParams: [
      { name: 'token', required: true, description: 'Token address' },
      { name: 'time_from', required: true, description: 'Start time (unix timestamp)' },
      { name: 'time_to', required: true, description: 'End time (unix timestamp)' },
    ],
  },

  // ── Wallet ──
  {
    name: 'Get Wallet Tokens',
    category: 'Wallet',
    path: '/wallet/{owner}',
    pathParams: [{ name: 'owner', description: 'Wallet address' }],
    queryParams: [],
  },
  {
    name: 'Get Basic Wallet Information',
    category: 'Wallet',
    path: '/wallet/{owner}/basic',
    pathParams: [{ name: 'owner', description: 'Wallet address' }],
    queryParams: [],
  },
  {
    name: 'Get Wallet Trades',
    category: 'Wallet',
    path: '/wallet/{owner}/trades',
    pathParams: [{ name: 'owner', description: 'Wallet address' }],
    queryParams: [
      { name: 'cursor', required: false, description: 'Pagination cursor' },
    ],
  },
  {
    name: 'Get Wallet Portfolio Chart',
    category: 'Wallet',
    path: '/wallet/{owner}/chart',
    pathParams: [{ name: 'owner', description: 'Wallet address' }],
    queryParams: [],
  },

  // ── Trades ──
  {
    name: 'Get Token Trades',
    category: 'Trades',
    path: '/trades/{tokenAddress}',
    pathParams: [{ name: 'tokenAddress', description: 'Token mint address' }],
    queryParams: [
      { name: 'cursor', required: false, description: 'Pagination cursor' },
      { name: 'showMeta', required: false, description: 'Include token metadata (true/false)' },
      { name: 'parseJupiter', required: false, description: 'Combine Jupiter swaps (true/false)' },
      { name: 'hideArb', required: false, description: 'Hide arbitrage txns (true/false)' },
    ],
  },
  {
    name: 'Get User-Specific Token Trades',
    category: 'Trades',
    path: '/trades/{tokenAddress}/by-wallet/{owner}',
    pathParams: [
      { name: 'tokenAddress', description: 'Token mint address' },
      { name: 'owner', description: 'Wallet address' },
    ],
    queryParams: [
      { name: 'cursor', required: false, description: 'Pagination cursor' },
      { name: 'showMeta', required: false, description: 'Include token metadata (true/false)' },
      { name: 'parseJupiter', required: false, description: 'Combine Jupiter swaps (true/false)' },
      { name: 'hideArb', required: false, description: 'Hide arbitrage txns (true/false)' },
    ],
  },

  // ── Chart ──
  {
    name: 'Get OHLCV Data',
    category: 'Chart',
    path: '/chart/{token}',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [
      { name: 'type', required: false, description: 'Interval (1s,1m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w)' },
      { name: 'time_from', required: false, description: 'Start time (unix seconds)' },
      { name: 'time_to', required: false, description: 'End time (unix seconds)' },
      { name: 'currency', required: false, description: 'usd, sol, or eur', default: 'usd' },
    ],
  },
  {
    name: 'Get Holders Chart Data',
    category: 'Chart',
    path: '/holders/chart/{token}',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [
      { name: 'type', required: false, description: 'Interval (e.g. 1s, 1m, 1h, 1d)', default: '1d' },
      { name: 'time_from', required: false, description: 'Start time (unix seconds)' },
      { name: 'time_to', required: false, description: 'End time (unix seconds)' },
    ],
  },

  // ── PnL ──
  {
    name: 'Get Wallet PnL',
    category: 'PnL',
    path: '/pnl/{wallet}',
    pathParams: [{ name: 'wallet', description: 'Wallet address' }],
    queryParams: [
      { name: 'showHistoricPnL', required: false, description: 'Add 1d/7d/30d PnL data (true/false)' },
      { name: 'holdingCheck', required: false, description: 'Extra holding value check (true/false)' },
      { name: 'hideDetails', required: false, description: 'Summary only, no per-token data (true/false)' },
    ],
  },
  {
    name: 'Get First Token Buyers',
    category: 'PnL',
    path: '/first-buyers/{token}',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [],
  },

  // ── Top Traders ──
  {
    name: 'Get Top Traders',
    category: 'Top Traders',
    path: '/top-traders/{token}',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [],
  },

  // ── Stats ──
  {
    name: 'Get Token Stats',
    category: 'Stats',
    path: '/stats/{token}',
    pathParams: [{ name: 'token', description: 'Token mint address' }],
    queryParams: [],
  },
];

const categories = [...new Set(endpoints.map((e) => e.category))];

function getEndpointsByCategory(category) {
  return endpoints.filter((e) => e.category === category);
}

module.exports = { endpoints, categories, getEndpointsByCategory };
