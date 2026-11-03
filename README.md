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

## Hitung mundur rilis Truck Manager Nusantara
`js/countdown.js` menghitung mundur ke **Selasa, 3 November 2026 pukul 20.30 WIB** (`2026-11-03T20:30:00+07:00`). Elemen `[data-countdown]` menampilkan hari, jam, menit, detik. Saat waktu habis, kelas `tmn-live` dipasang di `<html>`: elemen `[data-pre]` disembunyikan dan `[data-live]` (tombol "Main", lencana "Sudah rilis") ditampilkan, tanpa perlu deploy ulang. Untuk mengubah jadwal, edit konstanta `TARGET` di berkas itu. Tautan main mengarah ke `https://truck-manajer-nusantara.web.app`.
