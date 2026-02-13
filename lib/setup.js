const readline = require('readline');
const { saveSettings, MODEL_LISTS } = require('./settings');
const { hashPassword } = require('../middleware/auth');

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bgCyan: '\x1b[46m\x1b[30m',
};

function print(msg = '') { process.stdout.write(msg + '\n'); }

function banner(lines, color = c.cyan) {
  const maxLen = Math.max(...lines.map(l => l.length));
  const border = color + '+' + '-'.repeat(maxLen + 2) + '+' + c.reset;
  print(border);
  for (const line of lines) {
    print(color + '| ' + c.reset + line.padEnd(maxLen) + color + ' |' + c.reset);
  }
  print(border);
}

async function runTerminalSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt, defaultVal) => new Promise((resolve) => {
    const suffix = defaultVal ? ` ${c.dim}(${defaultVal})${c.reset}` : '';
    rl.question(`${c.cyan}?${c.reset} ${prompt}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || '');
    });
  });

  const askPassword = (prompt) => new Promise((resolve) => {
    process.stdout.write(`${c.cyan}?${c.reset} ${prompt}: `);

    // Pause readline to take over stdin
    rl.pause();
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const onData = (ch) => {
      const code = ch.charCodeAt(0);
      if (ch === '\r' || ch === '\n') {
        // Enter
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        rl.resume();
        resolve(password);
      } else if (code === 127 || code === 8) {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (code === 3) {
        // Ctrl+C
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        process.stdout.write('\n');
        rl.close();
        process.exit(0);
      } else if (code >= 32) {
        password += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });

  try {
    print();
    banner([
      `${c.bold}Nook Agent Setup${c.reset}`,
      '',
      'Configure your AI assistant for Solana data.',
      'This will create agent/data/settings.json.',
    ]);
    print();

    // 1. Provider
    print(`${c.bold}LLM Provider${c.reset}`);
    print(`  ${c.cyan}1${c.reset} OpenAI`);
    print(`  ${c.cyan}2${c.reset} Anthropic`);
    const providerChoice = await ask('Choose provider', '1');
    const provider = providerChoice === '2' ? 'anthropic' : 'openai';
    print(`  ${c.dim}Selected: ${provider}${c.reset}`);
    print();

    // 2. API Key
    const keyLabel = provider === 'openai' ? 'OpenAI' : 'Anthropic';
    const apiKey = await askPassword(`${keyLabel} API Key`);
    if (!apiKey) {
      print(`${c.red}API key is required.${c.reset}`);
      rl.close();
      return;
    }
    print(`  ${c.dim}Key: ${apiKey.slice(0, 5)}...${apiKey.slice(-4)}${c.reset}`);
    print();

    // 3. Model selection
    const models = MODEL_LISTS[provider];
    print(`${c.bold}Model${c.reset}`);
    models.forEach((m, i) => {
      const marker = i === 0 ? ' (default)' : '';
      print(`  ${c.cyan}${i + 1}${c.reset} ${m}${c.dim}${marker}${c.reset}`);
    });
    print(`  ${c.cyan}${models.length + 1}${c.reset} ${c.dim}Custom model ID${c.reset}`);

    const modelChoice = await ask('Choose model', '1');
    let model;
    const modelIdx = parseInt(modelChoice, 10) - 1;
    if (modelIdx >= 0 && modelIdx < models.length) {
      model = models[modelIdx];
    } else if (parseInt(modelChoice, 10) === models.length + 1) {
      model = await ask('Enter custom model ID');
      if (!model) model = models[0];
    } else {
      model = models[0];
    }
    print(`  ${c.dim}Selected: ${model}${c.reset}`);
    print();

    // 4. Test LLM connection
    print(`${c.bold}Testing LLM connection...${c.reset}`);
    let llmOk = false;
    try {
      if (provider === 'openai') {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey });
        await client.models.retrieve(model);
        llmOk = true;
      } else {
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        await client.messages.create({
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        });
        llmOk = true;
      }
    } catch (err) {
      const msg = err.message || String(err);
      print(`  ${c.red}Connection failed: ${msg.slice(0, 120)}${c.reset}`);
    }

    if (llmOk) {
      print(`  ${c.green}Connected successfully.${c.reset}`);
    } else {
      const cont = await ask('Continue anyway? (y/n)', 'y');
      if (cont.toLowerCase() !== 'y') {
        rl.close();
        return;
      }
    }
    print();

    // 5. Nook API URL
    const nookApiUrl = await ask('Nook API URL', 'https://api.nookbot.io');
    print();

    // 6. Nook API Key
    const nookApiKey = await ask('Nook API Key');
    if (!nookApiKey) {
      print(`${c.red}Nook API key is required.${c.reset}`);
      rl.close();
      return;
    }
    print();

    // 7. Test Nook connection
    print(`${c.bold}Testing Nook API connection...${c.reset}`);
    let nookOk = false;
    try {
      const resp = await fetch(`${nookApiUrl}/api/endpoints`, {
        headers: { 'x-api-key': nookApiKey },
      });
      if (resp.ok) {
        const data = await resp.json();
        const count = Array.isArray(data) ? data.length : Object.keys(data).length;
        print(`  ${c.green}Connected. ${count} endpoints available.${c.reset}`);
        nookOk = true;
      } else {
        print(`  ${c.red}HTTP ${resp.status}: ${resp.statusText}${c.reset}`);
      }
    } catch (err) {
      print(`  ${c.red}Connection failed: ${err.message || err}${c.reset}`);
    }

    if (!nookOk) {
      const cont = await ask('Continue anyway? (y/n)', 'y');
      if (cont.toLowerCase() !== 'y') {
        rl.close();
        return;
      }
    }
    print();

    // 8. Password
    let password;
    while (true) {
      password = await askPassword('Agent password (min 4 chars)');
      if (password.length < 4) {
        print(`  ${c.red}Password must be at least 4 characters.${c.reset}`);
        continue;
      }
      const confirm = await askPassword('Confirm password');
      if (password !== confirm) {
        print(`  ${c.red}Passwords do not match. Try again.${c.reset}`);
        continue;
      }
      break;
    }
    print();

    // 9. Save
    const toSave = {
      provider,
      nookApiUrl,
      nookApiKey,
      password: hashPassword(password),
    };
    if (provider === 'openai') {
      toSave.openaiApiKey = apiKey;
      toSave.openaiModel = model;
    } else {
      toSave.anthropicApiKey = apiKey;
      toSave.anthropicModel = model;
    }

    saveSettings(toSave);

    // 10. Success
    print();
    banner([
      `${c.bold}${c.green}Setup complete!${c.reset}`,
      '',
      `Provider:  ${provider} (${model})`,
      `Nook API:  ${nookApiUrl}`,
      '',
      `Open ${c.bold}http://localhost:3001${c.reset} in your browser to start chatting.`,
      `Log in with the password you just set.`,
    ], c.green);
    print();

    rl.close();
  } catch (err) {
    rl.close();
    throw err;
  }
}

module.exports = { runTerminalSetup };
