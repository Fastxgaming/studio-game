/* Mesin status rilis game. Membaca data/config.json (diatur lewat /admin/) lalu mengatur tampilan:
   - [data-show="wait dev live"]  tampil hanya di status yang disebut (wait = hitung mundur, dev = dalam pembuatan, live = sudah rilis)
   - [data-countdown]             kotak hitung mundur (isi [data-u="d|h|m|s"])
   - [data-tx="dateLong|dateTime|dateShort|note|name"]  teks dari konfigurasi
   - [data-href="playUrl"]        tautan main
   Atribut data-g="id" memilih game (bawaan: truck). Bila config gagal dimuat, dipakai nilai bawaan di bawah. */
(function () {
  var me = document.currentScript;
  var CFG_URL = me && me.src ? new URL('../data/config.json', me.src).href : null;
  var DEFAULTS = {
    truck: { name: 'Truck Manager Nusantara', status: 'countdown', releaseAt: '2026-11-03T20:30:00+07:00', playUrl: 'https://truck-manajer-nusantara.web.app', note: '' }
  };
  var games = clone(DEFAULTS), timer = 0, shown = {};
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function gid(el) { return el.getAttribute('data-g') || 'truck'; }

  function target(g) { var t = Date.parse(g.releaseAt); return isNaN(t) ? null : t; }
  function stateOf(g) {
    if (g.status === 'dev') return 'dev';
    if (g.status === 'live') return 'live';
    var t = target(g);
    if (t === null) return 'dev';
    return Date.now() >= t ? 'live' : 'wait';
  }
  function fmt(g, kind) {
    var t = target(g); if (t === null) return '';
    var d = new Date(t + 7 * 3600000); /* semua ditampilkan dalam WIB */
    var date = d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    var time = p2(d.getUTCHours()) + '.' + p2(d.getUTCMinutes());
    if (kind === 'dateLong') return DAYS[d.getUTCDay()] + ', ' + date + ', pukul ' + time + ' WIB';
    if (kind === 'dateTime') return date + ', ' + time + ' WIB';
    if (kind === 'dateShort') return d.getUTCDate() + ' ' + MON[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCFullYear();
    return '';
  }
  function text(g, key) {
    if (key === 'note') return (g.note || '').trim();
    if (key === 'name') return g.name || '';
    return fmt(g, key);
  }

  function apply() {
    var q = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    q('[data-show]').forEach(function (el) {
      var g = games[gid(el)]; if (!g) return;
      el.hidden = el.getAttribute('data-show').split(/\s+/).indexOf(stateOf(g)) < 0;
    });
    q('[data-tx]').forEach(function (el) {
      var g = games[gid(el)]; if (!g) return;
      var v = text(g, el.getAttribute('data-tx'));
      if (el.textContent !== v) el.textContent = v;
      if (el.hasAttribute('data-hide-empty')) el.hidden = !v;
    });
    q('[data-href]').forEach(function (el) {
      var g = games[gid(el)]; if (!g) return;
      var u = g[el.getAttribute('data-href')] || '';
      if (/^https:\/\//i.test(u)) el.setAttribute('href', u);
    });
    tick();
  }

  function tick() {
    var waiting = false, changed = false;
    Array.prototype.slice.call(document.querySelectorAll('[data-countdown]')).forEach(function (el) {
      var g = games[gid(el)]; if (!g) return;
      var t = target(g); if (t === null) return;
      var s = Math.max(0, Math.floor((t - Date.now()) / 1000));
      var put = function (k, v) { var n = el.querySelector('[data-u="' + k + '"]'); if (n && n.textContent !== v) n.textContent = v; };
      put('d', p2(Math.floor(s / 86400))); put('h', p2(Math.floor(s % 86400 / 3600)));
      put('m', p2(Math.floor(s % 3600 / 60))); put('s', p2(s % 60));
    });
    Object.keys(games).forEach(function (k) {
      var st = stateOf(games[k]);
      if (st === 'wait') waiting = true;
      if (shown[k] !== undefined && shown[k] !== st) changed = true;
      shown[k] = st;
    });
    clearInterval(timer);
    if (changed) return apply(); /* waktu rilis baru terlewati: ganti tampilan ke "sudah rilis" */
    if (waiting) timer = setInterval(tick, 1000);
  }

  function merge(cfg) {
    if (!cfg || typeof cfg !== 'object' || !cfg.games) return;
    Object.keys(cfg.games).forEach(function (k) {
      var c = cfg.games[k]; if (!c || typeof c !== 'object') return;
      var base = games[k] || { name: k, status: 'dev', releaseAt: '', playUrl: '', note: '' };
      ['name', 'status', 'releaseAt', 'playUrl', 'note'].forEach(function (f) { if (typeof c[f] === 'string') base[f] = c[f]; });
      if (['dev', 'countdown', 'live'].indexOf(base.status) < 0) base.status = 'dev';
      games[k] = base;
    });
  }

  function done() { document.documentElement.classList.remove('tmn-pending'); }

  apply(); /* tampilkan dulu nilai bawaan, lalu perbarui bila config berhasil dimuat */
  if (!CFG_URL || !window.fetch) return done();
  var finished = false;
  var finish = function () { if (finished) return; finished = true; apply(); done(); };
  setTimeout(finish, 2500);
  fetch(CFG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (c) { if (!finished) merge(c); })
    .catch(function () {})
    .then(finish);
})();
