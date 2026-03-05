const MAX_LENGTH = 4096;

// MarkdownV2 special chars that need escaping (outside code blocks)
const SPECIAL_CHARS = /([_*[\]()~`>#+\-=|{}.!\\])/g;

function escapeMarkdownV2(text) {
  return text.replace(SPECIAL_CHARS, '\\$1');
}

function toTelegramMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const result = [];
  let inCodeBlock = false;
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks — don't escape inside them
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Table detection — collect rows, then format as aligned text
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Check if separator row (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        continue; // skip separator
      }
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 0) {
        if (!inTable) inTable = true;
        tableRows.push(cells);
        continue;
      }
    }

    // End of table — flush collected rows
    if (inTable) {
      result.push(formatTable(tableRows));
      tableRows = [];
      inTable = false;
    }

    // Convert headers to bold
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const content = headerMatch[2].replace(/\*\*/g, '');
      result.push(`\n*${escapeMarkdownV2(content)}*\n`);
      continue;
    }

    let processed = line;

    // Extract and preserve links [text](url)
    const links = [];
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      links.push({ label, url });
      return `%%LINK${links.length - 1}%%`;
    });

    // Extract bold (**text**) → placeholder
    const bolds = [];
    processed = processed.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      bolds.push(content);
      return `%%BOLD${bolds.length - 1}%%`;
    });

    // Extract italic (*text* or _text_) → placeholder
    const italics = [];
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, content) => {
      italics.push(content);
      return `%%ITALIC${italics.length - 1}%%`;
    });
    processed = processed.replace(/(?<!_)_([^_]+)_(?!_)/g, (_, content) => {
      italics.push(content);
      return `%%ITALIC${italics.length - 1}%%`;
    });

    // Extract inline code (`text`)
    const codes = [];
    processed = processed.replace(/`([^`]+)`/g, (_, content) => {
      codes.push(content);
      return `%%CODE${codes.length - 1}%%`;
    });

    // Convert unordered list markers
    const listMatch = processed.match(/^(\s*)[-*]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length > 0 ? '  ' : '';
      processed = `${indent}• ${listMatch[2]}`;
    }

    // Escape remaining text
    processed = escapeMarkdownV2(processed);

    // Restore bold
    for (let j = 0; j < bolds.length; j++) {
      processed = processed.replace(`%%BOLD${j}%%`, `*${escapeMarkdownV2(bolds[j])}*`);
    }

    // Restore italic
    for (let j = 0; j < italics.length; j++) {
      processed = processed.replace(`%%ITALIC${j}%%`, `_${escapeMarkdownV2(italics[j])}_`);
    }

    // Restore inline code (no escaping inside code)
    for (let j = 0; j < codes.length; j++) {
      processed = processed.replace(`%%CODE${j}%%`, `\`${codes[j]}\``);
    }

    // Restore links
    for (let j = 0; j < links.length; j++) {
      const { label, url } = links[j];
      processed = processed.replace(`%%LINK${j}%%`, `[${escapeMarkdownV2(label)}](${url})`);
    }

    result.push(processed);
  }

  // Flush any remaining table
  if (inTable && tableRows.length > 0) {
    result.push(formatTable(tableRows));
  }

  // Clean up excessive blank lines
  let output = result.join('\n');
  output = output.replace(/\n{3,}/g, '\n\n');
  return output.trim();
}

function formatTable(rows) {
  if (rows.length === 0) return '';

  // Calculate column widths
  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths = Array(colCount).fill(0);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], row[i].length);
    }
  }

  // Format as monospace block for alignment
  const formatted = rows.map((row, idx) => {
    const cells = row.map((cell, i) => {
      const stripped = cell.replace(/\*\*/g, '');
      return stripped.padEnd(colWidths[i]);
    });
    return cells.join(' | ');
  });

  return '```\n' + formatted.join('\n') + '\n```';
}

