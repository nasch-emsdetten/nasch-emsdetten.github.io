// ── Seiten-Initialisierung ───────────────────────────────────
// Wird aufgerufen wenn goTo() eine Seite öffnet

function initPage(pageId) {
  switch(pageId) {
    case 'pageWunsch':      renderWunsch();      break;
    case 'pageKrank':       renderKrank();       break;
    case 'pageStundenzettel': renderStundenzettel(); break;
    case 'pageVerfuegbar':  renderVerfuegbar();  break;
    case 'pageHomeOffice':  renderHomeOffice();  break;
    case 'pageAdminWunsch': renderAdminWunsch(); break;
    case 'pageAdminKrank':  renderAdminKrank();  break;
    case 'pageAdminKV':     renderAdminKV();     break;
    case 'pageAdminMitarbeiter': renderAdminMitarbeiter(); break;
    case 'pageAdminStunden': renderAdminStunden(); break;
  }
}

// ── Hilfsfunktionen ──────────────────────────────────────────
function badge(text, type) {
  const colors = {
    ok:   'background:#E1F5EE;color:#085041;',
    warn: 'background:#faeeda;color:#633806;',
    err:  'background:#FCEBEB;color:#791F1F;',
    info: 'background:#E6F1FB;color:#0C447C;',
    gray: 'background:#f1f5f9;color:#6b7280;border:1px solid #e5e7eb;',
  };
  return `<span style="font-size:10px;border-radius:4px;padding:2px 7px;font-weight:600;${colors[type]||colors.gray}">${text}</span>`;
}

function banner(icon, text, type) {
  const types = {
    warn: 'banner-warn', info: 'banner-info', ok: 'banner-ok',
  };
  return `<div class="banner ${types[type]||'banner-info'}">
    <span class="banner-icon">${icon}</span>
    <span>${text}</span>
  </div>`;
}

function rowCard(label, value) {
  return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:1px solid var(--border);">
    <span style="color:var(--muted);">${label}</span>
    <span style="font-weight:600;color:var(--text);">${value}</span>
  </div>`;
}

// ════════════════════════════════════════════════════════════
//  WUNSCHFREI / URLAUB
// ════════════════════════════════════════════════════════════
function renderWunsch() {
  const user = AppState.currentUser;
  const isVZ = user.typ === 'VZ';
  const isTZ = user.typ === 'TZ';
  const kontingent = isVZ ? 3 : isTZ ? 2 : 1;
  const beantragt = 1; // Demo-Wert
  const rest = kontingent - beantragt;

  const el = document.getElementById('pageWunsch');
  el.innerHTML = `
    <!-- Zurück -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">
      ‹ <span style="font-size:13px;">Zurück</span>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:12px;">
      <div id="tabWF" style="flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;background:var(--navy);color:#fff;cursor:pointer;" onclick="wunschTab('WF')">Wunschfrei</div>
      <div id="tabURL" style="flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;background:var(--card);color:var(--muted);cursor:pointer;" onclick="wunschTab('URL')">Urlaub</div>
      <div id="tabHist" style="flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;background:var(--card);color:var(--muted);cursor:pointer;" onclick="wunschTab('HIST')">Verlauf</div>
    </div>

    <!-- Wunschfrei -->
    <div id="wfPanel">
      ${banner('⏰', 'Frist: Fr., 02.10.2026 · gilt für KW 41–43', 'warn')}

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
        <div class="stat-card">
          <div class="stat-lbl">Kontingent / Zyklus</div>
          <div class="stat-val" style="${rest<=0?'color:#E24B4A;':''}">${rest} von ${kontingent}</div>
        </div>
        <div class="stat-card">
          <div class="stat-lbl">Bereits beantragt</div>
          <div class="stat-val">${beantragt} Tag${beantragt!==1?'e':''}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Neuer Antrag</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Datum</label>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
              <div>
                <label style="font-size:10px;color:var(--muted);">Von</label>
                <input type="date" id="wfVon" style="width:100%;font-size:13px;margin-top:2px;"
                  min="2026-10-05" value="2026-10-06">
              </div>
              <div>
                <label style="font-size:10px;color:var(--muted);">Bis (optional)</label>
                <input type="date" id="wfBis" style="width:100%;font-size:13px;margin-top:2px;"
                  min="2026-10-05">
              </div>
            </div>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Schicht</label>
            <div style="display:flex;flex-direction:column;gap:6px;" id="wfSchichtOpts">
              ${wfSchichtOpt('ganztag', 'Ganzer Tag frei', '1 Tag', true)}
              ${wfSchichtOpt('frueh',   'Nur Frühschicht frei', '½ Tag', false)}
              ${wfSchichtOpt('spaet',   'Nur Spätschicht frei', '½ Tag', false)}
            </div>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Hinweis (optional)</label>
            <input type="text" id="wfHinweis" placeholder="z.B. Arzttermin…" style="width:100%;font-size:13px;">
          </div>

          <div style="color:#E24B4A;font-size:12px;min-height:16px;" id="wfErr"></div>

          <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--success-t);display:none;align-items:center;gap:8px;" id="wfSuccess">
            ✓ Antrag gesendet – Lee Ko wurde benachrichtigt.
          </div>

          <button class="btn btn-primary" onclick="sendeWunsch()">Antrag absenden</button>
        </div>
      </div>
    </div>

    <!-- Urlaub -->
    <div id="urlPanel" style="display:none;">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
        <div class="stat-card">
          <div class="stat-lbl">Jahresanspruch</div>
          <div class="stat-val">${isVZ?25:isTZ?20:0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-lbl">Resturlaub</div>
          <div class="stat-val" style="color:var(--navy);">${user.urlaubRest}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Urlaubsantrag</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            <div>
              <label style="font-size:10px;color:var(--muted);">Von</label>
              <input type="date" id="urlVon" style="width:100%;font-size:13px;" value="2026-11-03">
            </div>
            <div>
              <label style="font-size:10px;color:var(--muted);">Bis</label>
              <input type="date" id="urlBis" style="width:100%;font-size:13px;" value="2026-11-07">
            </div>
          </div>
          ${banner('ℹ️', 'Bitte Urlaub so früh wie möglich beantragen.', 'info')}
          <input type="text" placeholder="Bemerkung (optional)" style="width:100%;font-size:13px;">
          <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--success-t);display:none;align-items:center;gap:8px;" id="urlSuccess">
            ✓ Urlaubsantrag gesendet.
          </div>
          <button class="btn btn-primary" onclick="sendeUrlaub()">Antrag absenden</button>
        </div>
      </div>
    </div>

    <!-- Verlauf -->
    <div id="histPanel" style="display:none;">
      <div class="section-hdr">Meine Anträge 2026</div>
      <div class="card">
        ${histItem('Wunschfrei', 'Fr., 09.10.2026', 'Nur Früh · KW 41', 'ok', 'Genehmigt')}
        ${histItem('Urlaub', '20.07.–10.08.2026', '15 Tage · Sommerurlaub', 'ok', 'Genehmigt')}
        ${histItem('Wunschfrei', 'Do., 03.09.2026', 'Ganzer Tag · KW 36', 'ok', 'Genehmigt')}
        ${histItem('Wunschfrei', 'Sa., 15.08.2026', 'Ganzer Tag · KW 33', 'err', 'Abgelehnt')}
        ${histItem('Urlaub', '24.12.–02.01.2027', '8 Tage · Weihnachten', 'warn', 'Offen')}
      </div>
    </div>
  `;
}

function wfSchichtOpt(val, label, tag, checked) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius);border:1px solid ${checked?'#1e3a5f':'var(--border)'};background:${checked?'#f0f5ff':'var(--card)'};cursor:pointer;" onclick="selectWfSchicht('${val}',this)">
    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${checked?'#1e3a5f':'var(--muted)'};background:${checked?'#1e3a5f':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${checked?'<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>':''}
    </div>
    <span style="flex:1;font-size:13px;font-weight:500;">${label}</span>
    <span style="font-size:10px;background:${val==='ganztag'?'#FBEAF0':'#faeeda'};color:${val==='ganztag'?'#72243E':'#633806'};border-radius:4px;padding:2px 6px;font-weight:600;">${tag}</span>
  </div>`;
}

