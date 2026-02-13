// Per-session symbol → address cache
// Map<sessionId, Map<symbol, { address, name, timestamp }>>
const { loadSettings } = require('./settings');

const cache = new Map();

function getTtl() {
  return loadSettings().resolverCacheTtlMinutes * 60 * 1000;
}

function getSessionCache(sessionId) {
  if (!cache.has(sessionId)) {
    cache.set(sessionId, new Map());
  }
  return cache.get(sessionId);
}

function cacheResolution(sessionId, symbol, address, name) {
  const sc = getSessionCache(sessionId);
  sc.set(symbol.toUpperCase(), { address, name, timestamp: Date.now() });
}

function getKnownAddresses(sessionId) {
  const sc = cache.get(sessionId);
  if (!sc || sc.size === 0) return null;

  const now = Date.now();
  const entries = [];
  for (const [symbol, entry] of sc) {
    if (now - entry.timestamp > getTtl()) {
      sc.delete(symbol);
      continue;
    }
    entries.push({ symbol, address: entry.address, name: entry.name });
  }

  if (entries.length === 0) return null;
  return entries;
}

function formatKnownAddressesContext(entries) {
  if (!entries || entries.length === 0) return '';
  const lines = entries.map((e) => `- ${e.symbol}: ${e.address} (${e.name})`);
  return `\n\nKnown token addresses from this conversation (use these directly without searching again):\n${lines.join('\n')}`;
}

function extractResolutions(toolName, result) {
  const resolutions = [];
  try {
    if (toolName === 'token_search' || toolName === 'get_tokens_by_deployer') {
      // Array of token objects
      const data = Array.isArray(result) ? result : (result?.data || result);
      if (!Array.isArray(data)) return [];
      for (const token of data) {
        const symbol = token.symbol || token.tokenSymbol;
        const address = token.address || token.tokenAddress || token.mint;
        const name = token.name || token.tokenName || symbol;
        if (symbol && address) {
          resolutions.push({ symbol: symbol.toUpperCase(), address, name });
        }
      }
    } else if (toolName === 'get_token_information') {
      // Nested token object: result.token.symbol / result.token.mint
      const token = result?.token;
      if (token) {
        const symbol = token.symbol;
        const address = token.mint || token.address;
        const name = token.name || symbol;
        if (symbol && address) {
          resolutions.push({ symbol: symbol.toUpperCase(), address, name });
        }
      }
    } else if (toolName === 'get_wallet_tokens') {
      // Array of wallet token holdings: result.tokens[]
      const tokens = result?.tokens;
      if (Array.isArray(tokens)) {
        for (const token of tokens) {
          const symbol = token.symbol || token.tokenSymbol;
          const address = token.address || token.tokenAddress || token.mint;
          const name = token.name || token.tokenName || symbol;
          if (symbol && address) {
            resolutions.push({ symbol: symbol.toUpperCase(), address, name });
          }
        }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return resolutions;
}

function deleteSessionCache(sessionId) {
  cache.delete(sessionId);
}

module.exports = {
  cacheResolution,
  getKnownAddresses,
  formatKnownAddressesContext,
  extractResolutions,
  deleteSessionCache,
};
