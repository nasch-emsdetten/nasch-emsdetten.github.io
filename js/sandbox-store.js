// ── SANDBOX-Datenspeicher (nur Browser/localStorage) ──────────
const SandboxStore = (() => {
  const KEY = 'nasch-sandbox-v2';
  const blank = () => ({ pins:{}, employees:{}, plan:null, requests:[], availability:{}, signatures:{}, decisions:{} });
  let state = blank();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if(raw) state = { ...blank(), ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Sandbox-Speicher konnte nicht gelesen werden:', e);
      state = blank();
    }
    if(state.employees) {
      Object.entries(state.employees).forEach(([uid,user])=>{
        if(!uid || !user || typeof user!=='object') return;
        USERS[uid] = { ...user, sandboxCreated:true };
        if(!PLAN[uid]) PLAN[uid] = Array.from({length:7},()=>({t:'-',z:'',r:''}));
      });
    }
    if(state.pins) Object.assign(PINS, state.pins);
    if(state.plan) {
      Object.keys(PLAN).forEach(k => delete PLAN[k]);
      Object.assign(PLAN, state.plan);
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Sandbox-Speicher konnte nicht geschrieben werden:', e); }
  }

  function savePins() { state.pins = { ...PINS }; persist(); }
  function saveEmployee(uid) {
    if(!USERS[uid]) return;
    state.employees[uid] = JSON.parse(JSON.stringify({...USERS[uid], sandboxCreated:true}));
    persist();
  }
  function savePlan() { state.plan = JSON.parse(JSON.stringify(PLAN)); persist(); }
  function addRequest(type, uid, data) {
    state.requests.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, uid, data, createdAt: new Date().toISOString(), status:'offen' });
    persist();
  }
  function getRequests() { return [...state.requests]; }
  function saveAvailability(uid, values) { state.availability[uid] = { ...values }; persist(); }
  function getAvailability(uid) { return state.availability[uid] ? { ...state.availability[uid] } : null; }
  function saveSignature(uid) { state.signatures[uid] = new Date().toISOString(); persist(); }
  function getSignature(uid) { return state.signatures[uid] || null; }
  function saveDecision(id, status) { state.decisions[id] = status; persist(); }
  function reset() { try { localStorage.removeItem(KEY); } catch (_) {} location.reload(); }

  load();
  return { savePins, saveEmployee, savePlan, addRequest, getRequests, saveAvailability, getAvailability, saveSignature, getSignature, saveDecision, reset };
})();

