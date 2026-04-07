/* ══ TradingStats — Data & State ══ */

let currentUser = null;
let allTrades = [];
let activeFirm = 'All';
let activePage = 'dashboard';
let firmEmotions = {};

const FIRMS = ['Deriv','FTMO','The5ers','Other'];
const FIRM_COLORS = { Deriv:'#4f8ef7', FTMO:'#22d07a', The5ers:'#f5a623', Other:'#9f70f5' };

// Filter trades by active firm
function getTradesForFirm(firm) {
  if (!firm || firm === 'All') return allTrades;
  return allTrades.filter(t => t.account_provider === firm);
}

// Core stats calculator
function calcStats(trades) {
  if (!trades.length) return { net:0, wins:0, losses:0, be:0, total:0, wr:0, pf:0, rrr:0, exp:0, best:0, worst:0, gw:0, gl:0, aw:0, al:0, streak:0 };
  // FIX: derive win/loss from profit_loss value directly — handles legacy records
  // with stale result field (e.g. Break Even trades that were actually losses after fees)
  const wins   = trades.filter(t => parseFloat(t.profit_loss||0) > 0);
  const losses = trades.filter(t => parseFloat(t.profit_loss||0) < 0);
  const net    = trades.reduce((s,t) => s + parseFloat(t.profit_loss||0), 0);
  const gw     = wins.reduce((s,t) => s + parseFloat(t.profit_loss||0), 0);
  const gl     = Math.abs(losses.reduce((s,t) => s + parseFloat(t.profit_loss||0), 0));
  const aw     = wins.length ? gw / wins.length : 0;
  const al     = losses.length ? gl / losses.length : 0;
  const wr     = trades.length ? wins.length / trades.length * 100 : 0;
  const pf     = gl > 0 ? gw / gl : 99;
  const rrr    = al > 0 ? aw / al : 0;
  const exp    = trades.length ? net / trades.length : 0;
  const vals   = trades.map(t => parseFloat(t.profit_loss||0));
  const best   = Math.max(...vals);
  const worst  = Math.min(...vals);
  // FIX: streak uses profit_loss sign, not result field, for consistency
  const sortedS = trades.slice().sort((a,b) => {
    const da = (a.open_datetime || a.date || '').replace(/\./g,'-');
    const db = (b.open_datetime || b.date || '').replace(/\./g,'-');
    return da.localeCompare(db);
  });
  let streak = 0;
  if (sortedS.length) {
    const lastPnl = parseFloat(sortedS[sortedS.length-1].profit_loss||0);
    const isWin = lastPnl > 0;
    for (let i = sortedS.length - 1; i >= 0; i--) {
      const pnl = parseFloat(sortedS[i].profit_loss||0);
      if (isWin ? pnl > 0 : pnl <= 0) streak++;
      else break;
    }
    if (!isWin) streak = -streak;
  }
  return { net, wins: wins.length, losses: losses.length, be: trades.length - wins.length - losses.length, total: trades.length, wr, pf, rrr, exp, best, worst, gw, gl, aw, al, streak };
}

// Zellla-style "Stats Score" (0-100)
function calcScore(stats) {
  if (!stats.total) return 0;
  const wrScore  = Math.min(stats.wr, 70) / 70 * 30;
  const pfScore  = Math.min(stats.pf >= 99 ? 30 : stats.pf / 3, 30);
  const rrrScore = Math.min(stats.rrr / 3, 1) * 20;
  const expScore = stats.exp > 0 ? 20 : 0;
  return Math.round(wrScore + pfScore + rrrScore + expScore);
}

function scoreGrade(score) {
  if (score >= 80) return { grade: 'A', label: 'Elite', color: 'var(--green)' };
  if (score >= 65) return { grade: 'B', label: 'Strong', color: 'var(--brand-l)' };
  if (score >= 50) return { grade: 'C', label: 'Developing', color: 'var(--amber)' };
  if (score >= 35) return { grade: 'D', label: 'Struggling', color: 'var(--red)' };
  return { grade: 'F', label: 'Critical', color: 'var(--red)' };
}

// Format helpers
function fmtPnl(n, decimals = 2) {
  const abs = Math.abs(n).toFixed(decimals);
  return (n >= 0 ? '+$' : '-$') + parseFloat(abs).toLocaleString('en-US', { minimumFractionDigits: decimals });
}
function fmtPnlK(n) {
  const abs = Math.abs(n);
  const v = abs >= 1000 ? (abs / 1000).toFixed(1) + 'K' : abs.toFixed(0);
  return (n >= 0 ? '+$' : '-$') + v;
}
function fmtPct(n) { return n.toFixed(1) + '%'; }

// Trade dedup key
function tradeKey(t) {
  // FIX: use 2-decimal precision instead of integer rounding — prevents false duplicates
  // for small trades (e.g. -$1.24 and -$1.00 rounding to same key)
  const pnl = parseFloat(parseFloat(String(t.profit_loss||0)).toFixed(2));
  const dir = String(t.direction||'').trim().toLowerCase().slice(0,4);
  const inst = String(t.instrument||'').trim().toLowerCase().replace(/\s+/g,'');
  const date = String(t.date||'').trim().slice(0,10);
  // Include open_datetime in key when available for extra uniqueness
  const dt = String(t.open_datetime||'').trim().slice(11,19); // HH:MM:SS part
  return date + '|' + inst + '|' + dir + '|' + pnl + (dt ? '|' + dt : '');
}

// Load from Supabase
async function loadTradesFromSupabase() {
  if (!currentUser) return;
  // FIX: always refresh the session before reading so a stale/expired token doesn't
  // silently fail or produce a 400 — if unrecoverable, sign out cleanly
  try {
    const { data: sd, error: se } = await sb.auth.getSession();
    if (se || !sd?.session) { await sb.auth.signOut().catch(()=>{}); onLogout(); return; }
    currentUser = sd.session.user;
  } catch(e) { return; }
  const { data, error } = await sb.from('trades').select('*').eq('user_id', currentUser.id).order('date', { ascending: true });
  if (error) { console.error('loadTrades:', error); return; }
  // FIX: re-derive result from profit_loss on every load so legacy records
  // (imported before the commission+swap fix) are corrected automatically in-memory
  allTrades = (data || []).map(t => {
    const pnl = parseFloat(t.profit_loss || 0);
    return { ...t, result: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break Even' };
  });
}

// Delete trade
async function deleteTrade(id) {
  if (!id || !currentUser) return;
  if (!confirm('Delete this trade?')) return;
  const { error } = await sb.from('trades').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('Trade deleted.', 'success');
  await loadTradesFromSupabase();
  renderPage(activePage);
}

// Delete all for firm
async function deleteFirmTrades(firmName) {
  if (!currentUser) return;
  if (!confirm('Delete ALL ' + firmName + ' trades? This cannot be undone.')) return;
  const { error } = await sb.from('trades').delete().eq('user_id', currentUser.id).eq('account_provider', firmName);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('Deleted all ' + firmName + ' trades.', 'success');
  await loadTradesFromSupabase();
  renderPage(activePage);
}

// Firm selector
function setFirm(firm, btn) {
  activeFirm = firm;
  document.querySelectorAll('.acct-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  localStorage.setItem('ts_firm', firm);
  document.getElementById('firmBadge').textContent = firm === 'All' ? 'All Firms' : firm;
  renderPage(activePage);
}

// Toast
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = 'toast', 3200);
}
