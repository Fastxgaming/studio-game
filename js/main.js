/* Perekat: memasang efek ringan dan menjalankan intro. */
(function () {
  var SG = window.SG, h = document.documentElement, $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* muncul pelan saat terlihat: tangga tier, judul bagian */
  var tiers = document.getElementById('tiers'), heads = $('[data-scramble]');
  if (SG.calm || !('IntersectionObserver' in window)) {
    if (tiers) tiers.classList.add('on');
    heads.forEach(function (e) { e.classList.add('sc'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target === tiers) tiers.classList.add('on');
        else e.target.classList.add('sc');
        io.unobserve(e.target);
      });
    }, { threshold: .3 });
    if (tiers) io.observe(tiers);
    heads.forEach(function (e) { io.observe(e); });
  }

  $('[data-tilt]').forEach(function (e) { SG.tilt(e, 5); });
  $('.game').forEach(function (e) { SG.glow(e); });
  var bar = document.getElementById('prog'); if (bar) SG.progress(bar);

  function ready() { h.classList.remove('lock'); h.classList.add('ready'); }
  if (SG.intro) SG.intro(ready); else ready();   /* intro hanya ada di beranda */
})();
