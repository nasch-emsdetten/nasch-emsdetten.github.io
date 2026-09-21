# GitHub Upload & Live schalten – Schritt für Schritt

## Vorbereitung (einmalig, ca. 30–45 Minuten)

---

## TEIL 1: API-Keys einrichten

### Schritt 1: Setup-Wizard öffnen
Öffne `setup.html` im Browser – dort gibst du alle Keys ein.

**ODER** konfiguriere jeden Dienst manuell:

---

### Firebase (10 Min.)
1. https://console.firebase.google.com öffnen
2. „Projekt hinzufügen" → Name: **nasch-emsdetten** → Erstellen
3. „</>" (Web-App) → App-Name: **nasch-web** → Registrieren
4. Den `firebaseConfig`-Block kopieren → in `js/firebase-config.js` eintragen
5. Authentication → Erstschritte → **Anonym** aktivieren
6. Firestore → Datenbank erstellen → **Produktionsmodus** → Frankfurt

---

### Google Sheets (5 Min.)
1. https://console.cloud.google.com öffnen
2. Dasselbe Google-Konto wie Firebase
3. APIs & Dienste → Google Sheets API aktivieren
4. API-Keys → API-Key erstellen → auf Sheets API einschränken
5. Key in `js/sheets-sync.js` eintragen:
   ```
   API_KEY: 'dein-key'
   ```

---

### EmailJS (10 Min.)
1. https://www.emailjs.com → Kostenloses Konto
2. Email Services → Gmail verbinden → Service-ID notieren
3. Email Templates → Neues Template erstellen (Vorlage in `EMAILJS_SETUP.md`)
4. Account → Public Key notieren
5. Alle drei in `js/email-service.js` eintragen

---

### Firestore Regeln (2 Min.)
1. Firebase Console → Firestore → Regeln
2. Inhalt von `firestore.rules` hineinkopieren
3. Veröffentlichen

---

## TEIL 2: GitHub Repository anlegen

### Schritt 1: GitHub Account
1. https://github.com/join öffnen
2. Username: **nasch-emsdetten** (oder ähnlich)
3. E-Mail: lee@nasch.com
4. Kostenloses Konto bestätigen

### Schritt 2: Repository erstellen
1. https://github.com/new öffnen
2. Repository name: **nasch-emsdetten.github.io**
   ⚠️ Der Name MUSS genau so heißen (mit .github.io am Ende)!
3. Sichtbarkeit: **Public** (für GitHub Pages nötig)
4. „Create repository" klicken

---

## TEIL 3: Dateien hochladen

### Option A: Einfach (Drag & Drop im Browser)
1. Im leeren Repository: „uploading an existing file" klicken
2. App-ZIP entpacken
3. Alle Dateien und Ordner in das Browser-Fenster ziehen
4. Commit-Message: „Erstinstallation"
5. „Commit changes" klicken

### Option B: Mit Git (Fortgeschritten)
```bash
git clone https://github.com/nasch-emsdetten/nasch-emsdetten.github.io
cd nasch-emsdetten.github.io
# Alle App-Dateien hier hineinkopieren
git add .
git commit -m "Erstinstallation"
git push origin main
```

---

## TEIL 4: GitHub Pages aktivieren

1. Repository → **Settings** (oben rechts)
2. Links: **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → Ordner: **/ (root)**
5. **Save** klicken
6. ⏱ 2–3 Minuten warten
7. Grüne Box erscheint: „Your site is live at **https://nasch-emsdetten.github.io**"

---

## TEIL 5: Mitarbeiter anlegen (einmalig)

1. App öffnen: **https://nasch-emsdetten.github.io**
2. Browser-Entwicklertools öffnen: **F12** → Reiter **Console**
3. Eingeben und Enter drücken:
   ```javascript
   await Firebase_Setup.initMitarbeiter()
   ```
4. Warten bis „✅ Alle Mitarbeiter angelegt!" erscheint
5. Entwicklertools schließen

---

## TEIL 6: Erste Anmeldung testen

1. Seite neu laden
2. PIN **1001** eingeben → Lee Ko (Admin)
3. Neue PIN setzen (zweimal bestätigen)
4. App ist bereit! ✅

---

## Test-PINs für alle Mitarbeiter

| Name | PIN |
|---|---|
| Lee Ko | 1001 |
| Jennifer Haak | 1002 |
| Filiz Bektik | 1003 |
| Suba Srikunathan | 1004 |
| Lina Will | 1005 |
| Aneta Michalska | 1006 |
| Leon Neubauer | 1007 |
| Liubov Ovcharenko | 1008 |
| Robin Berkenheide | 1009 |
| Zaira Jara | 1010 |
| Tissa Rajan | 1011 |
| Assol Ovcharenko | 1012 |
| Carina Botkin | 1013 |
| Luisa Hosch | 1014 |
| Altmas Khan | 1015 |

⚠️ Alle Mitarbeiter müssen bei der ersten Anmeldung ihre PIN ändern.

---

## Aktualisierungen (nach Ersteinrichtung)

Wenn Änderungen an der App gemacht werden:
1. Geänderte Dateien in GitHub hochladen (Drag & Drop)
2. GitHub Actions deployed automatisch (ca. 2 Min.)
3. Fertig!

---

## Kosten – dauerhaft 0 €

| Dienst | Limit kostenlos | Nasch Bedarf |
|---|---|---|
| GitHub Pages | Unbegrenzt | ~300 KB |
| Firebase Auth | 10.000/Monat | ~500/Monat |
| Firestore | 50.000 Lesen/Tag | ~2.000/Tag |
| Google Sheets API | 500 req/100sec | ~300/Tag |
| EmailJS | 200 Mails/Monat | 15/Monat |
| **Gesamt** | **0 €** | **weit unter Limit** |

---

## Hilfe

Bei Problemen: Fehlermeldung aus der Browser-Konsole (F12) kopieren
und in der nächsten Claude-Sitzung beschreiben. Alles ist gespeichert!
