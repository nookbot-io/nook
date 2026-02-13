const STRIP_FIELDS = new Set(['image', 'imageUri', 'uri', 'icon', 'logo', 'headerImage', 'openGraphImage']);

function stripUrls(obj) {
  if (Array.isArray(obj)) return obj.map(stripUrls);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (STRIP_FIELDS.has(k) && typeof v === 'string') continue;
      out[k] = stripUrls(v);
    }
    return out;
  }
  return obj;
}

// Detect if an array looks like token results (has marketCap/price fields)
function isTokenArray(arr) {
  if (!arr.length) return false;
  const sample = arr[0];
  return sample && typeof sample === 'object' &&
    ('marketCap' in sample || 'marketCapUsd' in sample || 'priceUsd' in sample);
}

// Detect if an array looks like holder results (has wallet + percentage)
function isHolderArray(arr) {
  if (!arr.length) return false;
  const sample = arr[0];
  return sample && typeof sample === 'object' &&
    'wallet' in sample && 'percentage' in sample;
}

// Detect if an array looks like wallet token results
function isWalletTokenArray(arr) {
  if (!arr.length) return false;
  const sample = arr[0];
  return sample && typeof sample === 'object' &&
    'value' in sample && ('balance' in sample || 'address' in sample);
}

// Compute aggregate stats for token arrays
function computeAggregateStats(items) {
  const stats = {
    total: items.length,
    gainers: 0,
    losers: 0,
    flat: 0,
    mcapRange: { min: Infinity, max: -Infinity },
    totalVolume24h: 0,
    avgHolders: 0,
  };

  let holdersSum = 0;
  let holdersCount = 0;

  for (const item of items) {
    // Price change classification (use 24h if available)
    const events = item.events || {};
    const pc24h = events['24h']?.priceChangePercentage
      ?? events['24h_price_change_percentage']
      ?? null;
    if (pc24h !== null && pc24h !== undefined) {
      if (pc24h > 1) stats.gainers++;
      else if (pc24h < -1) stats.losers++;
      else stats.flat++;
    }

    // Market cap range
    const mcap = item.marketCap ?? item.marketCapUsd ?? 0;
    if (mcap > 0) {
      stats.mcapRange.min = Math.min(stats.mcapRange.min, mcap);
      stats.mcapRange.max = Math.max(stats.mcapRange.max, mcap);
    }

    // Volume
    const vol = item.volume_24h ?? item.volume?.['24h'] ?? 0;
    stats.totalVolume24h += vol;

    // Holders
    const h = item.holders ?? 0;
    if (h > 0) {
      holdersSum += h;
      holdersCount++;
    }
  }

  stats.avgHolders = holdersCount ? Math.round(holdersSum / holdersCount) : 0;
  if (stats.mcapRange.min === Infinity) stats.mcapRange = null;
  else {
    stats.mcapRange.min = Math.round(stats.mcapRange.min);
    stats.mcapRange.max = Math.round(stats.mcapRange.max);
  }
  stats.totalVolume24h = Math.round(stats.totalVolume24h);

  return stats;
}

// Get type-aware array limit
function getArrayLimit(arr) {
  if (isHolderArray(arr)) return 100;
  if (isWalletTokenArray(arr)) return 30;
  return 50;
}

// Prepare array for truncation (sort wallet tokens by value)
function prepareArray(arr) {
  if (isWalletTokenArray(arr)) {
    return [...arr].sort((a, b) => (b.value || 0) - (a.value || 0));
  }
  return arr;
}

function trimResponse(data, maxChars) {
  if (maxChars === undefined) {
    try {
      const { loadSettings } = require('./settings');
      maxChars = loadSettings().trimmerMaxChars;
    } catch {
      maxChars = 64000;
    }
  }
  let str = JSON.stringify(data);
  if (str.length <= maxChars) return data;

  // Strip image/url fields the LLM doesn't need
  const stripped = stripUrls(data);
  str = JSON.stringify(stripped);
  if (str.length <= maxChars) return stripped;

  // If array, truncate with type-aware limits
  if (Array.isArray(stripped)) {
    const limit = getArrayLimit(stripped);
    const items = prepareArray(stripped);

    if (stripped.length > limit) {
      const truncated = items.slice(0, limit);
      const meta = { _note: `Showing ${limit} of ${stripped.length} results` };
      if (isTokenArray(stripped)) {
        meta._aggregateStats = computeAggregateStats(stripped);
      }
      truncated.push(meta);
      str = JSON.stringify(truncated);
      if (str.length <= maxChars) return truncated;
    }
  }

  // If object with array values, truncate those
  if (stripped && typeof stripped === 'object' && !Array.isArray(stripped)) {
    const out = {};
    for (const [k, v] of Object.entries(stripped)) {
      if (Array.isArray(v)) {
        const limit = getArrayLimit(v);
        const items = prepareArray(v);

        if (v.length > limit) {
          out[k] = items.slice(0, limit);
          const meta = { _note: `Showing ${limit} of ${v.length} items` };
          if (isTokenArray(v)) {
            meta._aggregateStats = computeAggregateStats(v);
          }
          out[k].push(meta);
        } else {
          out[k] = items;
        }
      } else {
        out[k] = v;
      }
    }
    str = JSON.stringify(out);
    if (str.length <= maxChars) return out;
  }

  // Fallback: string truncation (should rarely hit with 128K limit)
  if (str.length > maxChars) {
    return str.slice(0, maxChars) + `\n... [truncated, total ${str.length} chars]`;
  }

  return stripped;
}

module.exports = { trimResponse };
