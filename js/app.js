// ── Login-Logik ──────────────────────────────────────────────
let loginPin = '';
let loginAttempts = 0;

document.querySelectorAll('.key[data-key]').forEach(k => {
  k.addEventListener('click', () => handleLoginKey(k.dataset.key));
});

function handleLoginKey(key) {
  if(loginAttempts >= 3) return;
  if(key === 'del') {
    loginPin = loginPin.slice(0,-1);
  } else {
    if(loginPin.length >= 4) return;
    loginPin += key;
  }
  updateLoginDots();
  document.getElementById('loginErr').textContent = '';
  if(loginPin.length === 4) setTimeout(checkLogin, 180);
}

function updateLoginDots(state) {
  for(let i=0;i<4;i++) {
    const d = document.getElementById('ld'+i);
    d.className = 'pin-dot' +
      (state === 'error' ? ' error' :
       i < loginPin.length ? ' filled' : '');
  }
}

function checkLogin() {
  const uid = Object.keys(PINS).find(id => PINS[id] === loginPin);
  if(uid && USERS[uid]) {
    AppState.currentUserId = uid;
    AppState.currentUser = USERS[uid];
    loginAttempts = 0;
    startApp();
  } else {
    loginAttempts++;
    updateLoginDots('error');
    if(loginAttempts >= 3) {
      document.getElementById('loginErr').textContent =
        'Zu viele Versuche. Bitte Lee Ko kontaktieren.';
    } else {
      document.getElementById('loginErr').textContent =
        `Falsche PIN. Noch ${3-loginAttempts} Versuch${loginAttempts===2?'':'e'}.`;
    }
    setTimeout(() => { loginPin = ''; updateLoginDots(); }, 800);
  }
}

// ── App starten ──────────────────────────────────────────────
function startApp() {
  const user = AppState.currentUser;
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('appScreen').classList.add('active');

  // Avatar + Name
  document.getElementById('avatarBtn').textContent = user.initials;
  document.getElementById('profilAv').textContent = user.initials;
  document.getElementById('profilName').textContent = user.name;
  document.getElementById('profilMeta').textContent = user.label;
  document.getElementById('urlaubRest').textContent = user.urlaubRest;
  document.getElementById('wunschKont').textContent = user.wunschKont;

  // Admin-Nav anzeigen
  if(user.role === 'admin' || user.role === 'vertretung') {
    document.getElementById('adminNavItem').style.display = 'flex';
  }

  // Home-Office nur für berechtigte
  if(!user.homeoffice) {
    document.getElementById('homeOfficeMenu').style.display = 'none';
  }

  // Wochenplan rendern
  renderPlan();

  // Navigationspfeile: nur für Admin/Vertretung sichtbar
  const isAdminOrVertretung = ['admin','vertretung'].includes(user.role);
  document.getElementById('prevWeek').style.visibility = isAdminOrVertretung ? 'visible' : 'hidden';
  document.getElementById('nextWeek').style.visibility = isAdminOrVertretung ? 'visible' : 'hidden';
  // weekOffset für Mitarbeiter immer auf 0 fixieren
  if(!isAdminOrVertretung) AppState.weekOffset = 0;

  // Google Sheets Auto-Sync starten
  if(typeof SheetsSync !== 'undefined') SheetsSync.startAutoSync();

  // Email-Service + Erinnerungen starten (nur für Admin)
  if(typeof EmailService !== 'undefined') {
    EmailService.init();
    EmailService.planeErinnerungen();
    if(user.role === 'admin') EmailService.planeMonatsversand();
  }

  // Navigation
  initNav();
}

// ── Navigation ───────────────────────────────────────────────
const NAV_MAP = {
  plan:   { page: 'pagePlan',   title: 'Wochenplan' },
  profil: { page: 'pageProfil', title: 'Mein Bereich' },
  notif:  { page: 'pageNotif',  title: 'Benachrichtigungen' },
  admin:  { page: 'pageAdmin',  title: 'Admin' },
};

