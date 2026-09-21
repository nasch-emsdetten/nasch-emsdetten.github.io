// ── Wunschfrei / Urlaub ──────────────────────────────────────

function renderWunsch() {
  const user = AppState.currentUser;
  const isVZ = user.typ === 'VZ';
  const kontingent = isVZ ? 3 : user.typ === 'TZ' ? 2 : 1;

  // Demo-Anträge
  const antraege = [
    { id:1, datum:'Fr., 09.10.2026', schicht:'Nur Frühschicht', kw:'KW 41', status:'genehmigt' },
    { id:2, datum:'Sa., 20.09.2026', schicht:'Ganzer Tag',       kw:'KW 38', status:'genehmigt' },
    { id:3, datum:'So., 13.09.2026', schicht:'Ganzer Tag',       kw:'KW 37', status:'abgelehnt' },
  ];

  document.getElementById('pageWunsch').innerHTML = `
    <div class="banner banner-warn">
      <span class="banner-icon">⏰</span>
      <span>Abgabefrist: Fr., 02.10.2026 · gilt für KW 41–43</span>
    </div>

    <div class="stats-grid" style="margin-bottom:12px;">
      <div class="stat-card">
        <div class="stat-lbl">Wunschfrei / Zyklus</div>
        <div class="stat-val" style="font-size:22px;">${kontingent} von ${kontingent}</div>
      </div>
      <div class="stat-card">
        <div class="stat-lbl">Resturlaub</div>
        <div class="stat-val" style="font-size:22px;">${user.urlaubRest} Tage</div>
      </div>
    </div>

    <div class="section-hdr">Wunschfrei beantragen</div>
    <div class="card">
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px;">

        <div>
          <label class="field-label">Art</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:5px;" id="wunschArtBtns">
            <button class="art-btn active" data-art="wunschfrei" onclick="selectArt(this)">🏖 Wunschfrei</button>
            <button class="art-btn" data-art="urlaub" onclick="selectArt(this)">✈️ Urlaub</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label class="field-label">Von</label>
            <input type="date" id="wunschVon" class="field-input" min="${getTodayStr()}" style="margin-top:4px;">
          </div>
          <div>
            <label class="field-label">Bis (optional)</label>
            <input type="date" id="wunschBis" class="field-input" style="margin-top:4px;">
          </div>
        </div>

        <div id="schichtAuswahl">
          <label class="field-label">Schicht</label>
          <div style="display:flex;flex-direction:column;gap:5px;margin-top:5px;" id="schichtBtns">
            <button class="schicht-btn active" data-s="ganz" onclick="selectSchicht(this)">
              Ganzer Tag <span class="schicht-tag">1 Tag</span>
            </button>
            <button class="schicht-btn" data-s="frueh" onclick="selectSchicht(this)">
              Nur Frühschicht <span class="schicht-tag">½ Tag</span>
            </button>
            <button class="schicht-btn" data-s="spaet" onclick="selectSchicht(this)">
              Nur Spätschicht <span class="schicht-tag">½ Tag</span>
            </button>
          </div>
        </div>

        <div>
          <label class="field-label">Hinweis (optional)</label>
          <textarea id="wunschHinweis" class="field-input" rows="2"
            placeholder="z.B. Arzttermin..." style="resize:none;margin-top:4px;"></textarea>
        </div>

        <div class="login-err" id="wunschErr" style="color:#E24B4A;"></div>
        <div id="wunschOk" style="display:none;" class="banner banner-ok">
          <span class="banner-icon">✓</span>
          <span>Antrag gesendet – Lee Ko prüft und genehmigt.</span>
        </div>

        <button class="btn btn-primary" onclick="sendeWunsch()">Antrag stellen</button>
      </div>
    </div>

    <div class="section-hdr">Meine Anträge</div>
    <div class="card" style="overflow:hidden;">
      ${antraege.map(a => `
        <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border);">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">${a.datum}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${a.schicht} · ${a.kw}</div>
          </div>
          <span class="status-badge ${a.status}">${
            a.status === 'genehmigt' ? '✓ Genehmigt' :
            a.status === 'abgelehnt' ? '✗ Abgelehnt' : 'Offen'
          }</span>
        </div>
      `).join('')}
    </div>
  `;

  // Styles für diese Seite
  injectStyles('wunschStyles', `
    .field-label { font-size:12px;font-weight:500;color:var(--muted); }
    .field-input { width:100%;border:1px solid var(--border);border-radius:8px;
      padding:9px 12px;font-size:13px;background:var(--card);color:var(--text); }
    .art-btn { padding:10px;border-radius:8px;border:1.5px solid var(--border);
      background:var(--card);font-size:12px;font-weight:500;cursor:pointer; }
    .art-btn.active { border-color:var(--navy);background:#E6F1FB;color:var(--navy); }
    .schicht-btn { display:flex;justify-content:space-between;align-items:center;
      padding:10px 12px;border-radius:8px;border:1.5px solid var(--border);
      background:var(--card);font-size:13px;cursor:pointer; }
    .schicht-btn.active { border-color:var(--navy);background:#E6F1FB;color:var(--navy); }
    .schicht-tag { font-size:10px;font-weight:600;background:var(--warn);
      color:var(--warn-t);border-radius:4px;padding:2px 6px; }
    .status-badge { font-size:10px;font-weight:600;border-radius:4px;padding:3px 8px; }
    .status-badge.genehmigt { background:var(--success);color:var(--success-t); }
    .status-badge.abgelehnt { background:var(--danger);color:var(--danger-t); }
    .status-badge.offen     { background:var(--warn);color:var(--warn-t); }
  `);
}

function selectArt(btn) {
  document.querySelectorAll('.art-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Urlaub: keine Schicht-Auswahl nötig
  document.getElementById('schichtAuswahl').style.display =
    btn.dataset.art === 'urlaub' ? 'none' : 'block';
}

function selectSchicht(btn) {
  document.querySelectorAll('.schicht-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function sendeWunsch() {
  const von = document.getElementById('wunschVon').value;
  if(!von) {
    document.getElementById('wunschErr').textContent = 'Bitte ein Datum wählen.';
    return;
  }
  document.getElementById('wunschErr').textContent = '';
  document.getElementById('wunschOk').style.display = 'flex';
  setTimeout(() => document.getElementById('wunschOk').style.display = 'none', 3000);
}
