// ── SANDBOX: Admin-Einstellungen für Mitarbeiter und Schichtplanung ──
const NaschAdminSettings = (() => {
  const KEY = 'nasch-sandbox-admin-v3';
  const SCHEMA_VERSION = 7;
  const DEFAULT_ORDER = Object.keys(USERS);
  const DEFAULT_ACTIVITIES = ['Vo/GL','V/SL','V','SL','GL','TO','B','RK'];
  const DEFAULT_ACTIVITY_LEGEND = {
    'Vo/GL':'', 'V/SL':'', 'V':'', 'SL':'', 'GL':'', 'TO':'', 'B':'',
    'RK':'Reinigung'
  };
  const DEFAULT_TIMES = {
    F:['08:00–15:30','09:30–15:30'],
    S:['15:30–22:00','16:00–22:00'],
    TS1:['08:00–12:00','09:30–13:30'],
    TS2:['16:00–20:00','18:00–22:00'],
    KV:['08:00–15:30','15:30–22:00'],
    R:['06:00–10:00'],
  };
  const DEFAULT_AVAILABILITY = {Mo:'g',Di:'g',Mi:'n',Do:'g',Fr:'f',Sa:'f',So:'n'};
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const AVAIL = {
    g:{label:'Ganztag', short:'G', bg:'#E1F5EE', fg:'#085041'},
    f:{label:'Nur Früh', short:'F', bg:'#FFF2CC', fg:'#7D6608'},
    s:{label:'Nur Spät', short:'S', bg:'#FAE5D3', fg:'#784212'},
    n:{label:'Nicht verf.', short:'–', bg:'#FCEBEB', fg:'#791F1F'},
  };

  function blank() {
    return {
      schemaVersion:SCHEMA_VERSION,
      order:[...DEFAULT_ORDER],
      profiles:{},
      activities:[...DEFAULT_ACTIVITIES],
      activityLegend:{...DEFAULT_ACTIVITY_LEGEND},
      times:JSON.parse(JSON.stringify(DEFAULT_TIMES)),
    };
  }

  let state = blank();

  function numOrNull(value) {
    if(value === '' || value === null || value === undefined) return null;
    const n = Number(String(value).replace(',','.'));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }


  function normalizeActivityList(value) {
    const raw = Array.isArray(value) ? value : (value ? [value] : []);
    const out = [];
    raw.forEach(v=>{
      const clean=String(v||'').trim();
      if(clean && !out.includes(clean)) out.push(clean);
    });
    return out;
  }

  function profileActivities(uid) {
    const p = state.profiles[uid] || {};
    if(Array.isArray(p.defaultActivities)) return normalizeActivityList(p.defaultActivities);
    if(p.defaultActivity) return normalizeActivityList(p.defaultActivity); // V3-Migration
    const u=USERS[uid]||{};
    if(Array.isArray(u.taetigkeiten)) return normalizeActivityList(u.taetigkeiten);
    return normalizeActivityList(u.taetigkeit);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if(raw) {
        const saved = JSON.parse(raw);
        const oldSchema = Number(saved.schemaVersion||0);
        state = {...blank(), ...saved};
        state.order = Array.isArray(saved.order) ? saved.order.filter(id=>USERS[id]) : [...DEFAULT_ORDER];
        DEFAULT_ORDER.forEach(id=>{ if(!state.order.includes(id)) state.order.push(id); });
        state.activities = Array.isArray(saved.activities) && saved.activities.length ? [...saved.activities] : [...DEFAULT_ACTIVITIES];
        // V7-Migration: RK als steuerndes Kürzel für Reinigung einmalig ergänzen.
        if(oldSchema < SCHEMA_VERSION && !state.activities.includes('RK')) state.activities.push('RK');
        state.activityLegend = {...DEFAULT_ACTIVITY_LEGEND, ...(saved.activityLegend||{})};
        state.activities.forEach(code=>{ if(!(code in state.activityLegend)) state.activityLegend[code]=''; });
        Object.keys(state.activityLegend).forEach(code=>{ if(!state.activities.includes(code) && code!=='RK') delete state.activityLegend[code]; });
        state.schemaVersion = SCHEMA_VERSION;
        state.times = {...DEFAULT_TIMES, ...(saved.times||{})};
        // V5-Migration: bisherige einzelne Teilschicht-Zeiten auf beide Zeitblöcke übernehmen.
        if(saved.times?.TS && !saved.times?.TS1) state.times.TS1=[...saved.times.TS];
        if(saved.times?.TS && !saved.times?.TS2) state.times.TS2=[...saved.times.TS];
        delete state.times.TS;
      }
    } catch(e) {
      console.warn('Admin-Einstellungen konnten nicht geladen werden:', e);
      state = blank();
    }
    applyProfiles();
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch(e) { console.warn('Admin-Einstellungen konnten nicht gespeichert werden:', e); }
  }

  function applyProfiles() {
    Object.entries(USERS).forEach(([uid,u])=>{
      const p = state.profiles[uid] || {};
      u.sollStundenMonat = p.monthlyHours ?? u.sollStundenMonat ?? null;
      u.stundenlohn = p.hourlyRate ?? u.stundenlohn ?? null;
      u.arbeitstageWoche = p.weeklyWorkDays ?? u.arbeitstageWoche ?? null;
      u.zuschlaege = p.surchargeEligible === true;
      const assigned = profileActivities(uid);
      u.taetigkeiten = assigned;
      u.taetigkeit = assigned.join(' + '); // Legacy-Anzeigen bleiben kompatibel
    });
  }

  function getOrder(){ return [...state.order]; }
  function entries(){ return state.order.filter(id=>USERS[id]).map(id=>[id, USERS[id]]); }
  function activities(){ return [...state.activities]; }
  function surchargeEligible(uid){ return state.profiles[uid]?.surchargeEligible === true; }
  function activityLabel(code){ return String(state.activityLegend?.[code]||'').trim(); }
  function activityDisplay(code){ const label=activityLabel(code); return label ? `${code} · ${label}` : code; }
  function times(type){ return [...(state.times[type] || [])]; }

  function move(uid, dir) {
    const i = state.order.indexOf(uid);
    const ni = i + dir;
    if(i < 0 || ni < 0 || ni >= state.order.length) return;
    [state.order[i], state.order[ni]] = [state.order[ni], state.order[i]];
    persist();
  }

  function addEmployee(uid) {
    if(!USERS[uid]) return;
    if(!state.order.includes(uid)) state.order.push(uid);
    if(!state.profiles[uid]) state.profiles[uid] = { surchargeEligible:false, defaultActivities:[] };
    applyProfiles();
    persist();
  }

  function updateProfile(uid, patch) {
    if(!USERS[uid]) return;
    const prev = state.profiles[uid] || {};
    const next = {...prev, ...patch};
    if('monthlyHours' in patch) next.monthlyHours = numOrNull(patch.monthlyHours);
    if('hourlyRate' in patch) next.hourlyRate = numOrNull(patch.hourlyRate);
    if('weeklyWorkDays' in patch) { const d=Number(patch.weeklyWorkDays); next.weeklyWorkDays=Number.isInteger(d)&&d>=1&&d<=7?d:null; }
    if('surchargeEligible' in patch) next.surchargeEligible = patch.surchargeEligible === true || patch.surchargeEligible === 'true' || patch.surchargeEligible === 1 || patch.surchargeEligible === '1';
    if('defaultActivities' in patch) {
      next.defaultActivities = normalizeActivityList(patch.defaultActivities);
      delete next.defaultActivity;
    }
    state.profiles[uid] = next;
    applyProfiles();
    persist();
  }

  function addActivity(code, label='') {
    const clean = String(code||'').trim().replace(/\s+/g,' ');
    const cleanLabel = String(label||'').trim().replace(/\s+/g,' ');
    if(!clean) return {ok:false,msg:'Bitte ein Kürzel eingeben.'};
    if(state.activities.some(x=>x.toLowerCase()===clean.toLowerCase())) return {ok:false,msg:'Dieses Kürzel gibt es bereits.'};
    state.activities.push(clean);
    state.activityLegend[clean]=cleanLabel;
    persist();
    return {ok:true};
  }

  function updateActivity(oldCode, newCode, label='') {
    const old=String(oldCode||'').trim();
    const next=String(newCode||'').trim().replace(/\s+/g,' ');
    const cleanLabel=String(label||'').trim().replace(/\s+/g,' ');
    if(!old || !state.activities.includes(old)) return {ok:false,msg:'Tätigkeit nicht gefunden.'};
    if(!next) return {ok:false,msg:'Bitte ein Kürzel eingeben.'};
    if(old==='RK' && next!=='RK') return {ok:false,msg:'RK ist das feste Kürzel für Reinigung und kann nicht umbenannt werden.'};
    if(next!==old && state.activities.some(x=>x.toLowerCase()===next.toLowerCase())) return {ok:false,msg:'Dieses Kürzel gibt es bereits.'};

    if(next!==old) {
      const idx=state.activities.indexOf(old);
      state.activities[idx]=next;
      Object.values(state.profiles).forEach(p=>{
        if(Array.isArray(p?.defaultActivities)) p.defaultActivities=p.defaultActivities.map(x=>x===old?next:x);
        if(p?.defaultActivity===old) p.defaultActivity=next;
      });
      Object.values(PLAN).forEach(days=>(days||[]).forEach(sh=>{
        if(!sh) return;
        if(Array.isArray(sh.r)) sh.r=sh.r.map(x=>x===old?next:x);
        else if(sh.r===old) sh.r=next;
      }));
      delete state.activityLegend[old];
    }
    state.activityLegend[next]=cleanLabel;
    applyProfiles();
    persist();
    if(next!==old && typeof SandboxStore!=='undefined' && SandboxStore.savePlan) SandboxStore.savePlan();
    return {ok:true};
  }

  function removeActivity(name) {
    if(name==='RK') return {ok:false,msg:'RK steuert die Schichtart Reinigung und kann nicht entfernt werden.'};
    state.activities = state.activities.filter(x=>x!==name);
    delete state.activityLegend[name];
    Object.keys(state.profiles).forEach(uid=>{
      const p=state.profiles[uid];
      if(!p) return;
      if(Array.isArray(p.defaultActivities)) p.defaultActivities=p.defaultActivities.filter(x=>x!==name);
      if(p.defaultActivity===name) p.defaultActivity='';
    });
    applyProfiles();
    persist();
    return {ok:true};
  }

  function toggleEmployeeActivity(uid, name) {
    if(!USERS[uid] || !state.activities.includes(name)) return;
    const cur=profileActivities(uid);
    const next=cur.includes(name) ? cur.filter(x=>x!==name) : [...cur,name];
    updateProfile(uid,{defaultActivities:next});
  }

  function normalizeTimeRange(value) {
    const v = String(value||'').trim().replace(/-/g,'–').replace(/\s/g,'');
    const m = v.match(/^(\d{1,2}):(\d{2})–(\d{1,2}):(\d{2})$/);
    if(!m) return null;
    const h1=Number(m[1]), mi1=Number(m[2]), h2=Number(m[3]), mi2=Number(m[4]);
    if(h1>23||h2>23||mi1>59||mi2>59) return null;
    return `${String(h1).padStart(2,'0')}:${String(mi1).padStart(2,'0')}–${String(h2).padStart(2,'0')}:${String(mi2).padStart(2,'0')}`;
  }

  function addTime(type, value) {
    const norm = normalizeTimeRange(value);
    if(!norm) return {ok:false,msg:'Format bitte z. B. 08:00–15:30.'};
    if(!state.times[type]) state.times[type]=[];
    if(state.times[type].includes(norm)) return {ok:false,msg:'Diese Zeit ist bereits vorhanden.'};
    state.times[type].push(norm);
    persist();
    return {ok:true};
  }

  function removeTime(type, value) {
    if(!state.times[type]) return;
    state.times[type] = state.times[type].filter(x=>x!==value);
    persist();
  }

  function availability(uid) {
    return SandboxStore.getAvailability(uid) || {...DEFAULT_AVAILABILITY};
  }

  function cycleAvailability(uid, day) {
    const vals = availability(uid);
    const keys = ['g','f','s','n'];
    const idx = keys.indexOf(vals[day]);
    vals[day] = keys[(idx+1)%keys.length];
    SandboxStore.saveAvailability(uid, vals);
    return vals[day];
  }

  function esc(v){ return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

  function buildAdminSettings() {
    const newEmp = document.getElementById('adminNewEmployee');
    const emp = document.getElementById('adminEmployeeSettings');
    const avail = document.getElementById('adminAvailabilityMatrix');
    const acts = document.getElementById('adminActivities');
    const timesBox = document.getElementById('adminTimeSuggestions');
    if(!newEmp || !emp || !avail || !acts || !timesBox) return;

    newEmp.innerHTML = `<div class="card" style="padding:11px 12px;overflow:visible;">
      <div style="display:grid;grid-template-columns:minmax(150px,1.7fr) minmax(85px,.7fr);gap:8px;">
        <div><label style="margin-top:0;">Name</label><input id="newEmpName" type="text" placeholder="Vor- und Nachname"></div>
        <div><label style="margin-top:0;">Art</label><select id="newEmpType"><option value="VZ">Vollzeit</option><option value="TZ">Teilzeit</option><option value="AH">Aushilfe</option></select></div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(120px,1fr) minmax(110px,1fr);gap:8px;">
        <div><label>Rolle</label><select id="newEmpRole"><option value="user">Mitarbeiter</option><option value="vertretung">Vertretung</option></select></div>
        <div><label>Start-PIN</label><input id="newEmpPin" type="password" inputmode="numeric" maxlength="4" placeholder="4 Ziffern"></div>
      </div>
      <div><label>Arbeitstage / Woche <span style="font-size:10px;color:var(--muted);font-weight:400;">(Vollzeit/Teilzeit)</span></label><input id="newEmpWorkDays" type="number" min="1" max="7" step="1" placeholder="z. B. 5"></div>
      <div style="font-size:10px;color:var(--muted);margin-top:6px;">Doppelte PINs sind möglich. Beim Login wird zusätzlich der Mitarbeitername ausgewählt. Für Vollzeit/Teilzeit werden die vereinbarten Arbeitstage pro Woche benötigt.</div>
      <button class="btn btn-primary" onclick="adminCreateEmployee()" style="margin-top:9px;">+ Mitarbeiter anlegen</button>
    </div>`;

    emp.innerHTML = entries().map(([uid,u],idx)=>{
      const p = state.profiles[uid] || {};
      const monthly = p.monthlyHours ?? u.sollStundenMonat ?? '';
      const wage = p.hourlyRate ?? u.stundenlohn ?? '';
      const weeklyDays = p.weeklyWorkDays ?? u.arbeitstageWoche ?? '';
      const surcharge = p.surchargeEligible === true;
      const assigned = profileActivities(uid);
      return `<div class="card" style="padding:10px 12px;margin-bottom:8px;overflow:visible;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:30px;height:30px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">${esc(u.initials)}</div>
          <div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.name)}</div><div style="font-size:10px;color:var(--muted);">${esc(u.typ)} · ${esc(u.label||'')}</div></div>
          <button onclick="adminResetPin('${uid}')" title="PIN zurücksetzen" style="height:30px;padding:0 8px;border:1px solid var(--border);border-radius:7px;background:#fff;cursor:pointer;font-size:10px;font-weight:700;white-space:nowrap;">🔑 PIN</button>
          <button onclick="adminMoveEmployee('${uid}',-1)" ${idx===0?'disabled':''} title="Nach oben" style="width:30px;height:30px;border:1px solid var(--border);border-radius:7px;background:#fff;cursor:pointer;">↑</button>
          <button onclick="adminMoveEmployee('${uid}',1)" ${idx===state.order.length-1?'disabled':''} title="Nach unten" style="width:30px;height:30px;border:1px solid var(--border);border-radius:7px;background:#fff;cursor:pointer;">↓</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div><label style="margin-top:0;">Stunden / Monat</label><input type="number" min="0" step="0.25" value="${monthly}" placeholder="nicht hinterlegt" onchange="adminProfileChange('${uid}','monthlyHours',this.value)"></div>
          <div><label style="margin-top:0;">Stundenlohn (€)</label><input type="number" min="0" step="0.01" value="${wage}" placeholder="nicht hinterlegt" onchange="adminProfileChange('${uid}','hourlyRate',this.value)"></div>
          ${['VZ','TZ'].includes(u.typ)?`<div><label style="margin-top:0;">Arbeitstage / Woche</label><input type="number" min="1" max="7" step="1" value="${weeklyDays}" placeholder="z. B. 5" onchange="adminProfileChange('${uid}','weeklyWorkDays',this.value)"></div>`:''}
        </div>
        <label>Zuschläge</label>
        <select onchange="adminProfileChange('${uid}','surchargeEligible',this.value==='1')">
          <option value="0" ${surcharge?'':'selected'}>Nein</option>
          <option value="1" ${surcharge?'selected':''}>Ja</option>
        </select>
        <div style="font-size:10px;color:var(--muted);margin-top:4px;">Ja = 25 % ab 20:00 Uhr bzw. 50 % an Sonn- und NRW-Feiertagen. Es gilt immer nur der höhere zutreffende Zuschlag.</div>
        <label>Standard-Tätigkeiten <span style="font-size:10px;color:var(--muted);font-weight:400;">(Mehrfachauswahl)</span></label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${state.activities.map(a=>{const on=assigned.includes(a);return `<button type="button" onclick="adminToggleEmployeeActivity('${uid}','${encodeURIComponent(a).replace(/'/g,'%27')}')" title="${esc(activityLabel(a)||a)}" style="padding:6px 10px;border-radius:20px;cursor:pointer;font-size:11px;font-weight:600;border:1.5px solid ${on?'var(--navy)':'var(--border)'};background:${on?'#f0f5ff':'#fff'};color:${on?'var(--navy)':'var(--text)'};">${on?'✓ ':''}${esc(activityDisplay(a))}</button>`}).join('')}
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:5px;">Mehrere Tätigkeiten können gleichzeitig ausgewählt werden.</div>
      </div>`;
    }).join('');

    let ah = `<div class="admin-avail-wrap"><table class="admin-avail-table"><thead><tr><th class="admin-avail-name">Mitarbeiter</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>`;
    entries().forEach(([uid,u])=>{
      const vals = availability(uid);
      ah += `<tr><td class="admin-avail-name">${esc(u.name)}</td>`;
      DAYS.forEach(day=>{
        const v=AVAIL[vals[day]]||AVAIL.g;
        ah += `<td><button onclick="adminCycleAvailability('${uid}','${day}')" title="${esc(v.label)} – tippen zum Ändern" style="width:34px;height:30px;border:1px solid ${v.fg};border-radius:6px;background:${v.bg};color:${v.fg};font-size:10px;font-weight:700;cursor:pointer;">${v.short}</button></td>`;
      });
      ah += '</tr>';
    });
    ah += '</tbody></table></div><div style="font-size:10px;color:var(--muted);margin-top:6px;">G = Ganztag · F = nur Früh · S = nur Spät · – = nicht verfügbar. Zelle antippen zum Ändern.</div>';
    avail.innerHTML=ah;

    acts.innerHTML = `<div style="font-size:10px;color:var(--muted);margin-bottom:9px;">Kürzel werden im Schichtplan angezeigt. Die Bezeichnung dient als bearbeitbare Legende. <strong>RK</strong> steuert, ob „Reinigung“ beim Mitarbeiter vorgeschlagen wird.</div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:10px;">
        ${state.activities.map((a,i)=>{const fixed=a==='RK';return `<div style="display:grid;grid-template-columns:minmax(72px,.7fr) minmax(120px,1.6fr) auto;gap:6px;align-items:center;">
          <input id="actCode_${i}" value="${esc(a)}" ${fixed?'readonly':''} aria-label="Kürzel ${esc(a)}" style="font-weight:700;${fixed?'background:#f8fafc;':''}">
          <input id="actLabel_${i}" value="${esc(activityLabel(a))}" placeholder="Bezeichnung eintragen" aria-label="Bezeichnung ${esc(a)}">
          <div style="display:flex;gap:4px;"><button class="btn btn-outline" onclick="adminSaveActivity('${encodeURIComponent(a).replace(/'/g,'%27')}',${i})" style="width:auto;min-width:0;margin:0;padding:7px 9px;">✓</button>${fixed?'':`<button onclick="adminRemoveActivity('${encodeURIComponent(a).replace(/'/g,'%27')}')" title="Entfernen" style="width:34px;border:1px solid #fecaca;background:#fff;color:#dc2626;border-radius:8px;cursor:pointer;font-size:16px;">×</button>`}</div>
        </div>`}).join('')}
      </div>
      <div style="border-top:1px solid var(--border);padding-top:9px;display:grid;grid-template-columns:minmax(72px,.7fr) minmax(120px,1.6fr) auto;gap:6px;align-items:center;">
        <input id="newActivityCode" type="text" placeholder="Kürzel, z. B. K">
        <input id="newActivityLabel" type="text" placeholder="Bezeichnung, z. B. Kasse">
        <button class="btn btn-primary" onclick="adminAddActivity()" style="width:auto;min-width:92px;margin:0;">+ Hinzufügen</button>
      </div>`;

    timesBox.innerHTML = ['F','S','TS1','TS2'].map(type=>{
      const title=type==='F'?'🌅 Frühschicht':type==='S'?'🌙 Spätschicht':type==='TS1'?'⏱ Teilschicht 1 (früh)':'⏱ Teilschicht 2 (spät)';
      return `<div class="card" style="padding:10px 12px;margin-bottom:8px;overflow:visible;"><div style="font-size:12px;font-weight:700;margin-bottom:8px;">${title}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${times(type).map(z=>`<span style="display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:20px;padding:6px 9px;background:#fff;font-size:11px;">${esc(z)}<button onclick="adminRemoveTime('${type}','${encodeURIComponent(z)}')" style="border:none;background:transparent;color:#dc2626;cursor:pointer;font-size:14px;line-height:1;">×</button></span>`).join('')||'<span style="font-size:11px;color:var(--muted);">Keine Vorschläge</span>'}</div><div style="display:flex;gap:8px;"><input id="timeInput_${type}" type="text" placeholder="08:00–15:30"><button class="btn btn-outline" onclick="adminAddTime('${type}')" style="width:auto;min-width:100px;margin-top:0;">+ Zeit</button></div></div>`;
    }).join('');
  }

  function reset(){ try{localStorage.removeItem(KEY);}catch(_){} }

  load();
  return {getOrder, entries, activities, surchargeEligible, activityLabel, activityDisplay, times, move, addEmployee, updateProfile, addActivity, updateActivity, removeActivity, toggleEmployeeActivity, profileActivities, addTime, removeTime, availability, cycleAvailability, buildAdminSettings, reset};
})();