function splitMessage(text) {
  if (text.length <= MAX_LENGTH) return [text];

  const messages = [];
  let remaining = text;

  while (remaining.length > MAX_LENGTH) {
    // Try to split at paragraph boundary
    let splitIdx = remaining.lastIndexOf('\n\n', MAX_LENGTH);
    if (splitIdx < MAX_LENGTH * 0.3) {
      // Try single newline
      splitIdx = remaining.lastIndexOf('\n', MAX_LENGTH);
    }
    if (splitIdx < MAX_LENGTH * 0.3) {
      // Try splitting at code block end
      splitIdx = remaining.lastIndexOf('```\n', MAX_LENGTH);
      if (splitIdx > 0) splitIdx += 4;
    }
    if (splitIdx < MAX_LENGTH * 0.3) {
      // Fallback — split at max length
      splitIdx = MAX_LENGTH;
    }

    messages.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  if (remaining) messages.push(remaining);
  return messages;
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toTelegramHTML(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block boundaries
    const cbMatch = line.trimStart().match(/^```(\w*)$/);
    if (cbMatch) {
      if (inCodeBlock) {
        // Close code block
        result.push(`<pre>${escapeHTML(codeLines.join('\n'))}</pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        // Flush table if open
        if (inTable) {
          result.push(formatTableHTML(tableRows));
          tableRows = [];
          inTable = false;
        }
        inCodeBlock = true;
        codeBlockLang = cbMatch[1];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 0) {
        if (!inTable) inTable = true;
        tableRows.push(cells);
        continue;
      }
    }

    if (inTable) {
      result.push(formatTableHTML(tableRows));
      tableRows = [];
      inTable = false;
    }

    // Headers → bold
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const content = headerMatch[2].replace(/\*\*/g, '');
      result.push(`\n<b>${escapeHTML(content)}</b>\n`);
      continue;
    }

    let processed = line;

    // Links [text](url)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      return `<a href="${url}">${escapeHTML(label)}</a>`;
    });

    // Bold **text**
    processed = processed.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      return `<b>${escapeHTML(content)}</b>`;
    });

    // Italic *text* or _text_
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, content) => {
      return `<i>${escapeHTML(content)}</i>`;
    });
    processed = processed.replace(/(?<!_)_([^_]+)_(?!_)/g, (_, content) => {
      return `<i>${escapeHTML(content)}</i>`;
    });

    // Inline code `text`
    processed = processed.replace(/`([^`]+)`/g, (_, content) => {
      return `<code>${escapeHTML(content)}</code>`;
    });

    // List markers
    const listMatch = processed.match(/^(\s*)[-*]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length > 0 ? '  ' : '';
      processed = `${indent}• ${listMatch[2]}`;
    }

    // Escape any remaining bare HTML-special chars that weren't already handled
    // (only & < > outside of tags we already created)
    result.push(processed);
  }

  // Flush remaining code block
  if (inCodeBlock && codeLines.length > 0) {
    result.push(`<pre>${escapeHTML(codeLines.join('\n'))}</pre>`);
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    result.push(formatTableHTML(tableRows));
  }

  let output = result.join('\n');
  output = output.replace(/\n{3,}/g, '\n\n');
  return output.trim();
}

function formatTableHTML(rows) {
  if (rows.length === 0) return '';

  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths = Array(colCount).fill(0);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], row[i].length);
    }
  }

  const formatted = rows.map((row) => {
    const cells = row.map((cell, i) => {
      const stripped = cell.replace(/\*\*/g, '');
      return stripped.padEnd(colWidths[i]);
    });
    return cells.join(' | ');
  });

  return '<pre>' + escapeHTML(formatted.join('\n')) + '</pre>';
}

function parseFollowUps(content) {
  if (!content) return { text: content, suggestions: [] };

  const regex = /```suggestions\s*\n(\[[\s\S]*?\])\s*\n```\s*$/;
  const match = content.match(regex);

  if (!match) return { text: content, suggestions: [] };

  try {
    const suggestions = JSON.parse(match[1]);
    const text = content.slice(0, match.index).trimEnd();
    return { text, suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 3) : [] };
  } catch {
    return { text: content, suggestions: [] };
  }
}

module.exports = { toTelegramMarkdown, toTelegramHTML, splitMessage, parseFollowUps };
