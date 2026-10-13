/* Jalan paling awal (di <head>): tandai JS aktif, dan putuskan apakah intro diputar.
   Intro hanya sekali per sesi tab, dilewati bila pengguna memilih "kurangi animasi".
   Tambahkan ?intro di URL untuk memutarnya lagi (berguna saat mengetes). */
(function () {
  var h = document.documentElement, seen = 0;
  h.classList.add('js');
  try { seen = sessionStorage.getItem('sg-intro'); } catch (e) {}
  var force = /[?&]intro\b/.test(location.search);
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ((force || !seen) && !calm) h.classList.add('lock');
  if (calm) h.classList.add('calm');
})();
