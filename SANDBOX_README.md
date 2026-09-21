# Nasch Emsdetten – Sandbox-Testversion

Diese Version ist bewusst **nicht** mit Firebase, E-Mail, Google Sheets oder echten Cloud-Diensten verbunden. Änderungen werden ausschließlich im `localStorage` des verwendeten Browsers gespeichert.

## Test-Login

Für die Sandbox sind die Mitarbeiter-IDs zugleich die Start-PINs: `1001` bis `1015`.

- `1001` = Admin-Demo
- `1002` = Vertretung-Demo
- `1003` bis `1015` = Mitarbeiter-Demo

## Bereits korrigiert

- Wochenplan-DOM-Fehler (`weekLabel`/`planTable`) behoben.
- Kalenderwoche startet dynamisch in der aktuellen Woche.
- ISO-Kalenderwoche korrigiert.
- Mitarbeiter-IDs in Stunden- und Stundenzettel-Demo vereinheitlicht.
- Fehlende Sollstunden erzeugen kein `NaN %` mehr.
- PIN-Änderungen, Planänderungen, Anträge, Verfügbarkeit und Unterschrift werden lokal gespeichert.
- Abbrechen beim Planbearbeiten stellt den vorherigen Plan wieder her.
- Benutzerabhängige Admin-/Homeoffice-/Outlook-Sichtbarkeit wird nach jedem Login neu gesetzt.
- Formularvalidierung für Datum und Uhrzeiten ergänzt.
- PWA-Pfade, Service-Worker-Registrierung und Icons ergänzt.
- HTML-Ausgabe des Dienstplans maskiert Benutzereingaben gegen HTML-Injektion.

## Wichtig

Diese Sandbox ist eine lokale Testfassung. Sie ist **nicht** die Produktions-Sicherheitsarchitektur. PINs befinden sich hier absichtlich weiterhin clientseitig, damit alle Testkonten ohne Backend nutzbar sind. Für die finale Version müssen Authentifizierung, Firestore-Regeln und Cloud-Speicherung getrennt finalisiert werden.
