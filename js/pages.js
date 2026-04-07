/* ══ TradingStats — Page Renderers ══ */

function renderPage(page) {
  const content = document.getElementById('pageContent');
  const titles = { dashboard:'Dashboard', history:'Trade History', upload:'Import Trades', analysis:'Performance', journal:'Journal', calendar:'Calendar', objectives:'Objectives', help:'Help' };
  const breadcrumbs = { dashboard:'Overview', history:'Trades › History', upload:'Trades › Import', analysis:'Analytics › Performance', journal:'Analytics › Journal', calendar:'Overview › Calendar', objectives:'Analytics › Objectives', help:'Account › Help' };
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
    case 'objectives':  renderObjectives(trades); break;
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
        <div class="widget-value">${trades.length ? '+$'+Math.max(0,s.best).toFixed(0) : '—'}</div>
        <div class="widget-sub">Largest win</div>
      </div>
      <div class="widget w-red">
        <div class="widget-label">Worst Trade</div>
        <div class="widget-value">${trades.length ? '-$'+Math.abs(Math.min(0,s.worst)).toFixed(0) : '—'}</div>
        <div class="widget-sub">Largest loss</div>
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
      <div><div class="chart-card-title">Equity Curve</div><div class="chart-card-sub">Scroll/pinch to zoom · drag to pan · double-tap to reset</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="eqValBadge" style="font-family:var(--f-mono);font-size:.82rem;font-weight:700"></span>
        <button class="btn-sm btn-outline-sm" onclick="resetEqZoom()" style="font-size:.6rem;padding:3px 8px">Reset</button>
      </div>
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

function resetEqZoom() {
  const chart = Chart.getChart('eqChart');
  if (chart && chart.resetZoom) chart.resetZoom();
}

function autoDetectFirm(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('ftmo')) return 'FTMO';
  if (t.includes('deriv') || t.includes('dxtrade') || t.includes('deriv-')) return 'Deriv';
  if (t.includes('5ers') || t.includes('the5ers')) return 'The5ers';
  return null;
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
    const _pnl226=parseFloat(t.profit_loss||0); const badge = _pnl226>0?'badge-win':_pnl226<0?'badge-loss':'badge-be';
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
  // Reset batch state when the page is re-rendered so stale data can't be re-saved
  parsedBatch = { csv: [], img: [], paste: [] };
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
      <td><span class="badge ${parseFloat(t.profit_loss||0)>0?'badge-win':parseFloat(t.profit_loss||0)<0?'badge-loss':'badge-be'}">${parseFloat(t.profit_loss||0)>0?'Win':parseFloat(t.profit_loss||0)<0?'Loss':'Break Even'}</span></td>
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
  trades.forEach(t => { if (!byInst[t.instrument]) byInst[t.instrument]={w:0,l:0,pnl:0}; const _p479=parseFloat(t.profit_loss||0); byInst[t.instrument].pnl+=_p479; if(_p479>0)byInst[t.instrument].w++;else if(_p479<0)byInst[t.instrument].l++; });
  const instBars = Object.entries(byInst).sort((a,b)=>(b[1].w+b[1].l)-(a[1].w+a[1].l)).slice(0,10).map(([inst,d])=>{
    const total=d.w+d.l, wr=total?(d.w/total*100).toFixed(0):0;
    const pnlColor=d.pnl>=0?'var(--green)':'var(--red)';
    return `<div class="perf-bar"><div class="perf-bar-header"><span class="perf-bar-label">${inst}</span><span class="perf-bar-val" style="color:${pnlColor}">${wr}% · ${d.pnl>=0?'+$':'-$'}${Math.abs(d.pnl).toFixed(0)}</span></div><div class="prog-bar-bg"><div class="prog-bar-fill" style="width:${wr}%;background:${wr>=50?'var(--green)':'var(--red)'}"></div></div></div>`;
  }).join('');
  // Monthly table
  const byMonth = {};
  trades.forEach(t => { const m=t.date?t.date.slice(0,7):'?'; if(!byMonth[m])byMonth[m]={pnl:0,w:0,l:0}; const _p487=parseFloat(t.profit_loss||0); byMonth[m].pnl+=_p487; if(_p487>0)byMonth[m].w++;else if(_p487<0)byMonth[m].l++; });
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

// Global journal form state — survives tab switches
let journalFormState = { open: false, date: '', instrument: '', result: '', emotion: '', reason: '', well: '', improve: '' };

function saveJournalFormState() {
  const overlay = document.getElementById('newJournalOverlay');
  if (!overlay || overlay.style.display === 'none' || overlay.style.display === '') {
    journalFormState.open = false;
    return;
  }
  journalFormState.open       = true;
  journalFormState.date       = document.getElementById('jDate')?.value       || '';
  journalFormState.instrument = document.getElementById('jInstrument')?.value  || '';
  journalFormState.result     = document.getElementById('jResult')?.value      || '';
  journalFormState.reason     = document.getElementById('jReason')?.value      || '';
  journalFormState.well       = document.getElementById('jWell')?.value        || '';
  journalFormState.improve    = document.getElementById('jImprove')?.value     || '';
  journalFormState.emotion    = activeJournalEmotions[activeFirm]              || '';
}

function restoreJournalFormState() {
  if (!journalFormState.open) return;
  // Re-open modal with saved state
  openJournalModal();
  // Restore field values
  const fields = { jDate: 'date', jInstrument: 'instrument', jResult: 'result', jReason: 'reason', jWell: 'well', jImprove: 'improve' };
  setTimeout(() => {
    Object.entries(fields).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && journalFormState[key]) el.value = journalFormState[key];
    });
    if (journalFormState.emotion) {
      activeJournalEmotions[activeFirm] = journalFormState.emotion;
      document.querySelectorAll('#newJournalOverlay .emotion-btn').forEach(b => {
        if (b.textContent.trim() === journalFormState.emotion.trim()) b.classList.add('selected');
      });
    }
  }, 80);
}

