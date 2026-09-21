// ── PDF Generator ────────────────────────────────────────────
// Erstellt professionelle Stundennachweise als PDF
// Nutzt jsPDF (kostenlos, Open Source)
// CDN: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js

const PDFGenerator = {

  // ── Gesammelte PDF aller Mitarbeiter ────────────────────────
  async erstelleGesammeltePDF(mitarbeiterIds, monatKey, statusData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    let ersteSeite = true;

    for(const uid of mitarbeiterIds) {
      if(!ersteSeite) doc.addPage();
      await this._fuegeMitarbeiterSeiteEin(doc, uid, monatKey, statusData);
      ersteSeite = false;
    }

    return doc.output('datauristring').split(',')[1]; // Base64
  },

  // ── Einzelne PDF ─────────────────────────────────────────────
  async erstelleEinzelPDF(uid, monatKey, statusData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    await this._fuegeMitarbeiterSeiteEin(doc, uid, monatKey, statusData);
    return doc.output('datauristring').split(',')[1];
  },

  // ── Eine Mitarbeiter-Seite erzeugen ─────────────────────────
  async _fuegeMitarbeiterSeiteEin(doc, uid, monatKey, statusData) {
    const user = USERS[uid];
    if(!user) return;

    const monat = new Date(monatKey + '-01');
    const monatLabel = monat.toLocaleString('de-DE', { month:'long', year:'numeric' });
    const status = statusData.find(s => s.mitarbeiterId === uid);

    // ── Seitenmaße ──────────────────────────────────────────
    const sW = 210, sH = 297;
    const rL = 15, rR = 195, rO = 15;
    let y = rO;

    // ── KOPFZEILE ────────────────────────────────────────────
    // Logo-Bereich (dunkelblau)
    doc.setFillColor(30, 58, 95);
    doc.rect(rL, y, sW - rL*2, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STUNDENNACHWEIS', rL + 4, y + 7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monatLabel}`, rR - 4, y + 7, { align:'right' });
    doc.setFontSize(9);
    doc.text('Nasch Emsdetten · NRW', rL + 4, y + 13);
    y += 22;

    // ── MITARBEITER-INFOS ────────────────────────────────────
    doc.setTextColor(26, 26, 46);
    doc.setFillColor(244, 246, 249);
    doc.rect(rL, y, sW - rL*2, 20, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', rL + 4, y + 6);
    doc.text('Beschäftigung:', rL + 80, y + 6);
    doc.text('Stundenlohn:', rL + 130, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(user.name, rL + 4, y + 13);
    doc.text(user.typ === 'VZ' ? 'Vollzeit' : user.typ === 'TZ' ? 'Teilzeit' : 'Aushilfe',
      rL + 80, y + 13);
    doc.text(user.stundenlohn ? `${user.stundenlohn.toFixed(2)} €` : '–', rL + 130, y + 13);
    y += 24;

    // ── STUNDEN-TABELLE ──────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    // Tabellenkopf
    const cols = { tag:rL, wt:rL+12, von:rL+22, bis:rL+52, pause:rL+82,
                   gesamt:rL+110, nacht:rL+140, ft:rL+162 };
    const headerY = y;
    doc.setFillColor(30, 58, 95);
    doc.rect(rL, y, sW - rL*2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Tag',     cols.tag+1,    y+5.5);
    doc.text('WT',      cols.wt+1,     y+5.5);
    doc.text('Von',     cols.von+1,    y+5.5);
    doc.text('Bis',     cols.bis+1,    y+5.5);
    doc.text('Pause',   cols.pause+1,  y+5.5);
    doc.text('Gesamt',  cols.gesamt+1, y+5.5);
    doc.text('Nacht25%',cols.nacht+1,  y+5.5);
    doc.text('So/FT50%',cols.ft+1,     y+5.5);
    y += 8;

    // Kalender-Zeilen
    const letzterTag = new Date(monat.getFullYear(), monat.getMonth()+1, 0).getDate();
    const WOCHENTAGE = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    const FEIERTAGE_NRW = this._getFeiertageNRW(monat.getFullYear());

    let gesamtStunden = 0;
    let gesamtNacht = 0;
    let gesamtSoFT = 0;
    doc.setTextColor(26, 26, 46);

    for(let tag = 1; tag <= letzterTag; tag++) {
      const datum = new Date(monat.getFullYear(), monat.getMonth(), tag);
      const wt = WOCHENTAGE[datum.getDay()];
      const istSonntag = datum.getDay() === 0;
      const istFeiertag = FEIERTAGE_NRW.some(f => f.toDateString() === datum.toDateString());
      const istWochenende = datum.getDay() === 0 || datum.getDay() === 6;
      const zeilenH = 6.5;

      // Zeilenfarbe
      if(istSonntag || istFeiertag) {
        doc.setFillColor(255, 242, 204); // Gelb
        doc.rect(rL, y, sW - rL*2, zeilenH, 'F');
      } else if(tag % 2 === 0) {
        doc.setFillColor(250, 251, 252);
        doc.rect(rL, y, sW - rL*2, zeilenH, 'F');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', tag===1||istSonntag||istFeiertag?'bold':'normal');
      doc.text(String(tag).padStart(2,'0'), cols.tag+1, y+4.5);
      doc.text(wt, cols.wt+1, y+4.5);

      // Stundendaten aus Firebase (oder leer lassen)
      const schicht = status?.schichten?.[tag] || null;
      if(schicht && schicht.von && schicht.bis) {
        doc.setFont('helvetica', 'normal');
        doc.text(schicht.von,   cols.von+1,    y+4.5);
        doc.text(schicht.bis,   cols.bis+1,    y+4.5);
        doc.text(schicht.pause||'–', cols.pause+1, y+4.5);

        // Stunden berechnen
        const std = this._berechneStunden(schicht.von, schicht.bis, schicht.pause);
        const nacht = this._berechneNacht(schicht.von, schicht.bis);
        const soFT = (istSonntag || istFeiertag) ? std : 0;

        if(std > 0) { doc.text(std.toFixed(2), cols.gesamt+1, y+4.5); gesamtStunden += std; }
        if(nacht > 0) { doc.text(nacht.toFixed(2), cols.nacht+1, y+4.5); gesamtNacht += nacht; }
        if(soFT > 0) { doc.text(soFT.toFixed(2), cols.ft+1, y+4.5); gesamtSoFT += soFT; }
      }

      // Rahmen
      doc.setDrawColor(220, 220, 220);
      doc.rect(rL, y, sW - rL*2, zeilenH, 'S');
      y += zeilenH;
    }

    // ── SUMMENZEILE ──────────────────────────────────────────
    y += 2;
    doc.setFillColor(30, 58, 95);
    doc.rect(rL, y, sW - rL*2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Gesamt',              cols.von+1,    y+5.5);
    doc.text(gesamtStunden.toFixed(2),cols.gesamt+1, y+5.5);
    doc.text(gesamtNacht.toFixed(2),  cols.nacht+1,  y+5.5);
    doc.text(gesamtSoFT.toFixed(2),   cols.ft+1,     y+5.5);
    y += 12;

    // ── SOLL / IST ───────────────────────────────────────────
    doc.setTextColor(26, 26, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const sollStd = user.sollStundenMonat || 0;
    const diffStd = gesamtStunden - sollStd;
    doc.text(`Stunden IST:  ${gesamtStunden.toFixed(2)} h`,  rL + 4, y);
    doc.text(`Stunden SOLL: ${sollStd > 0 ? sollStd+' h' : '–'}`, rL + 70, y);
    doc.text(`Differenz: ${diffStd >= 0 ? '+' : ''}${diffStd.toFixed(2)} h`, rL + 140, y);
    y += 12;

    // ── UNTERSCHRIFT ─────────────────────────────────────────
    doc.setDrawColor(180, 180, 180);
    doc.line(rL,    y+15, rL+75, y+15);  // Mitarbeiter
    doc.line(rL+95, y+15, rL+170, y+15); // Filialleiterin

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Unterschrift Mitarbeiter', rL+4, y+20);
    doc.text('Unterschrift Filialleiterin', rL+99, y+20);

    // Digitale Unterschrift einfügen (falls vorhanden)
    if(status?.unterschriftBild) {
      try {
        doc.addImage(status.unterschriftBild, 'PNG', rL, y, 75, 15);
      } catch(e) { console.warn('Unterschrift-Bild konnte nicht eingefügt werden'); }
    }

    // Datum der Unterschrift
    if(status?.unterschriftAm) {
      const datum = new Date(status.unterschriftAm).toLocaleDateString('de-DE');
      const zeit  = new Date(status.unterschriftAm).toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'});
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Digital signiert: ${datum} · ${zeit} Uhr`, rL+4, y+25);
    }
  },

  // ── Lokal drucken / speichern ────────────────────────────────
  async drucken(uid, monatKey, statusData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const status = statusData || await window.FBData?.getAlleStundenzettelStatus(monatKey) || [];
    await this._fuegeMitarbeiterSeiteEin(doc, uid, monatKey, status);
    const user = USERS[uid];
    const monat = new Date(monatKey + '-01');
    const monatLabel = `${monat.getFullYear()}_${String(monat.getMonth()+1).padStart(2,'0')}`;
    doc.save(`Stundennachweis_${monatLabel}_${user?.name?.replace(' ','_')}.pdf`);
  },

  // ── Hilfsfunktionen ─────────────────────────────────────────
  _berechneStunden(von, bis, pause='') {
    try {
      const [vH, vM] = von.split(':').map(Number);
      const [bH, bM] = bis.split(':').map(Number);
      let min = (bH*60+bM) - (vH*60+vM);
      if(pause) {
        const [pH, pM] = pause.split(':').map(Number);
        min -= pH*60+pM;
      }
      return Math.max(0, min/60);
    } catch { return 0; }
  },

  _berechneNacht(von, bis) {
    try {
      const [bH, bM] = bis.split(':').map(Number);
      const bisMin = bH*60+bM;
      const grenze = 20*60; // 20:00 Uhr
      if(bisMin <= grenze) return 0;
      const nachtMin = bisMin - grenze;
      return Math.max(0, nachtMin/60);
    } catch { return 0; }
  },

  _getFeiertageNRW(jahr) {
    // Gaußsche Osterformel
    function ostern(j) {
      const a=j%19,b=Math.floor(j/100),c=j%100,d=Math.floor(b/4),e=b%4;
      const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
      const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
      const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
      const mo=Math.floor((h+l-7*m+114)/31),ta=((h+l-7*m+114)%31)+1;
      return new Date(j,mo-1,ta);
    }
    const o = ostern(jahr);
    const add = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
    return [
      new Date(jahr,0,1), add(o,-2), add(o,1), new Date(jahr,4,1),
      add(o,39), add(o,50), add(o,60),
      new Date(jahr,9,3), new Date(jahr,10,1),
      new Date(jahr,11,25), new Date(jahr,11,26),
    ];
  },
};

window.PDFGenerator = PDFGenerator;
