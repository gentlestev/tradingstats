/* ══ TradingStats — Auth ══ */

const SUPABASE_URL = 'https://obliysgyuizoyxkevqxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGl5c2d5dWl6b3l4a2V2cXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzkzMjQsImV4cCI6MjA4OTI1NTMyNH0.x5G8rtTC8xisZAcQ7d251kYbATp8ihBARd02Mb_4Vyo';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true }
});

// ── Email validation ──
const ALLOWED_DOMAINS = ['gmail.com','yahoo.com','yahoo.co.uk','yahoo.ca','yahoo.com.au','yahoo.co.in','outlook.com','hotmail.com','hotmail.co.uk','hotmail.ca','live.com','live.co.uk','msn.com','icloud.com','me.com','mac.com','protonmail.com','proton.me','aol.com','zoho.com','yandex.com','yandex.ru','gmx.com','gmx.net','mail.com','tutanota.com','fastmail.com','fastmail.fm','hey.com','yahoo.com.ng','shaw.ca','rogers.com','bell.net','telus.net','sympatico.ca','videotron.ca','btinternet.com','sky.com','talktalk.net','virginmedia.com','tiscali.co.uk','edu','ac.uk','gov','org'];
const BLOCKED_DOMAINS = ['mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','yopmail.com','sharklasers.com','trashmail.com','trashmail.me','dispostable.com','maildrop.cc','fakeinbox.com','tempinbox.com','10minutemail.com','mytemp.email','temp-mail.org','tempmail.net','getnada.com'];

function validateEmail(email) {
  const err = document.getElementById('regEmailError');
  if (!err) return true;
  err.style.display = 'none';
  if (!email || !email.includes('@')) { showFieldError(err, 'Enter a valid email address.'); return false; }
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) { showFieldError(err, 'Enter a valid email address.'); return false; }
  if (BLOCKED_DOMAINS.includes(domain)) { showFieldError(err, 'Disposable email not allowed.'); document.getElementById('regEmail').className = 'field-input invalid'; return false; }
  const ok = ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d) || domain.endsWith('.edu') || domain.endsWith('.gov') || domain.endsWith('.org') || domain.endsWith('ac.uk'));
  if (!ok) { showFieldError(err, 'Use a standard email provider (Gmail, Yahoo, Outlook, etc).'); document.getElementById('regEmail').className = 'field-input invalid'; return false; }
  document.getElementById('regEmail').className = 'field-input valid';
  err.style.display = 'none';
  return true;
}
function showFieldError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

