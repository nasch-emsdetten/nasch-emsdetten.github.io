# NASCH Sandbox V5 – Testbericht

Automatisierte Laufzeitsimulation: **33/33 Tests bestanden**.

Zusätzlich geprüft:
- JavaScript-Syntax der aktiven Dateien
- Syntax aller Inline-Skripte
- Ein-Datei-Sandbox separat mit denselben 33 Laufzeittests
- Teilschicht speichern und erneut aus lokalem Sandbox-Speicher lesen
- Verfügbarkeitsfilter Früh / Spät / Nicht verfügbar
- vorhandene Konfliktschicht bleibt editierbar
- Tätigkeitsvorschläge werden auf Mitarbeiter-Zuweisungen beschränkt
- Mehrfachauswahl bleibt erhalten

Die Tests simulieren den DOM-/Browser-Ablauf. Ein vollständiger Chromium-UI-Test ist in der aktuellen Ausführungsumgebung nicht verfügbar.
