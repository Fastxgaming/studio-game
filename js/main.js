/* Perekat: memecah judul jadi kata, memasang efek, dan menjalankan intro. */
(function () {
  var SG = window.SG, h = document.documentElement, $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* judul hero: tiap kata naik dari balik topeng */
  $('[data-split]').forEach(function (el) {
    var txt = el.textContent.trim(), k = 0, out = '';
    txt.split(/\s+/).forEach(function (w) { out += '<span class="m"><span style="--k:' + (k++) + '">' + w + '</span></span>'; });
    el.setAttribute('aria-label', txt); el.innerHTML = out;
  });

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* muncul saat terlihat: tangga tier, judul bagian */
  var tiers = document.getElementById('tiers'), heads = $('[data-scramble]');
  if (SG.calm || !('IntersectionObserver' in window)) {
    if (tiers) tiers.classList.add('on');
    heads.forEach(function (e) { e.classList.add('sc'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target === tiers) tiers.classList.add('on');
        else { e.target.classList.add('sc'); SG.scramble(e.target, 750); }
        io.unobserve(e.target);
      });
    }, { threshold: .3 });
    if (tiers) io.observe(tiers);
    heads.forEach(function (e) { io.observe(e); });
  }

  $('[data-tilt]').forEach(function (e) { SG.tilt(e, 9); });
  $('.game').forEach(function (e) { SG.glow(e); });
  var bar = document.getElementById('prog'); if (bar) SG.progress(bar);

  SG.intro(function () { h.classList.remove('lock'); h.classList.add('ready'); });
})();
