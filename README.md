# ⛽ Pertama Manager ID: Nusantara Edition

**Game simulasi bisnis (tycoon) distribusi BBM & LPG berbasis web**, dimainkan langsung di browser dalam satu file HTML. Pemain berperan sebagai direktur perusahaan energi swasta yang membangun jaringan distribusi bahan bakar dari kilang pusat hingga ke SPBU-SPBU di seluruh Indonesia.

> ⚠️ **Disclaimer:** Ini adalah proyek simulasi/fan-made yang **terinspirasi** dari model bisnis distribusi hilir migas ala PT Pertamina Patra Niaga (skema SPBU COCO/DODO, kilang, depo, armada mobil tangki BBM & LPG, dsb). Game ini **bukan produk resmi, bukan afiliasi, dan tidak didukung oleh** PT Pertamina (Persero) atau PT Pertamina Patra Niaga. Semua nama perusahaan, kode SPBU, dan data di dalamnya adalah fiktif/acak untuk keperluan gameplay.

---

## 🎮 Tentang Game

Dimulai dengan modal awal Rp 650 juta dan satu kilang pusat aktif (**Kilang Tuban**), pemain harus:

- Membeli dan merawat armada truk tangki BBM & LPG,
- Merekrut kru (supir & kernet) untuk mengoperasikan truk,
- Mengirim pasokan ke SPBU sebelum stoknya habis,
- Mengembangkan jaringan lewat kemitraan SPBU baru (skema DODO),
- Menjaga arus kas tetap positif sambil membayar pajak dan gaji.

Progres disimpan otomatis ke **cloud (Firebase)** lewat sistem akun, sehingga game bisa dilanjutkan dari perangkat lain, dan kinerja perusahaan dapat dibandingkan dengan pemain lain lewat leaderboard publik.

## ✨ Fitur Utama

### 🗺️ Peta & Kilang (Overview)
- Peta interaktif Indonesia (Leaflet.js) menampilkan lokasi kilang/depo dan seluruh SPBU secara real-time, lengkap dengan animasi truk yang sedang dalam perjalanan.
- Status kilang pusat & cabang (aktif/terkunci) beserta stok bahan bakar mentah.
- Fitur transfer stok antar kilang/depo.
- Pembelian pasokan tambahan ke Kilang Tuban saat stok menipis.

### 🚛 Dealer Armada
- Katalog truk tangki BBM (dengan kompartemen bersekat, bisa membawa beberapa jenis BBM sekaligus tanpa tercampur).
- Katalog truk LPG: *pressure tanker* & *skid tank* (LPG curah) serta truk sangkar (tabung 3 kg & 12 kg).
- Simulasi biaya kepemilikan kendaraan: pembelian, uji KIR, STNK/BBN, dan pelat nomor.

### ⛽ Dispatch Pengiriman BBM & LPG
- Pemilihan SPBU tujuan, unit armada, serta pasangan supir & kernet yang bertugas.
- Surat Jalan digital dengan **tanda tangan digital** sebagai konfirmasi pengiriman.
- Pendapatan cair otomatis setelah truk tiba dan selesai bongkar muatan.
- Filter pengiriman per wilayah/provinsi di seluruh Nusantara.

### 📦 Sistem Pesanan Otomatis SPBU
- Stok tiap SPBU menurun seiring waktu (simulasi penjualan riil ke konsumen).
- Saat stok menipis (≤ 50% kapasitas tangki timbun), SPBU otomatis membuat pesanan ke perusahaan pemain — muncul dalam gelombang, maksimal 5 pesanan per gelombang.
- Pesanan yang tidak dipenuhi dalam batas waktu (10 menit real-time) otomatis dibatalkan dan SPBU "beralih ke pesaing".
- Bonus keuntungan tambahan untuk setiap pesanan yang berhasil dipenuhi.

### 🏪 Kemitraan SPBU (DODO)
- Setiap kota dimulai dengan 1 SPBU milik perusahaan (COCO). Pemain dapat menyetujui izin mitra untuk membuka SPBU baru (DODO).
- Mitra membayar biaya izin di awal + iuran operasional bulanan.
- Mitra yang menunggak lebih dari periode tenggang akan diblokir/lisensinya dicabut, dan SPBU tersebut bisa diambil alih perusahaan.

### 👷 SDM: Driver & Kernet
- Pool personel supir & kernet dengan rating kualitas dan riwayat pengalaman.
- Sistem **reputasi**: naik perlahan setiap tugas selesai tanpa insiden, turun jika terjadi pelanggaran — reputasi rendah meningkatkan risiko pelanggaran pada tugas berikutnya.
- Truk tidak bisa dikirim tanpa pasangan supir & kernet yang ditugaskan.

### 🔄 Bursa P2P (Marketplace Antar Pemain)
- Jual-beli unit truk bekas antar pemain menggunakan akun Firebase nyata.
- Truk yang dipasarkan langsung ditarik dari garasi selama iklan aktif.
- Dana hasil penjualan diklaim lewat kotak notifikasi setelah pembeli membayar.