function histItem(typ, datum, meta, badgeType, badgeLabel) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);">
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:600;color:var(--text);">${typ} – ${datum}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${meta}</div>
    </div>
    ${badge(badgeLabel, badgeType)}
  </div>`;
}

let wfSchicht = 'ganztag';
function selectWfSchicht(val, el) {
  wfSchicht = val;
  const opts = document.querySelectorAll('#wfSchichtOpts > div');
  const labels = [
    {v:'ganztag',l:'Ganzer Tag frei',t:'1 Tag'},
    {v:'frueh',  l:'Nur Frühschicht frei',t:'½ Tag'},
    {v:'spaet',  l:'Nur Spätschicht frei',t:'½ Tag'},
  ];
  document.getElementById('wfSchichtOpts').innerHTML =
    labels.map(lb => wfSchichtOpt(lb.v, lb.l, lb.t, lb.v===val)).join('');
  // Re-attach events
  document.querySelectorAll('#wfSchichtOpts > div').forEach((div, i) => {
    div.onclick = () => selectWfSchicht(labels[i].v, div);
  });
}

function wunschTab(t) {
  ['WF','URL','HIST'].forEach(id => {
    const btn = document.getElementById('tab'+id);
    if(btn) { btn.style.background = id===t ? 'var(--navy)' : 'var(--card)'; btn.style.color = id===t ? '#fff' : 'var(--muted)'; }
  });
  document.getElementById('wfPanel').style.display  = t==='WF'   ? 'block' : 'none';
  document.getElementById('urlPanel').style.display = t==='URL'  ? 'block' : 'none';
  document.getElementById('histPanel').style.display= t==='HIST' ? 'block' : 'none';
}

function sendeWunsch() {
  const von = document.getElementById('wfVon').value;
  if(!von) { document.getElementById('wfErr').textContent = 'Bitte ein Datum wählen.'; return; }
  document.getElementById('wfErr').textContent = '';
  const sb = document.getElementById('wfSuccess');
  sb.style.display = 'flex';
  setTimeout(() => sb.style.display = 'none', 3000);
}

function sendeUrlaub() {
  const sb = document.getElementById('urlSuccess');
  sb.style.display = 'flex';
  setTimeout(() => sb.style.display = 'none', 3000);
}

// ════════════════════════════════════════════════════════════
//  KRANKMELDUNG
// ════════════════════════════════════════════════════════════
function renderKrank() {
  const user = AppState.currentUser;
  const el = document.getElementById('pageKrank');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">
      ‹ <span style="font-size:13px;">Zurück</span>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:12px;">
      <div id="tabKM" style="flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;background:var(--navy);color:#fff;cursor:pointer;" onclick="krankTab('KM')">Krankmeldung</div>
      <div id="tabKV2" style="flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;background:var(--card);color:var(--muted);cursor:pointer;" onclick="krankTab('KV2')">Verlauf</div>
    </div>

    <!-- Krankmeldung -->
    <div id="kmPanel">
      ${banner('📞', 'Zuerst telefonisch melden! Diese Bestätigung ersetzt nicht den Anruf.', 'warn')}

      <div class="card">
        <div class="card-header"><div class="card-title">Digitale Bestätigung</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            <div>
              <label style="font-size:10px;color:var(--muted);">Krank ab</label>
              <input type="date" id="krankVon" style="width:100%;font-size:13px;" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div>
              <label style="font-size:10px;color:var(--muted);">Voraussichtlich bis</label>
              <input type="date" id="krankBis" style="width:100%;font-size:13px;">
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:12px;color:var(--muted);">Ich bestätige hiermit:</label>
            ${krankOpt('anruf', '✅ Anruf wurde getätigt', 'Ich habe Lee Ko telefonisch informiert.', true)}
            ${krankOpt('kein',  '📱 Anruf noch nicht möglich', 'Ich rufe so schnell wie möglich an.', false)}
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Hinweis (optional)</label>
            <input type="text" id="krankHinweis" placeholder="z.B. voraussichtlich 2–3 Tage" style="width:100%;font-size:13px;">
          </div>

          <div style="color:#E24B4A;font-size:12px;min-height:16px;" id="krankErr"></div>

          <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--success-t);display:none;align-items:center;gap:8px;" id="krankSuccess">
            ✓ Krankmeldung bestätigt – Lee Ko wurde benachrichtigt.
          </div>

          <button class="btn btn-primary" onclick="sendeKrank()">Krankmeldung absenden</button>
        </div>
      </div>

      ${banner('ℹ️', 'Attest-Pflicht ab dem 3. Krankheitstag. Du wirst automatisch erinnert.', 'info')}
    </div>

    <!-- Verlauf -->
    <div id="kv2Panel" style="display:none;">
      <div class="section-hdr">Krankmeldungen 2026</div>
      <div class="card">
        ${krankHistItem('08.–09.09.2026', '2 Tage', 'Kein Attest nötig', 'ok')}
        ${krankHistItem('15.–16.08.2026', '2 Tage', 'Kein Attest nötig', 'ok')}
        ${krankHistItem('03.–08.06.2026', '6 Tage', 'Attest eingegangen', 'ok')}
      </div>
    </div>
  `;
}

