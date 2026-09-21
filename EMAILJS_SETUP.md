# EmailJS Einrichtung – Stundenzettel-Versand

## Schritt 1: EmailJS Konto erstellen

1. Gehe zu: https://www.emailjs.com
2. Klicke "Sign Up" → kostenlos
3. Bestätige deine E-Mail

**Kostenlos bis: 200 E-Mails/Monat** → für 15 Mitarbeiter = 15 Mails/Monat ✅

---

## Schritt 2: E-Mail-Dienst verbinden

1. Dashboard → "Email Services" → "Add New Service"
2. **Gmail** wählen (oder Outlook)
3. Mit `lee@nasch.com` einloggen (oder nasch.emsdetten@gmail.com)
4. Klicke "Connect Account"
5. Service-Name: **nasch_emsdetten**
6. Klicke "Create Service"
7. **Service ID kopieren** → in `js/email-service.js` eintragen

---

## Schritt 3: E-Mail-Template erstellen

1. Dashboard → "Email Templates" → "Create New Template"
2. Template-Name: **Stundennachweise Monatsende**

**Template-Inhalt:**

```
Betreff: {{subject}}

Von: Nasch Emsdetten <noreply@nasch-emsdetten.github.io>
An: {{to_email}}
BCC: {{bcc_email}}

{{message}}

---
Diese E-Mail wurde automatisch von der Nasch Emsdetten Mitarbeiter-App generiert.
```

3. Template speichern
4. **Template ID kopieren** → in `js/email-service.js` eintragen

---

## Schritt 4: Public Key kopieren

1. Dashboard → "Account" → "General"
2. **Public Key kopieren**
3. In `js/email-service.js` eintragen:

```javascript
EMAILJS_PUBLIC_KEY: 'dein-public-key',
```

---

## Schritt 5: PDF-Anhang einrichten

EmailJS unterstützt Anhänge über das Template:

1. Im Template-Editor: "Add Dynamic Variable"
2. Variable: `pdf_data` (Base64 PDF)
3. Variable: `pdf_name` (Dateiname)

> **Hinweis:** PDF-Anhänge sind im kostenlosen Plan verfügbar.
> Bei Problemen: PDF-Link statt Anhang senden.

---

## Alternativlösung: Google Apps Script (komplett kostenlos)

Falls EmailJS Limits erreicht werden → Google Apps Script:

```javascript
// In Google Apps Script (script.google.com)
function sendeMail(empfaenger, betreff, text, pdfBase64) {
  const blob = Utilities.newBlob(
    Utilities.base64Decode(pdfBase64),
    'application/pdf',
    'Stundennachweise.pdf'
  );
  GmailApp.sendEmail(empfaenger, betreff, text, {
    attachments: [blob],
    bcc: 'lee@nasch.com'
  });
}
```

→ Als Web App deployen → URL in `email-service.js` eintragen

---

## Fertige Konfiguration (in `js/email-service.js`)

```javascript
EMAILJS_SERVICE_ID:   'nasch_emsdetten',    // aus Schritt 2
EMAILJS_TEMPLATE_ID:  'template_xxxx',       // aus Schritt 3
EMAILJS_PUBLIC_KEY:   'xxxxxxxxxxxx',        // aus Schritt 4

EMPFAENGER:   'alswede@nasch.com',           // Personal Büro
BCC:          'lee@nasch.com',               // Nur zur Kontrolle
FILIALE:      'Nasch Emsdetten',
```

---

## Was passiert automatisch

| Zeitpunkt | Aktion |
|---|---|
| **26. des Monats** | 1. Erinnerung an alle ohne Unterschrift |
| **29. des Monats** | 2. Erinnerung |
| **31. · 12:00 Uhr** | Letzte Warnung "Heute bis 22:00" |
| **31. · 22:00 Uhr** | Wochenplan-Sperre aktiv |
| **31. · 22:05 Uhr** | PDF-Versand an Personal Büro |
| **Nach Unterschrift** | Nachzügler-Mail (sofort) |
