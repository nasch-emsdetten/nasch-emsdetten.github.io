# NASCH Sandbox V13 – Testbericht

## Ergebnis
- JavaScript-Syntax: bestanden
- V13-Laufzeitsimulation: 9/9 bestanden
- Service-Worker-Cache: V13

## Geprüft
1. Vier Standardtermine werden initial geladen.
2. Gelbe Tonne erscheint dienstags in ungeraden Kalenderwochen.
3. Getränkebestellung erscheint jeden Dienstag.
4. Wünsche-frei-Termin folgt dem 3-Wochen-Rhythmus ab dem Ankerdatum.
5. Inventur erscheint am 1. des Monats.
6. Gespeicherter nicht verfügbarer Tag wird in einer neuen Woche als fester freier Tag übernommen.
7. Urlaubsantrag wird in die passende Folgewoche übernommen.
8. Schicht eines einzelnen Mitarbeiters kann in die nächste Woche kopiert werden.
9. Urlaub/Wunschfrei hat bei der automatischen Übernahme Vorrang vor einer kopierten Standardschicht; manuelle Admin-Änderungen bleiben danach geschützt.
