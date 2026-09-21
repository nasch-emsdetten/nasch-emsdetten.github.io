// ── Kalender-Einstellungen UI ────────────────────────────────
function renderKalenderEinstellungen() {
  const user   = AppState.currentUser;
  const status = CalendarSync.getStatus();
  const isAdmin = user?.role === 'admin';

  return `
    <div class="section-hdr">Kalender-Synchronisierung</div>
    <div class="card" style="margin-bottom:12px;">

      <!-- Google Kalender -->
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;background:#E6F1FB;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📅</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">Google Kalender</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Schichten automatisch in deinen Kalender</div>
          </div>
          <span id="googleStatus" style="font-size:10px;border-radius:4px;padding:2px 7px;font-weight:600;${status.google?'background:#E1F5EE;color:#085041;':'background:#f1f5f9;color:#6b7280;border:1px solid #e5e7eb;'}">${status.google?'Verbunden':'Nicht verbunden'}</span>
        </div>
        <div style="margin-top:10px;">
          ${status.google ? `
            <button class="btn btn-outline" style="padding:8px;font-size:12px;" onclick="kalenderTrennen('google')">Verbindung trennen</button>
          ` : `
            <button class="btn btn-primary" style="padding:9px;font-size:12px;" onclick="kalenderVerbinden('google')">📅 Google Kalender verbinden</button>
          `}
        </div>
      </div>

      <!-- Outlook (nur Admin/Vertretung) -->
      ${isAdmin ? `
      <div style="padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;background:#faeeda;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📧</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">Microsoft Outlook</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Für Führungskräfte mit Microsoft 365</div>
          </div>
          <span id="outlookStatus" style="font-size:10px;border-radius:4px;padding:2px 7px;font-weight:600;${status.outlook?'background:#E1F5EE;color:#085041;':'background:#f1f5f9;color:#6b7280;border:1px solid #e5e7eb;'}">${status.outlook?'Verbunden':'Nicht verbunden'}</span>
        </div>
        <div style="margin-top:10px;">
          ${status.outlook ? `
            <button class="btn btn-outline" style="padding:8px;font-size:12px;" onclick="kalenderTrennen('outlook')">Verbindung trennen</button>
          ` : `
            <button class="btn btn-primary" style="padding:9px;font-size:12px;" onclick="kalenderVerbinden('outlook')">📧 Outlook verbinden</button>
          `}
        </div>
        ${status.outlook ? `
          <div style="margin-top:8px;background:#E1F5EE;border:1px solid #1D9E75;border-radius:8px;padding:8px 10px;font-size:11px;color:#085041;">
            🔊 <strong>Alexa:</strong> "Alexa, wann arbeite ich morgen?" – Schichten werden automatisch vorgelesen.
          </div>
        ` : ''}
      </div>
      ` : ''}
    </div>

    <!-- Sync-Optionen -->
    ${(status.google || status.outlook) ? `
      <div class="card" style="margin-bottom:12px;">
        <div style="padding:12px 14px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Einstellungen</div>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:12px;font-weight:500;">Auto-Sync bei neuem Plan</div>
              <div style="font-size:10px;color:var(--muted);">Schichten automatisch übertragen</div>
            </div>
            <div id="tglAutoSync" class="toggle on" onclick="toggleKalenderOpt(this,'autoSync')">
              <div class="toggle-knob"></div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:12px;font-weight:500;">Erinnerung 60 Min. vorher</div>
              <div style="font-size:10px;color:var(--muted);">Benachrichtigung vor Schichtbeginn</div>
            </div>
            <div id="tglErinnerung" class="toggle on" onclick="toggleKalenderOpt(this,'erinnerung')">
              <div class="toggle-knob"></div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;">
            <div>
              <div style="font-size:12px;font-weight:500;">Bei Schichtänderung benachrichtigen</div>
              <div style="font-size:10px;color:var(--muted);">Wenn Plan geändert wird</div>
            </div>
            <div id="tglAenderung" class="toggle on" onclick="toggleKalenderOpt(this,'aenderung')">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="manuellerKalenderSync()" style="margin-bottom:8px;">
        🔄 Jetzt synchronisieren
      </button>
    ` : ''}

    <!-- Nächste Schichten-Vorschau -->
    <div class="section-hdr" style="margin-top:4px;">Nächste Schichten im Kalender</div>
    <div class="card">
      ${naechsteSchichtenVorschau()}
    </div>
  `;
}

