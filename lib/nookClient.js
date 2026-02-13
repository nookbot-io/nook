const axios = require('axios');
const { getToolDefaults, getExtraQueryParams } = require('./toolRegistry');

function createClient(settings) {
  return axios.create({
    baseURL: settings.nookApiUrl || 'https://api.nookbot.io',
    headers: { 'x-api-key': settings.nookApiKey },
    timeout: 30000,
  });
}

async function callTool(client, endpoint, args) {
  // Apply smart defaults (defaults first, then LLM args override)
  const toolName = endpoint.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const defaults = getToolDefaults()[toolName];
  const mergedArgs = defaults ? { ...defaults, ...args } : { ...args };

  // Build path by replacing {param} placeholders
  let urlPath = endpoint.path;
  const pathParamNames = new Set();
  const queryParams = {};

  for (const p of endpoint.pathParams || []) {
    pathParamNames.add(p.name);
    const val = mergedArgs[p.name];
    if (val === undefined || val === null || val === '') {
      return { error: true, status: 400, message: `Missing required parameter: ${p.name}` };
    }
    urlPath = urlPath.replace(`{${p.name}}`, encodeURIComponent(val));
  }

  // Build set of all known query param names (endpoints.js + extras)
  const knownQueryParams = new Set();
  for (const p of endpoint.queryParams || []) {
    knownQueryParams.add(p.name);
  }
  const extras = getExtraQueryParams()[toolName] || [];
  for (const p of extras) {
    knownQueryParams.add(p.name);
  }

  // Check required query params
  for (const p of endpoint.queryParams || []) {
    if (p.required && (mergedArgs[p.name] === undefined || mergedArgs[p.name] === null || mergedArgs[p.name] === '')) {
      return { error: true, status: 400, message: `Missing required parameter: ${p.name}` };
    }
  }

  // Pass through ALL args that aren't path params and are known query params
  for (const paramName of knownQueryParams) {
    const val = mergedArgs[paramName];
    if (val !== undefined && val !== '') {
      queryParams[paramName] = val;
    }
  }

  const t0 = Date.now();
  try {
    const res = await client.get(`/api${urlPath}`, { params: queryParams });
    return { data: res.data, status: res.status, duration: Date.now() - t0 };
  } catch (err) {
    const duration = Date.now() - t0;
    if (err.response) {
      const status = err.response.status;
      let message;
      if (status === 403) {
        message = "Your API tier doesn't have access to this endpoint. Upgrade to Pro or Enterprise.";
      } else if (status === 429) {
        message = 'Rate limited by the Nook API. Wait a moment before retrying.';
      } else if (status === 502 || status === 503) {
        message = 'Upstream API is temporarily unavailable. Try again shortly.';
      } else {
        message = err.response.data?.error || `API returned ${status}`;
      }
      return { error: true, status, message, duration };
    }
    let message;
    if (err.code === 'ECONNREFUSED') {
      message = "Nook API is not reachable. Check that nookApiUrl is correct in settings.";
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      message = 'Nook API took too long to respond. The upstream API may be slow.';
    } else if (err.code === 'ENOTFOUND') {
      message = 'Could not resolve the Nook API URL. Check nookApiUrl in settings.';
    } else {
      message = err.message;
    }
    return { error: true, status: 0, message, duration };
  }
}

module.exports = { createClient, callTool };
