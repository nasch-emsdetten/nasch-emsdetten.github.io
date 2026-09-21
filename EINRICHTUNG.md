# Firebase Einrichtung – Schritt für Schritt

## Schritt 1: Firebase Projekt erstellen

1. Gehe zu: https://console.firebase.google.com
2. Klicke "Projekt hinzufügen"
3. Projektname: **nasch-emsdetten**
4. Google Analytics: **Nein** (nicht nötig)
5. Klicke "Projekt erstellen"

---

## Schritt 2: Web-App registrieren

1. Im Firebase-Projekt: Klicke das **</>** Symbol
2. App-Name: **nasch-emsdetten-web**
3. "Firebase Hosting" NICHT aktivieren (wir nutzen GitHub Pages)
4. Klicke "App registrieren"
5. Du siehst jetzt deinen **firebaseConfig** Code – **KOPIERE IHN**

Öffne `js/firebase-config.js` und ersetze die Platzhalter:
```javascript
const FIREBASE_CONFIG = {
  apiKey:            "dein-echter-api-key",
  authDomain:        "nasch-emsdetten.firebaseapp.com",
  projectId:         "nasch-emsdetten",
  ...
};
```

---

## Schritt 3: Firebase Authentication aktivieren

1. Links: "Authentication" → "Erste Schritte"
2. Tab "Sign-in-Methode"
3. "Anonym" → **Aktivieren**
4. Speichern

---

## Schritt 4: Firestore Datenbank erstellen

1. Links: "Firestore Database" → "Datenbank erstellen"
2. **Produktionsmodus** wählen
3. Region: **europe-west3 (Frankfurt)**
4. Klicke "Aktivieren"

---

## Schritt 5: Firestore Regeln eintragen

1. Firestore → Tab "Regeln"
2. Lösche alles was dort steht
3. Kopiere den Inhalt aus `firestore.rules`
4. Klicke "Veröffentlichen"

---

## Schritt 6: Mitarbeiter anlegen (einmalig)

1. Öffne die App im Browser (lokal oder auf GitHub Pages)
2. Öffne die Browser-Konsole (F12 → Console)
3. Gib ein:
```javascript
await Firebase_Setup.initMitarbeiter()
```
4. Du siehst: "✅ Alle Mitarbeiter angelegt!"

Alle 15 Mitarbeiter sind jetzt in Firestore mit temporären PINs:
- Lee Ko: 1001
- Jennifer: 1002
- Filiz: 1003
- usw.

---

## Schritt 7: Google Sheets API einrichten

1. Gehe zu: https://console.cloud.google.com
2. Dasselbe Google-Konto wie Firebase
3. "APIs & Dienste" → "Google Sheets API" aktivieren
4. API-Key erstellen → nur für Sheets API einschränken
5. Key in `js/firebase-data.js` eintragen:
```javascript
const url = `...?key=DEIN_SHEETS_API_KEY`;
```

---

## Schritt 8: GitHub Deployment

1. GitHub Account erstellen unter: https://github.com
2. Neues Repository: **nasch-emsdetten.github.io**
3. Alle App-Dateien hochladen
4. Settings → Pages → Source: "Deploy from branch (main)"
5. App ist live unter: **https://nasch-emsdetten.github.io**

---

## Fertig! Erste Anmeldung testen

1. Öffne: https://nasch-emsdetten.github.io
2. PIN eingeben: **1001** (Lee Ko)
3. Neue PIN setzen (alte: 1001 eingeben)
4. App ist bereit!

---

## Kosten

| Dienst | Kosten |
|---|---|
| Firebase Authentication (anonym) | 0 € (10.000/Monat kostenlos) |
| Firestore | 0 € (1 GB + 50.000 Lesen/Tag kostenlos) |
| GitHub Pages | 0 € (dauerhaft) |
| Google Sheets API | 0 € (500 Anfragen/100sec kostenlos) |
| **Gesamt** | **0 € dauerhaft** |

---

## Support

Bei Fragen oder Problemen: In der nächsten Claude-Sitzung beschreiben
was nicht funktioniert – alles ist gespeichert!
