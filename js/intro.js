/* INTRO 3D: kota bisnis yang tumbuh dari grid. Kamera berputar pelan dari rendah ke tinggi, gedung naik satu per satu
   (dua gedung aksen: aqua = Migas, oranye = Dealer), judul muncul, lalu layar memudar menyingkap halaman.
   Digambar di <canvas> 2D dengan proyeksi perspektif sendiri, tanpa pustaka. */
(function () {
  var SG = window.SG = window.SG || {};
  SG.intro = function (onReady) {
    var h = document.documentElement, el = document.getElementById('intro');
    if (!el || !h.classList.contains('lock')) { if (el) el.remove(); onReady(); return; }
    el.classList.add('on');

    var cv = document.getElementById('city'), ctx = cv.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W, H, cx, cy, U;
    function size() {
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      U = Math.min(W / 15, H / 14.5);
      cx = W / 2; cy = H * (W < 700 ? .68 : .64);
    }
    size(); addEventListener('resize', size);

    /* ---------- dunia: grid gedung, jalan silang di tengah ---------- */
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var N = 4, GAP = 1.15, HALF = .37, B = [];
    for (var i = -N; i <= N; i++) for (var j = -N; j <= N; j++) {
      if (i === 0 || j === 0) continue;
      var d = Math.hypot(i, j), accent = 0, ht = .45 + rnd() * 1.0 + Math.max(0, 1 - d / 6.2) * 1.15, delay = d / 6 * .30 + rnd() * .08;
      if (i === -2 && j === 2) { accent = 1; ht = 4.0; delay = .50; }
      if (i === 2 && j === -2) { accent = 2; ht = 3.4; delay = .58; }
      B.push({ x: i * GAP, z: j * GAP, h: ht, dl: delay, a: accent, cur: 0 });
    }
    var BASE = [30, 54, 112], AQ = [76, 201, 240], OR = [255, 106, 43];
    var LX = -.42, LY = .82, LZ = -.38, LL = Math.hypot(LX, LY, LZ); LX /= LL; LY /= LL; LZ /= LL;

    /* ---------- kamera ---------- */
    var yaw = 0, pit = 0, dist = 15, F = 1, ca, sa, cb, sb;
    function setCam(e) {
      yaw = -1.05 + e * .66; pit = .30 + e * .34; dist = 18 - e * 3.4; F = U * 15;
      ca = Math.cos(yaw); sa = Math.sin(yaw); cb = Math.cos(pit); sb = Math.sin(pit);
    }
    function rv(x, y, z, o) {                       /* putar vektor ke ruang kamera */
      var x1 = x * ca - z * sa, z1 = x * sa + z * ca;
      o[0] = x1; o[1] = y * cb + z1 * sb; o[2] = -y * sb + z1 * cb; return o;
    }
    var T = [0, 0, 0];
    function pj(x, y, z, o) {
      rv(x, y, z, T); var s = F / (T[2] + dist);
      o[0] = cx + T[0] * s; o[1] = cy - (T[1] - .9) * s; o[2] = T[2]; return o;
    }

    /* ---------- gambar satu sisi ---------- */
    var P = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], NV = [0, 0, 0];
    function face(v, n, col, boost, edge) {
      rv(n[0], n[1], n[2], NV); if (NV[2] >= -.001) return;         /* sisi membelakangi kamera */
      var sh = n[1] > .5 ? 1 : .5 + .5 * Math.max(0, n[0] * LX + n[1] * LY + n[2] * LZ);
      sh = Math.min(1.1, sh * boost);
      ctx.fillStyle = 'rgb(' + Math.min(255, col[0] * sh | 0) + ',' + Math.min(255, col[1] * sh | 0) + ',' + Math.min(255, col[2] * sh | 0) + ')';
      ctx.beginPath();
      for (var k = 0; k < 4; k++) { pj(v[k][0], v[k][1], v[k][2], P[k]); k ? ctx.lineTo(P[k][0], P[k][1]) : ctx.moveTo(P[k][0], P[k][1]); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
    }
    function box(b) {
      var h = b.cur; if (h < .01) return;
      var x0 = b.x - HALF, x1 = b.x + HALF, z0 = b.z - HALF, z1 = b.z + HALF;
      var col = b.a === 1 ? AQ : b.a === 2 ? OR : BASE, boost = b.a ? .92 : 1, edge = b.a ? 'rgba(255,255,255,.35)' : 'rgba(140,180,255,.22)';
      face([[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], [1, 0, 0], col, boost, edge);
      face([[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], [-1, 0, 0], col, boost, edge);
      face([[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], [0, 0, 1], col, boost, edge);
      face([[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], [0, 0, -1], col, boost, edge);
      face([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], [0, 1, 0], col, b.a ? 1.06 : 1.0, edge);
    }

    /* ---------- lantai grid ---------- */
    var Q = [0, 0, 0], Q2 = [0, 0, 0];
    function ground(a) {
      if (a <= 0) return;
      ctx.lineWidth = 1;
      var R = 6.3, S = 14;
      for (var k = -5; k <= 5; k++) {
        var c = (k + .0) * GAP - GAP / 2 * (k > 0 ? -1 : 1) * 0;       /* garis di pusat jalan dan batas blok */
        for (var dir = 0; dir < 2; dir++) {
          for (var s = 0; s < S; s++) {
            var u0 = -R + 2 * R * s / S, u1 = -R + 2 * R * (s + 1) / S, um = (u0 + u1) / 2, r = Math.hypot(c, um);
            var al = a * .20 * Math.max(0, 1 - r / (R * 1.05)); if (al < .01) continue;
            if (dir) { pj(c, 0, u0, Q); pj(c, 0, u1, Q2); } else { pj(u0, 0, c, Q); pj(u1, 0, c, Q2); }
            ctx.strokeStyle = 'rgba(130,175,255,' + al.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q2[0], Q2[1]); ctx.stroke();
          }
        }
      }
    }

    /* ---------- UI ---------- */
    var bar = document.getElementById('bar'), ttl = document.getElementById('ttl');
    var t0 = performance.now(), DUR = 3600, p = 0, fin = false, raf = 0, skipped = false;
    function ease(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - Math.pow(1 - x, 3); }
    function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

    var tmp = [0, 0, 0];
    function frame(now) {
      raf = requestAnimationFrame(frame);
      p = Math.min(1, (now - t0) / DUR);
      bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      if (p > .5) ttl.classList.add('show');

      setCam(smooth(p));
      ctx.fillStyle = '#0a1530'; ctx.fillRect(0, 0, W, H);
      var g = ctx.createRadialGradient(cx, cy - U * 1.5, 0, cx, cy - U * 1.5, U * 9);
      g.addColorStop(0, 'rgba(76,201,240,.13)'); g.addColorStop(.55, 'rgba(255,106,43,.04)'); g.addColorStop(1, 'rgba(10,21,48,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      ground(ease(p / .22));
      for (var i = 0; i < B.length; i++) {
        var b = B[i]; b.cur = b.h * ease((p - b.dl) / .34);
        b.dp = rv(b.x, 0, b.z, [0, 0, 0])[2];
      }
      B.sort(function (a, c) { return c.dp - a.dp; });                /* yang jauh digambar dulu */
      for (i = 0; i < B.length; i++) box(B[i]);

      /* cahaya lembut di puncak dua gedung aksen setelah tumbuh */
      for (i = 0; i < B.length; i++) {
        b = B[i]; if (!b.a || b.cur < b.h * .98) continue;
        pj(b.x, b.h, b.z, tmp); var gl = ctx.createRadialGradient(tmp[0], tmp[1], 0, tmp[0], tmp[1], U * 1.3), col = b.a === 1 ? '76,201,240' : '255,106,43';
        gl.addColorStop(0, 'rgba(' + col + ',.55)'); gl.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(tmp[0], tmp[1], U * 1.3, 0, 6.2832); ctx.fill();
      }
      if (p >= 1 && !fin) finish();
    }
    function finish() {
      if (fin) return; fin = true;
      try { sessionStorage.setItem('sg-intro', '1'); } catch (e) {}
      setTimeout(function () { el.classList.add('open'); onReady(); }, skipped ? 0 : 500);
      setTimeout(function () { cancelAnimationFrame(raf); removeEventListener('resize', size); el.remove(); }, skipped ? 1100 : 1700);
    }
    document.getElementById('skip').addEventListener('click', function () { if (!fin) { skipped = true; ttl.classList.add('show'); t0 = -1e9; } });
    setTimeout(function () { if (!fin) { skipped = true; t0 = -1e9; } }, 9000);
    raf = requestAnimationFrame(function (n) { t0 = n; frame(n); });
  };
})();
