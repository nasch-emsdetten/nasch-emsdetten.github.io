// ── EmailJS + PDF Generator ──────────────────────────────────
// Stundenzettel automatisch als PDF per Mail ans Personal Büro
// Versand: 31. des Monats um 22:05 Uhr
// An: alswede@nasch.com · BCC: lee@nasch.com

const EmailService = {

  // ── Konfiguration ──────────────────────────────────────────
  EMAILJS_SERVICE_ID:   'nasch_emsdetten',
  EMAILJS_TEMPLATE_ID:  'stundenzettel_monatsende',
  EMAILJS_PUBLIC_KEY:   'DEIN_EMAILJS_PUBLIC_KEY',

  EMPFAENGER:   'alswede@nasch.com',
  BCC:          'lee@nasch.com',
  ABSENDER:     'noreply@nasch-emsdetten.github.io',
  FILIALE:      'Nasch Emsdetten',

  // ── EmailJS initialisieren ──────────────────────────────────
  init() {
    if(typeof emailjs !== 'undefined') {
      emailjs.init(this.EMAILJS_PUBLIC_KEY);
      console.log('EmailJS initialisiert ✓');
    } else {
      console.warn('EmailJS nicht geladen – bitte SDK einbinden');
    }
  },

  // ══════════════════════════════════════════════════════════
  //  MONATS-VERSAND (31. um 22:05 Uhr)
  // ══════════════════════════════════════════════════════════

  // ── Automatischen Versand einplanen ────────────────────────
  planeMonatsversand() {
    const jetzt = new Date();
    const letzterTag = new Date(jetzt.getFullYear(), jetzt.getMonth()+1, 0);

    // Versandzeitpunkt: 31. (oder letzter Tag) um 22:05 Uhr
    const versandZeit = new Date(letzterTag);
    versandZeit.setHours(22, 5, 0, 0);

    const msHin = versandZeit - jetzt;

    if(msHin > 0) {
      console.log(`Stundenzettel-Versand geplant für: ${versandZeit.toLocaleString('de-DE')}`);
      setTimeout(() => this.fuehreMonatsversandAus(), msHin);
    } else {
      // Bereits vorbei – nichts tun (nächsten Monat neu planen)
      console.log('Versandzeitpunkt bereits vorbei – nächsten Monat');
    }

    // Täglich um Mitternacht neu prüfen
    const bisNaechstesMitternacht = new Date();
    bisNaechstesMitternacht.setDate(bisNaechstesMitternacht.getDate()+1);
    bisNaechstesMitternacht.setHours(0,0,0,0);
    setTimeout(() => this.planeMonatsversand(), bisNaechstesMitternacht - jetzt);
  },

  // ── Monatsversand ausführen ─────────────────────────────────
  async fuehreMonatsversandAus() {
    const monat = new Date();
    monat.setDate(1); // Erster des aktuellen Monats
    const monatKey = `${monat.getFullYear()}-${String(monat.getMonth()+1).padStart(2,'0')}`;
    const monatLabel = monat.toLocaleString('de-DE', { month:'long', year:'numeric' });

    console.log(`Starte Versand Stundennachweise ${monatLabel}…`);

    try {
      // Alle Stundenzettel-Status aus Firestore laden
      const status = await window.FBData.getAlleStundenzettelStatus(monatKey);
      const alle = Object.values(USERS);

      const unterschrieben = alle.filter(u =>
        status.find(s => s.mitarbeiterId === u.id && s.unterschrieben)
      );
      const fehlend = alle.filter(u =>
        !status.find(s => s.mitarbeiterId === u.id && s.unterschrieben)
      );

      if(unterschrieben.length === 0) {
        console.warn('Keine Unterschriften vorhanden – kein Versand');
        return;
      }

      // Gesammelte PDF erstellen
      const pdfBase64 = await PDFGenerator.erstelleGesammeltePDF(
        unterschrieben.map(u => u.id),
        monatKey,
        status
      );

      // E-Mail senden
      await this.sendeMail({
        monatLabel,
        unterschrieben: unterschrieben.map(u => u.name),
        fehlend:        fehlend.map(u => u.name),
        pdfBase64,
        pdfName:        `Stundennachweise_${monatKey.replace('-','_')}.pdf`,
      });

      // Versand in Firestore vermerken
      for(const ma of unterschrieben) {
        await window.FBData.updateMitarbeiter(ma.id, {
          [`stundenzettel_${monatKey}_pdfVersendet`]: new Date().toISOString()
        });
      }

      console.log(`✅ Stundennachweise ${monatLabel} gesendet an ${this.EMPFAENGER}`);

    } catch(err) {
      console.error('Versand fehlgeschlagen:', err);
      // Retry nach 10 Minuten
      setTimeout(() => this.fuehreMonatsversandAus(), 10 * 60 * 1000);
    }
  },

  // ── Nachzügler-Versand (wenn Unterschrift nach 22:00 eingeht)
  async sendeNachzueglerMail(mitarbeiterId, monatKey) {
    const monat = new Date(monatKey + '-01');
    const monatLabel = monat.toLocaleString('de-DE', { month:'long', year:'numeric' });
    const ma = USERS[mitarbeiterId] || { name: mitarbeiterId };

    const status = await window.FBData.getAlleStundenzettelStatus(monatKey);
    const pdfBase64 = await PDFGenerator.erstelleEinzelPDF(mitarbeiterId, monatKey, status);

    await this.sendeMail({
      monatLabel,
      betreffZusatz: ` – Nachreichung ${ma.name}`,
      unterschrieben: [ma.name],
      fehlend: [],
      pdfBase64,
      pdfName: `Stundennachweis_${monatKey.replace('-','_')}_${ma.name.replace(' ','_')}.pdf`,
      istNachzuegler: true,
    });
    console.log(`Nachzügler-Mail für ${ma.name} gesendet`);
  },

  // ── E-Mail über EmailJS senden ──────────────────────────────
  async sendeMail({ monatLabel, betreffZusatz='', unterschrieben,
                    fehlend, pdfBase64, pdfName, istNachzuegler=false }) {

    const betreff = `Stundennachweise ${monatLabel}${betreffZusatz} – ${this.FILIALE}`;

    const unterschriebenListe = unterschrieben.join('\n• ');
    const fehlendListe = fehlend.length > 0
      ? `\n\nNoch ausstehend (${fehlend.length}):\n• ${fehlend.join('\n• ')}\n\nDiese werden nachgereicht sobald die Unterschrift vorliegt.`
      : '\n\nAlle Mitarbeiter haben unterschrieben ✓';

    const nachricht = istNachzuegler
      ? `Sehr geehrte Damen und Herren,\n\nanbei der nachgereichte Stundennachweis für ${unterschrieben[0]} (${monatLabel}).\n\nMit freundlichen Grüßen\n${this.FILIALE}`
      : `Sehr geehrte Damen und Herren,\n\nanbei alle Stundennachweise für ${monatLabel} (${this.FILIALE}).\n\nUnterschrieben (${unterschrieben.length}):\n• ${unterschriebenListe}${fehlendListe}\n\nAutomatisch generiert am ${new Date().toLocaleString('de-DE')}\n\nMit freundlichen Grüßen\n${this.FILIALE}`;

    const templateParams = {
      to_email:   this.EMPFAENGER,
      bcc_email:  this.BCC,
      from_name:  this.FILIALE,
      subject:    betreff,
      message:    nachricht,
      pdf_name:   pdfName,
      pdf_data:   pdfBase64,
      monat:      monatLabel,
      anzahl:     unterschrieben.length,
    };

    const result = await emailjs.send(
      this.EMAILJS_SERVICE_ID,
      this.EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('E-Mail gesendet:', result.status, result.text);
    return result;
  },

  // ── Erinnerungen planen ─────────────────────────────────────
  planeErinnerungen() {
    const jetzt = new Date();
    const letzterTag = new Date(jetzt.getFullYear(), jetzt.getMonth()+1, 0).getDate();

    // 5 Tage vorher, 2 Tage vorher, letzter Tag 12:00
    const erinnerungsTage = [letzterTag-5, letzterTag-2, letzterTag];
    const heute = jetzt.getDate();

    erinnerungsTage.forEach(tag => {
      if(tag < heute) return; // Bereits vorbei
      const ziel = new Date(jetzt.getFullYear(), jetzt.getMonth(), tag,
        tag === letzterTag ? 12 : 9, 0, 0, 0);
      const ms = ziel - jetzt;
      if(ms > 0) {
        setTimeout(() => this._sendeErinnerungNotification(tag, letzterTag), ms);
      }
    });
  },

  async _sendeErinnerungNotification(tag, letzterTag) {
    const restTage = letzterTag - tag;
    const titel = restTage === 0
      ? 'Stundenzettel heute bis 22:00 Uhr unterschreiben!'
      : `Stundenzettel in ${restTage} Tag${restTage!==1?'en':''} fällig`;
    const text = `Bitte Stundenzettel bis zum ${letzterTag}. des Monats um 22:00 Uhr unterschreiben. Danach wird der Wochenplan gesperrt.`;

    // Alle Mitarbeiter ohne Unterschrift benachrichtigen
    const monat = new Date();
    const monatKey = `${monat.getFullYear()}-${String(monat.getMonth()+1).padStart(2,'0')}`;
    const status = await window.FBData?.getAlleStundenzettelStatus(monatKey) || [];

    for(const [uid] of Object.entries(USERS)) {
      const hatUnterschrieben = status.find(s => s.mitarbeiterId === uid && s.unterschrieben);
      if(!hatUnterschrieben) {
        await window.FBData?.sendeNotification(uid, 'stundenzettel', titel, text);
      }
    }
    console.log(`Erinnerung gesendet: "${titel}"`);
  },

  // ── Wochenplan-Sperre um 22:00 Uhr prüfen ──────────────────
  pruefeSperre() {
    const jetzt = new Date();
    const letzterTag = new Date(jetzt.getFullYear(), jetzt.getMonth()+1, 0);
    const sperreZeit = new Date(letzterTag);
    sperreZeit.setHours(22, 0, 0, 0);

    if(jetzt >= sperreZeit && jetzt.getMonth() === letzterTag.getMonth()) {
      // Prüfen ob dieser Mitarbeiter unterschrieben hat
      const uid = sessionStorage.getItem('nasch_uid');
      if(!uid) return false;
      const monatKey = `${jetzt.getFullYear()}-${String(jetzt.getMonth()+1).padStart(2,'0')}`;
      // Gibt true zurück wenn gesperrt werden soll
      // (wird in pages.js beim Öffnen des Wochenplans geprüft)
      return true;
    }
    return false;
  },
};

window.EmailService = EmailService;
