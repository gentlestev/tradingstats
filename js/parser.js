/* ══ TradingStats — Trade Parsers ══ */

// ─── MT5 HTML trade history parser (robust, multi-format) ───────────────────
function parseMT5Html(html) {
  html = html.replace(/\x00/g, '');

  function clean(s) {
    return s.replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ').replace(/\u202f/g, ' ').trim();
  }
  function cleanNum(s) {
    const n = parseFloat((s || '').replace(/[\s,\u00a0]/g, '').replace(/^--$/, '0'));
    return isNaN(n) ? 0 : n;
  }
  function fixDate(s) {
    if (!s) return '';
    // Handle YYYY.MM.DD HH:MM or YYYY-MM-DD or DD.MM.YYYY etc.
    s = s.trim().slice(0, 10);
    // YYYY.MM.DD → YYYY-MM-DD
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(s)) return s.replace(/\./g, '-');
    // YYYY-MM-DD already good
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // DD.MM.YYYY → YYYY-MM-DD
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
      const [d, m, y] = s.split('.');
      return `${y}-${m}-${d}`;
    }
    return s.replace(/\./g, '-');
  }
  function isDateCell(s) {
    return /^\d{4}[.\-]\d{2}[.\-]\d{2}/.test(s) || /^\d{2}[.\-]\d{2}[.\-]\d{4}/.test(s);
  }

  const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const trades = [];

  // ── Strategy: scan every row, detect column layout dynamically ──
  // First pass: find a header row to understand column positions
  let colMap = null;

  for (const row of rowMatches) {
    const rawCells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cells = rawCells.map(c => clean(c).toLowerCase());

    // Detect header row (contains "symbol" or "item" and "type" and "profit")
    const hasSymbol = cells.some(c => c === 'symbol' || c === 'item');
    const hasType   = cells.some(c => c === 'type');
    const hasProfit = cells.some(c => c === 'profit' || c === 'p&l');

    if (hasSymbol && hasType && hasProfit) {
      colMap = {};
      cells.forEach((c, i) => {
        if (c === 'time' && colMap.openTime === undefined) colMap.openTime = i;
        else if (c === 'time' && colMap.openTime !== undefined) colMap.closeTime = i;
        if (c === 'symbol' || c === 'item') colMap.symbol = i;
        if (c === 'type') colMap.type = i;
        if (c === 'volume' || c === 'lots') colMap.volume = i;
        if (c === 'price' && colMap.openPrice === undefined) colMap.openPrice = i;
        else if (c === 'price' && colMap.openPrice !== undefined) colMap.closePrice = i;
        if (c === 'profit' || c === 'p&l') colMap.profit = i;
        if (c === 's/l' || c === 'sl') colMap.sl = i;
        if (c === 't/p' || c === 'tp') colMap.tp = i;
        if (c === 'commission') colMap.commission = i;
        if (c === 'swap') colMap.swap = i;
      });
      // Fallback: find "open time" and "close time" compound headers
      cells.forEach((c, i) => {
        if (c === 'open time') colMap.openTime = i;
        if (c === 'close time') colMap.closeTime = i;
        if (c === 'open price') colMap.openPrice = i;
        if (c === 'close price') colMap.closePrice = i;
      });
      continue;
    }
  }

  // ── Second pass: extract data rows using colMap if found ──
  if (colMap && colMap.symbol !== undefined && colMap.profit !== undefined) {
    for (const row of rowMatches) {
      const rawCells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      const cells = rawCells.map(c => clean(c));
      if (cells.length < 4) continue;

      const dateCell = cells[colMap.openTime !== undefined ? colMap.openTime : 0] || '';
      if (!isDateCell(dateCell)) continue;

      const dirRaw = (cells[colMap.type] || '').toLowerCase().trim();
      // Skip balance/deposit/credit rows
      if (['balance', 'deposit', 'withdrawal', 'credit', 'correction'].some(k => dirRaw.includes(k))) continue;
      // Only keep buy/sell
      if (!dirRaw.includes('buy') && !dirRaw.includes('sell')) continue;

      const dir = dirRaw.includes('sell') ? 'Sell' : 'Buy';
      const inst = cells[colMap.symbol] || 'Unknown';
      const entryPrice = colMap.openPrice !== undefined ? cleanNum(cells[colMap.openPrice]) : 0;
      const exitPrice  = colMap.closePrice !== undefined ? cleanNum(cells[colMap.closePrice]) : 0;
      const pnl        = cleanNum(cells[colMap.profit]);

      trades.push({
        date: fixDate(dateCell),
        instrument: inst,
        direction: dir,
        entry_price: entryPrice,
        exit_price: exitPrice,
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }
    if (trades.length > 0) return trades;
  }

  // ── Fallback: positional detection (legacy MT5 formats) ──
  const fmt_a = [], fmt_b = [];

  for (const row of rowMatches) {
    const rawCells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cells = rawCells.map(c => clean(c));
    const n = cells.length;

    if (!cells[0] || !isDateCell(cells[0])) continue;

    // ── Format A: standard MT5 closed deals (14 cols) ──
    // [0]openTime [1]position [2]symbol [3]type [4]volume [5]price [6]... [7]s/l [8]t/p [9]closeTime [10]closePrice [11]commission [12]swap [13]profit
    if (n === 14) {
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') continue;
      const entry = cleanNum(cells[5]) || cleanNum(cells[6]);
      if (!entry) continue;
      const pnl = cleanNum(cells[13]);
      fmt_a.push({
        date: fixDate(cells[0]),
        instrument: cells[2] || 'Unknown',
        direction: dir.charAt(0).toUpperCase() + dir.slice(1),
        entry_price: entry,
        exit_price: cleanNum(cells[10]),
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }

    // ── Format A2: 13 cols (some FTMO variants omit one col) ──
    else if (n === 13) {
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') continue;
      const entry = cleanNum(cells[5]) || cleanNum(cells[4]);
      if (!entry) continue;
      const pnl = cleanNum(cells[12]);
      fmt_a.push({
        date: fixDate(cells[0]),
        instrument: cells[2] || 'Unknown',
        direction: dir.charAt(0).toUpperCase() + dir.slice(1),
        entry_price: entry,
        exit_price: cleanNum(cells[9]),
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }

    // ── Format B: MT5 "Positions" style (15 cols) ──
    // [0]time [1]position [2]symbol [3]type [4]in/out [5]volume [6]price [7]order [8]... [9]s/l [10]t/p [11]... [12]profit [13]balance [14]comment
    else if (n === 15) {
      const inout = (cells[4] || '').toLowerCase().trim();
      if (inout !== 'out' && inout !== 'in') continue;
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') continue;
      const pnl = cleanNum(cells[12]);
      fmt_b.push({
        date: fixDate(cells[0]),
        instrument: cells[2] || 'Unknown',
        direction: dir === 'sell' ? 'Sell' : 'Buy', // fixed: was swapped
        entry_price: cleanNum(cells[6]),
        exit_price: cleanNum(cells[6]),
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }

    // ── Format C: The5ers / some FTMO variants (12 cols) ──
    else if (n === 12) {
      const dir = cells[2].toLowerCase().trim();
      if (!dir.includes('buy') && !dir.includes('sell')) continue;
      const pnl = cleanNum(cells[11]);
      fmt_a.push({
        date: fixDate(cells[0]),
        instrument: cells[1] || 'Unknown',
        direction: dir.includes('sell') ? 'Sell' : 'Buy',
        entry_price: cleanNum(cells[4]),
        exit_price: cleanNum(cells[8]),
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }

    // ── Format D: 16 cols (some The5ers extended reports) ──
    else if (n === 16) {
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') continue;
      const entry = cleanNum(cells[6]);
      if (!entry) continue;
      const pnl = cleanNum(cells[14]);
      fmt_a.push({
        date: fixDate(cells[0]),
        instrument: cells[2] || 'Unknown',
        direction: dir.charAt(0).toUpperCase() + dir.slice(1),
        entry_price: entry,
        exit_price: cleanNum(cells[11]),
        profit_loss: pnl,
        result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even'
      });
    }
  }

  // Return whichever fallback format found more trades
  const fallback = fmt_a.length >= fmt_b.length ? fmt_a : fmt_b;
  return fallback.filter(t => t.instrument && t.instrument !== 'Unknown' || t.profit_loss !== 0);
}

// ─── CSV text parser ──────────────────────────────────────────────────────────
function parseCSVText(text) {
  const lines = text.split('\n').map(l => l.replace(/\r/, '')).filter(l => l.trim());
  if (!lines.length) return [];
  const trades = [];
  let headerIdx = 0, headers = [];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const row = lines[i].split(',').map(s => s.trim().replace(/"/g, '').toLowerCase());
    if (row.some(h => ['date', 'time', 'symbol', 'instrument', 'profit', 'pnl'].includes(h))) {
      headers = row; headerIdx = i; break;
    }
  }
  const col = (names) => { for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; } return -1; };
  const iDate = col(['date', 'open time', 'opentime', 'time', 'close time']);
  const iInst = col(['symbol', 'instrument', 'asset', 'market']);
  const iDir  = col(['type', 'direction', 'side', 'action']);
  const iEntry = col(['open', 'entry', 'open price', 'openprice']);
  const iExit  = col(['close', 'exit', 'close price', 'closeprice']);
  const iPnl   = col(['profit', 'p&l', 'pnl', 'net profit', 'netprofit']);
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim().replace(/"/g, ''));
    if (cols.length < 3) continue;
    const rawDate = iDate >= 0 ? cols[iDate] : cols[0];
    const inst    = (iInst >= 0 ? cols[iInst] : cols[1]) || 'Unknown';
    if (!inst.trim()) continue;
    const dirRaw = (iDir >= 0 ? cols[iDir] : cols[2]) || '';
    const entry  = parseFloat(iEntry >= 0 ? cols[iEntry] : cols[3]) || 0;
    const exit_  = parseFloat(iExit  >= 0 ? cols[iExit]  : cols[4]) || 0;
    const pnl    = parseFloat(iPnl   >= 0 ? cols[iPnl]   : (cols[5] || cols[4])) || 0;
    const date   = rawDate ? rawDate.slice(0, 10).replace(/[./]/g, '-') : '';
    const dir    = dirRaw.toLowerCase().includes('sell') ? 'Sell' : 'Buy';
    trades.push({ date, instrument: inst, direction: dir, entry_price: entry, exit_price: exit_, profit_loss: pnl, result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even' });
  }
  return trades;
}

// ─── XML parser ───────────────────────────────────────────────────────────────
function parseXMLText(text) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const trades = [];
    const rows = [...doc.querySelectorAll('TradeRecord,Deal,Order,Row,row,trade,Trade')];
    rows.forEach(row => {
      const get = (tags) => {
        for (const t of tags.split(',')) {
          const el = row.querySelector(t) || row.getAttribute(t.trim());
          if (el) return (el.textContent || el).trim();
        }
        return '';
      };
      const dateRaw = get('OpenTime,CloseTime,Date,date,Time');
      const date    = dateRaw ? dateRaw.slice(0, 10).replace(/[./]/g, '-') : '';
      const inst    = get('Symbol,symbol,Instrument,instrument');
      const dir     = get('Type,Direction,direction,Side,type');
      const entry   = parseFloat(get('OpenPrice,open_price,EntryPrice,entry,Open') || 0);
      const exit_   = parseFloat(get('ClosePrice,close_price,ExitPrice,exit,Close') || 0);
      const pnl     = parseFloat(get('Profit,profit,PnL,pnl,NetProfit') || 0);
      if (!inst || !date) return;
      trades.push({ date, instrument: inst, direction: dir.toLowerCase().includes('sell') ? 'Sell' : 'Buy', entry_price: entry, exit_price: exit_, profit_loss: pnl, result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even' });
    });
    return trades;
  } catch (e) { return []; }
}

// ─── Parse any file ───────────────────────────────────────────────────────────
async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let html = '';
      if ((bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF))
        html = new TextDecoder('utf-16').decode(arrayBuf);
      else
        html = new TextDecoder('utf-8').decode(arrayBuf);
      html = html.replace(/\x00/g, '');
      return parseMT5Html(html);
    } catch (e) { showToast('Could not read HTML: ' + e.message, 'error'); return []; }
  }
  if (name.endsWith('.xml')) {
    const text = await file.text();
    return parseXMLText(text);
  }
  if (name.endsWith('.pdf')) {
    if (typeof pdfjsLib === 'undefined') return [];
    try {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      let fullText = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(i => i.str).join(' ') + '\n';
      }
      return parseCSVText(fullText);
    } catch (e) { return []; }
  }
  // CSV / XLS / TSV
  const text = await file.text();
  return parseCSVText(text);
}

// ─── Image to base64 (with resize) ───────────────────────────────────────────
async function fileToBase64Safe(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve({ base64: reader.result.split(',')[1], mimeType: 'image/jpeg' });
      img.onload = () => {
        const MAX = 1600;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── AI screenshot → trades (Anthropic API) ──────────────────────────────────
async function parseScreenshots(files, onProgress) {
  const ANTHROPIC_KEY = localStorage.getItem('anthropic_key') || '';
  const valid = Array.from(files).filter(f => /\.(jpg|jpeg|png|tiff?|heic|heif)$/i.test(f.name));
  if (!valid.length) return [];
  const results = [];
  let done = 0;
  await Promise.allSettled(valid.map(async (file, i) => {
    onProgress && onProgress(i, file.name, 'processing');
    try {
      const { base64, mimeType } = await fileToBase64Safe(file);
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: 'Extract ALL trade rows from this trading platform screenshot. Return ONLY a raw JSON array. Each object: date (YYYY-MM-DD), instrument (string), direction ("Buy" or "Sell"), entry_price (number), exit_price (number), profit_loss (number, negative for losses), result ("Win", "Loss", or "Break Even"). Return [] if no trades found.' }
          ]}]
        })
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const text = data.content?.[0]?.text || '';
      const match = text.replace(/```json|```/g, '').trim().match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        results.push(...parsed.map(t => ({ ...t, user_id: currentUser?.id })));
        onProgress && onProgress(i, file.name, 'done', parsed.length);
      } else {
        onProgress && onProgress(i, file.name, 'no-trades');
      }
    } catch (e) {
      onProgress && onProgress(i, file.name, 'error', 0, e.message);
    }
    done++;
  }));
  return results;
}

// ─── Paste → trades (via worker) ─────────────────────────────────────────────
async function parsePastedText(text) {
  try {
    const resp = await fetch('https://empty-tree-0b19.nwaogalanyapaulinus.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await resp.json();
    const raw = data.response || data.content?.[0]?.text || '[]';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean).map(t => ({ ...t, user_id: currentUser?.id }));
  } catch (e) { return []; }
}

// ─── Save trades to Supabase (with dedup) ────────────────────────────────────
async function saveTradesToDB(trades, firmName) {
  if (!trades.length || !currentUser) return { saved: 0, dupes: 0 };
  const { data: existing } = await sb.from('trades').select('date,instrument,direction,profit_loss').eq('user_id', currentUser.id);
  const existingKeys = new Set((existing || []).map(t => tradeKey(t)));
  const newTrades = trades.filter(t => !existingKeys.has(tradeKey(t)));
  const dupes = trades.length - newTrades.length;
  if (!newTrades.length) return { saved: 0, dupes };
  const batch = newTrades.map(t => ({
    user_id: currentUser.id,
    account_provider: firmName,
    date: String(t.date || '').trim(),
    instrument: String(t.instrument || 'Unknown').trim(),
    direction: String(t.direction || '—').trim(),
    entry_price: parseFloat(t.entry_price) || 0,
    exit_price: parseFloat(t.exit_price) || 0,
    profit_loss: parseFloat(t.profit_loss) || 0,
    result: String(t.result || '').trim() || ((parseFloat(t.profit_loss) || 0) > 0 ? 'Win' : (parseFloat(t.profit_loss) || 0) < 0 ? 'Loss' : 'Break Even')
  }));
  let saved = 0;
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50);
    const { error } = await sb.from('trades').insert(chunk);
    if (!error) saved += chunk.length;
  }
  return { saved, dupes };
}
