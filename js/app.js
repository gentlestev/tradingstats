/* ══ TradingStats — App Bootstrap ══ */

document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.remove('loading');
  startClock();

  // Handle OAuth redirect
  const hash = window.location.hash, query = window.location.search;
  if (hash.includes('access_token') || query.includes('access_token')) {
    const { data } = await sb.auth.getSession();
    if (data?.session) {
      window.history.replaceState({}, document.title, window.location.pathname);
      onLogin(data.session.user);
      showToast('✅ Welcome! Email confirmed.', 'success');
      return;
    }
  }

  // Restore session
  const { data: { session } } = await sb.auth.getSession();
  if (session) onLogin(session.user);

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) onLogin(session.user);
    if (event === 'SIGNED_OUT') onLogout();
  });

  // Page zoom restore
  const savedZoom = parseFloat(localStorage.getItem('ts_zoom') || '1');
  applyZoom(savedZoom);
});

// ── Login handler ──
async function onLogin(user) {
  currentUser = user;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'grid';

  // Populate user info
  const name = user.user_metadata?.full_name || user.email || 'Trader';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = name.split(' ')[0] || 'Trader';
  document.getElementById('sidebarEmail').textContent = user.email || '—';

  // Restore last state
  const savedFirm = localStorage.getItem('ts_firm') || 'All';
  const savedPage = localStorage.getItem('ts_page') || 'dashboard';
  activeFirm = savedFirm;

  // Set active pill
  document.querySelectorAll('.acct-pill').forEach(p => {
    if (p.textContent.trim() === savedFirm) p.classList.add('active');
    else p.classList.remove('active');
  });
  document.getElementById('firmBadge').textContent = savedFirm === 'All' ? 'All Firms' : savedFirm;

  await loadTradesFromSupabase();
  navTo(savedPage);
}

function onLogout() {
  currentUser = null; allTrades = [];
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

// ── Navigation ──
function navTo(page) {
  activePage = page;
  localStorage.setItem('ts_page', page);
  renderPage(page);
}

// ── Mobile sidebar ──
function toggleSidebar() {
  const sb2 = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const ham = document.getElementById('hamburger');
  const open = sb2.classList.toggle('open');
  overlay.classList.toggle('show', open);
  ham.classList.toggle('open', open);
}

// ── Clock ──
function startClock() {
  function update() {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const t = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false, timeZone: tz });
    const el = document.getElementById('liveTime');
    const mel = document.getElementById('mobileTime');
    if (el) el.textContent = t;
    if (mel) mel.textContent = t.slice(0,5);
  }
  update();
  setInterval(update, 1000);
}

// ── Page zoom ──
function applyZoom(scale) {
  const el = document.getElementById('appScreen');
  if (!el) return;
  el.style.transformOrigin = 'top center';
  el.style.transform = scale < 1 ? `scale(${scale})` : 'scale(1)';
}

// ── Header scroll shadow ──
window.addEventListener('scroll', () => {
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.style.boxShadow = window.scrollY > 4 ? '0 2px 20px rgba(0,0,0,.5)' : 'none';
}, { passive: true });

// ── Resize: redraw charts ──
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (allTrades.length && activePage === 'dashboard') renderPage('dashboard');
  }, 300);
});
