# Sandbox-Testbericht

Stand: 21.09.2026

## Automatische Prüfungen

- JavaScript-Syntax: bestanden
- Admin-Login / App-Start: bestanden
- Wochenplan-Rendering: bestanden
- Mitarbeiterliste ohne `NaN`: bestanden
- Stundenzettel-ID-Zuordnung: bestanden
- Rollenabhängige UI nach Logout/Login: bestanden
- Krankmeldung validieren + lokal speichern: bestanden
- Ungültigen Urlaubszeitraum blockieren: bestanden
- Geänderte PIN lokal persistent speichern: bestanden
- Planänderung abbrechen und zurückrollen: bestanden
- Planänderung speichern und persistent ablegen: bestanden
- Manifest JSON: gültig
- Kern-Assets über lokalen HTTP-Server: alle HTTP 200

Ergebnis Laufzeitsimulation: **10/10 Tests bestanden**.

## Noch nicht als Produktion freigegeben

Die Sandbox nutzt bewusst Browser-`localStorage`. Firebase-Authentifizierung, Firestore-Sicherheitsregeln, echte E-Mail-/Kalender-/Sheets-Synchronisation und serverseitige Berechtigungen sind noch nicht Teil dieser Testfreigabe. Diese Punkte gehören in die anschließende Finalisierung.