function krankOpt(val, label, sub, checked) {
  return `<div id="krankOpt_${val}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:var(--radius);border:1px solid ${checked?'#1e3a5f':'var(--border)'};background:${checked?'#f0f5ff':'var(--card)'};cursor:pointer;" onclick="selectKrankOpt('${val}')">
    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${checked?'#1e3a5f':'var(--muted)'};background:${checked?'#1e3a5f':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
      ${checked?'<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>':''}
    </div>
    <div>
      <div style="font-size:13px;font-weight:500;">${label}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${sub}</div>
    </div>
  </div>`;
}

function krankHistItem(datum, dauer, attest, status) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);">
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:600;">${datum}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px;">${dauer} · ${attest}</div>
    </div>
    ${badge('Genesen', status)}
  </div>`;
}

let krankOpt_selected = 'anruf';
function selectKrankOpt(val) {
  krankOpt_selected = val;
  ['anruf','kein'].forEach(v => {
    const el = document.getElementById('krankOpt_'+v);
    if(!el) return;
    const active = v === val;
    el.style.borderColor = active ? '#1e3a5f' : 'var(--border)';
    el.style.background  = active ? '#f0f5ff' : 'var(--card)';
  });
}

function krankTab(t) {
  ['KM','KV2'].forEach(id => {
    const btn = document.getElementById('tab'+id);
    if(btn) { btn.style.background = id===t ? 'var(--navy)' : 'var(--card)'; btn.style.color = id===t ? '#fff' : 'var(--muted)'; }
  });
  document.getElementById('kmPanel').style.display  = t==='KM'  ? 'block' : 'none';
  document.getElementById('kv2Panel').style.display = t==='KV2' ? 'block' : 'none';
}

function sendeKrank() {
  const von = document.getElementById('krankVon').value;
  if(!von) { document.getElementById('krankErr').textContent = 'Bitte Startdatum angeben.'; return; }
  document.getElementById('krankErr').textContent = '';
  const sb = document.getElementById('krankSuccess');
  sb.style.display = 'flex';
  setTimeout(() => sb.style.display = 'none', 3000);
}

// ════════════════════════════════════════════════════════════
//  STUNDENZETTEL (Mitarbeiter)
// ════════════════════════════════════════════════════════════
function renderStundenzettel() {
  const user = AppState.currentUser;
  const el = document.getElementById('pageStundenzettel');
  const heute = new Date();
  const letzterTag = new Date(heute.getFullYear(), heute.getMonth()+1, 0);
  const istLetzterTag = heute.getDate() === letzterTag.getDate();
  const stundenBis22 = letzterTag;
  stundenBis22.setHours(22,0,0,0);
  const gesperrt = heute > stundenBis22;

  el.innerHTML = gesperrt ? `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">‹ <span style="font-size:13px;">Zurück</span></div>
    <div class="sperr-screen">
      <div class="sperr-icon">🔒</div>
      <div class="sperr-title">Wochenplan gesperrt</div>
      <div class="sperr-body">Stundenzettel September 2026 wurde nicht bis zum 30.09. um 22:00 Uhr unterschrieben.</div>
      <button class="btn btn-primary" style="max-width:280px;" onclick="scrollToSign()">Jetzt unterschreiben →</button>
      ${banner('ℹ️', 'KV-Anfragen sind weiterhin sichtbar.', 'info')}
    </div>
  ` : `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">‹ <span style="font-size:13px;">Zurück</span></div>

    ${banner('⏰', 'Frist: 31.10.2026 bis 22:00 Uhr · danach wird der Wochenplan gesperrt.', 'warn')}

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
      <div class="stat-card"><div class="stat-lbl">Mitarbeiter</div><div style="font-size:13px;font-weight:600;margin-top:4px;">${user.name}</div></div>
      <div class="stat-card"><div class="stat-lbl">Monat</div><div style="font-size:13px;font-weight:600;margin-top:4px;">Oktober 2026</div></div>
      <div class="stat-card"><div class="stat-lbl">Soll-Stunden</div><div class="stat-val">${user.typ==='VZ'?160:user.typ==='TZ'?80:'-'}</div></div>
      <div class="stat-card"><div class="stat-lbl">Ist-Stunden</div><div class="stat-val" style="color:#085041;">158h</div></div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="card-header"><div class="card-title">Wochenübersicht</div></div>
      <div class="card-body" style="padding:0;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;">Woche</th>
            <th style="padding:8px;text-align:center;color:var(--muted);font-weight:600;">Früh</th>
            <th style="padding:8px;text-align:center;color:var(--muted);font-weight:600;">Spät</th>
            <th style="padding:8px 12px;text-align:right;color:var(--muted);font-weight:600;">Gesamt</th>
          </tr></thead>
          <tbody>
            ${['KW 40','KW 41','KW 42','KW 43'].map((kw,i)=>{
              const rows = [[3,1,38],[2,2,40],[3,1,40],[2,1,40]];
              const r = rows[i];
              return `<tr style="border-top:1px solid var(--border);">
                <td style="padding:8px 12px;font-weight:500;">${kw}</td>
                <td style="padding:8px;text-align:center;color:var(--early-t);">${r[0]}</td>
                <td style="padding:8px;text-align:center;color:var(--late-t);">${r[1]}</td>
                <td style="padding:8px 12px;text-align:right;font-weight:600;">${r[2]}h</td>
              </tr>`;
            }).join('')}
            <tr style="border-top:2px solid var(--border);background:#f8fafc;">
              <td style="padding:8px 12px;font-weight:700;">Gesamt</td>
              <td style="padding:8px;text-align:center;color:var(--early-t);font-weight:700;">10</td>
              <td style="padding:8px;text-align:center;color:var(--late-t);font-weight:700;">5</td>
              <td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--navy);">158h</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" id="signCard">
      <div class="card-header"><div class="card-title">Digitale Unterschrift</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
        <div style="border:1.5px dashed var(--border);border-radius:var(--radius);background:#fafafa;overflow:hidden;">
          <canvas id="sigCanvas" style="display:block;touch-action:none;width:100%;height:80px;"></canvas>
        </div>
        <div style="color:#E24B4A;font-size:12px;min-height:14px;" id="sigErr"></div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
          <button class="btn btn-outline" onclick="clearSig()">✕ Löschen</button>
          <button class="btn btn-success" onclick="unterschreiben()">✓ Unterschreiben</button>
        </div>
      </div>
    </div>

    <div id="signedCard" style="display:none;">
      <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:16px;text-align:center;margin-bottom:12px;">
        <div style="font-size:28px;margin-bottom:6px;">✅</div>
        <div style="font-size:15px;font-weight:700;color:#085041;">${user.name}</div>
        <div style="font-size:12px;color:#085041;margin-top:4px;">Unterschrieben · ${new Date().toLocaleDateString('de-DE')} · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr</div>
      </div>
      ${banner('📧', 'PDF wird am 31.10. um 22:05 Uhr an das Personal Büro gesendet.', 'info')}
      <button class="btn btn-outline mt-8" onclick="alert('PDF wird im Browser geöffnet…')">🖨 Drucken / PDF speichern</button>
    </div>
  `;

  // Unterschrift-Canvas einrichten
  setTimeout(() => {
    const canvas = document.getElementById('sigCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 80;
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;
    let hasSig = false;
    window._sigCtx = ctx;
    window._sigHas = () => hasSig;
    window._sigClear = () => { ctx.clearRect(0,0,canvas.width,canvas.height); hasSig=false; };

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX-r.left)*(canvas.width/r.width), y: (src.clientY-r.top)*(canvas.height/r.height) };
    }
    canvas.addEventListener('mousedown', e => { drawing=true; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); });
    canvas.addEventListener('mousemove', e => { if(!drawing)return; const p=getPos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); hasSig=true; });
    canvas.addEventListener('mouseup', () => drawing=false);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing=true; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }, {passive:false});
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if(!drawing)return; const p=getPos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); hasSig=true; }, {passive:false});
    canvas.addEventListener('touchend', () => drawing=false);
  }, 100);
}

function clearSig() { if(window._sigClear) window._sigClear(); }
function unterschreiben() {
  if(!window._sigHas || !window._sigHas()) {
    document.getElementById('sigErr').textContent = 'Bitte zuerst unterschreiben.';
    return;
  }
  document.getElementById('signCard').style.display = 'none';
  document.getElementById('signedCard').style.display = 'block';
}

// ════════════════════════════════════════════════════════════
//  VERFÜGBARKEIT
// ════════════════════════════════════════════════════════════
function renderVerfuegbar() {
  const TAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const gespeichert = {Mo:'g',Di:'g',Mi:'n',Do:'g',Fr:'f',Sa:'f',So:'n'};
  const aktuell = {...gespeichert};

  const el = document.getElementById('pageVerfuegbar');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">‹ <span style="font-size:13px;">Zurück</span></div>
    ${banner('🔒', 'Änderungen sind erst nach Genehmigung durch Lee Ko aktiv.', 'warn')}
    <div class="section-hdr">Verfügbarkeit pro Tag</div>
    ${TAGE.map(tag => verfuegbarTag(tag, gespeichert[tag])).join('')}
    <div id="verfGrundWrap" style="display:none;margin-top:8px;">
      <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Begründung (Pflicht bei Änderung)</label>
      <textarea id="verfGrund" placeholder="z.B. neuer Schulstundenplan…" style="width:100%;font-size:13px;min-height:56px;resize:none;"></textarea>
    </div>
    <div style="color:#E24B4A;font-size:12px;min-height:14px;margin-top:4px;" id="verfErr"></div>
    <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--success-t);display:none;align-items:center;gap:8px;margin-top:8px;" id="verfSuccess">
      ✓ Änderung gesendet – wartet auf Genehmigung.
    </div>
    <button class="btn btn-primary mt-8" id="verfSendBtn" style="display:none;" onclick="sendeVerfuegbar()">Änderung senden</button>
  `;

  window._verfAktuell = {...gespeichert};
  window._verfGespeichert = {...gespeichert};
}

