
/* NASCH SANDBOX V14
   - feste Vertretung eindeutig vergeben/aufheben
   - Wochenplan als druckoptimierte PDF-Ansicht (Systemdialog "Als PDF speichern")
*/
(() => {
  const V14_VERSION='V14';

  function employeeBaseLabel(u){
    if(!u) return 'Mitarbeiter';
    return u.typ==='VZ' ? 'Vollzeit' : u.typ==='TZ' ? 'Teilzeit' : u.typ==='AH' ? 'Aushilfe' : (u.label||'Mitarbeiter').replace(/\s*·\s*Vertretung\s*$/i,'');
  }

  function fixedDeputyUid(){
    const hit=(typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS)).find(([uid,u])=>u && u.role==='vertretung');
    return hit ? hit[0] : '';
  }

  function persistEmployeeRole(uid){
    if(typeof SandboxStore!=='undefined' && SandboxStore.saveEmployee) SandboxStore.saveEmployee(uid);
  }

  function refreshRoleViews(){
    if(typeof updateLoginEmployeeOptions==='function') updateLoginEmployeeOptions(AppState.currentUserId||'');
    if(typeof buildMAList==='function') buildMAList();
    if(typeof buildStzList==='function') buildStzList();
    if(typeof renderPlan==='function') renderPlan();
    if(typeof buildAdminPlan==='function' && isAdminOrDeputy()) buildAdminPlan();
    if(typeof NaschAdminSettings!=='undefined' && NaschAdminSettings.buildAdminSettings && isAdminOnly()) NaschAdminSettings.buildAdminSettings();
  }

  function setFixedDeputy(uid, opts={}){
    if(!isAdminOnly()) return {ok:false,msg:'Nur der Admin kann die feste Vertretung ändern.'};
    uid=String(uid||'');
    if(!uid || !USERS[uid]) return {ok:false,msg:'Bitte einen Mitarbeiter auswählen.'};
    if(USERS[uid].role==='admin') return {ok:false,msg:'Der Admin kann nicht als Vertretung gewählt werden.'};

    // Es gibt höchstens eine feste Vertretung. Alle bisherigen werden zurückgestuft.
    Object.entries(USERS).forEach(([id,u])=>{
      if(id!==uid && u?.role==='vertretung'){
        u.role='user';
        u.label=employeeBaseLabel(u);
        persistEmployeeRole(id);
      }
    });
    USERS[uid].role='vertretung';
    USERS[uid].label=`${employeeBaseLabel(USERS[uid])} · Vertretung`;
    persistEmployeeRole(uid);
    if(!opts.silent && typeof showToast==='function') showToast(`✓ ${USERS[uid].name} ist feste Vertretung`);
    return {ok:true};
  }

  function clearFixedDeputy(opts={}){
    if(!isAdminOnly()) return {ok:false,msg:'Nur der Admin kann die feste Vertretung ändern.'};
    const current=fixedDeputyUid();
    if(!current) return {ok:true};
    USERS[current].role='user';
    USERS[current].label=employeeBaseLabel(USERS[current]);
    persistEmployeeRole(current);
    if(!opts.silent && typeof showToast==='function') showToast('✓ Feste Vertretung aufgehoben');
    return {ok:true};
  }

  function renderFixedDeputyEditor(){
    const settings=document.getElementById('pgAdminSettings');
    if(!settings || !isAdminOnly()) return;
    let box=document.getElementById('adminFixedDeputy');
    if(!box){
      const tempSec=[...settings.querySelectorAll('.sec')].find(x=>x.textContent.trim()==='Temporäre Vertretung');
      const sec=document.createElement('div'); sec.className='sec'; sec.id='fixedDeputySec'; sec.textContent='Feste Vertretung';
      box=document.createElement('div'); box.id='adminFixedDeputy'; box.style.marginBottom='14px';
      if(tempSec){ settings.insertBefore(sec,tempSec); settings.insertBefore(box,tempSec); }
      else { settings.appendChild(sec); settings.appendChild(box); }
    }
    const current=fixedDeputyUid();
    const opts=(typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS))
      .filter(([uid,u])=>u && u.role!=='admin')
      .map(([uid,u])=>`<option value="${escapeHtml(uid)}" ${current===uid?'selected':''}>${escapeHtml(u.name)}</option>`).join('');
    const status=current ? `Aktuell: <strong>${escapeHtml(USERS[current]?.name||current)}</strong>` : 'Aktuell ist keine feste Vertretung vergeben.';
    box.innerHTML=`<div class="card" style="padding:11px 12px;overflow:visible;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:9px;">${status}</div>
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;"><label style="margin-top:0;">Mitarbeiter</label><select id="fixedDeputyUid"><option value="">Auswählen …</option>${opts}</select></div>
        <button class="btn btn-primary" onclick="adminSetFixedDeputy()" style="width:auto;min-width:150px;margin-top:0;">Fest vergeben</button>
        <button class="btn btn-outline" onclick="adminClearFixedDeputy()" style="width:auto;min-width:130px;margin-top:0;" ${current?'':'disabled'}>Aufheben</button>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:7px;">Es kann immer nur eine feste Vertretung geben. Die temporäre Vertretung bleibt davon unabhängig.</div>
    </div>`;
  }

  window.adminSetFixedDeputy=function(){
    const uid=document.getElementById('fixedDeputyUid')?.value||'';
    const r=setFixedDeputy(uid);
    if(!r.ok){ alert(r.msg); return; }
    refreshRoleViews();
    renderFixedDeputyEditor();
  };
  window.adminClearFixedDeputy=function(){
    const uid=fixedDeputyUid();
    if(!uid) return;
    if(!confirm(`Feste Vertretung von ${USERS[uid].name} aufheben?`)) return;
    const r=clearFixedDeputy();
    if(!r.ok){ alert(r.msg); return; }
    refreshRoleViews();
    renderFixedDeputyEditor();
  };

  // Auch beim Anlegen einer neuen festen Vertretung die Eindeutigkeitsregel erzwingen.
  const oldCreateEmployee=window.adminCreateEmployee;
  if(typeof oldCreateEmployee==='function'){
    window.adminCreateEmployee=function(){
      const before=new Set(Object.keys(USERS));
      const wantsDeputy=document.getElementById('newEmpRole')?.value==='vertretung';
      oldCreateEmployee();
      if(wantsDeputy){
        const created=Object.keys(USERS).find(id=>!before.has(id));
        if(created && USERS[created]?.role==='vertretung') setFixedDeputy(created,{silent:true});
      }
      renderFixedDeputyEditor();
    };
    adminCreateEmployee=window.adminCreateEmployee;
  }

  // Bestehenden Admin-Settings-Renderer erweitern, ohne die V13-Terminlogik zu überschreiben.
  if(typeof NaschAdminSettings!=='undefined' && NaschAdminSettings.buildAdminSettings){
    const previousBuildSettings=NaschAdminSettings.buildAdminSettings.bind(NaschAdminSettings);
    NaschAdminSettings.buildAdminSettings=function(){
      previousBuildSettings();
      renderFixedDeputyEditor();
    };
  }

  function plainActivity(value){
    if(typeof activityText==='function') return activityText(value);
    return (Array.isArray(value)?value:[value]).filter(Boolean).join(' + ');
  }
  function shiftPdfText(s){
    if(!s || !s.t || s.t==='-') { if(s?.availabilityCode==='n') return 'Frei · fest'; if(s?.availabilityCode==='f') return 'Verfügbar · Früh'; if(s?.availabilityCode==='s') return 'Verfügbar · Spät'; return 'Frei'; }
    if(s.t==='TS'){
      const times=typeof getSplitShiftTimes==='function'?getSplitShiftTimes(s):[s.z1||'',s.z2||''];
      const a1=typeof shiftActivities==='function'?plainActivity(shiftActivities(s,1)):plainActivity(s.r1||s.r);
      const a2=typeof shiftActivities==='function'?plainActivity(shiftActivities(s,2)):plainActivity(s.r2||s.r);
      return [`Teilschicht 1: ${escapeHtml(times[0]||'-')}${a1?' · '+escapeHtml(a1):''}`,`Teilschicht 2: ${escapeHtml(times[1]||'-')}${a2?' · '+escapeHtml(a2):''}`].join('<br>');
    }
    const type=typeof shiftTypeText==='function'?shiftTypeText(s):(s.t||'');
    const activity=plainActivity(s.r);
    const time=s.z||'';
    if(['U','WF','K','BS'].includes(s.t)) return `${type}${time?' · '+escapeHtml(time):''}`;
    return `${escapeHtml(type)}${time?' · '+escapeHtml(time):''}${activity?' · '+escapeHtml(activity):''}`;
  }
  function dateMetaForPdf(d){
    const bits=[];
    try{ const h=getNRWPublicHolidayName(d); if(h) bits.push(h); }catch(_){}
    try{ const v=schoolHolidayName(d); if(v) bits.push(v); }catch(_){}
    try{ if(typeof ImportantEvents!=='undefined') ImportantEvents.forDate(d).forEach(e=>bits.push(ImportantEvents.display(e))); }catch(_){}
    return bits;
  }
  function weekPdfHtml(){
    const mon=getMonday(AppState.weekOffset), dates=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
    const sun=dates[6], kw=typeof getKW==='function'?getKW(mon):'';
    const entries=typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS);
    const head=dates.map((d,i)=>{
      const meta=dateMetaForPdf(d);
      return `<th>${DAYS[i]}<br><small>${formatFullDate(d)}</small>${meta.length?`<div class="meta">${meta.map(escapeHtml).join('<br>')}</div>`:''}</th>`;
    }).join('');
    const body=entries.map(([uid,u])=>{
      const cells=dates.map((d,i)=>{
        const s=(PLAN[uid]||[])[i]||{t:'-'};
        return `<td class="shift ${escapeHtml(s.t||'-')}">${shiftPdfText(s)}</td>`;
      }).join('');
      const ws=typeof getEmployeeWeekStats==='function'?getEmployeeWeekStats(uid):{hours:0,freeDays:0};
      return `<tr><td class="name"><strong>${escapeHtml(u.name)}</strong><br><small>${escapeHtml(u.label||u.typ||'')}</small></td>${cells}<td class="week"><strong>${typeof formatHours==='function'?formatHours(ws.hours):ws.hours+' h'}</strong><br><small>Frei: ${ws.freeDays}</small></td></tr>`;
    }).join('');
    const totals=dates.map((d,i)=>{const st=typeof getDayPlanStats==='function'?getDayPlanStats(i):{f:0,s:0,hours:0};return `<td class="total">F:${st.f} · S:${st.s}<br><strong>${typeof formatHours==='function'?formatHours(st.hours):st.hours+' h'}</strong></td>`;}).join('');
    const legend=(typeof getActivityOptions==='function'?getActivityOptions():[]).map(c=>{
      const l=typeof getActivityLabel==='function'?getActivityLabel(c):'';
      return `${escapeHtml(c)}${l?' = '+escapeHtml(l):''}`;
    }).join(' · ');
    const title=`Wochenplan KW ${kw} - ${String(mon.getFullYear())}`;
    return {title, html:`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(title)}_Nasch</title><style>
      @page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172033;margin:0;font-size:8.5px}h1{font-size:16px;margin:0 0 2px}.sub{font-size:9px;color:#566274;margin-bottom:8px}.hint{font-size:8px;color:#657386;margin:6px 0}.plan{width:100%;border-collapse:collapse;table-layout:fixed}.plan th,.plan td{border:1px solid #aeb9c7;padding:4px;vertical-align:top;word-break:break-word}.plan th{background:#1e3a5f;color:#fff;text-align:center;font-size:8px}.plan th:first-child{width:19mm}.plan .name{background:#f3f6f9;width:30mm}.plan .week{background:#f3f6f9;text-align:center;width:24mm}.plan .total{background:#f3f6f9;text-align:center}.plan .name small{font-weight:400;color:#657386}.shift{line-height:1.3}.shift.F{background:#fff4bf}.shift.S{background:#ffe3ca}.shift.TS{background:#e6f1fb}.shift.U{background:#f8dce8}.shift.WF{background:#fff1a8}.shift.K{background:#f4d6d6}.shift.R{background:#e8f4ea}.meta{margin-top:3px;font-size:6.5px;line-height:1.15;color:#ffe7a3}.legend{margin-top:6px;font-size:7.5px;color:#455468}.footer{margin-top:6px;display:flex;justify-content:space-between;color:#657386;font-size:7px}@media print{button{display:none}}
      </style></head><body><h1>${escapeHtml(title)}</h1><div class="sub">${formatFullDate(mon)} bis ${formatFullDate(sun)} · NASCH Emsdetten</div><table class="plan"><thead><tr><th>Mitarbeiter</th>${head}<th>Woche</th></tr></thead><tbody>${body}<tr><td class="name"><strong>Tag gesamt</strong></td>${totals}<td class="total"><strong>${typeof getWeekTotalHours==='function'?formatHours(getWeekTotalHours()):''}</strong></td></tr></tbody></table>${legend?`<div class="legend"><strong>Tätigkeiten:</strong> ${legend}</div>`:''}<div class="footer"><span>Erstellt aus der NASCH Sandbox ${V14_VERSION}</span><span>${new Date().toLocaleString('de-DE')}</span></div><script>setTimeout(()=>window.print(),250);<\/script></body></html>`};
  }

  window.exportWeekPlanPDF=function(){
    if(typeof editMode!=='undefined' && editMode){ alert('Bitte die laufende Planbearbeitung zuerst speichern oder abbrechen.'); return; }
    try{ if(typeof WeekPlanStore!=='undefined') WeekPlanStore.persistCurrent(); }catch(_){}
    const data=weekPdfHtml();
    const w=window.open('','_blank');
    if(!w){ alert('PDF-Ansicht konnte nicht geöffnet werden. Bitte Pop-ups für diese Seite erlauben.'); return; }
    w.document.open(); w.document.write(data.html); w.document.close();
  };

  function injectPdfButtons(){
    const adminTop=document.querySelector('#pgAdminPlan > div[style*="display:flex"]');
    if(adminTop && !document.getElementById('adminWeekPdfBtn')){
      const b=document.createElement('button'); b.id='adminWeekPdfBtn'; b.className='btn btn-outline'; b.style.cssText='width:auto;min-width:108px;margin-top:0;white-space:nowrap;padding:8px 10px;'; b.textContent='📄 PDF'; b.onclick=window.exportWeekPlanPDF; adminTop.appendChild(b);
    }
    const plan=document.getElementById('pgPlan');
    if(plan && !document.getElementById('weekPdfBtn')){
      const bar=document.createElement('div');bar.id='weekPdfBar';bar.style.cssText='display:none;justify-content:flex-end;margin:-2px 0 8px;';
      bar.innerHTML='<button id="weekPdfBtn" class="btn btn-outline" style="width:auto;min-width:125px;margin-top:0;padding:7px 10px;">📄 Wochenplan PDF</button>';
      const nav=plan.querySelector('.week-nav'); if(nav) nav.insertAdjacentElement('afterend',bar); else plan.prepend(bar);
      document.getElementById('weekPdfBtn').onclick=window.exportWeekPlanPDF;
    }
    const bar=document.getElementById('weekPdfBar'); if(bar) bar.style.display=isAdminOrDeputy()?'flex':'none';
  }

  // Login/Rollenwechsel können die Sichtbarkeit ändern.
  const oldRenderPlanV14=window.renderPlan;
  if(typeof oldRenderPlanV14==='function'){
    window.renderPlan=function(){ const r=oldRenderPlanV14.apply(this,arguments); injectPdfButtons(); return r; };
    renderPlan=window.renderPlan;
  }

  window.NaschFixedDeputy={get:fixedDeputyUid,set:setFixedDeputy,clear:clearFixedDeputy,render:renderFixedDeputyEditor};
  window.NaschWeekPDF={html:weekPdfHtml,export:exportWeekPlanPDF};

  setTimeout(()=>{
    try{ injectPdfButtons(); if(isAdminOnly()) renderFixedDeputyEditor(); }catch(e){ console.warn('V14 init',e); }
  },0);
})();