function renderJournal() {
  saveJournalFormState(); // save before any re-render
  const c = document.getElementById('pageContent');
  const firmTrades = getTradesForFirm(activeFirm);
  const instruments = [...new Set(firmTrades.map(t => t.instrument).filter(Boolean))];
  const instOptions = `<option value="" style="background:#131c28;color:#e8edf5">Select…</option>` + instruments.map(i => `<option style="background:#131c28;color:#e8edf5">${i}</option>`).join('') + `<option style="background:#131c28;color:#e8edf5">Other</option>`;
  c.innerHTML = `
  <div class="section-header mb-4">
    <div><div class="section-title">Trading Journal</div><div class="section-sub">Document your trades and mindset</div></div>
    <button class="btn-sm btn-primary-sm" onclick="openJournalModal()">+ New Entry</button>
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
  // Date is set inside openJournalModal() — no DOM access needed here
  loadJournalEntries();
}

function toggleJFirm(firm, labelEl) {
  const cb   = document.getElementById('jfirm_' + firm);
  const tick = document.getElementById('jfirm_check_' + firm);
  const txt  = document.getElementById('jfirm_txt_' + firm);
  if (!cb) return;
  cb.checked = !cb.checked;
  if (cb.checked) {
    labelEl.style.background    = 'var(--brand-bg)';
    labelEl.style.borderColor   = 'var(--brand-br,rgba(79,142,247,.3))';
    tick.textContent            = '✓';
    tick.style.background       = 'var(--brand)';
    tick.style.borderColor      = 'var(--brand)';
    tick.style.color            = '#fff';
    txt.style.color             = 'var(--brand)';
  } else {
    labelEl.style.background    = 'var(--surface2)';
    labelEl.style.borderColor   = 'var(--border)';
    tick.textContent            = '';
    tick.style.background       = 'var(--bg)';
    tick.style.borderColor      = 'var(--border2)';
    txt.style.color             = 'var(--text-3)';
  }
}

function getSelectedJFirms() {
  return ['Deriv','FTMO','The5ers','Other'].filter(f => {
    const cb = document.getElementById('jfirm_' + f);
    return cb && cb.checked;
  });
}

function preSelectJFirm(firm) {
  // Auto-check the current active firm — set state directly, no toggle needed
  const target = (firm === 'All') ? 'Other' : firm;
  ['Deriv','FTMO','The5ers','Other'].forEach(f => {
    const cb    = document.getElementById('jfirm_' + f);
    const label = document.getElementById('jfirm_label_' + f);
    const tick  = document.getElementById('jfirm_check_' + f);
    const txt   = document.getElementById('jfirm_txt_' + f);
    if (!cb || !label) return;
    const sel = (f === target);
    cb.checked                = sel;
    label.style.background    = sel ? 'var(--brand-bg)'        : 'var(--surface2)';
    label.style.borderColor   = sel ? 'rgba(79,142,247,.3)'    : 'var(--border)';
    tick.textContent          = sel ? '✓' : '';
    tick.style.background     = sel ? 'var(--brand)'           : 'var(--bg)';
    tick.style.borderColor    = sel ? 'var(--brand)'           : 'var(--border2)';
    tick.style.color          = sel ? '#fff'                   : '';
    txt.style.color           = sel ? 'var(--brand)'           : 'var(--text-3)';
  });
}

function openJournalModal() {
  // Always rebuild modal so instrument list reflects current firm
  const existing = document.getElementById('newJournalOverlay');
  if (existing) existing.remove();
  // Clear stale image data from any previous modal session
  journalImgData = null;
  journalImgMime = 'image/jpeg';
  buildJournalModal();
  const overlay = document.getElementById('newJournalOverlay');
  overlay.style.display = 'flex';
  // Set today's date
  const dateEl = document.getElementById('jDate');
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
  // Auto-select active firm
  setTimeout(() => preSelectJFirm(activeFirm), 30);
  // Focus date
  setTimeout(() => { document.getElementById('jDate')?.focus(); }, 60);
  // Global paste listener — catches Ctrl+V anywhere inside the modal
  overlay._pasteHandler = (e) => {
    // Only intercept if the paste zone tab is active OR user is not in a text field
    const active = document.activeElement;
    const inTextField = active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');
    const pasteTabActive = document.getElementById('imgPanel_paste')?.style.display !== 'none';
    if (pasteTabActive || !inTextField) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          // Auto switch to paste tab if not already there
          switchImgTab('paste');
          setJournalImgFromPaste(item.getAsFile());
          return;
        }
      }
    }
  };
  document.addEventListener('paste', overlay._pasteHandler);
}

function closeJournalModal() {
  const overlay = document.getElementById('newJournalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    // Remove global paste listener
    if (overlay._pasteHandler) {
      document.removeEventListener('paste', overlay._pasteHandler);
      overlay._pasteHandler = null;
    }
  }
}

function buildJournalModal() {
  // Build instrument options from current firm trades
  const firmTrades = getTradesForFirm(activeFirm);
  const instruments = [...new Set(firmTrades.map(t => t.instrument).filter(Boolean))];
  const instOptions = `<option value="" style="background:#131c28;color:#e8edf5">Select instrument…</option>`
    + instruments.map(i => `<option style="background:#131c28;color:#e8edf5">${i}</option>`).join('')
    + `<option style="background:#131c28;color:#e8edf5">Other</option>`;

  const overlay = document.createElement('div');
  overlay.id = 'newJournalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:none;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  overlay.onclick = (e) => { if (e.target === overlay) closeJournalModal(); };

  overlay.innerHTML = `
    <div style="background:var(--surface);border:1.5px solid var(--border2);border-radius:14px;width:720px;max-width:100%;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,.7);animation:scaleIn .22s ease both">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--border);background:var(--surface2);border-radius:14px 14px 0 0;position:sticky;top:0;z-index:1">
        <div>
          <div style="font-family:var(--f-disp);font-size:1.2rem;font-weight:800;color:var(--text)">New Journal Entry</div>
          <div style="font-size:.65rem;color:var(--text-3);font-family:var(--f-mono);margin-top:2px">Your data saves to all selected firms</div>
        </div>
        <button onclick="closeJournalModal()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:22px;line-height:1;padding:4px" title="Close">✕</button>
      </div>

      <!-- Body -->
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:16px">

        <!-- Row 1: Date / Instrument / Result -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="field-group">
            <label class="field-label">Date</label>
            <input type="date" class="field-input" id="jDate"/>
          </div>
          <div class="field-group">
            <label class="field-label">Instrument</label>
            <select class="field-input" id="jInstrument" style="background:var(--bg);color:var(--text)">${instOptions}</select>
          </div>
          <div class="field-group">
            <label class="field-label">Result</label>
            <select class="field-input" id="jResult" style="background:var(--bg);color:var(--text)">
              <option value="" style="background:#131c28">Select…</option>
              <option style="background:#131c28;color:#e8edf5">Win</option>
              <option style="background:#131c28;color:#e8edf5">Loss</option>
              <option style="background:#131c28;color:#e8edf5">Break Even</option>
            </select>
          </div>
        </div>

        <!-- Save to firms -->
        <div class="field-group">
          <label class="field-label">Save to Firms <span style="color:var(--text-3);font-weight:400">(select all that apply)</span></label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:7px">
            ${['Deriv','FTMO','The5ers','Other'].map(f => `
              <label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:7px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--surface2);transition:all .18s;user-select:none" id="jfirm_label_${f}" onclick="toggleJFirm('${f}',this)">
                <span style="width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border2);background:var(--bg);display:inline-flex;align-items:center;justify-content:center;font-size:.65rem;flex-shrink:0;transition:all .18s;font-weight:700" id="jfirm_check_${f}"></span>
                <span style="font-size:.78rem;font-weight:600;color:var(--text-3);transition:color .18s" id="jfirm_txt_${f}">${f}</span>
                <input type="checkbox" id="jfirm_${f}" value="${f}" style="display:none"/>
              </label>`).join('')}
          </div>
          <div style="font-size:.6rem;color:var(--text-4);margin-top:5px;font-family:var(--f-mono)">Tick multiple firms to save this entry across all of them at once</div>
        </div>

        <!-- Emotion -->
        <div class="field-group">
          <label class="field-label">How were you feeling?</label>
          <div class="emotion-grid" style="margin-top:7px">
            ${['😌 Calm','💪 Confident','😰 FOMO','😤 Revenge','😟 Anxious','😑 Bored'].map(e =>
              `<button class="emotion-btn" onclick="selectEmotion(this,'${e}')">${e}</button>`
            ).join('')}
          </div>
        </div>

        <!-- Notes 3-col -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="field-group">
            <label class="field-label">Why I Entered</label>
            <textarea class="field-input field-textarea" id="jReason" placeholder="Setup, confluences, POI…" style="min-height:90px;resize:vertical"></textarea>
          </div>
          <div class="field-group">
            <label class="field-label">What Went Well</label>
            <textarea class="field-input field-textarea" id="jWell" placeholder="Discipline, patience, execution…" style="min-height:90px;resize:vertical"></textarea>
          </div>
          <div class="field-group">
            <label class="field-label">What To Improve</label>
            <textarea class="field-input field-textarea" id="jImprove" placeholder="Mistakes, lessons learned…" style="min-height:90px;resize:vertical"></textarea>
          </div>
        </div>

        <!-- Screenshot -->
        <div class="field-group">
          <label class="field-label">Trade Screenshot <span style="color:var(--text-4);font-weight:400">(optional)</span></label>

          <!-- Method tabs -->
          <div style="display:flex;gap:0;margin-bottom:8px;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg)">
            <button id="imgTab_upload" onclick="switchImgTab('upload')"
              style="flex:1;padding:7px;font-size:.7rem;font-weight:600;font-family:var(--f-mono);border:none;cursor:pointer;transition:all .18s;background:var(--brand);color:#fff">
              📁 Upload / Drop
            </button>
            <button id="imgTab_paste" onclick="switchImgTab('paste')"
              style="flex:1;padding:7px;font-size:.7rem;font-weight:600;font-family:var(--f-mono);border:none;cursor:pointer;transition:all .18s;background:transparent;color:var(--text-3)">
              📋 Paste from Clipboard
            </button>
          </div>

          <!-- Upload / Drop tab -->
          <div id="imgPanel_upload">
            <div id="jImgDrop"
              style="border:2px dashed var(--border2);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;position:relative"
              onclick="document.getElementById('jImgInput').click()"
              ondragover="event.preventDefault();this.style.borderColor='var(--brand)';this.style.background='rgba(79,142,247,.04)'"
              ondragleave="this.style.borderColor='var(--border2)';this.style.background=''"
              ondrop="handleJournalImgDrop(event)">
              <div id="jImgPreview" style="display:none;margin-bottom:8px">
                <img id="jImgThumb" style="max-height:130px;border-radius:6px;max-width:100%" alt="preview"/>
              </div>
              <div id="jImgLabel" style="font-size:.78rem;color:var(--text-3)">
                📁 Drop screenshot here or <span style="color:var(--brand);text-decoration:underline">click to browse</span>
              </div>
            </div>
            <input type="file" id="jImgInput" accept="image/*" style="display:none" onchange="handleJournalImgSelect(this.files)"/>
          </div>

          <!-- Paste tab -->
          <div id="imgPanel_paste" style="display:none">
            <div id="jPasteZone"
              style="border:2px dashed var(--border2);border-radius:8px;padding:24px;text-align:center;transition:all .2s;position:relative;outline:none"
              tabindex="0"
              onclick="this.focus();showToast('Ready — now press Ctrl+V (or Cmd+V on Mac) to paste','info')"
              onkeydown="handlePasteKey(event)"
              onpaste="handlePasteEvent(event)"
              onfocus="this.style.borderColor='var(--brand)';this.style.background='rgba(79,142,247,.04)'"
              onblur="this.style.borderColor='var(--border2)';this.style.background=''">
              <div id="jPastePreview" style="display:none;margin-bottom:8px">
                <img id="jPasteThumb" style="max-height:130px;border-radius:6px;max-width:100%" alt="pasted image"/>
              </div>
              <div id="jPasteLabel" style="font-size:.78rem;color:var(--text-3);line-height:1.8">
                📋 <strong style="color:var(--text)">Click here first</strong>, then press<br>
                <span style="font-family:var(--f-mono);background:var(--bg);border:1px solid var(--border2);border-radius:4px;padding:2px 8px;font-size:.75rem">Ctrl + V</span>
                &nbsp;or&nbsp;
                <span style="font-family:var(--f-mono);background:var(--bg);border:1px solid var(--border2);border-radius:4px;padding:2px 8px;font-size:.75rem">⌘ + V</span>
                &nbsp;to paste your screenshot
              </div>
            </div>
            <p style="font-size:.62rem;color:var(--text-4);font-family:var(--f-mono);margin-top:5px">
              Copy a screenshot (Win: Snipping Tool, Mac: Cmd+Ctrl+Shift+4, Phone: screenshot → copy) then paste above
            </p>
          </div>

          <!-- Clear button (shared) -->
          <button id="jImgClear" style="display:none;margin-top:6px;background:none;border:none;color:var(--red);font-size:.7rem;cursor:pointer;font-family:var(--f-mono)" onclick="clearJournalImg()">✕ Remove image</button>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:10px;padding-top:4px">
          <button class="btn-ghost" onclick="closeJournalModal()" style="flex:1">Cancel</button>
          <button class="btn-primary" id="saveJournalBtn" onclick="saveJournalEntry()" style="flex:2;width:auto;padding:11px">💾 Save Journal Entry</button>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Keep toggleNewEntry as alias for backward compat
function toggleNewEntry() { openJournalModal(); }
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
// ── Journal image state ──
let journalImgData = null;
let journalImgMime = 'image/jpeg';

