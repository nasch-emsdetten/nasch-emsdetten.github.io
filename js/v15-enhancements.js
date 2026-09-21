/* NASCH SANDBOX V15
   - Wunschfrei/Urlaub: echte Admin-Uebersicht + Bearbeitung + kurzfristige Ergaenzungen
   - Sperrtage fuer Wunschfrei/Urlaub, Schliess-/Halbtage mit Planhinweisen
   - Wunschfrei-Frist frei konfigurierbar + naechste 3 Fristen
   - Wichtige Termine mit Kategorien, Wiederholung und Sichtbarkeitsgruppen
   - Mangelliste fuer Mitarbeiter
   - Reinigung & Besonderheiten fuer RK-Mitarbeiter mit wiederkehrenden Aufgaben
*/
(() => {
  const VERSION='V15';
  const KEY='nasch-planning-v15';
  const BASE_STORE_KEY='nasch-sandbox-v2';
  const CATEGORIES=['Fristen','Betriebsablauf','Planung','Team','Reinigung','Feiertag / Schule','Sonstiges'];
  const AUDIENCES=[
    ['all','Alle'],['leitung','Leitung'],['VZ','Vollzeit'],['TZ','Teilzeit'],['AH','Aushilfe'],['cleaning','Reinigung (RK)']
  ];
  const WEEKDAYS=[['1','Montag'],['2','Dienstag'],['3','Mittwoch'],['4','Donnerstag'],['5','Freitag'],['6','Samstag'],['0','Sonntag']];
  const deep=o=>JSON.parse(JSON.stringify(o));
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fromKey=k=>{const [y,m,d]=String(k||'').split('-').map(Number);return new Date(y,m-1,d,12,0,0,0)};
  const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()+n);return x};
  const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmt=d=>d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
  const uidSafe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'_');

  function defaults(){
    return {
      requestEdits:{}, requestDeleted:{}, manualRequests:[],
      blockouts:[
        {id:'block-school-start',title:'Einschulung',rule:'date',date:'',target:'both',enabled:false},
        {id:'block-last-school-day',title:'Letzter Schultag',rule:'date',date:'',target:'both',enabled:false},
        {id:'block-rosenmontag',title:'Rosenmontag',rule:'rosenmontag',target:'both',enabled:true},
        {id:'block-christmas',title:'Weihnachten',rule:'annualRange',start:'12-24',end:'12-26',target:'both',enabled:true}
      ],
      closures:[],
      shortages:[],
      cleaning:{
        info:'',
        tasks:[
          {id:'clean-climate-filter',title:'Klimaschutzfilter Reinigung',enabled:false,intervalDays:null,nextDue:'',lastDone:'',note:''},
          {id:'clean-flame-filter',title:'Flammschutzfilter Reinigung',enabled:false,intervalDays:null,nextDue:'',lastDone:'',note:''},
          {id:'clean-windows',title:'Fenster Reinigung',enabled:false,intervalDays:null,nextDue:'',lastDone:'',note:''}
        ]
      }
    };
  }

  let state=defaults();
  function load(){
    try{
      const raw=localStorage.getItem(KEY); if(raw){
        const saved=JSON.parse(raw);
        state={...defaults(),...saved};
        state.cleaning={...defaults().cleaning,...(saved.cleaning||{})};
        state.cleaning.tasks=Array.isArray(saved.cleaning?.tasks)?saved.cleaning.tasks:defaults().cleaning.tasks;
        state.blockouts=Array.isArray(saved.blockouts)?saved.blockouts:defaults().blockouts;
        state.closures=Array.isArray(saved.closures)?saved.closures:[];
        state.shortages=Array.isArray(saved.shortages)?saved.shortages:[];
        state.manualRequests=Array.isArray(saved.manualRequests)?saved.manualRequests:[];
        state.requestEdits=saved.requestEdits||{}; state.requestDeleted=saved.requestDeleted||{};
      }
    }catch(e){console.warn('V15 konnte nicht geladen werden',e);state=defaults();}
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('V15 konnte nicht gespeichert werden',e);}}
  load();

  // ── Request-Overlay: bestehende Sandbox-Daten bleiben unveraendert und werden nur ueberlagert. ──
  const baseGetRequests=(typeof SandboxStore!=='undefined'&&SandboxStore.getRequests)?SandboxStore.getRequests.bind(SandboxStore):(()=>[]);
  function effectiveRequests(){
    const base=(baseGetRequests()||[]).map(r=>deep(r));
    const all=[...base,...state.manualRequests.map(r=>deep(r))];
    return all.filter(r=>!state.requestDeleted[r.id]).map(r=>{
      const p=state.requestEdits[r.id]||{};
      return {...r,...p,data:{...(r.data||{}),...(p.data||{})}};
    });
  }
  if(typeof SandboxStore!=='undefined') SandboxStore.getRequests=effectiveRequests;

  function updateRequest(id,patch){
    const m=state.manualRequests.find(r=>r.id===id);
    if(m){Object.assign(m,patch);if(patch.data)m.data={...(m.data||{}),...patch.data};}
    else {const prev=state.requestEdits[id]||{};state.requestEdits[id]={...prev,...patch,data:{...(prev.data||{}),...(patch.data||{})}};}
    save(); refreshPlanning();
  }
  function deleteRequest(id){
    const idx=state.manualRequests.findIndex(r=>r.id===id);
    if(idx>=0)state.manualRequests.splice(idx,1);else state.requestDeleted[id]=true;
    save(); refreshPlanning();
  }
  function addManualRequest({type,uid,von,bis,schicht,hinweis,status='offen'}){
    const r={id:`v15-req-${Date.now()}-${Math.random().toString(16).slice(2)}`,type,uid,data:{von,bis:bis||von,schicht:schicht||'',hinweis:hinweis||''},createdAt:new Date().toISOString(),status};
    state.manualRequests.push(r);save();refreshPlanning();return r;
  }

  // ── Datumshilfen / Rosenmontag ──
  function easterSunday(year){
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(year,month-1,day,12);
  }
  function rosenmontag(year){return addDays(easterSunday(year),-48)}
  function blockoutMatches(b,date,type){
    if(!b.enabled)return false;
    if(b.target!=='both'&&b.target!==type)return false;
    const k=dateKey(date);
    if(b.rule==='date')return !!b.date&&k===b.date;
    if(b.rule==='rosenmontag')return k===dateKey(rosenmontag(date.getFullYear()));
    if(b.rule==='annualRange'){
      const md=k.slice(5); const a=b.start||'12-24',z=b.end||'12-26';
      if(a<=z)return md>=a&&md<=z;
      return md>=a||md<=z;
    }
    return false;
  }
  function blockoutsForDate(date,type='both'){return state.blockouts.filter(b=>blockoutMatches(b,date,type==='both'?'wunschfrei':type)||blockoutMatches(b,date,type==='both'?'urlaub':type));}
  function blockedInRange(von,bis,type){
    if(!von)return [];
    const a=fromKey(von),z=fromKey(bis||von),out=[];
    for(let d=new Date(a);d<=z;d=addDays(d,1)){
      const hits=state.blockouts.filter(b=>blockoutMatches(b,d,type));
      if(hits.length)out.push({date:new Date(d),hits});
    }
    return out;
  }

  // ── Betriebs-Schliessungen ──
  function closureForDate(date){return state.closures.find(c=>c.enabled!==false&&c.date===dateKey(date))||null;}
  function closureLabel(c){if(!c)return'';return c.kind==='full'?'Geschlossen':c.kind==='morning'?'Früh/Vormittag geschlossen':'Spät/Abend geschlossen';}
  function serviceShift(t){return ['F','S','TS','KV'].includes(t);}
  function closureConflict(shift,c){
    if(!c||!shift||!serviceShift(shift.t))return false;
    if(c.kind==='full')return true;
    if(c.kind==='morning')return ['F','TS'].includes(shift.t);
    if(c.kind==='evening')return ['S','TS'].includes(shift.t);
    return false;
  }

  function requestCovers(r,date){
    const d=r.data||{},k=dateKey(date),von=d.von||d.datum,bis=d.bis||von;
    return !!von&&k>=von&&k<=(bis||von);
  }
  function activeRequests(uid,date){return effectiveRequests().filter(r=>r.uid===uid&&['urlaub','wunschfrei'].includes(r.type)&&r.status!=='abgelehnt'&&requestCovers(r,date));}

  function applyCurrentConstraints(){
    if(typeof PLAN==='undefined'||typeof getMonday!=='function')return;
    const mon=getMonday(AppState.weekOffset);
    Object.keys(USERS).forEach(uid=>{
      if(!Array.isArray(PLAN[uid]))PLAN[uid]=Array.from({length:7},()=>({t:'-',z:'',r:[]}));
      for(let i=0;i<7;i++){
        const date=addDays(mon,i), c=closureForDate(date);
        let sh=PLAN[uid][i]||{t:'-',z:'',r:[]};
        delete sh.businessClosure;delete sh.closureConflict;delete sh.closureNote;
        const reqs=activeRequests(uid,date),ur=reqs.find(r=>r.type==='urlaub'),wf=reqs.find(r=>r.type==='wunschfrei');
        if(sh.manual!==true&&['urlaub','wunschfrei'].includes(sh.autoSource)&&!ur&&!wf) sh={t:'-',z:'',r:[],availabilityCode:sh.availabilityCode||'g'};
        if(sh.manual!==true&&ur) sh={t:'U',z:'Urlaub',r:[],autoSource:'urlaub',availabilityCode:sh.availabilityCode||'g'};
        else if(sh.manual!==true&&wf) sh={t:'WF',z:'Wunschfrei',r:[],autoSource:'wunschfrei',availabilityCode:sh.availabilityCode||'g'};
        if(c){
          sh.businessClosure=c.kind;sh.closureNote=c.note||'';
          if(c.kind==='full'&&sh.manual!==true&&serviceShift(sh.t)) sh={t:'-',z:'',r:[],autoSource:'closure',businessClosure:'full',closureNote:c.note||''};
          else if(closureConflict(sh,c)) sh.closureConflict=true;
        }else if(sh.autoSource==='closure'&&sh.manual!==true){sh={t:'-',z:'',r:[]};}
        PLAN[uid][i]=sh;
      }
    });
    try{if(typeof WeekPlanStore!=='undefined')WeekPlanStore.persistCurrent();}catch(_){}
  }

  // ── Wichtige Termine: eigene Occurrence-Engine mit zusaetzlichen Typen + Sichtbarkeit ──
  const baseEventGet=typeof ImportantEvents!=='undefined'?ImportantEvents.get.bind(ImportantEvents):(()=>[]);
  const baseEventUpdate=typeof ImportantEvents!=='undefined'?ImportantEvents.update.bind(ImportantEvents):null;
  const baseEventAdd=typeof ImportantEvents!=='undefined'?ImportantEvents.add.bind(ImportantEvents):null;
  const baseEventRemove=typeof ImportantEvents!=='undefined'?ImportantEvents.remove.bind(ImportantEvents):null;
  function eventCategory(e){
    if(e.category)return e.category;
    if(e.id==='wishfree-deadline')return'Fristen';
    if(e.id==='yellow-bin'||e.id==='drinks-order')return'Betriebsablauf';
    if(e.id==='inventory')return'Planung';
    return'Sonstiges';
  }
  function eventAudience(e){return Array.isArray(e.audience)&&e.audience.length?e.audience:['all'];}
  function isCleaning(uid){try{return (typeof getEmployeeActivities==='function'?getEmployeeActivities(uid):[]).includes('RK');}catch(_){return false}}
  function audienceVisible(e,uid=AppState.currentUserId){
    const a=eventAudience(e);if(a.includes('all'))return true;
    const u=USERS[uid]||{};
    // Admin sieht zur Planung immer alle Informationen; fuer Mitarbeiter greifen die Zielgruppen.
    if(u.role==='admin')return true;
    if(a.includes('leitung')&&typeof isAdminOrDeputy==='function'&&isAdminOrDeputy(uid))return true;
    if(a.includes(u.typ))return true;
    if(a.includes('cleaning')&&isCleaning(uid))return true;
    return false;
  }
  function eventOccurs(e,date){
    if(e.enabled===false)return false;
    const k=dateKey(date);
    if(e.type==='weekly')return date.getDay()===Number(e.weekday);
    if(e.type==='oddWeek')return date.getDay()===Number(e.weekday)&&getKW(date)%2===1;
    if(e.type==='monthlyDay')return date.getDate()===Number(e.monthDay||1);
    if(e.type==='intervalWeeks'){
      if(date.getDay()!==Number(e.weekday)||!e.anchor)return false;
      const diff=Math.round((new Date(date.getFullYear(),date.getMonth(),date.getDate(),12)-fromKey(e.anchor))/86400000);
      return diff>=0&&diff%7===0&&((diff/7)%Math.max(1,Number(e.every)||1)===0);
    }
    if(e.type==='once')return !!e.date&&k===e.date;
    if(e.type==='annual'){
      const md=k.slice(5),m1=(e.annual1||'').slice(5),m2=(e.annual2||'').slice(5);
      return (!!m1&&md===m1)||(!!m2&&md===m2);
    }
    return false;
  }
  function eventsForDateAll(date){return baseEventGet().filter(e=>eventOccurs(e,date));}
  function nextEventOccurrences(id,count=3,from=new Date()){
    const e=baseEventGet().find(x=>x.id===id);if(!e)return[];
    const out=[],start=new Date(from.getFullYear(),from.getMonth(),from.getDate(),12);
    for(let i=0;i<1200&&out.length<count;i++){const d=addDays(start,i);if(eventOccurs(e,d))out.push(d);}return out;
  }
  if(typeof ImportantEvents!=='undefined'){
    ImportantEvents.forDate=(date)=>eventsForDateAll(date).filter(e=>audienceVisible(e));
    ImportantEvents.update=(id,field,value)=>{baseEventUpdate?.(id,field,value);renderEnhancedEvents();renderPlanningPage();renderInfosPage();refreshPlanOnly();};
    ImportantEvents.add=()=>{baseEventAdd?.();renderEnhancedEvents();renderPlanningPage();};
    ImportantEvents.remove=(id)=>{baseEventRemove?.(id);renderEnhancedEvents();renderPlanningPage();refreshPlanOnly();};
  }

  function setEventAudience(id,group,on){
    const e=baseEventGet().find(x=>x.id===id);if(!e)return;
    let a=eventAudience(e).filter(x=>x!=='all');
    if(group==='all')a=on?['all']:[];
    else {if(on){a=a.filter(x=>x!=='all');if(!a.includes(group))a.push(group);}else a=a.filter(x=>x!==group);}
    if(!a.length)a=['all'];
    ImportantEvents.update(id,'audience',a);
  }
  function addAdvancedEvent(template='once'){
    const before=new Set(baseEventGet().map(e=>e.id));
    baseEventAdd?.();
    const e=baseEventGet().find(x=>!before.has(x.id));if(!e)return;
    const patches=template==='breakfast'
      ? {title:'Gemeinsam frühstücken',type:'once',date:'',category:'Team',audience:['all'],enabled:false,time:'',timeMode:'at'}
      : {title:'Neuer Termin',type:'once',date:'',category:'Sonstiges',audience:['all'],enabled:true,time:'',timeMode:'at'};
    Object.entries(patches).forEach(([k,v])=>baseEventUpdate?.(e.id,k,v));
    renderEnhancedEvents();renderPlanningPage();refreshPlanOnly();
  }

  function eventRuleFields(e){
    const wd=`<select onchange="ImportantEvents.update('${e.id}','weekday',this.value)">${WEEKDAYS.map(([v,l])=>`<option value="${v}" ${Number(e.weekday)===Number(v)?'selected':''}>${l}</option>`).join('')}</select>`;
    if(e.type==='weekly')return`<div><label>Wochentag</label>${wd}</div>`;
    if(e.type==='oddWeek')return`<div><label>Wochentag</label>${wd}</div><div><label>Regel</label><input value="ungerade KW" disabled></div>`;
    if(e.type==='monthlyDay')return`<div><label>Tag im Monat</label><input type="number" min="1" max="31" value="${e.monthDay||1}" onchange="ImportantEvents.update('${e.id}','monthDay',this.value)"></div>`;
    if(e.type==='intervalWeeks')return`<div><label>Alle … Wochen</label><input type="number" min="1" max="52" value="${e.every||3}" onchange="ImportantEvents.update('${e.id}','every',this.value)"></div><div><label>Wochentag</label>${wd}</div><div><label>Start / Anker</label><input type="date" value="${e.anchor||''}" onchange="ImportantEvents.update('${e.id}','anchor',this.value)"></div>`;
    if(e.type==='once')return`<div><label>Datum</label><input type="date" value="${e.date||''}" onchange="ImportantEvents.update('${e.id}','date',this.value)"></div>`;
    if(e.type==='annual')return`<div><label>Termin 1</label><input type="date" value="${e.annual1||''}" onchange="ImportantEvents.update('${e.id}','annual1',this.value)"></div><div><label>Termin 2 (optional)</label><input type="date" value="${e.annual2||''}" onchange="ImportantEvents.update('${e.id}','annual2',this.value)"></div>`;
    return'';
  }
  function eventCard(e){
    const aud=eventAudience(e);
    return `<div class="v15-card">
      <div class="v15-grid">
        <div class="full"><label>Bezeichnung</label><input value="${esc(e.title)}" onchange="ImportantEvents.update('${e.id}','title',this.value)"></div>
        <div><label>Kategorie</label><select onchange="ImportantEvents.update('${e.id}','category',this.value)">${CATEGORIES.map(c=>`<option ${eventCategory(e)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
        <div><label>Wiederholung</label><select onchange="ImportantEvents.update('${e.id}','type',this.value)"><option value="once" ${e.type==='once'?'selected':''}>Einmalig</option><option value="weekly" ${e.type==='weekly'?'selected':''}>Jede Woche</option><option value="oddWeek" ${e.type==='oddWeek'?'selected':''}>Ungerade KW</option><option value="intervalWeeks" ${e.type==='intervalWeeks'?'selected':''}>Alle X Wochen</option><option value="monthlyDay" ${e.type==='monthlyDay'?'selected':''}>Monatlich</option><option value="annual" ${e.type==='annual'?'selected':''}>Jährlich 1–2×</option></select></div>
        ${eventRuleFields(e)}
        <div><label>Uhrzeit</label><input type="time" value="${e.time||''}" onchange="ImportantEvents.update('${e.id}','time',this.value)"></div>
        <div><label>Zeittext</label><select onchange="ImportantEvents.update('${e.id}','timeMode',this.value)"><option value="at" ${e.timeMode!=='until'?'selected':''}>um</option><option value="until" ${e.timeMode==='until'?'selected':''}>bis</option></select></div>
        <div><label>Status</label><select onchange="ImportantEvents.update('${e.id}','enabled',this.value==='1')"><option value="1" ${e.enabled!==false?'selected':''}>Aktiv</option><option value="0" ${e.enabled===false?'selected':''}>Aus</option></select></div>
        <div class="full"><label>Sichtbar für</label><div class="v15-chiprow">${AUDIENCES.map(([v,l])=>`<label class="v15-check"><input type="checkbox" ${aud.includes(v)?'checked':''} onchange="V15Planning.setEventAudience('${e.id}','${v}',this.checked)"> ${esc(l)}</label>`).join('')}</div></div>
      </div>
      <div class="v15-actions"><button onclick="ImportantEvents.remove('${e.id}')">🗑 Entfernen</button></div>
    </div>`;
  }
  function renderEnhancedEvents(){
    const html=baseEventGet().sort((a,b)=>eventCategory(a).localeCompare(eventCategory(b),'de')||String(a.title).localeCompare(String(b.title),'de')).map(eventCard).join('')+`<div class="v15-actions"><button class="btn btn-outline" onclick="V15Planning.addEvent()">+ Termin hinzufügen</button><button class="btn btn-outline" onclick="V15Planning.addBreakfast()">+ Vorlage „Gemeinsam frühstücken“</button></div>`;
    ['importantEventsEditor','v15EventsEditor'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
  }

  // ── Wunschfrei-Frist ──
  function deadlineEvent(){return baseEventGet().find(e=>e.id==='wishfree-deadline')||null;}
  function renderDeadlineInfo(){
    const e=deadlineEvent(),dates=nextEventOccurrences('wishfree-deadline',3);
    const html=dates.length?dates.map((d,i)=>`<div class="v15-deadline"><strong>${i===0?'Nächste':'Danach'}</strong><span>${fmt(d)}${e?.time?` · ${esc(e.time)} Uhr`:''}</span></div>`).join(''):'<div class="v15-muted">Keine aktive Wunschfrei-Frist konfiguriert.</div>';
    const el=document.getElementById('v15NextDeadlines');if(el)el.innerHTML=html;
    const banner=document.getElementById('v15WishDeadlineInfo');if(banner)banner.innerHTML=`<span>⏰</span><span><strong>Nächste 3 Wunschfrei-Fristen</strong><br>${dates.map(d=>`${d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})}${e?.time?` · ${e.time}`:''}`).join(' &nbsp;·&nbsp; ')||'nicht festgelegt'}</span>`;
  }
  function deadlineEditorHtml(){
    const e=deadlineEvent()||{};
    return `<div class="v15-card"><div class="v15-grid"><div><label>Rhythmus · alle X Wochen</label><input type="number" min="1" max="52" value="${e.every||3}" onchange="ImportantEvents.update('wishfree-deadline','every',this.value)"></div><div><label>Wochentag</label><select onchange="ImportantEvents.update('wishfree-deadline','weekday',this.value)">${WEEKDAYS.map(([v,l])=>`<option value="${v}" ${Number(e.weekday)===Number(v)?'selected':''}>${l}</option>`).join('')}</select></div><div><label>Start / Ankerdatum</label><input type="date" value="${e.anchor||''}" onchange="ImportantEvents.update('wishfree-deadline','anchor',this.value)"></div><div><label>Uhrzeit</label><input type="time" value="${e.time||''}" onchange="ImportantEvents.update('wishfree-deadline','time',this.value)"></div></div><div id="v15NextDeadlines" style="margin-top:9px;"></div></div>`;
  }

  // ── Request-Admin ──
  function requestCard(r){
    const id=uidSafe(r.id),d=r.data||{};
    return `<div class="v15-card" id="req_${id}"><div class="v15-grid">
      <div><label>Mitarbeiter</label><select id="rq_uid_${id}">${(typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS)).map(([uid,u])=>`<option value="${uid}" ${r.uid===uid?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div>
      <div><label>Art</label><select id="rq_type_${id}"><option value="wunschfrei" ${r.type==='wunschfrei'?'selected':''}>Wunschfrei</option><option value="urlaub" ${r.type==='urlaub'?'selected':''}>Urlaub</option></select></div>
      <div><label>Von</label><input id="rq_von_${id}" type="date" value="${d.von||''}"></div><div><label>Bis</label><input id="rq_bis_${id}" type="date" value="${d.bis||d.von||''}"></div>
      <div><label>Schicht / Umfang</label><input id="rq_shift_${id}" value="${esc(d.schicht||'')}"></div><div><label>Status</label><select id="rq_status_${id}"><option value="offen" ${r.status==='offen'?'selected':''}>Offen</option><option value="genehmigt" ${r.status==='genehmigt'?'selected':''}>Genehmigt</option><option value="abgelehnt" ${r.status==='abgelehnt'?'selected':''}>Abgelehnt</option></select></div>
      <div class="full"><label>Hinweis</label><input id="rq_note_${id}" value="${esc(d.hinweis||'')}"></div></div>
      <div class="v15-actions"><button onclick="V15Planning.saveRequest('${esc(r.id)}')">💾 Speichern</button><button class="danger" onclick="V15Planning.deleteRequest('${esc(r.id)}')">🗑 Entfernen</button></div></div>`;
  }
  function renderRequests(){
    const box=document.getElementById('v15RequestList');if(!box)return;
    const list=effectiveRequests().filter(r=>['wunschfrei','urlaub'].includes(r.type)).sort((a,b)=>String(a.data?.von||'').localeCompare(String(b.data?.von||''))||String(USERS[a.uid]?.name||'').localeCompare(String(USERS[b.uid]?.name||''),'de'));
    box.innerHTML=list.length?list.map(requestCard).join(''):'<div class="v15-empty">Noch keine Wunschfrei-/Urlaubseinträge vorhanden.</div>';
  }
  function saveRequestFromCard(id){
    const s=uidSafe(id),type=document.getElementById(`rq_type_${s}`)?.value||'wunschfrei',von=document.getElementById(`rq_von_${s}`)?.value||'',bis=document.getElementById(`rq_bis_${s}`)?.value||von;
    if(!von){alert('Bitte ein Von-Datum angeben.');return;}if(bis<von){alert('Bis darf nicht vor Von liegen.');return;}
    const blocked=blockedInRange(von,bis,type);
    if(blocked.length&&!confirm(`Achtung: ${blocked.map(x=>`${fmt(x.date)} (${x.hits.map(h=>h.title).join(', ')})`).join('; ')} ist gesperrt. Trotzdem als Admin speichern?`))return;
    updateRequest(id,{uid:document.getElementById(`rq_uid_${s}`).value,type,status:document.getElementById(`rq_status_${s}`).value,data:{von,bis,schicht:document.getElementById(`rq_shift_${s}`).value.trim(),hinweis:document.getElementById(`rq_note_${s}`).value.trim()}});
    showToast?.('✓ Eintrag aktualisiert');
  }
  function addRequestFromForm(){
    const uid=document.getElementById('v15NewReqUid')?.value,type=document.getElementById('v15NewReqType')?.value,von=document.getElementById('v15NewReqVon')?.value,bis=document.getElementById('v15NewReqBis')?.value||von,override=document.getElementById('v15NewReqOverride')?.checked;
    if(!uid||!von){alert('Bitte Mitarbeiter und Datum angeben.');return;}if(bis<von){alert('Bis darf nicht vor Von liegen.');return;}
    const blocked=blockedInRange(von,bis,type);if(blocked.length&&!override){alert('Der Zeitraum enthält eine Sperre. Für eine kurzfristige Admin-Ergänzung „Sperre übersteuern“ aktivieren.');return;}
    addManualRequest({type,uid,von,bis,schicht:document.getElementById('v15NewReqShift')?.value.trim()||'',hinweis:document.getElementById('v15NewReqNote')?.value.trim()||'',status:'genehmigt'});
    ['v15NewReqVon','v15NewReqBis','v15NewReqShift','v15NewReqNote'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});if(document.getElementById('v15NewReqOverride'))document.getElementById('v15NewReqOverride').checked=false;
    showToast?.('✓ Kurzfristiger Eintrag ergänzt');
  }

  // ── Sperren ──
  function renderBlockouts(){
    const box=document.getElementById('v15Blockouts');if(!box)return;
    box.innerHTML=state.blockouts.map(b=>`<div class="v15-card"><div class="v15-grid"><div><label>Bezeichnung</label><input value="${esc(b.title)}" onchange="V15Planning.blockChange('${b.id}','title',this.value)"></div><div><label>Sperrt</label><select onchange="V15Planning.blockChange('${b.id}','target',this.value)"><option value="both" ${b.target==='both'?'selected':''}>Urlaub + Wunschfrei</option><option value="wunschfrei" ${b.target==='wunschfrei'?'selected':''}>nur Wunschfrei</option><option value="urlaub" ${b.target==='urlaub'?'selected':''}>nur Urlaub</option></select></div><div><label>Regel</label><select onchange="V15Planning.blockChange('${b.id}','rule',this.value)"><option value="date" ${b.rule==='date'?'selected':''}>Festes Datum</option><option value="rosenmontag" ${b.rule==='rosenmontag'?'selected':''}>Rosenmontag jährlich</option><option value="annualRange" ${b.rule==='annualRange'?'selected':''}>Jährlicher Zeitraum</option></select></div><div><label>Status</label><select onchange="V15Planning.blockChange('${b.id}','enabled',this.value==='1')"><option value="1" ${b.enabled?'selected':''}>Aktiv</option><option value="0" ${!b.enabled?'selected':''}>Aus</option></select></div>${b.rule==='date'?`<div><label>Datum</label><input type="date" value="${b.date||''}" onchange="V15Planning.blockChange('${b.id}','date',this.value)"></div>`:''}${b.rule==='annualRange'?`<div><label>Von (MM-TT)</label><input value="${b.start||'12-24'}" placeholder="12-24" onchange="V15Planning.blockChange('${b.id}','start',this.value)"></div><div><label>Bis (MM-TT)</label><input value="${b.end||'12-26'}" placeholder="12-26" onchange="V15Planning.blockChange('${b.id}','end',this.value)"></div>`:''}</div><div class="v15-actions"><button class="danger" onclick="V15Planning.removeBlock('${b.id}')">🗑 Entfernen</button></div></div>`).join('')+`<button class="btn btn-outline" onclick="V15Planning.addBlock()">+ Sperre hinzufügen</button>`;
  }
  function blockChange(id,field,value){const b=state.blockouts.find(x=>x.id===id);if(!b)return;b[field]=value;save();renderBlockouts();refreshPlanning();}
  function addBlock(){state.blockouts.push({id:'block-'+Date.now(),title:'Neue Sperre',rule:'date',date:'',target:'both',enabled:true});save();renderBlockouts();}
  function removeBlock(id){state.blockouts=state.blockouts.filter(x=>x.id!==id);save();renderBlockouts();refreshPlanning();}

  // ── Schliess-/Halbtage ──
  function renderClosures(){
    const box=document.getElementById('v15Closures');if(!box)return;
    const rows=state.closures.sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(c=>`<div class="v15-card"><div class="v15-grid"><div><label>Datum</label><input type="date" value="${c.date||''}" onchange="V15Planning.closureChange('${c.id}','date',this.value)"></div><div><label>Betrieb</label><select onchange="V15Planning.closureChange('${c.id}','kind',this.value)"><option value="full" ${c.kind==='full'?'selected':''}>Ganztägig geschlossen</option><option value="morning" ${c.kind==='morning'?'selected':''}>Früh/Vormittag geschlossen</option><option value="evening" ${c.kind==='evening'?'selected':''}>Spät/Abend geschlossen</option></select></div><div class="full"><label>Hinweis</label><input value="${esc(c.note||'')}" placeholder="z. B. Betriebsfeier" onchange="V15Planning.closureChange('${c.id}','note',this.value)"></div></div><div class="v15-actions"><button class="danger" onclick="V15Planning.removeClosure('${c.id}')">🗑 Entfernen</button></div></div>`).join('');
    box.innerHTML=rows+`<button class="btn btn-outline" onclick="V15Planning.addClosure()">+ Geschlossenen / halben Tag hinzufügen</button>`;
  }
  function closureChange(id,field,value){const c=state.closures.find(x=>x.id===id);if(!c)return;c[field]=value;save();renderClosures();refreshPlanning();}
  function addClosure(){state.closures.push({id:'close-'+Date.now(),date:'',kind:'full',note:'',enabled:true});save();renderClosures();}
  function removeClosure(id){state.closures=state.closures.filter(x=>x.id!==id);save();renderClosures();refreshPlanning();}

  // ── Mangelliste ──
  function addShortage(){
    const title=document.getElementById('shortTitle')?.value.trim(),note=document.getElementById('shortNote')?.value.trim(),type=document.getElementById('shortType')?.value||'missing';
    if(!title){alert('Bitte angeben, was fehlt oder kaputt ist.');return;}
    state.shortages.unshift({id:'short-'+Date.now(),uid:AppState.currentUserId,type,title,note,status:'open',createdAt:new Date().toISOString()});save();renderShortagePage();renderAdminShortages();showToast?.('✓ Mangel gemeldet');
  }
  function shortageStatus(id,status){const s=state.shortages.find(x=>x.id===id);if(!s)return;s.status=status;save();renderShortagePage();renderAdminShortages();}
  function removeShortage(id){state.shortages=state.shortages.filter(x=>x.id!==id);save();renderShortagePage();renderAdminShortages();}
  function shortageBadge(s){const map={open:['Offen','#FCEBEB','#791F1F'],work:['In Bearbeitung','#FFF2CC','#7D6608'],done:['Erledigt','#E1F5EE','#085041']},x=map[s.status]||map.open;return`<span style="background:${x[1]};color:${x[2]};padding:3px 7px;border-radius:7px;font-size:10px;font-weight:700;">${x[0]}</span>`;}
  function renderShortagePage(){
    const box=document.getElementById('v15ShortageOwn');if(!box)return;
    const list=state.shortages.filter(s=>s.uid===AppState.currentUserId);
    box.innerHTML=list.length?list.map(s=>`<div class="v15-card"><div style="display:flex;gap:8px;align-items:start;"><div style="flex:1;"><strong>${s.type==='broken'?'🔧 Defekt':s.type==='missing'?'📦 Fehlt':'ℹ️ Sonstiges'} · ${esc(s.title)}</strong><div class="v15-muted">${esc(s.note||'Kein Zusatzhinweis')} · ${new Date(s.createdAt).toLocaleDateString('de-DE')}</div></div>${shortageBadge(s)}</div></div>`).join(''):'<div class="v15-empty">Keine eigenen Meldungen.</div>';
  }
  function renderAdminShortages(){
    const box=document.getElementById('v15AdminShortages');if(!box)return;
    box.innerHTML=state.shortages.length?state.shortages.map(s=>`<div class="v15-card"><div style="display:flex;gap:8px;align-items:start;"><div style="flex:1;"><strong>${s.type==='broken'?'🔧 Defekt':s.type==='missing'?'📦 Fehlt':'ℹ️ Sonstiges'} · ${esc(s.title)}</strong><div class="v15-muted">${esc(USERS[s.uid]?.name||s.uid)} · ${esc(s.note||'Kein Zusatzhinweis')} · ${new Date(s.createdAt).toLocaleDateString('de-DE')}</div></div></div><div class="v15-actions"><select onchange="V15Planning.shortageStatus('${s.id}',this.value)"><option value="open" ${s.status==='open'?'selected':''}>Offen</option><option value="work" ${s.status==='work'?'selected':''}>In Bearbeitung</option><option value="done" ${s.status==='done'?'selected':''}>Erledigt</option></select><button class="danger" onclick="V15Planning.removeShortage('${s.id}')">🗑</button></div></div>`).join(''):'<div class="v15-empty">Keine Mängel gemeldet.</div>';
  }

  // ── Reinigung / Besonderheiten ──
  function taskNextText(t){if(t.nextDue)return fmt(fromKey(t.nextDue));if(t.lastDone&&Number(t.intervalDays)>0)return fmt(addDays(fromKey(t.lastDone),Number(t.intervalDays)));return'noch nicht terminiert';}
  function markCleaningDone(id){const t=state.cleaning.tasks.find(x=>x.id===id);if(!t)return;const today=dateKey(new Date());t.lastDone=today;if(Number(t.intervalDays)>0)t.nextDue=dateKey(addDays(fromKey(today),Number(t.intervalDays)));save();renderCleaningPage();renderCleaningAdmin();showToast?.('✓ Reinigungsaufgabe als erledigt markiert');}
  function cleaningTaskChange(id,field,value){const t=state.cleaning.tasks.find(x=>x.id===id);if(!t)return;if(field==='enabled')value=!!value;if(field==='intervalDays')value=value===''?null:Math.max(1,Number(value)||1);t[field]=value;save();renderCleaningAdmin();renderCleaningPage();}
  function addCleaningTask(){state.cleaning.tasks.push({id:'clean-'+Date.now(),title:'Neue Reinigungsaufgabe',enabled:true,intervalDays:null,nextDue:'',lastDone:'',note:''});save();renderCleaningAdmin();renderCleaningPage();}
  function removeCleaningTask(id){state.cleaning.tasks=state.cleaning.tasks.filter(x=>x.id!==id);save();renderCleaningAdmin();renderCleaningPage();}
  function saveCleaningInfo(){state.cleaning.info=document.getElementById('v15CleaningInfoEdit')?.value||'';save();renderCleaningPage();showToast?.('✓ Reinigungsinfo gespeichert');}
  function renderCleaningAdmin(){
    const info=document.getElementById('v15CleaningAdmin');if(!info)return;
    info.innerHTML=`<div class="v15-card"><label>Besonderheiten / Info für Reinigungskräfte</label><textarea id="v15CleaningInfoEdit" rows="3" placeholder="z. B. Besonderheiten dieser Woche">${esc(state.cleaning.info||'')}</textarea><div class="v15-actions"><button onclick="V15Planning.saveCleaningInfo()">💾 Info speichern</button></div></div>`+state.cleaning.tasks.map(t=>`<div class="v15-card"><div class="v15-grid"><div class="full"><label>Aufgabe</label><input value="${esc(t.title)}" onchange="V15Planning.cleanTaskChange('${t.id}','title',this.value)"></div><div><label>Intervall in Tagen</label><input type="number" min="1" value="${t.intervalDays||''}" placeholder="z. B. 30" onchange="V15Planning.cleanTaskChange('${t.id}','intervalDays',this.value)"></div><div><label>Nächster Termin</label><input type="date" value="${t.nextDue||''}" onchange="V15Planning.cleanTaskChange('${t.id}','nextDue',this.value)"></div><div><label>Status</label><select onchange="V15Planning.cleanTaskChange('${t.id}','enabled',this.value==='1')"><option value="1" ${t.enabled?'selected':''}>Aktiv</option><option value="0" ${!t.enabled?'selected':''}>Aus</option></select></div><div><label>Zuletzt erledigt</label><input type="date" value="${t.lastDone||''}" onchange="V15Planning.cleanTaskChange('${t.id}','lastDone',this.value)"></div><div class="full"><label>Hinweis</label><input value="${esc(t.note||'')}" onchange="V15Planning.cleanTaskChange('${t.id}','note',this.value)"></div></div><div class="v15-actions"><button onclick="V15Planning.markCleaningDone('${t.id}')">✓ Heute erledigt</button><button class="danger" onclick="V15Planning.removeCleaningTask('${t.id}')">🗑 Entfernen</button></div></div>`).join('')+`<button class="btn btn-outline" onclick="V15Planning.addCleaningTask()">+ Reinigungsaufgabe hinzufügen</button>`;
  }
  function renderCleaningPage(){
    const box=document.getElementById('v15CleaningTasks');if(!box)return;
    if(!isCleaning(AppState.currentUserId)){box.innerHTML='<div class="banner bwarn"><span>🔒</span><span>Dieser Bereich ist nur für Mitarbeiter mit Tätigkeit RK sichtbar.</span></div>';return;}
    const tasks=state.cleaning.tasks.filter(t=>t.enabled);
    box.innerHTML=`${state.cleaning.info?`<div class="banner binfo"><span>🧹</span><span>${esc(state.cleaning.info)}</span></div>`:''}`+(tasks.length?tasks.map(t=>`<div class="v15-card"><div style="display:flex;gap:8px;align-items:start;"><div style="flex:1;"><strong>${esc(t.title)}</strong><div class="v15-muted">Nächster Termin: ${taskNextText(t)}${t.note?` · ${esc(t.note)}`:''}</div></div><button class="v15-smallbtn" onclick="V15Planning.markCleaningDone('${t.id}')">✓ erledigt</button></div></div>`).join(''):'<div class="v15-empty">Keine aktiven Reinigungsaufgaben hinterlegt.</div>');
  }

  // ── Uebersichten / Infos ──
  function overviewRows(days=90,forUid=null){
    const out=[],today=new Date();today.setHours(12,0,0,0);
    for(let i=0;i<days;i++){
      const d=addDays(today,i),items=[];
      const h=typeof getNRWPublicHolidayName==='function'?getNRWPublicHolidayName(d):'';if(h)items.push({cat:'Feiertag',txt:`🎉 ${h}`});
      const ev=eventsForDateAll(d).filter(e=>forUid?audienceVisible(e,forUid):true);ev.forEach(e=>items.push({cat:eventCategory(e),txt:`🗓️ ${e.title}${e.time?` · ${e.timeMode==='until'?'bis ':''}${e.time}`:''}`}));
      const cl=closureForDate(d);if(cl)items.push({cat:'Betrieb',txt:`🚫 ${closureLabel(cl)}${cl.note?' · '+cl.note:''}`});
      state.blockouts.filter(b=>blockoutMatches(b,d,'wunschfrei')||blockoutMatches(b,d,'urlaub')).forEach(b=>items.push({cat:'Sperre',txt:`⛔ ${b.title} · Urlaubs/Wunschfrei-Sperre`}));
      if(!forUid) effectiveRequests().filter(r=>['urlaub','wunschfrei'].includes(r.type)&&r.status!=='abgelehnt'&&(r.data?.von===dateKey(d))).forEach(r=>items.push({cat:r.type==='urlaub'?'Urlaub':'Wunschfrei',txt:`${r.type==='urlaub'?'🏖':'⭐'} ${USERS[r.uid]?.name||r.uid} · ${r.type==='urlaub'?'Urlaub':'Wunschfrei'}`}));
      if(forUid&&isCleaning(forUid))state.cleaning.tasks.filter(t=>t.enabled&&t.nextDue===dateKey(d)).forEach(t=>items.push({cat:'Reinigung',txt:`🧹 ${t.title}`}));
      if(items.length)out.push({date:d,items});
    }
    return out;
  }
  function renderOverview(){
    const box=document.getElementById('v15Overview');if(!box)return;
    const rows=overviewRows(120,null);box.innerHTML=rows.length?rows.slice(0,60).map(r=>`<div class="v15-overview-row"><div class="v15-date">${fmt(r.date)}</div><div>${r.items.map(x=>`<span class="v15-cat">${esc(x.cat)}</span> ${esc(x.txt)}`).join('<br>')}</div></div>`).join(''):'<div class="v15-empty">Keine Termine in den nächsten 120 Tagen.</div>';
  }
  function renderInfosPage(){
    const box=document.getElementById('v15InfosList');if(!box)return;
    const rows=overviewRows(90,AppState.currentUserId);box.innerHTML=rows.length?rows.slice(0,50).map(r=>`<div class="v15-overview-row"><div class="v15-date">${fmt(r.date)}</div><div>${r.items.map(x=>`<span class="v15-cat">${esc(x.cat)}</span> ${esc(x.txt)}`).join('<br>')}</div></div>`).join(''):'<div class="v15-empty">Keine sichtbaren Termine in den nächsten 90 Tagen.</div>';
    renderDeadlineInfo();
  }

  // ── Admin Planungsseite ──
  function newRequestFormHtml(){return `<div class="v15-card"><div style="font-weight:700;margin-bottom:8px;">Kurzfristig ergänzen</div><div class="v15-grid"><div><label>Mitarbeiter</label><select id="v15NewReqUid">${(typeof getOrderedUserEntries==='function'?getOrderedUserEntries():Object.entries(USERS)).map(([uid,u])=>`<option value="${uid}">${esc(u.name)}</option>`).join('')}</select></div><div><label>Art</label><select id="v15NewReqType"><option value="wunschfrei">Wunschfrei</option><option value="urlaub">Urlaub</option></select></div><div><label>Von</label><input id="v15NewReqVon" type="date"></div><div><label>Bis</label><input id="v15NewReqBis" type="date"></div><div><label>Schicht / Umfang</label><input id="v15NewReqShift" placeholder="Ganzer Tag / Nur Früh …"></div><div><label>Hinweis</label><input id="v15NewReqNote"></div><div class="full"><label class="v15-check"><input id="v15NewReqOverride" type="checkbox"> Sperre bewusst übersteuern</label></div></div><button class="btn btn-primary" onclick="V15Planning.addManualRequest()">+ Eintrag ergänzen</button></div>`;}
  function buildAdminPlanningPage(){
    const page=document.getElementById('pgAdminPlanning');if(!page)return;
    page.innerHTML=`<div class="back" onclick="goTo('pgAdmin','Admin')">‹ Zurück</div><div class="banner binfo"><span>🗂️</span><span>Planungszentrale: Wunschfrei/Urlaub, Termine, Sperren, Schließtage, Mangelliste und Reinigung.</span></div><div class="v15-tabs"><button onclick="V15Planning.tab('requests')" data-v15tab="requests">Wunschfrei</button><button onclick="V15Planning.tab('events')" data-v15tab="events">Termine</button><button onclick="V15Planning.tab('blocks')" data-v15tab="blocks">Sperren & Betrieb</button><button onclick="V15Planning.tab('shortages')" data-v15tab="shortages">Mangelliste</button><button onclick="V15Planning.tab('cleaning')" data-v15tab="cleaning">Reinigung</button></div>
      <div id="v15Pane_requests" class="v15-pane"><div class="sec">Wunschfrei-Frist</div>${deadlineEditorHtml()}<div class="sec">Kurzfristige Ergänzung</div>${newRequestFormHtml()}<div class="sec">Wunschfrei & Urlaub · Übersicht / Bearbeitung</div><div id="v15RequestList"></div></div>
      <div id="v15Pane_events" class="v15-pane" style="display:none;"><div class="sec">Wichtige Termine · Kategorien & Sichtbarkeit</div><div class="banner binfo"><span>👁️</span><span>Termine können für Alle, Leitung, Beschäftigungsarten oder nur Reinigung sichtbar sein. „Jährlich 1–2×“ unterstützt zwei Termine pro Jahr.</span></div><div id="v15EventsEditor"></div><div class="sec">Übersicht · nächste 120 Tage</div><div id="v15Overview"></div></div>
      <div id="v15Pane_blocks" class="v15-pane" style="display:none;"><div class="sec">Sperren für Urlaub / Wunschfrei</div><div class="banner bwarn"><span>⛔</span><span>Einschulung und letzter Schultag sind als Vorlagen vorhanden und werden erst nach Datum + Aktivierung wirksam. Rosenmontag und Weihnachten sind standardmäßig aktiv und jederzeit änderbar.</span></div><div id="v15Blockouts"></div><div class="sec">Geschlossene / halbe Tage</div><div class="banner binfo"><span>🚫</span><span>Ganztägige Schließungen setzen nicht manuell bearbeitete Service-Schichten auf frei. Manuelle Abweichungen bleiben möglich und werden als Konflikt gekennzeichnet.</span></div><div id="v15Closures"></div></div>
      <div id="v15Pane_shortages" class="v15-pane" style="display:none;"><div class="sec">Mangelliste · alle Mitarbeiter</div><div id="v15AdminShortages"></div></div>
      <div id="v15Pane_cleaning" class="v15-pane" style="display:none;"><div class="sec">Reinigung · Besonderheiten & regelmäßiger Putzplan</div><div id="v15CleaningAdmin"></div></div>`;
    renderPlanningPage();
  }
  function setTab(tab){
    document.querySelectorAll('.v15-pane').forEach(x=>x.style.display='none');document.getElementById('v15Pane_'+tab)?.style.setProperty('display','block');
    document.querySelectorAll('[data-v15tab]').forEach(b=>b.classList.toggle('active',b.dataset.v15tab===tab));
    if(tab==='requests'){renderRequests();renderDeadlineInfo();}if(tab==='events'){renderEnhancedEvents();renderOverview();}if(tab==='blocks'){renderBlockouts();renderClosures();}if(tab==='shortages')renderAdminShortages();if(tab==='cleaning')renderCleaningAdmin();
  }
  function renderPlanningPage(){if(!document.getElementById('pgAdminPlanning'))return;renderRequests();renderDeadlineInfo();renderEnhancedEvents();renderOverview();renderBlockouts();renderClosures();renderAdminShortages();renderCleaningAdmin();}

  // ── UI-Injektion ──
  function createPages(){
    const wrap=document.querySelector('.page-wrap');if(!wrap)return;
    if(!document.getElementById('pgAdminPlanning')){const p=document.createElement('div');p.className='page';p.id='pgAdminPlanning';wrap.appendChild(p);}
    if(!document.getElementById('pgInfos')){const p=document.createElement('div');p.className='page';p.id='pgInfos';p.innerHTML='<div class="back" onclick="goTo(\'pgProfil\',\'Mein Bereich\')">‹ Zurück</div><div class="banner bwarn" id="v15WishDeadlineInfo"></div><div class="sec">Termine & Infos · nächste 90 Tage</div><div id="v15InfosList"></div>';wrap.appendChild(p);}
    if(!document.getElementById('pgShortages')){const p=document.createElement('div');p.className='page';p.id='pgShortages';p.innerHTML='<div class="back" onclick="goTo(\'pgProfil\',\'Mein Bereich\')">‹ Zurück</div><div class="sec">Mangel melden</div><div class="v15-card"><div class="v15-grid"><div><label>Art</label><select id="shortType"><option value="missing">Fehlt</option><option value="broken">Kaputt / Defekt</option><option value="other">Sonstiges</option></select></div><div><label>Was?</label><input id="shortTitle" placeholder="z. B. Messbecher"></div><div class="full"><label>Hinweis</label><input id="shortNote" placeholder="optional"></div></div><button class="btn btn-primary" onclick="V15Planning.addShortage()">Mangel melden</button></div><div class="sec">Meine Meldungen</div><div id="v15ShortageOwn"></div>';wrap.appendChild(p);}
    if(!document.getElementById('pgCleaning')){const p=document.createElement('div');p.className='page';p.id='pgCleaning';p.innerHTML='<div class="back" onclick="goTo(\'pgProfil\',\'Mein Bereich\')">‹ Zurück</div><div class="sec">Reinigung & Besonderheiten</div><div id="v15CleaningTasks"></div>';wrap.appendChild(p);}
  }
  function injectMenus(){
    const adminList=document.querySelector('#pgAdmin .menu-list');if(adminList&&!document.getElementById('v15AdminPlanningMenu')){
      const item=document.createElement('div');item.className='mi';item.id='v15AdminPlanningMenu';item.onclick=()=>goTo('pgAdminPlanning','Planung & Infos');item.innerHTML='<div class="mi-icon" style="background:#FFF2CC;">🗂️</div><span class="mi-lbl">Planung, Termine & Infos</span><span class="mi-arr">›</span>';
      const settings=document.getElementById('adminSettingsMenu');adminList.insertBefore(item,settings||null);
    }
    const oldWish=[...document.querySelectorAll('#pgAdmin .mi')].find(x=>x.querySelector('.mi-lbl')?.textContent.includes('Wunschfrei genehmigen'));
    if(oldWish){oldWish.querySelector('.mi-lbl').textContent='Wunschfrei & Urlaub';oldWish.onclick=()=>{goTo('pgAdminPlanning','Planung & Infos');setTimeout(()=>setTab('requests'),0)};oldWish.querySelector('span[style*="background:#E24B4A"]')?.remove();}
    const profList=document.querySelector('#pgProfil .menu-list');if(profList){
      const pin=[...profList.children].find(x=>x.textContent.includes('PIN ändern'));
      const add=(id,icon,bg,label,pg,title)=>{if(document.getElementById(id))return;const x=document.createElement('div');x.className='mi';x.id=id;x.onclick=()=>goTo(pg,title);x.innerHTML=`<div class="mi-icon" style="background:${bg};">${icon}</div><span class="mi-lbl">${label}</span><span class="mi-arr">›</span>`;profList.insertBefore(x,pin||null)};
      add('miV15Infos','🗓️','#FFF2CC','Termine & Infos','pgInfos','Termine & Infos');
      add('miV15Shortage','🧰','#FCEBEB','Mangelliste','pgShortages','Mangelliste');
      add('miV15Cleaning','🧹','#E1F5EE','Reinigung & Besonderheiten','pgCleaning','Reinigung & Besonderheiten');
    }
  }
  function updateRoleMenus(){const c=document.getElementById('miV15Cleaning');if(c)c.style.display=isCleaning(AppState.currentUserId)?'flex':'none';const a=document.getElementById('v15AdminPlanningMenu');if(a)a.style.display=(typeof isAdminOrDeputy==='function'&&isAdminOrDeputy(AppState.currentUserId))?'flex':'none';}
  function injectWishDeadlineBanner(){
    const wp=document.getElementById('wp1');if(!wp)return;
    const old=wp.querySelector('.banner.bwarn');if(old&&!old.id)old.style.display='none';
    let b=document.getElementById('v15WishDeadlineInfo');
    // pgInfos hat denselben ID nicht zulassen; dort ist bereits einer. Wunschseite bekommt eigene ID.
    if(!document.getElementById('v15WishDeadlineInfoWunsch')){b=document.createElement('div');b.id='v15WishDeadlineInfoWunsch';b.className='banner bwarn';wp.insertBefore(b,wp.firstChild);}
    const e=deadlineEvent(),ds=nextEventOccurrences('wishfree-deadline',3),target=document.getElementById('v15WishDeadlineInfoWunsch');if(target)target.innerHTML=`<span>⏰</span><span><strong>Nächste 3 Wunschfrei-Fristen</strong><br>${ds.map(d=>`${d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})}${e?.time?` · ${e.time}`:''}`).join(' · ')||'nicht festgelegt'}</span>`;
  }

  // ── Kalender-/Plan-Dekoration ──
  function decorateHeaders(tableId,isAdmin){
    const table=document.getElementById(tableId);if(!table)return;const mon=getMonday(AppState.weekOffset),today=new Date();today.setHours(0,0,0,0);const dates=Array.from({length:7},(_,i)=>addDays(mon,i));const visible=isAdmin?dates:dates.filter(d=>d>=today);const ths=[...table.querySelectorAll('thead th')].slice(1,1+visible.length);
    ths.forEach((th,i)=>{th.querySelector('.v15-cal-badges')?.remove();const d=visible[i],bits=[],c=closureForDate(d);if(c)bits.push(`<span class="v15-cal closure">🚫 ${esc(closureLabel(c))}</span>`);const bl=state.blockouts.filter(b=>blockoutMatches(b,d,'wunschfrei')||blockoutMatches(b,d,'urlaub'));bl.forEach(b=>bits.push(`<span class="v15-cal block">⛔ ${esc(b.title)}</span>`));if(bits.length)th.insertAdjacentHTML('beforeend',`<div class="v15-cal-badges">${bits.join('')}</div>`);});
  }

  const prevShiftLabel=window.shiftLabel;
  window.shiftLabel=function(s){
    if(s?.businessClosure==='full'&&(!s.t||s.t==='-'))return `<span class="v15-closed">🚫 Geschlossen${s.closureNote?` · ${esc(s.closureNote)}`:''}</span>`;
    let h=prevShiftLabel(s);if(s?.businessClosure&&s.businessClosure!=='full'&&(!s.t||s.t==='-'))h+=`<br><span class="v15-half">½ ${esc(closureLabel({kind:s.businessClosure}))}</span>`;if(s?.closureConflict)h+=`<br><span class="v15-conflict">⚠ Schließzeit</span>`;return h;
  };shiftLabel=window.shiftLabel;

  const prevRenderPlan=window.renderPlan;
  window.renderPlan=function(){try{WeekPlanStore?.loadOffset?.(AppState.weekOffset);}catch(_){}applyCurrentConstraints();const r=prevRenderPlan.apply(this,arguments);decorateHeaders('planTbl',typeof isAdminOrDeputy==='function'&&isAdminOrDeputy(AppState.currentUserId));return r;};renderPlan=window.renderPlan;
  const prevBuildAdmin=window.buildAdminPlan;
  window.buildAdminPlan=function(){try{WeekPlanStore?.loadOffset?.(AppState.weekOffset);}catch(_){}applyCurrentConstraints();const r=prevBuildAdmin.apply(this,arguments);decorateHeaders('adminTbl',true);return r;};buildAdminPlan=window.buildAdminPlan;

  const prevOpen=window.openShiftEditor;
  window.openShiftEditor=function(uid,day){const r=prevOpen.apply(this,arguments);const d=addDays(getMonday(AppState.weekOffset),day),c=closureForDate(d),hint=document.getElementById('modalAvailabilityHint');if(c&&hint)hint.innerHTML+=` · <span style="color:#b42318;font-weight:700;">🚫 ${esc(closureLabel(c))}${c.note?' · '+esc(c.note):''}</span>`;return r;};openShiftEditor=window.openShiftEditor;
  const prevApply=window.applyShift;
  window.applyShift=function(){const d=addDays(getMonday(AppState.weekOffset),curDay),c=closureForDate(d);if(c&&closureConflict(mS,c)&&!confirm(`${closureLabel(c)}${c.note?` (${c.note})`:''}. Diese Schicht kollidiert mit der Schließzeit. Trotzdem eintragen?`))return;return prevApply.apply(this,arguments);};applyShift=window.applyShift;

  // Employee request hard block; Admin-Overlay kann bewusst uebersteuern.
  const prevWF=window.sendeWF,prevURL=window.sendeURL;
  window.sendeWF=function(){const v=document.getElementById('wfVon')?.value,b=document.getElementById('wfBis')?.value||v,h=blockedInRange(v,b,'wunschfrei');if(h.length){alert(`Wunschfrei ist gesperrt: ${h.map(x=>`${fmt(x.date)} · ${x.hits.map(y=>y.title).join(', ')}`).join('; ')}`);return;}return prevWF.apply(this,arguments);};sendeWF=window.sendeWF;
  window.sendeURL=function(){const v=document.getElementById('urlVon')?.value,b=document.getElementById('urlBis')?.value||v,h=blockedInRange(v,b,'urlaub');if(h.length){alert(`Urlaub ist gesperrt: ${h.map(x=>`${fmt(x.date)} · ${x.hits.map(y=>y.title).join(', ')}`).join('; ')}`);return;}return prevURL.apply(this,arguments);};sendeURL=window.sendeURL;

  function refreshPlanOnly(){try{applyCurrentConstraints();renderPlan();if(typeof isAdminOrDeputy==='function'&&isAdminOrDeputy(AppState.currentUserId))buildAdminPlan();}catch(e){console.warn('V15 refresh plan',e)}}
  function refreshPlanning(){try{WeekPlanStore?.syncAllConstraints?.();}catch(_){}refreshPlanOnly();renderPlanningPage();renderInfosPage();injectWishDeadlineBanner();}

  // Navigation/Login erweitern.
  const prevGoTo=window.goTo;
  window.goTo=function(pg,title){if(pg==='pgAdminPlanning'&&!(typeof isAdminOrDeputy==='function'&&isAdminOrDeputy(AppState.currentUserId))){pg='pgAdmin';title='Admin';}const r=prevGoTo(pg,title);if(pg==='pgAdminPlanning'){buildAdminPlanningPage();setTab('requests');}if(pg==='pgInfos')renderInfosPage();if(pg==='pgShortages')renderShortagePage();if(pg==='pgCleaning')renderCleaningPage();return r;};goTo=window.goTo;
  const prevStart=window.startApp;
  window.startApp=function(uid){const r=prevStart.apply(this,arguments);injectMenus();updateRoleMenus();injectWishDeadlineBanner();renderInfosPage();return r;};startApp=window.startApp;

  // Bestehende ImportantEvents-Box in Einstellungen auf erweiterten Editor umstellen.
  if(typeof NaschAdminSettings!=='undefined'&&NaschAdminSettings.buildAdminSettings){const oldBuild=NaschAdminSettings.buildAdminSettings.bind(NaschAdminSettings);NaschAdminSettings.buildAdminSettings=function(){oldBuild();renderEnhancedEvents();};}

  function resetV15(){try{localStorage.removeItem(KEY);}catch(_){}location.reload();}

  window.V15Planning={
    tab:setTab,render:renderPlanningPage,setEventAudience,addEvent:()=>addAdvancedEvent('once'),addBreakfast:()=>addAdvancedEvent('breakfast'),
    saveRequest:saveRequestFromCard,deleteRequest:(id)=>{if(confirm('Eintrag wirklich entfernen?'))deleteRequest(id)},addManualRequest:addRequestFromForm,
    blockChange,addBlock,removeBlock,closureChange,addClosure,removeClosure,
    addShortage,shortageStatus,removeShortage,
    cleanTaskChange:cleaningTaskChange,addCleaningTask,removeCleaningTask,markCleaningDone,saveCleaningInfo,
    nextDeadlines:()=>nextEventOccurrences('wishfree-deadline',3),effectiveRequests,blockedInRange,closureForDate,reset:resetV15
  };

  // CSS + Seiten/Menue einmalig erzeugen.
  function injectCss(){if(document.getElementById('v15css'))return;const s=document.createElement('style');s.id='v15css';s.textContent=`
    .v15-tabs{display:flex;gap:5px;overflow:auto;margin-bottom:12px;padding-bottom:2px}.v15-tabs button{border:1px solid var(--border);background:#fff;padding:8px 10px;border-radius:9px;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}.v15-tabs button.active{background:var(--navy);color:#fff;border-color:var(--navy)}
    .v15-card{border:1px solid var(--border);border-radius:10px;padding:10px 11px;background:#fff;margin-bottom:8px;overflow:visible}.v15-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v15-grid .full{grid-column:1/-1}.v15-grid label,.v15-card>label{font-size:10px;color:var(--muted);font-weight:600;display:block;margin-bottom:3px}.v15-grid input,.v15-grid select,.v15-card textarea,.v15-actions select{width:100%;border:1px solid var(--border);border-radius:7px;padding:7px 8px;font-size:11px;background:#fff;color:var(--text)}.v15-card textarea{resize:vertical}.v15-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center}.v15-actions button,.v15-smallbtn{border:1px solid var(--border);background:#fff;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:600;cursor:pointer}.v15-actions button.danger{color:#b42318;border-color:#f0a5a5}.v15-chiprow{display:flex;gap:5px;flex-wrap:wrap}.v15-check{display:inline-flex!important;align-items:center;gap:3px;border:1px solid var(--border);border-radius:16px;padding:5px 8px;background:#f8fafc;color:var(--text)!important;font-size:10px!important;margin:0!important}.v15-check input{width:auto!important;margin:0}.v15-muted{font-size:10px;color:var(--muted);margin-top:3px}.v15-empty{padding:14px;text-align:center;border:1px dashed var(--border);border-radius:9px;color:var(--muted);font-size:11px}.v15-deadline{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--border);font-size:11px}.v15-overview-row{display:grid;grid-template-columns:105px 1fr;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);background:#fff}.v15-overview-row:first-child{border-radius:10px 10px 0 0}.v15-date{font-size:10px;font-weight:700;color:var(--navy)}.v15-cat{display:inline-block;background:#f1f5f9;border-radius:5px;padding:1px 5px;font-size:8px;font-weight:700;margin:1px 2px 1px 0}.v15-cal-badges{display:flex;flex-direction:column;gap:2px;margin-top:2px}.v15-cal{display:block;font-size:7px;line-height:1.15;padding:2px 3px;border-radius:4px;font-weight:700;white-space:normal}.v15-cal.closure{background:#fee2e2;color:#991b1b}.v15-cal.block{background:#fef3c7;color:#92400e}.v15-closed{display:inline-block;background:#fee2e2;color:#991b1b;padding:3px 5px;border-radius:5px;font-size:9px;font-weight:700}.v15-half{color:#92400e;font-size:8px;font-weight:700}.v15-conflict{color:#b42318;font-size:8px;font-weight:700}
    @media(max-width:480px){.v15-grid{grid-template-columns:1fr}.v15-grid .full{grid-column:auto}.v15-overview-row{grid-template-columns:92px 1fr}}
  `;document.head.appendChild(s)}

  setTimeout(()=>{
    try{injectCss();createPages();injectMenus();buildAdminPlanningPage();renderEnhancedEvents();injectWishDeadlineBanner();updateRoleMenus();renderInfosPage();applyCurrentConstraints();refreshPlanOnly();console.info('NASCH '+VERSION+' aktiv');}catch(e){console.warn('V15 init',e)}
  },0);
})();
