# NASCH Sandbox V14 – Testbericht

## Ergebnis

**10/10 gezielte V14-Funktionstests bestanden.**

Geprüft wurden:

1. vorhandene feste Vertretung wird erkannt,
2. feste Vertretung kann aufgehoben werden,
3. aufgehobene Vertretung wird wieder normaler Mitarbeiter,
4. andere Person kann als feste Vertretung gesetzt werden,
5. beim Wechsel wird die vorherige feste Vertretung automatisch zurückgestuft,
6. PDF-Titel enthält KW und Jahr,
7. PDF enthält alle Mitarbeiter,
8. PDF erhält beide Zeitblöcke einer Teilschicht,
9. PDF enthält die vollständige Wochenstruktur,
10. PDF-Ansicht startet den Systemdialog zum Drucken/Als-PDF-Speichern.

Zusätzlich geprüft:

- alle eingebetteten JavaScript-Blöcke syntaktisch gültig,
- alle externen JavaScript-Dateien syntaktisch gültig,
- Service-Worker-Cache auf V14 angehoben,
- V14-Quellmodul zusätzlich als `js/v14-enhancements.js` im Paket abgelegt.

## Hinweis zum PDF-Export

Der PDF-Export nutzt bewusst den Browser-/System-Druckdialog und keine Cloud-Bibliothek. Dadurch funktioniert er offline und überträgt keine Dienstplandaten an einen externen PDF-Dienst.
