/* ══ TradingStats — Trade Parsers ══ */

// MT5 HTML trade history parser
function parseMT5Html(html) {
  const trades = [];
  const rowMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  function clean(s) { return s.replace(/<[^>]+>/g,'').replace(/\u00a0/g,' ').replace(/\u202f/g,' ').trim(); }
  function cleanNum(s) { const n = parseFloat((s||'').replace(/[\s,]/g,'')); return isNaN(n) ? 0 : n; }
  const fmt_a = [], fmt_b = [];
  rowMatches.forEach(row => {
    const rawCells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cells = rawCells.map(c => clean(c));
    const n = cells.length;
    if (!cells[0] || !/^\d{4}\.\d{2}\.\d{2}/.test(cells[0])) return;
    if (n === 14) {
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') return;
      const entry = cleanNum(cells[6]);
      if (!entry) return;
      if (!/^\d{4}\.\d{2}\.\d{2}/.test(cells[9])) return;
      const pnl = cleanNum(cells[13]);
      fmt_a.push({ date: cells[0].slice(0,10).replace(/\./g,'-'), instrument: cells[2]||'Unknown', direction: dir.charAt(0).toUpperCase()+dir.slice(1), entry_price: entry, exit_price: cleanNum(cells[10]), profit_loss: pnl, result: pnl>0?'Win':pnl<0?'Loss':'Break Even' });
    } else if (n === 15 && cells[4] === 'out' && cells[2]) {
      const dir = cells[3].toLowerCase().trim();
      if (dir !== 'buy' && dir !== 'sell') return;
      const pnl = cleanNum(cells[12]);
      const price = cleanNum(cells[6]);
      fmt_b.push({ date: cells[0].slice(0,10).replace(/\./g,'-'), instrument: cells[2]||'Unknown', direction: dir==='sell'?'Buy':'Sell', entry_price: price, exit_price: price, profit_loss: pnl, result: pnl>0?'Win':pnl<0?'Loss':'Break Even' });
    }
  });
  return fmt_a.length > 0 ? fmt_a : fmt_b;
}

// CSV text parser
function parseCSVText(text) {
  const lines = text.split('\n').map(l => l.replace(/\r/,'')).filter(l => l.trim());
  if (!lines.length) return [];
  const trades = [];
  let headerIdx = 0, headers = [];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const row = lines[i].split(',').map(s => s.trim().replace(/"/g,'').toLowerCase());
    if (row.some(h => ['date','time','symbol','instrument','profit','pnl'].includes(h))) { headers = row; headerIdx = i; break; }
  }
  const col = (names) => { for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; } return -1; };
  const iDate = col(['date','open time','opentime','time','close time']), iInst = col(['symbol','instrument','asset','market']);
  const iDir = col(['type','direction','side','action']), iEntry = col(['open','entry','open price','openprice']);
  const iExit = col(['close','exit','close price','closeprice']), iPnl = col(['profit','p&l','pnl','net profit','netprofit']);
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim().replace(/"/g,''));
    if (cols.length < 3) continue;
    const rawDate = iDate >= 0 ? cols[iDate] : cols[0];
    const inst = (iInst >= 0 ? cols[iInst] : cols[1]) || 'Unknown';
    if (!inst.trim()) continue;
    const dirRaw = (iDir >= 0 ? cols[iDir] : cols[2]) || '';
    const entry  = parseFloat(iEntry >= 0 ? cols[iEntry] : cols[3]) || 0;
    const exit_  = parseFloat(iExit  >= 0 ? cols[iExit]  : cols[4]) || 0;
    const pnl    = parseFloat(iPnl   >= 0 ? cols[iPnl]   : (cols[5]||cols[4])) || 0;
    const date = rawDate ? rawDate.slice(0,10).replace(/[./]/g,'-') : '';
    const dir  = dirRaw.toLowerCase().includes('sell') ? 'Sell' : 'Buy';
    trades.push({ date, instrument: inst, direction: dir, entry_price: entry, exit_price: exit_, profit_loss: pnl, result: pnl>0?'Win':pnl<0?'Loss':'Break Even' });
  }
  return trades;
}

