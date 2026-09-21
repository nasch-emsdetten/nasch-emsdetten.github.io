# NASCH Sandbox V8

Diese Version ist eine lokale Test-/Sandbox-Version. Änderungen werden im Browser gespeichert und nicht an Firebase, E-Mail, Kalender oder andere Produktivsysteme gesendet.

## Neu in V8

- Teilschicht besitzt zwei getrennte Arbeitsblöcke: früh und spät.
- Für beide Teilschicht-Blöcke können Tätigkeiten unabhängig voneinander per Mehrfachauswahl zugewiesen werden.
- Früh-/Spät-Zähler berücksichtigen Teilschichten korrekt: eine Teilschicht zählt 1x Früh und 1x Spät.
- Wochenstunden werden je Mitarbeiter direkt im Schichtplan angezeigt.
- Gesamtstunden aller Mitarbeiter werden pro Tag im Plan angezeigt.
- Persönliche Stundenansicht ist tagesbezogen mit konkretem Datum statt KW-Zeilen.
- Admin-Stundenansicht listet pro Tag alle Mitarbeiter mit Schicht, Uhrzeit, Tätigkeit und Tagesstunden.
- Alte Teilschicht-Daten mit gemeinsamer Tätigkeit bzw. zusammengefassten Uhrzeiten bleiben lesbar.
- Service-Worker-Cache auf V8 angehoben, damit beim Testen nicht versehentlich eine ältere Sandbox geladen wird.

## Test-PINs

1001 bis 1015. PIN 1001 ist Admin.
