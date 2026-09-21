# Testbericht NASCH Sandbox V11

Gezielte neue Funktionstests: **14/14 bestanden**.
Regressionstests aus V10: **11/11 bestanden**.

Geprüft wurden:
- Wunschfrei-Kontingent vollständig aus der sichtbaren Oberfläche entfernt
- normale Mitarbeiter sehen keine Wochenstunden-Spalte im Schichtplan
- Admin sieht Wochenstunden-Spalte
- feste Vertretung sieht Wochenstunden-Spalte
- temporäre Vertretung kann mit Ablaufdatum gesetzt werden
- temporäre Vertretung erhält Vertretungszugriff
- temporäre Vertretung sieht Wochenstunden-Spalte
- temporäre Vertretung kann Wochen wechseln
- temporäre Vertretung kann operative Admin-Stundenzettel sehen
- Mitarbeiter-Einstellungen bleiben nur für Admin zugänglich
- temporäre Vertretung kann aufgehoben werden
- Zugriff wird nach Aufhebung entzogen
- Name + PIN Login funktioniert weiterhin auch bei gleichen PINs
- bestehende Funktionen zum Mitarbeiter-Anlegen, PIN-Reset und Zuschlags-Stundenzettel funktionieren weiter

Zusätzlich wurden alle Inline-JavaScript-Blöcke auf Syntaxfehler geprüft.