// XML parser
function parseXMLText(text) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const trades = [];
    const rows = [...doc.querySelectorAll('TradeRecord,Deal,Order,Row,row,trade,Trade')];
    rows.forEach(row => {
      const get = (tags) => { for (const t of tags.split(',')) { const el = row.querySelector(t) || row.getAttribute(t.trim()); if (el) return (el.textContent||el).trim(); } return ''; };
      const dateRaw = get('OpenTime,CloseTime,Date,date,Time');
      const date = dateRaw ? dateRaw.slice(0,10).replace(/[./]/g,'-') : '';
      const inst = get('Symbol,symbol,Instrument,instrument');
      const dir  = get('Type,Direction,direction,Side,type');
      const entry = parseFloat(get('OpenPrice,open_price,EntryPrice,entry,Open')||0);
      const exit_ = parseFloat(get('ClosePrice,close_price,ExitPrice,exit,Close')||0);
      const pnl   = parseFloat(get('Profit,profit,PnL,pnl,NetProfit')||0);
      if (!inst || !date) return;
      trades.push({ date, instrument: inst, direction: dir.toLowerCase().includes('sell')?'Sell':'Buy', entry_price: entry, exit_price: exit_, profit_loss: pnl, result: pnl>0?'Win':pnl<0?'Loss':'Break Even' });
    });
    return trades;
  } catch(e) { return []; }
}

// Parse any file
async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let html = '';
      if ((bytes[0]===0xFF&&bytes[1]===0xFE)||(bytes[0]===0xFE&&bytes[1]===0xFF)) html = new TextDecoder('utf-16').decode(arrayBuf);
      else html = new TextDecoder('utf-8').decode(arrayBuf);
      html = html.replace(/\x00/g,'');
      return parseMT5Html(html);
    } catch(e) { showToast('Could not read HTML: '+e.message, 'error'); return []; }
  }
  if (name.endsWith('.xml')) {
    const text = await file.text();
    return parseXMLText(text);
  }
  if (name.endsWith('.pdf')) {
    if (typeof pdfjsLib === 'undefined') return [];
    try {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data:arrayBuf}).promise;
      let fullText = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(i => i.str).join(' ') + '\n';
      }
      return parseCSVText(fullText);
    } catch(e) { return []; }
  }
  // CSV / XLS / TSV
  const text = await file.text();
  return parseCSVText(text);
}

// Image to base64 (with resize)
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

// AI screenshot → trades (Anthropic API)
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
        body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 2000, messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: 'Extract ALL trade rows from this trading platform screenshot. Return ONLY a raw JSON array. Each object: date (YYYY-MM-DD), instrument (string), direction ("Buy" or "Sell"), entry_price (number), exit_price (number), profit_loss (number, negative for losses), result ("Win", "Loss", or "Break Even"). Return [] if no trades found.' }
        ]}] })
      });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();
      const text = data.content?.[0]?.text || '';
      const match = text.replace(/```json|```/g,'').trim().match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        results.push(...parsed.map(t => ({ ...t, user_id: currentUser?.id })));
        onProgress && onProgress(i, file.name, 'done', parsed.length);
      } else {
        onProgress && onProgress(i, file.name, 'no-trades');
      }
    } catch(e) {
      onProgress && onProgress(i, file.name, 'error', 0, e.message);
    }
    done++;
  }));
  return results;
}

// Paste → trades (via worker)
async function parsePastedText(text) {
  try {
    const resp = await fetch('https://empty-tree-0b19.nwaogalanyapaulinus.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await resp.json();
    const raw = data.response || data.content?.[0]?.text || '[]';
    const clean = raw.replace(/```json|```/g,'').trim();
    return JSON.parse(clean).map(t => ({ ...t, user_id: currentUser?.id }));
  } catch(e) { return []; }
}

// Save trades to Supabase (with dedup)
async function saveTradesToDB(trades, firmName) {
  if (!trades.length || !currentUser) return { saved: 0, dupes: 0 };
  const { data: existing } = await sb.from('trades').select('date,instrument,direction,profit_loss').eq('user_id', currentUser.id);
  const existingKeys = new Set((existing||[]).map(t => tradeKey(t)));
  const newTrades = trades.filter(t => !existingKeys.has(tradeKey(t)));
  const dupes = trades.length - newTrades.length;
  if (!newTrades.length) return { saved: 0, dupes };
  const batch = newTrades.map(t => ({
    user_id: currentUser.id,
    account_provider: firmName,
    date: String(t.date||'').trim(),
    instrument: String(t.instrument||'Unknown').trim(),
    direction: String(t.direction||'—').trim(),
    entry_price: parseFloat(t.entry_price)||0,
    exit_price: parseFloat(t.exit_price)||0,
    profit_loss: parseFloat(t.profit_loss)||0,
    result: String(t.result||'').trim() || ((parseFloat(t.profit_loss)||0) > 0 ? 'Win' : (parseFloat(t.profit_loss)||0) < 0 ? 'Loss' : 'Break Even')
  }));
  let saved = 0;
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50);
    const { error } = await sb.from('trades').insert(chunk);
    if (!error) saved += chunk.length;
  }
  return { saved, dupes };
}