// ── Vorschau nächster Schichten ──────────────────────────────
function naechsteSchichtenVorschau() {
  const uid    = AppState.currentUserId;
  const shifts = PLAN[uid] || [];
  const heute  = new Date(); heute.setHours(0,0,0,0);
  const monday = getMonday(AppState.weekOffset);
  let html = '';
  let anzahl = 0;

  for(let i = 0; i < 7 && anzahl < 5; i++) {
    const datum = new Date(monday);
    datum.setDate(monday.getDate() + i);
    if(datum < heute) continue;
    const s = shifts[i];
    if(!s || s.t === '-') continue;

    const titel = CalendarSync._schichtTitel(s, AppState.currentUser);
    const { start } = CalendarSync._schichtZeiten(s, datum);
    const datumStr = datum.toLocaleDateString('de-DE', {weekday:'short',day:'2-digit',month:'2-digit'});
    const zeitStr  = s.z || '–';
    const farbe    = {F:'var(--early)',S:'var(--late)',U:'#FBEAF0',KV:'#fef08a',BS:'#EEEDFE'}[s.t]||'#f1f5f9';
    const tColor   = {F:'var(--early-t)',S:'var(--late-t)',U:'#72243E',KV:'#633806',BS:'#3C3489'}[s.t]||'#333';

    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="width:8px;height:36px;border-radius:4px;background:${farbe};border:1px solid ${tColor};opacity:0.7;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:600;">${datumStr}</div>
        <div style="font-size:11px;color:var(--muted);">${zeitStr}${s.r?' · '+(typeof activityText==='function'?activityText(s.r):(Array.isArray(s.r)?s.r.join(' + '):s.r)):''}</div>
      </div>
      <div style="font-size:11px;color:var(--muted);">→ Kalender</div>
    </div>`;
    anzahl++;
  }

  return html || '<div style="padding:14px;text-align:center;color:var(--muted);font-size:12px;">Keine bevorstehenden Schichten</div>';
}

// ── Verbindung herstellen ────────────────────────────────────
async function kalenderVerbinden(typ) {
  try {
    if(typ === 'google') {
      await CalendarSync.verbindeGoogle();
      // Sofort aktuelle Woche sync
      await CalendarSync.syncWoche(AppState.currentUserId, AppState.weekOffset);
    } else if(typ === 'outlook') {
      await CalendarSync.verbindeOutlook();
      await CalendarSync.syncWoche(AppState.currentUserId, AppState.weekOffset);
    }
    // UI aktualisieren
    goTo('pageKalender');
    initPage('pageKalender');
  } catch(err) {
    alert(`Verbindung fehlgeschlagen: ${err.message}`);
  }
}

// ── Verbindung trennen ───────────────────────────────────────
function kalenderTrennen(typ) {
  if(!confirm(`${typ === 'google' ? 'Google Kalender' : 'Outlook'} trennen?`)) return;
  if(typ === 'google') {
    sessionStorage.removeItem('nasch_google_token');
    CalendarSync._googleToken = null;
    CalendarSync._googleVerbunden = false;
  } else {
    sessionStorage.removeItem('nasch_outlook_token');
    CalendarSync._outlookToken = null;
    CalendarSync._outlookVerbunden = false;
  }
  goTo('pageKalender');
  initPage('pageKalender');
}

// ── Toggle-Einstellungen ─────────────────────────────────────
const _kalenderOpts = { autoSync:true, erinnerung:true, aenderung:true };
function toggleKalenderOpt(el, opt) {
  _kalenderOpts[opt] = !_kalenderOpts[opt];
  el.classList.toggle('on',  _kalenderOpts[opt]);
  el.classList.toggle('off', !_kalenderOpts[opt]);
}

// ── Manueller Sync ───────────────────────────────────────────
async function manuellerKalenderSync() {
  try {
    await CalendarSync.syncWoche(AppState.currentUserId, AppState.weekOffset);
    alert('✓ Kalender aktualisiert!');
  } catch(err) {
    alert('Fehler: ' + err.message);
  }
}

window.renderKalenderEinstellungen = renderKalenderEinstellungen;
window.kalenderVerbinden = kalenderVerbinden;
window.kalenderTrennen   = kalenderTrennen;
window.toggleKalenderOpt = toggleKalenderOpt;
window.manuellerKalenderSync = manuellerKalenderSync;