// ── Country data ──
const COUNTRIES = [
  {name:'Nigeria',code:'NG',dial:'+234',postal:/^\d{6}$/,states:{'Abia':['Aba','Umuahia'],'Adamawa':['Yola','Mubi'],'Akwa Ibom':['Uyo','Eket'],'Anambra':['Awka','Onitsha','Nnewi'],'Bayelsa':['Yenagoa'],'Benue':['Makurdi','Gboko'],'Cross River':['Calabar'],'Delta':['Asaba','Warri'],'Edo':['Benin City'],'Ekiti':['Ado-Ekiti'],'Enugu':['Enugu','Nsukka'],'FCT':['Abuja'],'Gombe':['Gombe'],'Imo':['Owerri','Orlu'],'Kaduna':['Kaduna','Zaria'],'Kano':['Kano'],'Kogi':['Lokoja'],'Kwara':['Ilorin'],'Lagos':['Lagos','Ikeja','Lekki','Victoria Island','Surulere','Yaba','Ikorodu','Mushin'],'Niger':['Minna'],'Ogun':['Abeokuta'],'Ondo':['Akure'],'Osun':['Osogbo'],'Oyo':['Ibadan','Ogbomoso'],'Rivers':['Port Harcourt'],'Sokoto':['Sokoto']}},
  {name:'United States',code:'US',dial:'+1',postal:/^\d{5}(-\d{4})?$/,states:{'California':['Los Angeles','San Francisco','San Diego'],'Texas':['Houston','Dallas','Austin'],'Florida':['Miami','Tampa','Orlando'],'New York':['New York City','Buffalo'],'Illinois':['Chicago'],'Georgia':['Atlanta'],'Michigan':['Detroit']}},
  {name:'United Kingdom',code:'GB',dial:'+44',postal:/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,states:{'England':['London','Birmingham','Manchester','Leeds'],'Scotland':['Glasgow','Edinburgh'],'Wales':['Cardiff'],'Northern Ireland':['Belfast']}},
  {name:'Canada',code:'CA',dial:'+1',postal:/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,states:{'Ontario':['Toronto','Ottawa','Mississauga'],'British Columbia':['Vancouver','Victoria'],'Quebec':['Montreal','Quebec City'],'Alberta':['Calgary','Edmonton']}},
  {name:'Ghana',code:'GH',dial:'+233',postal:/^\d{5}$/,states:{'Greater Accra':['Accra','Tema'],'Ashanti':['Kumasi'],'Western':['Sekondi-Takoradi']}},
  {name:'Kenya',code:'KE',dial:'+254',postal:/^\d{5}$/,states:{'Nairobi':['Nairobi'],'Mombasa':['Mombasa'],'Kisumu':['Kisumu']}},
  {name:'South Africa',code:'ZA',dial:'+27',postal:/^\d{4}$/,states:{'Gauteng':['Johannesburg','Pretoria'],'Western Cape':['Cape Town'],'KwaZulu-Natal':['Durban']}},
  {name:'Australia',code:'AU',dial:'+61',postal:/^\d{4}$/,states:{'New South Wales':['Sydney','Newcastle'],'Victoria':['Melbourne'],'Queensland':['Brisbane']}},
  {name:'Jamaica',code:'JM',dial:'+1876',postal:/^\w{6}$/,states:{'Kingston':['Kingston'],'Saint Andrew':['Cross Roads'],'Saint James':['Montego Bay']}},
  {name:'Zimbabwe',code:'ZW',dial:'+263',postal:/^\d{4}$/,states:{'Harare':['Harare'],'Bulawayo':['Bulawayo']}},
  {name:'Other',code:'XX',dial:'+',postal:/./,states:{'Other':['Other City']}}
];
function getCountry(name) { return COUNTRIES.find(c => c.name === name) || COUNTRIES[COUNTRIES.length - 1]; }

function populateCountries() {
  const sel = document.getElementById('regCountry');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select country…</option>' + COUNTRIES.map(c => `<option>${c.name}</option>`).join('');
}
function onCountryChange() {
  const c = getCountry(document.getElementById('regCountry').value);
  document.getElementById('regDial').value = c.dial;
  const st = document.getElementById('regState');
  st.innerHTML = '<option value="">Select…</option>' + Object.keys(c.states || {}).map(s => `<option>${s}</option>`).join('');
  document.getElementById('regCity').innerHTML = '<option value="">Select state first…</option>';
}
function onStateChange() {
  const c = getCountry(document.getElementById('regCountry').value);
  const state = document.getElementById('regState').value;
  const cities = (c.states && c.states[state]) || [];
  document.getElementById('regCity').innerHTML = '<option value="">Select…</option>' + cities.map(ci => `<option>${ci}</option>`).join('');
}
function validatePhone() {
  const num = document.getElementById('regPhone').value.trim();
  const el = document.getElementById('regPhone'); const err = document.getElementById('phoneError');
  if (num.length < 6 || num.length > 13 || !/^\d+$/.test(num)) { el.className='field-input invalid'; showFieldError(err,'Valid phone (6-13 digits)'); return false; }
  el.className='field-input valid'; err.style.display='none'; return true;
}
function validatePostal() {
  const country = document.getElementById('regCountry').value;
  const postal = document.getElementById('regPostal').value.trim();
  const el = document.getElementById('regPostal'); const err = document.getElementById('postalError');
  if (!country) { showFieldError(err,'Select a country first'); return false; }
  const c = getCountry(country);
  if (!c.postal.test(postal)) { el.className='field-input invalid'; showFieldError(err,'Invalid format for '+country); return false; }
  el.className='field-input valid'; err.style.display='none'; return true;
}
function validateAddress() {
  const addr = document.getElementById('regAddress').value.trim();
  const el = document.getElementById('regAddress'); const err = document.getElementById('addressError');
  if (addr.length < 6 || !/\d/.test(addr) || addr.split(' ').length < 2) { el.className='field-input invalid'; showFieldError(err,'Enter valid street address with number'); return false; }
  el.className='field-input valid'; err.style.display='none'; return true;
}

// ── Auth tabs ──
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register')));
  document.getElementById('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'flex' : 'none';
}

