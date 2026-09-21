# Testbericht NASCH Sandbox V8

Gezielte Laufzeittests: **19/19 bestanden**.

Geprüft wurden unter anderem:
- Admin-Login
- Teilschicht zählt als Früh + Spät
- getrennte Stundenberechnung beider Teilschicht-Zeitblöcke
- normale Schichtstundenberechnung
- Kompatibilität alter Teilschicht-Zeitdaten
- Tageszählung mit Teilschicht
- Gesamtstunden pro Tag
- Wochenstunden pro Mitarbeiter
- getrennte Tätigkeiten für Teilschicht früh/spät
- getrennte Mehrfachauswahl der Tätigkeiten
- Wochenstunden-Spalte im Plan
- Tages-Gesamtzeile im Adminplan
- persönliche Tagesstundenansicht ohne KW-Gruppierung
- Admin-Tagesstundenansicht mit allen Mitarbeitern
- RK/Reinigungs-Filter
- Sichtbarkeit der Teilschicht trotz Verfügbarkeitsfilter

Zusätzlich wurden alle geladenen JavaScript-Dateien sowie alle Inline-Skripte mit Node auf Syntaxfehler geprüft.
