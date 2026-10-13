/* INTRO: lompatan hyperspace. Bintang melesat dari tengah layar, kecepatannya naik seiring progres,
   lalu "lompat": kilat, dan layar menutup seperti diafragma untuk menyingkap halaman. */
(function () {
  var SG = window.SG = window.SG || {};
  SG.intro = function (onReady) {
    var h = document.documentElement, el = document.getElementById('intro');
    if (!el || !h.classList.contains('lock')) { if (el) el.remove(); onReady(); return; }
    el.classList.add('on');

    var cv = document.getElementById('warp'), ctx = cv.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W, H, cx, cy, sc;
    function size() {
      W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); cx = W / 2; cy = H / 2; sc = Math.max(W, H) * .34;
      ctx.fillStyle = '#0a1530'; ctx.fillRect(0, 0, W, H);
    }
    size(); addEventListener('resize', size);

    var S = [], N = innerWidth < 700 ? 280 : 560, COL = ['207,224,255', '76,201,240', '255,106,43'];
    function spawn(s, first) {
      do { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; } while (s.x * s.x + s.y * s.y < .035);
      s.z = first ? Math.random() * .95 + .05 : 1;
      var r = Math.random(); s.k = r < .14 ? 2 : r < .34 ? 1 : 0;
    }
    for (var i = 0; i < N; i++) { var s = {}; spawn(s, true); S.push(s); }

    var pct = document.getElementById('pct'), ring = document.getElementById('ring'), ttl = document.getElementById('ttl'),
        flash = document.getElementById('flash'), log = document.getElementById('log');
    var TITLE = ttl.getAttribute('data-final') || 'Studio Game', CIRC = 339.3;
    var LINES = ['Memuat mesin simulasi', 'Menyiapkan peta 34 provinsi', 'Menyalakan Migas Manager ID', 'Membuka Dealer Manager ID', 'Menyambungkan pemain'], shown = 0;
    var t0 = performance.now(), last = t0, lastTxt = 0, D = 3800, p = 0, jump = false, fin = false, raf = 0;

    function ui(now) {
      pct.textContent = Math.round(p * 100);
      ring.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(1);
      if (now - lastTxt > 36 || p >= 1) { lastTxt = now; ttl.textContent = SG.mix(TITLE, Math.floor(Math.min(1, p * 1.2) * TITLE.length)); }
      while (shown < LINES.length && p > (shown + .4) / (LINES.length + .2)) {
        var li = document.createElement('li'); li.innerHTML = '<span>' + LINES[shown] + '</span><b>siap</b>'; log.appendChild(li); shown++;
      }
    }
    function frame(now) {
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!fin) { p = Math.min(1, (now - t0) / D); ui(now); if (p >= 1) finish(); }
      var speed = jump ? 9 : .14 + 2.1 * p * p * p;
      ctx.fillStyle = 'rgba(10,21,48,' + (jump ? .16 : .3) + ')'; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var s = S[i], z0 = s.z + speed * .04 + .004; s.z -= speed * dt;
        if (s.z <= .03) { spawn(s, false); continue; }
        var x1 = cx + s.x * sc / s.z, y1 = cy + s.y * sc / s.z;
        if (x1 < -50 || x1 > W + 50 || y1 < -50 || y1 > H + 50) { spawn(s, false); continue; }
        var x0 = cx + s.x * sc / z0, y0 = cy + s.y * sc / z0, a = Math.min(1, (1 - s.z) * 1.5 + .1);
        ctx.strokeStyle = 'rgba(' + COL[s.k] + ',' + a.toFixed(2) + ')'; ctx.lineWidth = (1 - s.z) * 2.3 + .4;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      if (fin) return; fin = true; p = 1; ui(performance.now()); ttl.textContent = TITLE; jump = true;
      try { sessionStorage.setItem('sg-intro', '1'); } catch (e) {}
      setTimeout(function () { flash.classList.add('on'); }, 420);
      setTimeout(function () { el.classList.add('open'); onReady(); }, 760);
      setTimeout(function () { cancelAnimationFrame(raf); removeEventListener('resize', size); el.remove(); }, 2100);
    }
    document.getElementById('skip').addEventListener('click', function () { if (!fin) { t0 = -1e9; } });
    setTimeout(function () { if (!fin) t0 = -1e9; }, 9000);
    raf = requestAnimationFrame(function (n) { t0 = n; last = n; frame(n); });
  };
})();
