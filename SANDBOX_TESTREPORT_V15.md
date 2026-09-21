# NASCH Sandbox V15 – Testbericht

## Ergebnis
- V15-Logiktests: **12/12 bestanden**
- Alle 8 Inline-JavaScript-Blöcke in `index.html`: Syntaxprüfung bestanden
- `js/v15-enhancements.js`: Syntaxprüfung bestanden
- Lokaler HTTP-Smoke-Test: `index.html` und `sw.js` erfolgreich ausgeliefert
- Service-Worker-Cache: `nasch-sandbox-v15`

## Geprüfte V15-Fälle
1. V15-API wird initialisiert.
2. Wunschfrei-Frist liefert drei zukünftige Termine.
3. Erste Standardfrist = 25.09.2026.
4. Folgetermin liegt exakt drei Wochen später.
5. 24.12. ist für Wunschfrei gesperrt.
6. 25.12. ist für Urlaub gesperrt.
7. Rosenmontag 08.02.2027 wird automatisch als Sperrtag erkannt.
8. Normaler, nicht gesperrter Tag bleibt frei beantragbar.
9. Konfigurierter geschlossener Betriebstag wird erkannt.
10. Bestehende Wunschfrei-/Urlaubsanträge bleiben in der V15-Übersicht verfügbar.
11. Nur-Reinigung-Termin ist für einen RK-Mitarbeiter sichtbar.
12. Admin kann zur Planung auch gruppenbeschränkte Informationen sehen.

## Hinweise
- Die Sandbox speichert lokal im Browser (`localStorage`) und ersetzt noch keine produktive Firebase-Datenbank.
- Einschulung und letzter Schultag sind absichtlich nicht mit einem Datum vorbelegt, da diese Daten konkret für den gewünschten Schul-/Standortbezug gepflegt werden sollten.
- Reinigungsintervalle sind bei den Vorlagen absichtlich nicht erfunden und müssen vom Admin gesetzt werden.
