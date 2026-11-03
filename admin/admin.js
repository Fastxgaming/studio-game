/* Panel admin Studio Game (tanpa Firebase, tanpa server).
   - Login buatan sendiri: password diperiksa lewat PBKDF2 di browser ini.
   - Token GitHub disimpan terenkripsi (AES-GCM) dengan kunci turunan password, hanya di localStorage perangkat ini.
   - Perubahan diterbitkan dengan meng-commit data/config.json lewat GitHub API; situs membaca berkas itu. */
(function () {
  'use strict';
  var LS = 'sg_admin_v1', LSF = 'sg_admin_fail', ITER = 250000, IDLE_MS = 15 * 60 * 1000;
  var enc = new TextEncoder(), dec = new TextDecoder();
  var $ = function (s) { return document.querySelector(s); };
  var S = { token: null, aes: null, cfg: null, orig: '', sha: null, game: null, vault: null, idle: 0 };
  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* ---------- util ---------- */
  function b64(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function ub64(str) { var s = atob(str), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function same(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function show(id) { ['v-setup', 'v-login', 'v-panel'].forEach(function (v) { $('#' + v).hidden = v !== id; }); }
  function msg(el, t, kind) { el.textContent = t || ''; el.className = 'msg' + (kind ? ' ' + kind : ''); }
  var toastT;
  function toast(t, err) { var el = $('#toast'); el.textContent = t; el.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toastT); toastT = setTimeout(function () { el.className = 'toast'; }, 5200); }
  function load() { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } }
  function save(v) { localStorage.setItem(LS, JSON.stringify(v)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- kripto ---------- */
  async function derive(pass, salt, iter) {
    var k = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    var bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, k, 512));
    var key = await crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { ver: bits.slice(0, 32), key: key };
  }
  async function seal(key, text) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(text));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function open(key, iv, ct) { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(iv) }, key, ub64(ct))); }

  /* ---------- GitHub ---------- */
  async function gh(method, path, body) {
    var r = await fetch('https://api.github.com' + path, {
      method: method,
      headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + S.token, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { var e2 = new Error((j && j.message) || ('HTTP ' + r.status)); e2.status = r.status; throw e2; }
    return j;
  }
  function explain(e) {
    if (e.status === 401) return 'Token ditolak GitHub (salah atau kedaluwarsa). Perbarui token di "Repositori dan token".';
    if (e.status === 403) return 'Token tidak punya izin atau terkena batas akses GitHub. Pastikan izin Contents: Read and write.';
    if (e.status === 404) return 'Repositori tidak ditemukan atau token tidak punya akses ke repo itu.';
    if (e.status === 409 || e.status === 422) return 'Berkas di repo sudah berubah sejak dimuat. Tekan "Muat ulang dari repo", lalu ulangi perubahanmu.';
    return 'Gagal terhubung ke GitHub: ' + e.message;
  }
  function cpath() { var r = S.vault.repo; return '/repos/' + encodeURIComponent(r.owner) + '/' + encodeURIComponent(r.repo) + '/contents/' + r.path.split('/').map(encodeURIComponent).join('/'); }
  var DEFCFG = function () { return { version: 1, updatedAt: '', games: { truck: { name: 'Truck Manager Nusantara', status: 'countdown', releaseAt: '2026-11-03T20:30:00+07:00', playUrl: 'https://truck-manajer-nusantara.web.app', note: '' } } }; };

  async function fetchConfig() {
    try {
      var j = await gh('GET', cpath() + '?ref=' + encodeURIComponent(S.vault.repo.branch) + '&t=' + Date.now());
      S.sha = j.sha;
      S.cfg = JSON.parse(dec.decode(ub64(j.content.replace(/\s/g, ''))));
      if (!S.cfg.games || typeof S.cfg.games !== 'object') S.cfg.games = {};
    } catch (e) {
      if (e.status === 404) { S.sha = null; S.cfg = DEFCFG(); toast('Berkas konfigurasi belum ada di repo. Memakai nilai awal, terbitkan untuk membuatnya.'); }
      else throw e;
    }
    S.orig = JSON.stringify(S.cfg.games);
    var keys = Object.keys(S.cfg.games);
    if (!S.game || !S.cfg.games[S.game]) S.game = keys[0] || null;
  }

  /* ---------- waktu ---------- */
  function toLocalWIB(iso) { var t = Date.parse(iso); if (isNaN(t)) return ''; return new Date(t + 7 * 3600000).toISOString().slice(0, 16); }
  function fromLocalWIB(v) { return v ? v + ':00+07:00' : ''; }
  function fmtWIB(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return '-';
    var d = new Date(t + 7 * 3600000);
    return DAYS[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', pukul ' + p2(d.getUTCHours()) + '.' + p2(d.getUTCMinutes()) + ' WIB';
  }
  function left(iso) {
    var s = Math.floor((Date.parse(iso) - Date.now()) / 1000); if (isNaN(s)) return '';
    if (s <= 0) return 'Waktu sudah lewat';
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (d ? d + ' hari ' : '') + p2(h) + ' jam ' + p2(m) + ' menit ' + p2(x) + ' detik';
  }

  /* ---------- panel ---------- */
  function cur() { return S.cfg.games[S.game]; }
  function dirty() { return JSON.stringify(S.cfg.games) !== S.orig; }

  function renderTabs() {
    var box = $('#tabs'); box.textContent = '';
    Object.keys(S.cfg.games).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', k === S.game ? 'true' : 'false');
      b.textContent = S.cfg.games[k].name || k;
      b.onclick = function () { S.game = k; renderAll(); };
      box.appendChild(b);
    });
  }
  function fillForm() {
    var g = cur(); if (!g) return;
    $('#g-title').textContent = (g.name || S.game) + ' (' + S.game + ')';
    Array.prototype.forEach.call(document.getElementsByName('st'), function (r) { r.checked = r.value === g.status; });
    $('#i-time').value = toLocalWIB(g.releaseAt);
    $('#i-url').value = g.playUrl || '';
    $('#i-note').value = g.note || '';
    $('#n-cnt').textContent = ($('#i-note').value || '').length;
    $('#box-time').hidden = g.status !== 'countdown';
  }
  function readForm() {
    var g = cur(); if (!g) return;
    var st = document.querySelector('input[name=st]:checked'); if (st) g.status = st.value;
    if (g.status === 'countdown' || $('#i-time').value) g.releaseAt = fromLocalWIB($('#i-time').value) || g.releaseAt;
    g.playUrl = $('#i-url').value.trim();
    g.note = $('#i-note').value.trim();
    $('#box-time').hidden = g.status !== 'countdown';
    $('#n-cnt').textContent = $('#i-note').value.length;
  }
  function renderPreview() {
    var g = cur(); if (!g) return;
    var past = g.status === 'countdown' && Date.parse(g.releaseAt) <= Date.now();
    var live = g.status === 'live' || past, dev = g.status === 'dev' || (g.status === 'countdown' && isNaN(Date.parse(g.releaseAt)));
    var st = $('#pv-st'), big = $('#pv-big'), sub = $('#pv-sub'), btn = $('#pv-btn');
    st.className = 'st' + (live ? ' live' : '');
    if (dev) { st.textContent = 'Sedang dalam pembuatan'; big.textContent = 'Belum ada jadwal'; sub.textContent = 'Tombol main disembunyikan.'; btn.textContent = 'Tombol: "Belum bisa dimainkan"'; }
    else if (live) { st.textContent = 'Sudah rilis'; big.textContent = 'Ayo main'; sub.textContent = past ? 'Waktu rilis sudah lewat, jadi situs langsung menampilkan "Sudah rilis".' : 'Tombol main tampil untuk semua pengunjung.'; btn.textContent = /^https:\/\//i.test(g.playUrl) ? 'Tombol main menuju: ' + g.playUrl : 'Peringatan: link main belum diisi atau tidak diawali https://.'; }
    else { st.textContent = 'Rilis terjadwal'; big.textContent = left(g.releaseAt); sub.textContent = fmtWIB(g.releaseAt); btn.textContent = 'Tombol: "Belum bisa dimainkan"'; }
    var nt = $('#pv-note'); nt.hidden = !g.note; nt.textContent = g.note || '';
    $('#dirty').hidden = !dirty();
  }
  function renderAll() { renderTabs(); fillForm(); renderPreview(); }

  function bindForm() {
    ['change', 'input'].forEach(function (ev) { $('#f-game').addEventListener(ev, function () { readForm(); renderPreview(); }); });
    $('#f-game').addEventListener('submit', function (e) { e.preventDefault(); });
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var m = b.getAttribute('data-m'), base = Date.parse(fromLocalWIB($('#i-time').value));
      var t = m === 'now60' ? Date.now() + 3600000 : (isNaN(base) ? Date.now() : base) + parseInt(m, 10) * 60000;
      $('#i-time').value = new Date(t + 7 * 3600000).toISOString().slice(0, 16);
      readForm(); renderPreview();
    });
    setInterval(function () { if (!$('#v-panel').hidden && S.cfg) renderPreview(); }, 1000);
  }

  function validate(g) {
    if (g.status === 'countdown' && isNaN(Date.parse(g.releaseAt))) return 'Isi waktu rilis lebih dulu.';
    if ((g.status === 'live' || g.status === 'countdown') && g.playUrl && !/^https:\/\//i.test(g.playUrl)) return 'Link main harus diawali https://';
    if (g.status === 'live' && !g.playUrl) return 'Status "Sudah rilis" membutuhkan link main.';
    if ((g.note || '').length > 200) return 'Catatan maksimal 200 karakter.';
    return '';
  }

  async function publish() {
    readForm();
    var bad = ''; Object.keys(S.cfg.games).forEach(function (k) { bad = bad || (validate(S.cfg.games[k]) && ((S.cfg.games[k].name || k) + ': ' + validate(S.cfg.games[k]))); });
    if (bad) return msg($('#m-panel'), bad, 'err');
    if (!dirty() && S.sha) return msg($('#m-panel'), 'Tidak ada perubahan untuk diterbitkan.', 'ok');
    var g = cur(), ok = true;
    if (g.status === 'countdown' && Date.parse(g.releaseAt) <= Date.now()) ok = confirm('Waktu rilis sudah lewat, situs akan langsung menampilkan "Sudah rilis". Lanjutkan?');
    else ok = confirm('Terbitkan perubahan ke situs?\n\n' + (g.name || S.game) + '\nStatus: ' + ({ dev: 'Dalam pembuatan', countdown: 'Rilis terjadwal', live: 'Sudah rilis' })[g.status] + (g.status === 'countdown' ? '\nRilis: ' + fmtWIB(g.releaseAt) : ''));
    if (!ok) return;
    $('#b-pub').disabled = true; msg($('#m-panel'), 'Menerbitkan...');
    try {
      S.cfg.updatedAt = new Date().toISOString();
      var text = JSON.stringify(S.cfg, null, 2) + '\n';
      var body = { message: 'Admin: ubah status rilis ' + S.game + ' (' + g.status + (g.status === 'countdown' ? ', ' + fmtWIB(g.releaseAt) : '') + ')', content: b64(enc.encode(text)), branch: S.vault.repo.branch };
      if (S.sha) body.sha = S.sha;
      var j = await gh('PUT', cpath(), body);
      S.sha = j.content.sha; S.orig = JSON.stringify(S.cfg.games);
      renderPreview();
      msg($('#m-panel'), 'Tersimpan di repo. Situs memperbarui diri dalam kira-kira 1 menit.', 'ok');
      toast('Berhasil diterbitkan. Tunggu sekitar 1 menit lalu muat ulang situs.');
    } catch (e) { msg($('#m-panel'), explain(e), 'err'); }
    $('#b-pub').disabled = false;
  }

  async function reload(silent) {
    if (!silent && dirty() && !confirm('Perubahan yang belum diterbitkan akan hilang. Lanjutkan?')) return;
    msg($('#m-panel'), 'Memuat dari repo...');
    try { await fetchConfig(); renderAll(); msg($('#m-panel'), 'Data terbaru dari repo sudah dimuat.', 'ok'); }
    catch (e) { msg($('#m-panel'), explain(e), 'err'); }
  }

  function download() {
    readForm();
    var blob = new Blob([JSON.stringify(Object.assign({}, S.cfg, { updatedAt: new Date().toISOString() }), null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'config.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function addGame() {
    var id = $('#a-id').value.trim().toLowerCase(), name = $('#a-name').value.trim();
    if (!/^[a-z0-9][a-z0-9-]{1,23}$/.test(id)) return toast('ID hanya huruf kecil, angka, dan strip (2 sampai 24 karakter).', true);
    if (!name) return toast('Isi nama game.', true);
    if (S.cfg.games[id]) return toast('ID itu sudah dipakai.', true);
    S.cfg.games[id] = { name: name, status: 'dev', releaseAt: '', playUrl: '', note: '' };
    S.game = id; $('#a-id').value = ''; $('#a-name').value = ''; renderAll(); toast('Game ditambahkan. Jangan lupa terbitkan.');
  }

  /* ---------- sesi ---------- */
  function touch() {
    clearTimeout(S.idle);
    S.idle = setTimeout(function () { if (S.token) { lock('Sesi dikunci otomatis karena tidak aktif.'); } }, IDLE_MS);
  }
  function lock(why) {
    S.token = null; S.aes = null; S.cfg = null; S.sha = null;
    $('#l-pass').value = ''; show('v-login'); msg($('#m-login'), why || '', why ? 'ok' : '');
  }
  async function enter() {
    $('#who').textContent = 'Masuk sebagai ' + S.vault.user + ' · repo ' + S.vault.repo.owner + '/' + S.vault.repo.repo;
    $('#r-owner').value = S.vault.repo.owner; $('#r-repo').value = S.vault.repo.repo; $('#r-branch').value = S.vault.repo.branch; $('#r-path').value = S.vault.repo.path; $('#r-token').value = '';
    show('v-panel'); msg($('#m-panel'), 'Memuat konfigurasi...'); touch();
    try { await fetchConfig(); renderAll(); msg($('#m-panel'), ''); }
    catch (e) { S.cfg = DEFCFG(); S.game = 'truck'; S.orig = JSON.stringify(S.cfg.games); renderAll(); msg($('#m-panel'), explain(e), 'err'); }
  }

  /* ---------- alur: pemasangan, masuk, pengaturan ---------- */
  async function doSetup(e) {
    e.preventDefault();
    var m = $('#m-setup'), user = $('#s-user').value.trim(), pass = $('#s-pass').value;
    if (pass.length < 10) return msg(m, 'Password minimal 10 karakter.', 'err');
    if (pass !== $('#s-pass2').value) return msg(m, 'Password dan ulangannya tidak sama.', 'err');
    var repo = { owner: $('#s-owner').value.trim(), repo: $('#s-repo').value.trim(), branch: $('#s-branch').value.trim(), path: $('#s-path').value.trim().replace(/^\/+/, '') };
    var token = $('#s-token').value.trim();
    if (!/^[\w.-]+$/.test(repo.owner) || !/^[\w.-]+$/.test(repo.repo) || !repo.branch || !repo.path) return msg(m, 'Data repositori tidak valid.', 'err');
    $('#b-setup').disabled = true; msg(m, 'Memeriksa token ke GitHub...');
    try {
      S.token = token; S.vault = { repo: repo };
      var info = await gh('GET', '/repos/' + repo.owner + '/' + repo.repo);
      if (info.permissions && info.permissions.push === false) throw Object.assign(new Error('Token hanya bisa membaca repo.'), { status: 403 });
      msg(m, 'Mengamankan login...');
      var salt = crypto.getRandomValues(new Uint8Array(16)), d = await derive(pass, salt, ITER), sealed = await seal(d.key, token);
      S.vault = { v: 1, user: user, salt: b64(salt), iter: ITER, ver: b64(d.ver), iv: sealed.iv, ct: sealed.ct, repo: repo };
      save(S.vault); S.aes = d.key;
      $('#f-setup').reset(); msg(m, '');
      await enter();
    } catch (err) { S.token = null; msg(m, explain(err), 'err'); }
    $('#b-setup').disabled = false;
  }

  async function doLogin(e) {
    e.preventDefault();
    var m = $('#m-login'), v = load(); if (!v) return init();
    var f = {}; try { f = JSON.parse(localStorage.getItem(LSF)) || {}; } catch (x) {}
    if (f.until && Date.now() < f.until) return msg(m, 'Terlalu banyak percobaan. Coba lagi dalam ' + Math.ceil((f.until - Date.now()) / 1000) + ' detik.', 'err');
    $('#b-login').disabled = true; msg(m, 'Memeriksa...');
    try {
      var d = await derive($('#l-pass').value, ub64(v.salt), v.iter), ok = same(d.ver, ub64(v.ver)) && $('#l-user').value.trim() === v.user;
      if (!ok) {
        var n = (f.n || 0) + 1; localStorage.setItem(LSF, JSON.stringify({ n: n, until: n >= 3 ? Date.now() + Math.min(600, 10 * Math.pow(2, n - 3)) * 1000 : 0 }));
        await wait(700); msg(m, 'Nama pengguna atau password salah.', 'err');
      } else {
        localStorage.removeItem(LSF);
        S.token = await open(d.key, v.iv, v.ct); S.aes = d.key; S.vault = v; $('#l-pass').value = ''; msg(m, '');
        await enter();
      }
    } catch (err) { msg(m, 'Gagal membuka data login di perangkat ini. Coba reset login.', 'err'); }
    $('#b-login').disabled = false;
  }

  async function saveRepo() {
    var repo = { owner: $('#r-owner').value.trim(), repo: $('#r-repo').value.trim(), branch: $('#r-branch').value.trim(), path: $('#r-path').value.trim().replace(/^\/+/, '') };
    if (!/^[\w.-]+$/.test(repo.owner) || !/^[\w.-]+$/.test(repo.repo) || !repo.branch || !repo.path) return toast('Data repositori tidak valid.', true);
    var nt = $('#r-token').value.trim(), prev = { token: S.token, repo: S.vault.repo };
    try {
      if (nt) S.token = nt;
      S.vault.repo = repo;
      var info = await gh('GET', '/repos/' + repo.owner + '/' + repo.repo);
      if (info.permissions && info.permissions.push === false) throw Object.assign(new Error('Token hanya bisa membaca repo.'), { status: 403 });
      if (nt) { var s = await seal(S.aes, nt); S.vault.iv = s.iv; S.vault.ct = s.ct; }
      save(S.vault); $('#r-token').value = '';
      $('#who').textContent = 'Masuk sebagai ' + S.vault.user + ' · repo ' + repo.owner + '/' + repo.repo;
      toast('Pengaturan tersimpan.'); await reload(true);
    } catch (e) { S.token = prev.token; S.vault.repo = prev.repo; toast(explain(e), true); }
  }

  async function changePw() {
    var a = $('#p-new').value, b = $('#p-new2').value;
    if (a.length < 10) return toast('Password baru minimal 10 karakter.', true);
    if (a !== b) return toast('Password baru dan ulangannya tidak sama.', true);
    var salt = crypto.getRandomValues(new Uint8Array(16)), d = await derive(a, salt, ITER), s = await seal(d.key, S.token);
    S.vault.salt = b64(salt); S.vault.iter = ITER; S.vault.ver = b64(d.ver); S.vault.iv = s.iv; S.vault.ct = s.ct; S.aes = d.key;
    save(S.vault); $('#p-new').value = ''; $('#p-new2').value = ''; toast('Password diganti.');
  }

  function resetLogin() {
    if (!confirm('Hapus data login dan token dari perangkat ini? Kamu perlu memasang login lagi dengan token GitHub. Konfigurasi situs tidak berubah.')) return;
    localStorage.removeItem(LS); localStorage.removeItem(LSF); init();
  }

  function init() {
    S.token = null;
    if (!(window.crypto && crypto.subtle)) { $('#nocrypto').hidden = false; return show(''); }
    show(load() ? 'v-login' : 'v-setup');
  }

  $('#f-setup').addEventListener('submit', doSetup);
  $('#f-login').addEventListener('submit', doLogin);
  $('#b-reset').addEventListener('click', resetLogin);
  $('#b-logout').addEventListener('click', function () { lock('Kamu sudah keluar.'); });
  $('#b-pub').addEventListener('click', publish);
  $('#b-dl').addEventListener('click', download);
  $('#b-reload').addEventListener('click', function () { reload(false); });
  $('#b-add').addEventListener('click', addGame);
  $('#b-repo').addEventListener('click', saveRepo);
  $('#b-pw').addEventListener('click', changePw);
  ['click', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { if (S.token) touch(); }, { passive: true }); });
  window.addEventListener('beforeunload', function (e) { if (S.cfg && dirty()) { e.preventDefault(); e.returnValue = ''; } });
  bindForm();
  init();
})();
