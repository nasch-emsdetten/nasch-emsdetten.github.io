// ── PIN-basiertes Login mit Firebase ────────────────────────
// Funktionsweise:
// 1. Mitarbeiter gibt 4-stellige PIN ein
// 2. PIN wird gehasht (SHA-256)
// 3. Hash wird mit Firestore verglichen
// 4. Bei Übereinstimmung: anonyme Firebase-Session + Mitarbeiter-ID speichern

// ── PIN hashen (SHA-256) ────────────────────────────────────
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'nasch-emsdetten-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Login mit PIN ────────────────────────────────────────────
async function loginWithPIN(pin) {
  try {
    const { db, collection, query, where, getDocs, signInAnonymously, auth } = window.Firebase;

    // PIN hashen
    const pinHash = await hashPIN(pin);

    // In Firestore nach passendem Hash suchen
    const mitarbeiterRef = collection(db, 'mitarbeiter');
    const q = query(mitarbeiterRef, where('pinHash', '==', pinHash));
    const snapshot = await getDocs(q);

    if(snapshot.empty) return null;

    // Mitarbeiter gefunden
    const mitarbeiterDoc = snapshot.docs[0];
    const mitarbeiter = { id: mitarbeiterDoc.id, ...mitarbeiterDoc.data() };

    // Anonyme Firebase-Session starten
    await signInAnonymously(auth);

    // Session lokal speichern (für Seitenaktualisierung)
    sessionStorage.setItem('nasch_uid', mitarbeiter.id);
    sessionStorage.setItem('nasch_user', JSON.stringify(mitarbeiter));

    return mitarbeiter;

  } catch(err) {
    console.error('Login-Fehler:', err);
    return null;
  }
}

// ── PIN ändern ───────────────────────────────────────────────
async function changePIN(uid, altePIN, neuePIN) {
  try {
    const { db, doc, getDoc, updateDoc } = window.Firebase;

    // Alte PIN prüfen
    const altHash = await hashPIN(altePIN);
    const mitRef = doc(db, 'mitarbeiter', uid);
    const snap = await getDoc(mitRef);
    if(!snap.exists()) return { success: false, error: 'Mitarbeiter nicht gefunden' };
    if(snap.data().pinHash !== altHash) return { success: false, error: 'Falsche PIN' };

    // Einfache PINs sperren
    const BLOCKED = ['1234','0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1212','0101'];
    if(BLOCKED.includes(neuePIN)) return { success: false, error: 'Diese PIN ist nicht erlaubt' };

    // Neue PIN speichern
    const neuerHash = await hashPIN(neuePIN);
    await updateDoc(mitRef, { pinHash: neuerHash, pinGeaendertAm: new Date().toISOString() });

    return { success: true };
  } catch(err) {
    console.error('PIN-Änderung fehlgeschlagen:', err);
    return { success: false, error: 'Technischer Fehler' };
  }
}

// ── PIN zurücksetzen (Admin) ──────────────────────────────────
async function resetPIN(targetUid, tempPIN) {
  try {
    const { db, doc, updateDoc } = window.Firebase;
    const tempHash = await hashPIN(tempPIN);
    await updateDoc(doc(db, 'mitarbeiter', targetUid), {
      pinHash: tempHash,
      pinMussGeaendertWerden: true,
      pinResetAm: new Date().toISOString()
    });
    return { success: true };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

// ── Session wiederherstellen ──────────────────────────────────
function getSession() {
  const uid  = sessionStorage.getItem('nasch_uid');
  const user = sessionStorage.getItem('nasch_user');
  if(!uid || !user) return null;
  return JSON.parse(user);
}

// ── Logout ────────────────────────────────────────────────────
async function logoutFirebase() {
  try {
    await window.Firebase.signOut(window.Firebase.auth);
    sessionStorage.removeItem('nasch_uid');
    sessionStorage.removeItem('nasch_user');
  } catch(err) {
    console.error('Logout-Fehler:', err);
  }
}

window.FirebaseAuth = { loginWithPIN, changePIN, resetPIN, getSession, logoutFirebase, hashPIN };