function initNav() {
  document.querySelectorAll('.nav-item[data-nav]').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.nav;
      switchNav(key);
      if(key === 'notif') initPage('pageNotif');
    });
  });

  document.getElementById('prevWeek').addEventListener('click', () => {
    if(!['admin','vertretung'].includes(AppState.currentUser?.role)) return;
    AppState.weekOffset--;
    renderPlan();
  });
  document.getElementById('nextWeek').addEventListener('click', () => {
    if(!['admin','vertretung'].includes(AppState.currentUser?.role)) return;
    AppState.weekOffset++;
    renderPlan();
  });

  document.getElementById('bellBtn').addEventListener('click', () => { switchNav('notif'); initPage('pageNotif'); });
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function switchNav(key) {
  const cfg = NAV_MAP[key];
  if(!cfg) return;

  // Mitarbeiter: immer auf aktuelle KW zurücksetzen
  if(key === 'plan' && !['admin','vertretung'].includes(AppState.currentUser?.role)) {
    AppState.weekOffset = 0;
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-nav="${key}"]`)?.classList.add('active');

  showPage(cfg.page);
  document.getElementById('topbarTitle').textContent = cfg.title;
  AppState.pageHistory = [];
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if(page) page.classList.add('active');
  AppState.currentPage = pageId;
  document.querySelector('.page-content').scrollTop = 0;
}

function goTo(pageId) {
  AppState.pageHistory.push(AppState.currentPage);
  showPage(pageId);
  if(typeof initPage === 'function') initPage(pageId);
  // Titel anpassen
  const titles = {
    pageKrank:          'Krankmeldung',
    pageWunsch:         'Wunschfrei / Urlaub',
    pageStundenzettel:  'Stundenzettel',
    pageVerfuegbar:     'Verfügbarkeit',
    pageHomeOffice:     'Home-Office',
    pagePIN:            'PIN ändern',
    pageAdminPlan:      'Planung',
    pageAdminWunsch:    'Anträge genehmigen',
    pageAdminKrank:     'Krankmeldungen',
    pageAdminKV:        'KV-System',
    pageAdminMitarbeiter:'Mitarbeiterliste',
    pageAdminStunden:   'Stundenzettel Admin',
  };
  if(titles[pageId]) document.getElementById('topbarTitle').textContent = titles[pageId];
}

// ── PIN Ändern ───────────────────────────────────────────────
let changePin = '';
let changeStep = 0;
let newPinTemp = '';

document.querySelectorAll('.key[data-changekey], .key-light[data-changekey]').forEach(k => {
  k.addEventListener('click', () => handleChangeKey(k.dataset.changekey));
});

function handleChangeKey(key) {
  if(key === 'del') {
    changePin = changePin.slice(0,-1);
  } else {
    if(changePin.length >= 4) return;
    changePin += key;
  }
  updateChangeDots();
  document.getElementById('pinChangeErr').textContent = '';
  if(changePin.length === 4) setTimeout(processChangeStep, 180);
}

function updateChangeDots(state) {
  for(let i=0;i<4;i++) {
    const d = document.getElementById('cd'+i);
    if(!d) continue;
    d.className = 'pin-dot-light' +
      (state==='error' ? ' error' :
       state==='ok'    ? ' ok'    :
       i < changePin.length ? ' filled' : '');
  }
}

function processChangeStep() {
  const dots = document.querySelectorAll('.step-dots .step-dot');

  if(changeStep === 0) {
    // Alte PIN prüfen
    if(PINS[AppState.currentUserId] !== changePin) {
      updateChangeDots('error');
      document.getElementById('pinChangeErr').textContent = 'Falsche PIN.';
      setTimeout(() => { changePin=''; updateChangeDots(); }, 800);
    } else {
      changeStep = 1;
      dots[0].classList.remove('active'); dots[0].classList.add('done');
      dots[1].classList.add('active');
      changePin=''; updateChangeDots();
      document.getElementById('pinChangeTitle').textContent = 'Neue PIN wählen';
    }
  } else if(changeStep === 1) {
    if(BLOCKED_PINS.includes(changePin)) {
      updateChangeDots('error');
      document.getElementById('pinChangeErr').textContent = 'Diese PIN ist nicht erlaubt.';
      setTimeout(() => { changePin=''; updateChangeDots(); }, 800);
    } else {
      newPinTemp = changePin;
      changeStep = 2;
      dots[1].classList.remove('active'); dots[1].classList.add('done');
      dots[2].classList.add('active');
      changePin=''; updateChangeDots();
      document.getElementById('pinChangeTitle').textContent = 'Neue PIN bestätigen';
    }
  } else if(changeStep === 2) {
    if(changePin !== newPinTemp) {
      updateChangeDots('error');
      document.getElementById('pinChangeErr').textContent = 'PINs stimmen nicht überein.';
      setTimeout(() => {
        changePin=''; newPinTemp=''; changeStep=1;
        dots[2].classList.remove('active');
        dots[1].classList.remove('done'); dots[1].classList.add('active');
        updateChangeDots();
        document.getElementById('pinChangeTitle').textContent = 'Neue PIN wählen';
      }, 900);
    } else {
      // PIN speichern
      PINS[AppState.currentUserId] = changePin;
      updateChangeDots('ok');
      dots[2].classList.remove('active'); dots[2].classList.add('done');
      document.getElementById('pinChangeOk').style.display = 'block';
      changePin=''; changeStep=0; newPinTemp='';
      setTimeout(() => {
        document.getElementById('pinChangeOk').style.display = 'none';
        dots.forEach(d => { d.className='step-dot'; });
        dots[0].classList.add('active');
        document.getElementById('pinChangeTitle').textContent = 'Aktuelle PIN eingeben';
        switchNav('profil');
      }, 2000);
    }
  }
}

// ── Logout ───────────────────────────────────────────────────
async function logout() {
  if(typeof SheetsSync !== 'undefined') SheetsSync.stopAutoSync();
  if(typeof logoutFirebase === 'function') await logoutFirebase();
  AppState.currentUser = null;
  AppState.currentUserId = null;
  AppState.weekOffset = 0;
  loginPin = ''; loginAttempts = 0;
  updateLoginDots();
  document.getElementById('loginErr').textContent = '';
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('adminNavItem').style.display = 'none';
}

// ── PWA Service Worker registrieren ──────────────────────────
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
