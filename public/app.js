/* Kotten och kompassen – sväng och gå framåt till nöten.
   Stegvisa instruktioner med symboler (Lgr22 MA.1-3.2.4).
   Ingen text i spelet: mål = glödande nöt, nästa instruktion = pulserande knapp. */
(function () {
  'use strict';

  var COLS = 5, ROWS = 4;
  var RIKT = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 0 upp, 1 höger, 2 ner, 3 vänster

  var duk = document.getElementById('duk');
  var ctx = duk.getContext('2d');
  var brada = document.getElementById('brada');
  var spelEl = document.getElementById('spel');
  var startEl = document.getElementById('startskarm');
  var overlay = document.getElementById('overlay');
  var nivaEl = document.getElementById('niva');
  var malEl = document.getElementById('mal');
  var ljudKnapp = document.getElementById('ljud');

  var knappar = {
    V: document.getElementById('vanster'),
    F: document.getElementById('fram'),
    H: document.getElementById('hoger')
  };

  var S = null;
  var anim = { px: 0, py: 0, ang: 0, skak: 0 };
  var s = 60, ox = 0, oy = 0, bredd = 1, hojd = 1, dpr = 1;
  var ljudPa = true;
  var ljudkontext = null;
  var hintTimer = null;
  var senasteTryck = 0;
  var puls = 0;
  var startad = false;

  // ---------------- nivådata ----------------
  function nivaData(n) {
    return NIVAER[Math.min(n, NIVAER.length - 1)];
  }

  function nyttLage(n) {
    var d = nivaData(n);
    S = {
      niva: n,
      x: d.start.x, y: d.start.y, dir: d.start.dir,
      notter: d.notter.map(function (p) { return { x: p[0], y: p[1], tagen: false }; }),
      stubbar: (d.stubbar || []).map(function (p) { return { x: p[0], y: p[1] }; }),
      klar: false, steg: 0, bump: 0
    };
    anim.px = S.x; anim.py = S.y; anim.ang = S.dir * Math.PI / 2; anim.skak = 0;
    senasteTryck = performance.now();
    // startnöten räknas om Kotten står på den
    markeraNot();
    ritaHud();
    gomHint();
    if (startad) {
      setTimeout(function () { visaHint(900); }, 1200);
      saga('Sväng och gå framåt till nöten.');
    }
  }

  function rutaUpptagen(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
    return S.stubbar.some(function (b) { return b.x === x && b.y === y; });
  }

  function markeraNot() {
    var andrad = false;
    S.notter.forEach(function (m) {
      if (!m.tagen && m.x === S.x && m.y === S.y) { m.tagen = true; andrad = true; }
    });
    if (andrad) {
      blipp(660, 0.09);
      setTimeout(function () { blipp(880, 0.11); }, 90);
      saga('Nöt!');
      ritaHud();
    }
  }

  function kvarAvNotter() {
    return S.notter.filter(function (m) { return !m.tagen; }).length;
  }

  // ---------------- lösare (BFS) ----------------
  function losa(lage) {
    var notter = lage.notter;
    var startMask = 0;
    for (var i = 0; i < notter.length; i++) {
      if (notter[i].tagen || (notter[i].x === lage.x && notter[i].y === lage.y)) startMask |= (1 << i);
    }
    var full = (1 << notter.length) - 1;
    if (startMask === full) return [];
    var ko = [{ x: lage.x, y: lage.y, dir: lage.dir, mask: startMask }];
    var sedd = {}; sedd[lage.x + ',' + lage.y + ',' + lage.dir + ',' + startMask] = null;
    var mal = null, malNyckel = null;
    var steg = 0;
    while (ko.length && steg < 20000) {
      var nasta = [];
      for (var k = 0; k < ko.length; k++) {
        var u = ko[k]; steg++;
        var alt = [
          { a: 'V', x: u.x, y: u.y, dir: (u.dir + 3) % 4, mask: u.mask },
          { a: 'H', x: u.x, y: u.y, dir: (u.dir + 1) % 4, mask: u.mask }
        ];
        var nx = u.x + RIKT[u.dir][0], ny = u.y + RIKT[u.dir][1];
        if (!rutaUpptagen(nx, ny)) {
          var m = u.mask;
          for (var j = 0; j < notter.length; j++) {
            if (notter[j].x === nx && notter[j].y === ny) m |= (1 << j);
          }
          alt.push({ a: 'F', x: nx, y: ny, dir: u.dir, mask: m });
        }
        for (var q = 0; q < alt.length; q++) {
          var v = alt[q];
          var nyckel = v.x + ',' + v.y + ',' + v.dir + ',' + v.mask;
          if (nyckel in sedd) continue;
          sedd[nyckel] = { fran: u.x + ',' + u.y + ',' + u.dir + ',' + u.mask, a: v.a };
          if (v.mask === full) { mal = v; malNyckel = nyckel; break; }
          nasta.push(v);
        }
        if (mal) break;
      }
      if (mal) break;
      ko = nasta;
    }
    if (!mal) return null;
    var vag = [], nk = malNyckel;
    while (sedd[nk]) { vag.unshift(sedd[nk].a); nk = sedd[nk].fran; }
    return vag;
  }

  // ---------------- handling ----------------
  function utfor(handling) {
    if (!S || S.klar || !overlay.hidden) return;
    gomHint();
    senasteTryck = performance.now();
    if (handling === 'V' || handling === 'H') {
      S.dir = (S.dir + (handling === 'V' ? 3 : 1)) % 4;
      S.steg++;
      blipp(420, 0.05, 'triangle');
      anim.ang = anim.ang; // animeras mot nytt mål i update()
      ritaHud();
    } else if (handling === 'F') {
      var nx = S.x + RIKT[S.dir][0], ny = S.y + RIKT[S.dir][1];
      if (rutaUpptagen(nx, ny)) {
        anim.skak = 220; S.bump++;
        blipp(150, 0.12, 'sine');
        if (S.bump === 3) visaHint(0);
        return;
      }
      S.x = nx; S.y = ny; S.steg++;
      S.bump = 0;
      blipp(520, 0.05, 'sine');
      markeraNot();
      if (kvarAvNotter() === 0) {
        S.klar = true;
        setTimeout(nivaKlar, 320);
      }
    }
  }

  function nivaKlar() {
    var sista = S.niva >= NIVAER.length - 1;
    blipp(700, 0.1); setTimeout(function () { blipp(880, 0.1); }, 110);
    setTimeout(function () { blipp(1050, 0.16); }, 220);
    saga(sista ? 'Alla nivåer klara! Vad duktig du är.' : 'Bra! Nästa.');
    window.skolappar && window.skolappar.event && window.skolappar.event('level', S.niva + 1);
    ritaHud();
    visaOverlay(sista);
  }

  // ---------------- spelöverlägg ----------------
  function visaOverlay(sista) {
    var st = document.getElementById('ov-stjarnor');
    st.innerHTML = '';
    var antal = sista ? NIVAER.length : S.niva + 1;
    for (var i = 0; i < antal; i++) st.appendChild(document.createElement('i'));
    document.getElementById('ov-titel').textContent = sista ? 'Alla nivåer klara!' : 'Nivå ' + (S.niva + 1) + ' klar';
    var nasta = document.getElementById('ov-nasta');
    nasta.textContent = sista ? 'Spela igen' : 'Nästa';
    overlay.hidden = false;
    window.skolappar && window.skolappar.event && window.skolappar.event('round_done', 100);
  }

  document.getElementById('ov-nasta').addEventListener('click', function () {
    overlay.hidden = true;
    var sista = S.niva >= NIVAER.length - 1;
    nyttLage(sista ? 0 : S.niva + 1);
    window.skolappar && window.skolappar.event && window.skolappar.event('round_start');
  });

  // ---------------- HUD ----------------
  function ritaHud() {
    nivaEl.innerHTML = '';
    for (var i = 0; i < NIVAER.length; i++) {
      var d = document.createElement('i');
      if (i < S.niva) d.className = 'klar';
      nivaEl.appendChild(d);
    }
    malEl.innerHTML = '';
    S.notter.forEach(function (m) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 32 32');
      svg.setAttribute('class', 'not' + (m.tagen ? ' tagen' : ''));
      svg.innerHTML = '<path d="M16 5c5 0 9 3 9 7v13c0 1.6-1.4 2-2.6 1L16 21l-6.4 5c-1.2 1-2.6.6-2.6-1V12c0-4 4-7 9-7z" fill="#b87c1f"/>' +
        '<path d="M7 11c0-3.3 4-6 9-6s9 2.7 9 6z" fill="#8a5a3b"/>' +
        '<circle cx="16" cy="4.4" r="1.8" fill="#6f4526"/>';
      malEl.appendChild(svg);
    });
    malEl.setAttribute('aria-label', kvarAvNotter() + ' nötter kvar');
  }

  // ---------------- ljud och tal ----------------
  function ljud() {
    if (!ljudkontext) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ljudkontext = new AC(); } catch (e) { return null; }
    }
    if (ljudkontext.state === 'suspended') ljudkontext.resume();
    return ljudkontext;
  }

  function blipp(frek, tid, typ) {
    if (!ljudPa) return;
    var ac = ljud();
    if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = typ || 'sine';
      o.frequency.value = frek;
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + tid);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + tid + 0.02);
    } catch (e) {}
  }

  function saga(text) {
    if (!ljudPa) return;
          try { if (window.__rost && window.__rost(text, true)) return; } catch (e) { }
        console.warn('saknar mp3:', text);
  }

  function ritaLjudikon() {
    var ikon = document.getElementById('ljudikon');
    ikon.innerHTML = ljudPa
      ? '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4.5 4.5 0 0 1 0 6"/><path d="M18.6 6.4a8 8 0 0 1 0 11.2"/>'
      : '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 10l5 4M21 10l-5 4"/>';
  }

  ljudKnapp.addEventListener('click', function () {
    ljudPa = !ljudPa;
    if (!ljudPa) { window.__rostStopp(); }
    ritaLjudikon();
    if (!ljudPa) window.skolappar && window.skolappar.event && window.skolappar.event('sound_off');
  });

  // ---------------- hint ----------------
  function visaHint(forsening) {
    if (!S || S.klar) return;
    var vag = losa(S);
    if (!vag || !vag.length) return;
    var knapp = knappar[vag[0]];
    if (!knapp) return;
    knapp.classList.add('andar');
    if (forsening) {
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { if (performance.now() - senasteTryck > forsening) visaHint(0); }, forsening);
    } else {
      window.skolappar && window.skolappar.event && window.skolappar.event('hint');
    }
  }

  function gomHint() {
    clearTimeout(hintTimer);
    ['V', 'F', 'H'].forEach(function (k) { knappar[k].classList.remove('andar'); });
  }

  // ---------------- ritning ----------------
  function resize() {
    var r = brada.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    s = Math.floor(Math.min(w / COLS, h / ROWS));
    s = Math.max(s, 40);
    bredd = s * COLS; hojd = s * ROWS;
    ox = Math.round((w - bredd) / 2);
    oy = Math.round((h - hojd) / 2);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    duk.width = Math.round(bredd * dpr);
    duk.height = Math.round(hojd * dpr);
    duk.style.width = bredd + 'px';
    duk.style.height = hojd + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rundaRekt(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ritaBrada() {
    ctx.clearRect(0, 0, bredd, hojd);
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var px = x * s + 2, py = y * s + 2, w = s - 4;
        ctx.fillStyle = '#efe9dd';
        rundaRekt(px, py, w, w, Math.round(s * 0.14));
        ctx.fill();
        ctx.strokeStyle = '#e4dccc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function ritaStubbe(mx, my) {
    var r = s * 0.3;
    ctx.save();
    ctx.translate(mx, my + s * 0.05);
    ctx.fillStyle = '#9a6a44';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c08a5c';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.22, r * 0.86, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9a6a44'; ctx.lineWidth = Math.max(1.5, s * 0.03);
    for (var k = 1; k <= 2; k++) {
      ctx.beginPath(); ctx.ellipse(0, -r * 0.22, r * 0.86 * k / 2.6, r * 0.6 * k / 2.6, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function ritaNot(mx, my, glod) {
    var r = s * 0.2;
    if (glod > 0.01) {
      var g = ctx.createRadialGradient(mx, my, r * 0.2, mx, my, r * (2.2 + glod * 0.5));
      g.addColorStop(0, 'rgba(224,161,58,' + (0.35 * glod) + ')');
      g.addColorStop(1, 'rgba(224,161,58,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mx, my, r * (2.2 + glod * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    var skala = 1 + glod * 0.06;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(skala, skala);
    ctx.fillStyle = '#c98d33';
    ctx.beginPath();
    ctx.moveTo(0, r * 1.15);
    ctx.bezierCurveTo(-r, r * 0.5, -r * 0.9, -r * 0.5, 0, -r * 0.55);
    ctx.bezierCurveTo(r * 0.9, -r * 0.5, r, r * 0.5, 0, r * 1.15);
    ctx.fill();
    ctx.fillStyle = '#8a5a3b';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 1.08, r * 0.55, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#6f4526';
    ctx.fillRect(-r * 0.08, -r * 1.25, r * 0.16, r * 0.42);
    ctx.restore();
  }

  function ritaKotten(cx, cy, ang) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // skugga
    ctx.fillStyle = 'rgba(90,70,50,.12)';
    ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.34, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    // släde: en tydlig pil under fötterna
    var L = s * 0.42, B = s * 0.26;
    ctx.fillStyle = '#5b8fa8';
    ctx.strokeStyle = '#3f6d84';
    ctx.lineWidth = Math.max(1.5, s * 0.022);
    ctx.beginPath();
    ctx.moveTo(0, -L);
    ctx.lineTo(B, -L * 0.18);
    ctx.lineTo(B * 0.42, -L * 0.18);
    ctx.lineTo(B * 0.42, L * 0.78);
    ctx.lineTo(-B * 0.42, L * 0.78);
    ctx.lineTo(-B * 0.42, -L * 0.18);
    ctx.lineTo(-B, -L * 0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // kroppen: kotten
    var rx = s * 0.25, ry = s * 0.27;
    ctx.fillStyle = '#8a5a3b';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.02, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    // fjäll
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = Math.max(1, s * 0.014);
    for (var rad = -2; rad <= 2; rad++) {
      var yy = -s * 0.02 + rad * ry * 0.34;
      var half = Math.sqrt(Math.max(0, 1 - Math.pow(rad * 0.34, 2))) * rx;
      for (var k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(k * half * 0.5, yy, half * 0.26, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();
      }
    }
    // ansikte
    var fy = -ry * 0.28;
    ctx.fillStyle = '#c89a6d';
    ctx.beginPath(); ctx.ellipse(0, fy, rx * 0.72, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    // ögon
    var eo = rx * 0.32, er = rx * 0.2;
    [-1, 1].forEach(function (sid) {
      ctx.fillStyle = '#fffaf2';
      ctx.beginPath(); ctx.arc(sid * eo, fy - ry * 0.1, er, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f231a';
      ctx.beginPath(); ctx.arc(sid * eo, fy - ry * 0.16, er * 0.52, 0, Math.PI * 2); ctx.fill();
    });
    // leende
    ctx.strokeStyle = '#6f4526';
    ctx.lineWidth = Math.max(1.4, s * 0.02);
    ctx.beginPath(); ctx.arc(0, fy + ry * 0.14, rx * 0.24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // liten tofs
    ctx.fillStyle = '#6f4526';
    ctx.beginPath(); ctx.ellipse(0, -ry * 1.02, rx * 0.16, ry * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function rita() {
    if (!S) return;
    ritaBrada();
    var gl = 0.55 + 0.45 * Math.sin(puls / 420);
    S.stubbar.forEach(function (b) { ritaStubbe(b.x * s + s / 2, b.y * s + s / 2); });
    S.notter.forEach(function (m) {
      if (!m.tagen) ritaNot(m.x * s + s / 2, m.y * s + s / 2, gl);
    });
    var sx = 0;
    if (anim.skak > 0) {
      var f = anim.skak / 220;
      sx = Math.sin(anim.skak / 14) * s * 0.06 * f;
    }
    // vägen Kotten gått
    ctx.fillStyle = 'rgba(224,161,58,.16)';
    ctx.beginPath();
    ctx.arc(anim.px * s + s / 2, anim.py * s + s / 2, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ritaKotten(anim.px * s + s / 2 + sx, anim.py * s + s / 2, anim.ang);
  }

  // ---------------- animation ----------------
  var forra = performance.now();

  function uppdatera(dt) {
    if (!S) return;
    puls += dt;
    var k = 1 - Math.exp(-dt / 55);
    anim.px += (S.x - anim.px) * k;
    anim.py += (S.y - anim.py) * k;
    // rotera kortaste vägen
    var mal = S.dir * Math.PI / 2;
    var d = mal - anim.ang;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) < 0.004) anim.ang = mal; else anim.ang += d * (1 - Math.exp(-dt / 48));
    if (anim.skak > 0) anim.skak = Math.max(0, anim.skak - dt);
  }

  function ram(nu) {
    var dt = Math.min(120, nu - forra);
    forra = nu;
    uppdatera(dt);
    rita();
    requestAnimationFrame(ram);
  }

  // vakt: om webbläsaren slutar leverera frames (fliken i bakgrunden, förhandsvisning)
  setInterval(function () {
    if (document.hidden) return;
    var nu = performance.now();
    // barnet har stått stilla länge: visa nästa instruktion igen
    if (S && !S.klar && overlay.hidden && !spelEl.hidden && nu - senasteTryck > 9000 &&
        !knappar.V.classList.contains('andar') && !knappar.H.classList.contains('andar') && !knappar.F.classList.contains('andar')) {
      visaHint(0);
    }
    if (nu - forra > 320) {
      uppdatera(Math.min(320, nu - forra));
      forra = nu;
      rita();
    }
  }, 100);

  // ---------------- start ----------------
  function starta() {
    ljud();
    startEl.hidden = true;
    spelEl.hidden = false;
    resize();
    startad = true;
    nyttLage(0);
    window.skolappar && window.skolappar.event && window.skolappar.event('round_start');
    saga('Sväng och gå framåt till nöten.');
  }

  document.getElementById('spela').addEventListener('click', starta);
  document.getElementById('spela').addEventListener('pointerup', function (e) { if (startEl.hidden) return; });

  ['V', 'F', 'H'].forEach(function (k) {
    knappar[k].addEventListener('pointerdown', function (e) {
      e.preventDefault();
      utfor(k);
    });
    knappar[k].addEventListener('click', function (e) {
      // tangentbord/skärmläsare: pointerdown har redan hanterat musen
      if (e.detail === 0) utfor(k);
    });
  });

  window.addEventListener('keydown', function (e) {
    if (startEl.hidden === false) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); starta(); } return; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); utfor('V'); }
    else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); utfor('H'); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); utfor('F'); }
  });

  window.addEventListener('resize', function () { if (!spelEl.hidden) resize(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { if (!spelEl.hidden) resize(); }, 250); });

  // dev/test-handtag
  window.__game = {
    S: function () { return S; },
    startLevel: function (n) { if (startEl.hidden) nyttLage(n); },
    starta: starta,
    utfor: utfor,
    losa: function () { return losa(S); },
    levels: NIVAER
  };

  ritaLjudikon();
  resize();
  requestAnimationFrame(ram);
})();
