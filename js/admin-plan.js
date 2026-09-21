// ── Admin-Planungsseite mit Bearbeitungs-Modus ───────────────

function renderAdminPlan() {
  const el = document.getElementById('pageAdminPlan');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">
      ‹ <span style="font-size:13px;">Zurück</span>
    </div>

    ${renderSyncPanel()}

    <!-- Wochenwahl + Bearbeitungs-Toggle -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <div class="week-nav" style="flex:1;margin-bottom:0;">
        <span class="week-btn" onclick="AdminPlan.prevWeek()">‹</span>
        <span class="week-label" id="adminWeekLabel">KW 41</span>
        <span class="week-btn" onclick="AdminPlan.nextWeek()">›</span>
      </div>
      <button id="editToggleBtn" onclick="AdminPlan.toggleEditMode()"
        style="padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--radius);
               background:var(--card);font-size:12px;font-weight:600;cursor:pointer;
               white-space:nowrap;color:var(--text);">
        ✏️ Bearbeiten
      </button>
    </div>

    <div id="editModeBanner" style="display:none;" class="banner banner-info" style="margin-bottom:8px;">
      <span class="banner-icon">✏️</span>
      <span>Bearbeitungs-Modus aktiv – Zelle antippen zum Bearbeiten</span>
    </div>

    <div class="legend" style="margin-bottom:8px;">
      <div class="leg"><div class="leg-box" style="background:#FFF2CC;"></div>Früh</div>
      <div class="leg"><div class="leg-box" style="background:#FAE5D3;"></div>Spät</div>
      <div class="leg"><div class="leg-box" style="background:#FBEAF0;"></div>Urlaub</div>
      <div class="leg"><div class="leg-box" style="background:#faeeda;"></div>Wunschfrei</div>
      <div class="leg"><div class="leg-box" style="background:#FCEBEB;"></div>Konflikt</div>
    </div>

    <div class="plan-wrap">
      <table class="plan-table" id="adminPlanTable"></table>
    </div>

    <!-- Speichern-Leiste (nur im Bearbeitungs-Modus) -->
    <div id="saveBar" style="display:none;position:sticky;bottom:0;left:0;right:0;
      background:var(--card);border-top:1px solid var(--border);
      padding:10px 12px;display:none;gap:8px;z-index:100;">
      <button onclick="AdminPlan.speichern()" style="flex:1;padding:11px;border:none;
        border-radius:var(--radius);background:#1D9E75;color:#fff;font-size:13px;
        font-weight:600;cursor:pointer;">💾 Plan speichern</button>
      <button onclick="AdminPlan.verwerfen()" style="padding:11px 16px;border:1.5px solid var(--border);
        border-radius:var(--radius);background:var(--card);font-size:13px;cursor:pointer;">Abbrechen</button>
    </div>
  `;

  AdminPlan.editMode = false;
  AdminPlan.aenderungen = {};
  AdminPlan.render();
  if(typeof SheetsSync !== 'undefined') SheetsSync._setSyncStatus('ok','✓ Aus Google Sheets geladen');
}

// ── Schicht-Editor Modal ─────────────────────────────────────
function zeigeSchichtEditor(uid, tagIdx, aktuelleSchicht) {
  // Vorhandenes Modal entfernen
  const vorhandenes = document.getElementById('schichtModal');
  if(vorhandenes) vorhandenes.remove();

  const user = USERS[uid];
  const monday = getMonday(AdminPlan.weekOffset);
  const datum = new Date(monday); datum.setDate(monday.getDate() + tagIdx);
  const datumStr = datum.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'});

  // Schicht-Optionen je nach Rolle
  const isAdmin = ['admin','vertretung'].includes(user.role);
  const isAzubi = user.azubi === true;

  const SCHICHT_OPTIONEN = [
    { t:'-',  label:'– Frei',         farbe:'#f8fafc',   text:'#6b7280' },
    { t:'F',  label:'🌅 Frühschicht', farbe:'#FFF2CC',   text:'#7D6608' },
    { t:'S',  label:'🌙 Spätschicht', farbe:'#FAE5D3',   text:'#784212' },
    { t:'WF', label:'🏖 Wunschfrei',  farbe:'#FBEAF0',   text:'#72243E' },
    { t:'U',  label:'✈️ Urlaub',      farbe:'#FBEAF0',   text:'#72243E' },
    { t:'KV', label:'👥 KV',          farbe:'#fef08a',   text:'#633806' },
    { t:'K',  label:'🤒 Krank',       farbe:'#FCEBEB',   text:'#791F1F' },
    { t:'R',  label:'🧹 Reinigung',   farbe:'#d0f4f4',   text:'#0e6e6e' },
    ...(isAdmin ? [
      { t:'HO', label:'🏠 Home-Office',farbe:'#E6F1FB',   text:'#0C447C' },
      { t:'T',  label:'📋 Tagung',     farbe:'#FAE5D3',   text:'#784212' },
      { t:'O',  label:'🏢 Büro',       farbe:'#e8ddd4',   text:'#6b4c36' },
    ] : []),
    ...(isAzubi ? [
      { t:'BS', label:'📚 Berufsschule',farbe:'#EEEDFE',  text:'#3C3489' },
    ] : []),
  ];

  // Zeiten je Schichttyp
  const ZEITEN = {
    F: ['08:00–15:30','09:00–15:30','09:30–15:30','08:00–14:00'],
    S: ['15:30–22:00','16:00–22:00','18:00–22:00','12:00–20:00'],
    KV:['08:00–15:30','15:30–22:00','09:00–18:00'],
    R: ['06:00–10:00','07:00–12:00'],
  };

  // Tätigkeiten
  const TAETIGKEITEN = ['Vo/GL','V/SL','V','SL','GL','TO','B','HO','TAG','BÜ',''];

  const akt = aktuelleSchicht || {t:'-',z:'',r:''};

  const modal = document.createElement('div');
  modal.id = 'schichtModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:rgba(0,0,0,0.45);
    display:flex;align-items:flex-end;
    -webkit-tap-highlight-color:transparent;
  `;

  modal.innerHTML = `
    <div style="background:var(--card);border-radius:16px 16px 0 0;
      width:100%;max-height:85vh;overflow-y:auto;
      padding-bottom:env(safe-area-inset-bottom,0px);">

      <!-- Kopfzeile -->
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:14px 16px 10px;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:14px;font-weight:700;">${user.name}</div>
          <div style="font-size:12px;color:var(--muted);">${datumStr}</div>
        </div>
        <button onclick="schliesseModal()" style="width:30px;height:30px;border-radius:50%;
          border:none;background:#f1f5f9;font-size:16px;cursor:pointer;color:var(--muted);">✕</button>
      </div>

      <!-- Schicht-Auswahl -->
      <div style="padding:12px 16px;">
        <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px;">Schicht wählen</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;" id="schichtOptGrid">
          ${SCHICHT_OPTIONEN.map(opt => `
            <div onclick="waehleSchichtTyp('${opt.t}')"
              id="sopt_${opt.t}"
              style="padding:10px 12px;border-radius:var(--radius);cursor:pointer;
                border:2px solid ${akt.t===opt.t?opt.text:var_border()};
                background:${akt.t===opt.t?opt.farbe:'var(--card)'};
                font-size:12px;font-weight:600;
                color:${akt.t===opt.t?opt.text:'var(--text)'};
                transition:all 0.1s;">
              ${opt.label}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Zeit (nur wenn F/S/KV/R ausgewählt) -->
      <div id="zeitSection" style="padding:0 16px 12px;${['F','S','KV','R'].includes(akt.t)?'':'display:none;'}">
        <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;">Uhrzeit</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;" id="zeitOptGrid">
          ${(ZEITEN[akt.t]||[]).map(z => `
            <div onclick="waehleZeit('${z}')" id="zopt_${z.replace(':','').replace('–','_')}"
              style="padding:7px 12px;border-radius:20px;cursor:pointer;font-size:12px;
                border:1.5px solid ${akt.z===z?'var(--navy)':'var(--border)'};
                background:${akt.z===z?'#f0f5ff':'var(--card)'};
                color:${akt.z===z?'var(--navy)':'var(--text)'};font-weight:500;">
              ${z}
            </div>
          `).join('')}
          <div style="display:flex;align-items:center;gap:4px;">
            <input type="text" id="zeitFreitext" placeholder="HH:MM–HH:MM"
              value="${!ZEITEN[akt.t]?.includes(akt.z) && akt.z ? akt.z : ''}"
              style="padding:6px 10px;border:1.5px solid var(--border);border-radius:20px;
                     font-size:12px;width:120px;"
              oninput="waehleZeitFreitext(this.value)">
          </div>
        </div>
      </div>

      <!-- Tätigkeit (nur wenn F/S) -->
      <div id="rollSection" style="padding:0 16px 12px;${['F','S'].includes(akt.t)?'':'display:none;'}">
        <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;">Tätigkeit</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="rollOptGrid">
          ${TAETIGKEITEN.map(r => `
            <div onclick="waehleRolle('${r}')" id="ropt_${r||'leer'}"
              style="padding:6px 12px;border-radius:20px;cursor:pointer;font-size:12px;
                border:1.5px solid ${akt.r===r?'var(--navy)':'var(--border)'};
                background:${akt.r===r?'#f0f5ff':'var(--card)'};
                color:${akt.r===r?'var(--navy)':'var(--text)'};font-weight:500;">
              ${r||'–'}
            </div>
          `).join('')}
          <input type="text" id="rolleFreitext" placeholder="Eigene…"
            value="${!TAETIGKEITEN.includes(akt.r) ? akt.r : ''}"
            style="padding:6px 10px;border:1.5px solid var(--border);border-radius:20px;
                   font-size:12px;width:90px;"
            oninput="waehleRolleFreitext(this.value)">
        </div>
      </div>

      <!-- Übernehmen-Button -->
      <div style="padding:8px 16px 16px;">
        <button onclick="uebernehmeSchicht('${uid}',${tagIdx})"
          style="width:100%;padding:13px;border:none;border-radius:var(--radius);
            background:var(--navy);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">
          ✓ Übernehmen
        </button>
      </div>
    </div>
  `;

  // Modal-State
  window._modalState = {
    uid, tagIdx,
    t: akt.t, z: akt.z, r: akt.r,
    schichtOptionen: SCHICHT_OPTIONEN,
    zeiten: ZEITEN,
  };

  // Klick außerhalb schließt Modal
  modal.addEventListener('click', e => { if(e.target === modal) schliesseModal(); });
  document.body.appendChild(modal);
}

function var_border() { return 'var(--border)'; }

// ── Modal-Interaktionen ──────────────────────────────────────
function waehleSchichtTyp(typ) {
  const st = window._modalState;
  st.t = typ;

  // Optionen aktualisieren
  st.schichtOptionen.forEach(opt => {
    const el = document.getElementById('sopt_'+opt.t);
    if(!el) return;
    const active = opt.t === typ;
    el.style.borderColor  = active ? opt.text  : 'var(--border)';
    el.style.background   = active ? opt.farbe : 'var(--card)';
    el.style.color        = active ? opt.text  : 'var(--text)';
  });

  // Zeit + Tätigkeit je nach Typ anzeigen
  const zeitSection = document.getElementById('zeitSection');
  const rollSection = document.getElementById('rollSection');
  if(zeitSection) zeitSection.style.display = ['F','S','KV','R'].includes(typ) ? 'block' : 'none';
  if(rollSection) rollSection.style.display = ['F','S'].includes(typ) ? 'block' : 'none';

  // Zeit-Optionen neu laden
  const zeitGrid = document.getElementById('zeitOptGrid');
  if(zeitGrid && st.zeiten[typ]) {
    st.z = st.zeiten[typ][0] || '';
    const freitext = `<div style="display:flex;align-items:center;gap:4px;">
      <input type="text" id="zeitFreitext" placeholder="HH:MM–HH:MM"
        style="padding:6px 10px;border:1.5px solid var(--border);border-radius:20px;font-size:12px;width:120px;"
        oninput="waehleZeitFreitext(this.value)">
    </div>`;
    zeitGrid.innerHTML = st.zeiten[typ].map(z => `
      <div onclick="waehleZeit('${z}')" id="zopt_${z.replace(':','').replace('–','_')}"
        style="padding:7px 12px;border-radius:20px;cursor:pointer;font-size:12px;
          border:1.5px solid ${st.z===z?'var(--navy)':'var(--border)'};
          background:${st.z===z?'#f0f5ff':'var(--card)'};
          color:${st.z===z?'var(--navy)':'var(--text)'};font-weight:500;">
        ${z}
      </div>
    `).join('') + freitext;
  }
}

function waehleZeit(zeit) {
  window._modalState.z = zeit;
  document.getElementById('zeitFreitext').value = '';
  document.querySelectorAll('[id^="zopt_"]').forEach(el => {
    el.style.borderColor = 'var(--border)';
    el.style.background  = 'var(--card)';
    el.style.color       = 'var(--text)';
  });
  const id = 'zopt_'+zeit.replace(':','').replace('–','_');
  const el = document.getElementById(id);
  if(el) { el.style.borderColor='var(--navy)'; el.style.background='#f0f5ff'; el.style.color='var(--navy)'; }
}

function waehleZeitFreitext(val) { window._modalState.z = val; }

function waehleRolle(rolle) {
  window._modalState.r = rolle;
  document.getElementById('rolleFreitext').value = '';
  document.querySelectorAll('[id^="ropt_"]').forEach(el => {
    el.style.borderColor = 'var(--border)';
    el.style.background  = 'var(--card)';
    el.style.color       = 'var(--text)';
  });
  const id = 'ropt_'+(rolle||'leer');
  const el = document.getElementById(id);
  if(el) { el.style.borderColor='var(--navy)'; el.style.background='#f0f5ff'; el.style.color='var(--navy)'; }
}

function waehleRolleFreitext(val) { window._modalState.r = val; }

function uebernehmeSchicht(uid, tagIdx) {
  const st = window._modalState;
  const neuSchicht = { t: st.t, z: st.z || '', r: st.r || '' };

  // In Plan übernehmen
  if(!PLAN[uid]) PLAN[uid] = Array(7).fill({t:'-',z:'',r:''});
  PLAN[uid][tagIdx] = neuSchicht;

  // Als Änderung merken
  if(!AdminPlan.aenderungen[uid]) AdminPlan.aenderungen[uid] = {};
  AdminPlan.aenderungen[uid][tagIdx] = neuSchicht;

  schliesseModal();
  AdminPlan.render();

  // Speichern-Leiste anzeigen
  const bar = document.getElementById('saveBar');
  if(bar) bar.style.display = 'flex';
}

function schliesseModal() {
  const modal = document.getElementById('schichtModal');
  if(modal) modal.remove();
}

// ── AdminPlan Objekt (erweitert) ─────────────────────────────
const AdminPlan = {
  weekOffset: 0,
  editMode: false,
  aenderungen: {},

  prevWeek() { this.weekOffset--; this.render(); },
  nextWeek()  { this.weekOffset++; this.render(); },

  toggleEditMode() {
    this.editMode = !this.editMode;
    const btn = document.getElementById('editToggleBtn');
    const banner = document.getElementById('editModeBanner');
    if(btn) {
      btn.textContent = this.editMode ? '👁 Nur ansehen' : '✏️ Bearbeiten';
      btn.style.background = this.editMode ? '#f0f5ff' : 'var(--card)';
      btn.style.borderColor= this.editMode ? 'var(--navy)' : 'var(--border)';
      btn.style.color = this.editMode ? 'var(--navy)' : 'var(--text)';
    }
    if(banner) banner.style.display = this.editMode ? 'flex' : 'none';
    this.render();
  },

  render() {
    const monday = getMonday(this.weekOffset);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    const kw = getKW(monday);
    const today = new Date(); today.setHours(0,0,0,0);

    const lbl = document.getElementById('adminWeekLabel');
    if(lbl) lbl.textContent = `KW ${kw} · ${formatDate(monday)}–${formatDate(sunday)}${monday.getFullYear()}`;

    const dates = [];
    for(let i=0;i<7;i++) {
      const d = new Date(monday); d.setDate(monday.getDate()+i); dates.push(d);
    }

    const konflikte = this._berechneKonflikte(dates);
    const geaendert = Object.keys(this.aenderungen);

    let html = '<thead><tr>';
    html += '<th class="name-col" style="min-width:90px;position:sticky;left:0;z-index:3;">Mitarbeiter</th>';
    dates.forEach((d,i) => {
      const isToday = d.toDateString() === today.toDateString();
      html += `<th class="${isToday?'today-th':''}" style="min-width:52px;">
        ${DAYS[i]}<br><small>${formatDate(d)}</small>
      </th>`;
    });
    html += '<th style="background:#1e3a5f;color:#e8f4fd;min-width:48px;font-size:9px;">F/S<br>Σ</th></tr></thead><tbody>';

    let gesamtF=0, gesamtS=0;
    Object.entries(USERS).forEach(([uid, user]) => {
      const shifts = PLAN[uid] || Array(7).fill({t:'-',z:'',r:''});
      let wocheF=0, wocheS=0;
      const hatAenderung = geaendert.includes(uid);

      html += `<tr${hatAenderung?' style="background:#fffdf0;"':''}>`;
      html += `<td class="name-cell" style="font-size:11px;position:sticky;left:0;z-index:1;${hatAenderung?'background:#fffdf0;':''}">
        ${hatAenderung?'<span style="color:#eab308;font-size:9px;">●</span> ':''}${user.name}<br>
        <small style="color:var(--muted);font-weight:400;">${user.typ}</small>
      </td>`;

      dates.forEach((d,i) => {
        const isToday  = d.toDateString() === today.toDateString();
        const s        = shifts[i] || {t:'-'};
        const konflikt = konflikte[i]?.includes(uid);
        const editierbar = this.editMode;
        const istGeaendert = this.aenderungen[uid]?.[i] !== undefined;

        let tdStyle = '';
        if(isToday)    tdStyle += 'background:rgba(30,58,95,0.04);';
        if(konflikt)   tdStyle += 'outline:1.5px solid #E24B4A;outline-offset:-1px;';
        if(istGeaendert) tdStyle += 'background:#fffae8;';

        const klickAttr = editierbar
          ? `onclick="zeigeSchichtEditor('${uid}',${i},${JSON.stringify(s).replace(/"/g,"'")})"
             style="${tdStyle}cursor:pointer;"
             title="Schicht bearbeiten"`
          : `style="${tdStyle}"`;

        html += `<td ${klickAttr}>`;
        if(editierbar) {
          html += `<div style="position:relative;">
            ${shiftLabel(s)}
            <div style="position:absolute;top:1px;right:1px;font-size:8px;opacity:0.4;">✏</div>
          </div>`;
        } else {
          html += shiftLabel(s);
        }
        html += `</td>`;

        if(s.t==='F') { wocheF++; gesamtF++; }
        if(s.t==='S') { wocheS++; gesamtS++; }
      });

      html += `<td style="background:#f8fafc;text-align:center;font-size:10px;">
        <span style="color:var(--early-t);display:block;font-weight:600;">F:${wocheF}</span>
        <span style="color:var(--late-t);display:block;font-weight:600;">S:${wocheS}</span>
      </td></tr>`;
    });

    // Tagessummen-Zeile
    html += '<tr style="background:#f8fafc;border-top:2px solid var(--border);">';
    html += '<td class="name-cell" style="background:#f8fafc;font-size:10px;font-weight:600;position:sticky;left:0;z-index:1;">Tagessumme</td>';
    dates.forEach((_,i) => {
      let f=0,s=0;
      Object.values(PLAN).forEach(sh => { const x=(sh||[])[i]; if(x?.t==='F')f++; if(x?.t==='S')s++; });
      html += `<td style="background:#f8fafc;text-align:center;padding:4px;">
        <span style="color:var(--early-t);display:block;font-size:10px;font-weight:600;">F:${f}</span>
        <span style="color:var(--late-t);display:block;font-size:10px;font-weight:600;">S:${s}</span>
        <span style="color:var(--text);display:block;font-size:9px;">∑${f+s}</span>
      </td>`;
    });
    html += `<td style="background:#1e3a5f;color:#e8f4fd;text-align:center;padding:6px;">
      <span style="display:block;font-size:9px;color:#fef9ec;">F:${gesamtF}</span>
      <span style="display:block;font-size:9px;color:#fde8d0;">S:${gesamtS}</span>
      <span style="display:block;font-size:10px;font-weight:700;border-top:1px solid rgba(255,255,255,.3);margin-top:2px;padding-top:2px;">∑${gesamtF+gesamtS}</span>
    </td></tr></tbody>`;

    document.getElementById('adminPlanTable').innerHTML = html;
  },

  // ── Plan speichern ──────────────────────────────────────────
  async speichern() {
    const kw     = getKW(getMonday(this.weekOffset));
    const kwJahr = `${getMonday(this.weekOffset).getFullYear()}-KW${kw}`;

    try {
      // In Firestore speichern
      if(window.FBData) {
        await window.FBData.saveWochenplan(kwJahr, { plan: PLAN, syncedAt: new Date().toISOString() });
      }

      // Mitarbeiter benachrichtigen
      for(const uid of Object.keys(this.aenderungen)) {
        if(window.FBData) {
          await window.FBData.sendeNotification(uid, 'plan',
            'Wochenplan wurde aktualisiert',
            `Deine Schichten für KW ${kw} wurden geändert. Bitte in der App prüfen.`
          );
        }
        // Kalender aktualisieren
        if(typeof CalendarSync !== 'undefined') {
          setTimeout(() => CalendarSync.syncWoche(uid, this.weekOffset), 500);
        }
      }

      // Änderungen zurücksetzen
      this.aenderungen = {};
      document.getElementById('saveBar').style.display = 'none';
      this.render();

      // Toast
      const t = document.createElement('div');
      t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#085041;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:500;z-index:9999;';
      t.textContent = '✓ Plan gespeichert – Mitarbeiter wurden benachrichtigt';
      document.body.appendChild(t);
      setTimeout(()=>t.remove(), 3000);

    } catch(err) {
      alert('Fehler beim Speichern: ' + err.message);
    }
  },

  // ── Änderungen verwerfen ────────────────────────────────────
  verwerfen() {
    if(!Object.keys(this.aenderungen).length || confirm('Alle Änderungen verwerfen?')) {
      // Ursprüngliche Schichten wiederherstellen
      // (in Produktion: aus Firestore neu laden)
      this.aenderungen = {};
      document.getElementById('saveBar').style.display = 'none';
      this.render();
    }
  },

  _berechneKonflikte(dates) {
    const konflikte = {};
    konflikte[0] = ['robin-berkenheide','zaira-jara']; // Demo
    return konflikte;
  },
};

// initPage hook
const _origInitPageAdmin = window.initPage;
window.initPage = function(pageId) {
  if(pageId === 'pageAdminPlan') renderAdminPlan();
  else if(typeof _origInitPageAdmin === 'function') _origInitPageAdmin(pageId);
};

window.zeigeSchichtEditor  = zeigeSchichtEditor;
window.schliesseModal      = schliesseModal;
window.waehleSchichtTyp    = waehleSchichtTyp;
window.waehleZeit          = waehleZeit;
window.waehleZeitFreitext  = waehleZeitFreitext;
window.waehleRolle         = waehleRolle;
window.waehleRolleFreitext = waehleRolleFreitext;
window.uebernehmeSchicht   = uebernehmeSchicht;
window.AdminPlan           = AdminPlan;