function getOrderedUserEntries(){ return NaschAdminSettings.entries(); }
function getActivityOptions(){ return NaschAdminSettings.activities(); }
function getActivityLabel(code){ return NaschAdminSettings.activityLabel(code); }
function getActivityDisplay(code){ return NaschAdminSettings.activityDisplay(code); }
function getEmployeeActivities(uid){ return NaschAdminSettings.profileActivities(uid); }
function getEmployeeSurchargeEnabled(uid){ return NaschAdminSettings.surchargeEligible(uid); }
function getShiftTimeSuggestions(type){ return NaschAdminSettings.times(type); }


function renderActivityLegends(){
  const items=getActivityOptions().map(code=>{
    const label=getActivityLabel(code);
    return `<span style="font-size:10px;border:1px solid var(--border);border-radius:20px;padding:4px 8px;background:#fff;"><strong>${String(code).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong>${label?` = ${String(label).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}`:''}</span>`;
  }).join('');
  ['activityLegendView','adminActivityLegendView'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.innerHTML=items ? `<span style="font-size:10px;color:var(--muted);align-self:center;">Tätigkeiten:</span>${items}` : '';
  });
}

function adminMoveEmployee(uid,dir){
  NaschAdminSettings.move(uid,dir);
  NaschAdminSettings.buildAdminSettings();
  if(typeof buildMAList==='function') buildMAList();
  if(typeof buildStzList==='function') buildStzList();
  if(typeof buildAdminPlan==='function') buildAdminPlan();
  if(typeof renderPlan==='function') renderPlan();
  if(typeof showToast==='function') showToast('✓ Reihenfolge gespeichert');
}
function adminProfileChange(uid,field,value){
  NaschAdminSettings.updateProfile(uid,{[field]:value});
  if(typeof buildMAList==='function') buildMAList();
  if(typeof renderPlan==='function') renderPlan();
  if(typeof renderPersonalDailyHours==='function') renderPersonalDailyHours();
  if(typeof renderAdminDailyHours==='function') renderAdminDailyHours();
  if(AppState.currentUserId===uid && field==='monthlyHours') { const el=document.getElementById('stzSoll'); if(el) el.textContent=USERS[uid].sollStundenMonat!==null?USERS[uid].sollStundenMonat+'h':'–'; }
  if(typeof showToast==='function') showToast('✓ Mitarbeiterdaten gespeichert');
}
function adminToggleEmployeeActivity(uid,encoded){
  NaschAdminSettings.toggleEmployeeActivity(uid,decodeURIComponent(encoded));
  NaschAdminSettings.buildAdminSettings();
  if(typeof buildMAList==='function') buildMAList();
  if(typeof renderPlan==='function') renderPlan();
  if(typeof renderActivityLegends==='function') renderActivityLegends();
  if(typeof showToast==='function') showToast('✓ Tätigkeiten gespeichert');
}
function adminCycleAvailability(uid,day){
  NaschAdminSettings.cycleAvailability(uid,day);
  NaschAdminSettings.buildAdminSettings();
  if(typeof showToast==='function') showToast('✓ Verfügbarkeit gespeichert');
}
function adminAddActivity(){
  const code=document.getElementById('newActivityCode');
  const label=document.getElementById('newActivityLabel');
  const r=NaschAdminSettings.addActivity(code?.value||'',label?.value||'');
  if(!r.ok){ alert(r.msg); return; }
  if(code) code.value=''; if(label) label.value='';
  NaschAdminSettings.buildAdminSettings();
  if(typeof buildAdminPlan==='function') buildAdminPlan();
  if(typeof renderActivityLegends==='function') renderActivityLegends();
  if(typeof showToast==='function') showToast('✓ Tätigkeit hinzugefügt');
}
function adminSaveActivity(encoded,index){
  const oldCode=decodeURIComponent(encoded);
  const code=document.getElementById(`actCode_${index}`)?.value||'';
  const label=document.getElementById(`actLabel_${index}`)?.value||'';
  const r=NaschAdminSettings.updateActivity(oldCode,code,label);
  if(!r.ok){ alert(r.msg); NaschAdminSettings.buildAdminSettings(); return; }
  NaschAdminSettings.buildAdminSettings();
  if(typeof buildAdminPlan==='function') buildAdminPlan();
  if(typeof renderPlan==='function') renderPlan();
  if(typeof renderActivityLegends==='function') renderActivityLegends();
  if(typeof showToast==='function') showToast('✓ Legende gespeichert');
}
function adminRemoveActivity(encoded){
  const name=decodeURIComponent(encoded);
  if(!confirm(`Tätigkeit „${name}“ entfernen? Bestehende Schichten behalten das Kürzel.`)) return;
  const r=NaschAdminSettings.removeActivity(name);
  if(r && r.ok===false){ alert(r.msg); return; }
  NaschAdminSettings.buildAdminSettings();
  if(typeof renderActivityLegends==='function') renderActivityLegends();
  if(typeof showToast==='function') showToast('✓ Tätigkeit entfernt');
}
function adminAddTime(type){
  const i=document.getElementById(`timeInput_${type}`);
  const r=NaschAdminSettings.addTime(type,i?.value||'');
  if(!r.ok){ alert(r.msg); return; }
  if(i) i.value='';
  NaschAdminSettings.buildAdminSettings();
  if(typeof showToast==='function') showToast('✓ Zeitvorschlag hinzugefügt');
}
function adminRemoveTime(type,encoded){
  NaschAdminSettings.removeTime(type,decodeURIComponent(encoded));
  NaschAdminSettings.buildAdminSettings();
  if(typeof showToast==='function') showToast('✓ Zeitvorschlag entfernt');
}