function verfuegbarTag(tag, sel) {
  const OPTS = [{k:'g',l:'Ganztag'},{k:'f',l:'Nur Früh'},{k:'s',l:'Nur Spät'},{k:'n',l:'Nicht verf.'}];
  const colors = {g:'var(--success)',f:'var(--early)',s:'var(--late)',n:'var(--danger)'};
  const textColors = {g:'var(--success-t)',f:'var(--early-t)',s:'var(--late-t)',n:'var(--danger-t)'};
  return `<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:6px;">
    <div style="display:flex;align-items:center;padding:8px 12px;background:#f8fafc;">
      <span style="font-size:13px;font-weight:600;flex:1;">${tag}</span>
      <span id="verfStat_${tag}" style="font-size:11px;color:var(--muted);">${OPTS.find(o=>o.k===sel)?.l||''}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;padding:6px;">
      ${OPTS.map(o=>`<div onclick="selectVerf('${tag}','${o.k}')" id="verfOpt_${tag}_${o.k}"
        style="padding:7px 6px;border-radius:4px;border:1px solid ${o.k===sel?colors[o.k]:'var(--border)'};
          background:${o.k===sel?colors[o.k]:'var(--card)'};text-align:center;cursor:pointer;
          font-size:11px;font-weight:600;color:${o.k===sel?textColors[o.k]:'var(--muted)'};">${o.l}</div>`).join('')}
    </div>
  </div>`;
}

function selectVerf(tag, key) {
  const OPTS = [{k:'g',l:'Ganztag'},{k:'f',l:'Nur Früh'},{k:'s',l:'Nur Spät'},{k:'n',l:'Nicht verf.'}];
  const colors = {g:'var(--success)',f:'var(--early)',s:'var(--late)',n:'var(--danger)'};
  const textColors = {g:'var(--success-t)',f:'var(--early-t)',s:'var(--late-t)',n:'var(--danger-t)'};
  OPTS.forEach(o => {
    const el = document.getElementById(`verfOpt_${tag}_${o.k}`);
    if(!el) return;
    const active = o.k === key;
    el.style.background   = active ? colors[o.k]     : 'var(--card)';
    el.style.borderColor  = active ? colors[o.k]     : 'var(--border)';
    el.style.color        = active ? textColors[o.k] : 'var(--muted)';
  });
  document.getElementById(`verfStat_${tag}`).textContent = OPTS.find(o=>o.k===key)?.l||'';
  if(window._verfAktuell) window._verfAktuell[tag] = key;

  const hasChange = window._verfAktuell && window._verfGespeichert &&
    Object.keys(window._verfAktuell).some(t => window._verfAktuell[t] !== window._verfGespeichert[t]);
  document.getElementById('verfGrundWrap').style.display = hasChange ? 'block' : 'none';
  document.getElementById('verfSendBtn').style.display   = hasChange ? 'block' : 'none';
}

function sendeVerfuegbar() {
  const grund = document.getElementById('verfGrund').value.trim();
  if(!grund) { document.getElementById('verfErr').textContent = 'Bitte eine Begründung angeben.'; return; }
  document.getElementById('verfErr').textContent = '';
  const sb = document.getElementById('verfSuccess');
  sb.style.display = 'flex';
  document.getElementById('verfSendBtn').style.display = 'none';
  document.getElementById('verfGrundWrap').style.display = 'none';
  setTimeout(() => sb.style.display='none', 3000);
}

// ════════════════════════════════════════════════════════════
//  HOME-OFFICE
// ════════════════════════════════════════════════════════════
function renderHomeOffice() {
  const el = document.getElementById('pageHomeOffice');
  const heute = new Date().toISOString().slice(0,10);
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('profil')">‹ <span style="font-size:13px;">Zurück</span></div>
    ${banner('🏠', 'Home-Office ist unabhängig vom Wochenplan und wird von dir selbst eingetragen.', 'info')}
    <div class="card">
      <div class="card-header"><div class="card-title">Home-Office eintragen</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
          <div>
            <label style="font-size:10px;color:var(--muted);">Datum</label>
            <input type="date" id="hoDate" style="width:100%;font-size:13px;" value="${heute}">
          </div>
          <div>
            <label style="font-size:10px;color:var(--muted);">Uhrzeit von</label>
            <input type="time" id="hoVon" style="width:100%;font-size:13px;" value="09:00">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
          <div>
            <label style="font-size:10px;color:var(--muted);">Uhrzeit bis</label>
            <input type="time" id="hoBis" style="width:100%;font-size:13px;" value="17:00">
          </div>
          <div>
            <label style="font-size:10px;color:var(--muted);">Pause</label>
            <input type="time" id="hoPause" style="width:100%;font-size:13px;" value="00:30">
          </div>
        </div>
        <input type="text" placeholder="Tätigkeit (optional)" style="width:100%;font-size:13px;">
        <div style="background:var(--success);border:1px solid #1D9E75;border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--success-t);display:none;align-items:center;gap:8px;" id="hoSuccess">
          ✓ Home-Office eingetragen – Lee Ko wurde informiert.
        </div>
        <button class="btn btn-primary" onclick="sendeHO()">Home-Office eintragen</button>
      </div>
    </div>
    <div class="section-hdr mt-8">Zuletzt eingetragen</div>
    <div class="card">
      ${histItem('Home-Office','Di., 15.09.2026','09:00–17:00 · 7,5h','ok','Erfasst')}
      ${histItem('Home-Office','Mo., 07.09.2026','10:00–16:30 · 6h','ok','Erfasst')}
    </div>
  `;
}

