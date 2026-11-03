# Studio Game

Situs resmi Studio Game: Migas Manager ID, Dealer Manager ID (main ditutup sementara), dan Truck Manager Nusantara (rilis 3 November 2026 pukul 20.30 WIB).

Situs statis tanpa build. Setiap halaman berada di folder sendiri sehingga URL bersih:

| Halaman | URL |
|---|---|
| Beranda | `/` |
| Migas Manager ID | `/migas/` |
| Dealer Manager ID | `/dealer/` |
| Truck Manager Nusantara | `/truck/` |

## Publikasi di GitHub Pages
Settings → Pages → Deploy from a branch → pilih branch dan folder tempat `index.html` berada.

## Menjalankan lokal
`python3 -m http.server 8000` di folder ini, lalu buka http://localhost:8000

## Status rilis dan Panel Admin
Status rilis game (dalam pembuatan, hitung mundur, sudah rilis) diatur dari **`/admin/`**, tanpa Firebase dan tanpa server.

**Cara kerja**
- `data/config.json` menyimpan status, waktu rilis, link main, dan catatan tiap game.
- `js/release.js` membaca berkas itu di setiap halaman dan mengatur tampilan. Bila berkas gagal dimuat, dipakai nilai bawaan di dalam `release.js`.
- Panel admin mengubah `data/config.json` dengan meng-commit lewat GitHub API. GitHub Pages memperbarui situs sekitar 1 menit setelahnya.
- Status `countdown` otomatis menjadi "Sudah rilis" saat waktunya tiba, tanpa perlu membuka panel.

**Pemasangan pertama (sekali per perangkat)**
1. Buat token GitHub *fine-grained*: akses hanya ke repo situs, izin `Contents: Read and write`.
2. Buka `/admin/`, isi nama pengguna dan password buatanmu, data repo, lalu tempel token.
3. Login ini hanya tersimpan di browser perangkat itu: password diverifikasi dengan PBKDF2 (SHA-256, 250.000 putaran) dan token dienkripsi AES-GCM. Tidak ada rahasia yang masuk ke repo.
4. Perangkat lain perlu dipasang sendiri. Lupa password: tombol "Reset login" lalu pasang ulang.

**Catatan keamanan**: yang benar-benar melindungi situs adalah token GitHub. Halaman `/admin/` bisa dibuka siapa saja, tetapi tanpa password dan token tidak ada yang bisa diterbitkan. Jaga token, beri masa berlaku, dan cabut dari GitHub bila perangkat hilang. Sesi terkunci otomatis setelah 15 menit tidak aktif.

**Atribut untuk halaman**
- `data-show="wait dev live"`: tampil hanya pada status itu (wait = hitung mundur, dev = dalam pembuatan, live = sudah rilis).
- `data-countdown` dengan `data-u="d|h|m|s"`: kotak hitung mundur.
- `data-tx="dateLong|dateTime|dateShort|note|name"`: teks dari konfigurasi. Tambahkan `data-hide-empty` agar sembunyi saat kosong.
- `data-href="playUrl"`: tautan main.
- `data-g="id-game"`: memilih game; bila tidak ditulis, dianggap `truck`. Game baru ditambahkan lewat panel admin, lalu beri atribut ini pada elemen terkait.
