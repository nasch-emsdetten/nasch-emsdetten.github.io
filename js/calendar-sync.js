// ── Kalender-Synchronisierung ────────────────────────────────
// Google Kalender für Mitarbeiter + Outlook für Führungskräfte
// Jeder sieht nur seine eigenen Schichten

const CalendarSync = {

  // ── Konfiguration ──────────────────────────────────────────
  GOOGLE: {
    CLIENT_ID:  'DEIN_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    API_KEY:    'DEIN_GOOGLE_API_KEY',
    SCOPE:      'https://www.googleapis.com/auth/calendar.events',
    CALENDAR_ID:'primary', // Haupt-Kalender des Mitarbeiters
  },

  OUTLOOK: {
    CLIENT_ID:   'DEINE_AZURE_APP_ID',
    TENANT_ID:   'common',
    SCOPE:       ['Calendars.ReadWrite', 'User.Read'],
    REDIRECT_URI: 'https://nasch-emsdetten.github.io',
  },

  // Event-Kategorie (erkennbar im Kalender)
  EVENT_KATEGORIE: 'Nasch Emsdetten',
  EVENT_FARBE_FRUEH: '#FFF200',  // Gelb
  EVENT_FARBE_SPAET: '#FF8000',  // Orange
  EVENT_FARBE_URLAUB:'#FF69B4',  // Pink
  EVENT_FARBE_KV:    '#FFD700',  // Gold

  // ══════════════════════════════════════════════════════════
  //  GOOGLE KALENDER
  // ══════════════════════════════════════════════════════════

  _googleToken: null,
  _googleVerbunden: false,

  // ── Google Kalender verbinden ───────────────────────────────
  async verbindeGoogle() {
    return new Promise((resolve, reject) => {
      if(typeof google === 'undefined') {
        reject(new Error('Google Identity Services nicht geladen'));
        return;
      }
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this.GOOGLE.CLIENT_ID,
        scope:     this.GOOGLE.SCOPE,
        callback: (resp) => {
          if(resp.error) { reject(new Error(resp.error)); return; }
          this._googleToken = resp.access_token;
          this._googleVerbunden = true;
          // Token in sessionStorage (läuft nach 1h ab)
          sessionStorage.setItem('nasch_google_token', resp.access_token);
          console.log('Google Kalender verbunden ✓');
          resolve(resp.access_token);
        },
      });
      client.requestAccessToken();
    });
  },

  // ── Google-Token wiederherstellen ───────────────────────────
  _getGoogleToken() {
    return this._googleToken || sessionStorage.getItem('nasch_google_token');
  },

  // ── Google-API Anfrage ──────────────────────────────────────
  async _googleFetch(url, options = {}) {
    const token = this._getGoogleToken();
    if(!token) throw new Error('Nicht mit Google verbunden');
    const resp = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        ...options.headers,
      },
    });
    if(resp.status === 401) {
      // Token abgelaufen → neu verbinden
      sessionStorage.removeItem('nasch_google_token');
      this._googleToken = null;
      this._googleVerbunden = false;
      throw new Error('Google-Token abgelaufen – bitte erneut verbinden');
    }
    return resp.json();
  },

  // ── Schicht als Google-Kalender-Event erstellen/aktualisieren
  async _googleUpsertEvent(schicht, datum, uid) {
    const user = USERS[uid];
    if(!user) return;

    const eventId  = this._erstelleEventId(uid, datum);
    const event    = this._schichtZuGoogleEvent(schicht, datum, user);
    const calId    = encodeURIComponent(this.GOOGLE.CALENDAR_ID);

    // Prüfen ob Event bereits existiert
    try {
      const existing = await this._googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`
      );
      if(existing.id) {
        // Event aktualisieren
        await this._googleFetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
          { method:'PUT', body: JSON.stringify(event) }
        );
        return;
      }
    } catch(_) {}

    // Neues Event erstellen
    await this._googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
      { method:'POST', body: JSON.stringify({ ...event, id: eventId }) }
    );
  },

  // ── Google-Event löschen ────────────────────────────────────
  async _googleDeleteEvent(datum, uid) {
    const eventId = this._erstelleEventId(uid, datum);
    const calId   = encodeURIComponent(this.GOOGLE.CALENDAR_ID);
    try {
      await this._googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
        { method:'DELETE' }
      );
    } catch(_) {}
  },

  // ── Schicht → Google-Event-Format ──────────────────────────
  _schichtZuGoogleEvent(schicht, datum, user) {
    const titel  = this._schichtTitel(schicht, user);
    const { start, end } = this._schichtZeiten(schicht, datum);
    const farbe  = this._schichtFarbe(schicht.t);
    return {
      summary:     titel,
      description: `${this.EVENT_KATEGORIE}\n${user.name} · ${user.label}`,
      location:    'Nasch Emsdetten, Emsdetten',
      start:       { dateTime: start, timeZone: 'Europe/Berlin' },
      end:         { dateTime: end,   timeZone: 'Europe/Berlin' },
      colorId:     farbe,
      reminders: {
        useDefault: false,
        overrides:  [{ method:'popup', minutes: 60 }],
      },
      extendedProperties: {
        private: { nasch_uid: user.id, nasch_typ: schicht.t }
      },
    };
  },

  // ══════════════════════════════════════════════════════════
  //  MICROSOFT OUTLOOK (Graph API)
  // ══════════════════════════════════════════════════════════

  _outlookToken: null,
  _outlookVerbunden: false,
  _msalApp: null,

  // ── Outlook verbinden ───────────────────────────────────────
  async verbindeOutlook() {
    if(typeof msal === 'undefined') throw new Error('MSAL nicht geladen');

    if(!this._msalApp) {
      this._msalApp = new msal.PublicClientApplication({
        auth: {
          clientId:    this.OUTLOOK.CLIENT_ID,
          authority:   `https://login.microsoftonline.com/${this.OUTLOOK.TENANT_ID}`,
          redirectUri: this.OUTLOOK.REDIRECT_URI,
        },
        cache: { cacheLocation:'sessionStorage' },
      });
    }

    try {
      // Popup-Login
      const result = await this._msalApp.loginPopup({
        scopes: this.OUTLOOK.SCOPE,
      });
      const token = await this._msalApp.acquireTokenSilent({
        scopes:  this.OUTLOOK.SCOPE,
        account: result.account,
      });
      this._outlookToken = token.accessToken;
      this._outlookVerbunden = true;
      sessionStorage.setItem('nasch_outlook_token', token.accessToken);
      console.log('Outlook verbunden ✓');
      return token.accessToken;
    } catch(err) {
      console.error('Outlook-Verbindung fehlgeschlagen:', err);
      throw err;
    }
  },

  _getOutlookToken() {
    return this._outlookToken || sessionStorage.getItem('nasch_outlook_token');
  },

  // ── Outlook-API Anfrage ─────────────────────────────────────
  async _outlookFetch(endpoint, options = {}) {
    const token = this._getOutlookToken();
    if(!token) throw new Error('Nicht mit Outlook verbunden');
    const resp = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        ...options.headers,
      },
    });
    if(resp.status === 401) {
      sessionStorage.removeItem('nasch_outlook_token');
      this._outlookToken = null;
      throw new Error('Outlook-Token abgelaufen');
    }
    if(resp.status === 204) return null;
    return resp.json();
  },

  // ── Schicht als Outlook-Event erstellen/aktualisieren ───────
  async _outlookUpsertEvent(schicht, datum, uid) {
    const user  = USERS[uid];
    const event = this._schichtZuOutlookEvent(schicht, datum, user);
    const tag   = datum.toISOString().slice(0,10);

    // Suche nach bestehendem Event
    const von   = new Date(datum); von.setHours(0,0,0,0);
    const bis   = new Date(datum); bis.setHours(23,59,59,0);
    const filter = `start/dateTime ge '${von.toISOString()}' and end/dateTime le '${bis.toISOString()}'`;
    const sucheURL = `/me/calendar/events?$filter=${encodeURIComponent(filter)}&$select=id,subject,singleValueExtendedProperties&$expand=singleValueExtendedProperties($filter=id eq 'String {nasch} Name nasch_uid')`;

    try {
      const existing = await this._outlookFetch(sucheURL);
      const vorhandenes = existing?.value?.find(e =>
        e.singleValueExtendedProperties?.some(p => p.value === uid)
      );

      if(vorhandenes) {
        // Aktualisieren
        await this._outlookFetch(`/me/calendar/events/${vorhandenes.id}`,
          { method:'PATCH', body: JSON.stringify(event) });
        return;
      }
    } catch(_) {}

    // Neu erstellen
    await this._outlookFetch('/me/calendar/events',
      { method:'POST', body: JSON.stringify(event) });
  },

  // ── Schicht → Outlook-Event-Format ─────────────────────────
  _schichtZuOutlookEvent(schicht, datum, user) {
    const titel = this._schichtTitel(schicht, user);
    const { start, end } = this._schichtZeiten(schicht, datum);
    return {
      subject:  titel,
      body: {
        contentType: 'Text',
        content: `${this.EVENT_KATEGORIE} · ${user.name}`,
      },
      start: { dateTime: start, timeZone: 'Europe/Berlin' },
      end:   { dateTime: end,   timeZone: 'Europe/Berlin' },
      location: { displayName: 'Nasch Emsdetten, Emsdetten' },
      categories: [this.EVENT_KATEGORIE],
      isReminderOn: true,
      reminderMinutesBeforeStart: 60,
      singleValueExtendedProperties: [
        { id:'String {nasch} Name nasch_uid', value: user.id },
        { id:'String {nasch} Name nasch_typ', value: schicht.t },
      ],
    };
  },

  // ══════════════════════════════════════════════════════════
  //  GEMEINSAME SYNC-LOGIK
  // ══════════════════════════════════════════════════════════

  // ── Alle Schichten einer Woche synchronisieren ──────────────
  async syncWoche(uid, weekOffset = 0) {
    const user = USERS[uid];
    if(!user) return;

    const hatGoogle  = !!this._getGoogleToken();
    const hatOutlook = !!this._getOutlookToken();

    if(!hatGoogle && !hatOutlook) {
      console.warn('Kein Kalender verbunden');
      return;
    }

    const monday = getMonday(weekOffset);
    const shifts = PLAN[uid] || [];
    const sync_log = [];

    for(let i = 0; i < 7; i++) {
      const datum = new Date(monday);
      datum.setDate(monday.getDate() + i);
      const schicht = shifts[i];

      try {
        if(!schicht || schicht.t === '-') {
          // Kein Event nötig → ggf. löschen
          if(hatGoogle) await this._googleDeleteEvent(datum, uid);
        } else {
          // Event erstellen/aktualisieren
          if(hatGoogle)  await this._googleUpsertEvent(schicht, datum, uid);
          if(hatOutlook && user.role === 'admin') {
            await this._outlookUpsertEvent(schicht, datum, uid);
          }
          sync_log.push(`✓ ${datum.toLocaleDateString('de-DE')}: ${schicht.t}`);
        }
      } catch(err) {
        console.warn(`Kalender-Sync Fehler für ${datum.toLocaleDateString('de-DE')}:`, err);
      }
    }

    console.log(`Kalender-Sync ${user.name}:`, sync_log);
    return sync_log;
  },

  // ── Neuer Plan → alle Mitarbeiter synchronisieren ──────────
  async syncAlleNachPlan() {
    console.log('Starte Kalender-Sync für alle Mitarbeiter…');
    for(const uid of Object.keys(USERS)) {
      try {
        await this.syncWoche(uid, AppState.weekOffset);
        await new Promise(r => setTimeout(r, 200)); // Rate-Limit vermeiden
      } catch(err) {
        console.warn(`Sync übersprungen für ${uid}:`, err.message);
      }
    }
    console.log('Kalender-Sync abgeschlossen ✓');
    this._zeigeToast('📅 Kalender aktualisiert ✓');
  },

  // ── Hilfsfunktionen ─────────────────────────────────────────
  _erstelleEventId(uid, datum) {
    // Stabile ID: nasch + uid + datum (keine Leerzeichen)
    const tag = datum.toISOString().slice(0,10).replace(/-/g,'');
    return `nasch${uid.replace(/-/g,'')}${tag}`.slice(0,1024);
  },

  _schichtTitel(schicht, user) {
    const typ = {
      'F':'🌅 Frühschicht', 'S':'🌙 Spätschicht',
      'U':'🏖 Urlaub', 'K':'🤒 Krank',
      'KV':'👥 KV', 'BS':'📚 Berufsschule',
      'T':'📋 Tagung', 'O':'🏢 Büro',
      'HO':'🏠 Home-Office', 'R':'🧹 Reinigung',
    };
    const typLabel = typ[schicht.t] || schicht.t;
    const zeitPart = schicht.z ? ` · ${schicht.z}` : '';
    const rollePart = schicht.r ? ` (${schicht.r})` : '';
    return `${typLabel}${zeitPart}${rollePart}`;
  },

  _schichtZeiten(schicht, datum) {
    const tag = datum.toISOString().slice(0,10);
    let von = '08:00', bis = '15:30';

    if(schicht.z && schicht.z.includes('–')) {
      [von, bis] = schicht.z.split('–').map(s => s.trim().slice(0,5));
    } else if(schicht.z && schicht.z.includes('-')) {
      [von, bis] = schicht.z.split('-').map(s => s.trim().slice(0,5));
    } else {
      // Standard-Zeiten je Typ
      const zeiten = {
        'F':['08:00','15:30'],'S':['15:30','22:00'],
        'U':['00:00','23:59'],'K':['00:00','23:59'],
        'BS':['08:00','16:00'],'T':['09:00','17:00'],
        'O':['09:00','17:00'],'HO':['09:00','17:00'],
        'R':['06:00','10:00'],'KV':['08:00','22:00'],
      };
      [von, bis] = zeiten[schicht.t] || ['08:00','16:00'];
    }

    return {
      start: `${tag}T${von}:00`,
      end:   `${tag}T${bis}:00`,
    };
  },

  _schichtFarbe(typ) {
    // Google Kalender Farb-IDs (1-11)
    const farben = {
      'F':'5',  // Banane (Gelb)
      'S':'6',  // Mandarine (Orange)
      'U':'4',  // Flamingo (Pink)
      'K':'11', // Tomate (Rot)
      'KV':'5', // Banane
      'BS':'9', // Blaubeere (Lila)
      'T':'7',  // Salbei (Grün)
      'O':'8',  // Graphit
      'HO':'1', // Lavendel
      'R':'2',  // Salbei
    };
    return farben[typ] || '5';
  },

  _zeigeToast(text) {
    let t = document.getElementById('calToast');
    if(!t) {
      t = document.createElement('div');
      t.id = 'calToast';
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#085041;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s;';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity='0', 3000);
  },

  // ── Verbindungsstatus ───────────────────────────────────────
  getStatus() {
    return {
      google:  !!this._getGoogleToken(),
      outlook: !!this._getOutlookToken(),
    };
  },
};

window.CalendarSync = CalendarSync;
