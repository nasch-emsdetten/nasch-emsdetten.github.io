# NASCH Sandbox V5

Diese Version ist eine lokale Test-/Sandbox-Version. Es werden keine echten Firebase-, E-Mail-, Kalender- oder Google-Sheets-Aktionen ausgeführt.

## Neu in V5
- Teilschicht als eigene Schichtart (`TS`)
- Teilschicht unterstützt freie Uhrzeit, Mehrfach-Tätigkeiten und eigene Zeitvorschläge
- Schichtvorschläge werden pro Mitarbeiter und Wochentag nach Verfügbarkeit gefiltert:
  - Ganztag: Früh + Spät + Teilschicht
  - Nur Früh: Früh + Teilschicht
  - Nur Spät: Spät + Teilschicht
  - Nicht verfügbar: keine Früh-/Spät-/Teilschicht-Vorschläge
- Bereits bestehende, aber inzwischen unpassende Schichten bleiben sichtbar und werden als Verfügbarkeitskonflikt gekennzeichnet
- Tätigkeitsvorschläge im Schichteditor zeigen nur Tätigkeiten, die dem jeweiligen Mitarbeiter zugewiesen sind
- Teilschicht-Zeitvorschläge können unter Admin > Mitarbeiter & Einstellungen gepflegt werden

## Test-PINs
1001-1015. Admin: 1001.

## Hinweis
Monatsstunden, Stundenlohn, Verfügbarkeiten, Tätigkeiten, Reihenfolge und Zeitvorschläge werden in der Sandbox lokal im Browser gespeichert.
