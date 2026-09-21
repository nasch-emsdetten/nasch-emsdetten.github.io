# Testbericht NASCH Sandbox V7

Gezielte Laufzeittests: **15/15 bestanden**.

Geprüft wurden unter anderem:
- Admin-Login
- Teilschicht bei Nur Früh sichtbar
- Teilschicht bei Nur Spät sichtbar
- Teilschicht bei Nicht verfügbar sichtbar
- Früh-/Spät-Filter bleiben aktiv
- Reinigung ohne RK ausgeblendet
- Reinigung mit RK eingeblendet
- RK in der Tätigkeits-Legende
- Bearbeitung und Persistenz von Legendenbezeichnungen
- Schutz des festen RK-Kürzels
- Hinzufügen neuer Kürzel + Bezeichnung
- Umbenennung normaler Kürzel inkl. Mitarbeiterzuordnung
- sichtbare Legende unter dem Plan
- zwei Zeitblöcke der Teilschicht

Zusätzlich wurden alle JavaScript-Dateien und das Haupt-Inline-Script mit Node auf Syntaxfehler geprüft.
