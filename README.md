# Nasch Emsdetten – Mitarbeiter-App

Digitales Personalplanungssystem für Nasch Emsdetten.

## Live-URL
**https://nasch-emsdetten.github.io**

## Funktionen
- Login per 4-stelliger PIN
- Wochenplan (aus Google Sheets)
- Wunschfrei / Urlaub beantragen
- KV-System
- Krankmeldung
- Stundenzettel mit digitaler Unterschrift
- Benachrichtigungen
- Admin-Bereich für Lee Ko + Jennifer

## Technischer Stack
- **Hosting:** GitHub Pages (kostenlos)
- **Daten:** Google Sheets + Firebase Firestore
- **Login:** Firebase Authentication
- **Mail:** EmailJS (Stundenzettel-Versand)

## Test-PINs (nur Entwicklung!)
| Mitarbeiter | PIN |
|---|---|
| Lee Ko (Admin) | 1001 |
| Jennifer Haak (Vertretung) | 1002 |
| Filiz Bektik | 1003 |
| Suba Srikunathan | 1004 |
| Robin Berkenheide | 1009 |

## Deployment
Push auf `main` → automatisch live via GitHub Actions.

## Struktur
```
index.html          ← Haupt-App (Login + alle Screens)
js/
  data.js           ← Mitarbeiterdaten + Plan-Daten
  plan.js           ← Wochenplan-Rendering
  app.js            ← Login, Navigation, PIN-Änderung
manifest.json       ← PWA-Manifest
sw.js               ← Service Worker (Offline)
.github/workflows/  ← Auto-Deployment
```

## Nächste Schritte
- [ ] Firebase verbinden (echte Daten)
- [ ] Google Sheets API einbinden
- [ ] Wunschfrei-Formular fertigstellen
- [ ] Stundenzettel-Unterschrift einbauen
- [ ] EmailJS für PDF-Versand
- [ ] NFC-Zeiterfassung (spätere Phase)
