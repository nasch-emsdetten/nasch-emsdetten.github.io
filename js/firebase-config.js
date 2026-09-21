// ── Firebase Konfiguration ───────────────────────────────────
// Diese Werte aus der Firebase Console kopieren:
// https://console.firebase.google.com → Projekteinstellungen → Web-App

const FIREBASE_CONFIG = {
  apiKey:            "DEIN_API_KEY",
  authDomain:        "nasch-emsdetten.firebaseapp.com",
  projectId:         "nasch-emsdetten",
  storageBucket:     "nasch-emsdetten.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId:             "DEINE_APP_ID"
};

// ── Firebase initialisieren ──────────────────────────────────
import { initializeApp }                    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, doc, getDoc,
         setDoc, collection, getDocs,
         query, where, orderBy,
         addDoc, updateDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth, signInAnonymously,
         onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const app  = initializeApp(FIREBASE_CONFIG);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── Globale Referenzen ───────────────────────────────────────
window.Firebase = { db, auth, doc, getDoc, setDoc,
  collection, getDocs, query, where, orderBy,
  addDoc, updateDoc, serverTimestamp, signInAnonymously,
  onAuthStateChanged, signOut };
