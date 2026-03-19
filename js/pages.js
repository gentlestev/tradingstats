/* ══ TradingStats — Page Renderers ══ */

function renderPage(page) {
  const content = document.getElementById('pageContent');
  const titles = { dashboard:'Dashboard', history:'Trade History', upload:'Import Trades', analysis:'Performance', journal:'Journal', calendar:'Calendar', help:'Help' };
  const breadcrumbs = { dashboard:'Overview', history:'Trades › History', upload:'Trades › Import', analysis:'Analytics › Performance', journal:'Analytics › Journal', calendar:'Overview › Calendar', help:'Account › Help' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('breadcrumb').textContent = breadcrumbs[page] || '';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';
  const trades = getTradesForFirm(activeFirm);
  switch(page) {
    case 'dashboard':  renderDashboard(trades); break;
    case 'history':    renderHistory(trades); break;
    case 'upload':     renderUpload(); break;
    case 'analysis':   renderAnalysis(trades); break;
    case 'journal':    renderJournal(); break;
    case 'calendar':   renderCalendar(trades); break;
    case 'help':       renderHelp(); break;
    default:           renderDashboard(trades);
  }
}

// ══ DASHBOARD ══
function renderDashboard(trades) {
  const s = calcStats(trades);
  const score = calcScore(s);
  const sg = scoreGrade(score);
  const c = document.getElementById('pageContent');

  // Starting balance input
  const savedBal = parseFloat(localStorage.getItem('ts_startbal_'+activeFirm)||'0')||0;

  c.innerHTML = `
  <!-- Stats Score Widget + KPI row -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:14px;margin-bottom:18px;align-items:start">
    <!-- Score Card -->
    <div class="chart-card" style="height:100%">
      <div class="chart-card-header">
        <div><div class="chart-card-title">Stats Score</div><div class="chart-card-sub">Overall trading health</div></div>
        <span class="chart-badge cb-${score>=65?'green':score>=40?'blue':'red'}">${sg.grade}</span>
      </div>
      <div class="chart-body" style="display:flex;align-items:center;gap:20px;padding:20px">
        <div class="score-ring-wrap">
          <canvas id="scoreRing" width="110" height="110"></canvas>
          <div class="score-ring-val">${score}<small>/100</small></div>
        </div>
        <div class="score-info">
          <div class="score-label">Grade</div>
          <div class="score-grade" style="color:${sg.color}">${sg.grade}</div>
          <div class="score-desc">${sg.label} · ${trades.length} trades</div>
          <div style="margin-top:10px;font-size:.68rem;color:var(--text-3);font-family:var(--f-mono);line-height:1.8">
            WR: <strong style="color:var(--text)">${fmtPct(s.wr)}</strong><br>
            PF: <strong style="color:var(--text)">${s.pf>=99?'∞':s.pf.toFixed(2)}</strong><br>
            RRR: <strong style="color:var(--text)">${s.rrr.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="widget-grid" style="margin:0">
      <div class="widget ${s.net>=0?'w-green':'w-red'}">
        <div class="widget-label">Net P&L</div>
        <div class="widget-value">${fmtPnlK(s.net)}</div>
        <div class="widget-sub">${activeFirm==='All'?'All firms':'Account'} balance</div>
      </div>
      <div class="widget w-blue">
        <div class="widget-label">Total Trades</div>
        <div class="widget-value">${s.total}</div>
        <div class="widget-sub">${s.wins}W · ${s.losses}L · ${s.be}BE</div>
      </div>
      <div class="widget ${s.wr>=50?'w-green':'w-amber'}">
        <div class="widget-label">Win Rate</div>
        <div class="widget-value">${fmtPct(s.wr)}</div>
        <div class="widget-sub">Target ≥ 50%</div>
      </div>
      <div class="widget ${s.pf>=1.5?'w-green':'w-red'}">
        <div class="widget-label">Profit Factor</div>
        <div class="widget-value">${s.pf>=99?'∞':s.pf.toFixed(2)}</div>
        <div class="widget-sub">Target ≥ 1.5</div>
      </div>
      <div class="widget w-amber">
        <div class="widget-label">Avg RRR</div>
        <div class="widget-value">${s.rrr.toFixed(2)}</div>
        <div class="widget-sub">Risk:Reward ratio</div>
      </div>
      <div class="widget ${s.exp>=0?'w-green':'w-red'}">
        <div class="widget-label">Expectancy</div>
        <div class="widget-value">${fmtPnlK(s.exp)}</div>
        <div class="widget-sub">Per trade avg</div>
      </div>
      <div class="widget w-green">
        <div class="widget-label">Best Trade</div>
        <div class="widget-value">+$${s.best.toFixed(0)}</div>
        <div class="widget-sub">Largest win</div>
      </div>
      <div class="widget ${s.streak>0?'w-green':s.streak<0?'w-red':'w-blue'}">
        <div class="widget-label">Streak</div>
        <div class="widget-value">${s.streak>0?'+':''  }${s.streak}</div>
        <div class="widget-sub">${s.streak>0?'Win streak':s.streak<0?'Loss streak':'No streak'}</div>
      </div>
    </div>
  </div>

  <!-- Starting Balance -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:10px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);flex-wrap:wrap">
    <span style="font-size:.72rem;font-weight:600;color:var(--text-3)">Starting Balance</span>
    <input type="number" id="startBalInput" value="${savedBal||''}" placeholder="e.g. 10000"
      style="width:130px;background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:5px 10px;color:var(--text);font-size:.82rem;outline:none"
      oninput="updateStartBal(this.value)"
      onfocus="this.style.borderColor='var(--brand)'"
      onblur="this.style.borderColor='var(--border)'"/>
    <span style="font-size:.65rem;color:var(--text-4);font-family:var(--f-mono)">Sets equity curve baseline</span>
  </div>

  <!-- Equity curve -->
  <div class="chart-card mb-4">
    <div class="chart-card-header">
      <div><div class="chart-card-title">Equity Curve</div><div class="chart-card-sub">Cumulative P&L over time</div></div>
      <span id="eqValBadge" style="font-family:var(--f-mono);font-size:.82rem;font-weight:700"></span>
    </div>
    <div class="chart-body" style="height:200px"><canvas id="eqChart"></canvas></div>
  </div>

  <!-- 3 small charts -->
  <div class="col-3 mb-6">
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">Daily P&L</div></div>
      <div class="chart-body" style="height:140px"><canvas id="dailyChart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">By Instrument</div></div>
      <div class="chart-body" style="height:140px"><canvas id="instChart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">Monthly P&L</div></div>
      <div class="chart-body" style="height:140px"><canvas id="moChart"></canvas></div>
    </div>
  </div>

  <!-- Insight -->
  ${trades.length ? `<div class="insight-card">
    <strong>${activeFirm} · ${sg.label} (${sg.grade})</strong> &nbsp;·&nbsp;
    Net P&L: <strong style="color:${s.net>=0?'var(--green)':'var(--red)'}">${fmtPnl(s.net)}</strong> &nbsp;·&nbsp;
    Win Rate: <strong>${fmtPct(s.wr)}</strong> &nbsp;·&nbsp;
    Profit Factor: <strong>${s.pf>=99?'∞':s.pf.toFixed(2)}</strong> &nbsp;·&nbsp;
    ${s.streak>0?`🔥 ${s.streak} win streak!`:s.streak<=-3?`⚠ ${Math.abs(s.streak)} loss streak — consider a break`:'Keep journaling to find your edge'}
  </div>` : ''}

  <!-- Recent trades -->
  ${renderTradeTableHTML(trades.slice().reverse().slice(0,8), 'Recent Trades', true)}
  `;

  // Render charts
  setTimeout(() => {
    const bal = parseFloat(localStorage.getItem('ts_startbal_'+activeFirm)||'0')||0;
    renderEquityCurve('eqChart', trades, bal, 'eqValBadge');
    renderDailyChart('dailyChart', trades);
    renderInstrumentChart('instChart', trades);
    renderMonthlyChart('moChart', trades);
    renderScoreRing('scoreRing', score);
  }, 60);
}

function updateStartBal(val) {
  const n = parseFloat(val)||0;
  if (n > 0) localStorage.setItem('ts_startbal_'+activeFirm, n);
  else localStorage.removeItem('ts_startbal_'+activeFirm);
  const trades = getTradesForFirm(activeFirm);
  renderEquityCurve('eqChart', trades, n, 'eqValBadge');
}

// ══ HISTORY ══
function renderHistory(trades) {
  const c = document.getElementById('pageContent');
  const firmOptions = FIRMS.map(f => `<option value="${f}"${activeFirm===f?' selected':''}>${f}</option>`).join('');
  c.innerHTML = `
  <div class="section-header mb-4">
    <div><div class="section-title">Trade History</div><div class="section-sub">${trades.length} total trades</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select class="field-input" style="width:auto;padding:5px 10px;font-size:.75rem" onchange="filterHistoryByFirm(this.value)">
        <option value="All"${activeFirm==='All'?' selected':''}>All Firms</option>
        ${firmOptions}
      </select>
      <button class="btn-sm btn-danger-sm" onclick="deleteFirmTrades('${activeFirm}')">Delete All ${activeFirm}</button>
    </div>
  </div>
  ${renderTradeTableHTML(trades.slice().reverse(), 'All Trades', false, true)}
  `;
}
function filterHistoryByFirm(firm) {
  const btn = document.querySelector(`.acct-pill[onclick*="'${firm}'"]`);
  setFirm(firm, btn);
}

// Trade table HTML builder
function renderTradeTableHTML(trades, title, compact = false, showDelete = false) {
  if (!trades.length) return `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No trades yet</div><div class="empty-sub">Import trades to see your history.</div><button class="btn-primary" onclick="navTo('upload')" style="width:auto;margin:0 auto">Import Trades</button></div>`;
  const rows = trades.slice(0, compact ? 8 : 9999).map(t => {
    const pnl = parseFloat(t.profit_loss||0);
    const badge = t.result==='Win'?'badge-win':t.result==='Loss'?'badge-loss':'badge-be';
    const pc = pnl>=0?'var(--green)':'var(--red)';
    const del = showDelete ? `<td><button class="btn-sm btn-danger-sm" onclick="deleteTrade('${t.id}')" style="padding:3px 7px">✕</button></td>` : '';
    return `<tr>
      <td style="font-family:var(--f-mono);font-size:.7rem;color:var(--text-3)">${t.date}</td>
      ${showDelete?`<td><span style="font-size:.65rem;font-weight:700;font-family:var(--f-mono);color:${FIRM_COLORS[t.account_provider]||'var(--text-3)'}">${t.account_provider||'—'}</span></td>`:''}
      <td style="color:var(--brand-l);font-weight:600">${t.instrument}</td>
      <td><span class="badge ${t.direction==='Buy'?'badge-buy':'badge-sell'}">${t.direction||'—'}</span></td>
      <td style="font-family:var(--f-mono);font-size:.72rem">${t.entry_price?'$'+parseFloat(t.entry_price).toFixed(2):'—'}</td>
      <td style="font-family:var(--f-mono);font-size:.72rem">${t.exit_price?'$'+parseFloat(t.exit_price).toFixed(2):'—'}</td>
      <td style="color:${pc};font-weight:700;font-family:var(--f-mono)">${pnl>=0?'+':''}$${pnl.toFixed(2)}</td>
      <td><span class="badge ${badge}">${t.result}</span></td>
      ${del}
    </tr>`;
  }).join('');
  const headers = `<tr>
    <th>Date</th>${showDelete?'<th>Firm</th>':''}
    <th>Instrument</th><th>Dir</th><th>Entry</th><th>Exit</th><th>P&L</th><th>Result</th>${showDelete?'<th></th>':''}
  </tr>`;
  const more = compact && trades.length > 8 ? `<div style="padding:10px 14px;text-align:center;border-top:1px solid var(--border)"><button class="btn-sm btn-outline-sm" onclick="navTo('history')">View All ${trades.length} Trades →</button></div>` : '';
  return `<div class="table-wrap">
    <div class="table-head"><div class="table-title">${title}</div><div class="table-meta">${trades.slice(0,compact?8:9999).length} trades</div></div>
    <div style="overflow-x:auto"><table class="data-table"><thead>${headers}</thead><tbody>${rows}</tbody></table></div>
    ${more}
  </div>`;
}

// ══ UPLOAD ══
let parsedBatch = { csv: [], img: [], paste: [] };

function renderUpload() {
  const c = document.getElementById('pageContent');
  const firmOpts = FIRMS.map(f => `<option value="${f}">${f}</option>`).join('');
  c.innerHTML = `
  <div class="section-header mb-4">
    <div><div class="section-title">Import Trades</div><div class="section-sub">Upload MT5 reports, CSVs, screenshots or paste data</div></div>
  </div>

  <div class="upload-grid">
    <!-- File Upload -->
    <div class="upload-card">
      <div class="upload-card-head">
        <div class="upload-card-title">📁 File Upload</div>
        <span style="font-size:.65rem;font-family:var(--f-mono);color:var(--text-3)">HTML · CSV · XML · PDF</span>
      </div>
      <div class="upload-body">
        <p style="font-size:.75rem;color:var(--text-3);margin-bottom:12px;line-height:1.6">Upload your MT5 Trade History HTML report or any CSV/XML/PDF export.</p>
        <div class="drop-zone" id="csvDrop" onclick="document.getElementById('csvInput').click()"
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="handleFileDrop(event,'csv')">
          <div class="drop-icon">📂</div>
          <div class="drop-title">Drop files here or click to browse</div>
          <div class="drop-sub">.html .htm .csv .xlsx .xml .pdf</div>
        </div>
        <input type="file" id="csvInput" accept=".csv,.xlsx,.xls,.html,.htm,.pdf,.xml" multiple style="display:none" onchange="handleFileSelect(this.files,'csv')"/>
        <div id="csvPreview" class="preview-wrap">
          <div class="preview-label" id="csvPreviewLabel">Parsing…</div>
          <div class="preview-table" id="csvPreviewTable"></div>
        </div>
        <div id="csvSaveArea" style="display:none;margin-top:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span style="font-size:.72rem;color:var(--text-3)">Save to:</span>
            <select class="field-input" id="csvFirmSel" style="width:auto;padding:5px 10px;font-size:.75rem">${firmOpts}</select>
            <span id="csvDetected" style="display:none;font-size:.65rem;color:var(--amber);font-family:var(--f-mono)"></span>
          </div>
          <button class="btn-sm btn-success-sm" onclick="saveUploadBatch('csv')" style="width:100%;padding:9px">Save Trades</button>
        </div>
      </div>
    </div>

    <!-- Screenshot Upload -->
    <div class="upload-card">
      <div class="upload-card-head">
        <div class="upload-card-title">🖼️ Screenshot Upload</div>
        <span style="font-size:.65rem;padding:2px 8px;border-radius:10px;background:var(--brand-bg);color:var(--brand);font-family:var(--f-mono)">AI</span>
      </div>
      <div class="upload-body">
        <p style="font-size:.75rem;color:var(--text-3);margin-bottom:12px;line-height:1.6">Upload screenshots of your trade history. AI extracts the data automatically.</p>
        <div class="drop-zone" id="imgDrop" onclick="document.getElementById('imgInput').click()"
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="handleFileDrop(event,'img')">
          <div class="drop-icon">🤖</div>
          <div class="drop-title">Drop screenshots or click to browse</div>
          <div class="drop-sub">.jpg .png .tiff .heic</div>
        </div>
        <input type="file" id="imgInput" accept=".jpg,.jpeg,.png,.tiff,.tif,.heic,.heif" multiple style="display:none" onchange="handleFileSelect(this.files,'img')"/>
        <div id="imgProgress" style="display:none;margin-top:12px">
          <div class="prog-wrap">
            <div class="prog-header"><span id="imgProgressLabel">Processing…</span><span id="imgProgressCount">0/0</span></div>
            <div class="prog-bar-bg"><div class="prog-bar-fill" id="imgProgressBar" style="width:0%"></div></div>
          </div>
          <div id="imgFileList" style="margin-top:8px;display:flex;flex-direction:column;gap:3px;max-height:120px;overflow-y:auto"></div>
        </div>
        <div id="imgPreview" class="preview-wrap">
          <div class="preview-label" id="imgPreviewLabel"></div>
          <div class="preview-table" id="imgPreviewTable"></div>
        </div>
        <div id="imgSaveArea" style="display:none;margin-top:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span style="font-size:.72rem;color:var(--text-3)">Save to:</span>
            <select class="field-input" id="imgFirmSel" style="width:auto;padding:5px 10px;font-size:.75rem">${firmOpts}</select>
          </div>
          <button class="btn-sm btn-success-sm" onclick="saveUploadBatch('img')" style="width:100%;padding:9px">Save Trades</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Paste -->
  <div class="upload-card" style="margin-bottom:20px">
    <div class="upload-card-head">
      <div class="upload-card-title">📋 Paste Trade Data</div>
    </div>
    <div class="upload-body">
      <p style="font-size:.75rem;color:var(--text-3);margin-bottom:10px">Paste raw text from any format — AI parses it.</p>
      <textarea class="field-input field-textarea" id="pasteData" placeholder="Paste your trade data here…" style="min-height:100px"></textarea>
      <button class="btn-sm btn-primary-sm" onclick="handlePaste()" style="margin-top:8px">Parse & Preview</button>
      <div id="pastePreview" class="preview-wrap">
        <div class="preview-label" id="pastePreviewLabel"></div>
        <div class="preview-table" id="pastePreviewTable"></div>
      </div>
      <div id="pasteSaveArea" style="display:none;margin-top:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <span style="font-size:.72rem;color:var(--text-3)">Save to:</span>
          <select class="field-input" id="pasteFirmSel" style="width:auto;padding:5px 10px;font-size:.75rem">${firmOpts}</select>
        </div>
        <button class="btn-sm btn-success-sm" onclick="saveUploadBatch('paste')" style="width:100%;padding:9px">Save Trades</button>
      </div>
    </div>
  </div>
  `;
}

async function handleFileDrop(event, type) {
  event.preventDefault();
  document.getElementById(type==='csv'?'csvDrop':'imgDrop').classList.remove('drag-over');
  handleFileSelect(event.dataTransfer.files, type);
}

async function handleFileSelect(files, type) {
  if (!files || !files.length) return;
  if (type === 'img') { await processImgFiles(files); return; }
  const allTrades2 = [];
  for (const file of Array.from(files)) {
    const t = await parseFile(file);
    allTrades2.push(...t.map(tr => ({ ...tr, user_id: currentUser?.id })));
  }
  parsedBatch.csv = allTrades2;
  showPreview('csv', allTrades2);
}

async function processImgFiles(files) {
  parsedBatch.img = [];
  const fileArr = Array.from(files).filter(f => /\.(jpg|jpeg|png|tiff?|heic|heif)$/i.test(f.name));
  if (!fileArr.length) { showToast('Only JPG, PNG, TIFF, HEIC supported.', 'error'); return; }
  const prog = document.getElementById('imgProgress');
  const label = document.getElementById('imgProgressLabel');
  const count = document.getElementById('imgProgressCount');
  const bar = document.getElementById('imgProgressBar');
  const list = document.getElementById('imgFileList');
  prog.style.display = 'block';
  label.textContent = 'Processing ' + fileArr.length + ' image' + (fileArr.length>1?'s':'') + '…';
  count.textContent = '0/' + fileArr.length;
  bar.style.width = '0%';
  list.innerHTML = '';
  fileArr.forEach((f, i) => {
    const row = document.createElement('div');
    row.id = 'frow_'+i;
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:.62rem;padding:4px 6px;background:var(--surface2);border-radius:4px';
    row.innerHTML = `<span id="ficon_${i}" style="color:var(--text-3)">[ ]</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-3)">${f.name}</span><span id="fstatus_${i}" style="color:var(--text-3)">waiting</span>`;
    list.appendChild(row);
  });
  let done = 0;
  const results = await parseScreenshots(fileArr, (i, name, status, n, errMsg) => {
    const icon = document.getElementById('ficon_'+i);
    const st = document.getElementById('fstatus_'+i);
    if (status === 'processing') { if(icon) icon.textContent='[~]'; if(st) st.textContent='analysing…'; }
    else if (status === 'done')  { if(icon){icon.textContent='[✓]';icon.style.color='var(--green)';} if(st){st.textContent=(n||0)+' trades';st.style.color='var(--green)';} done++; bar.style.width=Math.round(done/fileArr.length*100)+'%'; count.textContent=done+'/'+fileArr.length; }
    else if (status === 'error'||status==='no-trades') { if(icon){icon.textContent='[✗]';icon.style.color='var(--red)';} if(st){st.textContent=errMsg||'no trades';st.style.color='var(--red)';} done++; bar.style.width=Math.round(done/fileArr.length*100)+'%'; count.textContent=done+'/'+fileArr.length; }
  });
  parsedBatch.img = results.map(t => ({...t, user_id: currentUser?.id}));
  if (parsedBatch.img.length) { label.style.color='var(--green)'; label.textContent='Found '+parsedBatch.img.length+' trades!'; showPreview('img', parsedBatch.img); }
  else { label.style.color='var(--amber)'; label.textContent='No trades found.'; }
}

async function handlePaste() {
  const text = document.getElementById('pasteData')?.value.trim();
  if (!text) { showToast('Paste some trade data first', 'error'); return; }
  showToast('Parsing…');
  const trades = await parsePastedText(text);
  parsedBatch.paste = trades;
  showPreview('paste', trades);
}

function showPreview(type, trades) {
  const preview = document.getElementById(type+'Preview');
  const label = document.getElementById(type+'PreviewLabel');
  const table = document.getElementById(type+'PreviewTable');
  const saveArea = document.getElementById(type+'SaveArea');
  if (!preview) return;
  label.textContent = 'Found ' + trades.length + ' trades — review before saving:';
  const rows = trades.slice(0,15).map(t => {
    const pnl = parseFloat(t.profit_loss);
    return `<tr>
      <td style="font-family:var(--f-mono);font-size:.68rem;color:var(--text-3)">${t.date}</td>
      <td style="color:var(--brand-l);font-weight:600">${t.instrument}</td>
      <td>${t.direction||'—'}</td>
      <td style="color:${pnl>=0?'var(--green)':'var(--red)'};font-weight:700;font-family:var(--f-mono)">${pnl>=0?'+':''}$${pnl.toFixed(2)}</td>
      <td><span class="badge ${t.result==='Win'?'badge-win':t.result==='Loss'?'badge-loss':'badge-be'}">${t.result}</span></td>
    </tr>`;
  }).join('') + (trades.length>15?`<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:6px">…and ${trades.length-15} more</td></tr>`:'');
  table.innerHTML = `<table class="data-table" style="font-size:.72rem"><thead><tr><th>Date</th><th>Instrument</th><th>Dir</th><th>P&L</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`;
  preview.style.display = 'block';
  if (saveArea) saveArea.style.display = 'block';
  // Auto-detect firm
  if (type === 'csv' || type === 'paste') {
    const text = trades.map(t => (t.instrument||'')+(t.account_provider||'')).join(' ');
    const detected = autoDetectFirm(text);
    if (detected) {
      const detEl = document.getElementById(type+'Detected');
      const sel = document.getElementById(type+'FirmSel');
      if (detEl) { detEl.textContent = '🔍 Detected: '+detected; detEl.style.display='inline'; }
      if (sel) sel.value = detected;
    }
  }
}

async function saveUploadBatch(type) {
  const trades = parsedBatch[type] || [];
  const firmName = document.getElementById(type+'FirmSel')?.value || activeFirm || 'Other';
  if (!trades.length) { showToast('No trades to save', 'error'); return; }
  showToast('Saving…');
  const { saved, dupes } = await saveTradesToDB(trades, firmName);
  if (!saved && !dupes) { showToast('Error saving trades', 'error'); return; }
  let msg = saved ? 'Saved ' + saved + ' trades to ' + firmName + '!' : 'All trades already exist.';
  if (dupes) msg += ' (' + dupes + ' duplicates skipped)';
  showToast(msg, 'success');
  parsedBatch[type] = [];
  document.getElementById(type+'Preview').style.display = 'none';
  document.getElementById(type+'SaveArea').style.display = 'none';
  await loadTradesFromSupabase();
}

// ══ ANALYSIS ══
function renderAnalysis(trades) {
  const s = calcStats(trades);
  const c = document.getElementById('pageContent');
  // By instrument
  const byInst = {};
  trades.forEach(t => { if (!byInst[t.instrument]) byInst[t.instrument]={w:0,l:0,pnl:0}; byInst[t.instrument].pnl+=parseFloat(t.profit_loss||0); if(t.result==='Win')byInst[t.instrument].w++;else if(t.result==='Loss')byInst[t.instrument].l++; });
  const instBars = Object.entries(byInst).sort((a,b)=>(b[1].w+b[1].l)-(a[1].w+a[1].l)).slice(0,10).map(([inst,d])=>{
    const total=d.w+d.l, wr=total?(d.w/total*100).toFixed(0):0;
    const pnlColor=d.pnl>=0?'var(--green)':'var(--red)';
    return `<div class="perf-bar"><div class="perf-bar-header"><span class="perf-bar-label">${inst}</span><span class="perf-bar-val" style="color:${pnlColor}">${wr}% · ${d.pnl>=0?'+$':'-$'}${Math.abs(d.pnl).toFixed(0)}</span></div><div class="prog-bar-bg"><div class="prog-bar-fill" style="width:${wr}%;background:${wr>=50?'var(--green)':'var(--red)'}"></div></div></div>`;
  }).join('');
  // Monthly table
  const byMonth = {};
  trades.forEach(t => { const m=t.date?t.date.slice(0,7):'?'; if(!byMonth[m])byMonth[m]={pnl:0,w:0,l:0}; byMonth[m].pnl+=parseFloat(t.profit_loss||0); if(t.result==='Win')byMonth[m].w++;else if(t.result==='Loss')byMonth[m].l++; });
  const monthRows = Object.entries(byMonth).sort().reverse().map(([m,d])=>`<tr><td style="font-family:var(--f-mono);font-size:.72rem">${m}</td><td style="color:${d.pnl>=0?'var(--green)':'var(--red)'};font-weight:700;font-family:var(--f-mono)">${d.pnl>=0?'+':''}$${d.pnl.toFixed(2)}</td><td>${d.w}</td><td>${d.l}</td><td>${d.w+d.l?(d.w/(d.w+d.l)*100).toFixed(0):0}%</td></tr>`).join('');

  c.innerHTML = `
  <!-- Top stats row -->
  <div class="widget-grid mb-6">
    <div class="widget w-green"><div class="widget-label">Total Wins</div><div class="widget-value">${s.wins}</div><div class="widget-sub">Avg win: ${fmtPnl(s.aw)}</div></div>
    <div class="widget w-red"><div class="widget-label">Total Losses</div><div class="widget-value">${s.losses}</div><div class="widget-sub">Avg loss: -$${s.al.toFixed(2)}</div></div>
    <div class="widget w-amber"><div class="widget-label">Best Trade</div><div class="widget-value">+$${s.best.toFixed(0)}</div><div class="widget-sub">Largest win</div></div>
    <div class="widget w-violet"><div class="widget-label">Worst Trade</div><div class="widget-value" style="color:var(--red)">-$${Math.abs(s.worst).toFixed(0)}</div><div class="widget-sub">Largest loss</div></div>
  </div>

  <div class="analysis-row mb-6">
    <!-- Win rate by instrument -->
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">Win Rate by Instrument</div></div>
      <div class="chart-body">${instBars||'<div style="color:var(--text-3);font-size:.75rem;text-align:center;padding:20px">No trade data yet</div>'}</div>
    </div>
    <!-- Win/Loss/BE ring + emotion analysis -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="chart-card">
        <div class="chart-card-header"><div class="chart-card-title">Result Distribution</div></div>
        <div class="chart-body" style="height:160px"><canvas id="resultsChart"></canvas></div>
      </div>
      <div class="chart-card" id="emotionCard">
        <div class="chart-card-header"><div class="chart-card-title">Emotion Analysis</div></div>
        <div class="chart-body" id="emotionBody"><div style="color:var(--text-3);font-size:.75rem;text-align:center;padding:20px">Loading…</div></div>
      </div>
    </div>
  </div>

  <!-- Monthly performance -->
  <div class="table-wrap">
    <div class="table-head"><div class="table-title">Monthly Performance</div></div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Month</th><th>P&L</th><th>Wins</th><th>Losses</th><th>Win Rate</th></tr></thead><tbody>${monthRows||'<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:20px">No data</td></tr>'}</tbody></table></div>
  </div>
  `;

  setTimeout(() => { renderResultsChart('resultsChart', s.wins, s.losses, s.be); }, 60);
  // Load emotion data
  if (currentUser) {
    let q = sb.from('journal_entries').select('emotion,result').eq('user_id', currentUser.id);
    if (activeFirm !== 'All') q = q.eq('account_provider', activeFirm);
    q.then(({ data }) => {
      const el = document.getElementById('emotionBody');
      if (!el || !data?.length) { if(el) el.innerHTML='<div style="color:var(--text-3);font-size:.75rem;text-align:center;padding:16px">No journal entries yet</div>'; return; }
      const byEm = {};
      data.forEach(e => { if(!e.emotion)return; if(!byEm[e.emotion])byEm[e.emotion]={w:0,total:0}; byEm[e.emotion].total++; if(e.result==='Win')byEm[e.emotion].w++; });
      el.innerHTML = Object.entries(byEm).map(([em,d])=>{const wr=(d.w/d.total*100).toFixed(0);return `<div class="perf-bar"><div class="perf-bar-header"><span class="perf-bar-label">${em}</span><span class="perf-bar-val">${wr}% (${d.total})</span></div><div class="prog-bar-bg"><div class="prog-bar-fill" style="width:${wr}%;background:${wr>=50?'var(--green)':'var(--red)'}"></div></div></div>`;}).join('');
    });
  }
}

// ══ JOURNAL ══
let activeJournalFilter = 'all';
let activeJournalEmotions = {};

function renderJournal() {
  const c = document.getElementById('pageContent');
  const firmTrades = getTradesForFirm(activeFirm);
  const instruments = [...new Set(firmTrades.map(t => t.instrument).filter(Boolean))];
  const instOptions = `<option value="">Select…</option>` + instruments.map(i => `<option>${i}</option>`).join('') + `<option>Other</option>`;
  c.innerHTML = `
  <div class="section-header mb-4">
    <div><div class="section-title">Trading Journal</div><div class="section-sub">Document your trades and mindset</div></div>
    <button class="btn-sm btn-primary-sm" id="newEntryBtn" onclick="toggleNewEntry()">+ New Entry</button>
  </div>

  <!-- New Entry Form -->
  <div id="newEntryForm" style="display:none;margin-bottom:20px">
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">New Journal Entry</div><button onclick="toggleNewEntry()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:18px">✕</button></div>
      <div class="chart-body">
        <div class="col-3 mb-4" style="gap:12px">
          <div class="field-group"><label class="field-label">Date</label><input type="date" class="field-input" id="jDate"/></div>
          <div class="field-group"><label class="field-label">Instrument</label><select class="field-input" id="jInstrument">${instOptions}</select></div>
          <div class="field-group"><label class="field-label">Result</label><select class="field-input" id="jResult"><option value="">Select…</option><option>Win</option><option>Loss</option><option>Break Even</option></select></div>
        </div>
        <div class="field-group mb-4"><label class="field-label">How were you feeling before this trade?</label>
          <div class="emotion-grid" style="margin-top:6px">
            ${['😌 Calm','💪 Confident','😰 FOMO','😤 Revenge','😟 Anxious','😑 Bored'].map(e=>
              `<button class="emotion-btn" onclick="selectEmotion(this,'${e}')">${e}</button>`
            ).join('')}
          </div>
        </div>
        <div class="col-3 mb-4" style="gap:12px">
          <div class="field-group"><label class="field-label">Why I Entered</label><textarea class="field-input field-textarea" id="jReason" placeholder="Setup, confluences…" style="min-height:80px"></textarea></div>
          <div class="field-group"><label class="field-label">What Went Well</label><textarea class="field-input field-textarea" id="jWell" placeholder="Discipline, execution…" style="min-height:80px"></textarea></div>
          <div class="field-group"><label class="field-label">What To Improve</label><textarea class="field-input field-textarea" id="jImprove" placeholder="Mistakes, lessons…" style="min-height:80px"></textarea></div>
        </div>
        <button class="btn-sm btn-success-sm" onclick="saveJournalEntry()" style="width:100%;padding:10px">Save Journal Entry</button>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    <button class="filter-pill ${activeJournalFilter==='all'?'active':''}" onclick="filterJournal('all',this)">All</button>
    <button class="filter-pill ${activeJournalFilter==='win'?'active':''}" onclick="filterJournal('win',this)">Wins</button>
    <button class="filter-pill ${activeJournalFilter==='loss'?'active':''}" onclick="filterJournal('loss',this)">Losses</button>
    <button class="filter-pill ${activeJournalFilter==='be'?'active':''}" onclick="filterJournal('be',this)">Break Even</button>
  </div>

  <div id="journalEntries"><div class="shimmer" style="height:100px;margin-bottom:10px"></div></div>
  `;
  document.getElementById('jDate').value = new Date().toISOString().split('T')[0];
  loadJournalEntries();
}

function toggleNewEntry() {
  const f = document.getElementById('newEntryForm');
  const b = document.getElementById('newEntryBtn');
  const open = f.style.display === 'none';
  f.style.display = open ? 'block' : 'none';
  b.textContent = open ? '✕ Cancel' : '+ New Entry';
  if (open) { f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); document.getElementById('jDate').focus(); }
}
function selectEmotion(btn, em) {
  document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  activeJournalEmotions[activeFirm] = em;
}
function filterJournal(filter, btn) {
  activeJournalFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  loadJournalEntries();
}
async function saveJournalEntry() {
  if (!currentUser) { showToast('Sign in first', 'error'); return; }
  const date = document.getElementById('jDate').value;
  const instrument = document.getElementById('jInstrument').value;
  const result = document.getElementById('jResult').value;
  if (!date || !instrument || !result) { showToast('Date, instrument and result required', 'error'); return; }
  const emotion = activeJournalEmotions[activeFirm] || '';
  const { error } = await sb.from('journal_entries').insert({ user_id: currentUser.id, date, instrument, result, emotion, reasoning: document.getElementById('jReason').value, went_well: document.getElementById('jWell').value, improve: document.getElementById('jImprove').value, account_provider: activeFirm === 'All' ? 'Other' : activeFirm });
  if (error) { showToast('Error: '+error.message, 'error'); return; }
  showToast('Journal entry saved!', 'success');
  ['jReason','jWell','jImprove','jResult','jInstrument'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  activeJournalEmotions[activeFirm] = '';
  document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('newEntryForm').style.display = 'none';
  document.getElementById('newEntryBtn').textContent = '+ New Entry';
  loadJournalEntries();
}
async function loadJournalEntries() {
  if (!currentUser) return;
  let q = sb.from('journal_entries').select('*').eq('user_id', currentUser.id).order('date', { ascending: false });
  if (activeFirm !== 'All') q = q.eq('account_provider', activeFirm);
  const { data } = await q;
  const container = document.getElementById('journalEntries');
  if (!container) return;
  if (!data?.length) { container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">No journal entries yet</div><div class="empty-sub">Start journaling to build your trading psychology insights.</div></div>`; return; }
  const filtered = data.filter(e => { if(activeJournalFilter==='all')return true; if(activeJournalFilter==='win')return e.result==='Win'; if(activeJournalFilter==='loss')return e.result==='Loss'; if(activeJournalFilter==='be')return e.result==='Break Even'; return true; });
  container.innerHTML = filtered.map(e => {
    const badge = e.result==='Win'?'badge-win':e.result==='Loss'?'badge-loss':'badge-be';
    return `<div class="jentry">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px">
        <div><div class="jentry-date">${e.date} · <span style="color:var(--text-3)">${e.account_provider||''}</span></div><div class="jentry-instr">${e.instrument||'—'}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="badge ${badge}">${e.result||'—'}</span>
          ${e.emotion?`<span class="jentry-emotion">${e.emotion}</span>`:''}
          <button class="btn-sm btn-danger-sm" onclick="deleteJournalEntry('${e.id}')" style="padding:2px 7px;font-size:.58rem">✕</button>
        </div>
      </div>
      ${e.reasoning?`<div class="jentry-section"><div class="jentry-section-label">Why I Entered</div><div class="jentry-text">${e.reasoning}</div></div>`:''}
      ${e.went_well?`<div class="jentry-section"><div class="jentry-section-label">What Went Well</div><div class="jentry-text">${e.went_well}</div></div>`:''}
      ${e.improve?`<div class="jentry-section"><div class="jentry-section-label">What To Improve</div><div class="jentry-text">${e.improve}</div></div>`:''}
    </div>`;
  }).join('') || `<div style="text-align:center;padding:24px;color:var(--text-3);font-size:.75rem">No ${activeJournalFilter} entries found.</div>`;
}
async function deleteJournalEntry(id) {
  if (!currentUser || !confirm('Delete this entry?')) return;
  await sb.from('journal_entries').delete().eq('id', id).eq('user_id', currentUser.id);
  showToast('Entry deleted.', 'success');
  loadJournalEntries();
}

// ══ CALENDAR ══
function renderCalendar(trades) {
  const c = document.getElementById('pageContent');
  if (!trades.length) { c.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No trades to display</div><div class="empty-sub">Import trades to see your performance calendar.</div></div>`; return; }
  const dayMap = {};
  trades.forEach(t => { if(!t.date) return; const d=t.date.slice(0,10); if(!dayMap[d])dayMap[d]={pnl:0,wins:0,losses:0,count:0}; dayMap[d].pnl+=parseFloat(t.profit_loss||0); dayMap[d].count++; if(t.result==='Win')dayMap[d].wins++;else if(t.result==='Loss')dayMap[d].losses++; });
  const tradeDates = Object.keys(dayMap).sort();
  const months = [...new Set(tradeDates.map(d => d.slice(0,7)))].sort();
  const totalPnl = Object.values(dayMap).reduce((s,d)=>s+d.pnl,0);
  const profitDays = tradeDates.filter(d=>dayMap[d].pnl>0).length;
  const lossDays = tradeDates.filter(d=>dayMap[d].pnl<0).length;
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = `
  <div style="display:flex;gap:16px;margin-bottom:20px;padding:14px 16px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);flex-wrap:wrap">
    <div><div style="font-family:var(--f-mono);font-size:.58rem;color:var(--text-3);margin-bottom:3px">TRADING DAYS</div><strong style="font-size:1.1rem">${tradeDates.length}</strong></div>
    <div><div style="font-family:var(--f-mono);font-size:.58rem;color:var(--text-3);margin-bottom:3px">PROFIT DAYS</div><strong style="font-size:1.1rem;color:var(--green)">${profitDays}</strong></div>
    <div><div style="font-family:var(--f-mono);font-size:.58rem;color:var(--text-3);margin-bottom:3px">LOSS DAYS</div><strong style="font-size:1.1rem;color:var(--red)">${lossDays}</strong></div>
    <div><div style="font-family:var(--f-mono);font-size:.58rem;color:var(--text-3);margin-bottom:3px">NET P&L</div><strong style="font-size:1.1rem;color:${totalPnl>=0?'var(--green)':'var(--red)'}">${totalPnl>=0?'+$':'-$'}${Math.abs(totalPnl).toFixed(2)}</strong></div>
  </div>`;
  months.forEach(ym => {
    const [y,mo] = ym.split('-').map(Number);
    const label = new Date(y,mo-1,1).toLocaleString('default',{month:'long',year:'numeric'});
    const first = new Date(y,mo-1,1).getDay(), total = new Date(y,mo,0).getDate();
    const mPnl = tradeDates.filter(d=>d.startsWith(ym)).reduce((s,d)=>s+dayMap[d].pnl,0);
    html += `<div class="cal-wrap" style="margin-bottom:18px">
      <div class="cal-month-header">
        <span class="cal-month-title">${label}</span>
        <span class="cal-month-pnl" style="color:${mPnl>=0?'var(--green)':'var(--red)'}">${mPnl>=0?'+$':'-$'}${Math.abs(mPnl).toFixed(0)}</span>
      </div>
      <div class="cal-grid">
        ${dayLabels.map(d=>`<div class="cal-day-label">${d}</div>`).join('')}
        ${'<div class="cal-day empty"></div>'.repeat(first)}
        ${Array.from({length:total},(_,i)=>i+1).map(d=>{
          const ds=`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const day=dayMap[ds];
          if(!day) return `<div class="cal-day"><div class="cal-day-num">${d}</div></div>`;
          const cls=day.pnl>0?'profit':day.pnl<0?'loss':'be';
          const pnlColor=day.pnl>0?'var(--green)':day.pnl<0?'var(--red)':'var(--amber)';
          return `<div class="cal-day ${cls}" title="${ds}: ${day.pnl>=0?'+':'' }$${day.pnl.toFixed(2)}"><div class="cal-day-num">${d}</div><div class="cal-day-pnl" style="color:${pnlColor}">${day.pnl>=0?'+$':'-$'}${Math.abs(day.pnl).toFixed(0)}</div><div class="cal-day-trades">${day.wins}W ${day.losses}L</div></div>`;
        }).join('')}
      </div>
    </div>`;
  });
  c.innerHTML = html;
}

// ══ HELP ══
function renderHelp() {
  document.getElementById('pageContent').innerHTML = `
  <div style="max-width:780px">
    <div style="margin-bottom:24px"><div class="section-title">Help & Documentation</div><div class="section-sub">Everything you need to get started with TradingStats</div></div>
    <div class="chart-card mb-4"><div class="chart-card-header"><div class="chart-card-title">⚡ Getting Started</div></div>
      <div class="chart-body" style="font-size:.8rem;line-height:2;color:var(--text-2)">
        <div style="margin-bottom:10px"><span style="color:var(--brand);font-weight:700">Step 1</span> — Select your prop firm from the sidebar (Deriv, FTMO, The5ers, Other)</div>
        <div style="margin-bottom:10px"><span style="color:var(--brand);font-weight:700">Step 2</span> — Go to Import Trades and upload your MT5 HTML report or CSV</div>
        <div style="margin-bottom:10px"><span style="color:var(--brand);font-weight:700">Step 3</span> — View stats on the Dashboard, drill down in Performance</div>
        <div><span style="color:var(--brand);font-weight:700">Step 4</span> — Journal every trade with emotion tags to discover patterns</div>
      </div>
    </div>
    <div class="chart-card mb-4"><div class="chart-card-header"><div class="chart-card-title">📤 How To Export From MT5</div></div>
      <div class="chart-body" style="font-family:var(--f-mono);font-size:.7rem;line-height:2;color:var(--text-2)">
        <div>1. Open MT5 → History tab at the bottom panel</div>
        <div>2. Right-click → Custom Period → set date range → OK</div>
        <div>3. Right-click again → Report → Save as <strong style="color:var(--green)">ReportHistory-XXXXXXXX.html</strong></div>
        <div>4. Go to Import Trades → upload the .html file</div>
        <div style="margin-top:10px;color:var(--amber)">⚠ Tip: Save as "History Report" not "Statement"</div>
      </div>
    </div>
    <div class="chart-card mb-4"><div class="chart-card-header"><div class="chart-card-title">📊 Understanding Your Stats Score</div></div>
      <div class="chart-body" style="font-size:.78rem;line-height:1.8;color:var(--text-2)">
        The Stats Score (0–100) grades your overall trading health across Win Rate, Profit Factor, RRR, and Expectancy.<br><br>
        <strong style="color:var(--green)">80–100: Elite</strong> · <strong style="color:var(--brand-l)">65–79: Strong</strong> · <strong style="color:var(--amber)">50–64: Developing</strong> · <strong style="color:var(--red)">0–49: Needs work</strong>
      </div>
    </div>
    <div style="text-align:center;margin-top:28px;padding:20px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r)">
      <div style="font-family:var(--f-disp);font-size:1.1rem;font-weight:800;margin-bottom:4px;background:linear-gradient(135deg,var(--brand-l),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">TradingStats</div>
      <div style="font-size:.7rem;color:var(--text-3)">Built by <strong style="color:var(--green)">Osita Onyeje</strong> · <a href="mailto:nwaogalanyapaulinus@gmail.com" style="color:var(--text-3)">nwaogalanyapaulinus@gmail.com</a> · © 2026</div>
    </div>
  </div>
  `;
}
