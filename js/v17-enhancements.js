/* NASCH SANDBOX V17
   Mitarbeiter sicher deaktivieren / reaktivieren.
   Historische Daten bleiben erhalten.
*/
(() => {
  const KEY='nasch-sandbox-employees-v17';
  let state={inactive:{}};
  try{const raw=localStorage.getItem(KEY);if(raw)state={...state,...JSON.parse(raw)};}catch(_){state={inactive:{}}}
  if(!state.inactive||typeof state.inactive!=='object')state.inactive={};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}};
  const isInactive=uid=>!!state.inactive[String(uid)];
  const allOrdered=(typeof getOrderedUserEntries==='function')?getOrderedUserEntries.bind(window):()=>Object.entries(USERS);
  const hasHistoricalShift=uid=>Array.isArray(PLAN?.[uid])&&PLAN[uid].some(s=>s&&s.t&&s.t!=='-');
  const operationalEntries=()=>allOrdered().filter(([uid])=>!isInactive(uid)||(Number(AppState?.weekOffset||0)<0&&hasHistoricalShift(uid)));

  window.getOrderedUserEntries=operationalEntries;
  try{getOrderedUserEntries=window.getOrderedUserEntries;}catch(_){}

  function refresh(){
    if(typeof updateLoginEmployeeOptions==='function')updateLoginEmployeeOptions();
    if(typeof buildMAList==='function')buildMAList();
    if(typeof buildAdminPlan==='function'&&typeof isAdminOrDeputy==='function'&&isAdminOrDeputy())buildAdminPlan();
    if(typeof renderPlan==='function')renderPlan();
    if(typeof buildStzList==='function')buildStzList();
    if(typeof renderAdminDailyHours==='function')renderAdminDailyHours();
    if(typeof NaschTempDeputy!=='undefined')NaschTempDeputy.render();
    if(typeof NaschFixedDeputy!=='undefined')NaschFixedDeputy.render();
  }

  const oldLogin=window.updateLoginEmployeeOptions;
  if(typeof oldLogin==='function'){
    window.updateLoginEmployeeOptions=function(preselect){
      const sel=document.getElementById('loginEmployee');if(!sel)return;
      const current=preselect||sel.value;
      sel.innerHTML='<option value="">Name auswählen …</option>';
      allOrdered().filter(([uid])=>!isInactive(uid)).forEach(([uid,u])=>{const o=document.createElement('option');o.value=uid;o.textContent=`${u.name} (${uid})`;sel.appendChild(o);});
      if(current&&USERS[current]&&!isInactive(current))sel.value=current;
    };
    try{updateLoginEmployeeOptions=window.updateLoginEmployeeOptions;}catch(_){}
  }

  // Historische Stundenzettel sollen deaktivierte Mitarbeiter weiterhin enthalten.
  function runWithAllEntries(fn,args){
    const activeFn=window.getOrderedUserEntries;
    window.getOrderedUserEntries=allOrdered;try{getOrderedUserEntries=allOrdered;}catch(_){}
    try{return fn.apply(window,args||[]);}finally{window.getOrderedUserEntries=activeFn;try{getOrderedUserEntries=activeFn;}catch(_){}}
  }
  const oldHours=window.renderAdminDailyHours;
  if(typeof oldHours==='function'){
    window.renderAdminDailyHours=function(){return runWithAllEntries(oldHours,arguments)};
    try{renderAdminDailyHours=window.renderAdminDailyHours;}catch(_){}
  }
  const oldStz=window.buildStzList;
  if(typeof oldStz==='function'){
    window.buildStzList=function(){return runWithAllEntries(oldStz,arguments)};
    try{buildStzList=window.buildStzList;}catch(_){}
  }

  function statusText(uid){const x=state.inactive[String(uid)];return x?`Deaktiviert seit ${new Date(x.since).toLocaleDateString('de-DE')}${x.reason?` · ${x.reason}`:''}`:'Aktiv';}
  function deactivate(uid){
    uid=String(uid||'');const u=USERS[uid];
    if(!u)return {ok:false,msg:'Mitarbeiter nicht gefunden.'};
    if(u.role==='admin')return {ok:false,msg:'Der Admin kann nicht deaktiviert werden.'};
    const reason=prompt(`Grund für die Deaktivierung von ${u.name} (optional):`,'');if(reason===null)return {ok:false,cancelled:true};
    if(u.role==='vertretung'&&typeof NaschFixedDeputy!=='undefined')NaschFixedDeputy.clear({silent:true});
    if(typeof NaschTempDeputy!=='undefined'&&NaschTempDeputy.info().uid===uid)NaschTempDeputy.clear();
    state.inactive[uid]={since:new Date().toISOString(),reason:String(reason||'').trim()};save();refresh();return {ok:true};
  }
  function reactivate(uid){uid=String(uid||'');if(!USERS[uid])return {ok:false,msg:'Mitarbeiter nicht gefunden.'};delete state.inactive[uid];save();refresh();return {ok:true};}

  window.adminDeactivateEmployee=function(uid){
    if(AppState.currentUser?.role!=='admin')return;
    if(!confirm(`${USERS[uid]?.name||'Mitarbeiter'} deaktivieren?\n\nDie Person verschwindet aus Login und zukünftiger Planung. Alte Stundenzettel und historische Daten bleiben erhalten.`))return;
    const r=deactivate(uid);if(!r.ok&&!r.cancelled)alert(r.msg);else if(r.ok){NaschAdminSettings?.buildAdminSettings?.();showToast?.(`✓ ${USERS[uid].name} deaktiviert`);}
  };
  window.adminReactivateEmployee=function(uid){
    if(AppState.currentUser?.role!=='admin')return;
    const r=reactivate(uid);if(!r.ok)alert(r.msg);else{NaschAdminSettings?.buildAdminSettings?.();showToast?.(`✓ ${USERS[uid].name} reaktiviert`);}
  };

  function decorateEmployeeCards(){
    if(AppState.currentUser?.role!=='admin')return;
    const root=document.getElementById('adminEmployeeSettings');if(!root)return;
    root.querySelectorAll('.card').forEach(card=>{
      const pin=card.querySelector('button[onclick^="adminResetPin("]');if(!pin)return;
      const m=(pin.getAttribute('onclick')||'').match(/adminResetPin\('([^']+)'\)/);if(!m)return;const uid=m[1],u=USERS[uid];if(!u)return;
      card.querySelector('.v17-status')?.remove();card.querySelector('.v17-toggle')?.remove();
      const badge=document.createElement('div');badge.className='v17-status';badge.style.cssText=`font-size:10px;font-weight:700;margin:-2px 0 8px;padding:5px 8px;border-radius:7px;${isInactive(uid)?'background:#f1f5f9;color:#64748b;':'background:#ecfdf3;color:#067647;'}`;badge.textContent=statusText(uid);card.insertBefore(badge,card.children[1]||null);
      const btn=document.createElement('button');btn.className='v17-toggle';btn.type='button';btn.disabled=u.role==='admin';btn.textContent=u.role==='admin'?'Admin':(isInactive(uid)?'↩ Reaktivieren':'⏸ Deaktivieren');btn.onclick=()=>isInactive(uid)?adminReactivateEmployee(uid):adminDeactivateEmployee(uid);btn.style.cssText=`height:30px;padding:0 8px;border:1px solid ${isInactive(uid)?'#86efac':'#fecaca'};border-radius:7px;background:#fff;color:${isInactive(uid)?'#166534':'#b42318'};cursor:pointer;font-size:10px;font-weight:700;white-space:nowrap;`;
      pin.parentElement?.appendChild(btn);if(isInactive(uid))card.style.opacity='.68';
    });
    const matrix=document.getElementById('adminAvailabilityMatrix');
    if(matrix)matrix.querySelectorAll('tbody tr').forEach(tr=>{const name=tr.querySelector('td')?.textContent?.trim();const hit=Object.entries(USERS).find(([,u])=>u.name===name);if(hit&&isInactive(hit[0])){tr.style.opacity='.45';tr.querySelectorAll('button').forEach(b=>b.disabled=true);tr.title='Mitarbeiter ist deaktiviert';}});
  }

  if(typeof NaschAdminSettings!=='undefined'&&NaschAdminSettings.buildAdminSettings){
    const prev=NaschAdminSettings.buildAdminSettings.bind(NaschAdminSettings);
    NaschAdminSettings.buildAdminSettings=function(){prev();decorateEmployeeCards();};
  }

  window.NaschEmployees={isInactive,deactivate,reactivate,all:allOrdered,state:()=>JSON.parse(JSON.stringify(state))};
  setTimeout(()=>{try{updateLoginEmployeeOptions?.();if(AppState.currentUser?.role==='admin')NaschAdminSettings?.buildAdminSettings?.();}catch(e){console.warn('V17 init',e)}},0);
})();
