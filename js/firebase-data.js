// ── Firebase Daten-Layer ────────────────────────────────────
// Alle Lese- und Schreib-Operationen für Firestore

const FBData = {

  // ══ MITARBEITER ═══════════════════════════════════════════

  async getAlleMitarbeiter() {
    const { db, collection, getDocs, orderBy, query } = window.Firebase;
    const q = query(collection(db, 'mitarbeiter'), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getMitarbeiter(uid) {
    const { db, doc, getDoc } = window.Firebase;
    const snap = await getDoc(doc(db, 'mitarbeiter', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateMitarbeiter(uid, data) {
    const { db, doc, updateDoc } = window.Firebase;
    await updateDoc(doc(db, 'mitarbeiter', uid), { ...data, geaendertAm: new Date().toISOString() });
  },

  // ══ WOCHENPLAN ════════════════════════════════════════════
  // Wird aus Google Sheets geladen – nur Lesen

  async getWochenplan(kwJahr) {
    // Format: "2026-KW41"
    const { db, doc, getDoc } = window.Firebase;
    const snap = await getDoc(doc(db, 'wochenplan', kwJahr));
    return snap.exists() ? snap.data() : null;
  },

  async saveWochenplan(kwJahr, daten) {
    const { db, doc, setDoc } = window.Firebase;
    await setDoc(doc(db, 'wochenplan', kwJahr), {
      ...daten,
      gespeichertAm: new Date().toISOString(),
      gespeichertVon: sessionStorage.getItem('nasch_uid')
    });
  },

  // ══ WUNSCHFREI ════════════════════════════════════════════

  async getWunschfreiAntraege(uid = null) {
    const { db, collection, query, where, orderBy, getDocs } = window.Firebase;
    let q;
    if(uid) {
      q = query(collection(db, 'wunschfrei'),
        where('mitarbeiterId', '==', uid),
        orderBy('erstelltAm', 'desc'));
    } else {
      q = query(collection(db, 'wunschfrei'),
        orderBy('erstelltAm', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async sendeWunschfrei(uid, daten) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'wunschfrei'), {
      mitarbeiterId: uid,
      status: 'offen',
      erstelltAm: new Date().toISOString(),
      ...daten
    });
  },

  async entscheideWunschfrei(antragsId, entscheidung, kommentar = '') {
    const { db, doc, updateDoc } = window.Firebase;
    await updateDoc(doc(db, 'wunschfrei', antragsId), {
      status: entscheidung, // 'genehmigt' oder 'abgelehnt'
      entschiedenAm: new Date().toISOString(),
      entschiedenVon: sessionStorage.getItem('nasch_uid'),
      kommentar
    });
  },

  // ══ KRANKMELDUNG ══════════════════════════════════════════

  async sendeKrankmeldung(uid, daten) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'krankmeldungen'), {
      mitarbeiterId: uid,
      status: 'aktiv',
      erstelltAm: new Date().toISOString(),
      ...daten
    });
  },

  async getKrankmeldungen(uid = null) {
    const { db, collection, query, where, orderBy, getDocs } = window.Firebase;
    let q;
    if(uid) {
      q = query(collection(db, 'krankmeldungen'),
        where('mitarbeiterId', '==', uid),
        orderBy('erstelltAm', 'desc'));
    } else {
      q = query(collection(db, 'krankmeldungen'),
        where('status', '==', 'aktiv'),
        orderBy('erstelltAm', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateKrankmeldung(id, daten) {
    const { db, doc, updateDoc } = window.Firebase;
    await updateDoc(doc(db, 'krankmeldungen', id), daten);
  },

  // ══ KV-SYSTEM ═════════════════════════════════════════════

  async sendeKVAnfrage(daten) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'kv_anfragen'), {
      status: 'offen',
      erstelltAm: new Date().toISOString(),
      erstelltVon: sessionStorage.getItem('nasch_uid'),
      ...daten
    });
  },

  async getOffeneKV() {
    const { db, collection, query, where, getDocs } = window.Firebase;
    const q = query(collection(db, 'kv_anfragen'), where('status', '==', 'offen'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async antworteKV(kvId, mitarbeiterId, antwort) {
    const { db, doc, updateDoc } = window.Firebase;
    await updateDoc(doc(db, 'kv_anfragen', kvId), {
      status: antwort === 'ja' ? 'bestaetigt' : 'abgelehnt',
      beantwortetVon: mitarbeiterId,
      beantwortetAm: new Date().toISOString()
    });
  },

  // ══ SCHICHTTAUSCH ═════════════════════════════════════════

  async sendeTauschantrag(daten) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'schichttausch'), {
      status: 'offen',
      erstelltAm: new Date().toISOString(),
      ...daten
    });
  },

  async getSchichttausch(uid = null) {
    const { db, collection, query, where, getDocs } = window.Firebase;
    let q;
    if(uid) {
      q = query(collection(db, 'schichttausch'),
        where('vonMitarbeiterId', '==', uid));
    } else {
      q = query(collection(db, 'schichttausch'),
        where('status', '==', 'offen'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ══ VERFÜGBARKEIT ═════════════════════════════════════════

  async getVerfuegbarkeit(uid) {
    const { db, doc, getDoc } = window.Firebase;
    const snap = await getDoc(doc(db, 'verfuegbarkeit', uid));
    return snap.exists() ? snap.data() : null;
  },

  async sendeVerfuegbarkeitsaenderung(uid, daten, begruendung) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'verfuegbarkeit_aenderungen'), {
      mitarbeiterId: uid,
      status: 'offen',
      begruendung,
      erstelltAm: new Date().toISOString(),
      ...daten
    });
  },

  async genehmigenVerfuegbarkeit(aenderungsId, uid, neueDaten) {
    const { db, doc, updateDoc, setDoc } = window.Firebase;
    // Genehmigung markieren
    await updateDoc(doc(db, 'verfuegbarkeit_aenderungen', aenderungsId), {
      status: 'genehmigt',
      genehmiegtAm: new Date().toISOString(),
      genehmiegtVon: sessionStorage.getItem('nasch_uid')
    });
    // Aktive Verfügbarkeit aktualisieren
    await setDoc(doc(db, 'verfuegbarkeit', uid), {
      ...neueDaten,
      gueltigAb: new Date().toISOString()
    });
  },

  // ══ HOME-OFFICE ═══════════════════════════════════════════

  async sendeHomeOffice(uid, daten) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'homeoffice'), {
      mitarbeiterId: uid,
      erstelltAm: new Date().toISOString(),
      ...daten
    });
  },

  async getHomeOffice(uid) {
    const { db, collection, query, where, orderBy, getDocs } = window.Firebase;
    const q = query(collection(db, 'homeoffice'),
      where('mitarbeiterId', '==', uid),
      orderBy('erstelltAm', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ══ STUNDENZETTEL ═════════════════════════════════════════

  async getStundenzettel(uid, monatJahr) {
    // Format monatJahr: "2026-10"
    const { db, doc, getDoc } = window.Firebase;
    const snap = await getDoc(doc(db, 'stundenzettel', `${uid}_${monatJahr}`));
    return snap.exists() ? snap.data() : null;
  },

  async speichereUnterschrift(uid, monatJahr, unterschriftBase64) {
    const { db, doc, setDoc } = window.Firebase;
    await setDoc(doc(db, 'stundenzettel', `${uid}_${monatJahr}`), {
      mitarbeiterId: uid,
      monat: monatJahr,
      unterschrieben: true,
      unterschriftAm: new Date().toISOString(),
      unterschriftBild: unterschriftBase64,
      pdfVersendetAm: null
    }, { merge: true });
  },

  async getAlleStundenzettelStatus(monatJahr) {
    const { db, collection, query, where, getDocs } = window.Firebase;
    const q = query(collection(db, 'stundenzettel'),
      where('monat', '==', monatJahr));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ══ BENACHRICHTIGUNGEN ════════════════════════════════════

  async sendeNotification(empfaengerId, typ, titel, text) {
    const { db, collection, addDoc } = window.Firebase;
    return await addDoc(collection(db, 'benachrichtigungen'), {
      empfaengerId,
      typ, // 'plan', 'wunschfrei', 'kv', 'krankmeldung', 'stundenzettel', 'frist'
      titel,
      text,
      gelesen: false,
      erstelltAm: new Date().toISOString()
    });
  },

  async getNotifications(uid) {
    const { db, collection, query, where, orderBy, getDocs } = window.Firebase;
    const q = query(collection(db, 'benachrichtigungen'),
      where('empfaengerId', '==', uid),
      orderBy('erstelltAm', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async markiereGelesen(notifId) {
    const { db, doc, updateDoc } = window.Firebase;
    await updateDoc(doc(db, 'benachrichtigungen', notifId), { gelesen: true });
  },

  // ══ GOOGLE SHEETS SYNC ════════════════════════════════════

  async syncVonGoogleSheets(sheetId) {
    // Google Sheets API (Read-only, öffentlich)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Wochenplan?key=DEIN_SHEETS_API_KEY`;
    const resp = await fetch(url);
    const data = await resp.json();
    return data.values; // 2D Array der Tabellendaten
  },

};

window.FBData = FBData;