// ── Login ──
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';
  if (!email || !pass) { err.textContent = 'Email and password required.'; err.style.display = 'block'; return; }
  const btn = document.getElementById('loginBtn');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.textContent = 'Sign In'; btn.disabled = false;
  if (error) { err.textContent = error.message; err.style.display = 'block'; }
}

// ── Google ──
async function signInWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  if (error) showToast('Google sign-in error: ' + error.message, 'error');
}

// ── Forgot password ──
async function forgotPassword() {
  const email = prompt('Enter your email for a reset link:');
  if (!email) return;
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) showToast('Error: ' + error.message, 'error');
  else showToast('Reset link sent to your email!', 'success');
}

// ── Register step 1 → 2 ──
async function regNextStep() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const err = document.getElementById('registerError');
  const btn = document.getElementById('regNextBtn');
  err.style.display = 'none';
  if (!name) { err.textContent = 'Full name required.'; err.style.display = 'block'; return; }
  if (!validateEmail(email)) return;
  if (!pass || pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; return; }
  if (pass !== confirm) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
  btn.textContent = 'Checking…'; btn.disabled = true;
  try {
    const { data } = await sb.rpc('email_exists', { check_email: email });
    if (data === true) { err.textContent = '⚠ This email is already registered.'; err.style.display = 'block'; btn.textContent = 'Continue →'; btn.disabled = false; return; }
  } catch(e) {}
  btn.textContent = 'Continue →'; btn.disabled = false;
  document.getElementById('regStep1').classList.remove('active');
  document.getElementById('regStep2').classList.add('active');
  document.getElementById('sdot1').classList.replace('active','done');
  document.getElementById('sdot2').classList.add('active');
  populateCountries();
}
function regPrevStep() {
  document.getElementById('regStep2').classList.remove('active');
  document.getElementById('regStep1').classList.add('active');
  document.getElementById('sdot2').classList.remove('active');
  document.getElementById('sdot1').classList.replace('done','active');
}

// ── Register submit ──
async function doRegister() {
  const err = document.getElementById('registerError');
  err.style.display = 'none';
  const email = document.getElementById('regEmail').value.trim();
  try { const { data: exists } = await sb.rpc('email_exists', { check_email: email }); if (exists === true) { err.textContent = '⚠ Email already registered.'; err.style.display = 'block'; return; } } catch(e) {}
  const country = document.getElementById('regCountry').value;
  const state = document.getElementById('regState').value;
  const city = document.getElementById('regCity').value;
  const address = document.getElementById('regAddress').value.trim();
  const postal = document.getElementById('regPostal').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const dial = document.getElementById('regDial').value;
  if (!country || !state || !city) { err.textContent = 'Please select country, state and city.'; err.style.display = 'block'; return; }
  if (!address || !postal || !phone) { err.textContent = 'All fields are required.'; err.style.display = 'block'; return; }
  if (!validatePhone() || !validatePostal() || !validateAddress()) return;
  const name = document.getElementById('regName').value.trim();
  const pass = document.getElementById('regPassword').value;
  const fullPhone = dial + phone;
  const btn = document.getElementById('registerBtn');
  btn.textContent = 'Creating…'; btn.disabled = true;
  const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name, phone: fullPhone, country, state, city, address, postal_code: postal } } });
  if (error) { btn.textContent = 'Create Account'; btn.disabled = false; err.textContent = error.message.includes('already') ? 'Account already exists. Please sign in.' : error.message; err.style.display = 'block'; return; }
  if (data?.user) { try { await sb.from('profiles').upsert({ id: data.user.id, full_name: name, phone: fullPhone, country, state, city, address, postal_code: postal }); } catch(e) {} }
  btn.textContent = 'Create Account'; btn.disabled = false;
  showCongratsScreen(name);
}

// ── Logout ──
async function doLogout() {
  try { await sb.auth.signOut(); } catch(e) {}
  currentUser = null; allTrades = [];
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ── Congrats ──
function showCongratsScreen(name) {
  document.getElementById('congratsName').textContent = (name || 'Trader').toUpperCase();
  document.getElementById('congratsScreen').classList.add('show');
  launchConfetti();
}
function closeCongratsScreen() {
  document.getElementById('congratsScreen').classList.remove('show');
  switchAuthTab('login');
}
function launchConfetti() {
  const box = document.getElementById('confettiBox');
  box.innerHTML = '';
  const colors = ['#4f8ef7','#22d07a','#f5a623','#9f70f5','#f54b5e','#7aabff'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*2}s`;
    box.appendChild(el);
  }
}
