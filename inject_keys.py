#!/usr/bin/env python3
# ── Key-Injector ─────────────────────────────────────────────
# Liest nasch-config.json und fügt alle API-Keys in die App-Dateien ein
# Aufruf: python3 inject_keys.py nasch-config.json

import json, sys, os, re

def inject(pfad, old, new):
    with open(pfad, 'r', encoding='utf-8') as f:
        inhalt = f.read()
    if old not in inhalt:
        print(f"  ⚠ Platzhalter nicht gefunden in {pfad}: {old[:40]}…")
        return False
    with open(pfad, 'w', encoding='utf-8') as f:
        f.write(inhalt.replace(old, new, 1))
    return True

def main():
    if len(sys.argv) < 2:
        print("Verwendung: python3 inject_keys.py nasch-config.json")
        sys.exit(1)

    config_pfad = sys.argv[1]
    if not os.path.exists(config_pfad):
        print(f"Datei nicht gefunden: {config_pfad}")
        sys.exit(1)

    with open(config_pfad, encoding='utf-8') as f:
        cfg = json.load(f)

    basis = os.path.dirname(os.path.abspath(__file__))
    fehler = 0

    print("🔧 Nasch Emsdetten – Key-Injector")
    print("="*40)

    # ── Firebase ─────────────────────────────────────────────
    if 'firebase' in cfg:
        fb = cfg['firebase']
        print("\n[1/4] Firebase-Keys einbauen…")
        datei = os.path.join(basis, 'js', 'firebase-config.js')
        ersetze = [
            ('"DEIN_API_KEY"',            f'"{fb.get("apiKey","")}"'),
            ('"DEINE_SENDER_ID"',         f'"{fb.get("messagingSenderId","")}"'),
            ('"DEINE_APP_ID"',            f'"{fb.get("appId","")}"'),
        ]
        for old, new in ersetze:
            ok = inject(datei, old, new)
            print(f"  {'✓' if ok else '✗'} {old[:30]}… → {new[:30]}")

        # Auch im index.html Firebase-Block aktualisieren
        idx = os.path.join(basis, 'index.html')
        idx_ersetze = [
            ('"DEIN_API_KEY"',    f'"{fb.get("apiKey","")}"'),
            ('"DEINE_SENDER_ID"', f'"{fb.get("messagingSenderId","")}"'),
            ('"DEINE_APP_ID"',    f'"{fb.get("appId","")}"'),
        ]
        for old, new in idx_ersetze:
            inject(idx, old, new)
        print("  ✓ index.html Firebase-Block aktualisiert")

    # ── Google Sheets ────────────────────────────────────────
    if 'sheets' in cfg:
        sh = cfg['sheets']
        print("\n[2/4] Google Sheets-Keys einbauen…")
        datei = os.path.join(basis, 'js', 'sheets-sync.js')
        ok1 = inject(datei, "'DEIN_GOOGLE_SHEETS_API_KEY'", f"'{sh.get('key','')}'")
        ok2 = inject(datei, "'1F9XbgCRx15P1VVd6ZxhAU8mGDo1IFzUCg0KIfGyVST4'", f"'{sh.get('id','')}'")
        print(f"  {'✓' if ok1 else '✗'} API Key")
        print(f"  {'✓' if ok2 else '✗'} Sheet ID")

    # ── EmailJS ───────────────────────────────────────────────
    if 'emailjs' in cfg:
        ej = cfg['emailjs']
        print("\n[3/4] EmailJS-Keys einbauen…")
        datei = os.path.join(basis, 'js', 'email-service.js')
        ok1 = inject(datei, "'DEIN_EMAILJS_PUBLIC_KEY'",   f"'{ej.get('key','')}'")
        ok2 = inject(datei, "'nasch_emsdetten'",             f"'{ej.get('service','')}'")
        ok3 = inject(datei, "'stundenzettel_monatsende'",    f"'{ej.get('template','')}'")
        print(f"  {'✓' if ok1 else '✗'} Public Key")
        print(f"  {'✓' if ok2 else '✗'} Service ID")
        print(f"  {'✓' if ok3 else '✗'} Template ID")

    # ── Kalender ─────────────────────────────────────────────
    if 'calendar' in cfg:
        cal = cfg['calendar']
        print("\n[4/4] Kalender-Keys einbauen…")
        datei = os.path.join(basis, 'js', 'calendar-sync.js')
        if cal.get('googleClientId'):
            ok = inject(datei, "'DEIN_GOOGLE_CLIENT_ID.apps.googleusercontent.com'", f"'{cal['googleClientId']}'")
            print(f"  {'✓' if ok else '✗'} Google Client ID")
        if cal.get('googleApiKey'):
            ok = inject(datei, "'DEIN_GOOGLE_API_KEY'", f"'{cal['googleApiKey']}'")
            print(f"  {'✓' if ok else '✗'} Google API Key")
        if cal.get('azureClientId'):
            ok = inject(datei, "'DEINE_AZURE_APP_ID'", f"'{cal['azureClientId']}'")
            print(f"  {'✓' if ok else '✗'} Azure App ID")

    print("\n" + "="*40)
    print("✅ Fertig! Nächste Schritte:")
    print("  1. Diesen Ordner auf GitHub hochladen")
    print("  2. GitHub Pages aktivieren (Settings → Pages)")
    print("  3. App öffnen: https://nasch-emsdetten.github.io")
    print("  4. Browser-Konsole: await Firebase_Setup.initMitarbeiter()")
    print("  5. Mit PIN 1001 anmelden (Lee Ko)")

if __name__ == '__main__':
    main()
