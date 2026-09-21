// ── Wochenplan-Rendering ─────────────────────────────────────
const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];

function getMonday(offset = 0) {
  const d = new Date();
  d.setHours(12,0,0,0); // DST-sicherer als Mitternacht
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d;
}

function formatDate(d) {
  return d.getDate().toString().padStart(2,'0') + '.' +
         (d.getMonth()+1).toString().padStart(2,'0') + '.';
}

function formatFullDate(d) {
  return d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
}

function getKW(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function shiftClass(t) {
  const map = {
    'F':'s-early','S':'s-late','TS':'s-ho','U':'s-vacation','KV':'s-kv',
    'BS':'s-bs','O':'s-office','T':'s-meeting','HO':'s-ho',
    'R':'s-clean','WF':'s-vacation','K':'s-vacation','-':'s-off',
  };
  return map[t] || 's-off';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function activityList(value) {
  const raw=Array.isArray(value)?value:(value?[value]:[]);
  return raw.map(v=>String(v||'').trim()).filter((v,i,a)=>v&&a.indexOf(v)===i);
}
function activityText(value){ return activityList(value).join(' + '); }

// Liefert bei Teilschichten getrennte Tätigkeiten für Früh- und Spätblock.
// Alte Sandbox-Daten mit nur `r` bleiben lesbar.
function shiftActivities(s, slot) {
  if(!s) return [];
  if(s.t==='TS') {
    if(slot===1) return activityList(s.r1 && activityList(s.r1).length ? s.r1 : s.r);
    if(slot===2) return activityList(s.r2 && activityList(s.r2).length ? s.r2 : s.r);
  }
  return activityList(s.r);
}

function hoursFromTimeText(value) {
  const text=String(value||'');
  const re=/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g;
  let total=0, match;
  while((match=re.exec(text))!==null) {
    const sh=Number(match[1]), sm=Number(match[2]), eh=Number(match[3]), em=Number(match[4]);
    if(sh>23||eh>23||sm>59||em>59) continue;
    let start=sh*60+sm, end=eh*60+em;
    if(end<start) end+=24*60; // Schicht über Mitternacht
    total += Math.max(0,end-start)/60;
  }
  return total;
}

function getSplitShiftTimes(s) {
  if(!s) return ['', ''];
  let z1=String(s.z1||'').trim(), z2=String(s.z2||'').trim();
  if((!z1 || !z2) && s.z) {
    const parts=String(s.z).split(/\s+\+\s+/).map(x=>x.trim()).filter(Boolean);
    if(!z1 && parts[0]) z1=parts[0];
    if(!z2 && parts[1]) z2=parts[1];
  }
  return [z1,z2];
}

function getShiftHours(s) {
  if(!s || !s.t || ['-','U','WF','K','BS'].includes(s.t)) return 0;
  if(s.t==='TS') {
    const [z1,z2]=getSplitShiftTimes(s);
    const separated=hoursFromTimeText(z1)+hoursFromTimeText(z2);
    return separated>0 ? separated : hoursFromTimeText(s.z);
  }
  return hoursFromTimeText(s.z);
}

function getShiftCounts(s) {
  if(!s) return {f:0,s:0};
  if(s.t==='F') return {f:1,s:0};
  if(s.t==='S') return {f:0,s:1};
  if(s.t==='TS') return {f:1,s:1}; // Teilschicht = ein Früh- und ein Spätblock
  return {f:0,s:0};
}

function formatHours(value) {
  const n=Math.round((Number(value)||0)*100)/100;
  const txt=Number.isInteger(n)?String(n):String(n).replace('.',',');
  return txt+' h';
}

function shiftTypeText(s) {
  if(!s || !s.t || s.t==='-') return 'Frei';
  const labels={F:'Früh',S:'Spät',TS:'Teilschicht',U:'Urlaub',WF:'Wunschfrei',K:'Krank',KV:'KV',BS:'Berufsschule',O:'Office',T:'Tagung',HO:'Home-Office',R:'Reinigung'};
  return labels[s.t]||s.t;
}

function shiftLabel(s) {
  if(!s || s.t === '-' || !s.t) return '<span class="shift-pill s-off">–</span>';
  if(s.t==='TS') {
    const [rawZ1,rawZ2]=getSplitShiftTimes(s);
    const z1=escapeHtml(rawZ1||'–');
    const z2=escapeHtml(rawZ2||'–');
    const a1=activityText(shiftActivities(s,1));
    const a2=activityText(shiftActivities(s,2));
    return `<span class="shift-pill ${shiftClass(s.t)}" style="line-height:1.25;">
      <span>${z1}</span>${a1?`<br><small style="font-size:8px;opacity:.82;">${escapeHtml(a1)}</small>`:''}
      <span style="display:block;border-top:1px solid rgba(12,68,124,.16);margin-top:2px;padding-top:2px;">${z2}</span>${a2?`<br><small style="font-size:8px;opacity:.82;">${escapeHtml(a2)}</small>`:''}
    </span>`;
  }
  const lbl = escapeHtml(s.z || s.t);
  const txt=activityText(s.r);
  const role = txt ? `<br><small style="font-size:8px;opacity:0.8;">${escapeHtml(txt)}</small>` : '';
  return `<span class="shift-pill ${shiftClass(s.t)}">${lbl}${role}</span>`;
}

function getDayPlanStats(dayIdx) {
  let f=0,s=0,hours=0;
  Object.values(PLAN).forEach(shifts=>{
    const sh=(shifts||[])[dayIdx];
    const c=getShiftCounts(sh); f+=c.f; s+=c.s; hours+=getShiftHours(sh);
  });
  return {f,s,hours};
}

function getEmployeeWeekStats(uid) {
  let f=0,s=0,hours=0,workedDays=0;
  (PLAN[uid]||[]).slice(0,7).forEach(sh=>{
    const c=getShiftCounts(sh); f+=c.f; s+=c.s;
    const h=getShiftHours(sh); hours+=h; if(h>0) workedDays++;
  });
  return {f,s,hours,workedDays,freeDays:Math.max(0,7-workedDays)};
}
function getEmployeeRequiredFreeDays(uid){
  const u=USERS[uid]; if(!u||!['VZ','TZ'].includes(u.typ)) return null;
  const d=Number(u.arbeitstageWoche); return Number.isInteger(d)&&d>=1&&d<=7?7-d:null;
}

function getWeekTotalHours() {
  return Object.keys(USERS).reduce((sum,uid)=>sum+getEmployeeWeekStats(uid).hours,0);
}

function renderPlan() {
  const viewerIsAdmin = isAdminOrDeputy();
  if(!viewerIsAdmin && AppState.weekOffset!==0) AppState.weekOffset=0;
  const monday = getMonday(AppState.weekOffset);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const kw = getKW(monday);
  const today = new Date();
  today.setHours(0,0,0,0);

  const weekLabel = document.getElementById('wLbl');
  const planTable = document.getElementById('planTbl');
  if(!weekLabel || !planTable) return;

  weekLabel.textContent = `KW ${kw} · ${formatDate(monday)}–${formatDate(sunday)}${monday.getFullYear()}`;

  const dates = [];
  for(let i=0;i<7;i++) {
    const d = new Date(monday); d.setDate(monday.getDate()+i); dates.push(d);
  }

  const isAdmin = viewerIsAdmin;
  const visibleDays = dates.map((d,i) => ({ d, i, past: d < today })).filter(x => isAdmin || !x.past);

  let html = '<thead><tr>';
  html += '<th class="name-col">Name</th>';
  visibleDays.forEach(({d,i}) => {
    const isToday = d.toDateString() === today.toDateString();
    const cls = isToday ? 'today-th' : '';
    html += `<th class="${cls}">${DAYS[i]}<br><small>${formatDate(d)}</small></th>`;
  });
  if(isAdmin) html += '<th style="background:#1e3a5f;color:#e8f4fd;min-width:62px;">Woche</th>';
  html += '</tr></thead><tbody>';

  const myId = AppState.currentUserId;
  (typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS)).forEach(([uid, user]) => {
    const isMe = uid === myId;
    const trClass = isMe ? 'class="me-row"' : '';
    const stats=getEmployeeWeekStats(uid);
    html += `<tr ${trClass}>`;
    html += `<td class="name-cell">${isMe ? '★ ' : ''}${escapeHtml(user.name)}</td>`;

    const shifts = PLAN[uid] || [];
    visibleDays.forEach(({d,i}) => {
      const sh = shifts[i];
      const isToday = d.toDateString() === today.toDateString();
      const tdCls = isToday ? 'class="today-col"' : '';
      html += `<td ${tdCls}>${shiftLabel(sh)}</td>`;
    });

    if(isAdmin) {
      const requiredFree=getEmployeeRequiredFreeDays(uid);
      const freeMiss=requiredFree!==null && stats.freeDays<requiredFree;
      const freeStyle=requiredFree===null?'color:var(--muted);':freeMiss?'color:#b42318;background:#FCEBEB;border-radius:5px;padding:2px 4px;font-weight:700;':'color:#085041;background:#E1F5EE;border-radius:5px;padding:2px 4px;font-weight:700;';
      const freeTxt=requiredFree===null?`Frei: ${stats.freeDays}`:`Frei: ${stats.freeDays} / Soll ${requiredFree}`;
      html += `<td style="background:#f8fafc;text-align:center;font-size:9px;min-width:86px;">
        <strong style="display:block;color:var(--navy);font-size:11px;margin-bottom:3px;">${formatHours(stats.hours)}</strong>
        <span style="display:inline-block;${freeStyle}" title="${freeMiss?'⚠ Vorgegebene freie Tage nicht erfüllt':'Freie Tage dieser Woche'}">${freeMiss?'⚠ ':''}${freeTxt}</span>
        <span style="color:var(--early-t);display:block;margin-top:3px;">F:${stats.f}</span><span style="color:var(--late-t);display:block;">S:${stats.s}</span>
      </td>`;
    }
    html += '</tr>';
  });

  // Tages-Gesamtstunden immer anzeigen; Admin sieht zusätzlich Früh-/Spät-Besetzung.
  html += '<tr class="foot-row"><td class="name-cell" style="background:#f8fafc;">Tag gesamt</td>';
  visibleDays.forEach(({i}) => {
    const st=getDayPlanStats(i);
    html += `<td style="background:#f8fafc;text-align:center;padding:4px;">
      ${isAdmin?`<span class="f-early">F:${st.f}</span><span class="f-late">S:${st.s}</span>`:''}
      <span class="f-total" style="display:block;margin-top:2px;">${formatHours(st.hours)}</span>
    </td>`;
  });
  let tf=0,ts=0;
  for(let i=0;i<7;i++){const st=getDayPlanStats(i);tf+=st.f;ts+=st.s;}
  if(isAdmin) html += `<td style="background:#1e3a5f;padding:6px;text-align:center;color:#e8f4fd;font-size:9px;">
    F${tf}<br>S${ts}<br><strong>${formatHours(getWeekTotalHours())}</strong>
  </td>`;
  html += '</tr>';

  html += '</tbody>';
  planTable.innerHTML = html;
  if(typeof renderActivityLegends==='function') renderActivityLegends();
}