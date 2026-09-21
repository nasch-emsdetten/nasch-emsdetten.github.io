// ── Admin-Planungsseite ──────────────────────────────────────
function renderAdminPlan() {
  const el = document.getElementById('pageAdminPlan');
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer;color:var(--muted);" onclick="switchNav('admin')">
      ‹ <span style="font-size:13px;">Zurück</span>
    </div>

    ${renderSyncPanel()}

    <div class="week-nav">
      <span class="week-btn" onclick="AdminPlan.prevWeek()">‹</span>
      <span class="week-label" id="adminWeekLabel">KW 41 · 05.10.–11.10.2026</span>
      <span class="week-btn" onclick="AdminPlan.nextWeek()">›</span>
    </div>

    <div class="legend">
      <div class="leg"><div class="leg-box" style="background:#FFF2CC;"></div>Früh</div>
      <div class="leg"><div class="leg-box" style="background:#FAE5D3;"></div>Spät</div>
      <div class="leg"><div class="leg-box" style="background:#FBEAF0;"></div>Urlaub</div>
      <div class="leg"><div class="leg-box" style="background:#faeeda;"></div>Wunschfrei</div>
      <div class="leg"><div class="leg-box" style="background:#FCEBEB;"></div>Konflikt</div>
    </div>

    <div class="plan-wrap">
      <table class="plan-table" id="adminPlanTable"></table>
    </div>
  `;

  AdminPlan.render();
  SheetsSync._setSyncStatus('ok', '✓ Aus Google Sheets geladen');
}

const AdminPlan = {
  weekOffset: 0,

  prevWeek() { this.weekOffset--; this.render(); },
  nextWeek()  { this.weekOffset++; this.render(); },

  render() {
    const monday = getMonday(this.weekOffset);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    const kw = getKW(monday);
    const today = new Date(); today.setHours(0,0,0,0);

    document.getElementById('adminWeekLabel').textContent =
      `KW ${kw} · ${formatDate(monday)}–${formatDate(sunday)}${monday.getFullYear()}`;

    const dates = [];
    for(let i=0;i<7;i++) {
      const d = new Date(monday); d.setDate(monday.getDate()+i); dates.push(d);
    }

    // Konflikte berechnen (Wunschfrei-Kollisionen)
    const konflikte = this._berechneKonflikte(dates);

    let html = '<thead><tr>';
    html += '<th class="name-col" style="min-width:90px;">Mitarbeiter</th>';
    dates.forEach((d,i) => {
      const isToday = d.toDateString() === today.toDateString();
      html += `<th class="${isToday?'today-th':''}">
        ${DAYS[i]}<br><small>${formatDate(d)}</small>
      </th>`;
    });
    html += '<th style="background:#1e3a5f;color:#e8f4fd;min-width:60px;">F/S<br><small>Σ</small></th></tr></thead><tbody>';

    // Mitarbeiter-Zeilen
    let gesamtF=0, gesamtS=0;
    Object.entries(USERS).forEach(([uid, user]) => {
      const shifts = PLAN[uid] || Array(7).fill({t:'-',z:'',r:''});
      let wocheF=0, wocheS=0;
      html += `<tr>`;
      html += `<td class="name-cell" style="font-size:11px;">
        ${user.name}<br>
        <small style="color:var(--muted);font-weight:400;">${user.typ}</small>
      </td>`;

      dates.forEach((d,i) => {
        const isToday = d.toDateString() === today.toDateString();
        const s = shifts[i] || {t:'-'};
        const konflikt = konflikte[i]?.includes(uid);
        const tdStyle = `${isToday?'background:rgba(30,58,95,0.04);':''}${konflikt?'outline:1.5px solid #E24B4A;outline-offset:-1px;':''}`;
        html += `<td style="${tdStyle}">${shiftLabel(s)}</td>`;
        if(s.t==='F') { wocheF++; gesamtF++; }
        if(s.t==='S') { wocheS++; gesamtS++; }
      });

      html += `<td style="background:#f8fafc;text-align:center;font-size:10px;">
        <span style="color:var(--early-t);display:block;font-weight:600;">F:${wocheF}</span>
        <span style="color:var(--late-t);display:block;font-weight:600;">S:${wocheS}</span>
      </td></tr>`;
    });

    // Tagessummen
    html += '<tr style="background:#f8fafc;border-top:2px solid var(--border);">';
    html += '<td class="name-cell" style="background:#f8fafc;font-size:10px;font-weight:600;">Tagessumme</td>';
    let tageF=[], tageS=[];
    dates.forEach((_,i) => {
      let f=0,s=0;
      Object.values(PLAN).forEach(shifts => {
        const sh = (shifts||[])[i];
        if(sh?.t==='F') f++;
        if(sh?.t==='S') s++;
      });
      tageF.push(f); tageS.push(s);
      html += `<td style="background:#f8fafc;text-align:center;padding:4px;">
        <span style="color:var(--early-t);display:block;font-size:10px;font-weight:600;">F:${f}</span>
        <span style="color:var(--late-t);display:block;font-size:10px;font-weight:600;">S:${s}</span>
        <span style="color:var(--text);display:block;font-size:9px;">∑${f+s}</span>
      </td>`;
    });
    // Gesamtsumme
    html += `<td style="background:#1e3a5f;color:#e8f4fd;text-align:center;padding:6px;">
      <span style="display:block;font-size:9px;color:#fef9ec;">F:${gesamtF}</span>
      <span style="display:block;font-size:9px;color:#fde8d0;">S:${gesamtS}</span>
      <span style="display:block;font-size:10px;font-weight:700;border-top:1px solid rgba(255,255,255,0.3);margin-top:2px;padding-top:2px;">∑${gesamtF+gesamtS}</span>
    </td></tr></tbody>`;

    document.getElementById('adminPlanTable').innerHTML = html;
  },

  // ── Wunschfrei-Konflikte erkennen ───────────────────────────
  _berechneKonflikte(dates) {
    const konflikte = {};
    // Demo: Robin und Zaira wollen Mo frei
    konflikte[0] = ['robin-berkenheide', 'zaira-jara'];
    return konflikte;
  },
};

// initPage für Admin-Plan erweitern
const _origInitPage = window.initPage;
window.initPage = function(pageId) {
  if(pageId === 'pageAdminPlan') renderAdminPlan();
  else if(typeof _origInitPage === 'function') _origInitPage(pageId);
};
