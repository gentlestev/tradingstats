/* ══ TradingStats — Charts ══ */

const CHART_DEFAULTS = {
  ticks: { color: 'rgba(156,174,200,.7)', font: { size: 9, family: "'Space Mono',monospace" } },
  grid:  { color: 'rgba(30,42,60,.8)' },
  tooltip: {
    backgroundColor: '#1c2333', borderColor: '#263448', borderWidth: 1,
    titleColor: '#9aaec8', bodyColor: '#e8edf5', padding: 10, cornerRadius: 8
  }
};

function destroyChart(id) {
  const c = Chart.getChart(id);
  if (c) c.destroy();
}

// Equity curve with green/red fill (FTMO-style)
function renderEquityCurve(canvasId, trades, startBal = 0, valElId = null) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const sorted = trades.slice().sort((a,b) => a.date.localeCompare(b.date));
  const labels = ['Start'];
  let bal = startBal;
  const data = [startBal];
  sorted.forEach(t => { bal += parseFloat(t.profit_loss||0); labels.push(t.date.slice(5)); data.push(parseFloat(bal.toFixed(2))); });
  if (valElId) {
    const el = document.getElementById(valElId);
    if (el) {
      const diff = bal - startBal;
      el.textContent = fmtPnl(diff);
      el.style.color = diff >= 0 ? 'var(--green)' : 'var(--red)';
    }
  }
  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: 'transparent', backgroundColor: 'transparent', borderWidth: 0, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#4f8ef7', fill: false, tension: 0.3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...CHART_DEFAULTS.tooltip, callbacks: { label: ctx => { const v = ctx.parsed.y; const diff = v - startBal; return 'Balance: $' + v.toLocaleString('en-US',{minimumFractionDigits:2}) + (startBal ? ' (' + (diff>=0?'+':'') + diff.toFixed(2) + ')' : ''); } } },
        zoom: {
          pan:  { enabled: true, mode: 'x', threshold: 5 },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
          limits: { x: { min: 'original', max: 'original' } }
        }
      },
      scales: {
        x: { ticks: { ...CHART_DEFAULTS.ticks, maxTicksLimit: 8 }, grid: CHART_DEFAULTS.grid },
        y: { ticks: { ...CHART_DEFAULTS.ticks, callback: v => '$'+v.toLocaleString() }, grid: CHART_DEFAULTS.grid }
      }
    },
    plugins: [{
      id: 'eqPaint',
      afterDatasetsDraw(chart) {
        const { ctx: cx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta.data.length) return;
        const baseY = startBal ? Math.max(top, Math.min(bottom, y.getPixelForValue(startBal))) : bottom;
        function drawPath(pts) {
          if (!pts.length) return;
          cx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i-1], c = pts[i];
            const cp1x = p.cp2x != null ? p.cp2x : (p.x+c.x)/2;
            const cp1y = p.cp2y != null ? p.cp2y : p.y;
            const cp2x = c.cp1x != null ? c.cp1x : (p.x+c.x)/2;
            const cp2y = c.cp1y != null ? c.cp1y : c.y;
            cx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, c.x, c.y);
          }
        }
        // Green fill above baseline
        cx.save(); cx.beginPath(); cx.rect(left, top, right-left, baseY-top); cx.clip();
        cx.beginPath(); drawPath(meta.data); cx.lineTo(meta.data[meta.data.length-1].x, baseY); cx.lineTo(meta.data[0].x, baseY); cx.closePath();
        cx.fillStyle = 'rgba(34,208,122,.14)'; cx.fill(); cx.restore();
        // Red fill below baseline
        cx.save(); cx.beginPath(); cx.rect(left, baseY, right-left, bottom-baseY); cx.clip();
        cx.beginPath(); drawPath(meta.data); cx.lineTo(meta.data[meta.data.length-1].x, bottom); cx.lineTo(meta.data[0].x, bottom); cx.closePath();
        cx.fillStyle = 'rgba(245,75,94,.14)'; cx.fill(); cx.restore();
        // Green line above
        cx.save(); cx.beginPath(); cx.rect(left, top, right-left, baseY-top); cx.clip();
        cx.beginPath(); drawPath(meta.data); cx.strokeStyle = '#22d07a'; cx.lineWidth = 2; cx.lineJoin = 'round'; cx.stroke(); cx.restore();
        // Red line below
        cx.save(); cx.beginPath(); cx.rect(left, baseY, right-left, bottom-baseY); cx.clip();
        cx.beginPath(); drawPath(meta.data); cx.strokeStyle = '#f54b5e'; cx.lineWidth = 2; cx.lineJoin = 'round'; cx.stroke(); cx.restore();
        // Baseline
        if (startBal) {
          cx.save(); cx.setLineDash([5,4]); cx.strokeStyle = 'rgba(156,174,200,.2)'; cx.lineWidth = 1;
          cx.beginPath(); cx.moveTo(left, baseY); cx.lineTo(right, baseY); cx.stroke();
          cx.fillStyle = 'rgba(156,174,200,.35)'; cx.font = "9px 'Space Mono',monospace"; cx.textAlign = 'right';
          cx.fillText('$'+startBal.toLocaleString(), right-4, baseY-4); cx.restore();
        }
      }
    }]
  });
  window._eqChart = chart;
  canvas.ondblclick = () => { if(window._eqChart?.resetZoom) window._eqChart.resetZoom(); };
}