function adminInitials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return 'MA';
  return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase().slice(0,2);
}
function adminNextEmployeeId(){
  const nums=Object.keys(USERS).map(x=>Number(x)).filter(Number.isFinite);
  return String(Math.max(1000,...nums)+1);
}
function adminCreateEmployee(){
  if(AppState.currentUser?.role!=='admin') return;
  const name=String(document.getElementById('newEmpName')?.value||'').trim().replace(/\s+/g,' ');
  const typ=document.getElementById('newEmpType')?.value||'TZ';
  const role=document.getElementById('newEmpRole')?.value==='vertretung'?'vertretung':'user';
  const pin=String(document.getElementById('newEmpPin')?.value||'').trim();
  const workDaysRaw=String(document.getElementById('newEmpWorkDays')?.value||'').trim();
  const workDays=workDaysRaw===''?null:Number(workDaysRaw);
  if(name.length<2){ alert('Bitte einen Mitarbeiternamen eingeben.'); return; }
  if(['VZ','TZ'].includes(typ) && (!Number.isInteger(workDays) || workDays<1 || workDays>7)){ alert('Bitte für Vollzeit/Teilzeit die Arbeitstage pro Woche (1–7) angeben.'); return; }
  if(!/^\d{4}$/.test(pin)){ alert('Die Start-PIN muss aus genau 4 Ziffern bestehen.'); return; }
  if((typeof BLOCKED_PINS!=='undefined'&&BLOCKED_PINS.includes(pin)) || (typeof BLOCKED!=='undefined'&&BLOCKED.includes(pin))){ alert('Diese PIN ist nicht erlaubt. Bitte eine andere 4-stellige PIN wählen.'); return; }
  const uid=adminNextEmployeeId();
  const typeLabel=typ==='VZ'?'Vollzeit':typ==='AH'?'Aushilfe':'Teilzeit';
  USERS[uid]={name,initials:adminInitials(name),typ,role,label:role==='vertretung'?`${typeLabel} · Vertretung`:typeLabel,urlaubRest:0,wunschKont:typ==='VZ'?3:typ==='TZ'?2:1,homeoffice:false,sandboxCreated:true};
  PINS[uid]=pin;
  PLAN[uid]=Array.from({length:7},()=>({t:'-',z:'',r:''}));
  if(typeof SandboxStore!=='undefined'){ SandboxStore.saveEmployee(uid); SandboxStore.savePins(); SandboxStore.savePlan(); }
  NaschAdminSettings.addEmployee(uid);
  if(['VZ','TZ'].includes(typ)) NaschAdminSettings.updateProfile(uid,{weeklyWorkDays:workDays});
  NaschAdminSettings.buildAdminSettings();
  if(typeof updateLoginEmployeeOptions==='function') updateLoginEmployeeOptions(uid);
  if(typeof buildMAList==='function') buildMAList();
  if(typeof buildStzList==='function') buildStzList();
  if(typeof buildAdminPlan==='function') buildAdminPlan();
  if(typeof renderPlan==='function') renderPlan();
  if(typeof renderAdminDailyHours==='function') renderAdminDailyHours();
  if(typeof showToast==='function') showToast(`✓ ${name} angelegt`);
}
function adminResetPin(uid){
  if(AppState.currentUser?.role!=='admin' || !USERS[uid]) return;
  const pin=prompt(`Neue 4-stellige PIN für ${USERS[uid].name}:`,'');
  if(pin===null) return;
  const clean=String(pin).trim();
  if(!/^\d{4}$/.test(clean)){ alert('Die PIN muss aus genau 4 Ziffern bestehen.'); return; }
  if((typeof BLOCKED_PINS!=='undefined'&&BLOCKED_PINS.includes(clean)) || (typeof BLOCKED!=='undefined'&&BLOCKED.includes(clean))){ alert('Diese PIN ist nicht erlaubt. Bitte eine andere PIN wählen.'); return; }
  PINS[uid]=clean;
  if(typeof SandboxStore!=='undefined') SandboxStore.savePins();
  if(typeof updateLoginEmployeeOptions==='function') updateLoginEmployeeOptions(uid);
  if(typeof showToast==='function') showToast(`✓ PIN für ${USERS[uid].name} zurückgesetzt`);
}

