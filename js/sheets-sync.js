// ── Google Sheets Sync ───────────────────────────────────────
// Liest den Wochenplan automatisch aus Lee Kos Google Sheet
// Sheet: https://docs.google.com/spreadsheets/d/1F9XbgCRx15P1VVd6ZxhAU8mGDo1IFzUCg0KIfGyVST4

const SheetsSync = {

  // ── Konfiguration ──────────────────────────────────────────
  SHEET_ID: '1F9XbgCRx15P1VVd6ZxhAU8mGDo1IFzUCg0KIfGyVST4',
  API_KEY:  'DEIN_GOOGLE_SHEETS_API_KEY',
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',

  // Auto-Sync alle 5 Minuten
  SYNC_INTERVAL_MS: 5 * 60 * 1000,
  _syncTimer: null,
  _letzterSync: null,

  // ── Farb-Mapping (RGB → Schichttyp) ───────────────────────
  // Aus Lee Kos Google Sheet – Farben werden automatisch erkannt
  COLOR_MAP: [
    // Frühschicht (Gelb)
    { r:[0.95,1.0], g:[0.90,1.0], b:[0.0,0.3],  typ:'F' },
    // Spätschicht (Orange)
    { r:[0.95,1.0], g:[0.55,0.75], b:[0.0,0.2], typ:'S' },
    // KV (Helles Gelb mit Rand)
    { r:[0.95,1.0], g:[0.85,1.0], b:[0.5,0.7],  typ:'KV' },
    // Urlaub (Pink)
    { r:[0.95,1.0], g:[0.7,0.9],  b:[0.85,1.0], typ:'U' },
    // Berufsschule (Lila)
    { r:[0.85,0.95], g:[0.85,0.95], b:[0.95,1.0], typ:'BS' },
    // Büro (Braun)
    { r:[0.85,0.95], g:[0.75,0.88], b:[0.65,0.80], typ:'O' },
    // Tagung (Orange-Dunkel)
    { r:[0.95,1.0], g:[0.75,0.90], b:[0.6,0.80],  typ:'T' },
    // Reinigung (Türkis)
    { r:[0.6,0.85],  g:[0.9,1.0],  b:[0.9,1.0],   typ:'R' },
    // Home-Office (Hellblau)
    { r:[0.85,0.95], g:[0.9,1.0],  b:[0.95,1.0],  typ:'HO' },
  ],

  // ── Mitarbeiter-Zuordnung (Name im Sheet → ID in Firestore)
  // Spaltennamen aus Lee Kos Sheet → App-IDs
  NAMEN_MAP: {
    'Lee Ko':           'lee-ko',
    'Jennifer':         'jennifer-haak',
    'Jennifer Haak':    'jennifer-haak',
    'Filiz':            'filiz-bektik',
    'Filiz Bektik':     'filiz-bektik',
    'Suba':             'suba-srikunathan',
    'Suba S.':          'suba-srikunathan',
    'Lina':             'lina-will',
    'Lina Will':        'lina-will',
    'Aneta':            'aneta-michalska',
    'Aneta M.':         'aneta-michalska',
    'Leon':             'leon-neubauer',
    'Leon N.':          'leon-neubauer',
    'Liubov':           'liubov-ovcharenko',
    'Liubov O.':        'liubov-ovcharenko',
    'Robin':            'robin-berkenheide',
    'Robin B.':         'robin-berkenheide',
    'Zaira':            'zaira-jara',
    'Zaira J.':         'zaira-jara',
    'Tissa':            'tissa-rajan',
    'Tissa R.':         'tissa-rajan',
    'Assol':            'assol-ovcharenko',
    'Assol O.':         'assol-ovcharenko',
    'Carina':           'carina-botkin',
    'Carina B.':        'carina-botkin',
    'Luisa':            'luisa-hosch',
    'Luisa H.':         'luisa-hosch',
    'Altmas':           'altmas-khan',
    'Altmas K.':        'altmas-khan',
  },

  // ── Verfügbare Sheet-Tabs ermitteln ─────────────────────────
  async getSheetTabs() {
    const url = `${this.BASE_URL}/${this.SHEET_ID}?key=${this.API_KEY}&fields=sheets.properties`;
    const resp = await fetch(url);
    if(!resp.ok) throw new Error(`Sheets API Fehler: ${resp.status}`);
    const data = await resp.json();
    return data.sheets.map(s => s.properties.title);
  },

  // ── KW-Tab ermitteln ────────────────────────────────────────
  // Erkennt automatisch welcher Tab zur aktuellen KW passt
  async findeAktuellenTab() {
    const tabs = await this.getSheetTabs();
    const heute = new Date();
    const kw = this._getKW(heute);
    const jahr = heute.getFullYear();

    // Suche nach Tab mit KW-Nummer
    const patterns = [
      `KW ${kw}`, `KW${kw}`, `KW ${kw} ${jahr}`,
      `Woche ${kw}`, `W${kw}`, String(kw)
    ];
    for(const pat of patterns) {
      if(tabs.find(t => t.includes(pat))) return tabs.find(t => t.includes(pat));
    }
    // Falls kein KW-Tab: nimm ersten Tab
    return tabs[0];
  },

  // ── Rohdaten aus Google Sheets lesen ────────────────────────
  async leseSheetsRohdaten(tabName) {
    // Werte lesen
    const valUrl = `${this.BASE_URL}/${this.SHEET_ID}/values/${encodeURIComponent(tabName)}?key=${this.API_KEY}`;
    const valResp = await fetch(valUrl);
    const valData = await valResp.json();

    // Formatierung lesen (Hintergrundfarben für Schichterkennung)
    const fmtUrl = `${this.BASE_URL}/${this.SHEET_ID}?key=${this.API_KEY}` +
      `&ranges=${encodeURIComponent(tabName)}` +
      `&fields=sheets.data.rowData.values.userEnteredFormat.backgroundColor`;
    const fmtResp = await fetch(fmtUrl);
    const fmtData = await fmtResp.json();

    return {
      werte: valData.values || [],
      farben: fmtData.sheets?.[0]?.data?.[0]?.rowData || []
    };
  },

  // ── Sheet-Daten in App-Format konvertieren ──────────────────
  parseSheetDaten(rohdaten) {
    const { werte, farben } = rohdaten;
    if(!werte || werte.length < 2) return null;

    // ── Kopfzeile: Datums-/Tagesspalten finden ─────────────────
    let kopfzeile = [];
    let datumsZeile = -1;
    let namenSpalte = 0;

    // Suche nach der Zeile mit Wochentagen (Mo, Di, Mi...)
    for(let r = 0; r < Math.min(5, werte.length); r++) {
      const zeile = werte[r] || [];
      const hasWeekday = zeile.some(z =>
        typeof z === 'string' &&
        ['mo','di','mi','do','fr','sa','so','mon','tue','wed','thu','fri','sat','sun']
          .includes(z.toLowerCase().trim().slice(0,2))
      );
      if(hasWeekday) { datumsZeile = r; kopfzeile = zeile; break; }
    }

    // Fallback: nimm erste Zeile als Header
    if(datumsZeile === -1) { datumsZeile = 0; kopfzeile = werte[0] || []; }

    // Tagesspalten-Indizes ermitteln (Mo=0, Di=1, ... So=6)
    const TAGE_KURZ = ['mo','di','mi','do','fr','sa','so'];
    const tagSpalten = {}; // { 0: spaltenIndex, 1: spaltenIndex, ... }
    kopfzeile.forEach((zelle, idx) => {
      if(!zelle) return;
      const kuerzel = String(zelle).toLowerCase().trim().slice(0,2);
      const tagIdx = TAGE_KURZ.indexOf(kuerzel);
      if(tagIdx !== -1) tagSpalten[tagIdx] = idx;
    });

    // ── Mitarbeiter-Zeilen lesen ───────────────────────────────
    const plan = {};
    const datumsInfo = this._extrahiereDatum(kopfzeile, tagSpalten);

    for(let r = datumsZeile + 1; r < werte.length; r++) {
      const zeile = werte[r] || [];
      if(!zeile.length) continue;

      // Name aus erster Spalte
      const nameRoh = String(zeile[namenSpalte] || '').trim();
      if(!nameRoh) continue;

      const uid = this._findeMitarbeiterId(nameRoh);
      if(!uid) continue; // Unbekannter Name → überspringen

      // Schichten für jeden Tag
      plan[uid] = [];
      for(let tagIdx = 0; tagIdx < 7; tagIdx++) {
        const spIdx = tagSpalten[tagIdx];
        if(spIdx === undefined) { plan[uid].push({ t:'-', z:'', r:'' }); continue; }

        const zellwert   = String(zeile[spIdx] || '').trim();
        const zellFarbe  = farben[r]?.values?.[spIdx]?.userEnteredFormat?.backgroundColor;
        const schicht    = this._parseSchicht(zellwert, zellFarbe);
        plan[uid].push(schicht);
      }
    }

    return { plan, datumsInfo, syncedAt: new Date().toISOString() };
  },

  // ── Einzelne Zelle als Schicht parsen ──────────────────────
  _parseSchicht(zellwert, farbe) {
    const v = zellwert.toLowerCase();

    // Explizite Text-Erkennung (hat Vorrang vor Farbe)
    if(!zellwert || v === '-' || v === 'frei' || v === '') return { t:'-', z:'', r:'' };
    if(v.includes('urlaub') || v.includes('url'))          return { t:'U',  z:'Urlaub',      r:'' };
    if(v.includes('krank') || v.includes('au'))            return { t:'K',  z:'Krank',        r:'' };
    if(v.includes('berufsschule') || v === 'bs')           return { t:'BS', z:'Berufsschule', r:'' };
    if(v.includes('tagung') || v === 'tag')                return { t:'T',  z:'Tagung',       r:'' };
    if(v.includes('büro') || v.includes('buero') || v==='bü') return { t:'O', z:'Büro',       r:'' };
    if(v.includes('home') || v === 'ho')                   return { t:'HO', z:'Home-Office',  r:'' };
    if(v.includes('reinigung') || v === 'rk')              return { t:'R',  z:'Reinigung',    r:'' };
    if(v.includes('kv'))                                   return { t:'KV', z:'KV',           r:'' };
    if(v.includes('wunsch') || v === 'wf')                 return { t:'WF', z:'Wunschfrei',   r:'' };

    // Zeiten aus Text extrahieren (z.B. "08:00-15:30" oder "08:00–15:30 Vo/GL")
    const zeitMatch = zellwert.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
    if(zeitMatch) {
      const von = zeitMatch[1].replace('.', ':');
      const bis = zeitMatch[2].replace('.', ':');
      // Rolle aus Rest des Textes
      const rolle = zellwert.replace(zeitMatch[0], '').trim();
      // Früh oder Spät anhand der Startzeit
      const startH = parseInt(von.split(':')[0]);
      const typ = startH < 14 ? 'F' : 'S';
      return { t: typ, z: `${von}–${bis}`, r: rolle };
    }

    // Farb-basierte Erkennung
    if(farbe) {
      const typ = this._farbeZuTyp(farbe);
      if(typ) return { t: typ, z: zellwert, r: '' };
    }

    // Kürzel-Erkennung (V, SL, GL etc.)
    const kuerzel = zellwert.toUpperCase();
    if(/^[A-Z\/]+$/.test(kuerzel) && kuerzel.length <= 8) {
      return { t:'F', z:'', r:kuerzel }; // Früh als Standard
    }

    return { t:'-', z:'', r:'' };
  },

  // ── RGB-Farbe → Schichttyp ─────────────────────────────────
  _farbeZuTyp(bg) {
    if(!bg) return null;
    const r = bg.red   || 0;
    const g = bg.green || 0;
    const b = bg.blue  || 0;

    // Weiß oder fast weiß = frei
    if(r > 0.95 && g > 0.95 && b > 0.95) return null;

    for(const entry of this.COLOR_MAP) {
      if(r >= entry.r[0] && r <= entry.r[1] &&
         g >= entry.g[0] && g <= entry.g[1] &&
         b >= entry.b[0] && b <= entry.b[1]) {
        return entry.typ;
      }
    }
    return null;
  },

  // ── Mitarbeiter-ID aus Name finden ─────────────────────────
  _findeMitarbeiterId(name) {
    // Direkter Treffer
    if(this.NAMEN_MAP[name]) return this.NAMEN_MAP[name];

    // Partieller Treffer (Vorname reicht)
    const vorname = name.split(/[\s,]+/)[0];
    for(const [key, id] of Object.entries(this.NAMEN_MAP)) {
      if(key.toLowerCase().startsWith(vorname.toLowerCase())) return id;
    }
    return null;
  },

  // ── Datum-Infos aus Kopfzeile extrahieren ──────────────────
  _extrahiereDatum(kopfzeile, tagSpalten) {
    // Versuche Datums-Informationen zu finden
    const daten = {};
    for(const [tagIdx, spIdx] of Object.entries(tagSpalten)) {
      const zelle = kopfzeile[parseInt(spIdx)+1] || kopfzeile[parseInt(spIdx)];
      if(!zelle) continue;
      const match = String(zelle).match(/(\d{1,2})[./](\d{1,2})/);
      if(match) daten[tagIdx] = `${match[1].padStart(2,'0')}.${match[2].padStart(2,'0')}.`;
    }
    return daten;
  },

  // ── KW berechnen ───────────────────────────────────────────
  _getKW(datum) {
    const d = new Date(datum);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const jan1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - jan1) / 86400000 - 3 + (jan1.getDay() + 6) % 7) / 7);
  },

  // ══════════════════════════════════════════════════════════
  // HAUPT-SYNC-FUNKTION
  // ══════════════════════════════════════════════════════════

  async sync(manuell = false) {
    try {
      this._setSyncStatus('running', '🔄 Wochenplan wird geladen…');

      // Tab finden
      const tab = await this.findeAktuellenTab();
      console.log(`Sync: Tab "${tab}" gefunden`);

      // Daten lesen
      const rohdaten = await this.leseSheetsRohdaten(tab);
      const parsed   = this.parseSheetDaten(rohdaten);

      if(!parsed || !parsed.plan || Object.keys(parsed.plan).length === 0) {
        throw new Error('Keine Plan-Daten gefunden');
      }

      // In Firestore speichern (gecacht)
      const kw = this._getKW(new Date());
      const kwJahr = `${new Date().getFullYear()}-KW${kw}`;
      if(window.FBData) {
        await window.FBData.saveWochenplan(kwJahr, parsed);
      }

      // Lokalen App-State aktualisieren
      this._updateAppPlan(parsed.plan);

      // Kalender automatisch aktualisieren (wenn verbunden + autoSync aktiv)
      if(typeof CalendarSync !== 'undefined' && typeof _kalenderOpts !== 'undefined') {
        if(_kalenderOpts.autoSync && (CalendarSync._getGoogleToken() || CalendarSync._getOutlookToken())) {
          setTimeout(() => CalendarSync.syncWoche(AppState.currentUserId, AppState.weekOffset), 1500);
        }
      }

      this._letzterSync = new Date();
      const zeitStr = this._letzterSync.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
      this._setSyncStatus('ok', `✓ Zuletzt aktualisiert: ${zeitStr}`);

      if(manuell) {
        this._zeigeToast('Wochenplan aktualisiert ✓');
      }

      // Benachrichtigung wenn neuer Plan
      if(manuell) this._pruefNeuerPlan(parsed.plan);

      return parsed;

    } catch(err) {
      console.error('Sheets Sync Fehler:', err);
      this._setSyncStatus('error', `⚠ Sync fehlgeschlagen – Offline-Daten werden verwendet`);

      // Fallback: gecachte Daten aus Firestore laden
      return await this._ladeGecacht();
    }
  },

  // ── Gecachte Daten aus Firestore laden ─────────────────────
  async _ladeGecacht() {
    try {
      if(!window.FBData) return null;
      const kw     = this._getKW(new Date());
      const kwJahr = `${new Date().getFullYear()}-KW${kw}`;
      const cached = await window.FBData.getWochenplan(kwJahr);
      if(cached && cached.plan) {
        this._updateAppPlan(cached.plan);
        const syncedAt = new Date(cached.syncedAt);
        const zeitStr  = syncedAt.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
        this._setSyncStatus('warn', `⚠ Offline-Daten (Stand ${zeitStr})`);
        return cached;
      }
    } catch(e) { console.error('Cache-Fehler:', e); }
    return null;
  },

  // ── App-Plan-State aktualisieren ────────────────────────────
  _updateAppPlan(neuerPlan) {
    // PLAN-Objekt in data.js überschreiben
    Object.assign(PLAN, neuerPlan);
    // Wochenplan neu rendern falls aktiv
    if(AppState.currentPage === 'pagePlan' && typeof renderPlan === 'function') {
      renderPlan();
    }
  },

  // ── Prüfen ob neuer Plan seit letztem Besuch ────────────────
  _pruefNeuerPlan(plan) {
    const letzterPlanKey = 'nasch_letzter_plan';
    const letzterPlan    = sessionStorage.getItem(letzterPlanKey);
    const jetzt          = JSON.stringify(plan);
    if(letzterPlan && letzterPlan !== jetzt) {
      this._zeigeToast('📅 Neuer Wochenplan verfügbar!');
    }
    sessionStorage.setItem(letzterPlanKey, jetzt);
  },

  // ── Auto-Sync starten ───────────────────────────────────────
  startAutoSync() {
    // Sofort laden
    this.sync();
    // Dann alle 5 Minuten
    this._syncTimer = setInterval(() => this.sync(), this.SYNC_INTERVAL_MS);
    console.log('Auto-Sync gestartet (alle 5 Minuten)');
  },

  stopAutoSync() {
    if(this._syncTimer) clearInterval(this._syncTimer);
    this._syncTimer = null;
  },

  // ── Status-Anzeige ──────────────────────────────────────────
  _setSyncStatus(typ, text) {
    const el = document.getElementById('syncStatus');
    if(!el) return;
    const colors = {
      running: '#0C447C',
      ok:      '#085041',
      error:   '#791F1F',
      warn:    '#633806',
    };
    el.textContent  = text;
    el.style.color  = colors[typ] || '#6b7280';
  },

  _zeigeToast(text) {
    let toast = document.getElementById('syncToast');
    if(!toast) {
      toast = document.createElement('div');
      toast.id = 'syncToast';
      toast.style.cssText = `
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:#1e3a5f;color:#fff;padding:10px 18px;border-radius:20px;
        font-size:13px;font-weight:500;z-index:9999;
        box-shadow:0 4px 12px rgba(0,0,0,0.2);
        transition:opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  },
};

// ── Admin Sync-Panel HTML ────────────────────────────────────
// Wird in die Admin-Ansicht eingebettet
function renderSyncPanel() {
  return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;">Google Sheets Sync</div>
        <button onclick="SheetsSync.sync(true)" style="padding:6px 12px;font-size:12px;font-weight:600;background:var(--navy);color:#fff;border:none;border-radius:6px;cursor:pointer;">
          🔄 Jetzt laden
        </button>
      </div>
      <div style="font-size:11px;" id="syncStatus">Wird geladen…</div>
      <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:8px;">
        <div id="syncBar" style="height:100%;width:0%;background:var(--navy);border-radius:2px;transition:width 1s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px;">
        <span>Auto-Sync: alle 5 Min.</span>
        <span id="syncTabName">–</span>
      </div>
    </div>
  `;
}

window.SheetsSync    = SheetsSync;
window.renderSyncPanel = renderSyncPanel;