function sendeHO() {
  const sb = document.getElementById('hoSuccess');
  sb.style.display = 'flex';
  setTimeout(() => sb.style.display='none', 3000);
}

// ════════════════════════════════════════════════════════════
//  ADMIN: WUNSCHFREI GENEHMIGEN
// ════════════════════════════════════════════════════════════
function renderAdminWunsch() {
  const el = document.getElementById('pageAdminWunsch');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">‹ <span style="font-size:13px;">Zurück</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">
      <div class="stat-card"><div class="stat-lbl">Offen</div><div class="stat-val" style="color:#E24B4A;">3</div></div>
      <div class="stat-card"><div class="stat-lbl">Genehmigt</div><div class="stat-val" style="color:#085041;">8</div></div>
      <div class="stat-card"><div class="stat-lbl">Abgelehnt</div><div class="stat-val">2</div></div>
    </div>
    <div class="section-hdr">Offene Anträge</div>
    ${adminAntrag('RB','Robin B.','#1e3a5f','Mo., 05.10.2026','Ganzer Tag · KW 41 · Aushilfe','Zaira J. hat denselben Tag beantragt',1)}
    ${adminAntrag('ZJ','Zaira J.','#633806','Mo., 05.10.2026','Ganzer Tag · KW 41 · Aushilfe','Robin B. hat denselben Tag beantragt',2)}
    ${adminAntrag('LW','Lina W.','#854F0B','Fr., 09.10.2026','Nur Frühschicht · KW 41 · Teilzeit','',3)}
  `;
}

function adminAntrag(init,name,color,datum,meta,konflikt,id) {
  return `<div class="card" id="antrag_${id}" style="border-color:${konflikt?'#E24B4A':'var(--border)'};">
    <div class="card-header">
      <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;">${init}</div>
      <div style="flex:1;margin-left:8px;">
        <div style="font-size:13px;font-weight:600;">${name}</div>
        <div style="font-size:11px;color:var(--muted);">${meta}</div>
      </div>
      ${badge('Offen','warn')}
    </div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:6px;">
      ${rowCard('Datum', datum)}
      ${konflikt ? `<div style="background:var(--danger);border:1px solid #F09595;border-radius:4px;padding:6px 8px;font-size:11px;color:var(--danger-t);">⚠ ${konflikt}</div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:4px;" id="antragAct_${id}">
        <button class="btn btn-success" style="padding:9px;" onclick="adminGenehmige(${id})">✓ Genehmigen</button>
        <button class="btn" style="padding:9px;background:#E24B4A;color:#fff;" onclick="adminAblehnen(${id})">✕ Ablehnen</button>
      </div>
    </div>
  </div>`;
}

function adminGenehmige(id) {
  const act = document.getElementById('antragAct_'+id);
  const card = document.getElementById('antrag_'+id);
  if(act) act.innerHTML = '<div style="color:#085041;font-size:12px;padding:4px 0;">✓ Genehmigt – Mitarbeiter wird benachrichtigt</div>';
  if(card) card.style.borderColor = '#1D9E75';
}
function adminAblehnen(id) {
  const act = document.getElementById('antragAct_'+id);
  const card = document.getElementById('antrag_'+id);
  if(act) act.innerHTML = '<div style="color:#E24B4A;font-size:12px;padding:4px 0;">✕ Abgelehnt – Mitarbeiter wird benachrichtigt</div>';
  if(card) card.style.borderColor = 'var(--border)';
}

// ════════════════════════════════════════════════════════════
//  ADMIN: KRANKMELDUNGEN
// ════════════════════════════════════════════════════════════
function renderAdminKrank() {
  const el = document.getElementById('pageAdminKrank');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">‹ <span style="font-size:13px;">Zurück</span></div>
    <div class="section-hdr">Aktuell krank (2)</div>
    ${krankCard('JH','Jennifer H.','#185FA5','Vollzeit','seit Mo., 14.09.2026','6 Tage','⚠ Attest fällig',true)}
    ${krankCard('LW','Lina W.','#854F0B','Teilzeit','seit Fr., 18.09.2026','2 Tage','Attest ab Tag 3 – noch nicht fällig',false)}
  `;
}

function krankCard(init,name,color,typ,seit,tage,attest,attestFaellig) {
  return `<div class="card" style="border-color:${attestFaellig?'#eab308':'var(--border)'};">
    <div class="card-header">
      <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;">${init}</div>
      <div style="flex:1;margin-left:8px;">
        <div style="font-size:13px;font-weight:600;">${name}</div>
        <div style="font-size:11px;color:var(--muted);">${typ} · ${seit}</div>
      </div>
      ${badge(attestFaellig?'⚠ Attest':'Krank', attestFaellig?'warn':'err')}
    </div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:6px;">
      ${rowCard('Kranktage', tage)}
      ${rowCard('Attest', attest)}
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:4px;">
        ${attestFaellig ? `<button class="btn btn-outline" style="padding:9px;font-size:12px;" onclick="alert('Erinnerung gesendet!')">📨 Attest-Erinnerung</button>` : '<div></div>'}
        <button class="btn btn-primary" style="padding:9px;font-size:12px;" onclick="alert('Ersatz-Suche geöffnet')">👥 Ersatz suchen</button>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════
//  ADMIN: KV-SYSTEM
// ════════════════════════════════════════════════════════════
function renderAdminKV() {
  const el = document.getElementById('pageAdminKV');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">‹ <span style="font-size:13px;">Zurück</span></div>
    ${banner('⏰', 'Frist: Verbindlich bis 16:15 Uhr · danach freiwillig', 'warn')}
    <div class="section-hdr">Offene KV heute</div>
    <div class="card" style="margin-bottom:12px;border-color:#E24B4A;">
      <div class="card-header">
        <span style="font-size:20px;">⚠️</span>
        <div style="flex:1;margin-left:8px;">
          <div style="font-size:13px;font-weight:600;">Robin B. – Spätschicht</div>
          <div style="font-size:11px;color:var(--muted);">17:00–22:00 · verbindlich bis 16:15</div>
        </div>
        ${badge('Offen','err')}
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:8px;">
        <div class="section-hdr">Verfügbare Mitarbeiter</div>
        ${kvMaRow('SS','Suba S.','#085041','Teilzeit · hat frei')}
        ${kvMaRow('CB','Carina B.','#993C1D','Aushilfe · verfügbar')}
        ${kvMaRowDisabled('LH','Luisa H.','#0F6E56','Aushilfe · Monatsgrenze fast erreicht')}
      </div>
    </div>
    <button class="btn btn-primary" onclick="alert('Neue KV-Anforderung')">+ Neue KV-Anforderung erstellen</button>
  `;
}

function kvMaRow(init,name,color,meta) {
  return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
    <div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">${init}</div>
    <div style="flex:1;"><div style="font-size:12px;font-weight:600;">${name}</div><div style="font-size:10px;color:var(--muted);">${meta}</div></div>
    <button class="btn btn-success" style="padding:6px 12px;font-size:12px;width:auto;" onclick="alert('Anfrage an ${name} gesendet')">Anfragen</button>
  </div>`;
}

function kvMaRowDisabled(init,name,color,meta) {
  return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;opacity:0.5;">
    <div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">${init}</div>
    <div style="flex:1;"><div style="font-size:12px;font-weight:600;">${name}</div><div style="font-size:10px;color:var(--muted);">${meta}</div></div>
    <button class="btn btn-outline" style="padding:6px 12px;font-size:12px;width:auto;" disabled>Grenze</button>
  </div>`;
}

// ════════════════════════════════════════════════════════════
//  ADMIN: MITARBEITERLISTE
// ════════════════════════════════════════════════════════════
function renderAdminMitarbeiter() {
  const MINIJOB = 43; // Max Stunden
  const el = document.getElementById('pageAdminMitarbeiter');
  const DEMO_IST = {'1001':98,'1002':145,'1003':168,'1004':62,'1005':55,
    '1006':48,'1007':38,'1008':52,'1009':28,'1010':38,'1011':41,'1012':18,'1013':43,'1014':12,'1015':8};

  let html = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">‹ <span style="font-size:13px;">Zurück</span></div>
    <div class="section-hdr">Oktober 2026</div>
  `;

  ['VZ','TZ','AH'].forEach(typ => {
    const label = typ==='VZ'?'Vollzeit':typ==='TZ'?'Teilzeit':'Aushilfen';
    html += `<div class="section-hdr">${label}</div>`;
    Object.entries(USERS).filter(([,u]) => u.typ===typ).forEach(([uid,u]) => {
      const ist = DEMO_IST[uid]||0;
      const soll = typ==='AH' ? MINIJOB : u.typ==='VZ' ? 160 : 80;
      const pct = Math.min(Math.round(ist/soll*100),110);
      const status = pct>100?'err':pct>=85?'warn':'ok';
      const barColor = status==='err'?'#E24B4A':status==='warn'?'#eab308':'#1D9E75';
      html += `<div class="card" style="margin-bottom:6px;border-left:3px solid ${barColor};">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;">${u.initials}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">${u.name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:1px;">${ist}h / ${soll}h ${typ==='AH'?'(Minijob-Max)':'Soll'}</div>
            <div style="height:5px;background:var(--border);border-radius:3px;margin-top:4px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(pct,100)}%;background:${barColor};border-radius:3px;"></div>
            </div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${barColor};">${pct}%</span>
        </div>
      </div>`;
    });
  });

  el.innerHTML = html;
}

// ════════════════════════════════════════════════════════════
//  ADMIN: STUNDENZETTEL
// ════════════════════════════════════════════════════════════
function renderAdminStunden() {
  const el = document.getElementById('pageAdminStunden');
  const STATUS = {
    '1001':'ok','1002':'ok','1003':'ok','1004':'ok','1005':'ok',
    '1006':'ok','1007':'miss','1008':'ok','1009':'ok','1010':'ok',
    '1011':'ok','1012':'miss','1013':'ok','1014':'ok','1015':'ok',
  };
  const ok = Object.values(STATUS).filter(s=>s==='ok').length;
  const miss = Object.values(STATUS).filter(s=>s==='miss').length;

  let html = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">‹ <span style="font-size:13px;">Zurück</span></div>
    ${banner('📧', '31.10. · 22:05 Uhr: PDF an Personal Büro (alswede@nasch.com)', 'info')}
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
      <div class="stat-card"><div class="stat-lbl">Unterschrieben</div><div class="stat-val" style="color:#085041;">${ok}</div></div>
      <div class="stat-card"><div class="stat-lbl">Ausstehend</div><div class="stat-val" style="color:#E24B4A;">${miss}</div></div>
    </div>
    <div class="section-hdr">Übersicht Oktober 2026</div>
    <div class="card">
  `;
  Object.entries(USERS).forEach(([uid,u]) => {
    const s = STATUS[uid];
    html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">${u.initials}</div>
      <div style="flex:1;font-size:12px;font-weight:600;">${u.name}</div>
      ${badge(s==='ok'?'Unterschrieben':'Fehlt', s==='ok'?'ok':'err')}
    </div>`;
  });
  html += `</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
      <button class="btn btn-outline" onclick="alert('Sperrung aufgehoben')">🔓 Sperrung aufheben</button>
      <button class="btn btn-primary" onclick="alert('PDF wird geöffnet…')">🖨 Alle drucken (PDF)</button>
    </div>
  `;
  el.innerHTML = html;
}
