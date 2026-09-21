# NASCH Sandbox V6 – Testbericht

Ergebnis: 15/15 gezielte V6-Laufzeittests bestanden.

Geprüft wurden unter anderem:
- getrennte Zeitvorschläge für Teilschicht 1 und 2
- unabhängige Auswahl beider Zeitblöcke
- Anzeige beider Uhrzeiten im Wochenplan
- Tätigkeitsanzeige bleibt mit Mehrfachauswahl kompatibel
- Verfügbarkeitsfilter: Teilschicht nur bei Ganztags-Verfügbarkeit vorgeschlagen
- alte Teilschicht-Daten bleiben kompatibel
- JavaScript-Syntax der geladenen Dateien und des Inline-Skripts

Hinweis: Browser-Persistenz bleibt Sandbox/localStorage; noch keine produktive Firebase-Anbindung.
