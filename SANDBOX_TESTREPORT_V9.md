# Testbericht NASCH Sandbox V9

Neue gezielte V9-Tests: **19/19 bestanden**.

Geprüft wurden:
- Zuschläge standardmäßig deaktiviert
- Zuschläge pro Mitarbeiter auf Ja/Nein schaltbar
- Übernahme des Zuschlagsstatus in das Mitarbeiterprofil
- Werktag 18:00–22:00 = 2 h mit 25 %, 0 h mit 50 %
- Sonntag 18:00–22:00 = 0 h mit 25 %, 4 h mit 50 %
- gesetzlicher NRW-Feiertag wird erkannt
- Feiertag 18:00–22:00 = nur 4 h mit 50 %
- Teilschicht 08:00–12:00 + 16:00–22:00 = 10 Arbeitsstunden
- Teilschicht am Sonntag = 10 h mit 50 %, kein 25-%-Zuschlag
- nicht zugewiesener Mitarbeiter erhält keine Zuschlagsstunden
- Schicht Samstag 22:00–Sonntag 02:00 wird in 2 h zu 25 % und 2 h zu 50 % getrennt
- Mitarbeitereinstellungen enthalten die Zuschlagszuweisung
- persönliche Stundenzettelansicht ohne Schicht-/Tätigkeitsspalte
- persönliche Zuschlagsspalten nur bei Zuweisung
- Admin-Stundenzettel ohne Schicht-/Tätigkeitsspalte
- Admin-Stundenzettel ohne Früh-/Spät-Zählung
- Admin-Stundenzettel zeigt 25-%-/50-%-Stunden
- ohne Zuweisung keine Zuschlagsspalten im persönlichen Stundenzettel
- alle Inline-JavaScript-Blöcke syntaktisch geprüft

Zusätzlich wurde der Service-Worker-Cache auf V9 aktualisiert und seine Asset-Liste an das tatsächliche Single-File-Paket angepasst.
