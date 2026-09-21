// ── Ersteinrichtung: Mitarbeiter in Firestore anlegen ────────
// Diese Datei NUR EINMAL ausführen!
// Öffne die Firebase Console → Firestore → dann diese Funktion aufrufen

// ANLEITUNG:
// 1. Firebase Console öffnen: https://console.firebase.google.com
// 2. Dein Projekt "nasch-emsdetten" wählen
// 3. In der App: Firebase initialisieren
// 4. Diese Funktion einmalig aufrufen: await Firebase_Setup.initMitarbeiter()

const Firebase_Setup = {

  // ── Initiale PINs (werden später von Mitarbeitern geändert) ─
  // Format: mitarbeiterId: temporäre PIN
  INITIAL_PINS: {
    'lee-ko':        '1001',
    'jennifer-haak': '1002',
    'filiz-bektik':  '1003',
    'suba-srikunathan': '1004',
    'lina-will':     '1005',
    'aneta-michalska': '1006',
    'leon-neubauer': '1007',
    'liubov-ovcharenko': '1008',
    'robin-berkenheide': '1009',
    'zaira-jara':    '1010',
    'tissa-rajan':   '1011',
    'assol-ovcharenko': '1012',
    'carina-botkin': '1013',
    'luisa-hosch':   '1014',
    'altmas-khan':   '1015',
  },

  // ── Mitarbeiter-Stammdaten ──────────────────────────────────
  MITARBEITER: [
    {
      id: 'lee-ko',
      name: 'Lee Ko',
      initials: 'LK',
      typ: 'VZ',
      rolle: 'admin',
      label: 'Vollzeit · Filialleiterin',
      urlaubAnspruch: 25,
      urlaubGenommen: 13,
      sollStundenMonat: 160,
      homeoffice: true,
      azubi: false,
      aktiv: true,
      eingetreten: '2020-01-01',
    },
    {
      id: 'jennifer-haak',
      name: 'Jennifer Haak',
      initials: 'JH',
      typ: 'VZ',
      rolle: 'vertretung',
      label: 'Vollzeit · Vertretung',
      urlaubAnspruch: 25,
      urlaubGenommen: 8,
      sollStundenMonat: 160,
      homeoffice: true,
      azubi: false,
      aktiv: true,
      eingetreten: '2021-03-15',
    },
    {
      id: 'filiz-bektik',
      name: 'Filiz Bektik',
      initials: 'FB',
      typ: 'VZ',
      rolle: 'user',
      label: 'Vollzeit',
      urlaubAnspruch: 25,
      urlaubGenommen: 10,
      sollStundenMonat: 160,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2019-06-01',
    },
    {
      id: 'suba-srikunathan',
      name: 'Suba Srikunathan',
      initials: 'SS',
      typ: 'TZ',
      rolle: 'user',
      label: 'Teilzeit',
      urlaubAnspruch: 20,
      urlaubGenommen: 10,
      sollStundenMonat: 80,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2022-01-01',
    },
    {
      id: 'lina-will',
      name: 'Lina Will',
      initials: 'LW',
      typ: 'TZ',
      rolle: 'user',
      label: 'Teilzeit',
      urlaubAnspruch: 20,
      urlaubGenommen: 6,
      sollStundenMonat: 60,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2023-02-01',
    },
    {
      id: 'aneta-michalska',
      name: 'Aneta Michalska',
      initials: 'AM',
      typ: 'TZ',
      rolle: 'user',
      label: 'Teilzeit',
      urlaubAnspruch: 20,
      urlaubGenommen: 9,
      sollStundenMonat: 60,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2021-09-01',
    },
    {
      id: 'leon-neubauer',
      name: 'Leon Neubauer',
      initials: 'LN',
      typ: 'TZ',
      rolle: 'user',
      label: 'Teilzeit',
      urlaubAnspruch: 20,
      urlaubGenommen: 14,
      sollStundenMonat: 40,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2024-04-01',
    },
    {
      id: 'liubov-ovcharenko',
      name: 'Liubov Ovcharenko',
      initials: 'LO',
      typ: 'TZ',
      rolle: 'user',
      label: 'Teilzeit',
      urlaubAnspruch: 20,
      urlaubGenommen: 11,
      sollStundenMonat: 50,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2023-07-01',
    },
    // ── Aushilfen ───────────────────────────────────────────
    {
      id: 'robin-berkenheide',
      name: 'Robin Berkenheide',
      initials: 'RB',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2024-01-01',
    },
    {
      id: 'zaira-jara',
      name: 'Zaira Jara',
      initials: 'ZJ',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,  // → wird aktiviert wenn Azubine
      aktiv: true,
      eingetreten: '2024-06-01',
    },
    {
      id: 'tissa-rajan',
      name: 'Tissa Rajan',
      initials: 'TR',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2023-11-01',
    },
    {
      id: 'assol-ovcharenko',
      name: 'Assol Ovcharenko',
      initials: 'AO',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2024-03-01',
    },
    {
      id: 'carina-botkin',
      name: 'Carina Botkin',
      initials: 'CB',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2026-09-01',
    },
    {
      id: 'luisa-hosch',
      name: 'Luisa Hosch',
      initials: 'LH',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2026-09-01',
    },
    {
      id: 'altmas-khan',
      name: 'Altmas Khan',
      initials: 'AK',
      typ: 'AH',
      rolle: 'user',
      label: 'Aushilfe',
      urlaubAnspruch: 0,
      stundenlohn: 13.90,
      minijobGrenze: 603.00,
      homeoffice: false,
      azubi: false,
      aktiv: true,
      eingetreten: '2026-09-01',
    },
  ],

  // ── Einmalig alle Mitarbeiter anlegen ───────────────────────
  async initMitarbeiter() {
    const { db, doc, setDoc } = window.Firebase;

    console.log('Starte Initialisierung…');

    for(const ma of this.MITARBEITER) {
      const pin  = this.INITIAL_PINS[ma.id];
      if(!pin) { console.warn('Kein PIN für:', ma.id); continue; }

      // PIN hashen
      const pinHash = await window.FirebaseAuth.hashPIN(pin);

      // Mitarbeiter in Firestore anlegen
      const { id, ...daten } = ma;
      await setDoc(doc(db, 'mitarbeiter', id), {
        ...daten,
        pinHash,
        pinMussGeaendertWerden: true, // Erstanmeldung → PIN-Änderung erzwingen
        angelegtAm: new Date().toISOString(),
      });

      console.log(`✓ ${ma.name} angelegt (PIN: ${pin})`);
    }

    console.log('✅ Alle Mitarbeiter angelegt!');
    console.log('');
    console.log('Nächste Schritte:');
    console.log('1. Firestore-Regeln aus firestore.rules eintragen');
    console.log('2. Google Sheets API Key eintragen');
    console.log('3. App deployen');
  },

  // ── PIN für einzelnen Mitarbeiter zurücksetzen ──────────────
  async resetEinzelPIN(mitarbeiterId, neuePin) {
    await window.FirebaseAuth.resetPIN(mitarbeiterId, neuePin);
    console.log(`✓ PIN für ${mitarbeiterId} zurückgesetzt auf: ${neuePin}`);
  },
};

window.Firebase_Setup = Firebase_Setup;
