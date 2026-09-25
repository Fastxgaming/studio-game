# Folder `asset/`

Folder ini berisi berkas gambar statis yang dipakai `index.html`.

## `qris.png`

Ditampilkan di modal **Top Up Saldo** (`<img src="asset/qris.png">`) sebagai kode QRIS yang di-*screenshot* dan dipindai pemain lewat aplikasi e-wallet/m-banking saat membeli saldo.

File `qris.png` saat ini sudah berisi **QRIS asli** merchant "Studio Game" (NMID: ID1026601737921) — bukan lagi placeholder.

**Kalau suatu saat perlu ganti ke QRIS lain:**

1. Ambil gambar QRIS resmi dari akun merchant e-wallet/QRIS milikmu (mis. lewat aplikasi bank, GoPay Merchant, OVO Merchant, ShopeePay Merchant, atau QRIS statis dari penyedia lain).
2. Simpan sebagai file **PNG**, disarankan persegi dengan latar putih supaya pas dengan bingkai di modal.
3. Beri nama persis **`qris.png`**, lalu timpa (replace) file di folder ini.
4. Tidak perlu ubah kode apa pun — `index.html` sudah otomatis memuat `asset/qris.png`.

> ⚠️ QRIS yang terpasang di sini akan menerima pembayaran sungguhan dari pemain. Pastikan itu QRIS akun resmi milikmu/perusahaanmu. Kalau repository ini bersifat publik, siapa pun yang membuka repo bisa melihat & memindai QRIS ini — pastikan itu memang yang kamu inginkan (mis. QRIS bisnis/merchant, bukan QRIS pribadi yang ingin dijaga privasinya).