// Switch between upload and paste tabs
function switchImgTab(tab) {
  const uploadPanel = document.getElementById('imgPanel_upload');
  const pastePanel  = document.getElementById('imgPanel_paste');
  const tabUpload   = document.getElementById('imgTab_upload');
  const tabPaste    = document.getElementById('imgTab_paste');
  if (!uploadPanel || !pastePanel) return;
  if (tab === 'upload') {
    uploadPanel.style.display = 'block';
    pastePanel.style.display  = 'none';
    if (tabUpload) { tabUpload.style.background = 'var(--brand)'; tabUpload.style.color = '#fff'; }
    if (tabPaste)  { tabPaste.style.background  = 'transparent'; tabPaste.style.color  = 'var(--text-3)'; }
  } else {
    uploadPanel.style.display = 'none';
    pastePanel.style.display  = 'block';
    if (tabPaste)  { tabPaste.style.background  = 'var(--brand)'; tabPaste.style.color = '#fff'; }
    if (tabUpload) { tabUpload.style.background = 'transparent'; tabUpload.style.color = 'var(--text-3)'; }
    // Auto-focus paste zone
    setTimeout(() => document.getElementById('jPasteZone')?.focus(), 80);
  }
}

// Handle keyboard paste (Ctrl+V / Cmd+V)
function handlePasteKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    // Let the paste event handle it — don't intercept here
  }
}

// Handle actual paste event on the paste zone
function handlePasteEvent(e) {
  e.preventDefault();
  const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
  if (!items) { showToast('No clipboard data found', 'error'); return; }
  let found = false;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        setJournalImgFromPaste(file);
        found = true;
        break;
      }
    }
  }
  if (!found) {
    showToast('No image found in clipboard — copy a screenshot first', 'error');
  }
}

// Set image from paste (updates paste zone preview)
function setJournalImgFromPaste(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    journalImgData = ev.target.result;
    journalImgMime = file.type;
    // Update paste zone
    const thumb    = document.getElementById('jPasteThumb');
    const preview  = document.getElementById('jPastePreview');
    const label    = document.getElementById('jPasteLabel');
    const clearBtn = document.getElementById('jImgClear');
    const zone     = document.getElementById('jPasteZone');
    if (thumb)    { thumb.src = journalImgData; }
    if (preview)  { preview.style.display = 'block'; }
    if (label)    { label.innerHTML = '✅ <strong style="color:var(--green)">Image pasted successfully!</strong><br><span style="font-size:.68rem;color:var(--text-3)">Paste again to replace</span>'; }
    if (clearBtn) { clearBtn.style.display = 'inline-block'; }
    if (zone)     { zone.style.borderColor = 'var(--green)'; zone.style.background = 'rgba(34,208,122,.04)'; }
    showToast('✅ Screenshot pasted!', 'success');
  };
  reader.readAsDataURL(file);
}

// Handle file drop on drop zone
function handleJournalImgDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('jImgDrop');
  if (dz) { dz.style.borderColor = 'var(--border2)'; dz.style.background = ''; }
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) setJournalImg(file);
  else showToast('Please drop an image file', 'error');
}

// Handle file input selection
function handleJournalImgSelect(files) {
  if (files?.[0]) setJournalImg(files[0]);
}

// Set image from file (updates upload zone preview)
function setJournalImg(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    journalImgData = ev.target.result;
    journalImgMime = file.type;
    const thumb    = document.getElementById('jImgThumb');
    const preview  = document.getElementById('jImgPreview');
    const label    = document.getElementById('jImgLabel');
    const clearBtn = document.getElementById('jImgClear');
    if (thumb)    { thumb.src = journalImgData; }
    if (preview)  { preview.style.display = 'block'; }
    if (label)    { label.innerHTML = '✅ <strong style="color:var(--green)">' + file.name + '</strong> ready to save'; }
    if (clearBtn) { clearBtn.style.display = 'inline-block'; }
    showToast('✅ Screenshot ready!', 'success');
  };
  reader.readAsDataURL(file);
}

// Clear all image state
function clearJournalImg() {
  journalImgData = null;
  journalImgMime = 'image/jpeg';
  // Reset upload zone
  const preview  = document.getElementById('jImgPreview');
  const label    = document.getElementById('jImgLabel');
  const clearBtn = document.getElementById('jImgClear');
  const input    = document.getElementById('jImgInput');
  if (preview)  { preview.style.display = 'none'; }
  if (label)    { label.innerHTML = '📁 Drop screenshot here or <span style="color:var(--brand);text-decoration:underline">click to browse</span>'; }
  if (clearBtn) { clearBtn.style.display = 'none'; }
  if (input)    { input.value = ''; }
  // Reset paste zone
  const pasteThumb    = document.getElementById('jPasteThumb');
  const pastePreview  = document.getElementById('jPastePreview');
  const pasteLabel    = document.getElementById('jPasteLabel');
  const pasteZone     = document.getElementById('jPasteZone');
  if (pasteThumb)   { pasteThumb.src = ''; }
  if (pastePreview) { pastePreview.style.display = 'none'; }
  if (pasteLabel)   {
    pasteLabel.innerHTML = '📋 <strong style="color:var(--text)">Click here first</strong>, then press<br><span style="font-family:var(--f-mono);background:var(--bg);border:1px solid var(--border2);border-radius:4px;padding:2px 8px;font-size:.75rem">Ctrl + V</span> &nbsp;or&nbsp; <span style="font-family:var(--f-mono);background:var(--bg);border:1px solid var(--border2);border-radius:4px;padding:2px 8px;font-size:.75rem">⌘ + V</span> &nbsp;to paste your screenshot';
  }
  if (pasteZone) { pasteZone.style.borderColor = 'var(--border2)'; pasteZone.style.background = ''; }
}

