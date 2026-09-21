// ── Wochenplan-Rendering ─────────────────────────────────────
const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const BASE_MONDAY = new Date(2026, 9, 5); // 05.10.2026

function getMonday(offset) {
  const d = new Date(BASE_MONDAY);
  d.setDate(d.getDate() + offset * 7);
  return d;
}

function formatDate(d) {
  return d.getDate().toString().padStart(2,'0') + '.' +
         (d.getMonth()+1).toString().padStart(2,'0') + '.';
}

function getKW(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function shiftClass(t) {
  const map = {
    'F':'s-early','S':'s-late','U':'s-vacation','KV':'s-kv',
    'BS':'s-bs','O':'s-office','T':'s-meeting','HO':'s-ho',
    'R':'s-clean','WF':'s-vacation','K':'s-vacation','-':'s-off',
  };
  return map[t] || 's-off';
}

function shiftLabel(s) {
  if(!s || s.t === '-' || !s.t) return '<span class="shift-pill s-off">–</span>';
  const lbl = s.z || s.t;
  const role = s.r ? `<br><small style="font-size:8px;opacity:0.8;">${s.r}</small>` : '';
  return `<span class="shift-pill ${shiftClass(s.t)}">${lbl}${role}</span>`;
}

function renderPlan() {
  const monday = getMonday(AppState.weekOffset);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const kw = getKW(monday);
  const today = new Date();
  today.setHours(0,0,0,0);

  document.getElementById('weekLabel').textContent =
    `KW ${kw} · ${formatDate(monday)}–${formatDate(sunday)}${monday.getFullYear()}`;

  // Wochentage
  const dates = [];
  for(let i=0;i<7;i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    dates.push(d);
  }

  // Sichtbare Tage (vergangene ausblenden für Mitarbeiter, Admin sieht alle)
  const isAdmin = AppState.currentUser && ['admin','vertretung'].includes(AppState.currentUser.role);
  const visibleDays = dates.map((d,i) => ({ d, i, past: d < today && !isAdmin }));

  let html = '<thead><tr>';
  html += '<th class="name-col">Name</th>';
  visibleDays.forEach(({d,i,past}) => {
    const isToday = d.toDateString() === today.toDateString();
    const cls = isToday ? 'today-th' : past ? 'style="opacity:0.35;"' : '';
    html += `<th class="${cls}">${DAYS[i]}<br><small>${formatDate(d)}</small></th>`;
  });

  // Summen-Spalte für Admin
  if(isAdmin) html += '<th style="background:#1e3a5f;color:#e8f4fd;">F/S</th>';
  html += '</tr></thead><tbody>';

  // Mitarbeiterzeilen
  const myId = AppState.currentUserId;
  Object.entries(USERS).forEach(([uid, user]) => {
    const isMe = uid === myId;
    const trClass = isMe ? 'class="me-row"' : '';
    html += `<tr ${trClass}>`;
    html += `<td class="name-cell">${isMe ? '★ ' : ''}${user.name}</td>`;

    const shifts = PLAN[uid] || [];
    let fCount = 0, sCount = 0;

    visibleDays.forEach(({d,i,past}) => {
      const s = shifts[i];
      const isToday = d.toDateString() === today.toDateString();
      const tdCls = isToday ? 'class="today-col"' : '';
      if(past) { html += `<td style="opacity:0.3;">${shiftLabel(s)}</td>`; }
      else {
        html += `<td ${tdCls}>${shiftLabel(s)}</td>`;
        if(s && s.t==='F') fCount++;
        if(s && s.t==='S') sCount++;
      }
    });

    if(isAdmin) {
      html += `<td style="background:#f8fafc;text-align:center;">
        <small style="color:var(--early-t);display:block;">F:${fCount}</small>
        <small style="color:var(--late-t);display:block;">S:${sCount}</small>
      </td>`;
    }
    html += '</tr>';
  });

  // Tagessummen-Zeile für Admin
  if(isAdmin) {
    html += '<tr class="foot-row"><td class="name-cell" style="background:#f8fafc;">Zähler</td>';
    visibleDays.forEach(({i,past}) => {
      if(past) { html += '<td></td>'; return; }
      let f=0,s=0;
      Object.values(PLAN).forEach(shifts => {
        const sh = shifts[i];
        if(sh && sh.t==='F') f++;
        if(sh && sh.t==='S') s++;
      });
      html += `<td>
        <span class="f-early">F:${f}</span>
        <span class="f-late">S:${s}</span>
        <span class="f-total">∑${f+s}</span>
      </td>`;
    });
    // Gesamtsumme
    let tf=0,ts=0;
    Object.values(PLAN).forEach(shifts => {
      shifts.forEach((sh,i) => {
        if(!visibleDays[i].past) {
          if(sh && sh.t==='F') tf++;
          if(sh && sh.t==='S') ts++;
        }
      });
    });
    html += `<td style="background:#1e3a5f;padding:6px;text-align:center;">
      <span class="foot-sum">F${tf}<br>S${ts}<br>∑${tf+ts}</span>
    </td>`;
    html += '</tr>';
  }

  html += '</tbody>';
  document.getElementById('planTable').innerHTML = html;
}
