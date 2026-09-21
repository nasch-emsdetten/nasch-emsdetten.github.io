# Testbericht Sandbox V12

## Gezielte V12-Tests: 18/18 bestanden
- V12-Kennung
- Arbeitstage/Woche-Einstellung vorhanden
- Abmeldebutton als expliziter Button
- vergangene KW für Mitarbeiter blockiert
- vergangener Montag ausgeblendet
- vergangener Dienstag ausgeblendet
- aktueller Wochentag sichtbar
- keine Wochen-Spalte für normale Mitarbeiter
- Admin sieht vergangene Tage
- Admin sieht Wochen-Spalte
- Arbeitstage/Woche werden gespeichert
- Warnung bei zu wenig freien Tagen
- Warnung farblich rot
- erfüllte Frei-Vorgabe wird korrekt angezeigt
- Logout löscht Benutzerzustand
- Logout setzt Woche zurück
- Logout blendet App aus
- Logout zeigt Login wieder an

## Regression V11: 14/14 bestanden
- Wunschfrei ohne Kontingent
- temporäre Vertretung
- Rollen-/Wochenansichten
- Wochenwechsel für Vertretung
- Admin-Stundenzettel
- Admin-only Mitarbeiter-Einstellungen
- temporäre Vertretung aufheben
- Name+PIN bei identischer PIN

## Syntax
Alle modularen JavaScript-Dateien und alle eingebetteten Skripte wurden mit Node.js syntaktisch geprüft: OK.