async function saveJournalEntry() {
  if (!currentUser) { showToast('Sign in first', 'error'); return; }

  const date       = document.getElementById('jDate')?.value?.trim();
  const instrument = document.getElementById('jInstrument')?.value?.trim();
  const result     = document.getElementById('jResult')?.value?.trim();
  if (!date || !instrument || !result) {
    showToast('Date, instrument and result are required', 'error'); return;
  }

  const emotion    = activeJournalEmotions[activeFirm] || '';
  const reasonVal  = document.getElementById('jReason')?.value   || '';
  const wellVal    = document.getElementById('jWell')?.value     || '';
  const improveVal = document.getElementById('jImprove')?.value  || '';

  const selectedFirms = getSelectedJFirms();
  const firmsToSave   = selectedFirms.length > 0
    ? selectedFirms
    : [activeFirm === 'All' ? 'Other' : activeFirm];

  const saveBtn = document.getElementById('saveJournalBtn');
  if (saveBtn) { saveBtn.textContent = '⏳ Saving…'; saveBtn.disabled = true; }

  let supabaseSaved = 0;
  let localSaved    = 0;

  for (const firmVal of firmsToSave) {
    const payload = {
      user_id:          currentUser.id,
      date:             date,
      instrument:       instrument,
      result:           result,
      emotion:          emotion,
      reasoning:        reasonVal,
      went_well:        wellVal,
      improve:          improveVal,
      account_provider: firmVal
    };

    const { error } = await sb.from('journal_entries').insert(payload);

    if (!error) {
      supabaseSaved++;
    } else {
      console.error('Save error:', error.code, error.message, error.details, error.hint);
      // Show exact error on screen so user can see what Supabase is rejecting
      showToast('DB Error ' + (error.code||'') + ': ' + (error.message||'unknown'), 'error');

      // Try without account_provider if that column is the issue
      if ((error.code === '42703') || (error.message||'').includes('account_provider')) {
        const { error: e2 } = await sb.from('journal_entries').insert({
          user_id: currentUser.id, date, instrument, result, emotion,
          reasoning: reasonVal, went_well: wellVal, improve: improveVal
        });
        if (!e2) { supabaseSaved++; }
        else {
          console.error('Retry error:', e2.code, e2.message);
          // Save locally as last resort
          _saveLocalJournal({ date, instrument, result, emotion, reasoning: reasonVal, went_well: wellVal, improve: improveVal, account_provider: firmVal });
          localSaved++;
        }
      } else {
        _saveLocalJournal({ date, instrument, result, emotion, reasoning: reasonVal, went_well: wellVal, improve: improveVal, account_provider: firmVal });
        localSaved++;
      }
    }

    if (firmsToSave.length > 1) await new Promise(r => setTimeout(r, 100));
  }

  if (saveBtn) { saveBtn.textContent = '💾 Save Journal Entry'; saveBtn.disabled = false; }

  if (supabaseSaved === 0 && localSaved === 0) {
    showToast('Save failed completely — check console for error', 'error');
    return;
  }

  if (supabaseSaved > 0) {
    const msg = firmsToSave.length > 1
      ? `✅ Saved to ${firmsToSave.length} firms — synced across all devices`
      : `✅ Saved to ${firmsToSave[0]} — synced across all devices`;
    showToast(msg, 'success');
  } else {
    showToast(`⚠️ Saved locally only on this device (${localSaved} firm${localSaved>1?'s':''}). Supabase save failed — check console.`, 'error');
  }

  // Save screenshot locally
  if (journalImgData) {
    const imgKey = 'ts_jimg_' + date + '_' + instrument.replace(/\s/g, '');
    try { localStorage.setItem(imgKey, journalImgData); } catch(_) {}
    clearJournalImg();
  }

  // Reset form
  ['jReason','jWell','jImprove','jResult','jInstrument'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  activeJournalEmotions[activeFirm] = '';
  journalFormState = { open:false, date:'', instrument:'', result:'', emotion:'', reason:'', well:'', improve:'' };
  document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
  ['Deriv','FTMO','The5ers','Other'].forEach(f => {
    const cb    = document.getElementById('jfirm_' + f);
    const label = document.getElementById('jfirm_label_' + f);
    const tick  = document.getElementById('jfirm_check_' + f);
    const txt   = document.getElementById('jfirm_txt_'   + f);
    if (cb)    cb.checked = false;
    if (label) { label.style.background='var(--surface2)'; label.style.borderColor='var(--border)'; }
    if (tick)  { tick.textContent=''; tick.style.background='var(--bg)'; tick.style.borderColor='var(--border2)'; }
    if (txt)   { txt.style.color='var(--text-3)'; }
  });
  closeJournalModal();
  loadJournalEntries();
}

// Helper: save to localStorage
function _saveLocalJournal(entry) {
  const localJournal = JSON.parse(localStorage.getItem('ts_local_journal') || '[]');
  localJournal.unshift({
    id: 'local_' + Date.now() + '_' + (entry.account_provider||''),
    ...entry,
    created_at: new Date().toISOString(),
    _local: true
  });
  try { localStorage.setItem('ts_local_journal', JSON.stringify(localJournal)); } catch(_) {}
}


async function loadJournalEntries() {
  if (!currentUser) return;
  const firmMap = JSON.parse(localStorage.getItem('ts_jfirm') || '{}');

  // Load from Supabase — properly handle error (don't silently swallow it)
  let remoteData = [];
  const { data: rd, error: loadErr } = await sb
    .from('journal_entries')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (loadErr) {
    console.error('Journal load error:', loadErr);
    // Show error in the journal container so user knows what happened
    const container = document.getElementById('journalEntries');
    if (container) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not load journal</div>
        <div class="empty-sub" style="color:var(--red);font-family:var(--f-mono);font-size:.7rem">
          ${loadErr.message || 'Unknown error'} (${loadErr.code || ''})<br><br>
          <span style="color:var(--text-3)">Make sure you ran the SQL setup in Supabase.<br>
          Go to supabase.com → your project → SQL Editor and create the table.</span>
        </div>
      </div>`;
    }
    return;
  }
  remoteData = rd || [];

  // Merge with locally stored entries
  const localEntries = JSON.parse(localStorage.getItem('ts_local_journal') || '[]');
  const data = [...localEntries, ...remoteData];
  const container = document.getElementById('journalEntries');
  if (!container) return;
  if (!data?.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-title">No journal entries yet</div>
      <div class="empty-sub">Click <strong>+ New Entry</strong> to start journaling your trades.</div>
    </div>`;
    return;
  }
  // Filter by firm
  // Show ALL entries when activeFirm is 'All'
  // For specific firm: match account_provider OR firmMap OR show if no firm info at all
  const firmFiltered = (activeFirm === 'All') ? data : data.filter(e => {
    const dbFirm    = (e.account_provider || '').trim();
    const localFirm = (firmMap[e.date + '_' + e.instrument] || '').trim();
    if (dbFirm)    return dbFirm    === activeFirm;
    if (localFirm) return localFirm === activeFirm;
    return true; // No firm stored anywhere → always show
  });

  // If filtering hid ALL entries but data has entries → show a hint
  const hiddenCount = data.length - firmFiltered.length;
  const filtered = firmFiltered.filter(e => { if(activeJournalFilter==='all')return true; if(activeJournalFilter==='win')return e.result==='Win'; if(activeJournalFilter==='loss')return e.result==='Loss'; if(activeJournalFilter==='be')return e.result==='Break Even'; return true; });
  // If firm filter hid entries, show a helpful message
  if (firmFiltered.length === 0 && data.length > 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No entries for ${activeFirm}</div>
      <div class="empty-sub">You have ${data.length} journal ${data.length===1?'entry':'entries'} saved but none are tagged to ${activeFirm}.<br>Switch to <strong>All</strong> in the sidebar to see all your entries.</div>
      <button class="btn-primary" onclick="setFirm('All',document.querySelector('.acct-pill:last-child'))" style="width:auto;margin:0 auto;padding:8px 20px">View All Entries →</button>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map(e => {
    const badge   = e.result==='Win'?'badge-win':e.result==='Loss'?'badge-loss':'badge-be';
    const firm    = e.account_provider || firmMap[e.date+'_'+e.instrument] || '';
    const imgKey  = 'ts_jimg_'+e.date+'_'+(e.instrument||'').replace(/\s/g,'');
    const imgSrc  = localStorage.getItem(imgKey) || '';
    const hasBody = e.reasoning || e.went_well || e.improve || imgSrc;
    const entryJSON = JSON.stringify({id:e.id,date:e.date,instrument:e.instrument,result:e.result,emotion:e.emotion,reasoning:e.reasoning,went_well:e.went_well,improve:e.improve,account_provider:firm}).replace(/'/g,"&#39;");

    return `<div class="jentry-card" id="jcard-${e.id}" data-entry='${entryJSON}'>

      <!-- ── Collapsed header (always visible, click to expand) ── -->
      <div class="jentry-header" onclick="toggleJEntry('${e.id}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter'||event.key===' ')toggleJEntry('${e.id}')">
        <div class="jentry-header-left">
          <div class="jentry-chevron" id="jchev-${e.id}">▶</div>
          <div>
            <div class="jentry-date-line">${e.date}${firm?' · <span style="color:var(--text-3);font-size:.6rem">'+firm+'</span>':''}</div>
            <div class="jentry-instr-line">${e.instrument||'—'}</div>
          </div>
        </div>
        <div class="jentry-header-right">
          ${e.emotion?`<span class="jentry-emotion-pill">${e.emotion}</span>`:''}
          <span class="badge ${badge}">${e.result||'—'}</span>
          ${imgSrc?'<span style="font-size:.75rem" title="Has screenshot">📷</span>':''}
          <div class="jentry-actions" onclick="event.stopPropagation()">
            <button class="btn-sm btn-outline-sm" onclick="openEditJournal('${e.id}')" title="Edit">✏️</button>
            <button class="btn-sm btn-danger-sm" onclick="deleteJournalEntry('${e.id}')" title="Delete">🗑</button>
          </div>
        </div>
      </div>

      <!-- ── Expandable body ── -->
      <div class="jentry-body" id="jbody-${e.id}">
        <div class="jentry-body-inner">
          ${e.reasoning?`<div class="jentry-section"><div class="jentry-section-label">Why I Entered</div><div class="jentry-text">${e.reasoning}</div></div>`:''}
          ${e.went_well?`<div class="jentry-section"><div class="jentry-section-label">What Went Well</div><div class="jentry-text">${e.went_well}</div></div>`:''}
          ${e.improve?`<div class="jentry-section"><div class="jentry-section-label">What To Improve</div><div class="jentry-text">${e.improve}</div></div>`:''}
          ${imgSrc?`
          <div class="jentry-section">
            <div class="jentry-section-label">Screenshot</div>
            <div class="jentry-img-wrap" onclick="openImgLightbox('${imgKey}')" title="Click to enlarge">
              <img src="${imgSrc}" class="jentry-img-thumb" loading="lazy" alt="Trade screenshot"/>
              <div class="jentry-img-overlay">🔍 Click to enlarge</div>
            </div>
          </div>`:''}
          ${!hasBody?'<div style="font-size:.72rem;color:var(--text-3);padding:4px 0;font-style:italic">No notes added</div>':''}
        </div>
      </div>
    </div>`;
  }).join('') || `<div style="text-align:center;padding:24px;color:var(--text-3);font-size:.75rem">No ${activeJournalFilter} entries found.</div>`;
}
// ── Toggle journal entry expand/collapse ──
function toggleJEntry(id) {
  const body  = document.getElementById('jbody-'  + id);
  const chev  = document.getElementById('jchev-'  + id);
  const card  = document.getElementById('jcard-'  + id);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  if (isOpen) {
    body.classList.remove('open');
    body.style.maxHeight = '0';
    if (chev) { chev.textContent = '▶'; chev.style.transform = 'rotate(0deg)'; }
    card.classList.remove('expanded');
  } else {
    body.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 200 + 'px';
    if (chev) { chev.textContent = '▶'; chev.style.transform = 'rotate(90deg)'; }
    card.classList.add('expanded');
    // Recalculate height after images load
    const imgs = body.querySelectorAll('img');
    imgs.forEach(img => {
      if (!img.complete) img.onload = () => { body.style.maxHeight = body.scrollHeight + 200 + 'px'; };
    });
  }
}

// ── Image lightbox ──
let _lbZoom = 1, _lbDrag = false, _lbLast = {x:0, y:0}, _lbOffset = {x:0, y:0};

function openImgLightbox(imgKey) {
  const imgSrc = localStorage.getItem(imgKey);
  if (!imgSrc) return;

  let lb = document.getElementById('imgLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'imgLightbox';
    lb.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:zoom-in;user-select:none';
    lb.innerHTML = `
      <div id="lbInner" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%">
        <img id="lbImg" style="max-width:90vw;max-height:88vh;border-radius:8px;transform-origin:center;transition:transform .2s ease;cursor:grab;box-shadow:0 20px 60px rgba(0,0,0,.8)" draggable="false"/>
        <!-- Controls -->
        <div style="position:fixed;top:16px;right:16px;display:flex;gap:8px;z-index:501">
          <button onclick="lbZoom(1)" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;width:40px;height:40px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s" title="Zoom in">+</button>
          <button onclick="lbZoom(-1)" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;width:40px;height:40px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s" title="Zoom out">−</button>
          <button onclick="lbReset()" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;width:40px;height:40px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center" title="Reset zoom">⤢</button>
          <button onclick="closeImgLightbox()" style="background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);color:#ff6b6b;border-radius:8px;width:40px;height:40px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center" title="Close">✕</button>
        </div>
        <!-- Zoom hint -->
        <div id="lbHint" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:rgba(255,255,255,.6);padding:6px 16px;border-radius:20px;font-size:.7rem;font-family:'Space Mono',monospace;pointer-events:none">
          Scroll or +/− to zoom · Drag to pan · Click outside to close
        </div>
        <div id="lbZoomBadge" style="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;padding:4px 12px;border-radius:10px;font-size:.7rem;font-family:'Space Mono',monospace;opacity:0;transition:opacity .3s;pointer-events:none">100%</div>
      </div>`;

    // Click backdrop to close
    lb.addEventListener('click', (ev) => { if (ev.target === lb || ev.target === document.getElementById('lbInner')) closeImgLightbox(); });

    // Mouse wheel zoom
    lb.addEventListener('wheel', (ev) => { ev.preventDefault(); lbZoom(ev.deltaY < 0 ? 1 : -1, 0.15); }, { passive: false });

    // Drag to pan
    const img = lb.querySelector('#lbImg');
    img.addEventListener('mousedown', lbDragStart);
    img.addEventListener('touchstart', lbDragStart, { passive: true });
    document.addEventListener('mousemove', lbDragMove);
    document.addEventListener('touchmove', lbDragMove, { passive: false });
    document.addEventListener('mouseup', lbDragEnd);
    document.addEventListener('touchend', lbDragEnd);

    document.body.appendChild(lb);
  }

  // Reset state
  _lbZoom = 1; _lbOffset = {x:0, y:0}; _lbDrag = false;
  document.getElementById('lbImg').src = imgSrc;
  document.getElementById('lbImg').style.transform = 'translate(0,0) scale(1)';
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Re-attach keyboard handler each open (was removed on close)
  document.removeEventListener('keydown', lbKeyHandler);
  document.addEventListener('keydown', lbKeyHandler);
  setTimeout(() => { document.getElementById('lbHint').style.opacity = '1'; setTimeout(() => { const h = document.getElementById('lbHint'); if(h) h.style.opacity='0'; }, 3000); }, 200);
}

function closeImgLightbox() {
  const lb = document.getElementById('imgLightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
  document.removeEventListener('keydown', lbKeyHandler);
}

function lbKeyHandler(ev) {
  if (ev.key === 'Escape') closeImgLightbox();
  if (ev.key === '=' || ev.key === '+') lbZoom(1);
  if (ev.key === '-') lbZoom(-1);
  if (ev.key === '0') lbReset();
}

function lbZoom(dir, step = 0.25) {
  _lbZoom = Math.max(0.5, Math.min(6, _lbZoom + dir * step));
  lbApplyTransform();
  const badge = document.getElementById('lbZoomBadge');
  if (badge) {
    badge.textContent = Math.round(_lbZoom * 100) + '%';
    badge.style.opacity = '1';
    clearTimeout(badge._t);
    badge._t = setTimeout(() => { badge.style.opacity = '0'; }, 1200);
  }
}

function lbReset() {
  _lbZoom = 1; _lbOffset = {x:0, y:0};
  lbApplyTransform();
}

function lbApplyTransform() {
  const img = document.getElementById('lbImg');
  if (img) {
    img.style.transform = `translate(${_lbOffset.x}px, ${_lbOffset.y}px) scale(${_lbZoom})`;
    img.style.cursor = _lbZoom > 1 ? 'grab' : 'zoom-in';
  }
}

function lbDragStart(ev) {
  if (_lbZoom <= 1) return;
  _lbDrag = true;
  const pt = ev.touches ? ev.touches[0] : ev;
  _lbLast = { x: pt.clientX - _lbOffset.x, y: pt.clientY - _lbOffset.y };
  document.getElementById('lbImg').style.cursor = 'grabbing';
  document.getElementById('lbImg').style.transition = 'none';
}

function lbDragMove(ev) {
  if (!_lbDrag) return;
  if (ev.cancelable) ev.preventDefault();
  const pt = ev.touches ? ev.touches[0] : ev;
  _lbOffset.x = pt.clientX - _lbLast.x;
  _lbOffset.y = pt.clientY - _lbLast.y;
  const img = document.getElementById('lbImg');
  if (img) img.style.transform = `translate(${_lbOffset.x}px,${_lbOffset.y}px) scale(${_lbZoom})`;
}

function lbDragEnd() {
  if (!_lbDrag) return;
  _lbDrag = false;
  const img = document.getElementById('lbImg');
  if (img) { img.style.cursor = 'grab'; img.style.transition = 'transform .1s ease'; }
}

// ── Pinch to zoom (mobile) ──
let _lbPinchDist = 0;
document.addEventListener('touchstart', ev => {
  if (!document.getElementById('imgLightbox') || document.getElementById('imgLightbox').style.display === 'none') return;
  if (ev.touches.length === 2) {
    _lbPinchDist = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
  }
}, { passive: true });
document.addEventListener('touchmove', ev => {
  if (!document.getElementById('imgLightbox') || document.getElementById('imgLightbox').style.display === 'none') return;
  if (ev.touches.length === 2) {
    const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
    const delta = (d - _lbPinchDist) * 0.01;
    _lbPinchDist = d;
    _lbZoom = Math.max(0.5, Math.min(6, _lbZoom + delta));
    lbApplyTransform();
  }
}, { passive: true });

// ── Open edit modal ──
function openEditJournal(id) {
  // Read entry data from the card's data attribute — no extra DB call needed
  const card = document.getElementById('jcard-' + id);
  if (!card) { showToast('Entry not found', 'error'); return; }
  let entry;
  try { entry = JSON.parse(card.getAttribute('data-entry').replace(/&#39;/g,"'")); }
  catch(e) { showToast('Could not read entry', 'error'); return; }

  // Build the edit modal HTML
  const instruments = [...new Set(getTradesForFirm(activeFirm).map(t => t.instrument).filter(Boolean))];
  const instOpts = `<option value="">Select…</option>` +
    instruments.map(i => `<option value="${i}" style="background:#131c28;color:#e8edf5" ${entry.instrument===i?'selected':''}>${i}</option>`).join('') +
    `<option value="Other" style="background:#131c28;color:#e8edf5" ${entry.instrument==='Other'?'selected':''}>Other</option>`;
  const resultOpts = ['Win','Loss','Break Even'].map(r =>
    `<option value="${r}" style="background:#131c28;color:#e8edf5" ${entry.result===r?'selected':''}>${r}</option>`).join('');
  const emotions = ['😌 Calm','💪 Confident','😰 FOMO','😤 Revenge','😟 Anxious','😑 Bored'];
  const emotionBtns = emotions.map(em =>
    `<button class="emotion-btn ${entry.emotion===em?'selected':''}" onclick="selectEditEmotion(this,'${em.replace(/'/g,"\'")}')">${em}</button>`
  ).join('');
  // Show existing screenshot
  const imgKey = 'ts_jimg_' + (entry.date||'') + '_' + (entry.instrument||'').replace(/\s/g,'');
  const existingImg = localStorage.getItem(imgKey);

  // Create or reuse modal overlay
  let overlay = document.getElementById('editJournalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'editJournalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
    overlay.onclick = (e) => { if (e.target === overlay) closeEditJournal(); };
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="background:var(--surface);border:1.5px solid var(--border2);border-radius:14px;width:700px;max-width:100%;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,.7);animation:scaleIn .22s ease both">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);background:var(--surface2);border-radius:14px 14px 0 0">
        <div>
          <div style="font-family:var(--f-disp);font-size:1.2rem;font-weight:800;color:var(--text)">Edit Journal Entry</div>
          <div style="font-size:.68rem;color:var(--text-3);margin-top:2px;font-family:var(--f-mono)">${entry.instrument||'—'} · ${entry.date||'—'}</div>
        </div>
        <button onclick="closeEditJournal()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:22px;line-height:1;padding:4px">✕</button>
      </div>

      <!-- Body -->
      <div style="padding:20px;display:flex;flex-direction:column;gap:16px">

        <!-- Date / Instrument / Result -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="field-group">
            <label class="field-label">Date</label>
            <input type="date" class="field-input" id="ej_date" value="${entry.date||''}"/>
          </div>
          <div class="field-group">
            <label class="field-label">Instrument</label>
            <select class="field-input" id="ej_instrument" style="background:var(--bg);color:var(--text)">${instOpts}</select>
          </div>
          <div class="field-group">
            <label class="field-label">Result</label>
            <select class="field-input" id="ej_result" style="background:var(--bg);color:var(--text)">
              <option value="" style="background:#131c28">Select…</option>
              ${resultOpts}
            </select>
          </div>
        </div>

        <!-- Emotion -->
        <div class="field-group">
          <label class="field-label">Emotion Before Trade</label>
          <div class="emotion-grid" id="editEmotionGrid" style="margin-top:6px">${emotionBtns}</div>
        </div>

        <!-- Notes -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="field-group">
            <label class="field-label">Why I Entered</label>
            <textarea class="field-input field-textarea" id="ej_reason" style="min-height:90px" placeholder="Setup, confluences…">${entry.reasoning||''}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">What Went Well</label>
            <textarea class="field-input field-textarea" id="ej_well" style="min-height:90px" placeholder="Discipline, execution…">${entry.went_well||''}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">What To Improve</label>
            <textarea class="field-input field-textarea" id="ej_improve" style="min-height:90px" placeholder="Mistakes, lessons…">${entry.improve||''}</textarea>
          </div>
        </div>

        <!-- Screenshot -->
        <div class="field-group">
          <label class="field-label">Trade Screenshot</label>
          <div id="ej_imgDrop" style="border:2px dashed var(--border2);border-radius:8px;padding:16px;text-align:center;cursor:pointer;transition:all .2s"
            onclick="document.getElementById('ej_imgInput').click()"
            ondragover="event.preventDefault();this.style.borderColor='var(--brand)'"
            ondragleave="this.style.borderColor='var(--border2)'"
            ondrop="handleEditImgDrop(event,'${entry.date||''}','${(entry.instrument||'').replace(/'/g,'')}')" >
            ${existingImg
              ? `<img src="${existingImg}" style="max-height:140px;max-width:100%;border-radius:6px;margin-bottom:6px" id="ej_imgThumb"/>
                 <div style="font-size:.7rem;color:var(--green)">✓ Screenshot attached — click/drop to replace</div>`
              : `<div style="font-size:.75rem;color:var(--text-3)">📷 Drop screenshot or tap to upload</div>`
            }
          </div>
          <input type="file" id="ej_imgInput" accept="image/*" style="display:none"
            onchange="handleEditImgSelect(this.files,'${entry.date||''}','${(entry.instrument||'').replace(/'/g,'')}')"/>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn-ghost" onclick="closeEditJournal()" style="flex:1">Cancel</button>
          <button class="btn-primary" onclick="saveEditJournal('${id}')" style="flex:2;width:auto">💾 Save Changes</button>
        </div>
      </div>
    </div>
  `;

  overlay.style.display = 'flex';
  // Store current edit emotion
  window._editEmotion = entry.emotion || '';
  document.getElementById('ej_date').focus();
}

function closeEditJournal() {
  const overlay = document.getElementById('editJournalOverlay');
  if (overlay) overlay.style.display = 'none';
}

function selectEditEmotion(btn, em) {
  document.querySelectorAll('#editEmotionGrid .emotion-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._editEmotion = em;
}

function handleEditImgDrop(e, date, instrument) {
  e.preventDefault();
  document.getElementById('ej_imgDrop').style.borderColor = 'var(--border2)';
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) applyEditImg(file, date, instrument);
}
function handleEditImgSelect(files, date, instrument) {
  if (files?.[0]) applyEditImg(files[0], date, instrument);
}
function applyEditImg(file, date, instrument) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    // Store new image
    const imgKey = 'ts_jimg_' + date + '_' + instrument.replace(/\s/g,'');
    try { localStorage.setItem(imgKey, ev.target.result); } catch(e) {}
    // Update preview
    const thumb = document.getElementById('ej_imgThumb');
    const drop  = document.getElementById('ej_imgDrop');
    if (thumb) { thumb.src = ev.target.result; }
    else if (drop) {
      drop.innerHTML = `<img src="${ev.target.result}" style="max-height:140px;max-width:100%;border-radius:6px;margin-bottom:6px" id="ej_imgThumb"/>
        <div style="font-size:.7rem;color:var(--green)">✓ Screenshot updated</div>`;
    }
  };
  reader.readAsDataURL(file);
}

// ── Save edit ──
async function saveEditJournal(id) {
  const date       = document.getElementById('ej_date')?.value;
  const instrument = document.getElementById('ej_instrument')?.value;
  const result     = document.getElementById('ej_result')?.value;
  const emotion    = window._editEmotion || '';
  const reasoning  = document.getElementById('ej_reason')?.value   || '';
  const went_well  = document.getElementById('ej_well')?.value     || '';
  const improve    = document.getElementById('ej_improve')?.value  || '';

  if (!date || !instrument || !result) {
    showToast('Date, instrument and result are required', 'error'); return;
  }

  const btn = document.querySelector('#editJournalOverlay .btn-primary');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  const updates = { date, instrument, result, emotion, reasoning, went_well, improve };

  let saved = false;

  // ── Update local entry if it's a local one ──
  if (String(id).startsWith('local_')) {
    const localEntries = JSON.parse(localStorage.getItem('ts_local_journal') || '[]');
    const idx = localEntries.findIndex(e => e.id === id);
    if (idx !== -1) {
      localEntries[idx] = { ...localEntries[idx], ...updates };
      try { localStorage.setItem('ts_local_journal', JSON.stringify(localEntries)); saved = true; } catch(e) {}
    }
  }

  // ── Update in Supabase (remote entry) ──
  if (!saved && currentUser) {
    const { error } = await sb.from('journal_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (!error) {
      saved = true;
    } else {
      // Try without emotion if column doesn't exist
      const { date: d2, instrument: i2, result: r2, reasoning: rs2, went_well: w2, improve: im2 } = updates;
      const { error: e2 } = await sb.from('journal_entries')
        .update({ date: d2, instrument: i2, result: r2, reasoning: rs2, went_well: w2, improve: im2 })
        .eq('id', id)
        .eq('user_id', currentUser.id);
      if (!e2) saved = true;
    }
  }

  if (btn) { btn.textContent = '💾 Save Changes'; btn.disabled = false; }

  if (saved) {
    showToast('Entry updated successfully!', 'success');
    closeEditJournal();
    loadJournalEntries();
  } else {
    showToast('Could not update entry. Try again.', 'error');
  }
}

// ── Delete entry ──
async function deleteJournalEntry(id) {
  if (!confirm('Delete this journal entry? This cannot be undone.')) return;

  // Delete from local storage if local entry
  if (String(id).startsWith('local_')) {
    const localEntries = JSON.parse(localStorage.getItem('ts_local_journal') || '[]');
    const filtered = localEntries.filter(e => e.id !== id);
    localStorage.setItem('ts_local_journal', JSON.stringify(filtered));
    showToast('Entry deleted.', 'success');
    loadJournalEntries();
    return;
  }

  // Delete from Supabase
  if (!currentUser) return;
  const { error } = await sb.from('journal_entries').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('Entry deleted.', 'success');
  loadJournalEntries();
}

// ══ CALENDAR ══
function renderCalendar(trades) {
  const c = document.getElementById('pageContent');
  if (!trades.length) { c.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No trades to display</div><div class="empty-sub">Import trades to see your performance calendar.</div></div>`; return; }
  const dayMap = {};
  trades.forEach(t => { if(!t.date) return; const d=t.date.slice(0,10); if(!dayMap[d])dayMap[d]={pnl:0,wins:0,losses:0,count:0}; const _p1693=parseFloat(t.profit_loss||0); dayMap[d].pnl+=_p1693; dayMap[d].count++; if(_p1693>0)dayMap[d].wins++;else if(_p1693<0)dayMap[d].losses++; });
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

    </div>
  `;
}

// ══ OBJECTIVES ══
// FTMO logic:
// - Daily loss limit = % of INITIAL balance (not current equity)
// - Max overall loss = % of INITIAL balance
// - Profit target    = % of INITIAL balance
// - Daily loss = sum of all closed trades on that specific day
// - A "breach" = hitting the limit, not going past it
function renderObjectives(trades) {
  const c = document.getElementById('pageContent');
  const firm = activeFirm === 'All' ? 'FTMO' : activeFirm;
  const settingsKey = 'ts_obj_' + firm;
  const saved = JSON.parse(localStorage.getItem(settingsKey) || 'null');

  // FTMO standard defaults (based on official FTMO rules)
  const DEFAULTS = {
    FTMO:    { balance: 100000, dailyLoss: 5,  maxLoss: 10, profitTarget: 10, minDays: 4 },
    Deriv:   { balance: 10000,  dailyLoss: 5,  maxLoss: 10, profitTarget: 10, minDays: 2 },
    The5ers: { balance: 80000,  dailyLoss: 4,  maxLoss: 8,  profitTarget: 8,  minDays: 3 },
    Other:   { balance: 10000,  dailyLoss: 5,  maxLoss: 10, profitTarget: 10, minDays: 2 }
  };
  const cfg = saved || DEFAULTS[firm] || DEFAULTS.FTMO;

  // ── Core calculations (FTMO-accurate) ──
  // cfg.balance = the initial account balance (what you started with)
  const initialBal    = parseFloat(cfg.balance)  || 100000;
  const dailyLossPct  = parseFloat(cfg.dailyLoss)  / 100;  // e.g. 0.05 for 5%
  const maxLossPct    = parseFloat(cfg.maxLoss)     / 100;  // e.g. 0.10 for 10%
  const profitTgtPct  = parseFloat(cfg.profitTarget)/ 100;  // e.g. 0.10 for 10%

  // Dollar limits (calculated from INITIAL balance — FTMO standard)
  const dailyLossLimit = initialBal * dailyLossPct;   // e.g. $5,000 for 100k/5%
  const maxLossLimit   = initialBal * maxLossPct;     // e.g. $10,000 for 100k/10%
  const profitTarget   = initialBal * profitTgtPct;   // e.g. $10,000 for 100k/10%

  // Total net P&L
  const netPnl = trades.reduce((s, t) => s + parseFloat(t.profit_loss || 0), 0);
  const equity = initialBal + netPnl;

  // Build daily P&L map
  const dayMap = {};
  trades.forEach(t => {
    if (!t.date) return;
    const d = t.date.slice(0, 10);
    if (!dayMap[d]) dayMap[d] = { pnl: 0, count: 0 };
    dayMap[d].pnl   += parseFloat(t.profit_loss || 0);
    dayMap[d].count += 1;
  });

  const tradingDays = Object.keys(dayMap).length;
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayPnl    = dayMap[todayStr]?.pnl || 0;

  // Worst single day loss (most negative day P&L)
  const dayPnls = Object.values(dayMap).map(d => d.pnl);
  const worstDayPnl = dayPnls.length ? Math.min(...dayPnls) : 0;
  // Only count it as a loss figure if it's negative
  const worstDayLoss = Math.abs(Math.min(0, worstDayPnl)); // positive number = amount lost

  // Total drawdown from initial balance (only losses count)
  const totalLossAmt = Math.abs(Math.min(0, netPnl)); // positive number = amount lost

  // ── Pass/Fail (FTMO rules) ──
  // PASS = you have NOT breached the limit
  const passDays      = tradingDays >= cfg.minDays;
  const passDailyLoss = worstDayLoss < dailyLossLimit;   // < not <=  (breach = reaching the limit)
  const passMaxLoss   = totalLossAmt < maxLossLimit;      // < not <=
  const passProfit    = netPnl       >= profitTarget;     // must reach or exceed target

  // ── Discipline Score ──
  // Based on how far you are from breaching each limit (proximity scoring)
  // If 0% used → full points. If 100% used → 0 points.
  const dailyUsedPct  = worstDayLoss > 0 ? Math.min(1, worstDayLoss / dailyLossLimit) : 0;
  const maxUsedPct    = totalLossAmt > 0 ? Math.min(1, totalLossAmt / maxLossLimit)   : 0;
  const profitProgress = Math.min(1, Math.max(0, netPnl / profitTarget));
  const daysProgress   = Math.min(1, tradingDays / cfg.minDays);

  // Score components (40 pts risk discipline, 40 pts profit progress, 20 pts days)
  const riskScore    = Math.round(((1 - dailyUsedPct) * 20) + ((1 - maxUsedPct) * 20));
  const profitScore  = Math.round(profitProgress * 40);
  const daysScore    = Math.round(daysProgress   * 20);
  const score        = Math.min(100, riskScore + profitScore + daysScore);

  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
  const scoreColor = score >= 80 ? '#22d07a'   : score >= 60 ? '#f5a623' : '#f54b5e';

  // ── Today's remaining permitted loss ──
  // FTMO: you can lose up to dailyLossLimit per day
  // If today is negative, remaining = dailyLossLimit - |todayLoss|
  const todayLoss = Math.abs(Math.min(0, todayPnl));
  const todayPermittedRemaining = Math.max(0, dailyLossLimit - todayLoss);

  // ── Max permitted loss remaining (overall) ──
  const maxPermittedRemaining = Math.max(0, maxLossLimit - totalLossAmt);

  // ── Daily summary (last 7 days) ──
  const sortedDays = Object.keys(dayMap).sort().reverse().slice(0, 10);

  // ── Format helpers ──
  const fmt  = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const fmtS = (n) => (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
  const pct  = (n) => (n * 100).toFixed(1) + '%';

  c.innerHTML = `
  <!-- Settings row -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap">
    <div style="font-size:.78rem;color:var(--text-3)">Account limits for</div>
    <strong style="color:var(--brand);font-size:.9rem">${firm}</strong>
    <div style="font-family:var(--f-mono);font-size:.65rem;color:var(--text-3)">
      Balance: <strong style="color:var(--text)">${fmt(initialBal)}</strong> ·
      Daily limit: <strong style="color:var(--red)">${pct(dailyLossPct)}</strong> ·
      Max loss: <strong style="color:var(--red)">${pct(maxLossPct)}</strong> ·
      Target: <strong style="color:var(--green)">${pct(profitTgtPct)}</strong>
    </div>
    <button class="btn-sm btn-outline-sm" onclick="toggleObjSettings()">⚙ Edit</button>
  </div>

  <!-- Settings Panel -->
  <div id="objSettingsPanel" style="display:none;margin-bottom:18px">
    <div class="chart-card">
      <div class="chart-card-header">
        <div class="chart-card-title">⚙ Configure ${firm} Account Limits</div>
        <button onclick="toggleObjSettings()" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:18px">✕</button>
      </div>
      <div class="chart-body">
        <div style="background:rgba(79,142,247,.07);border:1px solid rgba(79,142,247,.2);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-family:var(--f-mono);font-size:.68rem;color:var(--brand-l);line-height:1.8">
          <strong>How FTMO limits work:</strong><br>
          All limits are based on your <strong>initial account balance</strong>.<br>
          Daily Loss Limit 5% on $100k = you cannot lose more than $5,000 in one day.<br>
          Max Loss 10% on $100k = total drawdown cannot exceed $10,000.<br>
          Profit Target 10% on $100k = you need to make $10,000.
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
          <div class="field-group">
            <label class="field-label">Initial Account Balance ($)</label>
            <input type="number" class="field-input" id="cfg_balance" value="${cfg.balance}" placeholder="e.g. 100000"/>
            <div style="font-size:.6rem;color:var(--text-3);margin-top:3px">Starting balance — never changes</div>
          </div>
          <div class="field-group">
            <label class="field-label">Daily Loss Limit (%)</label>
            <input type="number" class="field-input" id="cfg_daily" value="${cfg.dailyLoss}" placeholder="e.g. 5" step="0.1" min="0.1" max="20"/>
            <div style="font-size:.6rem;color:var(--text-3);margin-top:3px">FTMO standard: 5% = $${(initialBal*0.05).toLocaleString()} on $${initialBal.toLocaleString()}</div>
          </div>
          <div class="field-group">
            <label class="field-label">Max Overall Loss (%)</label>
            <input type="number" class="field-input" id="cfg_max" value="${cfg.maxLoss}" placeholder="e.g. 10" step="0.1" min="0.1" max="30"/>
            <div style="font-size:.6rem;color:var(--text-3);margin-top:3px">FTMO standard: 10% = $${(initialBal*0.10).toLocaleString()}</div>
          </div>
          <div class="field-group">
            <label class="field-label">Profit Target (%)</label>
            <input type="number" class="field-input" id="cfg_profit" value="${cfg.profitTarget}" placeholder="e.g. 10" step="0.1" min="0.1" max="50"/>
            <div style="font-size:.6rem;color:var(--text-3);margin-top:3px">FTMO standard: 10% = $${(initialBal*0.10).toLocaleString()}</div>
          </div>
          <div class="field-group">
            <label class="field-label">Min Trading Days</label>
            <input type="number" class="field-input" id="cfg_days" value="${cfg.minDays}" placeholder="e.g. 4" min="1" max="30"/>
            <div style="font-size:.6rem;color:var(--text-3);margin-top:3px">FTMO Phase 1: 4 minimum days</div>
          </div>
        </div>
        <button class="btn-sm btn-success-sm" onclick="saveObjSettings('${firm}')" style="padding:10px 24px">Save Limits</button>
      </div>
    </div>
  </div>

  <!-- Top: Gauge + Objectives -->
  <div style="display:grid;grid-template-columns:320px 1fr;gap:16px;margin-bottom:14px;align-items:start">

    <!-- Discipline Score Gauge -->
    <div class="chart-card">
      <div class="chart-card-header">
        <div class="chart-card-title">Discipline Score</div>
        <div style="display:flex;gap:8px;font-family:var(--f-mono);font-size:.56rem">
          <span style="color:var(--red)">● 0–30</span>
          <span style="color:var(--amber)">● 30–80</span>
          <span style="color:var(--green)">● 80–100</span>
        </div>
      </div>
      <div class="chart-body" style="display:flex;flex-direction:column;align-items:center;padding:16px 20px">
        <div style="position:relative;width:200px;height:115px">
          <canvas id="gaugeCanvas" width="200" height="115"></canvas>
          <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center">
            <div style="font-family:var(--f-disp);font-size:2.2rem;font-weight:800;color:${scoreColor};line-height:1">${score}%</div>
            <div style="font-family:var(--f-mono);font-size:.65rem;color:${scoreColor};margin-top:2px">${scoreLabel}</div>
          </div>
        </div>
        <div style="width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
            <div style="font-family:var(--f-mono);font-size:.52rem;color:var(--text-3);margin-bottom:4px;text-transform:uppercase">Equity</div>
            <div style="font-family:var(--f-disp);font-size:.9rem;font-weight:800;color:${netPnl>=0?'var(--green)':'var(--red)'}">${fmt(equity)}</div>
            <div style="font-family:var(--f-mono);font-size:.55rem;color:var(--text-3);margin-top:2px">${fmtS(netPnl)}</div>
          </div>
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
            <div style="font-family:var(--f-mono);font-size:.52rem;color:var(--text-3);margin-bottom:4px;text-transform:uppercase">Balance</div>
            <div style="font-family:var(--f-disp);font-size:.9rem;font-weight:800;color:var(--text)">${fmt(initialBal)}</div>
            <div style="font-family:var(--f-mono);font-size:.55rem;color:var(--text-3);margin-top:2px">Initial</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Objectives Table -->
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">Objectives</div><div style="font-family:var(--f-mono);font-size:.6rem;color:var(--text-3)">Based on ${fmt(initialBal)} initial balance</div></div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Trading Objective</th>
              <th>Limit</th>
              <th>Your Result</th>
              <th style="text-align:center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${objRow(
              'Minimum Trading Days',
              cfg.minDays + ' days',
              tradingDays + ' day' + (tradingDays !== 1 ? 's' : ''),
              passDays,
              tradingDays + '/' + cfg.minDays
            )}
            ${objRow(
              'Max Daily Loss: -' + fmt(dailyLossLimit) + ' (-' + pct(dailyLossPct) + ')',
              '-' + fmt(dailyLossLimit),
              worstDayLoss > 0 ? '-' + fmt(worstDayLoss) + ' (-' + (worstDayLoss/initialBal*100).toFixed(2) + '%)' : '$0.00 (0%)',
              passDailyLoss,
              (dailyUsedPct*100).toFixed(0) + '% used'
            )}
            ${objRow(
              'Max Overall Loss: -' + fmt(maxLossLimit) + ' (-' + pct(maxLossPct) + ')',
              '-' + fmt(maxLossLimit),
              totalLossAmt > 0 ? '-' + fmt(totalLossAmt) + ' (-' + (totalLossAmt/initialBal*100).toFixed(2) + '%)' : '$0.00 (0%)',
              passMaxLoss,
              (maxUsedPct*100).toFixed(0) + '% used'
            )}
            ${objRow(
              'Profit Target: +' + fmt(profitTarget) + ' (+' + pct(profitTgtPct) + ')',
              '+' + fmt(profitTarget),
              fmtS(netPnl) + ' (' + (netPnl/initialBal*100).toFixed(2) + '%)',
              passProfit,
              (profitProgress*100).toFixed(0) + '% done'
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Quick stats (FTMO style 3-box) -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
    <div style="background:var(--surface);border:1.5px solid ${todayPermittedRemaining < dailyLossLimit*0.3?'var(--red-br,rgba(245,75,94,.3))':'var(--border)'};border-radius:var(--r);padding:16px;text-align:center;transition:border-color .2s">
      <div style="font-size:.68rem;color:var(--text-3);margin-bottom:6px;font-family:var(--f-mono)">Today's Permitted Loss ℹ</div>
      <div style="font-family:var(--f-disp);font-size:1.4rem;font-weight:800;color:${todayPermittedRemaining<dailyLossLimit*0.3?'var(--red)':'var(--green)'}">-$${todayPermittedRemaining.toFixed(2)}</div>
      <div style="font-size:.62rem;color:var(--text-3);margin-top:4px;font-family:var(--f-mono)">Used: $${todayLoss.toFixed(2)} of $${dailyLossLimit.toFixed(2)}</div>
    </div>
    <div style="background:var(--surface);border:1.5px solid ${maxPermittedRemaining<maxLossLimit*0.3?'var(--red-br,rgba(245,75,94,.3))':'var(--border)'};border-radius:var(--r);padding:16px;text-align:center">
      <div style="font-size:.68rem;color:var(--text-3);margin-bottom:6px;font-family:var(--f-mono)">Max Permitted Loss Remaining</div>
      <div style="font-family:var(--f-disp);font-size:1.4rem;font-weight:800;color:${maxPermittedRemaining<maxLossLimit*0.3?'var(--red)':'var(--text)'}">$${maxPermittedRemaining.toFixed(2)}</div>
      <div style="font-size:.62rem;color:var(--text-3);margin-top:4px;font-family:var(--f-mono)">Used: $${totalLossAmt.toFixed(2)} of $${maxLossLimit.toFixed(2)}</div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);padding:16px;text-align:center">
      <div style="font-size:.68rem;color:var(--text-3);margin-bottom:6px;font-family:var(--f-mono)">Today's Profit / Loss</div>
      <div style="font-family:var(--f-disp);font-size:1.4rem;font-weight:800;color:${todayPnl>=0?'var(--green)':'var(--red)'}">${todayPnl>=0?'+$':'-$'}${Math.abs(todayPnl).toFixed(2)}</div>
      <div style="font-size:.62rem;color:var(--text-3);margin-top:4px;font-family:var(--f-mono)">${dayMap[todayStr]?.count||0} trade${(dayMap[todayStr]?.count||0)!==1?'s':''} today</div>
    </div>
  </div>

  <!-- Progress to profit target (visual bar) -->
  <div class="chart-card" style="margin-bottom:14px">
    <div class="chart-card-header">
      <div>
        <div class="chart-card-title">Progress to Profit Target</div>
        <div class="chart-card-sub">${fmtS(netPnl)} of ${fmt(profitTarget)} target · ${(profitProgress*100).toFixed(1)}% complete</div>
      </div>
      <span class="chart-badge ${passProfit?'cb-green':'cb-blue'}">${passProfit?'✓ TARGET HIT':Math.round(profitProgress*100)+'% there'}</span>
    </div>
    <div class="chart-body">
      <div style="height:14px;background:var(--border2);border-radius:8px;overflow:hidden;margin-bottom:8px;position:relative">
        <div style="height:100%;width:${Math.min(100,Math.max(0,profitProgress*100)).toFixed(1)}%;background:${passProfit?'var(--green)':'linear-gradient(90deg,var(--brand),var(--green))'};border-radius:8px;transition:width 1.4s cubic-bezier(.4,0,.2,1)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:.62rem;color:var(--text-3)">
        <span>$0 (0%)</span>
        <span style="color:${netPnl>=0?'var(--green)':'var(--red)'}">Current: ${fmtS(netPnl)} (${(netPnl/initialBal*100).toFixed(2)}%)</span>
        <span>Target: +${fmt(profitTarget)} (+${pct(profitTgtPct)})</span>
      </div>
    </div>
  </div>

  <!-- Bottom: Statistics + Daily Summary -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

    <!-- Statistics -->
    <div class="chart-card">
      <div class="chart-card-header"><div class="chart-card-title">Statistics</div></div>
      <div class="chart-body" style="padding:0">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border)">
          ${statCell('Win Rate',      calcStats(trades).wr.toFixed(2)+'%',          calcStats(trades).wr>=50?'var(--green)':'var(--red)')}
          ${statCell('Average Profit','$'+calcStats(trades).aw.toFixed(2),          'var(--green)')}
          ${statCell('Average Loss',  '-$'+Math.abs(calcStats(trades).al).toFixed(2),'var(--red)')}
          ${statCell('No. of Trades', calcStats(trades).total+'',                   'var(--text)')}
          ${statCell('Profit Factor', calcStats(trades).pf>=99?'∞':calcStats(trades).pf.toFixed(2), calcStats(trades).pf>=1.5?'var(--green)':'var(--red)')}
          ${statCell('Expectancy',    (calcStats(trades).exp>=0?'+$':'-$')+Math.abs(calcStats(trades).exp).toFixed(2), calcStats(trades).exp>=0?'var(--green)':'var(--red)')}
          ${statCell('Avg RRR',       calcStats(trades).rrr.toFixed(2),             'var(--amber)')}
          ${statCell('Net P&L',       (netPnl>=0?'+$':'-$')+Math.abs(netPnl).toFixed(2), netPnl>=0?'var(--green)':'var(--red)')}
        </div>
      </div>
    </div>

    <!-- Daily Summary -->
    <div class="chart-card">
      <div class="chart-card-header">
        <div class="chart-card-title">Daily Summary</div>
        <span style="font-size:.62rem;color:var(--text-3);font-family:var(--f-mono)">Last ${sortedDays.length} trading days</span>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Trades</th><th>P&L</th><th>Daily Limit</th><th>Status</th></tr></thead>
          <tbody>
            ${sortedDays.length ? sortedDays.map(d => {
              const day = dayMap[d];
              const dayLoss = Math.abs(Math.min(0, day.pnl));
              const usedPct = (dayLoss / dailyLossLimit * 100).toFixed(0);
              const breach  = dayLoss >= dailyLossLimit;
              const warning = !breach && dayLoss >= dailyLossLimit * 0.7;
              return `<tr>
                <td style="color:var(--brand);font-family:var(--f-mono);font-weight:600">${d}</td>
                <td style="font-family:var(--f-mono)">${day.count}</td>
                <td style="color:${day.pnl>=0?'var(--green)':'var(--red)'};font-weight:700;font-family:var(--f-mono)">${day.pnl>=0?'+$':'-$'}${Math.abs(day.pnl).toFixed(2)}</td>
                <td style="font-family:var(--f-mono);font-size:.65rem;color:${breach?'var(--red)':warning?'var(--amber)':'var(--text-3)'}">
                  ${usedPct}% used
                </td>
                <td>${breach
                  ? '<span style="background:rgba(245,75,94,.15);color:var(--red);border:1px solid rgba(245,75,94,.3);border-radius:4px;padding:2px 8px;font-size:.62rem;font-weight:700">✗ BREACH</span>'
                  : warning
                  ? '<span style="background:rgba(245,166,35,.15);color:var(--amber);border:1px solid rgba(245,166,35,.3);border-radius:4px;padding:2px 8px;font-size:.62rem;font-weight:700">⚠ NEAR</span>'
                  : '<span style="background:rgba(34,208,122,.15);color:var(--green);border:1px solid rgba(34,208,122,.3);border-radius:4px;padding:2px 8px;font-size:.62rem;font-weight:700">✓ OK</span>'
                }</td>
              </tr>`;
            }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:20px">No trades yet — import trades to see daily summary</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;

  setTimeout(() => drawDisciplineGauge('gaugeCanvas', score), 60);
}

// ── Objective row helper ──
function objRow(label, limit, result, pass, extra) {
  const icon = pass
    ? `<div style="width:24px;height:24px;background:rgba(34,208,122,.2);border:1px solid rgba(34,208,122,.4);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--green);font-size:.75rem;font-weight:700;margin:0 auto">✓</div>`
    : `<div style="width:24px;height:24px;background:rgba(245,75,94,.2);border:1px solid rgba(245,75,94,.4);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--red);font-size:.75rem;font-weight:700;margin:0 auto">✗</div>`;
  return `<tr>
    <td style="color:var(--brand);font-weight:600;font-size:.78rem">${label}</td>
    <td style="font-family:var(--f-mono);font-size:.7rem;color:var(--text-2)">${limit}</td>
    <td style="font-family:var(--f-mono);font-size:.7rem;color:var(--text)">${result}</td>
    <td style="text-align:center">${icon}<div style="font-family:var(--f-mono);font-size:.55rem;color:var(--text-3);margin-top:3px">${extra||''}</div></td>
  </tr>`;
}

// ── Quick stat box ──
function quickStatBox(label, value, valueColor) {
  return `<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);padding:16px 18px;text-align:center">
    <div style="font-size:.68rem;color:var(--text-3);margin-bottom:6px;font-family:var(--f-mono)">${label}</div>
    <div style="font-family:var(--f-disp);font-size:1.3rem;font-weight:800;color:${valueColor}">${value}</div>
  </div>`;
}

// ── Stat cell ──
function statCell(label, value, valueColor) {
  return `<div style="background:var(--surface);padding:14px;text-align:center">
    <div style="font-size:.6rem;color:var(--text-3);margin-bottom:5px;font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.5px">${label}</div>
    <div style="font-family:var(--f-disp);font-size:1rem;font-weight:800;color:${valueColor}">${value}</div>
  </div>`;
}

// ── Settings toggle / save ──
function toggleObjSettings() {
  const panel = document.getElementById('objSettingsPanel');
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}
function saveObjSettings(firm) {
  const cfg = {
    balance:       parseFloat(document.getElementById('cfg_balance').value) || 100000,
    dailyLoss:     parseFloat(document.getElementById('cfg_daily').value)   || 5,
    maxLoss:       parseFloat(document.getElementById('cfg_max').value)     || 10,
    profitTarget:  parseFloat(document.getElementById('cfg_profit').value)  || 10,
    minDays:       parseInt(  document.getElementById('cfg_days').value)    || 4
  };
  localStorage.setItem('ts_obj_' + firm, JSON.stringify(cfg));
  showToast('Limits saved for ' + firm + '!', 'success');
  toggleObjSettings();
  renderPage('objectives');
}

// ── Gauge (semicircle) ──
function drawDisciplineGauge(id, score) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H - 10;
  const r = Math.min(W, H * 2) / 2 - 12;
  ctx.clearRect(0, 0, W, H);

  // Draw arc segments (red → amber → green)
  const segments = [
    { from: 0,   to: 30,  color: '#f54b5e' },
    { from: 30,  to: 80,  color: '#f5a623' },
    { from: 80,  to: 100, color: '#22d07a' }
  ];
  segments.forEach(seg => {
    const startA = Math.PI + (seg.from / 100) * Math.PI;
    const endA   = Math.PI + (seg.to   / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, endA);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'butt';
    ctx.stroke();
  });

  // Track background (grey)
  ctx.beginPath();
  ctx.arc(cx, cy, r - 18, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(30,42,60,.9)';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Score fill on inner track
  const fillEnd = Math.PI + (score / 100) * Math.PI;
  const fillColor = score >= 80 ? '#22d07a' : score >= 60 ? '#f5a623' : '#f54b5e';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 18, Math.PI, fillEnd);
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Needle
  const needleAngle = Math.PI + (score / 100) * Math.PI;
  const nx = cx + (r - 8) * Math.cos(needleAngle);
  const ny = cy + (r - 8) * Math.sin(needleAngle);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Centre dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Labels
  ctx.font = "9px 'Space Mono',monospace";
  ctx.fillStyle = 'rgba(156,174,200,.6)';
  ctx.textAlign = 'center';
  ctx.fillText('0%',   cx - r + 4, cy + 14);
  ctx.fillText('50%',  cx,         cy - r - 4);
  ctx.fillText('100%', cx + r - 4, cy + 14);
}