### 💰 Laporan Keuangan & Pajak
- Laporan arus kas mencatat semua transaksi: pembelian armada, gaji kru, biaya perizinan kendaraan, hingga pemasukan pengiriman.
- Laporan Laba Rugi otomatis.
- **Simulasi PPh Badan** yang merujuk pada regulasi perpajakan Indonesia sungguhan:
  - Tarif umum 22% (UU No. 7/1983 s.t.d.t.d UU No. 7/2021 tentang HPP, Pasal 17 ayat 1 huruf b).
  - Fasilitas diskon tarif 50% (efektif 11%) untuk peredaran bruto tertentu sesuai Pasal 31E ayat (1) UU No. 36/2008.
  - *(Catatan: ini simulasi edukatif, bukan konsultasi pajak resmi.)*

### 🏆 Leaderboard & Akun
- Autentikasi pemain memakai **Firebase Authentication** (daftar/masuk via email).
- Progres tersimpan otomatis ke **Firestore** (cloud save), bisa lanjut dari device lain.
- Leaderboard publik membandingkan kas, jumlah armada, dan jumlah kilang/depo antar pemain, diperbarui berkala.
- Sistem top-up saldo dengan verifikasi/registrasi pembayaran.

### 📜 Log & Notifikasi
- Log kejadian real-time (kategori umum, keuangan, truk & perjalanan) dengan sistem toast notification.
- Panduan tutorial singkat berjalan otomatis untuk pemain baru.

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi |
|---|---|
| UI/Styling | [Tailwind CSS](https://tailwindcss.com/) (CDN) |
| Peta interaktif | [Leaflet.js](https://leafletjs.com/) 1.9.4 + tile CartoDB |
| Ikon | [Font Awesome](https://fontawesome.com/) 6.4.0 |
| Grafik/chart | [Chart.js](https://www.chartjs.org/) |
| Autentikasi & Database | [Firebase](https://firebase.google.com/) (Authentication + Firestore) |
| Bahasa | HTML, CSS, JavaScript (vanilla, single-file, tanpa build tool) |

Seluruh logic game (ekonomi, stok, armada, pajak, dsb.) berjalan sepenuhnya di sisi klien (client-side), dengan Firebase hanya digunakan untuk akun, cloud save, dan leaderboard.

## 🗂️ Struktur Proyek

```
.
├── index.html              # Struktur halaman (markup saja)
├── css/
│   └── style.css           # Semua custom CSS (animasi, scrollbar, dsb.)
├── js/
│   ├── firebase.js         # Modul Firebase (Auth + Firestore) — dimuat sbg <script type="module">
│   └── app.js               # Logic utama game (ekonomi, armada, peta, dsb.)
├── asset/
│   ├── qris.png             # QRIS asli merchant "Studio Game" untuk fitur Top Up Saldo
│   └── README.md            # Panduan mengganti QRIS placeholder dengan QRIS asli
└── .github/workflows/
    └── deploy.yml           # GitHub Actions: auto-deploy ke GitHub Pages tiap push ke `main`
```

File sudah dipecah dari satu file HTML monolitik supaya lebih mudah dibuka & di-*edit* di VS Code (dengan syntax highlighting CSS/JS yang benar, IntelliSense, dsb.), tanpa mengubah perilaku aplikasi sama sekali.

> **Penting — urutan pemuatan skrip tidak boleh diubah:** `js/firebase.js` dimuat lebih dulu sebagai `type="module"`, baru kemudian `js/app.js` sebagai skrip biasa. `app.js` bergantung pada `window.fb` yang di-*set* oleh `firebase.js`, dan sebaliknya `firebase.js` memanggil balik beberapa fungsi/variabel global (`authChecked`, `maybeFinish`) yang dideklarasikan di `app.js`. Karena skrip modul otomatis di-*defer*, urutan ini tetap aman selama kedua tag `<script>` di `index.html` tidak dipindah atau diberi atribut `defer`/`async` tambahan.

## 🌐 Menjalankan di GitHub Pages

Repo ini sudah dilengkapi workflow GitHub Actions (`.github/workflows/deploy.yml`) yang otomatis men-deploy isi repo ke GitHub Pages setiap kali ada push ke branch `main`. Langkah aktivasinya:

1. Push seluruh isi folder ini (termasuk folder `.github`) ke repository GitHub-mu.
2. Buka **Settings → Pages** di repo tersebut.
3. Pada bagian **Build and deployment → Source**, pilih **GitHub Actions** (bukan "Deploy from a branch").
4. Push apa pun ke `main` (atau jalankan manual lewat tab **Actions → Deploy to GitHub Pages → Run workflow**) — situs akan otomatis ter-build dan tayang di `https://<username>.github.io/<nama-repo>/`.
5. Tambahkan domain `https://<username>.github.io` ke **Authorized domains** di Firebase Console (Authentication → Settings), agar fitur daftar/masuk akun tidak diblokir Firebase.

## 🤝 Kontribusi

Kontribusi, laporan bug, dan ide fitur baru sangat terbuka lewat *Issues* atau *Pull Request* di repository ini.

## 📄 Lisensi

Tambahkan lisensi pilihan Anda di sini (mis. MIT License) sebelum mempublikasikan repository secara publik.

---

*Dibuat sebagai proyek simulasi/edukasi mandiri, bukan produk atau afiliasi resmi PT Pertamina Patra Niaga.*
