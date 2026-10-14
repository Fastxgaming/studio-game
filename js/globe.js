/* GLOBE 3D di hero: bola titik dengan gugusan Nusantara yang menyala, busur jaringan antar kota,
   dan dua simpul berlabel (Migas & Dealer). Digambar di <canvas> 2D dengan
   proyeksi perspektif buatan sendiri (tanpa pustaka), mengikuti kursor, berhenti saat tak terlihat. */
(function () {
  var SG = window.SG = window.SG || {};
  var cv = document.getElementById('globe');
  if (!cv) return;
  var ctx = cv.getContext('2d'), h = document.documentElement, calm = SG.calm;
  var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, cx = 0, cy = 0, R = 0, narrow = false;
  var D2R = Math.PI / 180, TAU = Math.PI * 2;

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = rng(11);
  function ll(lat, lon) { lat *= D2R; lon *= D2R; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  /* titik dasar bola (spiral Fibonacci) */
  var base = [], NB = 760, ga = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < NB; i++) { var y = 1 - (i / (NB - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * ga; base.push([Math.cos(a) * r, y, Math.sin(a) * r]); }

  /* gugusan pulau Nusantara: [lat, lon, radius lat, radius lon, sudut, jumlah titik] */
  var ISL = [[-0.3, 101.6, 1.6, 7.5, -38, 70], [-7.6, 110.4, 0.9, 6.2, 5, 55], [0.4, 114, 4.4, 5.2, 0, 85], [-2.2, 121, 3.2, 2.2, 60, 55], [-4.3, 138, 3.2, 8.5, -15, 80], [-8.6, 117, .6, 2.4, 0, 14], [1.2, 125, 1.1, 1.1, 0, 10], [-3.2, 128.2, 1.1, 1.8, 0, 12]];
  var isl = [];
  ISL.forEach(function (o) {
    for (var k = 0; k < o[5]; k++) {
      var rr = Math.sqrt(rnd()), th = rnd() * TAU, u = Math.cos(th) * rr * o[2], v = Math.sin(th) * rr * o[3], ca = Math.cos(o[4] * D2R), sa = Math.sin(o[4] * D2R);
      isl.push(ll(o[0] + u * ca - v * sa * .5, o[1] + v * ca + u * sa * 2));
    }
  });

  /* simpul jaringan: [lat, lon, warna, kunci?] */
  var AQ = '76,201,240', OR = '255,106,43', PA = '226,234,252';
  var nodes = [
    { v: ll(-6.9, 112.0), c: AQ, big: 1, label: 'Migas Manager ID', dx: 1, dy: 1 },
    { v: ll(3.6, 98.7), c: OR, big: 1, label: 'Dealer Manager ID', dx: -1, dy: -1 },
    { v: ll(-6.2, 106.8), c: PA }, { v: ll(-7.8, 110.4), c: PA }, { v: ll(-5.1, 119.4), c: PA }, { v: ll(-0.9, 119.9), c: PA },
    { v: ll(-1.2, 116.8), c: PA }, { v: ll(-2.6, 140.7), c: PA }, { v: ll(-8.7, 115.2), c: PA }, { v: ll(0.5, 101.4), c: PA },
    { v: ll(1.5, 124.8), c: PA }, { v: ll(-3.3, 114.6), c: PA }, { v: ll(35.7, 139.7), c: PA }, { v: ll(1.3, 103.8), c: PA }
  ];
  var arcs = [[0, 2], [0, 4], [0, 6], [1, 9], [1, 13], [2, 3], [4, 7], [5, 10], [0, 8], [1, 2], [3, 11], [13, 12], [6, 5]];

  /* garis lintang & bujur */
  var grid = [];
  function line(pts) { grid.push(pts); }
  [-60, -30, 0, 30, 60].forEach(function (la) { var p = []; for (var lo = 0; lo <= 360; lo += 6) p.push(ll(la, lo)); line(p); });
  for (var m = 0; m < 360; m += 30) { var q = []; for (var la2 = -90; la2 <= 90; la2 += 6) q.push(ll(la2, m)); line(q); }

  /* state */
  var mx = 0, my = 0, sx = 0, sy = 0, running = false, visible = true, raf = 0, t0 = performance.now(), lastT = 0;
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  function size() {
    var b = cv.getBoundingClientRect(); W = Math.max(1, b.width); H = Math.max(1, b.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    narrow = W < 900;
    if (narrow) { cx = W * .64; cy = Math.min(H * .3, 330); R = Math.min(W * .52, 300); }
    else { cx = W * .7; cy = H * .54; R = Math.min(W * .25, H * .37); }
  }

  var yaw, tilt, cyw, syw, ctl, stl;
  function rot(v, out) {
    var x = v[0] * cyw + v[2] * syw, z = -v[0] * syw + v[2] * cyw, y = v[1] * ctl - z * stl, z2 = v[1] * stl + z * ctl;
    out[0] = x; out[1] = y; out[2] = z2; return out;
  }
  var tmp = [0, 0, 0], tmp2 = [0, 0, 0];
  function proj(p) { var k = 1 / (1 - p[2] * .22); return [cx + p[0] * R * k, cy - p[1] * R * k, k]; }

  function draw(now) {
    var t = (now - t0) / 1000;
    sx += (mx - sx) * .05; sy += (my - sy) * .05;
    yaw = -113 * D2R + Math.sin(t * .12) * .16 + sx * .12;
    tilt = .02 - sy * .08 + Math.sin(t * .1) * .015;
    cyw = Math.cos(yaw); syw = Math.sin(yaw); ctl = Math.cos(tilt); stl = Math.sin(tilt);
    ctx.clearRect(0, 0, W, H);

    /* halo atmosfer */
    var g = ctx.createRadialGradient(cx, cy, R * .85, cx, cy, R * 1.5);
    g.addColorStop(0, 'rgba(76,201,240,.20)'); g.addColorStop(.5, 'rgba(76,201,240,.05)'); g.addColorStop(1, 'rgba(76,201,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, TAU); ctx.fill();


    /* badan bola */
    g = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R * 1.02);
    g.addColorStop(0, 'rgba(34,62,128,.78)'); g.addColorStop(.7, 'rgba(14,28,66,.82)'); g.addColorStop(1, 'rgba(10,21,48,.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,180,255,.28)'; ctx.lineWidth = 1.2; ctx.stroke();

    /* garis lintang-bujur */
    ctx.lineWidth = 1;
    for (var i = 0; i < grid.length; i++) {
      var L = grid[i], prev = null;
      for (var j = 0; j < L.length; j++) {
        var p = rot(L[j], tmp), q = proj(p), cur = [q[0], q[1], p[2]];
        if (prev && (cur[2] + prev[2]) > .1) { ctx.strokeStyle = 'rgba(130,170,255,' + (.06 + Math.max(0, (cur[2] + prev[2]) / 2) * .15).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke(); }
        prev = cur;
      }
    }

    /* titik bola */
    for (i = 0; i < base.length; i++) {
      var pb = rot(base[i], tmp); if (pb[2] < -.05) continue; var qb = proj(pb);
      ctx.fillStyle = 'rgba(170,200,255,' + (.10 + pb[2] * .42).toFixed(2) + ')'; ctx.fillRect(qb[0] - .7, qb[1] - .7, 1.5, 1.5);
    }
    /* Nusantara menyala */
    for (i = 0; i < isl.length; i++) {
      var pi = rot(isl[i], tmp); if (pi[2] < 0) continue; var qi = proj(pi), tw = .85;
      ctx.fillStyle = 'rgba(' + (i % 5 === 0 ? OR : AQ) + ',' + (pi[2] * .85 * tw).toFixed(2) + ')'; ctx.fillRect(qi[0] - 1, qi[1] - 1, 2.2, 2.2);
    }

    /* busur jaringan + denyut data */
    for (i = 0; i < arcs.length; i++) {
      var A = nodes[arcs[i][0]].v, B = nodes[arcs[i][1]].v, dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), om = Math.acos(dot) || .001, so = Math.sin(om), N = 28, pts = [];
      var lift = .1 + om * .22;
      for (j = 0; j <= N; j++) {
        var s = j / N, k1 = Math.sin((1 - s) * om) / so, k2 = Math.sin(s * om) / so, hgt = 1 + Math.sin(s * Math.PI) * lift;
        var v = [(A[0] * k1 + B[0] * k2) * hgt, (A[1] * k1 + B[1] * k2) * hgt, (A[2] * k1 + B[2] * k2) * hgt];
        var pr = rot(v, [0, 0, 0]), qr = proj(pr); pts.push([qr[0], qr[1], pr[2]]);
      }
      var col = nodes[arcs[i][0]].big ? nodes[arcs[i][0]].c : (nodes[arcs[i][1]].big ? nodes[arcs[i][1]].c : AQ);
      ctx.lineWidth = 1.1;
      for (j = 1; j < pts.length; j++) { var zz = (pts[j][2] + pts[j - 1][2]) / 2; if (zz < -.02) continue; ctx.strokeStyle = 'rgba(' + col + ',' + (.14 + zz * .3).toFixed(2) + ')'; ctx.beginPath(); ctx.moveTo(pts[j - 1][0], pts[j - 1][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke(); }
    }

    /* simpul */
    var labels = [];
    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i], pn = rot(nd.v, tmp2); if (pn[2] < .02) continue; var qn = proj(pn), rad = nd.big ? 5 : 2.6;
      var gg = ctx.createRadialGradient(qn[0], qn[1], 0, qn[0], qn[1], rad * 4); gg.addColorStop(0, 'rgba(' + nd.c + ',.55)'); gg.addColorStop(1, 'rgba(' + nd.c + ',0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(qn[0], qn[1], rad * 4, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgb(' + nd.c + ')'; ctx.beginPath(); ctx.arc(qn[0], qn[1], rad, 0, TAU); ctx.fill();
      if (nd.big) labels.push([nd, qn, pn[2]]);
    }

    /* label simpul utama */
    var fs = Math.max(12, Math.min(16, R * .05));
    ctx.font = '700 ' + fs + 'px "Figtree",system-ui,sans-serif'; ctx.textBaseline = 'middle';
    if (!narrow) labels.forEach(function (L) {
      var nd = L[0], q = L[1], al = Math.min(1, (L[2] - .1) * 2.5); if (al <= 0) return;
      var ex = q[0] + nd.dx * R * .2, ey = q[1] + nd.dy * R * .22, tw = ctx.measureText(nd.label).width;
      ctx.strokeStyle = 'rgba(' + nd.c + ',' + (.7 * al).toFixed(2) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(ex, ey); ctx.lineTo(ex + nd.dx * (tw + 14), ey); ctx.stroke();
      ctx.fillStyle = 'rgba(238,242,251,' + al.toFixed(2) + ')'; ctx.textAlign = nd.dx > 0 ? 'left' : 'right';
      ctx.fillText(nd.label, ex + nd.dx * 7, ey - fs * .95);
    });

  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    if (visible && !h.classList.contains('lock')) draw(now);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; if (!raf) raf = requestAnimationFrame(loop); }

  size(); addEventListener('resize', function () { size(); if (calm || !running) draw(performance.now()); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(cv);
  if (calm) draw(performance.now()); else start();
  SG.globe = { start: start };
})();
