/* Efek kecil yang dipakai bersama: miring 3D halus mengikuti kursor, cahaya kursor, bar progres scroll. */
(function () {
  var SG = window.SG = window.SG || {};
  var calm = document.documentElement.classList.contains('calm');
  SG.calm = calm;

  /* kartu miring 3D mengikuti kursor + kilau */
  SG.tilt = function (el, max) {
    if (calm || !window.matchMedia || !matchMedia('(hover:hover)').matches) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' + (px * max).toFixed(2) + 'deg) scale(1.02)';
      el.style.setProperty('--gx', ((px + .5) * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', ((py + .5) * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  };

  /* cahaya lembut yang mengikuti kursor di dalam kartu game */
  SG.glow = function (el) {
    if (calm) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  };

  /* bar progres scroll di tepi atas */
  SG.progress = function (bar) {
    var tick = false;
    function upd() { tick = false; var m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, scrollY / m) : 0) + ')'; }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  };
})();
