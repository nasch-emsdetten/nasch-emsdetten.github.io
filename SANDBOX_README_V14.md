# NASCH Sandbox V14

V14 baut auf V13 auf und ergänzt zwei Funktionen:

## Feste Vertretung verwalten

Unter **Admin → Mitarbeiter & Einstellungen → Feste Vertretung** kann der Admin:

- eine feste Vertretung auswählen,
- eine bestehende feste Vertretung aufheben,
- die feste Vertretung auf eine andere Person übertragen.

Es kann immer nur **eine** feste Vertretung geben. Wird eine andere Person festgelegt, wird die vorherige Vertretung automatisch wieder zum normalen Mitarbeiter. Die temporäre Vertretung arbeitet unabhängig davon weiter.

## Wochenplan als PDF

Im Admin-Wochenplan gibt es den Button **📄 PDF**. Admin und Vertretung sehen zusätzlich im normalen Wochenplan **📄 Wochenplan PDF**.

Der Export erstellt eine druckoptimierte A4-Querformatansicht der aktuell ausgewählten Kalenderwoche mit:

- allen Mitarbeitern,
- allen sieben Wochentagen,
- Schichten und Uhrzeiten,
- getrennten Früh-/Spätblöcken bei Teilschichten,
- Tätigkeiten,
- Urlaub, Wunschfrei und festen freien Tagen,
- Feiertagen, Ferien und wichtigen Terminen im Tageskopf,
- Wochenstunden und freien Tagen pro Mitarbeiter,
- Früh-/Spät-Anzahl und Gesamtstunden pro Tag,
- Tätigkeitslegende.

Nach dem Antippen öffnet sich der System-Druckdialog. Auf Android/Chrome kann dort **Als PDF speichern** gewählt werden. Der Dokumenttitel enthält Kalenderwoche und Jahr.

> Die Sandbox speichert weiterhin nur lokal im Browser.