function resetEqZoom() {
  if (window._eqChart?.resetZoom) window._eqChart.resetZoom();
}

// Daily P&L bar chart
function renderDailyChart(canvasId, trades) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dayMap = {};
  trades.forEach(t => { dayMap[t.date] = (dayMap[t.date]||0) + parseFloat(t.profit_loss||0); });
  const days = Object.keys(dayMap).sort();
  const vals = days.map(d => parseFloat(dayMap[d].toFixed(2)));
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: days.map(d=>d.slice(5)), datasets: [{ data: vals, backgroundColor: vals.map(v => v>=0 ? 'rgba(34,208,122,.7)' : 'rgba(245,75,94,.7)'), borderRadius: 4, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...CHART_DEFAULTS.tooltip, callbacks: { label: c => (c.parsed.y>=0?'+':'')+'$'+c.parsed.y.toFixed(2) } } }, scales: { x: { ticks: CHART_DEFAULTS.ticks, grid: { display: false } }, y: { ticks: { ...CHART_DEFAULTS.ticks, callback: v=>'$'+v }, grid: CHART_DEFAULTS.grid } } }
  });
}

// Instrument doughnut
function renderInstrumentChart(canvasId, trades) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const instMap = {};
  trades.forEach(t => { instMap[t.instrument] = (instMap[t.instrument]||0) + 1; });
  if (!Object.keys(instMap).length) return;
  new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: Object.keys(instMap), datasets: [{ data: Object.values(instMap), backgroundColor: ['#4f8ef7','#22d07a','#f5a623','#9f70f5','#f54b5e','#7aabff','#16a85f'], borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { color: 'rgba(232,237,245,.8)', font: { size: 9, family: "'Space Mono',monospace" }, padding: 10, boxWidth: 10 } } } }
  });
}

// Monthly bar
function renderMonthlyChart(canvasId, trades) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const moMap = {};
  trades.forEach(t => { const m = t.date.slice(0,7); moMap[m] = (moMap[m]||0) + parseFloat(t.profit_loss||0); });
  const keys = Object.keys(moMap).sort();
  const vals = keys.map(k => parseFloat(moMap[k].toFixed(2)));
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: keys, datasets: [{ data: vals, backgroundColor: vals.map(v => v>=0 ? 'rgba(34,208,122,.7)' : 'rgba(245,75,94,.7)'), borderRadius: 6, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...CHART_DEFAULTS.tooltip, callbacks: { label: c => (c.parsed.y>=0?'+':'')+'$'+c.parsed.y.toFixed(2) } } }, scales: { x: { ticks: CHART_DEFAULTS.ticks, grid: { display: false } }, y: { ticks: { ...CHART_DEFAULTS.ticks, callback: v=>'$'+v }, grid: CHART_DEFAULTS.grid } } }
  });
}

// Win/Loss/BE doughnut
function renderResultsChart(canvasId, wins, losses, be) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['Wins','Losses','Break Even'], datasets: [{ data: [wins,losses,be], backgroundColor: ['rgba(34,208,122,.8)','rgba(245,75,94,.8)','rgba(245,166,35,.8)'], borderWidth: 0, hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(232,237,245,.8)', font: { size: 9, family: "'Space Mono',monospace" }, padding: 12, boxWidth: 10 } } } }
  });
}

// Score ring (mini canvas)
function renderScoreRing(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size/2, cy = size/2, r = size/2 - 8;
  ctx.clearRect(0,0,size,size);
  // track
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle = 'rgba(30,42,60,.9)'; ctx.lineWidth = 10; ctx.stroke();
  // fill
  const end = (-Math.PI/2) + (score/100) * Math.PI * 2;
  const color = score >= 65 ? '#22d07a' : score >= 40 ? '#f5a623' : '#f54b5e';
  ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,end);
  ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
}

// Auto-detect firm from trade data
function autoDetectFirm(text) {
  const t = text.toLowerCase();
  if (t.includes('the5ers')||t.includes('fivepercent')||t.includes('5%ers')) return 'The5ers';
  if (t.includes('ftmo')) return 'FTMO';
  if (t.includes('deriv')||t.includes('volatility')||t.includes('binary')) return 'Deriv';
  return null;
}
