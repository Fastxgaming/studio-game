/* Hitung mundur rilis Truck Manager Nusantara.
   Target: Selasa, 3 November 2026 pukul 20.30 WIB (UTC+7).
   Elemen [data-countdown] menampilkan sisa waktu; elemen [data-live] hanya tampil setelah rilis,
   elemen [data-pre] hanya tampil sebelum rilis. Memakai jam perangkat pemain. */
(function () {
  var TARGET = Date.parse('2026-11-03T20:30:00+07:00');
  var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-countdown]'));
  if (!boxes.length) return;
  var h = document.documentElement;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function set(el, key, v) { var n = el.querySelector('[data-u="' + key + '"]'); if (n && n.textContent !== v) n.textContent = v; }

  function tick() {
    var left = TARGET - Date.now(), live = left <= 0;
    h.classList.toggle('tmn-live', live);
    boxes.forEach(function (el) {
      var s = Math.max(0, Math.floor(left / 1000));
      set(el, 'd', pad(Math.floor(s / 86400)));
      set(el, 'h', pad(Math.floor(s % 86400 / 3600)));
      set(el, 'm', pad(Math.floor(s % 3600 / 60)));
      set(el, 's', pad(s % 60));
      el.setAttribute('data-state', live ? 'live' : 'wait');
    });
    return live;
  }

  if (tick()) return;
  var t = setInterval(function () { if (tick()) clearInterval(t); }, 1000);
})();
