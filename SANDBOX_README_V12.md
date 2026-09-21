# NASCH Sandbox V12

Lokale Testversion. Änderungen werden nur im Browser gespeichert.

## Neu in V12
- Abmelden robuster: offene Bearbeitung/Modal wird beendet, Session und Loginmaske werden sauber zurückgesetzt.
- Normale Mitarbeiter können keine vergangene KW anzeigen; der Plan springt auf die aktuelle Woche zurück.
- In der aktuellen Woche werden für normale Mitarbeiter abgelaufene Wochentage vollständig ausgeblendet.
- Admin, feste Vertretung und temporäre Vertretung sehen weiterhin alle 7 Tage und können Wochen vor/zurück wechseln.
- Admin-Wochenspalte zeigt pro Mitarbeiter Arbeitsstunden und freie Tage.
- Voll-/Teilzeit: neue Einstellung `Arbeitstage / Woche` (1–7).
- Daraus wird das Soll an freien Tagen berechnet (7 - Arbeitstage).
- Werden die vorgegebenen freien Tage unterschritten, erscheint in der Wochenansicht eine rote Warnung mit ⚠; erfüllt = grün.
- Bei neu angelegten Voll-/Teilzeit-Mitarbeitern müssen die Arbeitstage pro Woche angegeben werden.

## Beispiel
5 Arbeitstage / Woche = Soll 2 freie Tage.
- 5 geplante Arbeitstage => `Frei: 2 / Soll 2` (grün)
- 6 geplante Arbeitstage => `⚠ Frei: 1 / Soll 2` (rot)

## Hinweis
Aushilfen haben keine Pflichtvorgabe für Arbeitstage/Freitage, solange keine entsprechende Regel ergänzt wird.
