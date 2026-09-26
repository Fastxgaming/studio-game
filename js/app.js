        // ===== LAYAR LOADING & PLAY GAME (sebelum Daftar/Masuk) =====
        // Satu-satunya tempat untuk update nomor versi - otomatis tampil di layar loading & layar "Main Sekarang".
        const APP_VERSION = '1.0.4';
        (function showAppVersion() {
            const label = 'v' + APP_VERSION;
            const a = document.getElementById('app-version-loading'); if (a) a.textContent = label;
            const b = document.getElementById('app-version-splash'); if (b) b.textContent = label;
        })();
        let loadingAnimDone = false, authChecked = false, loadingHidden = false;
        function hideLoadingOverlay() {
            if (loadingHidden) return;
            loadingHidden = true;
            const lo = document.getElementById('loading-overlay');
            if (lo) {
                lo.style.opacity = '0';
                lo.style.pointerEvents = 'none';
                setTimeout(() => lo.classList.add('hidden'), 450);
            }
        }
        function finishLoadingIfReady() {
            hideLoadingOverlay();
            // Selalu tampilkan layar "Main Sekarang" dulu, walau sesi login lama sudah otomatis dipulihkan Firebase.
            // Catatan: layar ini langsung tampil solid (TIDAK ikut di-fade transparan) supaya saat loading-overlay
            // memudar di atasnya, yang kelihatan di baliknya adalah layar "Main Sekarang" yang sudah utuh -
            // bukan sekilas tampilan in-game yang ada di lapisan paling bawah.
            const sp = document.getElementById('splash-overlay');
            if (sp) {
                sp.style.opacity = '1';
                sp.classList.remove('hidden');
            }
        }
        function maybeFinish() { if (loadingAnimDone && authChecked) finishLoadingIfReady(); }
        // Fallback: kalau Firebase gagal merespons (mis. offline), jangan biarkan pemain terjebak di layar loading
        setTimeout(() => { if (!authChecked) { authChecked = true; maybeFinish(); } }, 8000);
        (function loadingSequence() {
            // Bar mengisi TERUS-MENERUS lewat requestAnimationFrame (bukan loncat per tahap seperti sebelumnya) -
            // label & persen di bawahnya cuma "menumpang" progres asli, jadi visualnya selalu mulus walau
            // teksnya berubah bertahap. Total durasi sengaja dibuat agak lama (±10 detik) biar tidak terburu-buru.
            const steps = [[15, 'Menyiapkan aset game'], [35, 'Memuat peta Nusantara'], [55, 'Menyiapkan armada & kilang'], [75, 'Menyinkronkan data SPBU'], [90, 'Menghubungkan ke server'], [100, 'Siap main!']];
            const bar = document.getElementById('loading-bar'), txt = document.getElementById('loading-text');
            const truck = document.getElementById('loading-truck'), pct = document.getElementById('loading-pct');
            const TOTAL_MS = 10000;
            const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            let start = null, shownIdx = -1;
            function setLabel(idx) {
                if (idx === shownIdx) return;
                shownIdx = idx;
                const [, label] = steps[idx];
                txt.innerHTML = label + (idx < steps.length - 1 ? '<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>' : '');
            }
            function frame(now) {
                if (start === null) start = now;
                const t = Math.min((now - start) / TOTAL_MS, 1);
                const p = easeInOutQuad(t) * 100;
                bar.style.width = p + '%';
                if (truck) truck.style.left = 'calc(' + p + '% - ' + (p >= 99.5 ? 16 : 8) + 'px)';
                if (pct) pct.textContent = Math.round(p) + '%';
                let idx = 0;
                for (let i = 0; i < steps.length; i++) { if (p + 0.5 >= steps[i][0]) idx = i; }
                setLabel(idx);
                if (t < 1) requestAnimationFrame(frame);
                else { loadingAnimDone = true; setTimeout(maybeFinish, 400); }
            }
            requestAnimationFrame(frame);
        })();
        // Overlay transisi halus (fade) supaya perpindahan layar tidak terasa "tiba-tiba"
        function coverScreen(afterCovered) {
            const t = document.getElementById('transition-overlay');
            t.classList.remove('hidden');
            void t.offsetWidth; // paksa reflow biar transisi opacity kepakai
            t.style.opacity = '1';
            setTimeout(afterCovered, 280);
        }
        function uncoverScreen() {
            setTimeout(() => {
                const t = document.getElementById('transition-overlay');
                t.style.opacity = '0';
                setTimeout(() => t.classList.add('hidden'), 300);
            }, 220);
        }
        // Ditekan dari tombol "Main Sekarang". Kalau sesi login lama sudah siap di latar belakang, langsung masuk game;
        // kalau belum ada sesi, baru tampilkan form Daftar Akun / Masuk.
        function handlePlayClick() {
            if (currentAccount) {
                // Sesi sudah siap: fade dulu sebelum masuk ke in-game, biar mulus
                coverScreen(() => {
                    document.getElementById('splash-overlay').classList.add('hidden');
                    document.getElementById('auth-overlay').classList.add('hidden');
                    maybeShowTutorial(false);
                    uncoverScreen();
                });
            } else {
                document.getElementById('splash-overlay').classList.add('hidden');
                document.getElementById('auth-overlay').classList.remove('hidden');
            }
        }
        function backToSplash() {
            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('splash-overlay').classList.remove('hidden');
        }

        // ===== TUTORIAL DALAM GAME (untuk pemain baru) =====
        const TUTORIAL_STEPS = [
            { icon: 'fa-gas-pump', title: 'Selamat Datang di Pertama Manager ID!', desc: 'Kamu jadi bos perusahaan distribusi BBM & LPG. Modal awal Rp 650 Juta, Kilang Tuban sudah aktif dengan stok 750.000 Bbl. Tutorial singkat ini menunjukkan langkah pertama supaya kamu tidak bingung.' },
            { icon: 'fa-store', title: '1. Beli Armada di Dealer', desc: 'Buka tab Dealer untuk beli truk tangki BBM atau LPG. Setiap pembelian sudah termasuk biaya Uji KIR, STNK, dan plat nomor, jadi truk langsung siap jalan.' },
            { icon: 'fa-user-shield', title: '2. Rekrut Supir & Kernet', desc: 'Buka tab SDM Driver untuk merekrut supir dan kernet. Truk butuh keduanya sebelum bisa dikirim ke SPBU, jadi rekrut secukupnya sesuai jumlah armada.' },
            { icon: 'fa-gas-pump', title: '3. Kirim BBM / LPG ke SPBU', desc: 'Buka tab POM BBM atau LPG, pilih truk + supir + kernet, lalu tanda tangani Surat Jalan. Pendapatan cair otomatis setelah truk tiba dan selesai bongkar muatan.' },
            { icon: 'fa-bell', title: '4. Pantau Pesanan SPBU', desc: 'Kalau stok BBM di suatu SPBU menipis, SPBU otomatis memesan ke perusahaanmu. Cek tab Pesanan SPBU secara rutin dan kirim sebelum batas waktu habis, atau SPBU beralih ke pesaing.' },
            { icon: 'fa-right-left', title: '5. Bursa P2P', desc: 'Punya truk nganggur? Buka tab Armada, lalu klik tombol "Jual ke Bursa P2P" di kartu truk yang tidak bertugas untuk langsung pasang iklan (harga wajar otomatis terisi, tinggal sesuaikan). Bisa juga lewat tab Bursa P2P langsung, atau beli truk bekas dari pemain lain dengan harga lebih murah daripada beli baru di Dealer.' },
            { icon: 'fa-trophy', title: '6. Naik Peringkat & Cek Laporan', desc: 'Tab Peringkat membandingkan kas, armada, dan kilang/depo milikmu dengan pemain lain. Tab Laporan menampilkan pemasukan, pengeluaran, dan kewajiban PPh Badan perusahaanmu.' },
            { icon: 'fa-circle-check', title: 'Selamat Berbisnis!', desc: 'Itu dia dasar-dasarnya. Kamu bisa buka tutorial ini lagi kapan saja lewat tombol Tutorial di bagian atas layar. Selamat membangun kerajaan logistik energimu!' }
        ];
        let tutStep = 0;
        function openTutorial(isNew) {
            tutStep = 0;
            document.getElementById('custom-modal').classList.add('hidden');
            renderTutorialStep();
            document.getElementById('tutorial-overlay').classList.remove('hidden');
        }
        function renderTutorialStep() {
            const s = TUTORIAL_STEPS[tutStep], last = tutStep === TUTORIAL_STEPS.length - 1;
            document.getElementById('tut-icon').innerHTML = `<i class="fa-solid ${s.icon}"></i>`;
            document.getElementById('tut-title').innerText = s.title;
            document.getElementById('tut-desc').innerText = s.desc;
            document.getElementById('tut-dots').innerHTML = TUTORIAL_STEPS.map((_, i) => `<span class="inline-block w-1.5 h-1.5 rounded-full ${i === tutStep ? 'bg-teal-400' : 'bg-gray-700'}"></span>`).join('');
            document.getElementById('tut-skip').classList.toggle('hidden', last);
            document.getElementById('tut-next').innerHTML = last ? '<i class="fa-solid fa-check mr-1.5"></i>Mulai Main' : 'Lanjut <i class="fa-solid fa-arrow-right ml-1.5"></i>';
        }
        function nextTutorial() {
            if (tutStep >= TUTORIAL_STEPS.length - 1) { document.getElementById('tutorial-overlay').classList.add('hidden'); return; }
            tutStep++; renderTutorialStep();
        }
        function skipTutorial() { document.getElementById('tutorial-overlay').classList.add('hidden'); }

        let companyCash = 650000000;
        // ===== EKONOMI (sesuaikan di sini) =====
        const ECO = { bblPerKl: 6.2898, jualKl: 7600000, jualTon: 10400000, hppTon: 9500000, bonusPesanan: 0.06, gajiSupir: [4500000, 30000], gajiKernet: [3500000, 20000], gajiMekanik: [4000000, 25000], gajiNahkoda: [6000000, 45000], gajiABK: [3800000, 22000], biayaKirimKl: 350000, biayaKirimTon: 500000 };
        let totalIncome = 0;
        let totalExpense = 0;

        let loadedSpbuList = [];
        const isOp = s => s.is_approved && !s.blocked;
        let mapMarkers = [];
        let kilangMarkers = [];
        let pendingTruckPurchase = null;

        // DATA KILANG & DEPO
        let refineryData = [
            {
                id: 'KILANG-01',
                nama: 'Kilang Tuban',
                tipe: 'Pusat Utama',
                lat: -6.812400,
                lon: 111.962100,
                is_unlocked: true,
                stok_current: 1000000,
                stok_max: 1000000,
                unit: 'Bbl',
                harga_beli: 0,
                mekanikId: 'BUILTIN'
            },
            {
                id: 'KILANG-02',
                nama: 'TBBM Perak Surabaya',
                tipe: 'Depo Cabang BBM',
                lat: -7.201400,
                lon: 112.728100,
                is_unlocked: false,
                stok_current: 0,
                stok_max: 100000,
                unit: 'Bbl',
                harga_beli: 30000000000,
                mekanikId: null
            },
            {
                id: 'KILANG-03',
                nama: 'Depo LPG Gresik',
                tipe: 'Depo Cabang LPG',
                lat: -7.151200,
                lon: 112.651200,
                is_unlocked: false,
                stok_current: 0,
                stok_max: 20000,
                unit: 'Ton',
                harga_beli: 40000000000,
                mekanikId: null
            }
        ];

        // POOL 1: ARMADA (FISIK TRUK KENDARAAN)
        let companyFleet = [];

        // POOL 2: SDM PERSONEL DRIVER & KERNET (LENGKAP RATING & PELANGGARAN)
        let companyCrew = [];

        const rawSpbuData = [
          {
            "kabupaten_kota": "Ngawi (Perbatasan Barat)",
            "total_spbu": 5,
            "list_spbu": [
              {"kode": "JT-632-01", "nama": "SPBU Mantingan (Jalan Raya Solo-Ngawi)", "lat": -7.362145, "lon": 111.161042, "tipe": "DODO"},
              {"kode": "JT-632-22", "nama": "SPBU Rest Area KM 575 A Tol Solo-Ngawi", "lat": -7.421520, "lon": 111.354110, "tipe": "COCO"},
              {"kode": "JT-632-23", "nama": "SPBU Rest Area KM 575 B Tol Solo-Ngawi", "lat": -7.421890, "lon": 111.354890, "tipe": "COCO"},
              {"kode": "JT-632-05", "nama": "SPBU Ngawi Kota / Ringroad Timur", "lat": -7.402100, "lon": 111.452100, "tipe": "DODO"},
              {"kode": "JT-632-09", "nama": "SPBU Geneng Ngawi", "lat": -7.489120, "lon": 111.441020, "tipe": "DODO"}
            ]
          },
          {
            "kabupaten_kota": "Tuban & Bojonegoro (Area Kilang Utama)",
            "total_spbu": 4,
            "list_spbu": [
              {"kode": "JT-623-01", "nama": "SPBU Jenu (Dekat Kilang Tuban)", "lat": -6.812400, "lon": 111.962100, "tipe": "COCO"},
              {"kode": "JT-623-08", "nama": "SPBU Tuban Kota Pantura", "lat": -6.894120, "lon": 112.054120, "tipe": "DODO"},
              {"kode": "JT-621-02", "nama": "SPBU Veteran Bojonegoro", "lat": -7.158210, "lon": 111.881200, "tipe": "DODO"},
              {"kode": "JT-621-11", "nama": "SPBU Kalitidu Bojonegoro", "lat": -7.124100, "lon": 111.751200, "tipe": "DODO"}
            ]
          },
          {
            "kabupaten_kota": "Surabaya & Sidoarjo (Hub Perak)",
            "total_spbu": 5,
            "list_spbu": [
              {"kode": "JT-601-65", "nama": "SPBU COCO Dr. Soetomo Surabaya", "lat": -7.281400, "lon": 112.738100, "tipe": "COCO"},
              {"kode": "JT-601-80", "nama": "SPBU A. Yani Gayungan Surabaya", "lat": -7.318250, "lon": 112.732100, "tipe": "COCO"},
              {"kode": "JT-601-12", "nama": "SPBU Margomulyo Industri", "lat": -7.241200, "lon": 112.671200, "tipe": "DODO"},
              {"kode": "JT-612-09", "nama": "SPBU Bungurasih Sidoarjo", "lat": -7.351020, "lon": 112.724120, "tipe": "COCO"},
              {"kode": "JT-612-15", "nama": "SPBU Jenggolo Sidoarjo", "lat": -7.441200, "lon": 112.718200, "tipe": "DODO"}
            ]
          },
          {
            "kabupaten_kota": "Situbondo & Banyuwangi",
            "total_spbu": 5,
            "list_spbu": [
              {"kode": "JT-683-05", "nama": "SPBU Karangasem Situbondo Kota", "lat": -7.708210, "lon": 113.992140, "tipe": "DODO"},
              {"kode": "JT-683-12", "nama": "SPBU Panji Situbondo", "lat": -7.714200, "lon": 114.021400, "tipe": "DODO"},
              {"kode": "JT-684-02", "nama": "SPBU Ketapang Pelabuhan", "lat": -8.141200, "lon": 114.394120, "tipe": "COCO"},
              {"kode": "JT-684-10", "nama": "SPBU Kota Banyuwangi", "lat": -8.219210, "lon": 114.368140, "tipe": "DODO"},
              {"kode": "JT-684-18", "nama": "SPBU Genteng Banyuwangi", "lat": -8.361200, "lon": 114.152100, "tipe": "DODO"}
            ]
          }
        ];

        const newLocations = [
            { nama: "SPBU Krikilan Driyorejo", region: "Gresik & Mojokerto", lat: -7.3482, lon: 112.6051 },
            { nama: "SPBU Purwosari Pasuruan", region: "Pasuruan & Malang", lat: -7.7651, lon: 112.7214 },
            { nama: "SPBU Saradan Madiun", region: "Madiun & Nganjuk", lat: -7.5512, lon: 111.6210 },
            { nama: "SPBU Jatiroto Lumajang", region: "Probolinggo & Lumajang", lat: -8.1124, lon: 113.3421 },
            { nama: "SPBU Babat Lamongan", region: "Lamongan & Tuban", lat: -7.1102, lon: 112.2415 }
        ];


        // ===== WILAYAH NUSANTARA: [provinsi, prefix kode, [[kota, lat, lon, jumlah SPBU]]] =====
        const WILAYAH = [
          ['Jawa Timur','JT',[['Malang',-7.9797,112.6304,6],['Kediri',-7.848,112.0178,5],['Jember',-8.1845,113.6681,5],['Madiun',-7.6298,111.5239,4],['Mojokerto',-7.4726,112.4338,4],['Lamongan',-7.1167,112.4167,4],['Blitar',-8.0983,112.1681,4],['Pamekasan',-7.1568,113.4825,4]]],
          ['Jawa Tengah','JG',[['Semarang',-6.9667,110.4167,7],['Surakarta (Solo)',-7.5666,110.8283,6],['Magelang',-7.4797,110.2177,4],['Pekalongan',-6.8886,109.6753,4],['Tegal',-6.8694,109.1402,4],['Purwokerto',-7.4242,109.2396,5],['Kudus',-6.8048,110.8405,4],['Cilacap',-7.7188,109.0154,4]]],
          ['Jawa Barat','JB',[['Bandung',-6.9175,107.6191,7],['Cirebon',-6.7063,108.5571,5],['Tasikmalaya',-7.3274,108.2207,4],['Sukabumi',-6.9277,106.93,4],['Karawang',-6.3015,107.302,5],['Subang',-6.5715,107.7587,4],['Garut',-7.2279,107.9087,4]]],
          ['Jakarta & Jabodetabek','JK',[['Jakarta Pusat',-6.1865,106.8341,6],['Jakarta Utara',-6.1384,106.8632,6],['Jakarta Barat',-6.1683,106.7588,6],['Jakarta Selatan',-6.2615,106.8106,6],['Jakarta Timur',-6.225,106.9004,6],['Bogor',-6.5971,106.806,5],['Depok',-6.4025,106.7942,5],['Tangerang',-6.1783,106.6319,6],['Tangerang Selatan',-6.2885,106.718,5],['Bekasi',-6.2383,106.9756,6]]],
          ['Bali','BL',[['Denpasar',-8.6705,115.2126,6],['Badung (Kuta)',-8.722,115.1694,5],['Gianyar',-8.5449,115.3255,4],['Singaraja',-8.112,115.0882,4],['Tabanan',-8.5386,115.125,4],['Karangasem',-8.45,115.61,3]]],
          ['Sulawesi Utara','SU',[['Manado',1.4748,124.8421,6],['Bitung',1.4404,125.1917,4],['Tomohon',1.33,124.8333,3],['Kotamobagu',0.7333,124.3167,3]]],
          ['Sulawesi Tengah','ST',[['Palu',-0.8917,119.8707,5],['Poso',-1.395,120.752,3],['Luwuk',-0.95,122.787,3],['Donggala',-0.681,119.742,3]]],
          ['Sulawesi Barat','SB',[['Mamuju',-2.674,118.888,4],['Majene',-3.54,118.97,3],['Polewali Mandar',-3.432,119.343,3]]],
['Sulawesi Selatan','SS',[['Makassar',-5.1477,119.4327,7],['Gowa',-5.2159,119.4497,4],['Maros',-4.9887,119.5713,3],['Parepare',-4.0135,119.6255,3]]],
          ['Kalimantan','KL',[['Balikpapan (Kaltim)',-1.2379,116.8529,6],['Samarinda (Kaltim)',-0.5022,117.1536,5],['Bontang (Kaltim)',0.1333,117.5,3],['Banjarmasin (Kalsel)',-3.3186,114.5944,5],['Banjarbaru (Kalsel)',-3.442,114.83,3],['Pontianak (Kalbar)',-0.0263,109.3425,5],['Singkawang (Kalbar)',0.906,108.987,3],['Palangka Raya (Kalteng)',-2.2161,113.9135,4],['Sampit (Kalteng)',-2.533,112.95,3],['Tarakan (Kaltara)',3.3,117.6333,3]]]
        ];
        const JALAN = ['Jl. Jend. Sudirman','Jl. A. Yani','Jl. Diponegoro','Jl. Gatot Subroto','Jl. Raya Utara','Jl. Pahlawan','Jl. Imam Bonjol','Jl. Veteran','Jl. Merdeka','Jl. Pemuda','Jl. Hasanuddin','Jl. Ahmad Dahlan','Jl. Lingkar Kota','Jl. Trans Regional'];
        (function buildWilayah() {
            let ci = 300;
            WILAYAH.forEach(([prov, pfx, cities]) => cities.forEach(([kota, lat, lon, n]) => {
                let seed = ci * 7919 + 13; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
                const jl = JALAN.slice().sort(() => rand() - 0.5);
                const list = [];
                for (let k = 0; k < n; k++) list.push({ kode: `${pfx}-${ci}-${String(k + 1).padStart(2, '0')}`, nama: `SPBU ${jl[k % jl.length]} ${kota.replace(/ \(.*\)/, '')}`, lat: +(lat + (rand() - 0.5) * 0.09).toFixed(6), lon: +(lon + (rand() - 0.5) * 0.09).toFixed(6), tipe: rand() < 0.45 ? 'COCO' : 'DODO' });
                rawSpbuData.push({ kabupaten_kota: kota, provinsi: prov, total_spbu: n, list_spbu: list });
                ci++;
            }));
        })();

        // Depo/TBBM regional (dibeli pemain, jadi titik berangkat truk terdekat)
        refineryData.push(...[['TBBM Plumpang Jakarta',-6.1216,106.8967,25e9],['TBBM Tanjung Emas Semarang',-6.949,110.426,18e9],['TBBM Padalarang Bandung',-6.84,107.48,15e9],['TBBM Manggis Bali',-8.5,115.52,18e9],['TBBM Bitung Sulut',1.45,125.19,16e9],['TBBM Donggala Sulteng',-0.66,119.74,15e9],['Depo Mamuju Sulbar',-2.67,118.89,12e9],['TBBM Balikpapan Kaltim',-1.27,116.8,22e9],['TBBM Banjarmasin Kalsel',-3.29,114.57,15e9],['TBBM Pontianak Kalbar',-0.04,109.32,15e9],['Depo Palangka Raya Kalteng',-2.25,113.9,12e9],['Depo Tarakan Kaltara',3.31,117.62,14e9],['TBBM Makassar Sulsel',-5.14,119.43,20e9]]
            .map((d, i) => ({ id: 'KILANG-' + String(4 + i).padStart(2, '0'), nama: d[0], tipe: 'Depo Cabang BBM', lat: d[1], lon: d[2], is_unlocked: false, stok_current: 0, stok_max: 100000, unit: 'Bbl', harga_beli: d[3] * 2, mekanikId: null })));

        // ===== KAPASITAS DEPO PER JENIS PRODUK (Pusat & Cabang) =====
        // Setiap Kilang/Depo kini punya tangki terpisah per jenis BBM & LPG, masing-masing bisa di-upgrade sendiri.
        // refineRatio = jumlah Bbl bahan mentah yang dibutuhkan untuk mengolah 1 unit produk ini (BBM pakai rasio Bbl->KL yang sama dengan ECO.bblPerKl, LPG disamakan 1:1 seperti konvensi transfer kapal/darat).
        // refineRate  = sisa dari desain lama, tidak dipakai lagi untuk kecepatan; BBL->BBM sekarang diproses manual lewat tombol Konversi (lihat convertBblKeProduk & BBL_CONVERT_STEP).
        const PRODUCT_META = {
            pertalite:      { label: 'Pertalite',      unit: 'KL',  icon: 'fa-gas-pump',       color: '#22c55e', step: 3000, baseCost: 900e6,  buyPrice: 10500000, refineRatio: ECO.bblPerKl, refineRate: 40 },
            pertamax:       { label: 'Pertamax',       unit: 'KL',  icon: 'fa-gas-pump',       color: '#3b82f6', step: 2500, baseCost: 950e6,  buyPrice: 13500000, refineRatio: ECO.bblPerKl, refineRate: 30 },
            pertamax_turbo: { label: 'Pertamax Turbo', unit: 'KL',  icon: 'fa-bolt',           color: '#a855f7', step: 1500, baseCost: 1100e6, buyPrice: 16000000, refineRatio: ECO.bblPerKl, refineRate: 18 },
            solar:          { label: 'Solar',          unit: 'KL',  icon: 'fa-oil-can',        color: '#f59e0b', step: 3000, baseCost: 850e6,  buyPrice: 9800000,  refineRatio: ECO.bblPerKl, refineRate: 40 },
            dexlite:        { label: 'Dexlite',        unit: 'KL',  icon: 'fa-oil-can',        color: '#06b6d4', step: 2000, baseCost: 1000e6, buyPrice: 13200000, refineRatio: ECO.bblPerKl, refineRate: 22 },
            lpg_curah:      { label: 'LPG Curah',      unit: 'Ton', icon: 'fa-truck-ramp-box', color: '#f97316', step: 1500, baseCost: 1200e6, buyPrice: 9500000 },
            lpg_tabung:     { label: 'LPG Tabung',     unit: 'Ton', icon: 'fa-dolly',          color: '#ef4444', step: 1200, baseCost: 1050e6 }
        };
        // Ukuran sekali klik tombol "Konversi BBL -> BBM" (BBL diolah manual lewat tombol, bukan otomatis lagi).
        const BBL_CONVERT_STEP = { pertalite: 5000, pertamax: 4000, pertamax_turbo: 2000, solar: 5000, dexlite: 3000 };
        const REFINE_TICK_MS = 2000; // dipakai untuk durasi kedip animasi "Diolah" saat tombol konversi diklik
        const KAP_GROUP = {
            'Pusat Utama': Object.keys(PRODUCT_META),
            'Depo Cabang BBM': ['pertalite', 'pertamax', 'pertamax_turbo', 'solar', 'dexlite'],
            'Depo Cabang LPG': ['lpg_curah', 'lpg_tabung']
        };
        function initKapasitasDepo() {
            refineryData.forEach(k => {
                if (k.kap) return;
                const keys = KAP_GROUP[k.tipe] || [];
                k.kap = {};
                keys.forEach(key => {
                    const isLpg = key.startsWith('lpg');
                    const startMax = k.tipe === 'Pusat Utama' ? (isLpg ? 6000 : 40000) : (isLpg ? 4000 : 15000);
                    k.kap[key] = { max: startMax, cur: 0, level: 0 };
                });
                if (k.id === 'KILANG-01') {
                    // Awal main: semua stok produk Kilang Tuban penuh (100%), bukan sebagian.
                    Object.values(k.kap).forEach(s => { s.cur = s.max; });
                }
            });
        }
        initKapasitasDepo();

        // ===== KOTAK NOTIFIKASI (sistem + klaim top up) =====
        let notifs = [], notifUnread = 0, pendingTopups = [];
        // ===== EFEK SUARA (Web Audio API, nada sintetis - tanpa file audio eksternal, ringan & offline) =====
        let audioCtx = null, soundEnabled = true;
        try { const sv = localStorage.getItem('pmid_sound'); if (sv !== null) soundEnabled = sv === '1'; } catch (e) { /* localStorage tidak tersedia, default nyala */ }
        function getAudioCtx() {
            if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
            if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            return audioCtx;
        }
        // Buka/kunci AudioContext sedini mungkin lewat interaksi pertama pengguna (kebijakan autoplay browser).
        document.addEventListener('click', () => getAudioCtx(), { once: true });
        function beep(freq, durMs, type, startDelay, vol) {
            if (!soundEnabled) return;
            const ctx = getAudioCtx();
            if (!ctx) return;
            const t0 = ctx.currentTime + (startDelay || 0);
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            gain.gain.setValueAtTime(0, t0);
            gain.gain.linearRampToValueAtTime(vol || 0.15, t0 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t0); osc.stop(t0 + durMs / 1000 + 0.03);
        }
        // Notifikasi/alert: nada lembut naik utk info, nada dua-ketuk lebih tegas utk peringatan (warn).
        function playSoundNotif(level) {
            if (level === 'warn') { beep(660, 150, 'square', 0, 0.12); beep(440, 220, 'square', 0.16, 0.12); }
            else { beep(880, 130, 'sine', 0, 0.11); beep(1180, 150, 'sine', 0.08, 0.11); }
        }
        // Truk/kapal berangkat: nada rendah naik pendek. Truk/kapal tiba: nada tiga-ketuk naik (lebih ceria).
        function playSoundDepart() { beep(392, 90, 'triangle', 0, 0.13); beep(523, 140, 'triangle', 0.08, 0.13); }
        function playSoundArrive() { beep(659, 100, 'sine', 0, 0.13); beep(784, 100, 'sine', 0.09, 0.13); beep(988, 180, 'sine', 0.18, 0.13); }
        function renderSoundBtn() {
            const b = document.getElementById('sound-toggle-btn');
            if (b) b.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        }
        function toggleSound() {
            soundEnabled = !soundEnabled;
            try { localStorage.setItem('pmid_sound', soundEnabled ? '1' : '0'); } catch (e) { /* abaikan kalau localStorage diblokir */ }
            renderSoundBtn();
            if (soundEnabled) playSoundNotif('info');
        }
        renderSoundBtn();

        function notify(text, level) {
            playSoundNotif(level);
            notifs.unshift({ text, level: level || 'info', t: gameStamp() });
            if (notifs.length > 30) notifs.pop();
            notifUnread++; renderNotif();
        }
        function clearNotif() { notifs = []; notifUnread = 0; renderNotif(); }
        function toggleNotif() {
            const pn = document.getElementById('notif-panel'); pn.classList.toggle('hidden');
            if (!pn.classList.contains('hidden')) { notifUnread = 0; renderNotif(); }
        }
        document.addEventListener('click', e => { if (!e.target.closest('#notif-wrap')) document.getElementById('notif-panel').classList.add('hidden'); });
        function renderNotif() {
            const n = pendingTopups.length + notifUnread, bd = document.getElementById('notif-badge');
            bd.textContent = n > 99 ? '99+' : n; bd.classList.toggle('hidden', !n);
            document.getElementById('notif-sys').innerHTML = notifs.length ? notifs.map(x => `<div class="rounded-lg border px-2.5 py-1.5 ${x.level === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-gray-950 border-gray-800 text-gray-300'}"><div class="text-[9px] text-gray-500">${esc(x.t)}</div>${esc(x.text)}</div>`).join('') : '<div class="text-gray-600 px-1">Tidak ada notifikasi sistem.</div>';
        }
        // ===== TAB LOG: pisahkan log Aktivitas umum dari log Truk & Perjalanan =====
        let activeLogTab = 'general', truckLogUnread = 0;
        function switchLogTab(tab) {
            activeLogTab = tab;
            document.getElementById('activity-log').classList.toggle('hidden', tab !== 'general');
            document.getElementById('truck-log').classList.toggle('hidden', tab !== 'truck');
            document.getElementById('logtab-btn-general').className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition ' + (tab === 'general' ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300');
            document.getElementById('logtab-btn-truck').className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition relative ' + (tab === 'truck' ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300');
            if (tab === 'truck') { truckLogUnread = 0; }
            renderTruckBadge();
        }
        function renderTruckBadge() {
            const bd = document.getElementById('truck-log-badge');
            bd.textContent = truckLogUnread > 99 ? '99+' : truckLogUnread;
            bd.classList.toggle('hidden', !truckLogUnread || activeLogTab === 'truck');
        }
        // cat: 'general' (default, semua aktivitas non-truk) atau 'truck' (khusus log berangkat/tiba/bongkar muatan)
        function addLog(msg, type = 'info', cat = 'general') {
            if (type === 'warning' || /^(PERINGATAN|PAJAK|CLOUD|PEMBELIAN BBM)/.test(msg)) notify(msg, type === 'warning' ? 'warn' : 'info');
            if (cat === 'truck') {
                if (/^BERANGKAT/.test(msg)) playSoundDepart();
                else if (/^(TIBA:|TIBA DI DEPOT|SANDAR)/.test(msg)) playSoundArrive();
            }
            const container = document.getElementById(cat === 'truck' ? 'truck-log' : 'activity-log');
            const div = document.createElement('div');
            const now = gameStamp();
            div.innerText = `[${now}] ${msg}`;
            if (type === 'success') div.className = 'text-green-400';
            else if (type === 'purple') div.className = 'text-purple-400';
            else if (type === 'warning') div.className = 'text-amber-400';
            else div.className = 'text-gray-300';
            container.prepend(div);
            if (cat === 'truck' && activeLogTab !== 'truck') { truckLogUnread++; renderTruckBadge(); }
        }

        // Toast singkat mengambang di atas layar (mis. konfirmasi "UID berhasil disalin"), hilang otomatis
        function showToast(text, ok = true) {
            const wrap = document.getElementById('toast-wrap');
            const el = document.createElement('div');
            el.className = 'toast-item ' + (ok ? 'ok' : 'err');
            el.innerHTML = `<i class="fa-solid ${ok ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${esc(text)}</span>`;
            wrap.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }
        async function copyAcctUid() {
            const uid = currentAccount ? currentAccount.id : '';
            if (!uid) return;
            try {
                if (navigator.clipboard) await navigator.clipboard.writeText(uid);
                else throw new Error('no-clipboard');
                showToast('UID berhasil disalin.');
            } catch (e) { showToast('Gagal menyalin UID, salin manual ya.', false); }
        }

        function showModal(title, message, iconClass = 'fa-handshake', theme = 'purple') {
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-message').innerText = message;
            
            const iconEl = document.getElementById('modal-icon');
            iconEl.className = `fa-solid ${iconClass}`;

            const iconBg = document.getElementById('modal-icon-bg');
            if (theme === 'blue') {
                iconBg.className = "w-14 h-14 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-blue-500/30";
            } else if (theme === 'red') {
                iconBg.className = "w-14 h-14 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-red-500/30";
            } else {
                iconBg.className = "w-14 h-14 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-purple-500/30";
            }

            document.getElementById('custom-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('custom-modal').classList.add('hidden');
        }

        // ===== Konfirmasi kustom (pengganti confirm() bawaan browser) =====
        const CONFIRM_THEMES = {
            amber: { bg: 'w-14 h-14 bg-amber-600/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-amber-500/30', btn: 'bg-amber-600 hover:bg-amber-700' },
            red: { bg: 'w-14 h-14 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-red-500/30', btn: 'bg-red-600 hover:bg-red-700' },
            blue: { bg: 'w-14 h-14 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-blue-500/30', btn: 'bg-blue-600 hover:bg-blue-700' }
        };
        let _confirmResolve = null;
        function showConfirm(message, opts = {}) {
            const { title = 'Konfirmasi', iconClass = 'fa-triangle-exclamation', theme = 'amber', okLabel = 'OK', cancelLabel = 'Batal' } = opts;
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-ok-btn').textContent = okLabel;
            document.getElementById('confirm-cancel-btn').textContent = cancelLabel;
            document.getElementById('confirm-icon').className = `fa-solid ${iconClass}`;
            const t = CONFIRM_THEMES[theme] || CONFIRM_THEMES.amber;
            document.getElementById('confirm-icon-bg').className = t.bg;
            document.getElementById('confirm-ok-btn').className = 'flex-1 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-lg ' + t.btn;
            document.getElementById('confirm-modal').classList.remove('hidden');
            return new Promise(resolve => { _confirmResolve = resolve; });
        }
        function _confirmDone(v) {
            document.getElementById('confirm-modal').classList.add('hidden');
            if (_confirmResolve) { const r = _confirmResolve; _confirmResolve = null; r(v); }
        }

        // ===== KATALOG DEALER ARMADA =====
        const DEALER_CATALOG = [
            // --- Mobil Tangki BBM ---
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Kecil 8 KL (BBM)', short: 'Tangki Kecil (8 KL)', cap: 8, price: 520000000, engine: 'Diesel 4 Silinder Turbo 190 PS', axle: '2 Sumbu (6 Roda)', capText: '8.000 Liter · 2 kompartemen' },
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Menengah 16 KL (BBM)', short: 'Tangki Menengah (16 KL)', cap: 16, price: 980000000, engine: 'Diesel 6 Silinder 235 PS', axle: '3 Sumbu Rigid (10 Roda)', capText: '16.000 Liter · 4 kompartemen' },
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Besar 18 KL (BBM)', short: 'Tangki Besar (18 KL)', cap: 18, price: 1100000000, engine: 'Diesel 6 Silinder 260 PS', axle: '3 Sumbu Rigid (10 Roda)', capText: '18.000 Liter · 4 kompartemen' },
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Besar 24 KL Standar (BBM)', short: 'Tangki Besar (24 KL)', cap: 24, price: 1400000000, engine: 'Diesel 6 Silinder 290 PS', axle: '3 Sumbu Rigid (10 Roda)', capText: '24.000 Liter · 5 kompartemen' },
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Besar 24 KL Heavy Duty (BBM)', short: 'Tangki Besar (24 KL)', cap: 24, price: 1650000000, engine: 'Diesel 6 Silinder 330 PS Euro 4', axle: '3 Sumbu Rigid (10 Roda)', capText: '24.000 Liter · 5 kompartemen' },
            { list: 'dealer-bbm-list', type: 'BBM', name: 'Tangki Trailer 32 KL (BBM)', short: 'Tangki Trailer (32 KL)', cap: 32, price: 2300000000, engine: 'Kepala Trailer Diesel 6 Silinder 380 PS', axle: 'Semi-Trailer (18 Roda)', capText: '32.000 Liter · 6 kompartemen' },
            // --- LPG curah: Pressure Tanker & Skid Tank ---
            { list: 'dealer-lpg-bulk-list', type: 'LPG', name: 'Pressure Tanker LPG 8 Ton', short: 'Pressure Tanker (8 Ton)', cap: 8, price: 880000000, engine: 'Diesel 4 Silinder Turbo 190 PS', axle: '2 Sumbu (6 Roda)', capText: '8 Ton LPG Curah (Pressure Vessel)' },
            { list: 'dealer-lpg-bulk-list', type: 'LPG', name: 'Skid Tank LPG 15 Ton', short: 'Skid Tank (15 Ton)', cap: 15, price: 1550000000, engine: 'Diesel 6 Silinder 235 PS', axle: '3 Sumbu Rigid (10 Roda)', capText: '15 Ton LPG Curah' },
            { list: 'dealer-lpg-bulk-list', type: 'LPG', name: 'Skid Tank LPG 20 Ton Trailer', short: 'Skid Tank Trailer (20 Ton)', cap: 20, price: 2400000000, engine: 'Kepala Trailer Diesel 6 Silinder 400 PS', axle: 'Semi-Trailer (18 Roda)', capText: '20 Ton LPG Curah (Pressure Vessel)' },

            // --- Kapal Tanker (khusus transfer Kilang Pusat <-> Depo Cabang yang punya akses pelabuhan) ---
            { list: 'dealer-kapal-bbm-list', type: 'BBM', kelas: 'kapal', name: 'Kapal Tanker BBM 500 KL', short: 'Tanker Kecil (500 KL)', cap: 500, price: 8500000000, engine: 'Marine Diesel 1200 HP', axle: 'Kapal Tanker Pelayaran Pantai', capText: '500.000 Liter · Tanker Curah' },
            { list: 'dealer-kapal-bbm-list', type: 'BBM', kelas: 'kapal', name: 'Kapal Tanker BBM 1.500 KL', short: 'Tanker Sedang (1.500 KL)', cap: 1500, price: 21000000000, engine: 'Marine Diesel 2400 HP', axle: 'Kapal Tanker Pelayaran Nusantara', capText: '1.500.000 Liter · Tanker Curah' },
            { list: 'dealer-kapal-bbm-list', type: 'BBM', kelas: 'kapal', name: 'Kapal Tanker BBM 3.000 KL', short: 'Tanker Besar (3.000 KL)', cap: 3000, price: 38000000000, engine: 'Marine Diesel 4000 HP', axle: 'Kapal Tanker Pelayaran Nusantara', capText: '3.000.000 Liter · Tanker Curah' },
            { list: 'dealer-kapal-lpg-list', type: 'LPG', kelas: 'kapal', name: 'Kapal Tanker LPG 300 Ton', short: 'LPG Carrier Kecil (300 Ton)', cap: 300, price: 12000000000, engine: 'Marine Diesel 1600 HP', axle: 'Kapal LPG Carrier Pressurized', capText: '300 Ton LPG Curah' },
            { list: 'dealer-kapal-lpg-list', type: 'LPG', kelas: 'kapal', name: 'Kapal Tanker LPG 800 Ton', short: 'LPG Carrier Besar (800 Ton)', cap: 800, price: 27000000000, engine: 'Marine Diesel 3200 HP', axle: 'Kapal LPG Carrier Pressurized', capText: '800 Ton LPG Curah' },
            // --- LPG tabung: Truk distribusi agen/SPBE ---
            { list: 'dealer-lpg-agent-list', type: 'LPG', name: 'Truk Agen Tabung 3 Kg (Oranye)', short: 'Agen Tabung 3 Kg (3 Ton)', cap: 3, price: 380000000, engine: 'Diesel 4 Silinder 110 PS', axle: '2 Sumbu (6 Roda)', capText: '3 Ton Tabung LPG 3 Kg' },
            { list: 'dealer-lpg-agent-list', type: 'LPG', name: 'Truk Agen LPG 12 Kg (Biru)', short: 'Agen LPG 12 Kg (4 Ton)', cap: 4, price: 420000000, engine: 'Diesel 4 Silinder 130 PS', axle: '2 Sumbu (6 Roda)', capText: '4 Ton Tabung LPG 12 Kg' },
            { list: 'dealer-lpg-agent-list', type: 'LPG', name: 'Truk Tabung LPG 5 Ton', short: 'Truk Tabung Campuran (5 Ton)', cap: 5, price: 460000000, engine: 'Diesel 4 Silinder 110 PS', axle: '2 Sumbu (6 Roda)', capText: '5 Ton Tabung (3 Kg / 12 Kg)' }
        ];

        // Biaya legalitas saat beli: uji KIR baru + STNK/BBN + pelat nomor (TNKB)
        const regFee = u => { const kir = Math.round((1200000 + u.cap * 150000) / 100000) * 100000, stnk = Math.round(u.price * 0.03 / 100000) * 100000, plat = 500000; return { kir, stnk, plat, total: kir + stnk + plat }; };
        const kirRenewCost = t => Math.round(regFee({ cap: t.cap, price: t.price || 500e6 }).kir * 0.6 / 50000) * 50000;
        const stnkRenewCost = t => Math.round((t.price || 500e6) * 0.02 / 100000) * 100000;
        const platRenewCost = t => 500000;
        const STNK_PERIOD = 5 * 365 * 86400000; // STNK berlaku 5 tahun
        const PLAT_PERIOD = 5 * 365 * 86400000; // Plat nomor (TNKB) berlaku 5 tahun
        const KIR_DISHUB_MS = 3600000; // proses verifikasi Dishub = 1 jam waktu in-game
        const docCls = ts => { const l = ts - gameNow(); return l <= 0 ? 'text-red-400' : l < 30 * 86400000 ? 'text-amber-400' : 'text-emerald-400'; };
        const docTxt = ts => { const l = ts - gameNow(); return dShort(ts) + (l <= 0 ? ' (KEDALUWARSA)' : l < 30 * 86400000 ? ' (segera habis)' : ''); };
        function docBlock(t) {
            const bad = [t.kirTs <= gameNow() ? 'Uji KIR' : '', t.stnkTs <= gameNow() ? 'STNK' : '', t.platTs <= gameNow() ? 'Plat Nomor' : ''].filter(Boolean);
            if (!bad.length) return false;
            showModal('Dokumen Kedaluwarsa', `${t.id} [${t.plat}] tidak boleh jalan: ${bad.join(' & ')} sudah habis. Perpanjang di tab Armada.`, 'fa-file-circle-xmark', 'red'); return true;
        }
        // Proses berkas Uji KIR yang sedang diverifikasi Dishub (dicek tiap tick jam game berjalan)
        function processKirPending() {
            companyFleet.forEach(t => {
                if (t.kirPending && gameNow() >= t.kirPending) {
                    t.kirTs = Math.max(gameNow(), t.kirTs) + 182 * 86400000;
                    t.kirPending = null;
                    addLog(`UJI KIR DISETUJUI DISHUB: berkas ${t.id} [${t.plat}] selesai diverifikasi, KIR baru aktif hingga ${dShort(t.kirTs)}.`, 'success');
                    notify(`Uji KIR ${t.id} [${t.plat}] disetujui Dishub.`, 'success');
                    renderFleetDashboard();
                }
            });
        }
        function renewDoc(id, kind) {
            const t = companyFleet.find(x => x.id === id); if (!t) return;
            if (kind === 'kir') {
                if (t.kirPending) return showModal('Sedang Diproses Dishub', `Berkas Uji KIR ${t.id} [${t.plat}] masih diverifikasi Dishub, estimasi selesai ${fmtTime(t.kirPending)} (waktu in-game).`, 'fa-hourglass-half', 'blue');
                const cost = kirRenewCost(t);
                if (companyCash < cost) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(cost)}.`, 'fa-triangle-exclamation', 'red');
                companyCash -= cost; totalExpense += cost;
                t.kirPending = gameNow() + KIR_DISHUB_MS;
                addFinanceLog(`Uji KIR dikirim ke Dishub ${t.id} [${t.plat}]`, -cost);
                addLog(`UJI KIR DIKIRIM: berkas ${t.id} [${t.plat}] dikirim ke Dishub untuk verifikasi.`, 'info');
                showModal('Uji KIR Dikirim ke Dishub', `Berkas Uji KIR untuk ${t.id} [${t.plat}] sudah dikirim ke Dishub. Proses verifikasi memakan waktu 1 jam (waktu in-game), estimasi selesai pukul ${fmtTime(t.kirPending)} WIB.`, 'fa-paper-plane', 'blue');
                updateCashDisplay(); renderFleetDashboard();
                return;
            }
            const cost = kind === 'stnk' ? stnkRenewCost(t) : platRenewCost(t);
            if (companyCash < cost) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(cost)}.`, 'fa-triangle-exclamation', 'red');
            companyCash -= cost; totalExpense += cost;
            let newTs;
            if (kind === 'stnk') { t.stnkTs = Math.max(gameNow(), t.stnkTs) + STNK_PERIOD; newTs = t.stnkTs; }
            else { t.platTs = Math.max(gameNow(), t.platTs) + PLAT_PERIOD; newTs = t.platTs; }
            addFinanceLog(`${kind === 'stnk' ? 'Perpanjang STNK/pajak' : 'Perpanjang Plat Nomor'} ${t.id} [${t.plat}]`, -cost);
            showModal(kind === 'stnk' ? 'STNK Diperpanjang' : 'Plat Nomor Diperpanjang', `${kind === 'stnk' ? 'STNK' : 'Plat nomor'} untuk ${t.id} [${t.plat}] berhasil diperpanjang dan berlaku 5 tahun, aktif hingga ${dShort(newTs)}.`, 'fa-circle-check', 'blue');
            updateCashDisplay(); renderFleetDashboard();
        }
        function renderDealerCatalog() {
            document.querySelectorAll('[id^="dealer-"][id$="-list"]').forEach(el => el.innerHTML = '');
            DEALER_CATALOG.forEach((u, idx) => {
                const isBBM = u.type === 'BBM';
                const btn = u.kelas === 'kapal' ? 'bg-cyan-600 hover:bg-cyan-700' : (isBBM ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700');
                const row = document.createElement('div');
                row.className = 'p-2.5 bg-gray-900 rounded-lg border border-gray-800 flex justify-between items-center gap-2';
                row.innerHTML = `
                    <div class="min-w-0">
                        <div class="font-bold text-gray-200">${u.short}</div>
                        <div class="text-[10px] text-gray-400">${u.axle} • ${u.engine}</div>
                        <div class="text-[10px] text-gray-500">${u.capText}</div>
                        <div class="text-emerald-400 font-mono font-bold mt-0.5">${formatRupiah(u.price)}</div>
                        <div class="text-[10px] text-gray-500">+ KIR/STNK/plat ${formatRupiah(regFee(u).total)}</div>
                    </div>
                    <button onclick="buyFromCatalog(${idx})" class="${btn} text-white px-3 py-1.5 rounded font-semibold transition shrink-0">Beli Unit</button>
                `;
                document.getElementById(u.list).appendChild(row);
            });
        }

        function buyFromCatalog(idx) {
            const u = DEALER_CATALOG[idx];
            openDealerConfirm(u.name, u.cap, u.type, u.price, u.engine, u.axle, u.capText, u.kelas);
        }

        function openDealerConfirm(name, cap, type, price, engine, axle, capText, kelas) {
            pendingTruckPurchase = { name, cap, type, price, fee: regFee({ cap, price }), kelas: kelas || 'truk' };
            
            document.getElementById('dealer-spec-name').innerText = name;
            document.getElementById('dealer-spec-engine').innerText = engine;
            document.getElementById('dealer-spec-axle').innerText = axle;
            document.getElementById('dealer-spec-capacity').innerText = capText;
            { const f = regFee({ cap, price }); document.getElementById('dealer-spec-price').innerHTML = formatRupiah(price) + `<br><span class="text-[10px] font-sans font-normal text-gray-400">+ Uji KIR ${formatRupiah(f.kir)} &middot; STNK ${formatRupiah(f.stnk)} &middot; Plat ${formatRupiah(f.plat)}</span><br><span class="text-[11px] font-sans text-amber-300">Total ${formatRupiah(price + f.total)}</span>`; }

            document.getElementById('btn-confirm-buy-truck').onclick = executeTruckPurchase;
            document.getElementById('dealer-modal').classList.remove('hidden');
        }

        function closeDealerModal() {
            document.getElementById('dealer-modal').classList.add('hidden');
            pendingTruckPurchase = null;
        }

        function executeTruckPurchase() {
            if (!pendingTruckPurchase) return;
            
            const { name, cap, type, price, fee, kelas } = pendingTruckPurchase;

            if (companyCash < price + fee.total) {
                closeDealerModal();
                showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(price + fee.total)} (harga unit ${formatRupiah(price)} + KIR/STNK/plat ${formatRupiah(fee.total)}).`, 'fa-triangle-exclamation', 'red');
                return;
            }

            companyCash -= price + fee.total;
            totalExpense += price + fee.total;

            const isKapal = kelas === 'kapal';
            const randomPlat = isKapal ? 'GT ' + Math.floor(100 + Math.random() * 900) + ' NUSA' : 'W ' + Math.floor(1000 + Math.random() * 9000) + ' PK';
            const prefix = isKapal ? 'KPL-' : 'TRK-';
            let truckNo = companyFleet.length + 1;
            while (companyFleet.some(t => t.id === prefix + String(truckNo).padStart(2, '0'))) truckNo++;
            const newTruckId = prefix + String(truckNo).padStart(2, '0');

            companyFleet.push({ 
                id: newTruckId, 
                name: name, 
                cap: cap, 
                type: type, 
                kelas: isKapal ? 'kapal' : 'truk',
                status: 'Sedia',
                plat: randomPlat,
                depotId: 'KILANG-01',
                odometer: 0, banPct: 100,
                price, kirTs: gameNow() + 182 * 86400000, stnkTs: gameNow() + STNK_PERIOD, platTs: gameNow() + PLAT_PERIOD, kirPending: null
            });

            addFinanceLog(`Pembelian ${name} (${newTruckId})`, -price);
            addFinanceLog(`Uji KIR baru ${newTruckId}`, -fee.kir);
            addFinanceLog(`STNK/BBN ${newTruckId}`, -fee.stnk);
            addFinanceLog(`Pelat nomor ${randomPlat}`, -fee.plat);
            closeDealerModal();
            updateCashDisplay();
            populateTruckDropdowns();
            renderFleetDashboard();

            addLog(`BERHASIL MEMBELI ARMADA: 1 Unit ${name} [${randomPlat}] ditambahkan ke garasi, berpangkalan di Kilang Tuban.`, 'success');
            showModal('Pembelian Berhasil', `1 Unit ${name} [Plat: ${randomPlat}] berhasil dibeli!<br><br>STNK &amp; Plat Nomor aktif <b>5 tahun</b> sejak hari ini. Silakan assign ${isKapal ? 'Nahkoda & ABK' : 'driver'} saat hendak dispatch, dan atur pangkalan depo di tab Armada.`, 'fa-circle-check', 'blue');
        }

        function formatRupiah(amount) {
            return 'Rp ' + amount.toLocaleString('id-ID');
        }

        function updateCashDisplay() {
            document.getElementById('kpis-cash').innerText = formatRupiah(companyCash);
            document.getElementById('kpis-truck-count').innerText = `${companyFleet.length} Unit`;
            document.getElementById('kpis-driver-count').innerText = `${companyCrew.length} Orang`;
            document.getElementById('fin-income').innerText = formatRupiah(totalIncome);
            document.getElementById('fin-expense').innerText = formatRupiah(totalExpense);
            renderFinance();
            saveGame();
        }

        // ===== LAPORAN KEUANGAN & PPh BADAN =====
        let pphPaid = 0, topupTotal = 0;
        // Tarif: Pasal 17 ayat (1) huruf b UU PPh (22%); Pasal 31E ayat (1): diskon 50% untuk bagian peredaran bruto s.d. Rp 4,8 M (peredaran bruto <= Rp 50 M)
        function calcPph(laba, omzet) {
            if (laba <= 0 || omzet <= 0) return 0;
            if (omzet <= 4.8e9) return Math.round(laba * 0.11);
            if (omzet <= 50e9) { const a = laba * 4.8e9 / omzet; return Math.round(a * 0.11 + (laba - a) * 0.22); }
            return Math.round(laba * 0.22);
        }
        function renderFinance() {
            const box = document.getElementById('fin-report'); if (!box) return;
            const laba = totalIncome - totalExpense, tax = calcPph(laba, totalIncome), kurang = Math.max(0, tax - pphPaid);
            const row = (l, v, c, b) => `<div class="flex justify-between gap-2 ${b ? 'border-t border-gray-700 pt-1 font-bold' : ''}"><span class="text-gray-400 font-sans">${l}</span><span class="${c || 'text-gray-200'}">${v}</span></div>`;
            const neg = n => (n < 0 ? '(' + formatRupiah(-n) + ')' : formatRupiah(n));
            box.innerHTML = row('Pendapatan (peredaran bruto)', formatRupiah(totalIncome), 'text-emerald-400')
                + row('Beban pembelian bahan bakar', '(' + formatRupiah(bbmSpent) + ')', 'text-red-400')
                + row('Beban armada, SDM &amp; lainnya', '(' + formatRupiah(Math.max(0, totalExpense - bbmSpent)) + ')', 'text-red-400')
                + row('Laba (Rugi) Sebelum Pajak', neg(laba), laba >= 0 ? 'text-emerald-400' : 'text-red-400', true)
                + row('PPh Badan terutang', '(' + formatRupiah(tax) + ')', 'text-amber-300')
                + row('Laba (Rugi) Bersih', neg(laba - tax), laba - tax >= 0 ? 'text-emerald-400' : 'text-red-400', true)
                + row('Kas saat ini', formatRupiah(companyCash), 'text-teal-300', true)
                + row('Setoran modal tambahan (top up)', formatRupiah(topupTotal), 'text-sky-300');
            document.getElementById('pph-box').innerHTML = row('Dasar pengenaan (laba sebelum pajak)', neg(laba))
                + row('Tarif efektif', laba > 0 ? (tax / laba * 100).toFixed(1).replace('.', ',') + '%' : '-')
                + row('PPh terutang', formatRupiah(tax), 'text-amber-300')
                + row('Sudah dibayar', formatRupiah(pphPaid), 'text-emerald-400')
                + row('Kurang bayar', formatRupiah(kurang), kurang ? 'text-red-400' : 'text-gray-300', true);
            document.getElementById('pph-pay').disabled = kurang <= 0;
            const co = currentAccount ? esc(currentAccount.company) : 'perusahaan';
            document.getElementById('pph-law').innerHTML = `<div class="font-bold text-gray-300">Dasar hukum untuk ${co} (WP badan dalam negeri berbentuk PT)</div>
                <div>&bull; <b>UU No. 7 Tahun 1983</b> tentang Pajak Penghasilan, sebagaimana telah diubah terakhir dengan <b>UU No. 7 Tahun 2021</b> tentang Harmonisasi Peraturan Perpajakan (UU HPP).</div>
                <div>&bull; Tarif umum: <b>Pasal 17 ayat (1) huruf b</b> = 22% (berlaku sejak tahun pajak 2022).</div>
                <div>&bull; Fasilitas: <b>Pasal 31E ayat (1)</b> (UU No. 36 Tahun 2008) = pengurangan tarif 50% (efektif 11%) atas penghasilan kena pajak dari bagian peredaran bruto sampai Rp 4,8 miliar, bagi peredaran bruto sampai Rp 50 miliar.</div>
                <div>&bull; Pelaporan: <b>UU No. 6 Tahun 1983</b> tentang KUP (diubah UU No. 7 Tahun 2021) <b>Pasal 3 ayat (3) huruf b</b>: SPT Tahunan badan paling lambat 4 bulan setelah tahun pajak berakhir.</div>
                <div class="text-gray-500">Simulasi: laba = pendapatan &minus; beban, dihitung kumulatif sejak akun dibuat. Bukan konsultasi pajak.</div>`;
        }
        function payPph() {
            const kurang = Math.max(0, calcPph(totalIncome - totalExpense, totalIncome) - pphPaid);
            if (kurang <= 0) return;
            if (companyCash < kurang) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(kurang)} untuk membayar PPh.`, 'fa-triangle-exclamation', 'red');
            companyCash -= kurang; pphPaid += kurang;
            addFinanceLog('Pembayaran PPh Badan', -kurang); updateCashDisplay();
            addLog(`PAJAK: PPh Badan ${formatRupiah(kurang)} dibayar.`, 'success');
        }

        let financeEntries = [];
        function addFinanceLog(desc, amount) {
            financeEntries.push({ desc, amount }); if (financeEntries.length > 80) financeEntries.shift();
            const container = document.getElementById('finance-history-log');
            const div = document.createElement('div');
            div.className = 'p-2 bg-gray-900 rounded border border-gray-800 flex justify-between items-center';

            const isIncome = amount > 0;
            div.innerHTML = `
                <span class="text-gray-300">${desc}</span>
                <span class="${isIncome ? 'text-emerald-400' : 'text-red-400'} font-bold font-mono">
                    ${isIncome ? '+' : ''}${formatRupiah(amount)}
                </span>
            `;
            container.prepend(div);
        }

        // Tab yang tampil menggantikan peta (Peta & Dealer tetap tampil inline di sidebar)
        const POPUP_TABS = ['tab-kilang', 'tab-dealer', 'tab-delivery', 'tab-lpg', 'tab-kapal', 'tab-fleet', 'tab-bursa', 'tab-drivers', 'tab-partnership', 'tab-finance', 'tab-orders', 'tab-leaderboard'];

        let currentTabId = 'tab-map-view';
        function switchTab(tabId) {
            // Listener leaderboard & daftar lapak Bursa (koleksi bersama, broadcast ke semua pemain online -
            // paling boros kuota baca Firestore gratis) hanya dihidupkan selagi tab terkait benar-benar
            // dibuka, dan dimatikan begitu pindah ke tab lain.
            if (currentTabId === 'tab-leaderboard' && tabId !== 'tab-leaderboard') stopLeaderboardListener();
            if (currentTabId === 'tab-bursa' && tabId !== 'tab-bursa') stopBursaListingsListener();
            currentTabId = tabId;

            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('text-blue-400', 'border-l-4', 'border-blue-500', 'bg-gray-900');
                el.classList.add('text-gray-400');
            });

            // kembalikan konten panel sebelumnya (jika ada) ke tempat asal di sidebar
            const panel = document.getElementById('tab-content-panel');
            const popupBody = document.getElementById('tab-popup-body');
            while (popupBody.firstChild) panel.appendChild(popupBody.firstChild);

            const target = document.getElementById(tabId);
            target.classList.remove('hidden');
            if (tabId === 'tab-leaderboard') { startLeaderboardListener(); renderLeaderboard(); }
            if (tabId === 'tab-orders') renderOrders();
            if (tabId === 'tab-delivery' || tabId === 'tab-lpg') populateSpbuDropdowns(document.getElementById('delivery-region-filter') ? document.getElementById('delivery-region-filter').value : 'ALL');
            if (tabId === 'tab-kapal') populateTransferKapal();
            if (tabId === 'tab-bursa') { startBursaListingsListener(); renderBursa(); }
            const activeBtn = document.getElementById('btn-' + tabId);
            activeBtn.classList.add('text-blue-400', 'border-l-4', 'border-blue-500', 'bg-gray-900');
            activeBtn.classList.remove('text-gray-400');

            const mapViewWrap = document.getElementById('map-view-wrap');
            const tabPanelInline = document.getElementById('tab-panel-inline');
            const leftAside = document.getElementById('left-aside');

            if (POPUP_TABS.includes(tabId)) {
                // Tampilkan konten tab menggantikan peta (bukan overlay) - sidebar tetap bisa diklik
                const icon = activeBtn.querySelector('i'), label = activeBtn.querySelector('span');
                document.getElementById('tab-panel-title').innerHTML = (icon ? icon.outerHTML + ' ' : '') + (label ? label.textContent : '');
                popupBody.appendChild(target);
                mapViewWrap.classList.add('hidden');
                tabPanelInline.classList.remove('hidden');
                // Panel konten sidebar kiri jadi kosong (isinya pindah ke atas) -> sembunyikan & susutkan aside
                panel.classList.add('hidden');
                if (leftAside) leftAside.classList.add('nav-only');
            } else {
                // Peta / Dealer: tampilkan peta lagi & kembalikan panel konten sidebar kiri
                mapViewWrap.classList.remove('hidden');
                tabPanelInline.classList.add('hidden');
                panel.classList.remove('hidden');
                if (leftAside) leftAside.classList.remove('nav-only');
                setTimeout(() => { if (window.map) map.invalidateSize(); }, 60);
            }
        }

        function closeTabPopup() { switchTab('tab-map-view'); }

        const map = L.map('map').setView([-2.5, 117.5], 5);

        // OpenStreetMap standar: gratis, tanpa API key
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        function initSpbuDatabase() {
            rawSpbuData.forEach((region, rIndex) => {
                const pv = region.provinsi || 'Jawa Timur';

                region.list_spbu.forEach((item, sIndex) => {
                    const isLpgAvailable = ((rIndex + sIndex) % 2 === 0);
                    if (sIndex === 0) item = { ...item, tipe: 'COCO' }; else item = { ...item, tipe: 'DODO' };

                    loadedSpbuList.push({
                        kode: item.kode,
                        nama: item.nama,
                        region: region.kabupaten_kota,
                        provinsi: pv,
                        lat: item.lat,
                        lon: item.lon,
                        tipe: item.tipe,
                        has_lpg: isLpgAvailable,
                        is_approved: sIndex === 0
                    });
                });
            });

            recomputeWilayah();
            renderRefineries();
            renderSpbuOnMap();
            populateSpbuDropdowns();
            populateTruckDropdowns();
            populateCrewDropdowns();
            renderInvestorTab();
            renderFleetDashboard();
            renderDriversDashboard();
        }

        // ===== WILAYAH OTOMATIS: tiap SPBU di-assign ke Kilang/Depo AKTIF TERDEKAT berdasarkan radius jarak =====
        // Menggantikan wilayah kabupaten/kota manual - dipanggil ulang tiap kali ada kilang/depo baru dibuka,
        // supaya SPBU yang tadinya "jauh" bisa otomatis pindah wilayah begitu ada depo cabang lebih dekat.
        // Kilang/Depo terdekat yang BENAR-BENAR bisa mensuplai jenis produk ini (Pusat Utama selalu bisa;
        // Depo Cabang cuma bisa kalau tipenya cocok - mis. Depo LPG Gresik cuma bisa disebut wilayah LPG,
        // bukan wilayah BBM, walau jaraknya paling dekat). Logika filter tipe disamakan dengan pickOrigin().
        // Radius layanan realistis (km) per jenis produk - di luar radius ini, sebuah kilang/depo (termasuk
        // Pusat Utama) TIDAK dianggap bisa mensuplai SPBU tsb, walau tidak ada kandidat lain yang lebih dekat.
        // LPG dibatasi karena curah LPG cuma diproduksi/disimpan di 1-2 titik (Tuban & Gresik) - beda dari BBM
        // yang punya banyak TBBM cabang di seluruh provinsi begitu dibuka, jadi BBM tetap dilayani nasional
        // dari Pusat Utama sampai TBBM cabang terdekat dibuka.
        const MAX_SERVICE_KM = { LPG: 300 };
        function nearestActiveKilang(spbu, type) {
            const cap = MAX_SERVICE_KM[type] || Infinity;
            return refineryData.filter(k => k.is_unlocked && (k.tipe.includes('Pusat') || k.tipe.includes(type)) && distKm(k, spbu) <= cap)
                .reduce((best, k) => (!best || distKm(k, spbu) < distKm(best, spbu)) ? k : best, null);
        }
        function recomputeWilayah() {
            loadedSpbuList.forEach(s => {
                const bbm = nearestActiveKilang(s, 'BBM');
                if (bbm) { s.wilayahBbmId = bbm.id; s.wilayahBbmNama = bbm.nama; s.wilayahBbmJarak = Math.round(distKm(bbm, s) * 10) / 10; }
                else { s.wilayahBbmId = null; s.wilayahBbmNama = '-'; s.wilayahBbmJarak = null; }
                if (s.has_lpg) {
                    const lpg = nearestActiveKilang(s, 'LPG');
                    if (lpg) { s.wilayahLpgId = lpg.id; s.wilayahLpgNama = lpg.nama; s.wilayahLpgJarak = Math.round(distKm(lpg, s) * 10) / 10; }
                    else { s.wilayahLpgId = null; s.wilayahLpgNama = '-'; s.wilayahLpgJarak = null; }
                } else { s.wilayahLpgId = null; s.wilayahLpgNama = null; s.wilayahLpgJarak = null; }
                // Alias wilayah utama = wilayah BBM (dipakai buat dropdown filter & tampilan umum, karena semua SPBU jual BBM).
                s.wilayahId = s.wilayahBbmId; s.wilayahNama = s.wilayahBbmNama; s.wilayahJarak = s.wilayahBbmJarak;
            });
            rebuildRegionFilterOptions();
        }
        // Bangun ulang opsi dropdown "Pilih Wilayah" berdasarkan Kilang/Depo yang aktif saat ini,
        // dikelompokkan otomatis (bukan lagi daftar kabupaten/kota statis).
        function rebuildRegionFilterOptions() {
            const sel = document.getElementById('delivery-region-filter');
            if (!sel) return;
            const prev = sel.value;
            const counts = {};
            loadedSpbuList.forEach(s => { if (s.wilayahId) counts[s.wilayahId] = (counts[s.wilayahId] || 0) + 1; });
            sel.innerHTML = '<option value="ALL">-- Semua Wilayah Nusantara --</option>';
            refineryData.filter(k => k.is_unlocked).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id;
                opt.innerText = `${k.nama} (${counts[k.id] || 0} SPBU)`;
                sel.appendChild(opt);
            });
            if (prev && sel.querySelector(`option[value="${prev}"]`)) sel.value = prev; else sel.value = 'ALL';
        }

        let kilangFilter = 'ALL';
        function setKilangFilter(key) { kilangFilter = key; renderRefineries(); }
        function renderRefineries() {
            kilangMarkers.forEach(km => map.removeLayer(km));
            kilangMarkers = [];

            const listContainer = document.getElementById('kilang-list-container');
            const targetSelect = document.getElementById('transfer-target-select');
            const tabsEl = document.getElementById('kilang-filter-tabs');

            listContainer.innerHTML = '';
            targetSelect.innerHTML = '';

            if (tabsEl) {
                // Dropdown, bukan deretan chip - daftar kilang/depo terus bertambah seiring ekspansi (bisa sampai
                // belasan), jadi kalau dijejer horizontal pasti ada saatnya kepotong berapa pun lebar layarnya.
                const opts = [{ key: 'ALL', label: 'Semua Kilang' }, ...refineryData.map(k => ({ key: k.id, label: k.nama + (k.is_unlocked ? '' : ' (Terkunci)') }))];
                tabsEl.innerHTML = `<select onchange="setKilangFilter(this.value)" class="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-200 focus:outline-none focus:border-teal-500">
                    ${opts.map(c => `<option value="${c.key}" ${kilangFilter === c.key ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
                </select>`;
            }

            refineryData.forEach(kilang => {
                const pct = Math.round((kilang.stok_current / kilang.stok_max) * 100);
                
                const card = document.createElement('div');
                card.className = "p-3 bg-gray-900 rounded-lg border border-gray-800 space-y-2";
                
                if (kilang.is_unlocked) {
                    const mName = mekanikName(kilang);
                    const freeMekanik = companyCrew.filter(c => c.role === 'Mekanik' && !c.kilangId);
                    const mekanikBlock = mName
                        ? `<div class="flex items-center justify-between text-[10px] pt-1 border-t border-gray-800"><span class="text-gray-400"><i class="fa-solid fa-screwdriver-wrench mr-1 text-blue-400"></i>Mekanik: <b class="text-emerald-400">${mName}</b></span></div>`
                        : `<div class="pt-1 border-t border-gray-800 space-y-1 text-[10px]">
                            <span class="text-gray-400"><i class="fa-solid fa-screwdriver-wrench mr-1 text-amber-400"></i>Mekanik: <b class="text-amber-400">Belum ada</b></span>
                            ${freeMekanik.length
                                ? `<div class="flex gap-1"><select id="mekanik-sel-${kilang.id}" class="flex-1 bg-gray-950 border border-gray-700 rounded px-1 py-0.5 text-gray-200">${freeMekanik.map(c => `<option value="${c.id}">${c.name} (Rep ${Math.round(c.reputation)})</option>`).join('')}</select><button onclick="assignMekanik('${kilang.id}')" class="bg-blue-700 hover:bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Tugaskan</button></div>`
                                : `<button onclick="openRecruitModal('Mekanik')" class="w-full bg-blue-700 hover:bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Rekrut Mekanik di Bursa Kerja</button>`}
                          </div>`;
                    const anyRefining = kilang.kap ? Object.values(kilang.kap).some(s => s.refining) : false;
                    card.innerHTML = `
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-200 font-bold">${kilang.nama} <span class="text-[10px] text-blue-400 font-normal">(${kilang.tipe})</span> ${isCoastal(kilang) ? '<span class="text-[9px] text-cyan-400 font-normal" title="Punya akses pelabuhan, bisa dilayani kapal tanker"><i class="fa-solid fa-anchor"></i> Pesisir</span>' : '<span class="text-[9px] text-gray-500 font-normal" title="Tidak ada akses pelabuhan, hanya bisa dilayani truk"><i class="fa-solid fa-road"></i> Darat</span>'}${kilang.id === 'KILANG-01' ? `<span id="refine-indicator-${kilang.id}" class="${anyRefining ? '' : 'hidden'} text-[9px] text-amber-400 font-normal ml-1"><i class="fa-solid fa-gear fa-spin mr-0.5"></i>Mengolah...</span>` : ''}</span>
                            <span id="crude-text-${kilang.id}" class="font-bold text-gray-200 font-mono">${kilang.stok_current.toLocaleString()} / ${kilang.stok_max.toLocaleString()} ${kilang.unit}</span>
                        </div>
                        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div id="crude-bar-${kilang.id}" class="${anyRefining ? 'refine-flow' : ''} bg-emerald-500 h-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        ${mekanikBlock}
                        ${kilang.id === 'KILANG-01' ? fuelBuyHtml(kilang) : ''}
                        ${kilang.id === 'KILANG-01' ? lpgCurahBuyHtml(kilang) : ''}
                        ${renderKapPanel(kilang)}
                    `;

                    if (kilang.id !== 'KILANG-01') {
                        const opt = document.createElement('option');
                        opt.value = kilang.id;
                        opt.innerText = `${kilang.nama} (Sisa: ${kilang.stok_max - kilang.stok_current} ${kilang.unit})`;
                        targetSelect.appendChild(opt);
                    }
                } else {
                    card.innerHTML = `
                        <div class="flex justify-between items-center text-xs">
                            <div>
                                <span class="text-gray-400 font-bold block">${kilang.nama}</span>
                                <span class="text-[10px] text-amber-500 font-mono"><i class="fa-solid fa-lock mr-1"></i> Terkunci</span>
                            </div>
                            <button onclick="buyRefinery('${kilang.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition">
                                Beli ${formatRupiah(kilang.harga_beli)}
                            </button>
                        </div>
                    `;
                }

                if (kilangFilter === 'ALL' || kilangFilter === kilang.id) listContainer.appendChild(card);

                let colorMarker = '#6b7280';
                if (kilang.is_unlocked) {
                    colorMarker = kilang.id === 'KILANG-01' ? '#14b8a6' : '#f97316';
                }

                const marker = L.circleMarker([kilang.lat, kilang.lon], {
                    radius: 10,
                    fillColor: colorMarker,
                    color: "#ffffff",
                    weight: 2,
                    fillOpacity: 0.9
                }).addTo(map);

                const coastal = isCoastal(kilang);
                marker.bindPopup(`
                    <div class="text-gray-900 font-sans p-1">
                        <strong class="text-xs font-bold block text-teal-700">${kilang.nama}</strong>
                        <div class="text-[10px] text-gray-600">Status: <b>${kilang.is_unlocked ? 'Aktif' : 'Terkunci'}</b></div>
                        <div class="text-[10px] text-gray-600">Akses: <b>${coastal ? '⚓ Pesisir (ada dermaga, bisa disandari kapal tanker)' : '🛣️ Darat saja (tidak ada dermaga)'}</b></div>
                        <div class="text-[10px] text-gray-600">Stok: <b>${kilang.stok_current.toLocaleString()} / ${kilang.stok_max.toLocaleString()} ${kilang.unit}</b></div>
                        <div class="text-[10px] text-gray-600">Mekanik: <b>${mekanikName(kilang) || 'Belum ada'}</b></div>
                    </div>
                `);

                kilangMarkers.push(marker);

                // Bug fix: tandai di PETA (bukan cuma di daftar sidebar) depo/kilang mana yang punya akses
                // pelabuhan (dermaga) - lencana jangkar kecil menempel di pojok marker depo tersebut.
                if (coastal) {
                    const dermagaBadge = L.marker([kilang.lat, kilang.lon], {
                        icon: L.divIcon({
                            className: '',
                            iconSize: [16, 16],
                            iconAnchor: [-6, 18],
                            html: `<div style="width:16px;height:16px;border-radius:50%;background:#0891b2;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:8px;box-shadow:0 1px 4px rgba(0,0,0,.6)"><i class="fa-solid fa-anchor"></i></div>`
                        }),
                        zIndexOffset: 700,
                        interactive: false
                    }).addTo(map);
                    dermagaBadge.bindTooltip(esc(`${kilang.nama} - Ada Dermaga`), { direction: 'top', offset: [0, -8], className: 'truck-tip' });
                    kilangMarkers.push(dermagaBadge);
                }
            });

            if (targetSelect.options.length === 0) {
                targetSelect.innerHTML = '<option value="">-- Beli Depo Cabang Terlebih Dahulu --</option>';
            }
            populateTransferKapal();
        }

        // ===== MEKANIK DI SETIAP KILANG/DEPO (direkrut lewat Bursa Kerja Kru, lalu ditugaskan ke kilang) =====
        function mekanikName(kilang) {
            if (!kilang.mekanikId) return null;
            if (kilang.mekanikId === 'BUILTIN') return 'Slamet Riyadi (Kepala Mekanik Tetap)';
            const c = companyCrew.find(x => x.id === kilang.mekanikId);
            return c ? c.name : null;
        }
        function assignMekanik(kilangId) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || !kilang.is_unlocked || kilang.mekanikId) return;
            const sel = document.getElementById('mekanik-sel-' + kilangId);
            if (!sel || !sel.value) return;
            const crewId = sel.value;
            const c = companyCrew.find(x => x.id === crewId);
            if (!c || c.role !== 'Mekanik' || c.kilangId) return;
            kilang.mekanikId = c.id;
            c.kilangId = kilang.id;
            c.status = 'Bertugas di ' + kilang.nama;
            addLog(`MEKANIK DITUGASKAN: ${c.name} kini bertugas di ${kilang.nama}. Depo ini sekarang bisa dipilih sebagai pangkalan armada.`, 'success');
            showModal('Mekanik Ditugaskan', `${c.name} kini bertugas sebagai mekanik di ${kilang.nama}. Depo ini sekarang bisa dipilih sebagai pangkalan armada (Pindah Depot di tab Armada).`, 'fa-screwdriver-wrench', 'blue');
            renderRefineries(); renderFleetDashboard(); renderDriversDashboard();
        }

        // ===== ODOMETER & KEAUSAN BAN ARMADA =====
        const TIRE_WEAR_PER_KM = 100 / 4000; // set ban habis (0%) tiap ±4.000 km tempuh
        const TIRE_REPLACE_THRESHOLD = 15; // otomatis diganti begitu tiba di depot kalau sisa <=15%
        const tireReplaceCost = t => Math.round((t.price || 500e6) * 0.01 / 100000) * 100000;
        function banCls(pct) { return pct <= TIRE_REPLACE_THRESHOLD ? 'text-red-400' : pct <= 40 ? 'text-amber-400' : 'text-emerald-400'; }
        function banBar(pct) { return pct <= TIRE_REPLACE_THRESHOLD ? 'bg-red-500' : pct <= 40 ? 'bg-amber-500' : 'bg-emerald-500'; }

        // ===== PINDAH DEPOT PANGKALAN ARMADA =====
        const DEPOT_MOVE_FEE = 3500000;
        function pindahDepot(truckId) {
            const t = companyFleet.find(x => x.id === truckId); if (!t) return;
            const sel = document.getElementById('depot-sel-' + truckId); if (!sel || !sel.value) return;
            const target = refineryData.find(k => k.id === sel.value);
            if (!target || !target.is_unlocked || !target.mekanikId) return showModal('Depo Belum Siap', 'Depo tujuan harus sudah aktif dan punya mekanik yang ditugaskan terlebih dahulu.', 'fa-triangle-exclamation', 'red');
            if (target.id === t.depotId) return;
            if (companyCash < DEPOT_MOVE_FEE) return showModal('Kas Tidak Cukup', `Pindah depot butuh biaya mobilisasi ${formatRupiah(DEPOT_MOVE_FEE)}.`, 'fa-triangle-exclamation', 'red');
            const asal = refineryData.find(k => k.id === t.depotId);
            companyCash -= DEPOT_MOVE_FEE; totalExpense += DEPOT_MOVE_FEE;
            t.depotId = target.id;
            addFinanceLog(`Mobilisasi ${t.id} ke ${target.nama}`, -DEPOT_MOVE_FEE);
            addLog(`PINDAH DEPOT: ${t.id} [${t.plat}] dipindah pangkalan dari ${asal ? asal.nama : '-'} ke ${target.nama}.`, 'info');
            showModal('Armada Dipindah', `${t.id} [${t.plat}] kini berpangkalan di ${target.nama}.`, 'fa-truck-fast', 'blue');
            updateCashDisplay(); renderFleetDashboard();
        }

        // ===== BELI BAHAN BAKAR KILANG UTAMA =====
        const BBL_PRICE = 1100000; let bbmWarned = false, bbmSpent = 0;
        // Batas atas kapasitas tangki (upgrade tidak bisa lewat ini): BBL mentah & LPG Curah sama-sama 10 Juta.
        const KAP_UPGRADE_CAPS = { lpg_curah: 10000000 };
        const BBL_KAP_MAX = 10000000, BBL_KAP_STEP = 200000, BBL_KAP_BASE_COST = 1500e6;
        const bblUpgradeCost = kilang => Math.round(BBL_KAP_BASE_COST * Math.pow(1.32, kilang.stokUpgradeLevel || 0));
        function upgradeBblTangki(kilangId) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || !kilang.is_unlocked) return;
            if (kilang.stok_max >= BBL_KAP_MAX) return showModal('Kapasitas Maksimum', `Tangki BBL mentah ${kilang.nama} sudah mencapai batas maksimum ${BBL_KAP_MAX.toLocaleString('id-ID')} Bbl.`, 'fa-circle-info', 'blue');
            const cost = bblUpgradeCost(kilang);
            if (companyCash < cost) return showModal('Kas Tidak Cukup', `Upgrade kapasitas tangki BBL mentah di ${kilang.nama} butuh ${formatRupiah(cost)}.`, 'fa-triangle-exclamation', 'red');
            companyCash -= cost; totalExpense += cost;
            kilang.stok_max = Math.min(BBL_KAP_MAX, kilang.stok_max + BBL_KAP_STEP);
            kilang.stokUpgradeLevel = (kilang.stokUpgradeLevel || 0) + 1;
            addFinanceLog(`Upgrade Kapasitas Tangki BBL Mentah - ${kilang.nama}`, -cost);
            updateCashDisplay();
            addLog(`KAPASITAS DITINGKATKAN: Tangki BBL mentah ${kilang.nama} kini menampung ${kilang.stok_max.toLocaleString('id-ID')} Bbl.`, 'success');
            renderRefineries();
        }
        function fuelBuyHtml(kilang) {
            const pct = Math.round((kilang.stok_current / kilang.stok_max) * 100);
            const atMax = kilang.stok_max >= BBL_KAP_MAX;
            const b = (n, l) => `<button onclick="buyFuel(${n})" class="bg-teal-700 hover:bg-teal-600 text-white rounded px-2 py-1 font-bold">${l}</button>`;
            return `<div class="pt-1.5 border-t border-gray-800 space-y-1.5">
                ${pct <= 25 ? '<div class="text-[10px] text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Stok bahan bakar menipis! Segera beli pasokan.</div>' : ''}
                <div class="text-[10px] text-gray-400"><i class="fa-solid fa-gas-pump text-amber-400 mr-1"></i>Beli bahan bakar mentah &middot; ${formatRupiah(BBL_PRICE)}/Bbl</div>
                <div class="flex flex-wrap gap-1 text-[10px]">${b(10000, '+10.000 Bbl')}${b(50000, '+50.000 Bbl')}${b(100000, '+100.000 Bbl')}${b(500000, '+500.000 Bbl')}${b(1000000, '+1 Juta Bbl')}${b(0, 'Isi Penuh')}
                    ${atMax ? '' : `<button onclick="upgradeBblTangki('${kilang.id}')" class="bg-emerald-700 hover:bg-emerald-600 text-white rounded px-2 py-1 font-bold"><i class="fa-solid fa-arrow-up-right-dots"></i> Upgrade Tangki (${formatRupiah(bblUpgradeCost(kilang))})</button>`}
                </div>
                <div class="text-[9px] text-gray-500"><i class="fa-solid fa-circle-info mr-1"></i>Stok mentah ini diolah jadi Pertalite, Pertamax, dst lewat tombol Konversi di panel Kapasitas Depo di bawah - tidak jalan sendiri.${atMax ? ' Kapasitas tangki sudah maksimum (10 Juta Bbl).' : ' Kapasitas tangki bisa di-upgrade sampai maksimum 10 Juta Bbl.'}</div></div>`;
        }
        function buyFuel(n) {
            const k = refineryData[0], room = k.stok_max - k.stok_current, qty = Math.min(n || room, room);
            if (qty <= 0) return showModal('Tangki Penuh', 'Stok Kilang Tuban sudah penuh.', 'fa-circle-info', 'blue');
            const cost = qty * BBL_PRICE;
            if (companyCash < cost) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(cost)} untuk ${qty.toLocaleString('id-ID')} Bbl.`, 'fa-triangle-exclamation', 'red');
            // Konfirmasi isi ulang pasokan kilang wajib ditandatangani dulu (bukti serah terima) sebelum transaksi dieksekusi
            openSignature(`Konfirmasi pembelian ${qty.toLocaleString('id-ID')} Bbl bahan bakar untuk Kilang Tuban seharga ${formatRupiah(cost)}. Tanda tangani kotak di bawah untuk menyetujui pembelian.`, () => {
                companyCash -= cost; totalExpense += cost; bbmSpent += cost; k.stok_current += qty; bbmWarned = false;
                addFinanceLog(`Pembelian bahan bakar ${qty.toLocaleString('id-ID')} Bbl (Kilang Tuban)`, -cost);
                updateCashDisplay(); renderRefineries();
                addLog(`PEMBELIAN BBM: ${qty.toLocaleString('id-ID')} Bbl masuk Kilang Tuban seharga ${formatRupiah(cost)} (ditandatangani).`, 'success');
                showModal('Pembelian Berhasil', `${qty.toLocaleString('id-ID')} Bbl bahan bakar masuk Kilang Tuban. Bukti pembelian sudah ditandatangani.`, 'fa-gas-pump', 'blue');
            });
        }

        // ===== LPG CURAH: diperlakukan sama seperti bahan mentah (Bbl) - beli manual, bukan diolah otomatis dari crude =====
        function lpgCurahBuyHtml(kilang) {
            const meta = PRODUCT_META.lpg_curah, slot = kilang.kap && kilang.kap.lpg_curah;
            if (!slot) return '';
            const pct = slot.max ? Math.round((slot.cur / slot.max) * 100) : 0;
            const upCost = kapUpgradeCost(meta, slot.level);
            const capMax = KAP_UPGRADE_CAPS.lpg_curah;
            const atMax = capMax && slot.max >= capMax;
            const b = (n, l) => `<button onclick="buyLpgCurah('${kilang.id}',${n})" class="bg-orange-700 hover:bg-orange-600 text-white rounded px-2 py-1 font-bold">${l}</button>`;
            return `<div class="pt-1.5 border-t border-gray-800 space-y-1.5">
                <div class="flex justify-between text-xs">
                    <span class="text-gray-200 font-bold"><i class="fa-solid fa-fire-flame-simple text-orange-400 mr-1"></i>LPG Curah <span class="text-[10px] text-gray-500 font-normal">(Bahan Mentah)</span></span>
                    <span id="lpgcurah-text-${kilang.id}" class="font-bold text-gray-200 font-mono">${slot.cur.toLocaleString('id-ID', { maximumFractionDigits: 1 })} / ${slot.max.toLocaleString('id-ID')} Ton</span>
                </div>
                <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div id="lpgcurah-bar-${kilang.id}" class="bg-orange-500 h-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
                ${pct <= 25 ? '<div class="text-[10px] text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Stok LPG Curah menipis! Segera beli pasokan.</div>' : ''}
                <div class="text-[10px] text-gray-400"><i class="fa-solid fa-fire-flame-simple text-orange-400 mr-1"></i>Beli LPG Curah &middot; ${formatRupiah(meta.buyPrice)}/Ton</div>
                <div class="flex flex-wrap gap-1 text-[10px]">${b(200, '+200 Ton')}${b(1000, '+1.000 Ton')}${b(2000, '+2.000 Ton')}${b(0, 'Isi Penuh')}
                    ${atMax ? '' : `<button onclick="upgradeKapasitas('${kilang.id}','lpg_curah')" class="bg-emerald-700 hover:bg-emerald-600 text-white rounded px-2 py-1 font-bold"><i class="fa-solid fa-arrow-up-right-dots"></i> Upgrade Tangki (${formatRupiah(upCost)})</button>`}
                </div>
                <div class="text-[9px] text-gray-500"><i class="fa-solid fa-circle-info mr-1"></i>Bahan baku LPG Tabung - konversi di panel Kapasitas Depo di bawah.${atMax ? ' Kapasitas tangki sudah maksimum (10 Juta Ton).' : ' Kapasitas tangki bisa di-upgrade sampai maksimum 10 Juta Ton.'}</div>
            </div>`;
        }
        function buyLpgCurah(kilangId, n) {
            const k = refineryData.find(x => x.id === kilangId) || refineryData[0];
            const meta = PRODUCT_META.lpg_curah;
            if (!k || !k.kap || !k.kap.lpg_curah) return;
            const slot = k.kap.lpg_curah, room = slot.max - slot.cur, qty = Math.min(n || room, room);
            if (qty <= 0) return showModal('Tangki Penuh', `Tangki LPG Curah di ${k.nama} sudah penuh.`, 'fa-circle-info', 'blue');
            const cost = Math.round(qty * meta.buyPrice);
            if (companyCash < cost) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(cost)} untuk ${qty.toLocaleString('id-ID')} Ton LPG Curah.`, 'fa-triangle-exclamation', 'red');
            openSignature(`Konfirmasi pembelian ${qty.toLocaleString('id-ID')} Ton LPG Curah untuk ${k.nama} seharga ${formatRupiah(cost)}. Tanda tangani kotak di bawah untuk menyetujui pembelian.`, () => {
                companyCash -= cost; totalExpense += cost; bbmSpent += cost;
                slot.cur = Math.min(slot.max, Math.round((slot.cur + qty) * 100) / 100);
                addFinanceLog(`Pembelian LPG Curah ${qty.toLocaleString('id-ID')} Ton (${k.nama})`, -cost);
                updateCashDisplay(); renderRefineries();
                addLog(`PEMBELIAN LPG CURAH: ${qty.toLocaleString('id-ID')} Ton masuk ${k.nama} seharga ${formatRupiah(cost)} (ditandatangani).`, 'success');
                showModal('Pembelian Berhasil', `${qty.toLocaleString('id-ID')} Ton LPG Curah masuk ${k.nama}. Bukti pembelian sudah ditandatangani.`, 'fa-fire-flame-simple', 'blue');
            });
        }

        // ===== TANDA TANGAN DIGITAL: konfirmasi transaksi (dipakai isi ulang kilang, dll) =====
        let signCtx = null, signDrawing = false, signHasStroke = false, signPendingAction = null;
        function initSignatureCanvas() {
            const canvas = document.getElementById('sign-canvas');
            if (!canvas || signCtx) return;
            signCtx = canvas.getContext('2d');
            signCtx.lineWidth = 2.2; signCtx.lineCap = 'round'; signCtx.lineJoin = 'round'; signCtx.strokeStyle = '#111827';
            const pos = e => {
                const r = canvas.getBoundingClientRect();
                const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
                const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
                return { x: cx * canvas.width / r.width, y: cy * canvas.height / r.height };
            };
            const start = e => { signDrawing = true; signHasStroke = true; const p = pos(e); signCtx.beginPath(); signCtx.moveTo(p.x, p.y); e.preventDefault(); };
            const move = e => { if (!signDrawing) return; const p = pos(e); signCtx.lineTo(p.x, p.y); signCtx.stroke(); e.preventDefault(); };
            const end = () => { signDrawing = false; };
            canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
            canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', end);
        }
        function clearSignature() {
            if (!signCtx) return;
            signCtx.clearRect(0, 0, signCtx.canvas.width, signCtx.canvas.height);
            signHasStroke = false;
            document.getElementById('sign-msg').classList.add('hidden');
        }
        function openSignature(desc, onConfirm) {
            signPendingAction = onConfirm;
            document.getElementById('sign-desc').textContent = desc;
            document.getElementById('sign-modal').classList.remove('hidden');
            setTimeout(() => { initSignatureCanvas(); clearSignature(); }, 0);
        }
        function cancelSignature() {
            document.getElementById('sign-modal').classList.add('hidden');
            signPendingAction = null;
        }
        function confirmSignature() {
            if (!signHasStroke) {
                const m = document.getElementById('sign-msg');
                m.textContent = 'Tanda tangan dulu di kotak putih di atas sebelum konfirmasi.';
                m.classList.remove('hidden');
                return;
            }
            const action = signPendingAction;
            document.getElementById('sign-modal').classList.add('hidden');
            signPendingAction = null;
            if (action) action();
        }

        function buyRefinery(kilangId) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang) return;

            if (companyCash < kilang.harga_beli) {
                showModal('Kas Tidak Cukup', `Biaya pembelian ${kilang.nama} adalah ${formatRupiah(kilang.harga_beli)}. Kas perusahaan tidak mencukupi!`, 'fa-triangle-exclamation', 'red');
                return;
            }

            companyCash -= kilang.harga_beli;
            totalExpense += kilang.harga_beli;
            kilang.is_unlocked = true;

            addFinanceLog(`Pembelian Aset ${kilang.nama}`, -kilang.harga_beli);
            updateCashDisplay();
            renderRefineries();
            recomputeWilayah();
            renderSpbuOnMap();

            addLog(`KILANG BARU DIBUKA: ${kilang.nama} telah dibeli. Stok awal 0!`, 'success');
            showModal('Kilang Berhasil Dibeli', `${kilang.nama} telah dibuka! Silakan lakukan transfer pasokan BBM dari Kilang Pusat (Tuban).`, 'fa-building-circle-check', 'blue');
        }

        // ===== KAPASITAS DEPO: upgrade tangki, isi ulang, konversi LPG curah->tabung, kirim otomatis ke cabang =====
        function kapUpgradeCost(meta, level) { return Math.round(meta.baseCost * Math.pow(1.32, level || 0)); }

        function upgradeKapasitas(kilangId, key) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || !kilang.is_unlocked || !kilang.kap || !kilang.kap[key]) return;
            const meta = PRODUCT_META[key], slot = kilang.kap[key];
            const capMax = KAP_UPGRADE_CAPS[key];
            if (capMax && slot.max >= capMax) {
                showModal('Kapasitas Maksimum', `Tangki ${meta.label} di ${kilang.nama} sudah mencapai batas maksimum ${capMax.toLocaleString('id-ID')} ${meta.unit}.`, 'fa-circle-info', 'blue');
                return;
            }
            const cost = kapUpgradeCost(meta, slot.level);
            if (companyCash < cost) {
                showModal('Kas Tidak Cukup', `Upgrade kapasitas tangki ${meta.label} di ${kilang.nama} butuh ${formatRupiah(cost)}.`, 'fa-triangle-exclamation', 'red');
                return;
            }
            companyCash -= cost; totalExpense += cost;
            slot.max = capMax ? Math.min(capMax, slot.max + meta.step) : slot.max + meta.step;
            slot.level = (slot.level || 0) + 1;
            addFinanceLog(`Upgrade Kapasitas ${meta.label} - ${kilang.nama}`, -cost);
            updateCashDisplay();
            addLog(`KAPASITAS DITINGKATKAN: Tangki ${meta.label} di ${kilang.nama} kini menampung ${slot.max.toLocaleString('id-ID')} ${meta.unit}.`, 'success');
            renderRefineries();
        }

        function isiUlangProduk(kilangId, key, amount) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || kilang.id !== 'KILANG-01' || !kilang.kap || !kilang.kap[key]) return;
            const meta = PRODUCT_META[key];
            if (!meta.buyPrice) return;
            const slot = kilang.kap[key], room = slot.max - slot.cur, qty = Math.min(amount || room, room);
            if (qty <= 0) return showModal('Tangki Penuh', `Tangki ${meta.label} di ${kilang.nama} sudah penuh.`, 'fa-circle-info', 'blue');
            const cost = Math.round(qty * meta.buyPrice);
            if (companyCash < cost) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(cost)} untuk ${qty.toLocaleString('id-ID')} ${meta.unit} ${meta.label}.`, 'fa-triangle-exclamation', 'red');
            companyCash -= cost; totalExpense += cost; bbmSpent += cost;
            slot.cur = Math.min(slot.max, Math.round((slot.cur + qty) * 100) / 100);
            addFinanceLog(`Pembelian ${meta.label} ${qty.toLocaleString('id-ID')} ${meta.unit} (${kilang.nama})`, -cost);
            updateCashDisplay(); renderRefineries();
            addLog(`PEMBELIAN ${meta.label.toUpperCase()}: ${qty.toLocaleString('id-ID')} ${meta.unit} masuk ${kilang.nama}.`, 'success');
        }

        // Lama proses olah (ms), makin besar jumlah yang dikonversi makin lama animasinya berjalan (dibatasi min/max biar tetap enak dimainkan).
        function refineDurationMs(amount, scale) {
            const s = scale || amount || 1;
            return Math.min(6000, Math.max(1200, Math.round((amount / s) * 1800)));
        }

        function convertLpgCurah(kilangId) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || !kilang.kap || !kilang.kap.lpg_curah || !kilang.kap.lpg_tabung) return;
            const curah = kilang.kap.lpg_curah, tabung = kilang.kap.lpg_tabung, RATIO = 0.92;
            if (tabung.refining) return; // sedang diolah, tombol seharusnya sudah disembunyikan/nonaktif
            const room = tabung.max - tabung.cur;
            const amount = Math.min(curah.cur, room / RATIO);
            if (amount <= 0) {
                showModal('Tidak Bisa Konversi', curah.cur <= 0 ? `Stok LPG Curah di ${kilang.nama} kosong.` : `Tangki LPG Tabung di ${kilang.nama} sudah penuh.`, 'fa-circle-exclamation', 'amber');
                return;
            }
            const hasil = Math.round(amount * RATIO * 100) / 100;
            const durasi = refineDurationMs(amount, 1500);
            // Bahan mentah LPG Curah langsung terpakai begitu proses dimulai; hasil LPG Tabung baru masuk tangki setelah durasi olah selesai.
            curah.cur = Math.round((curah.cur - amount) * 100) / 100;
            tabung.refining = true;
            addLog(`KONVERSI LPG: ${kilang.nama} mulai mengolah ${amount.toLocaleString('id-ID')} Ton LPG Curah menjadi LPG Tabung (&plusmn;${Math.round(durasi / 1000)} detik).`, 'info');
            renderRefineries();
            setTimeout(() => {
                tabung.cur = Math.min(tabung.max, Math.round((tabung.cur + hasil) * 100) / 100);
                tabung.refining = false;
                addLog(`KONVERSI SELESAI: ${hasil.toLocaleString('id-ID')} Ton LPG Tabung siap distribusi di ${kilang.nama}.`, 'success');
                showModal('Konversi Selesai', `${amount.toLocaleString('id-ID')} Ton LPG Curah berhasil diolah menjadi ${hasil.toLocaleString('id-ID')} Ton LPG Tabung di ${kilang.nama}. (Susut proses pengisian tabung 8%)`, 'fa-fire-flame-simple', 'blue');
                renderRefineries();
            }, durasi);
        }

        // ===== KONVERSI BBL -> BBM: manual lewat tombol, prosesnya berjalan sesuai durasi (tidak instan, tidak otomatis lagi) =====
        // n = jumlah produk (KL) yang mau dihasilkan sekali klik; n=0/kosong artinya "isi penuh sebisa mungkin".
        function convertBblKeProduk(kilangId, key, n) {
            const kilang = refineryData.find(k => k.id === kilangId);
            if (!kilang || !kilang.kap || !kilang.kap[key]) return;
            const meta = PRODUCT_META[key], slot = kilang.kap[key];
            if (!meta || !meta.refineRatio) return;
            if (slot.refining) return; // sedang diolah, tombol seharusnya sudah disembunyikan/nonaktif
            const room = slot.max - slot.cur;
            const maxByBbl = kilang.stok_current / meta.refineRatio;
            const amount = Math.min(n || room, room, maxByBbl);
            if (amount <= 0) {
                showModal('Tidak Bisa Konversi', kilang.stok_current <= 0 ? `Stok BBL mentah di ${kilang.nama} kosong.` : `Tangki ${meta.label} di ${kilang.nama} sudah penuh.`, 'fa-circle-exclamation', 'amber');
                return;
            }
            const bblUsed = Math.round(amount * meta.refineRatio * 100) / 100;
            const durasi = refineDurationMs(amount, BBL_CONVERT_STEP[key]);
            // BBL mentah langsung terpakai/terkunci begitu proses dimulai; hasil BBM baru masuk tangki setelah durasi olah selesai.
            kilang.stok_current = Math.max(0, Math.round((kilang.stok_current - bblUsed) * 100) / 100);
            slot.refining = true;
            addLog(`KONVERSI BBL: ${kilang.nama} mulai mengolah ${bblUsed.toLocaleString('id-ID')} Bbl mentah menjadi ${meta.label} (&plusmn;${Math.round(durasi / 1000)} detik).`, 'info');
            renderRefineries();
            setTimeout(() => {
                slot.cur = Math.min(slot.max, Math.round((slot.cur + amount) * 100) / 100);
                slot.refining = false;
                addLog(`KONVERSI SELESAI: ${amount.toLocaleString('id-ID')} ${meta.unit} ${meta.label} siap di ${kilang.nama}.`, 'success');
                showModal('Konversi Selesai', `${bblUsed.toLocaleString('id-ID')} Bbl BBL mentah berhasil diolah menjadi ${amount.toLocaleString('id-ID')} ${meta.unit} ${meta.label} di ${kilang.nama}.`, meta.icon, 'blue');
                renderRefineries();
            }, durasi);
        }

        const KAP_KIRIM_STEP = { pertalite: 3000, pertamax: 2500, pertamax_turbo: 1200, solar: 3000, dexlite: 1800, lpg_curah: 500 };
        function kirimProdukKeDepo(key) {
            const sel = document.getElementById('kap-kirim-target-' + key);
            if (!sel || !sel.value) return showModal('Pilih Tujuan', 'Pilih dulu Depo Cabang tujuan pengiriman.', 'fa-circle-exclamation', 'amber');
            const pusat = refineryData[0], target = refineryData.find(k => k.id === sel.value), meta = PRODUCT_META[key];
            if (!pusat.kap[key] || !target || !target.kap || !target.kap[key]) return;
            const room = target.kap[key].max - target.kap[key].cur;
            const amount = Math.min(KAP_KIRIM_STEP[key] || 500, pusat.kap[key].cur, room);
            if (amount <= 0) {
                showModal('Tidak Bisa Kirim', pusat.kap[key].cur <= 0 ? `Stok ${meta.label} di Kilang Tuban kosong.` : `Tangki ${meta.label} di ${target.nama} sudah penuh.`, 'fa-circle-exclamation', 'amber');
                return;
            }
            pusat.kap[key].cur = Math.round((pusat.kap[key].cur - amount) * 100) / 100;
            target.kap[key].cur = Math.round((target.kap[key].cur + amount) * 100) / 100;
            addLog(`KIRIM OTOMATIS: ${amount.toLocaleString('id-ID')} ${meta.unit} ${meta.label} dikirim dari Kilang Tuban ke ${target.nama}${key === 'lpg_curah' ? ' (curah, siap dikonversi jadi tabung di sana)' : ''}.`, 'purple');
            showModal('Pengiriman Terkirim', `${amount.toLocaleString('id-ID')} ${meta.unit} ${meta.label} berhasil dikirim otomatis ke ${target.nama}.`, key === 'lpg_curah' ? 'fa-truck-ramp-box' : 'fa-gas-pump', 'blue');
            renderRefineries();
        }

        const BBL_KIRIM_STEP = 8000;
        function kirimBblKeDepo() {
            const sel = document.getElementById('kap-kirim-target-bbl');
            if (!sel || !sel.value) return showModal('Pilih Tujuan', 'Pilih dulu Depo Cabang tujuan pengiriman.', 'fa-circle-exclamation', 'amber');
            const pusat = refineryData[0], target = refineryData.find(k => k.id === sel.value);
            if (!pusat || !target) return;
            const room = target.stok_max - target.stok_current;
            const amount = Math.min(BBL_KIRIM_STEP, pusat.stok_current, room);
            if (amount <= 0) {
                showModal('Tidak Bisa Kirim', pusat.stok_current <= 0 ? 'Stok BBL mentah di Kilang Tuban kosong.' : `Tangki BBL mentah di ${target.nama} sudah penuh.`, 'fa-circle-exclamation', 'amber');
                return;
            }
            pusat.stok_current = Math.max(0, Math.round((pusat.stok_current - amount) * 100) / 100);
            target.stok_current = Math.min(target.stok_max, Math.round((target.stok_current + amount) * 100) / 100);
            addLog(`KIRIM OTOMATIS: ${amount.toLocaleString('id-ID')} Bbl BBL mentah dikirim dari Kilang Tuban ke ${target.nama} (siap diolah jadi BBM di sana lewat tombol Konversi).`, 'purple');
            showModal('Pengiriman Terkirim', `${amount.toLocaleString('id-ID')} Bbl BBL mentah berhasil dikirim otomatis ke ${target.nama}. Olah sendiri jadi BBM di panel Kapasitas Depo cabang tersebut.`, 'fa-gas-pump', 'blue');
            renderRefineries();
        }

        const openKapPanels = new Set(); // id kilang yang panel "Kapasitas Depo"-nya sedang dibuka user - dipakai supaya tidak ikut nutup tiap renderRefineries()
        function toggleKapPanel(id) {
            const el = document.getElementById('kap-panel-' + id), btn = document.getElementById('kap-toggle-' + id);
            if (!el) return;
            el.classList.toggle('hidden');
            const nowOpen = !el.classList.contains('hidden');
            if (nowOpen) openKapPanels.add(id); else openKapPanels.delete(id);
            if (btn) { const ic = btn.querySelector('.kap-chev'); if (ic) ic.classList.toggle('rotate-180', nowOpen); }
        }

        function renderKapPanel(kilang) {
            if (!kilang.kap) return '';
            const keys = Object.keys(kilang.kap);
            if (!keys.length) return '';
            const isPusat = kilang.id === 'KILANG-01';
            // LPG Curah sudah tampil sebagai gauge bahan mentah sendiri (lpgCurahBuyHtml, sejajar BBL mentah) di Kilang
            // Pusat, jadi tidak perlu dobel muncul lagi di daftar kecil "Kapasitas Depo" ini.
            const visibleKeys = isPusat ? keys.filter(k => k !== 'lpg_curah') : keys;
            const rows = visibleKeys.map(key => {
                const meta = PRODUCT_META[key], slot = kilang.kap[key];
                const pct = slot.max ? Math.round((slot.cur / slot.max) * 100) : 0;
                const cost = kapUpgradeCost(meta, slot.level);
                // BBL (bahan mentah) diolah jadi BBM (Pertalite/Pertamax/dst) lewat tombol Konversi manual - tidak lagi otomatis.
                // Berlaku di Kilang Pusat MAUPUN Depo Cabang BBM: cabang mengolah sendiri stok BBL mentah yang dikirim dari pusat.
                const isBbmRefine = meta.refineRatio && key !== 'lpg_curah' && key !== 'lpg_tabung';
                // Badge "Diolah" dipakai untuk animasi selama proses konversi berjalan (BBL->BBM maupun LPG Curah->Tabung).
                const showsRefineBadge = isBbmRefine || key === 'lpg_tabung';
                const restockBtn = (isPusat && meta.buyPrice && !meta.refineRate)
                    ? `<button onclick="isiUlangProduk('${kilang.id}','${key}',${meta.step})" class="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-200 rounded px-1.5 py-0.5 font-semibold"><i class="fa-solid fa-plus"></i> Isi ${meta.step.toLocaleString('id-ID')} ${meta.unit}</button>`
                    : '';
                const refineBadge = showsRefineBadge
                    ? `<span id="kap-refine-${kilang.id}-${key}" class="${slot.refining ? '' : 'hidden'} text-[8px] text-amber-300 font-semibold shrink-0 ml-1"><i class="fa-solid fa-industry fa-fade mr-0.5"></i>Diolah</span>`
                    : '';
                const refineInfo = isBbmRefine
                    ? `<div class="text-[9px] text-gray-500 mb-1"><i class="fa-solid fa-arrows-turn-right mr-1 text-amber-500"></i>Diolah dari stok BBL mentah lewat tombol Konversi &middot; butuh ${meta.refineRatio.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Bbl mentah / ${meta.unit}</div>`
                    : '';
                const convStep = BBL_CONVERT_STEP[key] || 0;
                const convertBblRow = isBbmRefine
                    ? (slot.refining
                        ? `<div class="mb-1"><button disabled class="w-full text-[9px] bg-amber-900/60 text-amber-200 rounded px-1.5 py-1 font-bold cursor-not-allowed"><i class="fa-solid fa-industry fa-fade mr-1"></i>Sedang Diolah Jadi ${meta.label}...</button></div>`
                        : `<div class="flex gap-1 flex-wrap mb-1">
                        <button onclick="convertBblKeProduk('${kilang.id}','${key}',${Math.max(1, Math.round(convStep / 4))})" class="text-[9px] bg-amber-800 hover:bg-amber-700 text-white rounded px-1.5 py-0.5 font-semibold">+${Math.max(1, Math.round(convStep / 4)).toLocaleString('id-ID')} ${meta.unit}</button>
                        <button onclick="convertBblKeProduk('${kilang.id}','${key}',${convStep})" class="text-[9px] bg-amber-800 hover:bg-amber-700 text-white rounded px-1.5 py-0.5 font-semibold">+${convStep.toLocaleString('id-ID')} ${meta.unit}</button>
                        <button onclick="convertBblKeProduk('${kilang.id}','${key}',0)" class="text-[9px] bg-amber-700 hover:bg-amber-600 text-white rounded px-1.5 py-0.5 font-bold"><i class="fa-solid fa-arrows-turn-to-dots mr-1"></i>Konversi BBL &rarr; ${meta.label} (Isi Penuh)</button>
                    </div>`)
                    : '';
                const capMax = KAP_UPGRADE_CAPS[key];
                const atCap = capMax && slot.max >= capMax;
                const upgradeBtn = atCap
                    ? `<span class="text-[9px] text-gray-500 px-1.5 py-0.5"><i class="fa-solid fa-circle-check mr-1"></i>Kapasitas maksimum</span>`
                    : `<button onclick="upgradeKapasitas('${kilang.id}','${key}')" class="text-[9px] bg-emerald-700 hover:bg-emerald-600 text-white rounded px-1.5 py-0.5 font-semibold"><i class="fa-solid fa-arrow-up-right-dots"></i> Upgrade Tangki (${formatRupiah(cost)})</button>`;
                return `<div class="text-[10px]">
                    <div class="flex justify-between items-center mb-0.5 gap-1">
                        <span class="text-gray-300 font-semibold truncate flex items-center"><i class="fa-solid ${meta.icon} mr-1" style="color:${meta.color}"></i>${meta.label}${refineBadge}</span>
                        <span id="kap-text-${kilang.id}-${key}" class="font-mono text-gray-400 shrink-0">${slot.cur.toLocaleString('id-ID', { maximumFractionDigits: 1 })}/${slot.max.toLocaleString('id-ID')} ${meta.unit}</span>
                    </div>
                    <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1">
                        <div id="kap-bar-${kilang.id}-${key}" class="${slot.refining ? 'refine-flow' : ''} h-full transition-all duration-500" style="width:${pct}%;background:${meta.color}"></div>
                    </div>
                    ${refineInfo}
                    ${convertBblRow}
                    <div class="flex gap-1 flex-wrap">
                        ${restockBtn}
                        ${upgradeBtn}
                    </div>
                </div>`;
            }).join('<div class="border-t border-gray-800/70"></div>');

            const convertBtn = (kilang.kap.lpg_curah && kilang.kap.lpg_tabung)
                ? (kilang.kap.lpg_tabung.refining
                    ? `<button disabled class="w-full mt-1.5 bg-amber-900/60 text-amber-200 text-[10px] font-bold py-1.5 rounded cursor-not-allowed"><i class="fa-solid fa-industry fa-fade mr-1"></i> Sedang Diolah Jadi Tabung...</button>`
                    : `<button onclick="convertLpgCurah('${kilang.id}')" class="w-full mt-1.5 bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold py-1.5 rounded"><i class="fa-solid fa-arrows-turn-to-dots mr-1"></i> Konversi LPG Curah &rarr; Tabung</button>`)
                : '';

            let kirimForm = '';
            if (isPusat) {
                // Kilang Pusat HANYA mengirim bahan mentah (BBL & LPG Curah) ke Depo Cabang - BBM/LPG Tabung jadi
                // tidak lagi dikirim jadi dari sini, tiap cabang wajib mengolah sendiri stok mentah yang diterima
                // lewat tombol Konversi di panelnya masing-masing.
                const bblOpts = refineryData.filter(d => d.is_unlocked && d.id !== 'KILANG-01' && d.unit === 'Bbl')
                    .map(d => `<option value="${d.id}">${d.nama}</option>`).join('');
                const bblRow = bblOpts ? `<div class="flex gap-1 items-center">
                        <span class="text-[9px] text-gray-400 w-16 shrink-0 truncate">BBL Mentah</span>
                        <select id="kap-kirim-target-bbl" class="flex-1 bg-gray-900 border border-gray-800 rounded text-[9px] px-1 py-0.5 text-gray-200 min-w-0"><option value="">-- Tujuan Depo --</option>${bblOpts}</select>
                        <button onclick="kirimBblKeDepo()" class="text-[9px] bg-blue-700 hover:bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold shrink-0">Kirim</button>
                    </div>` : '';
                const cabangOpts = k2 => refineryData.filter(d => d.is_unlocked && d.id !== 'KILANG-01' && d.kap && d.kap[k2])
                    .map(d => `<option value="${d.id}">${d.nama}</option>`).join('');
                const rows2 = keys.filter(k2 => k2 === 'lpg_curah').map(k2 => {
                    const opts = cabangOpts(k2);
                    if (!opts) return '';
                    return `<div class="flex gap-1 items-center">
                        <span class="text-[9px] text-gray-400 w-16 shrink-0 truncate">${PRODUCT_META[k2].label}</span>
                        <select id="kap-kirim-target-${k2}" class="flex-1 bg-gray-900 border border-gray-800 rounded text-[9px] px-1 py-0.5 text-gray-200 min-w-0"><option value="">-- Tujuan Depo --</option>${opts}</select>
                        <button onclick="kirimProdukKeDepo('${k2}')" class="text-[9px] bg-blue-700 hover:bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold shrink-0">Kirim</button>
                    </div>`;
                }).join('');
                if (bblRow || rows2) kirimForm = `<div class="mt-2 pt-2 border-t border-gray-800 space-y-1">
                    <div class="text-[9px] text-gray-500 uppercase font-bold">Kirim Bahan Mentah ke Depo Cabang</div>
                    ${bblRow}${rows2}
                </div>`;
            }

            const isOpen = openKapPanels.has(kilang.id);
            return `<div class="pt-1.5 border-t border-gray-800">
                <button id="kap-toggle-${kilang.id}" onclick="toggleKapPanel('${kilang.id}')" class="w-full flex items-center justify-between text-[10px] font-bold text-teal-400 uppercase tracking-wide py-1">
                    <span><i class="fa-solid fa-warehouse mr-1"></i> Kapasitas Depo (${visibleKeys.length} Jenis)</span>
                    <i class="fa-solid fa-chevron-down kap-chev text-[9px] transition-transform${isOpen ? ' rotate-180' : ''}"></i>
                </button>
                <div id="kap-panel-${kilang.id}" class="${isOpen ? '' : 'hidden'} space-y-1.5 mt-1">
                    ${rows}
                    ${convertBtn}
                    ${kirimForm}
                </div>
            </div>`;
        }

        // ===== PENGOLAHAN BBL: sekarang manual lewat tombol Konversi (lihat convertBblKeProduk) =====
        // Update tampilan bar stok mentah & tiap tangki produk tanpa render ulang seluruh kartu (biar panel yg lagi
        // dibuka pemain, misal Kapasitas Depo, tidak ikut ke-collapse tiap kali proses olah berdenyut).
        function updateKilangLiveBars(kilang) {
            if (!kilang) return;
            const pct = kilang.stok_max ? Math.round((kilang.stok_current / kilang.stok_max) * 100) : 0;
            const crudeBar = document.getElementById('crude-bar-' + kilang.id);
            const crudeTxt = document.getElementById('crude-text-' + kilang.id);
            const anyRefining = kilang.kap ? Object.values(kilang.kap).some(s => s.refining) : false;
            if (crudeTxt) crudeTxt.innerText = `${Math.round(kilang.stok_current).toLocaleString('id-ID')} / ${kilang.stok_max.toLocaleString('id-ID')} ${kilang.unit}`;
            if (crudeBar) {
                crudeBar.style.width = pct + '%';
                crudeBar.classList.toggle('bg-red-500', pct <= 15);
                crudeBar.classList.toggle('bg-emerald-500', pct > 15);
                crudeBar.classList.toggle('refine-flow', anyRefining);
            }
            const indicator = document.getElementById('refine-indicator-' + kilang.id);
            if (indicator) indicator.classList.toggle('hidden', !anyRefining);

            const lpgSlot = kilang.kap && kilang.kap.lpg_curah;
            if (lpgSlot) {
                const lpgBar = document.getElementById('lpgcurah-bar-' + kilang.id);
                const lpgTxt = document.getElementById('lpgcurah-text-' + kilang.id);
                const lpgPct = lpgSlot.max ? Math.round((lpgSlot.cur / lpgSlot.max) * 100) : 0;
                if (lpgTxt) lpgTxt.innerText = `${lpgSlot.cur.toLocaleString('id-ID', { maximumFractionDigits: 1 })} / ${lpgSlot.max.toLocaleString('id-ID')} Ton`;
                if (lpgBar) lpgBar.style.width = lpgPct + '%';
            }

            Object.keys(kilang.kap || {}).forEach(key => {
                const meta = PRODUCT_META[key], slot = kilang.kap[key];
                const kBar = document.getElementById(`kap-bar-${kilang.id}-${key}`);
                const kTxt = document.getElementById(`kap-text-${kilang.id}-${key}`);
                const kBadge = document.getElementById(`kap-refine-${kilang.id}-${key}`);
                const kpct = slot.max ? Math.round((slot.cur / slot.max) * 100) : 0;
                if (kTxt) kTxt.innerText = `${slot.cur.toLocaleString('id-ID', { maximumFractionDigits: 1 })}/${slot.max.toLocaleString('id-ID')} ${meta.unit}`;
                if (kBar) { kBar.style.width = kpct + '%'; kBar.classList.toggle('refine-flow', !!slot.refining); }
                if (kBadge) kBadge.classList.toggle('hidden', !slot.refining);
            });
        }

        // Kredit hasil pengiriman Kilang Pusat -> Depo Cabang (rute kapal/darat). Untuk Depo Cabang LPG, muatan
        // "LPG Curah" masuk ke tangki kap.lpg_curah (yang benar-benar dipakai tombol Konversi LPG Curah -> Tabung),
        // bukan ke gauge atas yang terpisah, supaya LPG curah yang dikirim beneran bisa diolah cabang.
        // Untuk Depo Cabang BBM, BBL mentah tetap masuk ke gauge atas (stok_current), sama seperti dipakai
        // convertBblKeProduk. Mengembalikan info tangki yang dikredit, untuk ditampilkan di log.
        function creditKlgDelivery(target, amount) {
            if (target.kap && target.kap.lpg_curah && target.tipe.includes('LPG')) {
                const slot = target.kap.lpg_curah;
                slot.cur = Math.min(slot.max, Math.round((slot.cur + amount) * 100) / 100);
                return { cur: slot.cur, max: slot.max, unit: 'Ton' };
            }
            target.stok_current = Math.min(target.stok_max, Math.round((target.stok_current + amount) * 10) / 10);
            return { cur: target.stok_current, max: target.stok_max, unit: target.unit };
        }

        // Info rute transfer Kilang Pusat -> Depo tujuan: jenis muatan yg dibutuhkan & apakah dua-duanya Pesisir
        // (kalau ya, bisa dilayani kapal tanker; kalau tidak, hanya bisa lewat jalur darat).
        function transferModeInfo() {
            const targetId = document.getElementById('transfer-target-select').value;
            const pusat = refineryData[0];
            const target = refineryData.find(k => k.id === targetId);
            if (!target) return { target: null, pusat, neededType: null, coastal: false };
            const neededType = target.tipe.includes('LPG') ? 'LPG' : 'BBM';
            return { target, pusat, neededType, coastal: isCoastal(pusat) && isCoastal(target) };
        }

        // Isi ulang dropdown Unit Kapal Tanker & tampilkan/sembunyikan panel laut vs darat sesuai kelayakan rute.
        function populateTransferKapal() {
            const sel = document.getElementById('transfer-kapal-select');
            const wrapKapal = document.getElementById('transfer-kapal-wrap');
            const wrapLand = document.getElementById('transfer-land-wrap');
            const hint = document.getElementById('transfer-hint');
            if (!sel || !wrapKapal) return;
            const info = transferModeInfo();
            const prev = sel.value;
            sel.innerHTML = '';
            let ships = [];
            if (info.target && info.coastal) {
                ships = companyFleet.filter(t => t.kelas === 'kapal' && t.type === info.neededType && !busyIds.has(t.id));
                ships.forEach(s => { const o = document.createElement('option'); o.value = s.id; o.innerText = `${s.id} [${s.plat}] - ${s.name} (${s.cap.toLocaleString()} ${info.neededType === 'LPG' ? 'Ton' : 'KL'})`; sel.appendChild(o); });
            }
            if (prev && sel.querySelector(`option[value="${prev}"]`)) sel.value = prev;
            else if (sel.options.length) sel.selectedIndex = 0;

            const useKapal = !!(info.target && info.coastal && ships.length);
            wrapKapal.classList.toggle('hidden', !useKapal);
            if (wrapLand) wrapLand.classList.toggle('hidden', useKapal);

            if (hint) {
                if (!info.target) hint.textContent = '';
                else if (info.coastal && !ships.length) hint.textContent = `${info.target.nama} berakses pelabuhan (Pesisir), tapi Anda belum punya Kapal Tanker ${info.neededType} - beli dulu di tab Dealer, atau kirim sementara lewat jalur darat di bawah.`;
                else if (info.coastal) hint.textContent = `${info.target.nama} berakses pelabuhan - kirim otomatis pakai Kapal Tanker ${info.neededType}, durasi pelayaran mengikuti jarak laut sesungguhnya.`;
                else hint.textContent = `${info.target.nama} tidak berakses pelabuhan (Darat) - hanya bisa ditransfer lewat jalur darat.`;
            }
            if (useKapal) populateTransferCrew();
        }

        // Isi ulang dropdown Nahkoda & ABK yang sedang tidak bertugas.
        function populateTransferCrew() {
            const nSel = document.getElementById('transfer-nahkoda-select');
            const aSel = document.getElementById('transfer-abk-select');
            if (!nSel || !aSel) return;
            const prev = [nSel.value, aSel.value];
            nSel.innerHTML = ''; aSel.innerHTML = '';
            companyCrew.forEach(c => {
                if (busyIds.has(c.id)) return;
                const stars = '★'.repeat(repToStars(c.reputation));
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = `${c.name} (${stars} Rep ${Math.round(c.reputation)} - Viol: ${c.violations})`;
                if (c.role === 'Nahkoda') nSel.appendChild(opt.cloneNode(true));
                else if (c.role === 'ABK') aSel.appendChild(opt.cloneNode(true));
            });
            [nSel, aSel].forEach((el, i) => { if (prev[i] && el.querySelector(`option[value="${prev[i]}"]`)) el.value = prev[i]; else if (el.options.length) el.selectedIndex = 0; });
        }

        function executeTransferStock() {
            const info = transferModeInfo();
            if (!info.target) return showModal('Peringatan', 'Pilih depo tujuan terlebih dahulu!', 'fa-circle-exclamation', 'red');

            const wrapKapal = document.getElementById('transfer-kapal-wrap');
            const useKapal = wrapKapal && !wrapKapal.classList.contains('hidden');
            const { pusat, target, neededType } = info;

            // ===== RUTE LAUT: Kapal Tanker (Kilang Pusat <-> Depo Pesisir), volume = kapasitas kapal, durasi = jarak laut =====
            if (useKapal) {
                const kapal = companyFleet.find(t => t.id === document.getElementById('transfer-kapal-select').value);
                const nahkoda = companyCrew.find(c => c.id === document.getElementById('transfer-nahkoda-select').value);
                const abk = companyCrew.find(c => c.id === document.getElementById('transfer-abk-select').value);
                if (!kapal || !nahkoda || !abk) return showModal('Peringatan', 'Lengkapi pilihan Kapal Tanker, Nahkoda & ABK!', 'fa-circle-exclamation', 'red');
                if (busyCheck(kapal, nahkoda, abk)) return;
                if (docBlock(kapal)) return;

                const bblUse = target.unit === 'KL' ? Math.ceil(kapal.cap * ECO.bblPerKl) : kapal.cap;
                if (pusat.stok_current < bblUse) return showModal('Stok Kurang', `Stok Kilang Tuban tidak cukup untuk memuat kapal (butuh setara ${kapal.cap.toLocaleString()} ${target.unit}).`, 'fa-triangle-exclamation', 'red');

                const d = { spbu: target, truck: kapal, driver: nahkoda, kernet: abk, origin: pusat };
                openSuratJalanModal({ mode: 'KLG', tujuanNama: target.nama, tujuanKode: target.id, jenisMuatan: `${neededType} Curah (dari Kilang Pusat Tuban)`, volumeText: `${kapal.cap.toLocaleString()} ${target.unit}`,
                    truck: kapal, driver: nahkoda, kernet: abk, labels: { truk: 'Unit Kapal Tanker', plat: 'No. Registrasi', driver: 'Nahkoda Bertugas', kernet: 'ABK Pendamping' },
                    execute: (nomorSJ) => {
                        if (pusat.stok_current < bblUse) return showModal('Stok Kurang', 'Stok Kilang Tuban tidak mencukupi!', 'fa-triangle-exclamation', 'red');
                        pusat.stok_current = Math.max(0, pusat.stok_current - bblUse);
                        renderRefineries();
                        d.nomorSJ = nomorSJ;
                        animateKapalTransfer(d);
                        addLog(`SURAT JALAN ${nomorSJ}: Kapal ${kapal.id} [Nahkoda: ${nahkoda.name}] DITANDATANGANI & BERLAYAR membawa ${kapal.cap.toLocaleString()} ${target.unit} ${neededType} curah ke ${target.nama}.`, 'purple');
                        showModal('Kapal Berangkat', `Surat Jalan ${nomorSJ} telah ditandatangani. ${kapal.id} resmi berlayar membawa ${kapal.cap.toLocaleString()} ${target.unit} ke ${target.nama}.\nStok depo tujuan bertambah otomatis setelah kapal tiba & kru selesai bongkar muatan.`, 'fa-ship', 'blue');
                    } });
                return;
            }

            // ===== RUTE DARAT: transfer instan (truk konvoi, diabstraksikan) untuk depo tanpa akses pelabuhan =====
            const amount = parseInt(document.getElementById('transfer-amount-input').value);
            if (isNaN(amount) || amount <= 0) return showModal('Peringatan', 'Masukkan jumlah transfer yang valid!', 'fa-circle-exclamation', 'red');
            const bblUse = target.unit === 'KL' ? Math.ceil(amount * ECO.bblPerKl) : amount;
            if (pusat.stok_current < bblUse) return showModal('Stok Kurang', `Stok Kilang Tuban tidak mencukupi!`, 'fa-triangle-exclamation', 'red');

            openSuratJalanModal({ mode: 'KLG', tujuanNama: target.nama, tujuanKode: target.id, jenisMuatan: `${neededType} (dari Kilang Pusat Tuban, jalur darat)`, volumeText: `${amount.toLocaleString()} ${target.unit}`,
                execute: (nomorSJ) => {
                    if (pusat.stok_current < bblUse) {
                        showModal('Stok Kurang', 'Stok Kilang Tuban tidak mencukupi!', 'fa-triangle-exclamation', 'red');
                        return;
                    }
                    pusat.stok_current -= bblUse;
                    creditKlgDelivery(target, amount);

                    renderRefineries();
                    document.getElementById('transfer-amount-input').value = '';

                    addLog(`SURAT JALAN ${nomorSJ}: TRANSFER PASOKAN DARAT ${amount.toLocaleString()} ${target.unit} dikirim dari Tuban ke ${target.nama}.`, 'purple');
                    showModal('Transfer Berhasil', `Surat Jalan ${nomorSJ} telah ditandatangani. Berhasil mentransfer ${amount.toLocaleString()} ${target.unit} ${neededType} ke ${target.nama} lewat jalur darat.`, 'fa-truck-arrow-right', 'blue');
                } });
        }

        function filterSpbuByRegion() {
            const selectedRegion = document.getElementById('delivery-region-filter').value;
            populateSpbuDropdowns(selectedRegion);
            const l = loadedSpbuList.filter(s => isOp(s) && (selectedRegion === 'ALL' || s.wilayahId === selectedRegion));
            if (l.length) map.flyToBounds(L.latLngBounds(l.map(s => [s.lat, s.lon])), { maxZoom: 11, padding: [30, 30] });
        }

        function renderSpbuOnMap() {
            mapMarkers.forEach(m => map.removeLayer(m));
            mapMarkers = [];

            let activeSpbuCount = 0;

            loadedSpbuList.forEach(spbu => {
                if (!spbu.is_approved) return;

                if (!spbu.blocked) activeSpbuCount++;
                let markerColor = spbu.tipe === 'COCO' ? '#3b82f6' : '#a855f7';
                if (spbu.has_lpg) markerColor = '#f97316';
                if (spbu.blocked) markerColor = '#ef4444';

                const marker = L.circleMarker([spbu.lat, spbu.lon], {
                    radius: spbu.has_lpg ? 6.5 : 5,
                    fillColor: markerColor,
                    color: "#ffffff",
                    weight: 1.2,
                    fillOpacity: spbu.blocked ? 0.45 : 0.85
                }).addTo(map);

                marker.bindPopup(`
                    <div class="text-gray-900 font-sans p-1">
                        <div class="text-[10px] font-bold text-blue-700">${spbu.kode}</div>
                        <strong class="text-xs font-bold block">${spbu.nama}</strong>
                        <div class="text-[10px] text-gray-600">Kab/Kota: ${spbu.region}</div>
                        <div class="text-[10px] text-gray-600">Wilayah BBM Terdekat: <b>${spbu.wilayahBbmNama || '-'}</b>${spbu.wilayahBbmJarak != null ? ` (&plusmn;${spbu.wilayahBbmJarak} km)` : ''}</div>
                        ${spbu.has_lpg ? `<div class="text-[10px] text-gray-600">Wilayah LPG Terdekat: <b>${spbu.wilayahLpgNama || '-'}</b>${spbu.wilayahLpgJarak != null ? ` (&plusmn;${spbu.wilayahLpgJarak} km)` : ''}</div>` : ''}
                        <div class="text-[10px] text-gray-600">Keramaian: <b>${TRAFFIC[spbu.traffic || (spbu.traffic = pickTraffic())].label}</b> &middot; konsumsi BBM/LPG ${TRAFFIC[spbu.traffic].mult}x</div>
                        <div class="text-[10px] text-gray-600">${spbu.tipe === 'COCO' ? 'Milik perusahaan (dikelola swasta)' : 'Mitra: ' + esc(spbu.mitra ? spbu.mitra.nama : '-')}${spbu.has_lpg ? ' &middot; + LPG' : ''}</div>
                        ${spbu.blocked ? '<div class="text-[10px] font-bold text-red-600">DIBLOKIR - operasional off</div>' : ''}
                    </div>
                `);

                mapMarkers.push(marker);
            });

            document.getElementById('kpis-spbu-count').innerText = `${activeSpbuCount} Unit`;
        }

        function populateSpbuDropdowns(filterRegion = 'ALL') {
            const deliverySelect = document.getElementById('delivery-spbu-select');
            const lpgSelect = document.getElementById('lpg-spbu-select');
            const prevDelivery = deliverySelect.value, prevLpg = lpgSelect.value;

            deliverySelect.innerHTML = '';
            lpgSelect.innerHTML = '';

            const filteredList = loadedSpbuList.filter(s => isOp(s) && (filterRegion === 'ALL' || s.wilayahId === filterRegion));
            // Dropdown target dispatch SEKARANG cuma nampilin SPBU yang lagi punya pesanan terbuka -
            // dispatch bebas ke SPBU yang stoknya masih aman dimatikan supaya nggak dobel/bentrok
            // sama alur Pesanan SPBU. Transfer antar Kilang/Depo (tab Kilang) TIDAK kena filter ini.
            const orderFor = (kode, wantLpg) => orders.find(x => x.kode === kode && (wantLpg ? x.fuel === 'lpg' : x.fuel !== 'lpg'));

            filteredList.forEach(spbu => {
                const oBbm = orderFor(spbu.kode, false);
                if (oBbm) {
                    const opt1 = document.createElement('option');
                    opt1.value = spbu.kode;
                    opt1.innerText = `[${spbu.kode}] ${spbu.nama} \u{1F4E6} Pesan ${fuelLabel(oBbm.fuel)} ${oBbm.kl - oBbm.terkirim} KL (+6%)`;
                    deliverySelect.appendChild(opt1);
                }

                if (spbu.has_lpg) {
                    const oLpg = orderFor(spbu.kode, true);
                    if (oLpg) {
                        const opt2 = document.createElement('option');
                        opt2.value = spbu.kode;
                        opt2.innerText = `[${spbu.kode}] ${spbu.nama} - Outlet LPG \u{1F4E6} Pesan ${oLpg.kl - oLpg.terkirim} Ton (+6%)`;
                        lpgSelect.appendChild(opt2);
                    }
                }
            });

            if (!deliverySelect.options.length) deliverySelect.appendChild(new Option('-- Tidak ada SPBU dengan pesanan terbuka saat ini --', ''));
            if (!lpgSelect.options.length) lpgSelect.appendChild(new Option('-- Tidak ada Outlet LPG dengan pesanan terbuka saat ini --', ''));

            // Pertahankan pilihan SPBU sebelumnya kalau masih ada di daftar hasil filter,
            // supaya isian form pemain nggak kereset tiap dropdown di-refresh.
            if (prevDelivery && deliverySelect.querySelector(`option[value="${prevDelivery}"]`)) deliverySelect.value = prevDelivery;
            if (prevLpg && lpgSelect.querySelector(`option[value="${prevLpg}"]`)) lpgSelect.value = prevLpg;
        }

        function populateTruckDropdowns() {
            const deliveryTruckSelect = document.getElementById('delivery-truck-select');
            const lpgTruckSelect = document.getElementById('lpg-truck-select');
            const prev = [deliveryTruckSelect.value, lpgTruckSelect.value];

            deliveryTruckSelect.innerHTML = '';
            lpgTruckSelect.innerHTML = '';

            companyFleet.forEach(trk => {
                if (busyIds.has(trk.id)) return; // sedang bertugas, sembunyikan dari pilihan
                if (trk.kelas === 'kapal') return; // kapal cuma buat transfer Kilang<->Depo, bukan ke SPBU
                const opt = document.createElement('option');
                opt.value = trk.id;
                opt.innerText = `${trk.id} [${trk.plat}] - ${trk.name}`;

                if (trk.type === 'BBM') deliveryTruckSelect.appendChild(opt);
                else lpgTruckSelect.appendChild(opt);
            });
            [deliveryTruckSelect, lpgTruckSelect].forEach((el, i) => { if (prev[i] && el.querySelector(`option[value="${prev[i]}"]`)) el.value = prev[i]; });
            if (!deliveryTruckSelect.value && deliveryTruckSelect.options.length) deliveryTruckSelect.selectedIndex = 0;
            if (!lpgTruckSelect.value && lpgTruckSelect.options.length) lpgTruckSelect.selectedIndex = 0;
            populateTransferKapal();
        }

        // POPULATE DROPDOWN DRIVER & KERNET
        function populateCrewDropdowns() {
            const dDriver = document.getElementById('delivery-driver-select');
            const dKernet = document.getElementById('delivery-kernet-select');
            const lDriver = document.getElementById('lpg-driver-select');
            const lKernet = document.getElementById('lpg-kernet-select');

            const prev = [dDriver.value, dKernet.value, lDriver.value, lKernet.value];
            dDriver.innerHTML = ''; dKernet.innerHTML = '';
            lDriver.innerHTML = ''; lKernet.innerHTML = '';

            companyCrew.forEach(c => {
                if (busyIds.has(c.id)) return; // sedang bertugas, sembunyikan dari pilihan
                const stars = '★'.repeat(repToStars(c.reputation));
                const text = `${c.name} (${stars} Rep ${Math.round(c.reputation)} - Viol: ${c.violations})`;
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = text;

                if (c.role === 'Supir') {
                    dDriver.appendChild(opt.cloneNode(true));
                    lDriver.appendChild(opt.cloneNode(true));
                } else if (c.role === 'Kernet') {
                    dKernet.appendChild(opt.cloneNode(true));
                    lKernet.appendChild(opt.cloneNode(true));
                }
            });
            [dDriver, dKernet, lDriver, lKernet].forEach((el, i) => { if (prev[i] && el.querySelector(`option[value="${prev[i]}"]`)) el.value = prev[i]; });
            [dDriver, dKernet, lDriver, lKernet].forEach(el => { if (!el.value && el.options.length) el.selectedIndex = 0; });
            populateTransferCrew();
        }

        // ===== KEMITRAAN: izin, tagihan bulanan, blokir otomatis =====
        const DAY_MS = 86400000;
        const MITRA_CFG = { cycleDays: 30, graceDays: 10, izin: { BBM: 60e6, LPG: 100e6 }, bulanan: { BBM: 6e6, LPG: 10e6 }, setorCoco: { BBM: 1.5e6, LPG: 2.5e6 }, maxIzinBulan: 20 };
        let izinLog = { mi: -1, n: 0 };
        const miNow = () => Math.floor((gameNow() - GAME_START) / (MITRA_CFG.cycleDays * DAY_MS));
        let lastSetor = 0;
        const NAMA_MITRA = ['Maju Jaya', 'Berkah Energi', 'Sumber Rejeki', 'Karya Mandiri', 'Nusa Petro', 'Cahaya Utama', 'Mitra Sejahtera', 'Bumi Lestari', 'Sinar Timur', 'Tirta Abadi', 'Artha Prima', 'Gemilang Karya'];
        const dShort = ms => new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const jenisKey = s => s.has_lpg ? 'LPG' : 'BBM';
        function newMitra(s) {
            const k = jenisKey(s);
            return { nama: (Math.random() < 0.6 ? 'PT ' : 'CV ') + NAMA_MITRA[Math.floor(Math.random() * NAMA_MITRA.length)], bulanan: MITRA_CFG.bulanan[k], rel: 0.6 + Math.random() * 0.37, due: gameNow() + MITRA_CFG.cycleDays * DAY_MS, telat: false, telatSejak: 0, lastDay: -1, lastTagih: -1, sejak: gameNow(), total: 0 };
        }
        function renderInvestorTab() { renderMitraSearch(); renderMitraActive(); }
        function renderMitraSearch() {
            const c = document.getElementById('investor-spbu-list'); if (!c) return;
            const q = (document.getElementById('mitra-q').value || '').toLowerCase().trim(), jf = document.getElementById('mitra-lpg').value;
            const all = loadedSpbuList.filter(x => !x.is_approved && x.tipe === 'DODO' && (jf === 'ALL' || jenisKey(x) === jf) && (!q || `${x.region} ${x.provinsi} ${x.nama} ${x.kode}`.toLowerCase().includes(q)));
            const list = all.slice(0, q ? 30 : 10);
            const kuota = `<div class="text-[10px] text-pink-300 bg-pink-500/10 border border-pink-500/30 rounded px-2 py-1">Kuota izin bulan ini: ${izinLog.mi === miNow() ? izinLog.n : 0}/${MITRA_CFG.maxIzinBulan}</div>`;
            if (!list.length) { c.innerHTML = kuota + '<div class="text-xs text-gray-500 text-center py-4">Tidak ada lokasi tersedia untuk pencarian ini.</div>'; return; }
            c.innerHTML = kuota + list.map(x => { const k = jenisKey(x); return `<div class="p-2.5 bg-gray-900 rounded-lg border border-gray-800 flex justify-between items-center gap-2">
                <div class="min-w-0"><div class="text-[10px] text-purple-400 font-bold">${x.kode} <span class="${x.has_lpg ? 'text-amber-400' : 'text-gray-400'}">&middot; ${x.has_lpg ? 'SPBU + LPG' : 'SPBU tanpa LPG'}</span></div>
                <div class="font-bold text-gray-200 text-xs truncate">${esc(x.nama)}</div><div class="text-[10px] text-gray-400">${esc(x.region)} &middot; ${esc(x.provinsi || '')}</div>
                <div class="text-[10px] text-emerald-400">Izin ${formatRupiah(MITRA_CFG.izin[k])} &middot; Iuran ${formatRupiah(MITRA_CFG.bulanan[k])}/bln</div></div>
                <button onclick="approveMitra('${x.kode}')" class="shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow">Setujui</button></div>`; }).join('')
                + (all.length > list.length ? `<div class="text-[10px] text-gray-500 text-center">Menampilkan ${list.length} dari ${all.length}. Persempit pencarian.</div>` : '');
        }
        function approveMitra(kode) {
            const x = loadedSpbuList.find(v => v.kode === kode); if (!x || x.is_approved) return;
            const k = jenisKey(x), fee = MITRA_CFG.izin[k];
            if (izinLog.mi !== miNow()) izinLog = { mi: miNow(), n: 0 };
            if (izinLog.n >= MITRA_CFG.maxIzinBulan) return showModal('Kuota Izin Habis', `Maksimal ${MITRA_CFG.maxIzinBulan} izin mitra baru per bulan game. Coba lagi bulan depan.`, 'fa-ban', 'red');
            izinLog.n++;
            x.is_approved = true; x.blocked = false; x.mitra = newMitra(x); x.mitra.total = fee;
            companyCash += fee; totalIncome += fee; addFinanceLog(`Biaya izin mitra ${x.mitra.nama} - ${x.nama}`, fee); updateCashDisplay();
            renderSpbuOnMap(); populateSpbuDropdowns(); renderInvestorTab();
            map.flyTo([x.lat, x.lon], 11);
            addLog(`PERIZINAN DISETUJUI: ${x.nama} (${x.mitra.nama}) aktif di peta. Biaya izin ${formatRupiah(fee)} diterima.`, 'purple');
            showModal('Kemitraan Disetujui', `${x.nama} (${x.mitra.nama}) kini aktif${x.has_lpg ? ' dengan outlet LPG' : ''}. Biaya izin ${formatRupiah(fee)} diterima; iuran ${formatRupiah(x.mitra.bulanan)}/bulan jatuh tempo ${dShort(x.mitra.due)}.`, 'fa-circle-check', 'purple');
        }
        function revokeMitra(x) {
            x.blocked = true; x.blockedAt = gameNow();
            orders.filter(o => o.kode === x.kode).forEach(o => closeOrder(o, 'Batal'));
            addLog(`LISENSI DICABUT: ${x.nama} (${x.mitra.nama}) menunggak lebih dari ${MITRA_CFG.graceDays} hari. SPBU diblokir, operasional OFF.`, 'warning');
            notify(`Lisensi ${x.nama} dicabut & diblokir (tunggakan > ${MITRA_CFG.graceDays} hari). Bisa diambil alih di tab Mitra.`, 'warn');
            renderSpbuOnMap(); populateSpbuDropdowns(); renderInvestorTab();
        }
        function tagihMitra(kode) {
            const x = loadedSpbuList.find(v => v.kode === kode), m = x && x.mitra; if (!m || !m.telat || x.blocked) return;
            const day = Math.floor(gameNow() / DAY_MS); if (m.lastTagih === day) return showModal('Sudah Ditagih', 'Penagihan hanya bisa 1x per hari game.', 'fa-clock', 'purple');
            m.lastTagih = day;
            if (Math.random() < 0.5) { payMitra(x, true); showModal('Tagihan Dibayar', `${m.nama} melunasi tunggakan setelah ditagih.`, 'fa-circle-check', 'purple'); }
            else showModal('Belum Dibayar', `${m.nama} berjanji membayar, tetapi belum ada pembayaran.`, 'fa-hourglass-half', 'purple');
            renderMitraActive();
        }
        function payMitra(x, late) {
            const m = x.mitra; companyCash += m.bulanan; totalIncome += m.bulanan; m.total += m.bulanan;
            addFinanceLog(`Iuran bulanan ${m.nama} - ${x.nama}${late ? ' (terlambat)' : ''}`, m.bulanan);
            m.telat = false; m.due = (late ? gameNow() : m.due) + MITRA_CFG.cycleDays * DAY_MS; updateCashDisplay();
        }
        async function takeOverSpbu(kode) {
            const x = loadedSpbuList.find(v => v.kode === kode); if (!x || !x.blocked) return;
            if (!(await showConfirm(`Ambil alih ${x.nama}? Tunggakan mitra dihapus, SPBU menjadi milik perusahaan dan dikelola swasta.`, { title: 'Ambil Alih SPBU', iconClass: 'fa-hand-holding-dollar', theme: 'blue', okLabel: 'Ambil Alih' }))) return;
            x.mitraLama = x.mitra && x.mitra.nama; delete x.mitra; x.blocked = false; x.tipe = 'COCO'; x.taken = true;
            addLog(`AMBIL ALIH: ${x.nama} kini milik perusahaan & dikelola swasta.`, 'success');
            renderSpbuOnMap(); populateSpbuDropdowns(); renderInvestorTab();
            showModal('Berhasil Diambil Alih', `${x.nama} aktif kembali sebagai SPBU perusahaan (dikelola swasta) dan memberi setoran bulanan.`, 'fa-circle-check', 'blue');
        }
        function tickMitra() {
            const now = gameNow(), day = Math.floor(now / DAY_MS);
            loadedSpbuList.forEach(x => {
                const m = x.mitra; if (!m || !isOp(x)) return;
                if (!m.telat && now >= m.due) {
                    if (Math.random() < m.rel) payMitra(x, false);
                    else { m.telat = true; m.telatSejak = m.due; m.lastDay = day; addLog(`TUNGGAKAN: ${m.nama} (${x.nama}) belum membayar iuran ${formatRupiah(m.bulanan)}.`, 'warning'); notify(`${m.nama} menunggak iuran ${x.nama}. Batas ${MITRA_CFG.graceDays} hari sebelum lisensi dicabut.`, 'warn'); }
                } else if (m.telat) {
                    if (now - m.telatSejak > MITRA_CFG.graceDays * DAY_MS) return revokeMitra(x);
                    if (m.lastDay !== day) { m.lastDay = day; if (Math.random() < 0.2) payMitra(x, true); }
                }
            });
            const mi = miNow();
            if (mi > lastSetor) {
                const bln = mi - lastSetor, gaji = Math.round(companyCrew.reduce((n, c) => n + (ECO[ROLE_META[c.role].salary][0] + c.reputation * ECO[ROLE_META[c.role].salary][1]), 0) * bln);
                if (gaji > 0) { companyCash -= gaji; totalExpense += gaji; addFinanceLog(`Gaji kru (${companyCrew.length} orang, ${bln} bulan)`, -gaji); addLog(`GAJI KRU: ${formatRupiah(gaji)} dibayarkan untuk ${companyCrew.length} kru.`, 'info'); updateCashDisplay(); }
                const own = loadedSpbuList.filter(x => isOp(x) && x.tipe === 'COCO'); let tot = 0;
                own.forEach(x => tot += MITRA_CFG.setorCoco[jenisKey(x)] * (mi - lastSetor));
                lastSetor = mi;
                if (tot > 0) { companyCash += tot; totalIncome += tot; addFinanceLog(`Setoran pengelola swasta (${own.length} SPBU milik perusahaan)`, tot); addLog(`PENDAPATAN SPBU: setoran pengelola swasta ${formatRupiah(tot)} dari ${own.length} SPBU.`, 'success'); updateCashDisplay(); }
            }
            if (!document.getElementById('tab-partnership').classList.contains('hidden')) renderMitraActive();
        }
        function renderMitraActive() {
            const c = document.getElementById('mitra-active-list'); if (!c) return;
            const ms = loadedSpbuList.filter(x => x.mitra && x.is_approved), now = gameNow();
            const act = ms.filter(x => !x.blocked && !x.mitra.telat).length, tel = ms.filter(x => !x.blocked && x.mitra.telat).length, blk = ms.filter(x => x.blocked).length;
            const own = loadedSpbuList.filter(x => isOp(x) && x.tipe === 'COCO'), est = own.reduce((n, x) => n + MITRA_CFG.setorCoco[jenisKey(x)], 0);
            const kpi = (l, v, cl) => `<div class="bg-gray-900 rounded-lg p-2 text-center border border-gray-800"><div class="text-[9px] text-gray-500">${l}</div><div class="font-mono font-black text-sm ${cl}">${v}</div></div>`;
            document.getElementById('mitra-kpi').innerHTML = kpi('Aktif', act, 'text-emerald-400') + kpi('Menunggak', tel, 'text-amber-400') + kpi('Diblokir', blk, 'text-red-400')
                + `<div class="col-span-3 text-[10px] text-gray-400 bg-gray-900 rounded-lg p-2 border border-gray-800">SPBU milik perusahaan (dikelola swasta): <b class="text-blue-400">${own.length}</b> &middot; estimasi setoran <b class="text-emerald-400">${formatRupiah(est)}</b>/bulan</div>`;
            const order = x => x.blocked ? 0 : x.mitra.telat ? 1 : 2;
            c.innerHTML = ms.length ? ms.sort((a, b) => order(a) - order(b)).map(x => {
                const m = x.mitra; let badge, extra = '', btn = '';
                if (x.blocked) { badge = '<span class="text-red-400 font-bold">DIBLOKIR</span>'; extra = `<div class="text-[10px] text-red-300">Lisensi dicabut ${dShort(x.blockedAt)} &middot; operasional off</div>`; btn = `<button onclick="takeOverSpbu('${x.kode}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Ambil Alih</button>`; }
                else if (m.telat) { const d = Math.floor((now - m.telatSejak) / DAY_MS); badge = `<span class="text-amber-400 font-bold">MENUNGGAK ${d}/${MITRA_CFG.graceDays} hari</span>`; extra = `<div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1"><div class="bg-red-500 h-full" style="width:${Math.min(100, d / MITRA_CFG.graceDays * 100)}%"></div></div>`; btn = `<button onclick="tagihMitra('${x.kode}')" class="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Tagih</button>`; }
                else { badge = '<span class="text-emerald-400 font-bold">AKTIF</span>'; extra = `<div class="text-[10px] text-gray-500">Tagihan berikut ${dShort(m.due)} &middot; ${formatRupiah(m.bulanan)}</div>`; }
                return `<div class="p-2.5 bg-gray-900 rounded-lg border ${x.blocked ? 'border-red-500/50' : 'border-gray-800'} flex justify-between items-center gap-2"><div class="min-w-0 flex-1"><div class="text-[10px]">${badge} <span class="text-gray-500">&middot; ${esc(m.nama)}${x.has_lpg ? ' &middot; +LPG' : ''}</span></div><div class="font-bold text-gray-200 text-xs truncate">${esc(x.nama)}</div><div class="text-[10px] text-gray-400">${esc(x.region)}</div>${extra}</div>${btn}</div>`;
            }).join('') : '<div class="text-xs text-gray-500 text-center py-3">Belum ada mitra. Setujui izin di atas.</div>';
        }
        setInterval(() => { if (currentAccount) tickMitra(); }, 3000);

        // DASHBOARD 1: TAB KHUSUS FISIK ARMADA
        // Susun satu kartu armada (dipakai di dalam kelompok jenis+pangkalan pada renderFleetDashboard)
        function fleetCardHtml(trk) {
                const depot = refineryData.find(k => k.id === trk.depotId) || refineryData[0];
                const depotOptions = refineryData.filter(k => k.is_unlocked && k.mekanikId)
                    .map(k => `<option value="${k.id}" ${k.id === trk.depotId ? 'selected' : ''}>${k.nama}</option>`).join('');

                return `<div class="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2.5">
                    <div class="flex justify-between items-center border-b border-gray-800 pb-2">
                        <div>
                            <span class="text-[10px] font-mono bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">${trk.id}</span>
                            <h4 class="font-bold text-gray-200 text-xs inline-block ml-1.5">${trk.name}</h4>
                        </div>
                        <span class="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">${trk.plat}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-[10px]">
                        <div class="bg-gray-950 p-2 rounded border border-gray-800 col-span-2">
                            ${trk.kelas === 'kapal' ? `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400"><i class="fa-solid fa-route mr-1 text-gray-500"></i>Jarak Tempuh: <b class="text-gray-200 font-mono">${trk.odometer.toLocaleString('id-ID')} km</b></span>
                                <span class="text-gray-400"><i class="fa-solid fa-gauge-high mr-1 text-gray-500"></i>Kondisi Mesin: <b class="${banCls(trk.banPct)} font-mono">${trk.banPct}%</b></span>
                            </div>
                            <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1"><div class="${banBar(trk.banPct)} h-full" style="width:${trk.banPct}%"></div></div>
                            <div class="text-[9px] text-gray-500 mt-0.5">Kapal tidak pakai ban - ini kondisi mesin &amp; lambung, diservis otomatis begitu sandar di depot kalau sudah menipis.</div>
                            ` : `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400"><i class="fa-solid fa-road mr-1 text-gray-500"></i>Odometer: <b class="text-gray-200 font-mono">${trk.odometer.toLocaleString('id-ID')} km</b></span>
                                <span class="text-gray-400"><i class="fa-solid fa-circle-dot mr-1 text-gray-500"></i>Ban: <b class="${banCls(trk.banPct)} font-mono">${trk.banPct}%</b></span>
                            </div>
                            <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1"><div class="${banBar(trk.banPct)} h-full" style="width:${trk.banPct}%"></div></div>
                            <div class="text-[9px] text-gray-500 mt-0.5">Ban otomatis diganti kru bengkel begitu tiba di depot kalau sisa &le;${TIRE_REPLACE_THRESHOLD}%.</div>
                            `}
                        </div>
                        <div class="bg-gray-950 p-2 rounded border border-gray-800">
                            <span class="text-gray-400 block">Masa Uji KIR:</span>
                            <span class="font-semibold ${docCls(trk.kirTs)} font-mono">${docTxt(trk.kirTs)}</span>
                            ${trk.kirPending
                                ? `<div class="mt-1 text-amber-400 font-sans"><i class="fa-solid fa-hourglass-half mr-1"></i>Diverifikasi Dishub, selesai ${fmtTime(trk.kirPending)}</div>`
                                : `<button onclick="renewDoc('${trk.id}','kir')" class="block mt-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded px-2 py-0.5 font-sans">Kirim ke Dishub ${formatRupiah(kirRenewCost(trk))}</button>`}
                        </div>
                        <div class="bg-gray-950 p-2 rounded border border-gray-800">
                            <span class="text-gray-400 block">STNK Aktif (5 th):</span>
                            <span class="font-semibold ${docCls(trk.stnkTs)} font-mono">${docTxt(trk.stnkTs)}</span>
                            <button onclick="renewDoc('${trk.id}','stnk')" class="block mt-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded px-2 py-0.5 font-sans">Perpanjang ${formatRupiah(stnkRenewCost(trk))}</button>
                        </div>
                        <div class="bg-gray-950 p-2 rounded border border-gray-800">
                            <span class="text-gray-400 block">Plat Nomor (5 th):</span>
                            <span class="font-semibold ${docCls(trk.platTs)} font-mono">${docTxt(trk.platTs)}</span>
                            <button onclick="renewDoc('${trk.id}','plat')" class="block mt-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded px-2 py-0.5 font-sans">Perpanjang ${formatRupiah(platRenewCost(trk))}</button>
                        </div>
                        <div class="bg-gray-950 p-2 rounded border border-gray-800">
                            <span class="text-gray-400 block">Pangkalan Depo:</span>
                            <span class="font-semibold text-teal-300">${depot ? depot.nama : '-'}</span>
                            <select id="depot-sel-${trk.id}" class="w-full mt-1 bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-gray-200 font-sans">${depotOptions}</select>
                            <button onclick="pindahDepot('${trk.id}')" class="block mt-1 w-full bg-gray-800 hover:bg-gray-700 text-gray-200 rounded px-2 py-0.5 font-sans">Pindah Depot ${formatRupiah(DEPOT_MOVE_FEE)}</button>
                        </div>
                    </div>

                    <div class="pt-1 border-t border-gray-800">
                        ${busyIds.has(trk.id)
                            ? `<button disabled class="w-full bg-gray-800/60 text-gray-500 font-semibold py-1.5 rounded-lg text-[11px] cursor-not-allowed"><i class="fa-solid fa-truck-fast mr-1.5"></i>Sedang Bertugas &mdash; Tidak Bisa Dijual</button>`
                            : `<button onclick="openSellModal('${trk.id}')" class="w-full bg-orange-600/90 hover:bg-orange-600 text-white font-semibold py-1.5 rounded-lg text-[11px] transition"><i class="fa-solid fa-right-left mr-1.5"></i>Jual ke Bursa P2P</button>`}
                    </div>
                </div>`;
        }

        const FLEET_CATS = [
            { key: 'truk-bbm', label: 'Truk BBM', icon: 'fa-truck', match: t => t.kelas !== 'kapal' && t.type === 'BBM' },
            { key: 'truk-lpg', label: 'Truk LPG', icon: 'fa-truck-ramp-box', match: t => t.kelas !== 'kapal' && t.type === 'LPG' },
            { key: 'kapal', label: 'Kapal', icon: 'fa-ship', match: t => t.kelas === 'kapal' }
        ];
        let fleetCatFilter = 'ALL', fleetDepotFilter = 'ALL';
        function setFleetCat(key) { fleetCatFilter = key; fleetDepotFilter = 'ALL'; renderFleetDashboard(); }
        function setFleetDepot(key) { fleetDepotFilter = key; renderFleetDashboard(); }
        function renderFleetDashboard() {
            const container = document.getElementById('fleet-list-container');
            container.innerHTML = '';
            if (!companyFleet.length) {
                document.getElementById('fleet-cat-tabs').innerHTML = '';
                document.getElementById('fleet-depot-tabs').innerHTML = '';
                container.innerHTML = '<div class="text-xs text-gray-500 text-center py-4">Belum punya armada. Beli truk di tab Dealer Armada (biaya KIR, STNK &amp; plat ikut dibayar).</div>'; return;
            }

            // Chip kategori: klik "Kapal" supaya cuma kapal yang tampil, dst. Klik langsung judul kelompoknya juga sama efeknya.
            document.getElementById('fleet-cat-tabs').innerHTML = [{ key: 'ALL', label: 'Semua', icon: 'fa-layer-group' }, ...FLEET_CATS].map(c =>
                `<button onclick="setFleetCat('${c.key}')" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${fleetCatFilter === c.key ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'}"><i class="fa-solid ${c.icon}"></i>${c.label}</button>`
            ).join('');

            const catsToShow = fleetCatFilter === 'ALL' ? FLEET_CATS : FLEET_CATS.filter(c => c.key === fleetCatFilter);
            const refOrderIdx = refineryData.map(k => k.id);

            // Chip pangkalan: cuma menampilkan depo yang benar-benar punya unit di kategori yang sedang dipilih.
            // Klik nama kilang (mis. "Kilang Tuban") supaya cuma armada berpangkalan di sana yang muncul.
            const scope = catsToShow.flatMap(cat => companyFleet.filter(cat.match));
            const depotSeen = new Map();
            scope.forEach(trk => {
                const depot = refineryData.find(k => k.id === trk.depotId && k.is_unlocked);
                const key = depot ? depot.id : 'IDLE';
                if (!depotSeen.has(key)) depotSeen.set(key, depot);
            });
            const depotKeysAll = [...depotSeen.keys()].sort((a, b) => (a === 'IDLE' ? 1 : b === 'IDLE' ? -1 : refOrderIdx.indexOf(a) - refOrderIdx.indexOf(b)));
            document.getElementById('fleet-depot-tabs').innerHTML = [{ key: 'ALL', label: 'Semua Pangkalan' }, ...depotKeysAll.map(k => ({ key: k, label: k === 'IDLE' ? 'Idle' : depotSeen.get(k).nama }))].map(c =>
                `<button onclick="setFleetDepot('${c.key}')" class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${fleetDepotFilter === c.key ? 'bg-teal-600 border-teal-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'}">${esc(c.label)}</button>`
            ).join('');

            const html = catsToShow.map(cat => {
                const list = companyFleet.filter(cat.match);
                if (!list.length) return '';
                const byDepot = new Map(); // id kilang (atau 'IDLE') -> { depot, trucks: [] }
                list.forEach(trk => {
                    const depot = refineryData.find(k => k.id === trk.depotId && k.is_unlocked);
                    const key = depot ? depot.id : 'IDLE';
                    if (!byDepot.has(key)) byDepot.set(key, { depot, trucks: [] });
                    byDepot.get(key).trucks.push(trk);
                });
                const depotKeys = [...byDepot.keys()].filter(dk => fleetDepotFilter === 'ALL' || dk === fleetDepotFilter)
                    .sort((a, b) => (a === 'IDLE' ? 1 : b === 'IDLE' ? -1 : refOrderIdx.indexOf(a) - refOrderIdx.indexOf(b)));
                if (!depotKeys.length) return '';
                return `<div class="space-y-2.5">
                  <div onclick="setFleetCat('${cat.key}')" class="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-200 border-b border-gray-700 pb-1.5 cursor-pointer select-none" title="Klik untuk hanya tampilkan kategori ini">
                    <i class="fa-solid ${cat.icon} text-cyan-400"></i><span>${cat.label}</span><span class="ml-auto font-mono text-[10px] bg-gray-900 border border-gray-800 rounded-full px-2 py-0.5 normal-case text-gray-400">${list.length} unit</span>
                  </div>
                  ${depotKeys.map(dk => {
                      const grp = byDepot.get(dk), d = grp.depot;
                      return `<div class="pl-1 space-y-2">
                        <div onclick="setFleetDepot('${dk}')" class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${d ? 'text-teal-400' : 'text-amber-400'} cursor-pointer select-none" title="Klik untuk hanya tampilkan pangkalan ini">
                          <i class="fa-solid ${d ? (d.id === 'KILANG-01' ? 'fa-industry' : 'fa-warehouse') : 'fa-triangle-exclamation'}"></i>
                          <span>${d ? esc(d.nama) : 'Idle &middot; Belum Ada Pangkalan Valid'}</span>
                          <span class="ml-auto font-mono text-[9px] text-gray-500 normal-case">${grp.trucks.length} unit</span>
                        </div>
                        <div class="space-y-2.5">${grp.trucks.map(fleetCardHtml).join('')}</div>
                      </div>`;
                  }).join('')}
                </div>`;
            }).join('');
            container.innerHTML = html || '<div class="text-xs text-gray-500 text-center py-4">Tidak ada armada yang cocok dengan filter ini.</div>';
        }

        // ===== SISTEM REPUTASI KRU =====
        let crewIdCounter = 10;
        let recruitRole = 'Supir';
        let candidatePool = { Supir: [], Kernet: [], Mekanik: [], Nahkoda: [], ABK: [] };

        // Metadata generik per role - dipusatkan di sini biar nambah role baru (Nahkoda/ABK utk kapal)
        // gak perlu ubah ternary di banyak tempat.
        const ROLE_META = {
            Supir:   { salary: 'gajiSupir',   hireBase: 1000000, hirePer: 40000, idPrefix: 'DRV-', icon: 'fa-id-card' },
            Kernet:  { salary: 'gajiKernet',  hireBase: 600000,  hirePer: 20000, idPrefix: 'KRN-', icon: 'fa-user-gear' },
            Mekanik: { salary: 'gajiMekanik', hireBase: 800000,  hirePer: 30000, idPrefix: 'MEK-', icon: 'fa-screwdriver-wrench' },
            Nahkoda: { salary: 'gajiNahkoda', hireBase: 1200000, hirePer: 45000, idPrefix: 'NHK-', icon: 'fa-user-tie' },
            ABK:     { salary: 'gajiABK',     hireBase: 650000,  hirePer: 22000, idPrefix: 'ABK-', icon: 'fa-anchor' }
        };

        const FIRST_NAMES = ['Eko','Setyo','Hendra','Deni','Bambang','Rudi','Agus','Slamet','Wahyu','Dimas','Yusuf','Heru','Bayu','Rizal','Joko','Andi','Fajar','Tono','Rian','Gunawan','Purnomo','Anwar','Imam','Taufik','Hadi','Sugeng'];
        const LAST_NAMES = ['Prasetyo','Budiman','Wijaya','Raharjo','Sukoco','Hartono','Santoso','Saputra','Kurniawan','Nugroho','Utomo','Wibowo','Firmansyah','Setiawan','Susanto','Hidayat','Mulyadi','Suryanto'];

        function repToStars(rep) { return Math.min(5, Math.max(1, Math.round(rep / 20))); }

        function repInfo(rep) {
            if (rep >= 85) return { label: 'Sangat Terpercaya', text: 'text-emerald-400', bar: 'bg-emerald-500' };
            if (rep >= 70) return { label: 'Terpercaya', text: 'text-blue-400', bar: 'bg-blue-500' };
            if (rep >= 50) return { label: 'Cukup', text: 'text-amber-400', bar: 'bg-amber-500' };
            if (rep >= 30) return { label: 'Buruk', text: 'text-orange-400', bar: 'bg-orange-500' };
            return { label: 'Sangat Buruk', text: 'text-red-400', bar: 'bg-red-500' };
        }

        // Peluang pelanggaran per tugas: makin rendah reputasi, makin besar risikonya
        function violationChance(rep) {
            if (rep >= 90) return 0.02;
            if (rep >= 75) return 0.06;
            if (rep >= 60) return 0.15;
            if (rep >= 40) return 0.28;
            return 0.42;
        }

        function riskLabel(rep) {
            const ch = violationChance(rep);
            if (ch <= 0.06) return { label: 'Risiko Rendah', cls: 'text-emerald-400', icon: 'fa-shield-halved' };
            if (ch <= 0.15) return { label: 'Risiko Sedang', cls: 'text-amber-400', icon: 'fa-eye' };
            return { label: 'Risiko Tinggi', cls: 'text-red-400', icon: 'fa-triangle-exclamation' };
        }

        // Harga rekrut: makin tinggi reputasi, makin mahal
        function hireCost(role, rep) {
            const m = ROLE_META[role];
            return Math.round((m.hireBase + rep * m.hirePer) / 50000) * 50000;
        }

        // ===== REKRUTMEN KRU: KANDIDAT =====
        const KOTA = ['Surabaya','Malang','Sidoarjo','Gresik','Tuban','Bojonegoro','Ngawi','Madiun','Kediri','Jember','Banyuwangi','Probolinggo','Pasuruan','Lamongan','Mojokerto','Situbondo'];
        const SKILLS = { Supir: ['Mengemudi','Disiplin','Keselamatan'], Kernet: ['Ketelitian','Stamina','Disiplin'], Mekanik: ['Servis Mesin','Kelistrikan','Ketelitian'],
                         Nahkoda: ['Navigasi','Kepemimpinan','Disiplin'], ABK: ['Stamina','Ketelitian','Kerja Tim'] };
        const TAGS = {
            Supir: ['SIM B2 Umum','Diklat Defensive Driving','Sertifikat Angkutan B3','Hafal Jalur Pantura','Terbiasa Tol Trans-Jawa'],
            Kernet: ['Sertifikat K3 Dasar','Cekatan Bongkar Muat','Paham Prosedur Segel','Pernah Kerja di SPBU','Terlatih APAR'],
            Mekanik: ['Sertifikat Mekanik Diesel','Bengkel Resmi Terlatih','Spesialis Tangki BBM','Pengalaman Kilang/Depo','K3 Bengkel'],
            Nahkoda: ['ANT (Ahli Nautika)','Sertifikat BST','Hafal Jalur Pelayaran Nusantara','Pengalaman Kapal Tanker','Radar & GPS Bersertifikat'],
            ABK: ['Sertifikat BST Dasar','Cekatan Tambat Kapal','Paham Prosedur Muatan B3 Laut','Pernah Berlayar Antar Pulau','Terlatih Alat Keselamatan Laut']
        };
        const AVATAR = ['bg-purple-600','bg-blue-600','bg-emerald-600','bg-amber-600','bg-rose-600','bg-cyan-600','bg-indigo-600'];
        const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
        const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
        let recruitSort = 'cost';
        let confirmCid = null;

        function generateCandidate(role) {
            const used = new Set([...companyCrew.map(c => c.name), ...candidatePool[role].map(c => c.name)]);
            let name, guard = 0;
            do {
                name = FIRST_NAMES[rnd(0, FIRST_NAMES.length - 1)] + ' ' + LAST_NAMES[rnd(0, LAST_NAMES.length - 1)];
                guard++;
            } while (used.has(name) && guard < 50);
            if (used.has(name)) name += ' ' + 'ABCDEFGHJKLMNPRSTW'[rnd(0, 17)] + '.';
            const base = rnd(18, 96);
            const skills = SKILLS[role].map(() => clamp(base + rnd(-12, 12)));
            const reputation = Math.round(skills.reduce((a, b) => a + b, 0) / skills.length);
            const exp = clamp(Math.round((base - 15) / 7) + rnd(0, 3), 0, 25);
            const tags = [...TAGS[role]].sort(() => Math.random() - 0.5).slice(0, base > 70 ? 3 : base > 45 ? 2 : 1);
            return { cid: 'CND-' + (++crewIdCounter), name, role, reputation, skills, exp, tags,
                     age: 19 + exp + rnd(0, 9), kota: KOTA[rnd(0, KOTA.length - 1)], cost: hireCost(role, reputation) };
        }

        function ensureCandidatePool(role, force = false) {
            if (force) candidatePool[role] = [];
            while (candidatePool[role].length < 500) candidatePool[role].push(generateCandidate(role));
        }

        // Hasil satu tugas: pelanggaran -> reputasi turun; sukses -> reputasi naik perlahan
        function applyTripResult(member) {
            member.trips += 1;
            if (Math.random() < violationChance(member.reputation)) {
                const drop = 6 + Math.floor(Math.random() * 7); // -6 s/d -12
                member.reputation = Math.max(0, member.reputation - drop);
                member.violations += 1;
                return { violated: true, drop: drop };
            }
            member.reputation = Math.min(100, member.reputation + 1);
            return { violated: false, drop: 0 };
        }

        // DASHBOARD 2: TAB KHUSUS SDM DRIVER
        function renderDriversDashboard() {
            const container = document.getElementById('driver-list-container');
            container.innerHTML = '';
            if (!companyCrew.length) container.innerHTML = '<div class="text-xs text-gray-500 text-center py-4">Belum ada supir &amp; kernet. Klik Rekrut untuk merekrut kru sebelum bisa mengirim BBM/LPG.</div>';

            companyCrew.forEach(c => {
                const rep = Math.round(c.reputation);
                const info = repInfo(rep);
                const risk = riskLabel(rep);
                const sev = fireSeverance(c);
                const stars = '★'.repeat(repToStars(rep)) + '☆'.repeat(5 - repToStars(rep));
                const violationBadge = c.violations === 0
                    ? `<span class="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-shield-halved mr-1"></i> Bebas Pelanggaran</span>`
                    : `<span class="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${c.violations} Pelanggaran Tercatat</span>`;

                const card = document.createElement('div');
                card.className = 'bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2';
                card.innerHTML = `
                    <div class="flex justify-between items-center border-b border-gray-800 pb-2">
                        <div>
                            <span class="text-[10px] font-mono bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800">${c.id}</span>
                            ${c.awal ? '<span class="text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded ml-1.5">Kru Awal</span>' : ''}
                            <h4 class="font-bold text-gray-200 text-xs inline-block ml-1.5">${c.name} (${c.role})</h4>
                        </div>
                        <span class="text-amber-400 font-mono font-bold text-xs">${stars}</span>
                    </div>
                    <div>
                        <div class="flex justify-between text-[10px] mb-1">
                            <span class="text-gray-400">Reputasi: <b class="${info.text}">${rep}/100 - ${info.label}</b></span>
                            <span class="${risk.cls}"><i class="fa-solid ${risk.icon} mr-1"></i>${risk.label}</span>
                        </div>
                        <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div class="h-full ${info.bar}" style="width:${rep}%"></div></div>
                    </div>
                    ${c.kota ? `<div class="text-[10px] text-gray-500">${c.age} th &middot; ${c.kota} &middot; ${c.exp} th pengalaman</div>` : ''}
                    ${c.role === 'Mekanik' ? `<div class="text-[10px] ${c.kilangId ? 'text-emerald-400' : 'text-amber-400'}"><i class="fa-solid fa-screwdriver-wrench mr-1"></i>${c.kilangId ? 'Bertugas di ' + ((refineryData.find(k => k.id === c.kilangId) || {}).nama || '-') : 'Belum ditugaskan - tugaskan di tab Kilang'}</div>` : ''}
                    <div class="text-[10px] pt-1">
                        <span class="text-gray-400 mr-2">Total Rute: <b>${c.trips} Pengiriman</b></span>
                        ${violationBadge}
                    </div>
                    <div class="pt-2 border-t border-gray-800 space-y-1.5">
                        ${fireId === c.id ? `
                        <div class="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
                            Pecat <b>${c.name}</b>? ${sev > 0 ? `Pesangon <b class="font-mono">${formatRupiah(sev)}</b> akan dibayar.` : 'Reputasi buruk: <b>tanpa pesangon</b> (PHK tidak hormat).'}
                            ${companyCrew.filter(x => x.role === c.role).length === 1 ? `<br><i class="fa-solid fa-triangle-exclamation mr-1"></i>Ini ${c.role} terakhir Anda, dispatch tidak bisa dilakukan sebelum merekrut lagi.` : ''}
                        </div>
                        <div class="flex gap-1.5 justify-end">
                            <button onclick="cancelFire()" class="px-2.5 py-1 rounded text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-300">Batal</button>
                            <button onclick="fireCrew('${c.id}')" class="px-2.5 py-1 rounded text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white">Ya, Pecat</button>
                        </div>` : `
                        <div class="flex items-center justify-between text-[10px]">
                            <span class="text-gray-500">Pesangon jika dipecat: <b class="font-mono ${sev > 0 ? 'text-gray-300' : 'text-emerald-400'}">${sev > 0 ? formatRupiah(sev) : 'Rp 0'}</b></span>
                            <button onclick="askFire('${c.id}')" class="px-2.5 py-1 rounded text-[10px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"><i class="fa-solid fa-user-slash mr-1"></i>Pecat</button>
                        </div>`}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // ===== SISTEM PECAT KRU =====
        let fireId = null;
        // Pesangon: dasar per peran + bonus masa kerja. Reputasi < 30 = PHK tidak hormat (tanpa pesangon)
        function fireSeverance(c) {
            if (Math.round(c.reputation) < 30) return 0;
            const base = c.role === 'Supir' ? 1500000 : c.role === 'Mekanik' ? 900000 : 750000;
            return Math.round((base + c.trips * 40000) / 50000) * 50000;
        }
        function askFire(id) { fireId = id; renderDriversDashboard(); }
        function cancelFire() { fireId = null; renderDriversDashboard(); }
        function fireCrew(id) {
            const idx = companyCrew.findIndex(c => c.id === id);
            if (idx === -1) return;
            const c = companyCrew[idx];
            if (busyIds.has(c.id)) { showModal('Masih Bertugas', `${c.name} sedang dalam perjalanan. Tunggu sampai tiba sebelum dipecat.`, 'fa-truck-fast', 'red'); fireId = null; renderDriversDashboard(); return; }
            const sev = fireSeverance(c);
            if (companyCash < sev) {
                showModal('Kas Tidak Cukup', `Pesangon ${c.name} sebesar ${formatRupiah(sev)} belum bisa dibayar.`, 'fa-circle-xmark', 'red');
                return;
            }
            fireId = null;
            companyCash -= sev;
            totalExpense += sev;
            companyCrew.splice(idx, 1);
            if (c.role === 'Mekanik' && c.kilangId) {
                const k = refineryData.find(x => x.id === c.kilangId);
                if (k && k.mekanikId === c.id) { k.mekanikId = null; renderRefineries(); }
            }
            if (sev > 0) addFinanceLog(`Pesangon PHK ${c.role.toUpperCase()} (${c.name})`, -sev);
            addLog(`PHK: ${c.name} (${c.role}) dipecat${sev > 0 ? ', pesangon ' + formatRupiah(sev) : ' tanpa pesangon (reputasi buruk)'}.`, 'warning');
            updateCashDisplay();
            populateCrewDropdowns();
            renderDriversDashboard();
            renderCandidateList();
            renderFleetDashboard();
        }

        // ===== MODAL REKRUT (BURSA KERJA) =====
        function askHire(cid) { confirmCid = cid; renderCandidateList(); }
        function cancelHire() { confirmCid = null; renderCandidateList(); }

        function openRecruitModal(role) {
            confirmCid = null;
            ['Supir', 'Kernet', 'Mekanik', 'Nahkoda', 'ABK'].forEach(r => ensureCandidatePool(r));
            if (role) recruitRole = role;
            document.getElementById('recruit-status').classList.add('hidden');
            document.getElementById('recruit-modal').classList.remove('hidden');
            renderCandidateList();
        }
        function closeRecruitModal() { document.getElementById('recruit-modal').classList.add('hidden'); }
        function setRecruitRole(role) { recruitRole = role; confirmCid = null; renderCandidateList(); }
        function setRecruitSort(k) { recruitSort = k; renderCandidateList(); }
        function refreshCandidates() { confirmCid = null; ensureCandidatePool(recruitRole, true); renderCandidateList(); }

        function renderCandidateList() {
            document.getElementById('recruit-cash').innerText = formatRupiah(companyCash);
            ['Supir', 'Kernet', 'Mekanik', 'Nahkoda', 'ABK'].forEach(r => {
                const el = document.getElementById('recruit-tab-' + r);
                const n = companyCrew.filter(c => c.role === r).length;
                el.className = 'py-2 rounded-lg text-xs font-bold transition ' + (r === recruitRole ? 'bg-purple-600 text-white shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700');
                el.innerHTML = `<i class="fa-solid ${ROLE_META[r].icon} mr-1.5"></i>${r} <span class="opacity-70 font-normal">(${n} di tim)</span>`;
            });
            document.getElementById('recruit-sorts').innerHTML = [['cost', 'Termurah'], ['rep', 'Reputasi Tertinggi'], ['exp', 'Paling Berpengalaman']].map(([k, l]) =>
                `<button onclick="setRecruitSort('${k}')" class="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${recruitSort === k ? 'bg-purple-600/20 text-purple-300 border-purple-500/40' : 'text-gray-400 border-gray-700 hover:border-gray-500'}">${l}</button>`).join('');

            const sorter = { cost: (a, b) => a.cost - b.cost, rep: (a, b) => b.reputation - a.reputation, exp: (a, b) => b.exp - a.exp || b.reputation - a.reputation }[recruitSort];
            const totalPool = candidatePool[recruitRole].length;
            const list = [...candidatePool[recruitRole]].sort(sorter).slice(0, 10);
            document.getElementById('recruit-sorts').insertAdjacentHTML('beforeend', `<span class="text-[10px] text-gray-500 ml-auto self-center">Tampil ${list.length} dari ${totalPool} kandidat</span>`);
            const container = document.getElementById('candidate-list');
            if (!list.length) {
                container.innerHTML = `<div class="md:col-span-2 text-center text-xs text-gray-400 py-10">Semua kandidat sudah direkrut.<br><button onclick="refreshCandidates()" class="mt-2 text-purple-400 font-semibold hover:text-purple-300"><i class="fa-solid fa-rotate mr-1"></i>Cari kandidat baru</button></div>`;
                return;
            }
            container.innerHTML = list.map(c => {
                const info = repInfo(c.reputation), risk = riskLabel(c.reputation);
                const chance = Math.round(violationChance(c.reputation) * 100);
                const canAfford = companyCash >= c.cost;
                const av = AVATAR[c.name.length % AVATAR.length];
                const stars = repToStars(c.reputation);
                const bars = c.skills.map((v, i) => `<div class="flex items-center gap-2 text-[10px]"><span class="w-16 text-gray-400 shrink-0">${SKILLS[c.role][i]}</span><div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div class="h-full ${repInfo(v).bar}" style="width:${v}%"></div></div><span class="w-6 text-right font-mono text-gray-300">${v}</span></div>`).join('');
                const tags = c.tags.map(t => `<span class="text-[9px] text-gray-300 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">${t}</span>`).join('');
                const action = c.cid === confirmCid && canAfford
                    ? `<div class="flex gap-1"><button onclick="cancelHire()" class="px-2 py-1 rounded text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-300">Batal</button><button onclick="hireCandidate('${c.cid}')" class="px-2 py-1 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Ya, Rekrut</button></div>`
                    : `<button onclick="askHire('${c.cid}')" ${canAfford ? '' : 'disabled'} class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${canAfford ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}">${canAfford ? 'Rekrut' : 'Kas Kurang'}</button>`;
                return `<div class="bg-gray-950 border ${c.cid === confirmCid ? 'border-purple-500' : 'border-gray-800'} rounded-xl p-3 flex flex-col gap-2.5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 rounded-full ${av} flex items-center justify-center font-bold text-sm shrink-0">${c.name.split(' ').map(w => w[0]).join('')}</div>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-bold text-gray-100 truncate">${c.name}</div>
                            <div class="text-[10px] text-gray-400">${c.age} th &middot; ${c.kota} &middot; ${c.exp} th pengalaman</div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-amber-400 text-[11px]">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
                            <div class="text-[10px] font-bold ${info.text}">${c.reputation} &middot; ${info.label}</div>
                        </div>
                    </div>
                    <div class="space-y-1">${bars}</div>
                    <div class="flex flex-wrap gap-1">${tags}</div>
                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-gray-800 mt-auto">
                        <div>
                            <div class="text-[10px] ${risk.cls}"><i class="fa-solid ${risk.icon} mr-1"></i>${risk.label} &middot; ${chance}% pelanggaran/tugas</div>
                            <div class="font-mono font-bold text-emerald-400 text-xs">${formatRupiah(c.cost)}</div>
                        </div>
                        ${action}
                    </div>
                </div>`;
            }).join('');
        }

        function hireCandidate(cid) {
            const pool = candidatePool[recruitRole];
            const idx = pool.findIndex(c => c.cid === cid);
            if (idx === -1) return;
            const cand = pool[idx];
            if (companyCash < cand.cost) {
                showModal('Kas Tidak Cukup', `Biaya rekrutmen ${cand.name} adalah ${formatRupiah(cand.cost)}!`, 'fa-circle-xmark', 'red');
                return;
            }
            confirmCid = null;
            companyCash -= cand.cost;
            totalExpense += cand.cost;
            pool.splice(idx, 1);

            crewIdCounter++;
            companyCrew.push({
                id: ROLE_META[cand.role].idPrefix + crewIdCounter,
                name: cand.name, role: cand.role, reputation: cand.reputation,
                violations: 0, status: cand.role === 'Mekanik' ? 'Belum Ditugaskan' : 'Siap Bertugas', trips: 0,
                age: cand.age, exp: cand.exp, kota: cand.kota, kilangId: null
            });

            addFinanceLog(`Rekrut ${cand.role.toUpperCase()} (${cand.name})`, -cand.cost);
            updateCashDisplay();
            populateCrewDropdowns();
            renderDriversDashboard();
            renderCandidateList();
            renderRefineries();
            const st = document.getElementById('recruit-status');
            st.textContent = cand.role === 'Mekanik'
                ? `✓ ${cand.name} berhasil direkrut sebagai Mekanik. Tugaskan ke salah satu kilang/depo di tab Kilang. Sisa kas ${formatRupiah(companyCash)}.`
                : `✓ ${cand.name} berhasil direkrut sebagai ${cand.role}. Sisa kas ${formatRupiah(companyCash)}.`;
            st.classList.remove('hidden');
            addLog(`REKRUT SDM: ${cand.name} bergabung sebagai ${cand.role} (Reputasi ${cand.reputation}) seharga ${formatRupiah(cand.cost)}.`, 'purple');
        }

        // Proses hasil tugas untuk supir + kernet, kembalikan denda & catatan
        function settleCrewResult(driver, kernet) {
            const notes = [];
            let fine = 0;
            const dRes = applyTripResult(driver);
            const kRes = applyTripResult(kernet);

            if (dRes.violated) {
                fine += 2000000;
                notes.push(`${driver.name} melanggar (terlambat/rute) - denda Rp 2jt, reputasi -${dRes.drop}`);
            } else {
                notes.push(`${driver.name} reputasi +1`);
            }
            if (kRes.violated) {
                fine += 500000;
                notes.push(`${kernet.name} lalai bongkar muat - denda Rp 500rb, reputasi -${kRes.drop}`);
            } else {
                notes.push(`${kernet.name} reputasi +1`);
            }
            return { fine, notes, violated: dRes.violated || kRes.violated };
        }

        // Cek kesesuaian ukuran truk vs sisa pesanan SPBU: truk kecil boleh dipakai kirim bertahap (nyicil),
        // TAPI hanya kalau semua truk yang cukup besar untuk melunasi sisa pesanan dalam sekali jalan sedang bertugas/tidak ada.
        // Kalau ada truk yang pas & lagi nganggur, truk kecil harus nunggu / pemain diarahkan pakai truk itu dulu.
        function truckSizeBlock(spbu, fuelId, truck, type) {
            const o = orders.find(x => x.kode === spbu.kode && x.fuel === fuelId);
            if (!o) return null; // tidak ada pesanan aktif buat kombinasi ini, tidak ada batasan
            const sisa = Math.round((o.kl - o.terkirim) * 10) / 10;
            if (truck.cap >= sisa) return null; // truk ini sendiri sudah cukup buat lunasi sisa pesanan
            const unit = type === 'LPG' ? 'Ton' : 'KL';
            const better = companyFleet.find(t => t.type === type && t.id !== truck.id && t.cap >= sisa && !busyIds.has(t.id));
            if (!better) return null; // tidak ada truk yang lebih pas & available - truk kecil boleh nyicil
            return `Sisa pesanan ${spbu.nama} tinggal ${sisa} ${unit}, dan armada ${better.id} [${better.name}] berkapasitas ${better.cap} ${unit} sedang tidak bertugas - cukup buat melunasi sekali jalan. Gunakan ${better.id} dulu sebelum memakai ${truck.id} [${truck.cap} ${unit}] buat kirim bertahap.`;
        }

        // DISPATCH BBM - Tahap 1: validasi pilihan lalu buka Surat Jalan untuk ditandatangani
        function dispatchToSpbu() {
            const kodeSpbu = document.getElementById('delivery-spbu-select').value;
            const truckId = document.getElementById('delivery-truck-select').value;
            const driverId = document.getElementById('delivery-driver-select').value;
            const kernetId = document.getElementById('delivery-kernet-select').value;
            const fuelType = document.getElementById('delivery-fuel-type').value;

            const spbu = loadedSpbuList.find(s => s.kode === kodeSpbu);
            if (spbu && spbu.blocked) return showModal('SPBU Diblokir', 'Lisensi SPBU ini dicabut. Operasional dihentikan.', 'fa-ban', 'red');
            const truck = companyFleet.find(t => t.id === truckId);
            const driver = companyCrew.find(c => c.id === driverId);
            const kernet = companyCrew.find(c => c.id === kernetId);

            if (!spbu || !truck || !driver || !kernet) {
                showModal('Peringatan', 'Lengkapi pilihan SPBU, Armada Truk, Supir & Kernet!', 'fa-circle-exclamation', 'red');
                return;
            }
            if (busyCheck(truck, driver, kernet)) return;
            if (docBlock(truck)) return;
            const fBBM = FUELS.find(x => x.label === fuelType);
            const sizeMsg = fBBM ? truckSizeBlock(spbu, fBBM.id, truck, 'BBM') : null;
            if (sizeMsg) return showModal('Pakai Armada yang Lebih Pas', sizeMsg, 'fa-truck-ramp-box', 'red');
            const origin = pickOrigin('BBM', spbu, truck.cap, truck);
            if (!origin) return showModal('Stok Kilang Kurang', `Tidak ada kilang/depo aktif dengan stok cukup untuk ${truck.cap} KL (${Math.ceil(truck.cap * ECO.bblPerKl)} Bbl). Beli bahan bakar di tab Kilang atau transfer ke depo.`, 'fa-gas-pump', 'red');

            const d = { spbu, truck, driver, kernet, origin, jenisMuatan: fuelType, hargaPerUnit: ECO.jualKl };
            openSuratJalanModal({ mode: 'BBM', tujuanNama: spbu.nama, tujuanKode: spbu.kode, jenisMuatan: fuelType, volumeText: `${truck.cap} KL`, truck, driver, kernet,
                execute: (no) => settleTruckDelivery(no, d) });
        }

        // ===== SURAT JALAN: NOMOR DOKUMEN, MODAL & TANDA TANGAN DIGITAL =====
        let suratJalanCounter = { BBM: 0, LPG: 0, KLG: 0 };
        let suratJalanHistory = [];
        let pendingDispatch = null;
        let sigCanvas, sigCtx, isDrawing = false, hasSignature = false;

        // Konfigurasi tampilan Surat Jalan per jenis: BBM (SPBU), LPG (SPBU), KLG (transfer kilang -> depo)
        const SJ_MODE = {
            BBM: { judul: 'Surat Jalan Pengiriman BBM', sub: 'Terminal BBM Nusantara', lTujuan: 'Tujuan SPBU', lKode: 'Kode SPBU', lJenis: 'Jenis BBM', sig: 'Tanda Tangan Digital Supir', confirm: 'Konfirmasi Keberangkatan Truk', icon: 'fa-truck-fast',
                   cek: 'Supir menyatakan kendaraan, muatan, dan dokumen telah diperiksa serta <b>laik jalan</b> untuk berangkat.', errSig: 'Supir wajib membubuhkan tanda tangan digital pada Surat Jalan sebelum truk dapat berangkat.' },
            LPG: { judul: 'Surat Jalan Pengiriman LPG', sub: 'Terminal LPG Nusantara', lTujuan: 'Tujuan SPBU/Agen', lKode: 'Kode SPBU', lJenis: 'Jenis LPG', sig: 'Tanda Tangan Digital Supir', confirm: 'Konfirmasi Keberangkatan Truk LPG', icon: 'fa-truck-fast',
                   cek: 'Supir menyatakan kendaraan, tabung/tangki LPG, segel, dan dokumen telah diperiksa serta <b>laik jalan</b> untuk berangkat.', errSig: 'Supir wajib membubuhkan tanda tangan digital pada Surat Jalan sebelum truk LPG dapat berangkat.' },
            KLG: { judul: 'Surat Jalan Transfer Kilang', sub: 'Kilang Pusat Tuban - Distribusi Antar Depo', lTujuan: 'Depo Tujuan', lKode: 'Kode Depo', lJenis: 'Jenis Muatan', sig: 'Tanda Tangan Digital Petugas Transfer', confirm: 'Konfirmasi Transfer Pasokan', icon: 'fa-truck-arrow-right',
                   cek: 'Petugas menyatakan volume, segel, dan dokumen transfer telah diperiksa serta <b>sesuai</b> untuk dikirim.', errSig: 'Petugas wajib membubuhkan tanda tangan digital pada Surat Jalan sebelum transfer dilakukan.' }
        };

        function formatNomorSuratJalan(urut, mode = 'BBM') {
            const romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
            const now = new Date(gameNow());
            return `SJ/${mode}-NUSA/${String(urut).padStart(3, '0')}/${romawi[now.getMonth()]}/${now.getFullYear()}`;
        }

        // Nomor final (mengunci counter) - dipakai saat Surat Jalan benar-benar dikonfirmasi
        function generateNomorSuratJalan(mode = 'BBM') {
            suratJalanCounter[mode] += 1;
            return formatNomorSuratJalan(suratJalanCounter[mode], mode);
        }

        // data: { mode, tujuanNama, tujuanKode, jenisMuatan, volumeText, truck?, driver?, kernet?, execute(nomorSJ) }
        function openSuratJalanModal(data) {
            pendingDispatch = data;
            const cfg = SJ_MODE[data.mode];
            const now = new Date(gameNow());
            const set = (id, v) => { document.getElementById(id).textContent = v; };

            set('sj-perusahaan', currentAccount ? currentAccount.company : 'NAMA PERUSAHAAN ANDA');
            set('sj-judul', cfg.judul);
            set('sj-sub', cfg.sub);
            set('sj-l-tujuan', cfg.lTujuan);
            set('sj-l-kode', cfg.lKode);
            set('sj-l-jenis', cfg.lJenis);
            set('sj-sig-label', cfg.sig);
            set('sj-confirm-text', cfg.confirm);
            document.getElementById('sj-confirm-icon').className = `fa-solid ${cfg.icon} mr-2`;
            document.getElementById('sj-check-text').innerHTML = cfg.cek;

            set('sj-nomor', 'No: ' + formatNomorSuratJalan(suratJalanCounter[data.mode] + 1, data.mode) + ' (draft)');
            set('sj-tanggal', 'Tanggal: ' + now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }));
            set('sj-spbu', data.tujuanNama);
            set('sj-kode-spbu', data.tujuanKode);
            set('sj-fuel', data.jenisMuatan);
            set('sj-volume', data.volumeText);

            // Transfer kilang darat (instan, tanpa armada) tidak memakai truk/kru, jadi kolom itu disembunyikan
            const adaKru = !!data.truck;
            document.querySelectorAll('#surat-jalan-modal .sj-truck-cell').forEach(el => el.classList.toggle('hidden', !adaKru));
            if (adaKru) {
                const lb = data.labels || {};
                set('sj-l-truk', lb.truk || 'Armada Truk');
                set('sj-l-plat', lb.plat || 'No. Polisi');
                set('sj-l-driver', lb.driver || 'Supir Bertugas');
                set('sj-l-kernet', lb.kernet || 'Kernet Pendamping');
                set('sj-truk', `${data.truck.id} - ${data.truck.name}`);
                set('sj-plat', data.truck.plat);
                set('sj-driver', `${data.driver.name} (${data.driver.id})`);
                set('sj-kernet', `${data.kernet.name} (${data.kernet.id})`);
            }
            document.getElementById('sj-checklist').checked = false;

            document.getElementById('surat-jalan-modal').classList.remove('hidden');
            document.getElementById('surat-jalan-modal').classList.add('flex');

            // Inisialisasi canvas tanda tangan setelah modal tampil agar dimensinya benar
            setTimeout(initSignaturePad, 50);
        }

        function cancelSuratJalan() {
            pendingDispatch = null;
            document.getElementById('surat-jalan-modal').classList.add('hidden');
            document.getElementById('surat-jalan-modal').classList.remove('flex');
        }

        function initSignaturePad() {
            sigCanvas = document.getElementById('signature-pad');
            sigCanvas.width = sigCanvas.offsetWidth;
            sigCtx = sigCanvas.getContext('2d');
            sigCtx.fillStyle = '#f3f4f6';
            sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
            sigCtx.strokeStyle = '#111827';
            sigCtx.lineWidth = 2.2;
            sigCtx.lineCap = 'round';
            hasSignature = false;

            const getPos = (e) => {
                const rect = sigCanvas.getBoundingClientRect();
                const point = e.touches ? e.touches[0] : e;
                return { x: point.clientX - rect.left, y: point.clientY - rect.top };
            };
            const start = (e) => { e.preventDefault(); isDrawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); };
            const move = (e) => {
                if (!isDrawing) return;
                e.preventDefault();
                const p = getPos(e);
                sigCtx.lineTo(p.x, p.y);
                sigCtx.stroke();
                hasSignature = true;
            };
            const end = () => { isDrawing = false; };

            sigCanvas.onmousedown = start;
            sigCanvas.onmousemove = move;
            sigCanvas.onmouseup = end;
            sigCanvas.onmouseleave = end;
            sigCanvas.ontouchstart = start;
            sigCanvas.ontouchmove = move;
            sigCanvas.ontouchend = end;
        }

        function clearSignature() {
            if (!sigCtx) return;
            sigCtx.fillStyle = '#f3f4f6';
            sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
            hasSignature = false;
        }

        // Tahap 2 (BBM/LPG/Kilang): dieksekusi hanya setelah Surat Jalan ditandatangani & dikonfirmasi
        function confirmKeberangkatan() {
            if (!pendingDispatch) return;
            const data = pendingDispatch;
            const cfg = SJ_MODE[data.mode];

            if (!hasSignature) {
                showModal('Tanda Tangan Diperlukan', cfg.errSig, 'fa-signature', 'red');
                return;
            }
            if (!document.getElementById('sj-checklist').checked) {
                showModal('Checklist Belum Diisi', 'Centang pernyataan pemeriksaan terlebih dahulu sebelum konfirmasi.', 'fa-clipboard-check', 'red');
                return;
            }

            const nomorSJ = generateNomorSuratJalan(data.mode);
            const signatureDataUrl = sigCanvas.toDataURL('image/png');
            suratJalanHistory.push({ nomorSJ, mode: data.mode, waktu: new Date(gameNow()), tujuan: data.tujuanNama, jenisMuatan: data.jenisMuatan, signatureDataUrl });

            cancelSuratJalan();
            data.execute(nomorSJ);
        }

        // Keberangkatan truk (BBM & LPG): muat kargo (ambil stok kilang / beli LPG), lalu berangkat.
        // Pendapatan TIDAK cair di sini lagi - baru cair setelah truk tiba & selesai masa bongkar muatan (lihat completeUnloading).
        function settleTruckDelivery(nomorSJ, d) {
            const { spbu, truck, driver, jenisMuatan } = d;
            d.nomorSJ = nomorSJ; // dibawa sampai proses bongkar selesai untuk keperluan catatan

            if (truck.type === 'BBM' && d.origin) { d.origin.stok_current = Math.max(0, d.origin.stok_current - stokNeed(d.origin, truck.cap)); renderRefineries(); }
            else if (truck.type === 'LPG') { const hpp = truck.cap * ECO.hppTon; companyCash -= hpp; totalExpense += hpp; bbmSpent += hpp; addFinanceLog(`Pembelian LPG ${truck.cap} Ton (${spbu.nama})`, -hpp); updateCashDisplay(); }

            animateDelivery(d);
            addLog(`SURAT JALAN ${nomorSJ}: Armada ${truck.id} [Supir: ${driver.name}] DITANDATANGANI & BERANGKAT membawa ${jenisMuatan} ke ${spbu.nama}.`, 'info', 'truck');
            showModal('Truk Berangkat', `Surat Jalan ${nomorSJ} telah ditandatangani. Truk ${truck.id} resmi berangkat membawa ${jenisMuatan} ke ${spbu.nama}.\nPendapatan akan cair otomatis setelah truk tiba di tujuan dan kru selesai bongkar muatan (±${UNLOAD_SECONDS} detik setelah tiba).`, 'fa-truck-fast', 'blue');
        }

        // DISPATCH LPG
        function dispatchLPGToSpbu() {
            const kodeSpbu = document.getElementById('lpg-spbu-select').value;
            const truckId = document.getElementById('lpg-truck-select').value;
            const driverId = document.getElementById('lpg-driver-select').value;
            const kernetId = document.getElementById('lpg-kernet-select').value;
            const lpgType = document.getElementById('lpg-type-select').value;

            const spbu = loadedSpbuList.find(s => s.kode === kodeSpbu);
            if (spbu && spbu.blocked) return showModal('SPBU Diblokir', 'Lisensi SPBU ini dicabut. Operasional dihentikan.', 'fa-ban', 'red');
            const truck = companyFleet.find(t => t.id === truckId);
            const driver = companyCrew.find(c => c.id === driverId);
            const kernet = companyCrew.find(c => c.id === kernetId);

            if (!spbu || !truck || !driver || !kernet) {
                showModal('Peringatan', 'Lengkapi pilihan SPBU, Armada LPG, Supir & Kernet!', 'fa-circle-exclamation', 'red');
                return;
            }
            if (busyCheck(truck, driver, kernet)) return;
            if (docBlock(truck)) return;
            if (truck.type !== 'LPG') return showModal('Armada Salah', 'Pilih truk LPG untuk pengiriman LPG.', 'fa-circle-exclamation', 'red');
            const sizeMsg = truckSizeBlock(spbu, 'lpg', truck, 'LPG');
            if (sizeMsg) return showModal('Pakai Armada yang Lebih Pas', sizeMsg, 'fa-truck-ramp-box', 'red');
            const hpp = truck.cap * ECO.hppTon;
            if (companyCash < hpp) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(hpp)} untuk membeli ${truck.cap} Ton LPG dari pemasok.`, 'fa-triangle-exclamation', 'red');

            const d = { spbu, truck, driver, kernet, jenisMuatan: lpgType, hargaPerUnit: ECO.jualTon };
            openSuratJalanModal({ mode: 'LPG', tujuanNama: spbu.nama, tujuanKode: spbu.kode, jenisMuatan: lpgType, volumeText: `${truck.cap} Ton`, truck, driver, kernet,
                execute: (no) => settleTruckDelivery(no, d) });
        }

        const ctx = document.getElementById('chartSupply').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Penyaluran BBM Nasional (KL)',
                    data: [1200, 1900, 3000, 5400, 4200, 2100],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af', font: { size: 9 } } },
                    y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af', font: { size: 9 } } }
                }
            }
        });

        // ===== ANIMASI KENDARAAN DI PETA (mengikuti jalan sebenarnya) =====
        const routeCache = new Map();
        let activeAnims = 0;
        const TRUCK_COLOR = { BBM: '#10b981', LPG: '#f59e0b' };
        const AVG_TRUCK_SPEED_KMH = 45; // estimasi kecepatan rata-rata truk tangki di jalan (termasuk berhenti/istirahat), mendekati perkiraan Google Maps utk kendaraan besar
        const UNLOAD_SECONDS = 20; // waktu nyata (detik) kru bongkar muatan setelah truk tiba, sebelum pendapatan cair
        // Catatan: GAME_SPEED dideklarasikan lebih bawah di file ini; dipakai di dalam fungsi (bukan di top-level) agar sudah terisi saat dipanggil.

        function distKm(a, b) {
            const rad = x => x * Math.PI / 180;
            const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
            return 12742 * Math.asin(Math.sqrt(h));
        }

        // ===== DETEKSI AKSES PELABUHAN (OTOMATIS DARI LAT/LON) =====
        // Titik acuan kota-kota pesisir besar se-Indonesia. Kilang/Depo dianggap "punya akses laut" (coastal)
        // kalau jaraknya ke titik acuan terdekat di bawah COASTAL_THRESHOLD_KM - dipakai buat nentuin apakah
        // sebuah cabang bisa dilayani kapal tanker, atau cuma bisa lewat darat pakai truk.
        const COASTAL_ANCHORS = [
            { name: 'Tuban', lat: -6.8979, lon: 112.0649 },
            { name: 'Jakarta/Tanjung Priok', lat: -6.10, lon: 106.88 }, { name: 'Semarang', lat: -6.95, lon: 110.43 },
            { name: 'Surabaya', lat: -7.20, lon: 112.75 }, { name: 'Banyuwangi', lat: -8.22, lon: 114.37 },
            { name: 'Denpasar/Bali', lat: -8.55, lon: 115.22 }, { name: 'Makassar', lat: -5.13, lon: 119.43 },
            { name: 'Balikpapan', lat: -1.27, lon: 116.83 }, { name: 'Banjarmasin', lat: -3.32, lon: 114.59 },
            { name: 'Pontianak', lat: -0.02, lon: 109.34 }, { name: 'Tarakan', lat: 3.30, lon: 117.63 },
            { name: 'Bitung', lat: 1.45, lon: 125.18 }, { name: 'Donggala', lat: -0.68, lon: 119.75 },
            { name: 'Mamuju', lat: -2.68, lon: 118.89 }, { name: 'Belawan/Medan', lat: 3.78, lon: 98.68 },
            { name: 'Palembang', lat: -2.99, lon: 104.76 }, { name: 'Padang', lat: -0.95, lon: 100.35 },
            { name: 'Dumai', lat: 1.68, lon: 101.45 }, { name: 'Jayapura', lat: -2.53, lon: 140.72 },
            { name: 'Ambon', lat: -3.70, lon: 128.18 }, { name: 'Kupang', lat: -10.17, lon: 123.61 }
        ];
        const COASTAL_THRESHOLD_KM = 40;
        function isCoastal(entity) {
            if (!entity || entity.lat == null || entity.lon == null) return false;
            return COASTAL_ANCHORS.some(a => distKm(entity, a) <= COASTAL_THRESHOLD_KM);
        }

        // ===== PENYEBERANGAN FERRY ANTAR PULAU =====
        // Deteksi pulau dari nama/provinsi (kilang, depo, maupun SPBU) - dipakai untuk menentukan apakah
        // sebuah pengiriman perlu naik kapal ferry (Jawa <-> Bali/Kalimantan/Sulawesi).
        function islandOfName(txt) {
            const t = String(txt || '').toLowerCase();
            if (/\bbali\b/.test(t)) return 'Bali';
            if (/sulawesi|sul(ut|teng|bar|sel|tra)|manado|bitung|palu|mamuju|makassar|kendari|parepare|gowa|maros/.test(t)) return 'Sulawesi';
            if (/kalimantan|kal(tim|sel|bar|teng|tara)|balikpapan|samarinda|banjarmasin|banjarbaru|pontianak|singkawang|palangka|sampit|bontang|tarakan/.test(t)) return 'Kalimantan';
            return 'Jawa';
        }
        const islandOf = e => islandOfName(`${e.provinsi || ''} ${e.nama || ''} ${e.region || ''}`);
        // Pelabuhan penyeberangan (nama & koordinat mengikuti OpenStreetMap) - satu entri per rute tujuan pulau.
        const PORTS = {
            Jawa: [
                { name: 'Pelabuhan ASDP Ketapang, Banyuwangi', lat: -8.1247, lon: 114.3903, ke: 'Bali' },
                { name: 'Pelabuhan Tanjung Perak, Surabaya', lat: -7.1978, lon: 112.7378, ke: 'Kalimantan' },
                { name: 'Pelabuhan Tanjung Perak, Surabaya', lat: -7.1978, lon: 112.7378, ke: 'Sulawesi' }
            ],
            Bali: [{ name: 'Pelabuhan ASDP Gilimanuk, Bali', lat: -8.1594, lon: 114.4364, ke: 'Jawa' }],
            Kalimantan: [{ name: 'Pelabuhan Trisakti, Banjarmasin', lat: -3.3208, lon: 114.5875, ke: 'Jawa' }],
            Sulawesi: [{ name: 'Pelabuhan Soekarno-Hatta, Makassar', lat: -5.1289, lon: 119.4022, ke: 'Jawa' }]
        };
        function getPort(island, towardIsland) {
            const list = PORTS[island] || PORTS.Jawa;
            return list.find(p => p.ke === towardIsland) || list[0];
        }
        const AVG_FERRY_SPEED_KMH = 25; // kecepatan rata-rata kapal ferry RoRo
        const FERRY_QUEUE_SEC = 15; // waktu nyata (detik) antre naik/turun kapal di pelabuhan
        const AVG_SHIP_SPEED_KMH = 22; // kecepatan rata-rata kapal tanker niaga (kargo curah) - lebih pelan dari ferry RoRo
        const UNLOAD_SECONDS_KAPAL = 90; // waktu nyata (detik) bongkar-muat curah kapal tanker di pelabuhan, lebih lama dari truk

        // ===== JEDA OTOMATIS SEMUA PERJALANAN SAAT TAB/WINDOW TIDAK AKTIF =====
        // vNow() adalah "jam virtual" yang dipakai khusus untuk animasi jalan truk/kapal (posisi di peta).
        // Berhenti bertambah selagi tab disembunyikan, lalu lanjut normal (bukan mengejar) saat tab aktif lagi.
        let hiddenAccum = 0, hideStartedAt = document.hidden ? Date.now() : null;
        function vNow() { return (hideStartedAt || Date.now()) - hiddenAccum; }
        // travelTimers: daftar timer "antre pelabuhan" & "bongkar-muat" yang sedang berjalan, supaya ikut
        // dijeda/dilanjutkan manual (setTimeout biasa tidak otomatis berhenti saat tab disembunyikan).
        const travelTimers = new Set();
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (!hideStartedAt) hideStartedAt = Date.now();
                travelTimers.forEach(tm => tm.pause());
            } else if (hideStartedAt) {
                hiddenAccum += Date.now() - hideStartedAt;
                hideStartedAt = null;
                travelTimers.forEach(tm => tm.resume());
            }
        });
        // Pengganti setTimeout yang bisa dijeda - dipakai untuk antre pelabuhan & waktu bongkar-muat.
        function pausableDelay(ms) {
            return new Promise(resolve => {
                let remaining = ms, handle = null, lastStart = null;
                const timer = {
                    pause() { if (handle) { clearTimeout(handle); remaining -= Date.now() - lastStart; handle = null; } },
                    resume() { if (!handle) { lastStart = Date.now(); handle = setTimeout(() => { travelTimers.delete(timer); resolve(); }, Math.max(0, remaining)); } }
                };
                travelTimers.add(timer);
                if (!document.hidden) timer.resume();
            });
        }
        const sleep = ms => pausableDelay(ms);

        // Truk berangkat dari kilang/depo aktif terdekat yang cocok dengan jenis muatan
        const stokNeed = (k, cap) => k.unit === 'Bbl' ? Math.ceil(cap * ECO.bblPerKl) : cap;
        function pickOrigin(type, spbu, cap, truck) {
            const ok = refineryData.filter(k => k.is_unlocked && (k.tipe.includes('Pusat') || k.tipe.includes(type)) && (!cap || type !== 'BBM' || k.stok_current >= stokNeed(k, cap)));
            // Utamakan kilang/depo yang jadi "wilayah" (radius terdekat) SPBU ini UNTUK JENIS PRODUK INI -
            // lihat recomputeWilayah(). Dipisah per jenis (BBM/LPG) karena depo cabang bisa cuma khusus salah satunya.
            const wilayahId = type === 'LPG' ? spbu.wilayahLpgId : spbu.wilayahBbmId;
            if (wilayahId) { const near = ok.find(k => k.id === wilayahId); if (near) return near; }
            // Kalau depo wilayah tidak memenuhi syarat (mis. stok kurang), baru coba depo pangkalan (home base) truk itu sendiri.
            if (truck && truck.depotId) { const home = ok.find(k => k.id === truck.depotId); if (home) return home; }
            return ok.reduce((best, k) => (!best || distKm(k, spbu) < distKm(best, spbu)) ? k : best, null);
        }

        // Cadangan bila layanan rute tidak terjangkau: jalur berkelok perkiraan (bukan garis lurus)
        function windingPath(o, d) {
            const n = 90, dx = d.lon - o.lon, dy = d.lat - o.lat, len = Math.hypot(dx, dy) || 1e-4;
            const px = -dy / len, py = dx / len, amp = len * 0.07, ph = Math.random() * 6, out = [];
            for (let i = 0; i <= n; i++) {
                const t = i / n, off = Math.sin(t * Math.PI) * amp * (Math.sin(t * 14 + ph) + 0.5 * Math.sin(t * 31 + ph * 2));
                out.push([o.lat + dy * t + py * off, o.lon + dx * t + px * off]);
            }
            return out;
        }

        async function fetchRoute(o, d) {
            const key = `${o.lat},${o.lon}|${d.lat},${d.lon}`;
            if (routeCache.has(key)) return routeCache.get(key);
            try {
                const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 7000);
                const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?overview=full&geometries=geojson`, { signal: ctl.signal });
                clearTimeout(t);
                const j = await r.json();
                if (j.code === 'Ok' && j.routes && j.routes[0]) {
                    const res = { pts: j.routes[0].geometry.coordinates.map(c => [c[1], c[0]]), real: true };
                    routeCache.set(key, res);
                    return res;
                }
            } catch (e) { /* jatuh ke rute perkiraan */ }
            return { pts: windingPath(o, d), real: false };
        }

        function posAt(pts, cum, sd) {
            let lo = 0, hi = cum.length - 1;
            while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= sd) lo = m; else hi = m; }
            const f = Math.min(1, Math.max(0, (sd - cum[lo]) / ((cum[hi] - cum[lo]) || 1e-9)));
            return { i: lo, ll: [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f] };
        }

        function busyCheck(truck, driver, kernet) {
            const x = [[truck, 'Truk ' + truck.id], [driver, 'Supir ' + driver.name], [kernet, 'Kernet ' + kernet.name]].find(([o]) => busyIds.has(o.id));
            if (!x) return false;
            showModal('Masih Bertugas', `${x[1]} masih dalam perjalanan atau sedang bongkar muatan. Tunggu sampai selesai atau pilih yang lain.`, 'fa-truck-fast', 'red');
            return true;
        }

        // ===== ANIMASI TRUK: hanya terlihat oleh pemain yang mengirim (tidak dibagikan ke pemain lain) =====
        const flying = new Set();
        let ownAnims = 0;
        // Bug fix: sebelumnya truk/kapal yang sudah tiba kembali di depot langsung dihapus total dari peta (marker +
        // bekas rute lenyap begitu saja). Sekarang truk milik sendiri "diparkir" sebagai titik kecil di lokasi
        // terakhirnya (depot) sampai truk itu ditugaskan berangkat lagi, supaya tidak terasa tiba-tiba menghilang.
        const parkedMarkers = new Map();

        function launchTruck(e, remote) {
            if (vNow() - e.startAt >= e.dur || flying.size > 80) return null;
            if (!remote && parkedMarkers.has(e.id)) { map.removeLayer(parkedMarkers.get(e.id)); parkedMarkers.delete(e.id); }
            const pts = e.pts, cum = [0];
            for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + distKm({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: pts[i][0], lon: pts[i][1] }));
            const isFerry = e.vehicle === 'ferry';
            const isKapal = e.vehicle === 'kapal';
            const isBoat = isFerry || isKapal;
            const color = isFerry ? '#0ea5e9' : isKapal ? '#06b6d4' : (remote ? '#38bdf8' : (TRUCK_COLOR[e.type] || '#3b82f6'));
            const line = L.polyline(pts, { color, weight: remote ? 2 : 3, opacity: isBoat ? 0.45 : 0.3, dashArray: isBoat ? '2 10' : '6 8' }).addTo(map);
            const trail = L.polyline([pts[0]], { color, weight: remote ? 3 : 4, opacity: 0.85 }).addTo(map);
            const marker = L.marker(pts[0], {
                icon: L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15], html: `<div class="truck-ico ${isBoat ? 'boat' : ''}" style="background:${color};${remote ? 'opacity:.85' : ''}"><span class="tf"><i class="fa-solid fa-${isBoat ? 'ship' : 'truck'}"></i></span></div>` }),
                zIndexOffset: remote ? 500 : 1000
            }).addTo(map);
            marker.bindTooltip(esc(remote ? `${e.owner} · ${e.plat}` : `${isFerry ? 'Ferry · ' + e.id : isKapal ? 'Kapal · ' + e.id : e.id} · ${e.plat}`), { permanent: true, direction: 'top', offset: [0, -16], className: 'truck-tip' });
            const t = { e, pts, cum, total: cum[cum.length - 1] || 0.01, marker, line, trail, remote, color, isBoat, lastTrail: 0, done: null };
            flying.add(t);
            if (flying.size === 1) requestAnimationFrame(flyLoop);
            return t;
        }

        function flyLoop() {
            const now = vNow();
            flying.forEach(t => {
                const f = Math.min(1, (now - t.e.startAt) / t.e.dur);
                const { i, ll } = posAt(t.pts, t.cum, f * t.total);
                t.marker.setLatLng(ll);
                const tf = t.marker.getElement() && t.marker.getElement().querySelector('.tf');
                const dLon = t.pts[Math.min(i + 1, t.pts.length - 1)][1] - t.pts[i][1];
                if (tf && Math.abs(dLon) > 1e-5) tf.style.transform = dLon < 0 ? 'scaleX(-1)' : '';
                if (now - t.lastTrail > 150 || f === 1) { t.trail.setLatLngs(t.pts.slice(0, i + 1).concat([ll])); t.lastTrail = now; }
                if (f < 1) return;
                const el = t.marker.getElement() && t.marker.getElement().querySelector('.truck-ico');
                if (el) { el.classList.add('done'); el.innerHTML = '<i class="fa-solid fa-circle-check"></i>'; }
                if (t.done) t.done();
                flying.delete(t);
                setTimeout(() => {
                    [t.line, t.trail].forEach(l => map.removeLayer(l));
                    map.removeLayer(t.marker);
                    if (!t.remote) {
                        // Truk/kapal TIDAK dihapus total dari peta - diganti jadi ikon "terparkir" (redup) di lokasi
                        // terakhirnya. Ini berlaku baik saat baru tiba di tujuan (SPBU/depo, masih bongkar muatan)
                        // MAUPUN saat sudah kembali ke depot asal. Otomatis dibersihkan sendiri saat truk ini
                        // ditugaskan berangkat lagi (lihat launchTruck).
                        if (parkedMarkers.has(t.e.id)) map.removeLayer(parkedMarkers.get(t.e.id));
                        const finalLL = t.pts[t.pts.length - 1];
                        const parked = L.marker(finalLL, {
                            icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], html: `<div class="truck-ico ${t.isBoat ? 'boat' : ''}" style="background:${t.color};opacity:.6;width:26px;height:26px"><span class="tf"><i class="fa-solid fa-${t.isBoat ? 'ship' : 'truck'}"></i></span></div>` }),
                            zIndexOffset: 300
                        }).addTo(map);
                        parked.bindTooltip(esc(`${t.e.id} · terparkir/bongkar muatan`), { direction: 'top', offset: [0, -14], className: 'truck-tip' });
                        parkedMarkers.set(t.e.id, parked);
                    }
                }, 4000);
            });
            if (flying.size) requestAnimationFrame(flyLoop);
        }

        // Format jam tempuh (mis. 2.4 jam) jadi teks "2j 24m"
        function fmtJam(h) {
            const totalMin = Math.round(h * 60), jam = Math.floor(totalMin / 60), men = totalMin % 60;
            return (jam ? `${jam}j ` : '') + `${men}m`;
        }

        // Jalankan satu ruas perjalanan (darat via OSRM ATAU laut/ferry garis lurus) dan tunggu sampai tiba.
        function runVehicleLeg(pts, dur, meta, fit) {
            return new Promise(resolve => {
                const e = { ...meta, pts, dur, startAt: vNow() };
                const t = launchTruck(e, false);
                if (!t) { resolve(); return; }
                if (fit) map.fitBounds(t.line.getBounds(), { padding: [50, 50], maxZoom: 11 });
                t.done = () => resolve();
            });
        }
        async function driveLeg(from, to, meta, fit) {
            const { pts, real } = await fetchRoute(from, to);
            let total = 0;
            for (let i = 1; i < pts.length; i++) total += distKm({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: pts[i][0], lon: pts[i][1] });
            const dur = (total / AVG_TRUCK_SPEED_KMH) * (3600000 / GAME_SPEED);
            await runVehicleLeg(pts, dur, { ...meta, vehicle: 'truck' }, fit);
            return { km: total, dur, real };
        }
        async function ferryLeg(from, to, meta, fit) {
            const pts = [[from.lat, from.lon], [to.lat, to.lon]];
            const total = distKm(from, to);
            const dur = (total / AVG_FERRY_SPEED_KMH) * (3600000 / GAME_SPEED);
            await runVehicleLeg(pts, dur, { ...meta, vehicle: 'ferry' }, fit);
            return { km: total, dur };
        }
        // Pelayaran langsung Kilang Pusat <-> Depo Cabang Pesisir (kapal tanker curah): garis lurus laut, TIDAK lewat
        // logika jalan darat/ferry pulau seperti journey() di bawah - kapal tanker niaga jalan sendiri lewat rute laut.
        async function shipLeg(from, to, meta, fit) {
            const pts = [[from.lat, from.lon], [to.lat, to.lon]];
            const total = distKm(from, to);
            const dur = (total / AVG_SHIP_SPEED_KMH) * (3600000 / GAME_SPEED);
            await runVehicleLeg(pts, dur, { ...meta, vehicle: 'kapal' }, fit);
            return { km: total, dur };
        }
        // Satu perjalanan lengkap dari titik A ke titik B, otomatis menyisipkan penyeberangan ferry bila beda pulau.
        // Alur: [darat ke pelabuhan] -> antre masuk kapal -> [penyeberangan] -> kapal sandar & antre turun -> [darat ke tujuan].
        async function journey(from, to, meta, fitFirst) {
            const oIsl = islandOf(from), dIsl = islandOf(to);
            if (oIsl === dIsl) {
                const leg = await driveLeg(from, to, meta, fitFirst);
                addLog(`BERANGKAT: ${meta.id} dari ${from.nama} menuju ${to.nama} (±${Math.round(leg.km)} km${leg.real ? ', mengikuti jalan' : ', rute perkiraan'} &middot; estimasi ${fmtJam(leg.dur * GAME_SPEED / 3600000)} perjalanan).`, 'info', 'truck');
                return leg.km;
            }
            const depPort = getPort(oIsl, dIsl), arrPort = getPort(dIsl, oIsl);
            let km = 0;
            const l1 = await driveLeg(from, depPort, meta, fitFirst);
            km += l1.km;
            addLog(`BERANGKAT: ${meta.id} dari ${from.nama} menuju ${depPort.name} (±${Math.round(l1.km)} km) untuk menyeberang ke Pulau ${dIsl}.`, 'info', 'truck');
            addLog(`TIBA DI PELABUHAN: ${meta.id} tiba di ${depPort.name}, mengantre masuk kapal ferry...`, 'info', 'truck');
            notify(`${meta.id} mengantre naik kapal di ${depPort.name}...`, 'info');
            await sleep(FERRY_QUEUE_SEC * 1000);
            addLog(`PENYEBERANGAN: Kapal ferry membawa ${meta.id} dari ${depPort.name} menuju ${arrPort.name} (±${Math.round(distKm(depPort, arrPort))} km laut)...`, 'info', 'truck');
            const l2 = await ferryLeg(depPort, arrPort, meta, false);
            km += l2.km;
            addLog(`SANDAR: Kapal tiba &amp; sandar di ${arrPort.name}, ${meta.id} mengantre turun kapal...`, 'info', 'truck');
            notify(`Kapal sandar di ${arrPort.name}, ${meta.id} bersiap lanjut jalan darat.`, 'info');
            await sleep(FERRY_QUEUE_SEC * 1000);
            const l3 = await driveLeg(arrPort, to, meta, false);
            km += l3.km;
            addLog(`LANJUT PERJALANAN: ${meta.id} melanjutkan jalan darat dari ${arrPort.name} menuju ${to.nama} (±${Math.round(l3.km)} km).`, 'info', 'truck');
            return km;
        }
        async function animateDelivery(d) {
            const { spbu, truck, driver, kernet, origin: origin0 } = d;
            const ids = [truck.id, driver.id, kernet.id];
            const origin = origin0 || pickOrigin(truck.type, spbu, truck.cap, truck);
            if (!origin) return;
            ids.forEach(i => busyIds.add(i));
            populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
            ownAnims++;
            const meta = { id: truck.id, plat: truck.plat, type: truck.type, owner: currentAccount ? currentAccount.company : 'Pemain' };
            const fit = ownAnims === 1;
            try {
                d.km = await journey(origin, spbu, meta, fit);
                addLog(`TIBA: ${truck.id} [Supir: ${driver.name}] sampai di ${spbu.nama}. Kru bersiap bongkar muatan (±${UNLOAD_SECONDS} detik)...`, 'info', 'truck');
                notify(`${truck.id} tiba di ${spbu.nama}, sedang bongkar muatan...`, 'info');
                ownAnims = Math.max(0, ownAnims - 1);
                await pausableDelay(UNLOAD_SECONDS * 1000);
                {
                    completeUnloading(d);
                    // Animasi truk/kapal berjalan balik ke depot asal setelah bongkar muatan tuntas (lewat ferry lagi bila perlu).
                    // PENTING: truk/supir/kernet baru dibebaskan (busyIds) SETELAH benar-benar tiba di depot di bawah ini,
                    // supaya tidak bisa ditugaskan ulang (dobel) selagi masih dalam perjalanan pulang.
                    try {
                        await journey(spbu, origin, meta, false);
                        addLog(`TIBA DI DEPOT: ${truck.id} [Supir: ${driver.name}] kembali ke ${origin.nama} setelah selesai bongkar muatan.`, 'info', 'truck');
                    } catch (e) { /* animasi balik gagal dimuat, tidak mempengaruhi keuangan yang sudah cair */ }
                    ids.forEach(x => busyIds.delete(x));
                    populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
                }
            } catch (err) {
                ids.forEach(x => busyIds.delete(x));
                populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
                ownAnims = Math.max(0, ownAnims - 1);
            }
        }

        // ===== TRANSFER KAPAL TANKER: Kilang Pusat <-> Depo Cabang Pesisir =====
        // Berbeda dari animateDelivery (BBM/LPG ke SPBU, ada pendapatan) - ini murni pemindahan stok internal
        // perusahaan sendiri lewat laut, jadi tidak ada pendapatan, hanya biaya pelayaran implisit dari harga beli kapal.
        async function animateKapalTransfer(d) {
            const { spbu: target, truck, driver, kernet, origin } = d;
            const ids = [truck.id, driver.id, kernet.id];
            ids.forEach(i => busyIds.add(i));
            populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
            ownAnims++;
            const meta = { id: truck.id, plat: truck.plat, type: truck.type, owner: currentAccount ? currentAccount.company : 'Pemain' };
            const fit = ownAnims === 1;
            try {
                const leg = await shipLeg(origin, target, meta, fit);
                d.km = leg.km;
                addLog(`BERLAYAR: Kapal ${truck.id} [Nahkoda: ${driver.name}] dari ${origin.nama} menuju ${target.nama} (±${Math.round(leg.km)} km laut &middot; estimasi ${fmtJam(leg.dur * GAME_SPEED / 3600000)} pelayaran).`, 'info', 'truck');
                addLog(`SANDAR: Kapal ${truck.id} tiba &amp; sandar di ${target.nama}, kru bongkar muatan curah (±${UNLOAD_SECONDS_KAPAL} detik)...`, 'info', 'truck');
                notify(`${truck.id} sandar di ${target.nama}, sedang bongkar muatan curah...`, 'info');
                ownAnims = Math.max(0, ownAnims - 1);
                await pausableDelay(UNLOAD_SECONDS_KAPAL * 1000);
                {
                    completeKapalTransfer(d);
                    // PENTING: sama seperti truk darat - busyIds baru dilepas SETELAH kapal benar-benar sandar
                    // kembali di depot asal, supaya kapal tidak bisa dipakai lagi selagi masih berlayar pulang.
                    try {
                        await shipLeg(target, origin, meta, false);
                        addLog(`TIBA DI DEPOT: Kapal ${truck.id} [Nahkoda: ${driver.name}] kembali berlabuh di ${origin.nama} setelah selesai bongkar muatan.`, 'info', 'truck');
                    } catch (e) { /* animasi balik gagal dimuat, tidak mempengaruhi stok yang sudah masuk */ }
                    ids.forEach(x => busyIds.delete(x));
                    populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
                }
            } catch (err) {
                ids.forEach(x => busyIds.delete(x));
                populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
                ownAnims = Math.max(0, ownAnims - 1);
            }
        }

        // Dieksekusi setelah kapal sandar DAN selesai masa bongkar (UNLOAD_SECONDS_KAPAL) - stok depo tujuan baru bertambah di sini
        function completeKapalTransfer(d) {
            const { spbu: target, truck, driver, kernet, nomorSJ } = d;
            const ids = [truck.id, driver.id, kernet.id];
            const info = creditKlgDelivery(target, truck.cap);
            const result = settleCrewResult(driver, kernet);
            if (result.fine) {
                companyCash -= result.fine; totalExpense += result.fine;
                addFinanceLog(`Denda pelanggaran pelayaran kapal ${truck.id} (${target.nama})`, -result.fine);
            }
            // busyIds TIDAK dilepas di sini lagi - baru dilepas setelah kapal benar-benar sandar kembali di depot
            // asal (lihat animateKapalTransfer), supaya kapal tidak bisa ditugaskan dobel selagi masih berlayar pulang.
            addLog(`TRANSFER SELESAI ${nomorSJ || ''}: ${truck.cap.toLocaleString()} ${target.unit} pasokan curah diturunkan di ${target.nama}. Stok kini ${Math.round(info.cur).toLocaleString()}/${info.max.toLocaleString()} ${info.unit}.`, 'success');
            notify(`${truck.id} selesai bongkar muatan di ${target.nama}.`, 'ok');
            updateCashDisplay();
            renderRefineries();
            populateTruckDropdowns(); populateCrewDropdowns(); renderDriversDashboard(); renderFleetDashboard();
        }

        // Dieksekusi setelah truk tiba DAN selesai masa bongkar muatan (UNLOAD_SECONDS) - baru di sinilah pendapatan cair
        function completeUnloading(d) {
            const { spbu, truck, driver, kernet, jenisMuatan, hargaPerUnit, nomorSJ } = d;
            const ids = [truck.id, driver.id, kernet.id];
            let revenueKotor = truck.cap * hargaPerUnit;
            const result = settleCrewResult(driver, kernet);
            revenueKotor -= result.fine;
            revenueKotor += fulfilOrder(spbu, jenisMuatan, truck);

            const biayaKirim = Math.round(truck.cap * (truck.type === 'LPG' ? ECO.biayaKirimTon : ECO.biayaKirimKl));
            const revenueBersih = revenueKotor - biayaKirim;

            companyCash += revenueBersih;
            totalIncome += revenueKotor;
            totalExpense += biayaKirim;

            addFinanceLog(`Pasokan ${jenisMuatan} ke ${spbu.nama} (${driver.name}) - pendapatan kotor`, revenueKotor);
            addFinanceLog(`Biaya pengiriman ${truck.id} ke ${spbu.nama}`, -biayaKirim);

            // Truk kembali ke depot pangkalan setelah bongkar muatan tuntas - jarak PP dihitung ke odometer & keausan ban
            const roundTripKm = Math.round((d.km || 0) * 2 * 10) / 10;
            truck.odometer = Math.round((truck.odometer + roundTripKm) * 10) / 10;
            truck.banPct = Math.max(0, Math.round((truck.banPct - roundTripKm * TIRE_WEAR_PER_KM) * 10) / 10);
            let banNote = '';
            if (truck.banPct <= TIRE_REPLACE_THRESHOLD) {
                const cost = tireReplaceCost(truck);
                companyCash -= cost; totalExpense += cost;
                addFinanceLog(`Ganti ban otomatis ${truck.id} [${truck.plat}] di depot`, -cost);
                truck.banPct = 100;
                banNote = ` Ban sudah menipis saat tiba di depot, kru bengkel otomatis mengganti set ban baru (${formatRupiah(cost)}).`;
                addLog(`BAN DIGANTI OTOMATIS: ${truck.id} [${truck.plat}] tiba di depot dengan ban tersisa kritis, langsung diganti set baru. Odometer: ${truck.odometer.toLocaleString('id-ID')} km.`, 'warning', 'truck');
                notify(`${truck.id} ganti ban otomatis di depot.`, 'warn');
            }

            updateCashDisplay();
            populateCrewDropdowns();
            renderDriversDashboard();
            renderFleetDashboard();

            addLog(`BONGKAR SELESAI (SJ ${nomorSJ}): ${truck.id} [Supir: ${driver.name}] tuntas bongkar ${jenisMuatan} di ${spbu.nama}. Kotor ${formatRupiah(revenueKotor)} - biaya kirim ${formatRupiah(biayaKirim)} = bersih ${formatRupiah(revenueBersih)} cair ke kas. ${result.notes.join('; ')}. Menempuh ±${roundTripKm} km PP (total odometer ${truck.odometer.toLocaleString('id-ID')} km, sisa ban ${truck.banPct}%).${banNote}`, result.violated ? 'warning' : 'success', 'truck');
            notify(`Pendapatan ${formatRupiah(revenueBersih)} cair dari ${truck.id} setelah bongkar muatan di ${spbu.nama}.`, result.violated ? 'warn' : 'info');

            // busyIds TIDAK dilepas di sini lagi - baru dilepas setelah truk benar-benar tiba kembali di depot asal
            // (lihat animateDelivery), supaya truk tidak bisa ditugaskan dobel selagi masih dalam perjalanan pulang.
            populateTruckDropdowns(); populateCrewDropdowns();
        }

        // ===== AKUN, PENYIMPANAN & LEADERBOARD =====
        const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const mem = {};
        const store = {
            get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return k in mem ? JSON.parse(mem[k]) : d; } },
            set(k, v) { const t = JSON.stringify(v); try { localStorage.setItem(k, t); } catch (e) { mem[k] = t; } }
        };
        let currentAccount = null;
        let lbSort = 'cash';

        async function hashPw(pw, salt) {
            const t = salt + '|' + pw;
            try {
                const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
                return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
            } catch (e) { let h = 5381; for (const ch of t) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return 'x' + h; }
        }

        function setAuthMode(m) {
            const reg = m === 'register';
            document.getElementById('auth-form-register').classList.toggle('hidden', !reg);
            document.getElementById('auth-form-login').classList.toggle('hidden', reg);
            document.getElementById('auth-error').classList.add('hidden');
            const on = 'bg-teal-600 text-white shadow', off = 'text-gray-400 hover:text-gray-200';
            document.getElementById('auth-tab-register').className = 'py-2 rounded-lg text-xs font-bold transition ' + (reg ? on : off);
            document.getElementById('auth-tab-login').className = 'py-2 rounded-lg text-xs font-bold transition ' + (reg ? off : on);
        }
        function showMsg(id, msg, ok) { const el = document.getElementById(id); el.textContent = msg; el.className = 'mt-3 text-[11px] rounded-lg px-3 py-2 border ' + (ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30'); }
        function authError(msg) { showMsg('auth-error', msg, false); }
        const fbErr = e => ({ 'auth/invalid-credential': 'Email atau password salah.', 'auth/wrong-password': 'Password salah.', 'auth/user-not-found': 'Email belum terdaftar.', 'auth/email-already-in-use': 'Email sudah terdaftar, silakan masuk.', 'auth/weak-password': 'Password minimal 6 karakter.', 'auth/invalid-email': 'Format email tidak valid.', 'auth/missing-password': 'Password wajib diisi.', 'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti.', 'auth/network-request-failed': 'Koneksi internet bermasalah.', 'auth/requires-recent-login': 'Sesi kedaluwarsa, silakan keluar lalu masuk lagi.' }[e.code] || ('Terjadi kesalahan: ' + (e.code || e.message)));

        function initAuth() { setAuthMode(store.get('pml_seen', false) ? 'login' : 'register'); }

        async function submitAuth(e, mode) {
            e.preventDefault();
            if (!window.fb) return authError('Firebase belum siap. Periksa koneksi lalu muat ulang halaman.');
            const val = id => document.getElementById(id).value.trim();
            try {
                if (mode === 'register') {
                    const company = val('reg-company').replace(/\s+/g, ' '), owner = val('reg-owner'), email = val('reg-email');
                    const pw = document.getElementById('reg-pass').value, pw2 = document.getElementById('reg-pass2').value;
                    if (company.length < 3) return authError('Nama perusahaan minimal 3 karakter.');
                    if (owner.length < 2) return authError('Nama pemilik wajib diisi.');
                    if (pw.length < 6) return authError('Password minimal 6 karakter.');
                    if (pw !== pw2) return authError('Konfirmasi password tidak sama.');
                    const { user, profile } = await fb.register(email, pw, { company, owner });
                    fbSession(user, profile, true);
                } else {
                    await fb.login(val('log-email'), document.getElementById('log-pass').value); // lanjut via onAuthStateChanged
                }
            } catch (err) { authError(fbErr(err)); }
        }

        // Dipanggil modul Firebase setelah user terautentikasi. acc.id = UID Firebase.
        window.fbSession = async function (user, prof, isNew) {
            if ((currentAccount && currentAccount.id === user.uid) || window.__sessBusy) return;
            window.__sessBusy = true;
            const ban = await fb.checkBanned(user.uid).catch(() => null);
            if (ban && (ban.permanent || (ban.until && ban.until > Date.now()))) {
                window.__sessBusy = false;
                try { await fb.out(); } catch (e) {}
                hideLoadingOverlay();
                document.getElementById('splash-overlay').classList.add('hidden');
                document.getElementById('auth-overlay').classList.remove('hidden');
                showModal('Akun Diblokir', `Akun ini diblokir oleh admin.${ban.reason ? ' Alasan: ' + ban.reason + '.' : ''}\n${ban.permanent ? 'Blokir bersifat permanen.' : 'Blokir aktif sampai ' + new Date(ban.until).toLocaleString('id-ID') + '.'}`, 'fa-ban', 'red');
                return;
            }
            store.set('pml_seen', true);
            const accs = store.get('pml_accounts', []);
            let acc = accs.find(a => a.id === user.uid);
            if (!acc) { acc = { id: user.uid, stats: liveStats() }; accs.push(acc); }
            // lastBroadcastSeen datang dari dokumen users/{uid} di Firestore (fb.markBroadcastSeen), jadi
            // status "sudah dilihat" ikut akun, bukan ikut perangkat/browser.
            Object.assign(acc, { email: user.email, company: prof.company, owner: prof.owner, lastBroadcastSeen: prof.lastBroadcastSeen || 0 });
            store.set('pml_accounts', accs);
            try {
                const cloud = await fb.loadSave(user.uid), key = 'pml_save_' + user.uid, local = store.get(key, null);
                cloudTs = cloud ? (cloud.ts || 0) : 0; store.set('pml_cloudts_' + user.uid, cloudTs);
                if (cloud && (!local || (local.ts || 0) < cloud.ts)) store.set(key, JSON.parse(cloud.data));
            } catch (e) { cloudTs = store.get('pml_cloudts_' + user.uid, 0); console.warn('Muat cloud gagal, pakai data lokal:', e); }
            startSession(acc, !!isNew);
        };

        async function sendResetEmail(email, target) {
            const id = target || 'auth-error';
            if (!email) return showMsg(id, 'Isi email dulu.', false);
            try { await fb.resetPassword(email); showMsg(id, 'Email reset password dikirim ke ' + email + '. Cek inbox/spam.', true); }
            catch (err) { showMsg(id, fbErr(err), false); }
        }

        function startSession(acc, isNew) {
            currentAccount = acc;
            const save = store.get('pml_save_' + acc.id, null);
            if (save) applySave(save);
            document.getElementById('kpis-company').innerText = acc.company;
            // Catatan: JANGAN sembunyikan loading-overlay di sini. Kalau sesi login lama dipulihkan otomatis
            // oleh Firebase, fungsi ini berjalan di belakang layar loading - biar transisinya tetap
            // loading -> "Main Sekarang" (bukan loading -> sempat kelihatan layar in-game -> baru "Main Sekarang").
            // Loading overlay baru ditutup oleh finishLoadingIfReady() setelah animasi loading selesai.
            const fromAuthForm = document.getElementById('splash-overlay').classList.contains('hidden');
            const revealGame = () => {
                document.getElementById('auth-overlay').classList.add('hidden');
                updateCashDisplay();
                renderCloudStatus();
                startTopupListener();
                startVerifiedListener();
                startBursaSalesListener();
                checkAdmin();
                checkNewBroadcasts();
                map.invalidateSize();
                addLog(`LOGIN: ${acc.owner} masuk sebagai pemilik ${acc.company}.`, 'success');
                // Kalau splash "Main Sekarang" sudah dilewati (alur daftar/masuk manual), tampilkan tutorial/welcome sekarang.
                if (fromAuthForm) maybeShowTutorial(isNew);
            };
            // Kalau ini alur Daftar/Masuk manual (splash sudah dilewati, form auth sedang tampil), fade dulu
            // sebelum masuk ke in-game biar mulus. Kalau splash masih tampil (sesi lama dipulihkan otomatis
            // di latar belakang), tidak perlu fade karena belum ada yang terlihat pemain.
            if (fromAuthForm) coverScreen(() => { revealGame(); uncoverScreen(); });
            else revealGame();
        }

        function maybeShowTutorial(isNew) {
            if (!currentAccount) return;
            if (!store.get('pml_tutorial_' + currentAccount.id, false)) {
                store.set('pml_tutorial_' + currentAccount.id, true);
                setTimeout(() => openTutorial(isNew), 400);
            } else if (isNew) {
                showModal(`Selamat Datang, ${currentAccount.owner}!`, `${currentAccount.company} resmi berdiri dengan modal ${formatRupiah(companyCash)}. Beli armada, rekrut kru, dan naiki peringkat di Leaderboard.`, 'fa-building-circle-check', 'blue');
            }
        }

        // ===== RESET & HAPUS AKUN =====
        let skipSave = false, acctMode = 'reset';
        const storeDel = k => { try { localStorage.removeItem(k); } catch (e) {} delete mem[k]; };
        const ACCT_TXT = {
            reset: ['Progres game diulang dari awal (modal Rp 650 Juta, tanpa armada & kru, Kilang Tuban stok 750.000 Bbl). Akun, nama perusahaan, dan password tetap ada.', 'Reset Akun', 'bg-amber-600 hover:bg-amber-700'],
            delete: ['Akun beserta seluruh data game dihapus PERMANEN (dari cloud dan perangkat ini) dan tidak bisa dikembalikan. Nama perusahaan bisa dipakai lagi.', 'Hapus Permanen', 'bg-red-600 hover:bg-red-700']
        };
        function setAcctMode(m) {
            acctMode = m;
            const on = m === 'reset' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white', off = 'text-gray-400 hover:text-gray-200';
            document.getElementById('acct-tab-reset').className = 'py-2 rounded-lg font-bold transition ' + (m === 'reset' ? on : off);
            document.getElementById('acct-tab-delete').className = 'py-2 rounded-lg font-bold transition ' + (m === 'delete' ? on : off);
            document.getElementById('acct-desc').innerText = ACCT_TXT[m][0];
            const b = document.getElementById('acct-confirm'); b.innerText = ACCT_TXT[m][1]; b.className = 'flex-1 text-white font-bold py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ' + ACCT_TXT[m][2];
            document.getElementById('acct-error').classList.add('hidden');
            // Mode Hapus Akun: kunci tombol konfirmasi sampai nama perusahaan diketik ulang persis - pengaman
            // ekstra karena aksi ini PERMANEN (hapus akun Firebase Auth + semua data cloud, tidak bisa dibatalkan).
            const typedWrap = document.getElementById('acct-delete-typed-wrap'), typedInput = document.getElementById('acct-delete-typed');
            typedInput.value = '';
            if (m === 'delete') {
                typedWrap.classList.remove('hidden');
                document.getElementById('acct-delete-typed-target').innerText = currentAccount ? currentAccount.company : '';
                b.disabled = true;
            } else {
                typedWrap.classList.add('hidden');
                b.disabled = false;
            }
        }
        function checkDeleteTyped() {
            if (acctMode !== 'delete') return;
            const target = (currentAccount ? currentAccount.company : '').trim();
            document.getElementById('acct-confirm').disabled = document.getElementById('acct-delete-typed').value.trim() !== target;
        }
        async function sendAcctResetPw() {
            const btn = document.getElementById('acct-reset-pw-btn');
            if (!btn || btn.disabled || !currentAccount) return;
            const ok = await showConfirm(`Email link reset password akan dikirim ke ${currentAccount.email}. Lanjutkan?`,
                { title: 'Reset Password', iconClass: 'fa-key', theme: 'blue', okLabel: 'Ya, Kirim', cancelLabel: 'Batal' });
            if (!ok) return;
            const original = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Mengirim...</span>';
            try {
                await fb.resetPassword(currentAccount.email);
                showMsg('acct-error', 'Email reset password dikirim ke ' + currentAccount.email + '. Cek inbox/spam.', true);
                btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Email terkirim, cek inbox</span>';
                // Jeda 20 detik sebelum tombol bisa dipakai lagi - cegah spam kirim email reset berkali-kali.
                setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 20000);
            } catch (err) {
                showMsg('acct-error', fbErr(err), false);
                btn.innerHTML = original; btn.disabled = false;
            }
        }
        function openAccountModal() {
            if (!currentAccount) return;
            document.getElementById('acct-company').innerText = currentAccount.company + ' · ' + currentAccount.owner;
            document.getElementById('acct-pass').value = '';
            document.getElementById('acct-uid').innerText = currentAccount.id;
            document.getElementById('acct-email').innerText = currentAccount.email || '-';
            setAcctMode('reset');
            document.getElementById('account-modal').classList.remove('hidden');
        }
        function closeAccountModal() { document.getElementById('account-modal').classList.add('hidden'); }
        async function confirmAccountAction() {
            const pw = document.getElementById('acct-pass').value, id = currentAccount.id;
            if (acctMode === 'delete' && document.getElementById('acct-delete-typed').value.trim() !== currentAccount.company.trim()) {
                return showMsg('acct-error', 'Nama perusahaan yang diketik belum cocok.', false);
            }
            try {
                await fb.reauth(pw);            // verifikasi password ke Firebase
                skipSave = true;
                const accs = store.get('pml_accounts', []);
                if (acctMode === 'delete') {
                    await fb.deleteAccount();   // hapus dokumen profil + akun Firebase Auth
                    store.set('pml_accounts', accs.filter(a => a.id !== id));
                } else {
                    await fb.deleteSave(id);
                    const a = accs.find(x => x.id === id); if (a) { a.stats = { cash: 125500000000, units: 2, kilang: 1 }; store.set('pml_accounts', accs); }
                }
                storeDel('pml_save_' + id);
                location.reload();
            } catch (err) { skipSave = false; showMsg('acct-error', fbErr(err), false); }
        }

        async function logoutAccount() {
            if (cloudBusy && !(await showConfirm('Penyimpanan cloud sedang berjalan. Jika keluar sekarang, penyimpanan dibatalkan. Lanjutkan keluar?', { title: 'Keluar Akun', iconClass: 'fa-right-from-bracket', theme: 'red', okLabel: 'Keluar' }))) return;
            try { saveGame(); } catch (e) {} skipSave = true; try { await fb.out(); } catch (e) {} location.reload(); }

        function liveStats() { return { cash: companyCash, units: companyFleet.length, kilang: refineryData.filter(k => k.is_unlocked).length }; }

        // ===== SAVE: lokal otomatis (30 dtk), cloud manual lewat tombol "Save Cloud" =====
        function buildSave() {
            return {
                cash: companyCash, income: totalIncome, expense: totalExpense,
                refineries: refineryData.map(k => ({ id: k.id, u: k.is_unlocked, s: k.stok_current, m: k.stok_max, lvl: k.stokUpgradeLevel, mid: k.mekanikId, kap: k.kap })),
                fleet: companyFleet, crew: companyCrew, crewCounter: crewIdCounter, sj: suratJalanCounter,
                spbu: loadedSpbuList, fin: financeEntries, orders, ordHist, nextOrderGt, setor: lastSetor, izin: izinLog, clock: gameElapsed, topups: appliedTopups, pph: pphPaid, bbm: bbmSpent, tsetor: topupTotal, ts: Date.now()
            };
        }

        function saveGame() {
            if (!currentAccount || skipSave) return;
            const sv = buildSave();
            store.set('pml_save_' + currentAccount.id, sv);
            const accs = store.get('pml_accounts', []);
            const a = accs.find(x => x.id === currentAccount.id);
            if (a) { a.stats = liveStats(); store.set('pml_accounts', accs); }
        }

        function cloudSave(sv) {
            publishBoard();
            // Daftar SPBU dasar tidak perlu disimpan; cukup yang berubah (DODO disetujui / mitra baru)
            const c = { ...sv, spbu: sv.spbu.filter(x => x.gen || x.mitra || x.taken || x.blocked) };
            let t = JSON.stringify(c);
            if (t.length > 900000) { c.fin = (c.fin || []).slice(-100); c.ordHist = (c.ordHist || []).slice(-100); t = JSON.stringify(c); }
            return fb.saveCloud(currentAccount.id, t, sv.ts); // error dilempar ke pemanggil
        }

        let cloudTs = 0, cloudBusy = false;
        const CLOUD_WAIT_MS = 15000;
        const fmtCloudTs = ts => ts ? new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Belum pernah';
        function renderCloudStatus() { const el = document.getElementById('cloud-last'); if (el) el.textContent = fmtCloudTs(cloudTs); }

        async function manualCloudSave() {
            if (!currentAccount || cloudBusy) return;
            document.getElementById('btn-cloud-save')?.classList.remove('cloud-remind');
            if (!window.fb) return addLog('CLOUD: Firebase belum siap. Periksa koneksi lalu muat ulang halaman.', 'warning');
            const uid = currentAccount.id, btn = document.getElementById('btn-cloud-save'),
                  lbl = document.getElementById('cloud-label'), bar = document.getElementById('cloud-bar'), ico = document.getElementById('cloud-ico');
            const setUi = (icon, text, pct) => { ico.className = 'fa-solid ' + icon + ' mr-1'; lbl.textContent = text; bar.style.width = pct + '%'; };
            cloudBusy = true; btn.disabled = true;
            try {
                // Fase 1: loading / cooldown 15 detik
                const end = Date.now() + CLOUD_WAIT_MS;
                setUi('fa-spinner fa-spin', 'Menyimpan... 15 dtk', 0);
                let left;
                while ((left = end - Date.now()) > 0) {
                    setUi('fa-spinner fa-spin', 'Menyimpan... ' + Math.ceil(left / 1000) + ' dtk', (CLOUD_WAIT_MS - left) / CLOUD_WAIT_MS * 100);
                    await new Promise(r => setTimeout(r, 250));
                    if (!currentAccount || currentAccount.id !== uid || skipSave) return; // sesi berubah / keluar akun
                }
                // Fase 2: setelah 15 detik selesai, baru ambil kondisi game terbaru & unggah ke cloud
                setUi('fa-spinner fa-spin', 'Mengunggah...', 100);
                const sv = buildSave();
                store.set('pml_save_' + uid, sv);
                await cloudSave(sv);
                cloudTs = sv.ts; store.set('pml_cloudts_' + uid, cloudTs);
                renderCloudStatus();
                addLog('CLOUD: Progres game berhasil disimpan ke cloud.', 'success');
                setUi('fa-check', 'Tersimpan!', 100);
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
                console.warn('Simpan cloud gagal:', e);
                addLog('CLOUD: Gagal menyimpan ke cloud (' + (e.code || e.message || 'error') + '). Silakan coba lagi.', 'warning');
                setUi('fa-triangle-exclamation', 'Gagal, coba lagi', 0);
                await new Promise(r => setTimeout(r, 2000));
            } finally {
                cloudBusy = false; btn.disabled = false; setUi('fa-cloud-arrow-up', 'Save Cloud', 0);
            }
        }

        // ===== TOP UP MANUAL (bukti bayar via WhatsApp, admin kirim saldo lewat UID) =====
        // ISI: nomor WhatsApp admin (format internasional tanpa +/spasi) dan info pembayaran yang tampil ke pemain
        const TOPUP_ADMIN = { wa: '6285141017508' };
        const TOPUP_PKGS = [
            { id: 'p500j', label: 'Rp 500 Juta', cash: 500e6, price: 5000, days: 5 },
            { id: 'p1m', label: 'Rp 1 Miliar', cash: 1e9, price: 10000, days: 10 },
            { id: 'p5m', label: 'Rp 5 Miliar', cash: 5e9, price: 25000, days: 25 },
            { id: 'p10m', label: 'Rp 10 Miliar', cash: 10e9, price: 40000, days: 30, tag: 'Hemat' },
            { id: 'p50m', label: 'Rp 50 Miliar', cash: 50e9, price: 70000, days: 30, tag: 'Hemat' },
            { id: 'p100m', label: 'Rp 100 Miliar', cash: 100e9, price: 100000, days: 30, tag: 'Terbaik' }
        ];
        // Paket khusus panel admin: tidak melalui pembayaran, jadi tanpa harga (price) dan boleh sampai 1 Triliun
        const ADMIN_PKGS = [
            { id: 'a500j', label: 'Rp 500 Juta', cash: 500e6, price: 0, days: 5 },
            { id: 'a1m', label: 'Rp 1 Miliar', cash: 1e9, price: 0, days: 10 },
            { id: 'a5m', label: 'Rp 5 Miliar', cash: 5e9, price: 0, days: 25 },
            { id: 'a10m', label: 'Rp 10 Miliar', cash: 10e9, price: 0, days: 30 },
            { id: 'a50m', label: 'Rp 50 Miliar', cash: 50e9, price: 0, days: 30 },
            { id: 'a100m', label: 'Rp 100 Miliar', cash: 100e9, price: 0, days: 30 },
            { id: 'a500m', label: 'Rp 500 Miliar', cash: 500e9, price: 0, days: 30 },
            { id: 'a1t', label: 'Rp 1 Triliun', cash: 1e12, price: 0, days: 30 }
        ];
        const ADMIN_CASH_MAX = 1e12; // batas atas nominal khusus admin: 1 Triliun
        let appliedTopups = [], selTopup = null, topupBusy = false, topupUnsub = null, topupChain = Promise.resolve();
        const topupInflight = new Set();
        // Registrasi nama pengirim (dipakai utk alur QRIS): wajib diisi sebelum tombol WhatsApp aktif
        let topupSender = '', topupRegistered = false;

        // ===== Bursa P2P: state lokal =====
        let bursaListings = [], bursaListingsUnsub = null, bursaSalesUnsub = null;
        let pendingBursaSales = [], bursaSaleInflight = new Set(), bursaBuyBusy = new Set();
        const bursaSeen = new Set();
        const rpFmt = n => 'Rp ' + n.toLocaleString('id-ID');

        function topupMsg(text, ok) {
            const el = document.getElementById('topup-msg');
            el.textContent = text; el.classList.toggle('hidden', !text);
            el.className = 'mt-3 text-[11px] rounded-lg px-3 py-2 border ' + (ok === false ? 'text-red-300 bg-red-500/10 border-red-500/30' : 'text-amber-200 bg-amber-500/10 border-amber-500/30') + (text ? '' : ' hidden');
        }
        function renderTopupGrid() {
            document.getElementById('topup-grid').innerHTML = TOPUP_PKGS.map(p => `
                <button onclick="selectTopup('${p.id}')" class="relative text-left rounded-xl border p-3 transition ${selTopup === p.id ? 'border-amber-400 bg-amber-500/10' : 'border-gray-800 bg-gray-950 hover:border-gray-600'}">
                    ${p.tag ? `<span class="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">${p.tag}</span>` : ''}
                    <div class="text-emerald-400 font-bold text-sm"><i class="fa-solid fa-coins mr-1 text-amber-400"></i>${p.label}</div>
                    <div class="text-gray-300 mt-1 font-mono">${rpFmt(p.price)}</div>
                    <div class="text-[10px] text-sky-300 mt-0.5"><i class="fa-solid fa-circle-check mr-1"></i>Centang biru ${p.days} hari</div>
                </button>`).join('');
        }
        // Tampilkan/sembunyikan langkah QRIS + registrasi nama pengirim, dan atur aktif/tidaknya tombol WhatsApp
        function renderTopupPayStep() {
            const step = document.getElementById('topup-pay-step');
            const p = TOPUP_PKGS.find(x => x.id === selTopup);
            if (!p) { step.classList.add('hidden'); document.getElementById('topup-pay').disabled = true; return; }
            step.classList.remove('hidden');
            document.getElementById('topup-pay-amount').textContent = rpFmt(p.price);
            document.getElementById('topup-reg-form').classList.toggle('hidden', topupRegistered);
            document.getElementById('topup-reg-done').classList.toggle('hidden', !topupRegistered);
            if (topupRegistered) document.getElementById('topup-reg-name').textContent = topupSender;
            document.getElementById('topup-pay').disabled = !(selTopup && topupRegistered) || topupBusy;
        }
        function selectTopup(id) {
            if (id !== selTopup) { topupRegistered = false; topupSender = ''; } // ganti paket -> registrasi ulang
            selTopup = id; renderTopupGrid(); renderTopupPayStep();
        }
        function registerTopupSender() {
            const inp = document.getElementById('topup-sender-input');
            const name = (inp.value || '').trim();
            if (!name) { topupMsg('Isi dulu nama pengirim sesuai aplikasi pembayaran sebelum registrasi.', false); inp.focus(); return; }
            topupSender = name; topupRegistered = true;
            topupMsg('Registrasi berhasil. Silakan lanjut tekan Konfirmasi via WhatsApp.');
            renderTopupPayStep();
        }
        function editTopupSender() {
            topupRegistered = false; renderTopupPayStep();
            const inp = document.getElementById('topup-sender-input'); if (inp) { inp.value = topupSender; inp.focus(); }
        }
        function openTopup() {
            if (!currentAccount) return;
            renderTopupBox(); selTopup = null; topupRegistered = false; topupSender = ''; topupMsg('');
            document.getElementById('topup-uid').textContent = currentAccount.id;
            const senderInput = document.getElementById('topup-sender-input'); if (senderInput) senderInput.value = '';
            const qrisImg = document.getElementById('topup-qris-img'), qrisMissing = document.getElementById('topup-qris-missing');
            if (qrisImg) { qrisImg.style.display = ''; qrisImg.src = 'asset/qris.png?r=' + Date.now(); } // paksa coba muat ulang kalau sebelumnya gagal
            if (qrisMissing) qrisMissing.classList.add('hidden');
            renderTopupGrid(); renderTopupPayStep(); renderVerified();
            document.getElementById('topup-modal').classList.remove('hidden');
        }
        function closeTopup() { document.getElementById('topup-modal').classList.add('hidden'); }

        function copyUid() {
            try { navigator.clipboard.writeText(currentAccount.id); topupMsg('UID disalin. Sertakan saat mengirim bukti bayar.'); showToast('UID berhasil disalin.'); } catch (e) { topupMsg('Salin manual UID di atas.', false); showToast('Gagal menyalin UID, salin manual ya.', false); }
        }
        function sendWa() {
            const p = TOPUP_PKGS.find(x => x.id === selTopup);
            if (!p || !currentAccount) return;
            if (!topupRegistered || !topupSender) return topupMsg('Registrasi pembayaran (isi nama pengirim) dulu sebelum konfirmasi ke WhatsApp.', false);
            if (/X{4}/.test(TOPUP_ADMIN.wa)) return topupMsg('Nomor WhatsApp admin belum diisi di index.html (TOPUP_ADMIN.wa).', false);
            const msg = `Halo Admin Pertama Manager ID, saya ingin konfirmasi top up.\nPerusahaan: ${currentAccount.company}\nEmail: ${currentAccount.email || '-'}\nUID: ${currentAccount.id}\nNama Pengirim: ${topupSender}\nPaket: ${p.label} (${rpFmt(p.price)}) + centang biru ${p.days} hari\nBukti pembayaran (screenshot QRIS + struk/notifikasi pembayaran) saya lampirkan di chat ini.`;
            window.open('https://wa.me/' + TOPUP_ADMIN.wa + '?text=' + encodeURIComponent(msg), '_blank');
            topupMsg('WhatsApp dibuka. Lampirkan bukti bayar. Setelah admin mengonfirmasi, tekan Klaim di kotak Notifikasi Top Up.');
        }

        // ----- Panel admin -----
        let isAdminUser = false;
        async function checkAdmin() {
            if (!window.fb || !currentAccount) return;
            isAdminUser = await fb.isAdmin(currentAccount.id);
            document.getElementById('btn-admin').classList.toggle('hidden', !isAdminUser);
        }
        function admMsg(t, ok) { const el = document.getElementById('adm-msg'); el.textContent = t; el.className = 'mt-3 text-[11px] rounded-lg px-3 py-2 border ' + (ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30') + (t ? '' : ' hidden'); }
        async function renderGrants() {
            try {
                const g = await fb.recentGrants();
                document.getElementById('adm-list').innerHTML = g.map(x => `<div class="flex justify-between bg-gray-950 rounded px-2 py-1"><span class="truncate text-gray-300">${esc(x.uid.slice(0, 10))}… &middot; ${rpFmt(x.price || 0)}</span><b class="${x.claimed ? 'text-emerald-400' : 'text-amber-400'}">${x.claimed ? 'Masuk' : 'Menunggu'}</b></div>`).join('') || '<div class="text-gray-600">Belum ada.</div>';
            } catch (e) { document.getElementById('adm-list').textContent = 'Gagal memuat riwayat.'; }
        }
        function openAdmin() {
            if (!isAdminUser) return;
            document.getElementById('adm-pkg').innerHTML = ADMIN_PKGS.map(p => `<option value="${p.id}">${p.label} - centang ${p.days} hari</option>`).join('');
            document.getElementById('adm-player').textContent = ''; admMsg('');
            document.getElementById('adm-only-check').checked = false;
            document.getElementById('adm-only-cash').checked = false;
            document.getElementById('adm-custom-cash').value = '';
            admToggleOnlyCheck();
            document.getElementById('admin-modal').classList.remove('hidden'); renderGrants(); renderBroadcastList();
        }
        function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }
        // Saat "hanya centang" dicentang, paket & nominal khusus dinonaktifkan (tidak dipakai), dan otomatis
        // membatalkan centang "hanya saldo" (dua opsi ini saling meniadakan, tidak bisa aktif berbarengan).
        function admToggleOnlyCheck() {
            const only = document.getElementById('adm-only-check').checked;
            if (only) document.getElementById('adm-only-cash').checked = false;
            document.getElementById('adm-pkg').disabled = only;
            document.getElementById('adm-custom-cash').disabled = only;
            admCustomPreview();
        }
        // Saat "hanya saldo" dicentang, saldo tetap dikirim (dari paket atau nominal khusus) tapi centang biru
        // TIDAK ikut dikirim/diperpanjang. Otomatis membatalkan centang "hanya centang biru".
        function admToggleOnlyCash() {
            const onlyCash = document.getElementById('adm-only-cash').checked;
            if (onlyCash) {
                document.getElementById('adm-only-check').checked = false;
                document.getElementById('adm-pkg').disabled = false;
                document.getElementById('adm-custom-cash').disabled = false;
            }
            admCustomPreview();
        }
        // Pratinjau nominal khusus yang akan dikirim (dibatasi maks ADMIN_CASH_MAX)
        function admCustomPreview() {
            const el = document.getElementById('adm-custom-preview');
            if (document.getElementById('adm-only-check').checked) { el.textContent = 'Hanya kirim centang biru, saldo tidak dikirim.'; return; }
            const onlyCash = document.getElementById('adm-only-cash').checked;
            const raw = parseInt(document.getElementById('adm-custom-cash').value, 10);
            if (!raw || raw <= 0) { el.textContent = onlyCash ? 'Saldo mengikuti nominal paket di atas, tanpa centang biru.' : ''; return; }
            const clamped = Math.min(raw, ADMIN_CASH_MAX);
            el.textContent = 'Nominal terkirim: ' + rpFmt(clamped) + (raw > ADMIN_CASH_MAX ? ' (dibatasi maks 1 Triliun)' : '') + (onlyCash ? ', tanpa centang biru.' : '');
        }
        const admUid = () => document.getElementById('adm-uid').value.trim();
        async function adminLookup() {
            const uid = admUid(), el = document.getElementById('adm-player');
            if (uid.length < 20) { el.textContent = 'UID tidak valid.'; return null; }
            try {
                const [pl, ban] = await Promise.all([fb.lookupPlayer(uid), fb.checkBanned(uid)]);
                const banActive = ban && (ban.permanent || (ban.until && ban.until > Date.now()));
                const banInfo = banActive ? `<div class="text-red-400 mt-1"><i class="fa-solid fa-ban mr-1"></i>DIBLOKIR ${ban.permanent ? '(permanen)' : 'sampai ' + new Date(ban.until).toLocaleString('id-ID')}${ban.reason ? ' &middot; ' + esc(ban.reason) : ''}</div>` : '';
                el.innerHTML = (pl ? `<span class="text-emerald-400"><i class="fa-solid fa-circle-check mr-1"></i>${esc(pl.company)} &middot; pemilik ${esc(pl.owner)}</span>` : '<span class="text-amber-400">UID belum ada di leaderboard (pemain belum pernah login/menyimpan). Pastikan UID benar.</span>') + banInfo;
                return pl || {};
            } catch (e) { el.textContent = 'Gagal mengecek: ' + (e.code || e.message); return null; }
        }
        async function adminSend() {
            if (!isAdminUser) return;
            const uid = admUid(), pkg = ADMIN_PKGS.find(x => x.id === document.getElementById('adm-pkg').value), btn = document.getElementById('adm-send');
            const pl = await adminLookup(); if (pl === null || !pkg) return admMsg('Periksa UID dan paket.', false);

            // Tentukan nominal & hari centang biru yang dikirim:
            // - onlyCheck: hanya kirim centang biru, saldo = 0
            // - onlyCash : hanya kirim saldo (dari paket/nominal khusus), hari centang biru = 0 (tidak dikirim/diperpanjang)
            // - selain itu: kirim keduanya (nominal khusus kalau diisi, atau ikut paket)
            const onlyCheck = document.getElementById('adm-only-check').checked;
            const onlyCash = document.getElementById('adm-only-cash').checked;
            const customRaw = parseInt(document.getElementById('adm-custom-cash').value, 10);
            let cash = pkg.cash, days = pkg.days, label = pkg.label;
            if (onlyCheck) {
                cash = 0; label = 'Centang biru saja (tanpa saldo)';
            } else if (onlyCash) {
                days = 0; label = pkg.label + ' (tanpa centang biru)';
                if (customRaw > 0) { cash = Math.min(customRaw, ADMIN_CASH_MAX); label = rpFmt(cash) + ' (nominal khusus, tanpa centang biru)'; }
            } else if (customRaw > 0) {
                cash = Math.min(customRaw, ADMIN_CASH_MAX); label = rpFmt(cash) + ' (nominal khusus)';
            }
            const sendPkg = { id: pkg.id, label, cash, price: 0, days };

            const centangTxt = days > 0 ? ` + centang biru ${days} hari` : ' (tanpa centang biru)';
            if (!(await showConfirm(`Kirim ${sendPkg.label}${centangTxt} ke ${pl.company || 'UID ini (TIDAK ditemukan di leaderboard)'}?\nUID: ${uid}`, { title: 'Kirim Top Up', iconClass: 'fa-paper-plane', theme: 'blue', okLabel: 'Kirim' }))) return;
            btn.disabled = true;
            try {
                await fb.adminGrant(currentAccount.id, uid, sendPkg, document.getElementById('adm-note').value.trim());
                admMsg(`Berhasil dikirim ke ${pl.company || uid}. Pemain tinggal menekan Klaim di kotak Notifikasi Top Up.`, true);
                showModal('Top Up Terkirim', `${sendPkg.label}${centangTxt} berhasil dikirim ke ${pl.company || uid}.`, 'fa-circle-check', 'blue');
                document.getElementById('adm-uid').value = ''; document.getElementById('adm-note').value = ''; document.getElementById('adm-player').textContent = '';
                document.getElementById('adm-only-check').checked = false; document.getElementById('adm-only-cash').checked = false; document.getElementById('adm-custom-cash').value = ''; admToggleOnlyCheck();
                renderGrants();
            } catch (e) { admMsg('Gagal mengirim: ' + (e.code || e.message), false); }
            finally { btn.disabled = false; }
        }
        // ----- Broadcast: kirim notifikasi ke semua pemain -----
        function admBroadcastMsg(t, ok) {
            const el = document.getElementById('adm-broadcast-msg-status');
            el.textContent = t; el.className = 'mt-2 text-[11px] rounded-lg px-3 py-2 border ' + (ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30') + (t ? '' : ' hidden');
        }
        async function renderBroadcastList() {
            try {
                const list = await fb.recentBroadcasts();
                document.getElementById('adm-broadcast-list').innerHTML = list.map(x => `<div class="bg-gray-950 rounded px-2 py-1 ${x.level === 'warn' ? 'text-amber-300' : 'text-gray-300'}">${esc(x.message)}</div>`).join('') || '<div class="text-gray-600">Belum ada.</div>';
            } catch (e) { document.getElementById('adm-broadcast-list').textContent = 'Gagal memuat riwayat.'; }
        }
        async function adminSendBroadcast() {
            if (!isAdminUser) return;
            const inp = document.getElementById('adm-broadcast-msg'), msg = inp.value.trim();
            const level = document.getElementById('adm-broadcast-level').value;
            const btn = document.getElementById('adm-broadcast-send');
            if (!msg) return admBroadcastMsg('Isi dulu pesannya.', false);
            if (!(await showConfirm(`Kirim pengumuman ini ke SEMUA pemain (termasuk yang sedang offline, akan mereka terima saat login berikutnya)?\n\n"${msg}"`, { title: 'Kirim Broadcast', iconClass: 'fa-tower-broadcast', theme: 'amber', okLabel: 'Kirim ke Semua' }))) return;
            btn.disabled = true;
            try {
                await fb.sendBroadcast(currentAccount.id, msg, level);
                admBroadcastMsg('Terkirim. Pemain yang offline akan otomatis menerimanya begitu mereka login lagi.', true);
                inp.value = '';
                renderBroadcastList();
            } catch (e) { admBroadcastMsg('Gagal mengirim: ' + (e.code || e.message), false); }
            finally { btn.disabled = false; }
        }
        // Dipanggil sekali tiap login/refresh (bukan realtime listener) - ambil broadcast yang belum pernah
        // dilihat akun ini (dibandingkan "terakhir dilihat" yang tersimpan di Firestore, ikut akun bukan ikut
        // perangkat), lalu tampilkan sebagai notifikasi biasa (masuk ke panel Notifikasi + ikut bunyi
        // notifikasi yang sudah ada). Login dari HP lalu dari laptop tetap tersinkron - tidak dobel.
        async function checkNewBroadcasts() {
            if (!window.fb || !currentAccount) return;
            let lastSeen = currentAccount.lastBroadcastSeen || 0;
            // Migrasi sekali dari localStorage lama (peninggalan versi sebelumnya, per-perangkat) kalau akun
            // ini belum pernah punya catatan "terakhir dilihat" di Firestore sama sekali.
            if (!lastSeen) {
                try { lastSeen = parseInt(localStorage.getItem('pmid_lastbroadcast_' + currentAccount.id) || '0', 10) || 0; } catch (e) { /* localStorage diblokir, abaikan */ }
            }
            try {
                const list = await fb.fetchNewBroadcasts();
                const belum = list.filter(x => x.created && x.created.toMillis && x.created.toMillis() > lastSeen).sort((a, b) => a.created.toMillis() - b.created.toMillis());
                if (!belum.length) return;
                belum.forEach(x => notify('PENGUMUMAN: ' + x.message, x.level === 'warn' ? 'warn' : 'info'));
                const newest = belum[belum.length - 1].created.toMillis();
                currentAccount.lastBroadcastSeen = newest; // langsung update di memori, cegah double-trigger kalau fungsi ini kepanggil 2x sebelum tulisan cloud selesai
                try { await fb.markBroadcastSeen(currentAccount.id, newest); } catch (e) { console.warn('Gagal simpan status broadcast ke cloud:', e); }
            } catch (e) { console.warn('Gagal ambil broadcast:', e); }
        }
        async function adminBan() {
            if (!isAdminUser) return;
            const uid = admUid();
            if (uid.length < 20) return admMsg('UID tidak valid.', false);
            const raw = document.getElementById('adm-ban-days').value, days = raw === '0' ? null : parseInt(raw, 10);
            const reason = document.getElementById('adm-ban-reason').value.trim(), label = days ? `${days} hari` : 'PERMANEN';
            if (!(await showConfirm(`Blokir UID ${uid} selama ${label}?${reason ? '\nAlasan: ' + reason : ''}`, { title: 'Blokir Pemain', iconClass: 'fa-ban', theme: 'red', okLabel: 'Blokir' }))) return;
            try {
                await fb.banPlayer(currentAccount.id, uid, days, reason);
                admMsg(`UID ${uid} diblokir (${label}).`, true);
                showModal('Pemain Diblokir', `UID ${uid} diblokir ${label}.${reason ? ' Alasan: ' + reason + '.' : ''}\nBlokir berlaku mulai login berikutnya pemain tersebut.`, 'fa-ban', 'red');
                document.getElementById('adm-ban-reason').value = '';
                adminLookup();
            } catch (e) { admMsg('Gagal memblokir: ' + (e.code || e.message), false); }
        }
        async function adminUnban() {
            if (!isAdminUser) return;
            const uid = admUid();
            if (uid.length < 20) return admMsg('UID tidak valid.', false);
            if (!(await showConfirm(`Buka blokir UID ${uid}?`, { title: 'Buka Blokir', iconClass: 'fa-lock-open', theme: 'blue', okLabel: 'Buka Blokir' }))) return;
            try {
                await fb.unbanPlayer(uid);
                admMsg(`UID ${uid} dibuka blokirnya.`, true);
                showModal('Blokir Dibuka', `UID ${uid} sudah bisa login kembali.`, 'fa-lock-open', 'blue');
                adminLookup();
            } catch (e) { admMsg('Gagal membuka blokir: ' + (e.code || e.message), false); }
        }

        // Notifikasi top up dari admin (belum diklaim). Saldo baru masuk setelah pemain menekan Klaim.
        const topupSeen = new Set();
        function startTopupListener() {
            if (topupUnsub || !window.fb || !currentAccount) return;
            topupUnsub = fb.listenTopups(currentAccount.id, list => {
                pendingTopups = list.sort((x, y) => (x.paidAt && x.paidAt.seconds || 0) - (y.paidAt && y.paidAt.seconds || 0));
                pendingTopups.forEach(t => { if (!topupSeen.has(t.id)) { topupSeen.add(t.id); addLog(`TOP UP: Kiriman ${formatRupiah(t.cash)} dari admin menunggu diklaim. Buka menu Top Up lalu tekan Klaim.`, 'success'); } });
                renderTopupBox();
            });
        }
        function renderTopupBox() {
            const n = pendingTopups.length, bd = document.getElementById('topup-badge'), box = document.getElementById('topup-box');
            bd.textContent = n; bd.classList.toggle('hidden', !n); box.classList.toggle('hidden', !n);
            const items = pendingTopups.map(t => `
                <div class="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                    <div><div class="text-emerald-300 font-bold text-sm">+${formatRupiah(t.cash)}</div><div class="text-[10px] text-sky-300"><i class="fa-solid fa-circle-check mr-1"></i>Centang biru ${t.days || 0} hari (sudah aktif)</div></div>
                    <button onclick="claimTopup('${esc(t.id)}')" ${topupInflight.has(t.id) ? 'disabled' : ''} class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg">${topupInflight.has(t.id) ? 'Memproses...' : 'Klaim'}</button>
                </div>`).join('');
            box.innerHTML = n ? `<div class="text-[11px] font-bold text-emerald-300"><i class="fa-solid fa-bell mr-1"></i>Notifikasi Top Up (${n})</div>` + items : '';
            document.getElementById('notif-topup').innerHTML = items || '<div class="text-gray-600 px-1">Tidak ada top up yang menunggu diklaim.</div>';
            renderNotif();
        }
        async function claimTopup(id) {
            const t = pendingTopups.find(x => x.id === id);
            if (!t || topupInflight.has(id)) return;
            topupInflight.add(id); renderTopupBox();
            try { await creditTopup(t); topupMsg('Top up berhasil diklaim.'); }
            catch (e) { console.warn('Klaim gagal:', e); topupMsg('Klaim belum tuntas (' + (e.code || e.message) + '). Tekan Klaim lagi; saldo tidak akan terhitung dua kali.', false); }
            finally { topupInflight.delete(id); renderTopupBox(); }
        }
        async function creditTopup(t) {
            if (!currentAccount) return;
            if (!appliedTopups.includes(t.id)) {           // cegah kredit ganda
                companyCash += t.cash; topupTotal += t.cash; appliedTopups.push(t.id);
                updateCashDisplay(); saveGame();
                addLog(`TOP UP: Saldo bertambah ${formatRupiah(t.cash)} (pembayaran ${rpFmt(t.price)}).`, 'success');
                addLog('CLOUD: Saldo top up baru tersimpan lokal. Tekan "Save Cloud" supaya tidak hilang kalau ganti perangkat.', 'warning');
                document.getElementById('btn-cloud-save')?.classList.add('cloud-remind');
                showModal('Top Up Berhasil!', `Saldo perusahaan bertambah ${formatRupiah(t.cash)}.\n\nJangan lupa tekan "Save Cloud" di pojok atas supaya saldo ini aman tersimpan di cloud.`, 'fa-wallet', 'blue');
            }
            // Saldo tersimpan lokal otomatis (saveGame di atas). Save cloud tetap manual lewat tombol "Save Cloud" -
            // di sini cukup tandai kiriman sebagai sudah diklaim supaya tidak muncul lagi di notifikasi.
            await fb.markClaimed(t.id);
        }

        // ===== Bursa P2P: jual-beli truk bekas antar pemain nyata (Firestore) =====
        function startBursaSalesListener() {
            // Uid-scoped (cuma dengar notifikasi truk MILIK SENDIRI yang laku) - murah, tetap nyala sepanjang sesi
            // supaya notifikasi "truk terjual" tetap masuk walau pemain sedang di tab lain.
            if (!window.fb || !currentAccount) return;
            if (!bursaSalesUnsub) bursaSalesUnsub = fb.listenBursaSales(currentAccount.id, list => {
                pendingBursaSales = list.sort((x, y) => (x.created && x.created.seconds || 0) - (y.created && y.created.seconds || 0));
                pendingBursaSales.forEach(s => { if (!bursaSeen.has(s.id)) { bursaSeen.add(s.id); addLog(`BURSA P2P: ${esc(s.buyerCompany)} membeli ${esc(s.truck.name)} [${esc(s.truck.plat)}] seharga ${formatRupiah(s.harga)}. Klaim pembayarannya di tab Bursa P2P.`, 'success'); notify(`Truk ${s.truck.name} terjual seharga ${formatRupiah(s.harga)}. Klaim di Bursa P2P.`, 'info'); } });
                renderBursaClaimBox();
            });
        }
        // Listener daftar lapak terbuka (sampai 200 dokumen, koleksi bersama semua pemain) - broadcast ke
        // semua yang mendengarkan tiap kali ada yang pasang/batal/beli lapak. Sengaja hanya menyala selagi
        // tab Bursa P2P dibuka (lihat switchTab), bukan sepanjang sesi login.
        function startBursaListingsListener() {
            if (!window.fb || !currentAccount) return;
            if (!bursaListingsUnsub) bursaListingsUnsub = fb.listenBursaListings(list => { bursaListings = list; if (!document.getElementById('tab-bursa').classList.contains('hidden')) renderBursa(); });
        }
        function stopBursaListingsListener() { if (bursaListingsUnsub) { bursaListingsUnsub(); bursaListingsUnsub = null; } }

        function renderBursaClaimBox() {
            const box = document.getElementById('bursa-claim-box');
            if (!pendingBursaSales.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            box.classList.remove('hidden');
            box.innerHTML = `<div class="text-[11px] font-bold text-emerald-300 mb-1"><i class="fa-solid fa-hand-holding-dollar mr-1"></i>Pembayaran Truk Terjual (${pendingBursaSales.length})</div>` +
                pendingBursaSales.map(s => `
                <div class="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                    <div class="min-w-0"><div class="text-emerald-300 font-bold text-sm">+${formatRupiah(s.harga)}</div><div class="text-[10px] text-gray-400 truncate">${esc(s.truck.name)} [${esc(s.truck.plat)}] &middot; dibeli ${esc(s.buyerCompany)}</div></div>
                    <button onclick="claimBursaSale('${esc(s.id)}')" ${bursaSaleInflight.has(s.id) ? 'disabled' : ''} class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg shrink-0">${bursaSaleInflight.has(s.id) ? 'Memproses...' : 'Klaim'}</button>
                </div>`).join('');
        }

        async function claimBursaSale(id) {
            const s = pendingBursaSales.find(x => x.id === id);
            if (!s || bursaSaleInflight.has(id)) return;
            bursaSaleInflight.add(id); renderBursaClaimBox();
            try {
                companyCash += s.harga; totalIncome += s.harga;
                addFinanceLog(`Bursa P2P: penjualan ${s.truck.name} [${s.truck.plat}] ke ${s.buyerCompany}`, s.harga);
                updateCashDisplay();
                addLog(`BURSA P2P: Pembayaran ${formatRupiah(s.harga)} dari ${esc(s.buyerCompany)} untuk ${esc(s.truck.name)} [${esc(s.truck.plat)}] berhasil diklaim.`, 'success');
                await fb.markBursaSaleClaimed(id);
            } catch (e) { console.warn('Klaim bursa gagal:', e); showModal('Klaim Gagal', 'Coba tekan Klaim sekali lagi. (' + (e.code || e.message) + ')', 'fa-triangle-exclamation', 'red'); }
            finally { bursaSaleInflight.delete(id); renderBursaClaimBox(); }
        }

        function renderBursa() {
            if (!currentAccount) return;
            // --- Selector truk milik sendiri yang bisa dijual (tidak sedang bertugas) ---
            const sellSel = document.getElementById('bursa-sell-truck');
            const myListedIds = new Set(bursaListings.filter(l => l.sellerUid === currentAccount.id).map(l => l.truck.id));
            const sellable = companyFleet.filter(t => !busyIds.has(t.id) && !myListedIds.has(t.id));
            sellSel.innerHTML = sellable.map(t => `<option value="${esc(t.id)}">${esc(t.id)} - ${esc(t.name)} [${esc(t.plat)}]</option>`).join('');
            document.getElementById('bursa-sell-empty').classList.toggle('hidden', !!sellable.length);
            sellSel.classList.toggle('hidden', !sellable.length);
            document.getElementById('bursa-sell-price').classList.toggle('hidden', !sellable.length);

            // --- Iklan milik saya ---
            const mine = bursaListings.filter(l => l.sellerUid === currentAccount.id);
            document.getElementById('bursa-mine-list').innerHTML = mine.length ? mine.map(l => `
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-2.5 flex justify-between items-center gap-2">
                    <div class="min-w-0"><div class="font-bold text-gray-200 truncate">${esc(l.truck.name)} <span class="text-amber-400 font-mono">[${esc(l.truck.plat)}]</span></div><div class="text-[10px] text-gray-500">${esc(l.truck.id)} &middot; ${l.truck.type} &middot; ${l.truck.cap} ${l.truck.type === 'LPG' ? 'Ton' : 'KL'}</div><div class="text-emerald-400 font-mono font-bold text-xs mt-0.5">${formatRupiah(l.harga)}</div></div>
                    <button onclick="cancelBursaListing('${esc(l.id)}')" class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded font-bold shrink-0">Batalkan</button>
                </div>`).join('') : '<div class="text-gray-600 text-center py-2">Belum ada iklan aktif.</div>';

            // --- Iklan dari pemain lain ---
            const others = bursaListings.filter(l => l.sellerUid !== currentAccount.id);
            document.getElementById('bursa-other-list').innerHTML = others.length ? others.map(l => `
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-2.5 space-y-1.5">
                    <div class="flex justify-between items-start gap-2">
                        <div class="min-w-0"><div class="font-bold text-gray-200 truncate">${esc(l.truck.name)} <span class="text-amber-400 font-mono">[${esc(l.truck.plat)}]</span></div><div class="text-[10px] text-gray-500 truncate">Penjual: ${esc(l.sellerCompany)}</div></div>
                        <span class="text-[10px] font-bold border rounded px-1.5 py-0.5 shrink-0 ${l.truck.type === 'LPG' ? 'text-amber-400 border-amber-500/40' : 'text-indigo-400 border-indigo-500/40'}">${l.truck.type}</span>
                    </div>
                    <div class="text-[10px] text-gray-400">Kapasitas ${l.truck.cap} ${l.truck.type === 'LPG' ? 'Ton' : 'KL'} &middot; Odometer ${l.truck.odometer.toLocaleString('id-ID')} km &middot; ${l.truck.kelas === 'kapal' ? 'Kondisi Mesin' : 'Ban'} ${l.truck.banPct}%</div>
                    <div class="flex justify-between items-center"><span class="text-emerald-400 font-mono font-bold text-sm">${formatRupiah(l.harga)}</span>
                    <button onclick="buyBursaListing('${esc(l.id)}')" ${bursaBuyBusy.has(l.id) ? 'disabled' : ''} class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-3 py-1.5 rounded font-bold">${bursaBuyBusy.has(l.id) ? 'Memproses...' : 'Beli'}</button></div>
                </div>`).join('') : '<div class="text-gray-600 text-center py-2">Belum ada truk dijual pemain lain saat ini.</div>';

            document.getElementById('bursa-badge').innerText = pendingBursaSales.length;
            document.getElementById('bursa-badge').classList.toggle('hidden', !pendingBursaSales.length);
            renderBursaClaimBox();
        }

        // Logika inti pasang iklan jual, dipakai bareng oleh form di tab Bursa P2P
        // dan tombol "Jual ke Bursa P2P" cepat di tiap kartu tab Armada.
        async function postTruckToBursa(truckId, harga) {
            if (!currentAccount) return false;
            if (!window.fb) { showModal('Belum Siap', 'Firebase belum siap. Periksa koneksi lalu muat ulang halaman.', 'fa-triangle-exclamation', 'red'); return false; }
            const idx = companyFleet.findIndex(t => t.id === truckId);
            if (idx < 0) { showModal('Pilih Truk', 'Pilih unit truk yang ingin dijual terlebih dahulu.', 'fa-truck', 'red'); return false; }
            if (busyIds.has(truckId)) { showModal('Truk Sedang Bertugas', 'Truk yang sedang dalam perjalanan tidak bisa dijual. Tunggu sampai tiba di depot.', 'fa-truck-fast', 'red'); return false; }
            if (!harga || harga < 1000000) { showModal('Harga Tidak Valid', 'Masukkan harga jual minimal Rp 1.000.000.', 'fa-circle-exclamation', 'red'); return false; }
            const truck = companyFleet[idx];
            companyFleet.splice(idx, 1);   // truk keluar dari garasi selama iklan aktif
            try {
                await fb.postBursaListing(currentAccount.id, currentAccount.company, truck, harga);
                populateTruckDropdowns(); renderFleetDashboard(); updateCashDisplay();
                addLog(`BURSA P2P: Truk ${truck.id} [${truck.plat}] dipasang di Bursa P2P seharga ${formatRupiah(harga)}.`, 'info');
                notify(`${truck.name} dipasang di Bursa P2P.`, 'info');
                return true;
            } catch (e) {
                companyFleet.push(truck);   // gagal terbit, kembalikan ke garasi
                populateTruckDropdowns(); renderFleetDashboard(); updateCashDisplay();
                showModal('Gagal Memasang Iklan', 'Coba lagi. (' + (e.code || e.message) + ')', 'fa-triangle-exclamation', 'red');
                return false;
            }
        }

        async function submitBursaListing() {
            const truckId = document.getElementById('bursa-sell-truck').value;
            const harga = Math.round(Number(document.getElementById('bursa-sell-price').value));
            const ok = await postTruckToBursa(truckId, harga);
            if (ok) document.getElementById('bursa-sell-price').value = '';
        }

        // ===== Jual Cepat dari Tab Armada =====
        let sellModalTruckId = null;
        function estimateTruckValue(truck) {
            // Estimasi kasar buat isian awal harga: harga beli dikurangi penyusutan odometer & kondisi ban
            const base = truck.price || 500000000;
            const wear = Math.max(0.4, 1 - (truck.odometer / 300000) * 0.5 - ((100 - truck.banPct) / 100) * 0.15);
            return Math.round(base * wear / 1000000) * 1000000;
        }
        function openSellModal(truckId) {
            const truck = companyFleet.find(t => t.id === truckId);
            if (!truck) return;
            if (busyIds.has(truckId)) return showModal('Truk Sedang Bertugas', 'Truk yang sedang dalam perjalanan tidak bisa dijual. Tunggu sampai tiba di depot.', 'fa-truck-fast', 'red');
            if (!currentAccount || !window.fb) return showModal('Belum Siap', 'Firebase belum siap. Periksa koneksi lalu muat ulang halaman.', 'fa-triangle-exclamation', 'red');
            sellModalTruckId = truckId;
            document.getElementById('sell-spec-name').innerText = `${truck.id} - ${truck.name}`;
            document.getElementById('sell-spec-plat').innerText = truck.plat;
            document.getElementById('sell-spec-cond').innerText = `${truck.odometer.toLocaleString('id-ID')} km \u00b7 ${truck.kelas === 'kapal' ? 'Kondisi Mesin' : 'Ban'} ${truck.banPct}%`;
            document.getElementById('sell-modal-price').value = estimateTruckValue(truck);
            document.getElementById('sell-modal').classList.remove('hidden');
        }
        function closeSellModal() {
            sellModalTruckId = null;
            document.getElementById('sell-modal').classList.add('hidden');
        }
        async function confirmSellModal() {
            const truckId = sellModalTruckId;
            if (!truckId) return closeSellModal();
            const harga = Math.round(Number(document.getElementById('sell-modal-price').value));
            const ok = await postTruckToBursa(truckId, harga);
            if (ok) { closeSellModal(); switchTab('tab-bursa'); }
        }

        async function cancelBursaListing(id) {
            const l = bursaListings.find(x => x.id === id && x.sellerUid === currentAccount.id);
            if (!l) return;
            try {
                await fb.cancelBursaListing(id);
                bursaListings = bursaListings.filter(x => x.id !== id);
                companyFleet.push(l.truck);   // truk kembali ke garasi
                populateTruckDropdowns(); renderFleetDashboard(); updateCashDisplay();
                addLog(`BURSA P2P: Iklan truk ${l.truck.id} [${l.truck.plat}] dibatalkan, unit kembali ke garasi.`, 'info');
                renderBursa();
            } catch (e) { showModal('Gagal Membatalkan', 'Coba lagi. (' + (e.code || e.message) + ')', 'fa-triangle-exclamation', 'red'); }
        }

        async function buyBursaListing(id) {
            const l = bursaListings.find(x => x.id === id);
            if (!l || bursaBuyBusy.has(id) || !currentAccount) return;
            if (l.sellerUid === currentAccount.id) return;
            if (companyCash < l.harga) return showModal('Kas Tidak Cukup', `Butuh ${formatRupiah(l.harga)} untuk membeli ${l.truck.name}.`, 'fa-triangle-exclamation', 'red');
            bursaBuyBusy.add(id); renderBursa();
            try {
                const data = await fb.buyBursaListing(id, currentAccount.id, currentAccount.company);
                const truck = { ...data.truck };
                if (companyFleet.some(t => t.id === truck.id) || bursaListings.some(x => x.sellerUid === currentAccount.id && x.truck.id === truck.id)) {
                    let n = companyFleet.length + 1;
                    while (companyFleet.some(t => t.id === 'TRK-' + String(n).padStart(2, '0'))) n++;
                    truck.id = 'TRK-' + String(n).padStart(2, '0');
                }
                truck.status = 'Sedia';
                if (!refineryData.find(k => k.id === truck.depotId && k.is_unlocked && k.mekanikId)) truck.depotId = 'KILANG-01';
                companyCash -= data.harga; totalExpense += data.harga;
                companyFleet.push(truck);
                addFinanceLog(`Bursa P2P: pembelian ${truck.name} [${truck.plat}] dari ${data.sellerCompany}`, -data.harga);
                bursaListings = bursaListings.filter(x => x.id !== id);
                populateTruckDropdowns(); renderFleetDashboard(); updateCashDisplay();
                addLog(`BURSA P2P: Membeli ${truck.name} [${truck.plat}] dari ${esc(data.sellerCompany)} seharga ${formatRupiah(data.harga)}. Unit ditambahkan ke garasi (${truck.id}).`, 'success');
                showModal('Pembelian Berhasil', `${truck.name} [${truck.plat}] resmi jadi milik Anda, berpangkalan di ${(refineryData.find(k => k.id === truck.depotId) || {}).nama || 'Kilang Tuban'}.`, 'fa-circle-check', 'blue');
            } catch (e) {
                if (e.message === 'SOLD') showModal('Sudah Terjual', 'Truk ini baru saja dibeli pemain lain. Cari unit lain di Bursa P2P.', 'fa-circle-exclamation', 'red');
                else if (e.message !== 'SELF') showModal('Gagal Membeli', 'Coba lagi. (' + (e.code || e.message) + ')', 'fa-triangle-exclamation', 'red');
            }
            finally { bursaBuyBusy.delete(id); renderBursa(); }
        }

        function migrateLegacy(sv) {
            let raw = JSON.stringify(sv);
            [
             ['Truk Agen Bright Gas & 12 Kg', 'Truk Agen LPG 12 Kg'], ['Bright Gas', 'LPG Nonsubsidi'], ['SPBU TPPI Jenu', 'SPBU Jenu'], ['Kilang Tuban (TPPI)', 'Kilang Tuban'],
             ['Tangki Besar 18 KL Fuso', 'Tangki Besar 18 KL'], ['Tangki Besar 24 KL FAW', 'Tangki Besar 24 KL Standar'], ['Tangki Besar 24 KL UD', 'Tangki Besar 24 KL Heavy Duty']]
                .forEach(([a, b]) => { raw = raw.split(a).join(b); });
            return JSON.parse(raw.replace(/"kode":"\d\d\.(\d{3})\.(\d\d)"/g, '"kode":"JT-$1-$2"'));
        }

        function applySave(sv) {
            sv = migrateLegacy(sv);
            companyCash = sv.cash; totalIncome = sv.income; totalExpense = sv.expense;
            sv.refineries.forEach(r => { const k = refineryData.find(x => x.id === r.id); if (k) { k.is_unlocked = r.u; k.stok_current = r.s; if (r.m) k.stok_max = r.m; if (r.lvl !== undefined) k.stokUpgradeLevel = r.lvl; if (r.mid !== undefined) k.mekanikId = r.mid; if (r.kap) k.kap = r.kap; } });
            companyFleet = sv.fleet; companyCrew = sv.crew; crewIdCounter = sv.crewCounter; suratJalanCounter = sv.sj; { const saved = sv.spbu || [], m = new Map(saved.map(s => [s.kode, s]));
              loadedSpbuList = loadedSpbuList.map(s => m.get(s.kode) || s);
              const have = new Set(loadedSpbuList.map(s => s.kode)); saved.forEach(s => { if (!have.has(s.kode)) loadedSpbuList.push(s); }); }
            orders = sv.orders || []; ordHist = sv.ordHist || []; nextOrderGt = sv.nextOrderGt || 0;
            // Pesanan SPBU dihitung mundur pakai waktu nyata (lihat ORDER_TTL) - kalau tidak digeser,
            // durasi saat pemain logout ikut terhitung dan banyak pesanan langsung dianggap kedaluwarsa
            // begitu login lagi. Geser jam pembuatan tiap pesanan maju sebesar durasi offline, supaya
            // hitungan mundurnya "berhenti" selama logout, sama seperti jam permainan (gameElapsed).
            if (sv.ts) {
                const offlineMs = Math.max(0, Date.now() - sv.ts);
                if (offlineMs > 0) orders.forEach(o => { o.t += offlineMs; });
            }
            gameElapsed = sv.clock || 0; izinLog = sv.izin || { mi: -1, n: 0 }; companyFleet.forEach(t => { if (!t.kirTs) t.kirTs = Date.parse(t.kir) || gameNow() + 182 * 86400000; if (!t.stnkTs) t.stnkTs = Date.parse(t.stnk) || gameNow() + STNK_PERIOD; if (!t.platTs) t.platTs = gameNow() + PLAT_PERIOD; if (t.kirPending === undefined) t.kirPending = null; if (!t.depotId) t.depotId = 'KILANG-01'; if (t.odometer == null) t.odometer = 0; if (t.banPct == null) t.banPct = 100; if (!t.price) t.price = 500e6; }); companyCrew.forEach(c => { if (c.kilangId === undefined) c.kilangId = null; }); lastSetor = sv.setor != null ? sv.setor : Math.floor(gameElapsed * GAME_SPEED / (MITRA_CFG.cycleDays * DAY_MS)); loadedSpbuList.forEach(x => { if (x.tipe === 'DODO' && x.is_approved && !x.mitra && !x.blocked) x.mitra = newMitra(x); }); appliedTopups = sv.topups || []; pphPaid = sv.pph || 0; bbmSpent = sv.bbm || 0; topupTotal = sv.tsetor || 0;
            document.getElementById('finance-history-log').innerHTML = '';
            financeEntries = [];
            (sv.fin || []).forEach(f => addFinanceLog(f.desc, f.amount));
            recomputeWilayah();
            renderRefineries(); renderSpbuOnMap(); populateSpbuDropdowns(); populateTruckDropdowns();
            populateCrewDropdowns(); renderInvestorTab(); renderFleetDashboard(); renderDriversDashboard();
        }

        // Leaderboard: hanya pemain nyata (koleksi Firestore 'leaderboard'); centang biru dari koleksi 'verified'
        // Listener leaderboard di-broadcast ke SEMUA pemain online tiap kali ada yang publish skor - paling
        // boros kuota baca gratis Firestore. Sengaja hanya menyala selagi tab Peringkat dibuka (lihat switchTab),
        // bukan sepanjang sesi login. Listener 'verified' jauh lebih kecil (cuma pemain centang biru) & dipakai
        // juga di modal Top Up, jadi tetap dibiarkan menyala sepanjang sesi - dampaknya ke kuota kecil.
        let boardRows = [], verMap = {}, verifiedUnsub = null, leaderboardUnsub = null;
        const vbadge = until => until > Date.now() ? ` <i class="fa-solid fa-circle-check text-sky-400 align-middle" title="Terverifikasi sampai ${new Date(until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}"></i>` : '';
        const boardOpen = () => !document.getElementById('tab-leaderboard').classList.contains('hidden');
        function publishBoard() {
            if (!window.fb || !currentAccount || skipSave) return;
            const st = liveStats();
            fb.publishStats(currentAccount.id, { company: currentAccount.company, owner: currentAccount.owner, cash: Math.round(st.cash), units: st.units, kilang: st.kilang }).catch(e => console.warn('Leaderboard:', e));
        }
        function startVerifiedListener() {
            if (verifiedUnsub || !window.fb || !currentAccount) return;
            verifiedUnsub = fb.listenVerified(m => { verMap = m; renderVerified(); if (boardOpen()) renderLeaderboard(); });
            publishBoard();
        }
        function startLeaderboardListener() {
            if (leaderboardUnsub || !window.fb || !currentAccount) return;
            leaderboardUnsub = fb.listenBoard(r => { boardRows = r; if (boardOpen()) renderLeaderboard(); });
        }
        function stopLeaderboardListener() { if (leaderboardUnsub) { leaderboardUnsub(); leaderboardUnsub = null; } }
        function renderVerified() {
            if (!currentAccount) return;
            const u = verMap[currentAccount.id] || 0;
            document.getElementById('kpis-verified').innerHTML = vbadge(u);
            const t = document.getElementById('topup-verif');
            if (t) t.textContent = u > Date.now() ? 'Centang biru aktif sampai ' + new Date(u).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Akun belum terverifikasi';
        }
        function getBoard() {
            const me = currentAccount ? currentAccount.id : null;
            const rows = boardRows.filter(r => r.uid !== me).map(r => ({ uid: r.uid, name: r.company || '-', owner: r.owner || '-', cash: r.cash || 0, units: r.units || 0, kilang: r.kilang || 0, until: verMap[r.uid] || 0 }));
            if (currentAccount) rows.push({ uid: me, name: currentAccount.company, owner: currentAccount.owner, ...liveStats(), until: verMap[me] || 0, me: true });
            return rows;
        }

        function fmtShort(n) {
            if (n >= 1e12) return 'Rp ' + (n / 1e12).toFixed(2).replace('.', ',') + ' T';
            if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace('.', ',') + ' M';
            if (n >= 1e6) return 'Rp ' + Math.round(n / 1e6) + ' jt';
            return formatRupiah(Math.round(n));
        }

        function setLbSort(k) { lbSort = k; renderLeaderboard(); }

        function renderLeaderboard() {
            const rows = getBoard().sort((a, b) => b[lbSort] - a[lbSort] || b.cash - a.cash || b.units - a.units);
            document.getElementById('lb-sorts').innerHTML = [['cash', 'Uang', 'fa-coins'], ['units', 'Unit', 'fa-truck'], ['kilang', 'Kilang', 'fa-oil-well']].map(([k, l, ic]) =>
                `<button onclick="setLbSort('${k}')" class="py-1.5 rounded-lg text-[11px] font-bold border transition ${lbSort === k ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40' : 'text-gray-400 border-gray-800 hover:border-gray-600'}"><i class="fa-solid ${ic} mr-1"></i>${l}</button>`).join('');
            const my = rows.findIndex(r => r.me);
            document.getElementById('lb-mine').innerHTML = my < 0 ? '' : `<div class="bg-gray-900 border border-yellow-500/30 rounded-lg p-2.5 flex justify-between items-center text-xs"><span class="text-gray-400">Peringkat Anda</span><span class="font-black text-yellow-400 text-base">#${my + 1}<span class="text-[10px] text-gray-500 font-normal"> dari ${rows.length}</span></span></div>`;
            const medal = ['bg-yellow-500 text-gray-900', 'bg-gray-300 text-gray-900', 'bg-amber-700 text-white'];
            const cell = (k, icon, label, v, full) => `<div class="bg-gray-950 rounded p-1.5" ${full ? `title="${full}"` : ''}><div class="text-[9px] text-gray-500"><i class="fa-solid ${icon} mr-1"></i>${label}</div><div class="font-mono font-bold text-xs ${lbSort === k ? 'text-yellow-300' : 'text-gray-200'}">${v}</div></div>`;
            document.getElementById('lb-list').innerHTML = rows.map((r, i) => `
                <div class="rounded-lg border p-2.5 ${r.me ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-gray-900 border-gray-800'}">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${medal[i] || 'bg-gray-800 text-gray-400'}">${i + 1}</div>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-bold text-gray-100 truncate">${esc(r.name)}${r.me ? ' <span class="text-[9px] bg-yellow-500 text-gray-900 rounded px-1 py-0.5 ml-1 align-middle">ANDA</span>' : ''}${vbadge(r.until)}</div>
                            <div class="text-[10px] text-gray-500 truncate">Pemilik: ${esc(r.owner)}</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5 mt-2 text-center">
                        ${cell('units', 'fa-truck', 'Unit', r.units)}
                        ${cell('kilang', 'fa-oil-well', 'Kilang', r.kilang)}
                        ${cell('cash', 'fa-coins', 'Uang', fmtShort(r.cash), formatRupiah(Math.round(r.cash)))}
                    </div>
                </div>`).join('');
        }

        // ===== JAM GAME: 1 menit game = 3 detik nyata (kecepatan 20x, 1 jam game = 3 menit nyata, 1 hari game = 72 menit nyata, 1 minggu game = 8,4 jam nyata) =====
        const GAME_START = new Date(2026, 8, 25, 6, 0, 0).getTime(), GAME_SPEED = 20, ORDER_DELAY = 180000;
        let gameElapsed = 0;
        const gameNow = () => GAME_START + gameElapsed * GAME_SPEED;
        const fmtTime = ms => new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
        const fmtDate = ms => new Date(ms).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const gameStamp = () => new Date(gameNow()).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + fmtTime(gameNow());
        function renderClock() { document.getElementById('game-date').innerText = fmtDate(gameNow()); document.getElementById('game-time').innerText = fmtTime(gameNow()) + ' WIB'; }
        // Jam game dihitung dari SELISIH waktu nyata (Date.now()), bukan dari jumlah "tick" setInterval yang lewat,
        // supaya akurat. Tapi begitu tab/window tidak aktif (pindah tab, minimize dsb), jam SENGAJA dijeda:
        // selisih waktu selama tersembunyi TIDAK ditambahkan ke gameElapsed. Saat tab aktif lagi, lastClockTick
        // di-reset ke waktu sekarang dulu, jadi jam lanjut jalan normal dari titik terakhir dia berhenti
        // (bukan "mengejar" ketertinggalan).
        let lastClockTick = Date.now();
        function tickClock() {
            const now = Date.now();
            const delta = now - lastClockTick;
            lastClockTick = now;
            if (currentAccount && !document.hidden && delta > 0) gameElapsed += delta;
            renderClock();
        }
        function resumeClock() { lastClockTick = Date.now(); tickClock(); }
        setInterval(tickClock, 500);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) resumeClock(); });
        window.addEventListener('focus', resumeClock);
        renderClock();

        // ===== STOK SPBU & PESANAN OTOMATIS =====
        const busyIds = new Set();
        const FUELS = [
            { id: 'solar', label: 'Solar', cap: 64, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
            { id: 'pertalite', label: 'Pertalite', cap: 64, color: 'text-green-400 border-green-500/40 bg-green-500/10' },
            { id: 'dex', label: 'Dex', cap: 32, color: 'text-teal-300 border-teal-500/40 bg-teal-500/10' },
            { id: 'turbo', label: 'Pertamax Turbo', cap: 32, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
            { id: 'lpg', label: 'LPG', cap: 40, lpg: true, unit: 'Ton', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' }
        ];
        let orders = [], ordHist = [], orderSeq = 1;
        const ORDER_BATCH = { BBM: 5, LPG: 3 }, ORDER_TTL = 600000; // batas maksimal pesanan TERBUKA bersamaan per jenis; TTL: 10 menit nyata = 3 jam 20 menit game (kecepatan 20x)
        // Pesanan baru muncul BERTAHAP satu per satu (bukan langsung penuh sekaligus begitu ada armada pertama),
        // supaya terasa natural. Jeda dasar antar kemunculan pesanan baru = ORDER_TRICKLE_HOURS jam waktu GAME,
        // dengan sedikit variasi acak (+-30%) biar tidak terasa seperti metronom. Terus jalan sampai jumlah
        // pesanan TERBUKA per jenis menyentuh batas ORDER_BATCH di atas.
        const ORDER_TRICKLE_HOURS = 2;
        let nextOrderGt = 0; // gameNow() paling cepat pesanan baru berikutnya boleh muncul

        const fuelsOf = s => FUELS.filter(f => !f.lpg || s.has_lpg);
        const capsOf = type => [...new Set(companyFleet.filter(t => t.type === type).map(t => t.cap))];
        // Tingkat keramaian SPBU menentukan seberapa cepat BBM/LPG habis: rata-rata butuh beberapa hari,
        // bukan hitungan jam. Ramai = kota besar/jalur utama, Sepi = daerah kecil, Sedang = di antaranya.
        const TRAFFIC = { Ramai: { p: 0.25, mult: 1.4, label: 'Ramai' }, Sedang: { p: 0.5, mult: 1.0, label: 'Sedang' }, Sepi: { p: 0.25, mult: 0.6, label: 'Sepi' } };
        function pickTraffic() { const r = Math.random(); return r < 0.25 ? 'Ramai' : r < 0.75 ? 'Sedang' : 'Sepi'; }
        // Laju dasar per tick (1 tick tickStock = 12 menit game): tangki penuh SPBU "Sedang" habis rata-rata ~4 hari game.
        const STOK_BASE_RATE = 1 / 480;
        function ensureStok(s) {
            s.stok = s.stok || {};
            if (!s.traffic) s.traffic = pickTraffic();
            fuelsOf(s).forEach(f => { if (s.stok[f.id] == null) s.stok[f.id] = Math.round(f.cap * (0.5 + Math.random() * 0.5) * 10) / 10; });
        }
        function closeOrder(o, status) {
            o.status = status; o.tutup = Date.now();
            orders = orders.filter(x => x !== o);
            ordHist.unshift(o); ordHist = ordHist.slice(0, 15);
        }
        function tickStock() {
            const now = Date.now();
            processKirPending();
            orders.slice().forEach(o => { if (now - o.t > ORDER_TTL) {
                const s = loadedSpbuList.find(x => x.kode === o.kode);
                if (s) { ensureStok(s); s.stok[o.fuel] = FUELS.find(f => f.id === o.fuel).cap * 0.6; }
                addLog(`PESANAN BATAL: ${o.nama} membeli ${fuelLabel(o.fuel)} dari pesaing karena pesanan ${o.kl} ${o.unit || 'KL'} tidak dipenuhi.`, 'warning');
                closeOrder(o, 'Batal');
            } });
            loadedSpbuList.forEach(s => {
                if (!isOp(s)) return;
                ensureStok(s);
                const mult = TRAFFIC[s.traffic || 'Sedang'].mult;
                fuelsOf(s).forEach(f => { s.stok[f.id] = Math.max(0, Math.round((s.stok[f.id] - f.cap * STOK_BASE_RATE * mult * (0.7 + Math.random() * 0.6)) * 10) / 10); });
            });
            // Pesanan datang BERTAHAP satu-satu (lihat ORDER_TRICKLE_HOURS/nextOrderGt di atas), bukan langsung
            // penuh sekaligus - terus jalan sampai jumlah pesanan TERBUKA per jenis menyentuh batas ORDER_BATCH.
            // SPBU sudah masuk kandidat pesanan begitu stoknya turun ke 75% kapasitas tangki timbun (belum sampai
            // separuh) - jadi SPBU minta pasokan lebih dini, sebelum stoknya benar-benar mepet.
            const ORDER_TRIGGER_RATIO = 0.75;
            const openBBM = orders.filter(o => o.fuel !== 'lpg').length, openLPG = orders.filter(o => o.fuel === 'lpg').length;
            const slotBBMOpen = openBBM < ORDER_BATCH.BBM, slotLPGOpen = openLPG < ORDER_BATCH.LPG;
            if ((slotBBMOpen || slotLPGOpen) && gameElapsed >= ORDER_DELAY && gameNow() >= nextOrderGt) {
                // Ukuran pesanan = kapasitas armada milik pemain (BBM: KL, LPG: Ton)
                const cand = [];
                loadedSpbuList.forEach(s => { if (isOp(s)) fuelsOf(s).forEach(f => {
                    ensureStok(s);
                    if (f.lpg ? !slotLPGOpen : !slotBBMOpen) return; // jenis ini sudah penuh, jangan diundi dulu
                    if (orders.some(o => o.kode === s.kode && o.fuel === f.id)) return; // SPBU ini sudah punya pesanan jenis ini yang masih terbuka
                    // LPG cuma boleh bikin pesanan kalau SPBU-nya masih dalam jangkauan depo LPG aktif mana pun
                    // (lihat MAX_SERVICE_KM/nearestActiveKilang) - di luar itu, dianggap belum terjangkau layanan.
                    if (f.lpg && !s.wilayahLpgId) return;
                    const ratio = (s.stok[f.id] || 0) / f.cap;
                    if (ratio > ORDER_TRIGGER_RATIO) return; // masih di atas 75%, belum perlu pesan
                    // Ukuran pesanan HARUS mengikuti kapasitas armada yang benar-benar dimiliki pemain untuk jenis
                    // ini (BBM maupun LPG) - kalau belum punya truk jenis itu sama sekali, jangan buat pesanan
                    // (sama seperti BBM: tidak ada armada = tidak ada pesanan yang bisa/perlu ditawarkan).
                    const sizes = capsOf(f.lpg ? 'LPG' : 'BBM').filter(c => c <= f.cap * 0.8);
                    if (sizes.length) cand.push({ s, f, sizes, r: ratio });
                }); });
                if (cand.length) {
                    // SPBU dengan sisa stok (rasio) paling kecil menang duluan - yang paling butuh dilayani lebih dulu.
                    cand.sort((x, y) => x.r - y.r);
                    const { s, f, sizes } = cand[0];
                    const kl = sizes[Math.floor(Math.random() * sizes.length)], unit = f.unit || 'KL';
                    orders.push({ id: orderSeq++, kode: s.kode, nama: s.nama, region: s.region, prov: s.provinsi || 'Jawa Timur', fuel: f.id, kl, unit, terkirim: 0, t: now, gt: gameNow(), status: 'open' });
                    addLog(`PESANAN OTOMATIS (${fmtTime(gameNow())}): ${s.nama} (${s.region}) memesan ${kl} ${unit} ${f.label} - sisa stok ${s.stok[f.id]} ${unit} (${Math.round(s.stok[f.id] / f.cap * 100)}% dari tangki).`, 'purple');
                    notify(`Pesanan baru masuk: ${s.nama} - ${kl} ${unit} ${f.label}. Buka tab Pesanan.`, 'info');
                    // Jeda acak (+-30%) sebelum pesanan berikutnya boleh muncul, biar kedatangannya terasa bertahap.
                    nextOrderGt = gameNow() + ORDER_TRICKLE_HOURS * 3600000 * (0.7 + Math.random() * 0.6);
                }
            }
            const p0 = refineryData[0], pp = p0.stok_current / p0.stok_max;
            if (pp <= 0.2 && !bbmWarned) { bbmWarned = true; renderRefineries(); addLog(`PERINGATAN: Stok bahan bakar Kilang Tuban tinggal ${Math.round(pp * 100)}%. Segera beli pasokan di menu Kilang.`, 'warning'); }
            else if (pp > 0.3) bbmWarned = false;
            renderOrders();
        }
        const fuelLabel = id => (FUELS.find(f => f.id === id) || {}).label || id;

        function fulfilOrder(spbu, label, truck) {
            const f = truck.type === 'LPG' ? FUELS.find(x => x.lpg) : (truck.type === 'BBM' ? FUELS.find(x => x.label === label) : null); if (!f) return 0;
            ensureStok(spbu);
            spbu.stok[f.id] = Math.min(f.cap, Math.round(((spbu.stok[f.id] || 0) + truck.cap) * 10) / 10);
            const o = orders.find(x => x.kode === spbu.kode && x.fuel === f.id);
            if (!o) return 0;
            o.terkirim += truck.cap;
            if (o.terkirim >= o.kl) closeOrder(o, 'Selesai');
            addLog(`PESANAN DIPENUHI: ${truck.cap} ${f.unit || 'KL'} ${f.label} untuk ${spbu.nama}. Bonus pesanan otomatis +${Math.round(ECO.bonusPesanan * 100)}%.`, 'success');
            renderOrders();
            return Math.round(truck.cap * (f.lpg ? ECO.jualTon : ECO.jualKl) * ECO.bonusPesanan);
        }
        function kirimPesanan(id) {
            const o = orders.find(x => x.id === id); if (!o) return;
            if (o.fuel === 'lpg') { document.getElementById('delivery-region-filter').value = 'ALL'; populateSpbuDropdowns('ALL'); document.getElementById('lpg-spbu-select').value = o.kode; switchTab('tab-lpg'); return; }
            document.getElementById('delivery-region-filter').value = 'ALL';
            populateSpbuDropdowns('ALL');
            document.getElementById('delivery-spbu-select').value = o.kode;
            document.getElementById('delivery-fuel-type').value = fuelLabel(o.fuel);
            switchTab('tab-delivery');
        }
        let ordFuelFilter = 'ALL';
        let ordKilangFilter = 'ALL';
        function setOrdFuel(f) { ordFuelFilter = f; renderOrders(); }
        function setOrdKilang(key) { ordKilangFilter = key; renderOrders(); }
        function renderOrders() {
            const badge = document.getElementById('ord-badge');
            badge.innerText = orders.length; badge.classList.toggle('hidden', !orders.length);
            const sel = document.getElementById('ord-prov');
            if (sel.options.length === 1) WILAYAH.forEach(w => sel.add(new Option(w[0], w[0])));
            if (document.getElementById('tab-orders').classList.contains('hidden')) return;
            document.querySelectorAll('.ord-fuel-btn').forEach(b => { const on = b.dataset.f === ordFuelFilter; b.classList.toggle('bg-purple-600', on); b.classList.toggle('text-white', on); b.classList.toggle('text-gray-400', !on); });
            const pv = sel.value, now = Date.now();
            const live = o => { const s = loadedSpbuList.find(x => x.kode === o.kode); return s && s.stok ? s.stok[o.fuel] : 0; };
            const matchFuel = o => ordFuelFilter === 'ALL' || (ordFuelFilter === 'LPG' ? o.fuel === 'lpg' : o.fuel !== 'lpg');
            const open = orders.filter(o => (pv === 'ALL' || o.prov === pv) && matchFuel(o)).sort((a, b) => live(a) - live(b));
            const kpi = (l, v, c) => `<div class="bg-gray-900 rounded-lg p-2 text-center border border-gray-800"><div class="text-[9px] text-gray-500">${l}</div><div class="font-mono font-black text-sm ${c}">${v}</div></div>`;
            document.getElementById('ord-kpi').innerHTML = kpi('Pesanan BBM', orders.filter(o => o.fuel !== 'lpg').length, 'text-blue-400') + kpi('Pesanan LPG', orders.filter(o => o.fuel === 'lpg').length, 'text-orange-400') + kpi('Stok Habis', orders.filter(o => live(o) <= 0).length, 'text-amber-400') + kpi('Total Diminta', orders.filter(o => !o.unit || o.unit === 'KL').reduce((n, o) => n + o.kl - o.terkirim, 0) + ' KL' + (orders.some(o => o.unit === 'Ton') ? ' + ' + orders.filter(o => o.unit === 'Ton').reduce((n, o) => n + o.kl - o.terkirim, 0) + ' T' : ''), 'text-emerald-400');
            // ===== KELOMPOKKAN PESANAN PER KILANG/DEPO SUMBER =====
            // Setiap pesanan dikaitkan ke kilang/depo AKTIF terdekat yang benar-benar men-supply jenis produknya
            // (lihat recomputeWilayah/nearestActiveKilang). Kalau pemain sudah membuka kilang/depo kedua,
            // pesanan SPBU di sekitarnya otomatis masuk bagian kilang itu sendiri, terpisah dari bagian Kilang Tuban.
            // Pesanan yang sumbernya tidak valid/tidak ketemu (jangan pernah ditebak asal-asalan) masuk bagian "Idle" di akhir.
            const orderAsal = o => {
                const sp = loadedSpbuList.find(x => x.kode === o.kode);
                const asalId = sp ? (o.fuel === 'lpg' ? sp.wilayahLpgId : sp.wilayahBbmId) : null;
                const asalKilang = asalId ? refineryData.find(k => k.id === asalId && k.is_unlocked) : null;
                const asalJarak = asalKilang ? (o.fuel === 'lpg' ? sp.wilayahLpgJarak : sp.wilayahBbmJarak) : null;
                return { sp, asalKilang, asalJarak };
            };
            const orderCardHtml = o => {
                const f = FUELS.find(x => x.id === o.fuel), sisa = live(o), pct = Math.round(sisa / f.cap * 100), left = Math.max(0, Math.round((ORDER_TTL - (now - o.t)) / (60000 / GAME_SPEED))), trf = TRAFFIC[(orderAsal(o).sp && orderAsal(o).sp.traffic) || 'Sedang'].label; // menit game
                const { asalJarak } = orderAsal(o);
                return `<div class="bg-gray-900 border ${sisa <= 0 ? 'border-red-500/60' : 'border-gray-800'} rounded-lg p-2.5 space-y-1.5">
                  <div class="flex justify-between items-start gap-2"><div class="min-w-0"><div class="text-xs font-bold text-gray-100 truncate">${esc(o.nama)}</div><div class="text-[10px] text-gray-500">${esc(o.region)} &middot; ${esc(o.prov)} &middot; Keramaian ${trf}${asalJarak != null ? ` &middot; &plusmn;${asalJarak} km dari depo` : ''} &middot; ${o.gt ? new Date(o.gt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + fmtTime(o.gt) : ''}</div></div>
                  <span class="text-[10px] font-bold border rounded px-1.5 py-0.5 shrink-0 ${f.color}">${f.label}</span></div>
                  <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden"><div class="${pct <= 0 ? 'bg-red-600' : 'bg-amber-500'} h-full" style="width:${pct}%"></div></div>
                  <div class="flex justify-between items-center text-[10px]"><span class="text-gray-400">${sisa <= 0 ? '<b class="text-red-400">HABIS</b>' : `Sisa <b class="text-amber-400">${sisa} ${f.unit || 'KL'}</b> / ${f.cap} ${f.unit || 'KL'}`} &middot; Pesan <b class="text-emerald-400">${o.kl - o.terkirim} ${o.unit || 'KL'}</b> &middot; ${Math.floor(left / 60)}j ${left % 60}m</span>
                  <button onclick="kirimPesanan(${o.id})" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded font-bold">Kirim</button></div></div>`;
            };
            const ordGroups = new Map(); // id kilang (atau 'IDLE') -> { kilang, orders: [] }
            open.forEach(o => {
                const { asalKilang } = orderAsal(o);
                const key = asalKilang ? asalKilang.id : 'IDLE';
                if (!ordGroups.has(key)) ordGroups.set(key, { kilang: asalKilang, orders: [] });
                ordGroups.get(key).orders.push(o);
            });
            const refOrderIdx = refineryData.map(k => k.id);
            const ordGroupKeys = [...ordGroups.keys()].sort((a, b) => (a === 'IDLE' ? 1 : b === 'IDLE' ? -1 : refOrderIdx.indexOf(a) - refOrderIdx.indexOf(b)));
            // Chip filter kilang/depo: klik salah satu (atau klik langsung judul grupnya) untuk cuma menampilkan pesanan kilang itu.
            const kilangChips = refineryData.filter(k => k.is_unlocked).map(k => ({ key: k.id, label: k.nama }));
            if (ordGroups.has('IDLE')) kilangChips.push({ key: 'IDLE', label: 'Idle' });
            document.getElementById('ord-kilang-tabs').innerHTML = [{ key: 'ALL', label: 'Semua Kilang' }, ...kilangChips].map(c =>
                `<button onclick="setOrdKilang('${c.key}')" class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${ordKilangFilter === c.key ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'}">${esc(c.label)}</button>`
            ).join('');
            const visibleGroupKeys = ordGroupKeys.filter(key => ordKilangFilter === 'ALL' || key === ordKilangFilter);
            document.getElementById('ord-list').innerHTML = open.length && visibleGroupKeys.length ? visibleGroupKeys.map(key => {
                const grp = ordGroups.get(key), k = grp.kilang;
                return `<div class="space-y-2">
                  <div onclick="setOrdKilang('${key}')" class="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide ${k ? 'text-cyan-400' : 'text-amber-400'} border-b ${k ? 'border-cyan-500/20' : 'border-amber-500/20'} pb-1 cursor-pointer select-none" title="Klik untuk hanya tampilkan bagian ini">
                    <i class="fa-solid ${k ? (k.id === 'KILANG-01' ? 'fa-industry' : 'fa-warehouse') : 'fa-triangle-exclamation'}"></i>
                    <span>${k ? esc(k.nama) : 'Idle &middot; Belum Ada Kilang/Depo Aktif'}</span>
                    <span class="ml-auto font-mono text-[10px] bg-gray-900 border border-gray-800 rounded-full px-2 py-0.5 normal-case text-gray-400">${grp.orders.length} pesanan</span>
                  </div>
                  <div class="space-y-2">${grp.orders.map(orderCardHtml).join('')}</div>
                </div>`;
            }).join('') : (companyFleet.length ? `<div class="text-xs text-gray-500 text-center py-4">Belum ada pesanan ${ordFuelFilter === 'ALL' ? '' : ordFuelFilter + ' '}yang cocok dengan filter ini. Pesanan muncul otomatis, ukurannya mengikuti kapasitas armada Anda.</div>` : '<div class="text-xs text-gray-500 text-center py-4">Belum punya armada. Beli truk dulu (BBM dan/atau LPG); pesanan menyesuaikan kapasitas armada yang Anda miliki.</div>');
            document.getElementById('ord-hist').innerHTML = ordHist.map(o => `<div class="flex justify-between bg-gray-900 rounded px-2 py-1"><span class="truncate text-gray-300">${esc(o.nama)} &middot; ${fuelLabel(o.fuel)} ${o.kl} ${o.unit || 'KL'}</span><b class="${o.status === 'Selesai' ? 'text-emerald-400' : 'text-red-400'}">${o.status}</b></div>`).join('') || '<div class="text-gray-600">Belum ada riwayat.</div>';
        }
        setInterval(() => { if (currentAccount) tickStock(); }, 6000);

        setInterval(saveGame, 30000);
        // Heartbeat leaderboard diperlambat jadi tiap 15 menit (dari 5 menit) - broadcast-nya ke semua pemain
        // online lewat listener real-time, jadi ini pengungkit terbesar buat hemat kuota baca Firestore gratis.
        setInterval(publishBoard, 900000);
        setInterval(renderVerified, 30000);
        setInterval(() => { if (currentAccount && !document.getElementById('tab-leaderboard').classList.contains('hidden')) renderLeaderboard(); }, 3000);
        window.addEventListener('beforeunload', saveGame);

        // ============================================================
        // DEALER: pemilih kategori armada, biar cuma satu kategori yang tampil
        // (nggak perlu scroll panjang ngelewatin semua jenis truk/kapal).
        // ============================================================
        function selectDealerCat(cat) {
            document.querySelectorAll('.dealer-cat-btn').forEach(b => b.classList.toggle('active', b.dataset.dcat === cat));
            document.querySelectorAll('.dealer-cat-panel').forEach(p => p.classList.toggle('hidden', p.dataset.dcatPanel !== cat));
            const strip = document.getElementById('dealer-cat-switch');
            const activeBtn = strip && strip.querySelector('.dealer-cat-btn.active');
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // ============================================================
        // PICKER: ganti semua <select> jadi tombol + lembar pilihan (bottom sheet)
        // <select> asli TETAP ada di DOM (disembunyikan) supaya semua logic lama
        // (populate*, .value=, .selectedIndex=, onchange=...) tetap jalan apa adanya.
        // ============================================================
        (function () {
            const VALUE_DESC = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            const INDEX_DESC = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
            let activeOverlay = null;

            const ICONS = [
                [/truck|kapal|armada/i, 'fa-truck'],
                [/driver|nahkoda/i, 'fa-id-card'],
                [/kernet|abk|mekanik/i, 'fa-user-gear'],
                [/spbu|target|depot/i, 'fa-gas-pump'],
                [/region|prov|wilayah/i, 'fa-map-location-dot'],
                [/fuel|type|lpg-type|muatan/i, 'fa-droplet'],
                [/pkg|paket/i, 'fa-box'],
                [/ban-days|hari/i, 'fa-calendar-days'],
            ];
            function iconFor(sel) {
                const key = sel.id || '';
                for (const [re, ic] of ICONS) if (re.test(key)) return ic;
                return 'fa-list-ul';
            }
            function titleFor(sel) {
                const lbl = sel.parentElement && sel.parentElement.querySelector('label');
                if (lbl) return lbl.textContent.replace(/:\s*$/, '').trim();
                return sel.getAttribute('aria-label') || 'Pilih';
            }
            function currentLabel(sel) {
                const opt = sel.options[sel.selectedIndex];
                return opt ? opt.text : '-- Pilih --';
            }
            function isPlaceholderText(t) { return /^--.*--$/.test((t || '').trim()); }

            function refreshBtn(sel) {
                const btn = sel._pickerBtn;
                if (!btn) return;
                const span = btn.querySelector('.pb-label');
                const txt = currentLabel(sel);
                span.textContent = txt;
                span.classList.toggle('pb-placeholder', isPlaceholderText(txt) || !sel.value);
                btn.disabled = !sel.options.length;
                btn.classList.toggle('opacity-60', !sel.options.length);
            }

            function closeOverlay() {
                if (!activeOverlay) return;
                const ov = activeOverlay, btn = ov._forBtn;
                ov.classList.remove('show');
                if (btn) btn.classList.remove('open');
                setTimeout(() => ov.remove(), 160);
                activeOverlay = null;
                document.removeEventListener('keydown', onEsc);
            }
            function onEsc(e) { if (e.key === 'Escape') closeOverlay(); }

            function openPicker(sel) {
                closeOverlay();
                const overlay = document.createElement('div');
                overlay.className = 'picker-overlay';
                overlay._forBtn = sel._pickerBtn;

                const sheet = document.createElement('div');
                sheet.className = 'picker-sheet';
                overlay.appendChild(sheet);

                const head = document.createElement('div');
                head.className = 'picker-sheet-head';
                head.innerHTML = `<div class="picker-sheet-title"><span><i class="fa-solid ${iconFor(sel)} mr-1.5 text-emerald-400"></i>${esc(titleFor(sel))}</span><span class="picker-sheet-close"><i class="fa-solid fa-xmark"></i></span></div>`;
                head.querySelector('.picker-sheet-close').onclick = closeOverlay;
                sheet.appendChild(head);

                const leafCount = sel.querySelectorAll('option').length;
                let searchInput = null;
                if (leafCount > 7) {
                    const sw = document.createElement('div');
                    sw.className = 'picker-search';
                    sw.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Cari...">`;
                    head.appendChild(sw);
                    searchInput = sw.querySelector('input');
                }

                const body = document.createElement('div');
                body.className = 'picker-sheet-body custom-scrollbar';
                sheet.appendChild(body);

                function makeItem(opt) {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'picker-item' + (opt.index === sel.selectedIndex ? ' active' : '');
                    item.dataset.text = (opt.text || '').toLowerCase();
                    if (opt.disabled) {
                        item.disabled = true;
                        item.innerHTML = `<span class="pi-check"></span><span>${esc(opt.text)}</span>`;
                    } else {
                        item.innerHTML = `<span class="pi-check"><i class="fa-solid fa-check"></i></span><span class="flex-1 min-w-0">${esc(opt.text)}</span>`;
                        item.onclick = () => {
                            VALUE_DESC.set.call(sel, opt.value);
                            refreshBtn(sel);
                            sel.dispatchEvent(new Event('change', { bubbles: true }));
                            sel.dispatchEvent(new Event('input', { bubbles: true }));
                            closeOverlay();
                        };
                    }
                    return item;
                }

                function renderList() {
                    body.innerHTML = '';
                    let shown = 0;
                    Array.from(sel.children).forEach(child => {
                        if (child.tagName === 'OPTGROUP') {
                            const opts = Array.from(child.children);
                            const wrap = document.createElement('div');
                            wrap.className = 'picker-group';
                            const lbl = document.createElement('div');
                            lbl.className = 'picker-group-label';
                            lbl.textContent = child.label || '';
                            wrap.appendChild(lbl);
                            let groupShown = 0;
                            opts.forEach(opt => {
                                const t = (opt.text || '').toLowerCase();
                                if (searchInput && searchInput._q && !t.includes(searchInput._q)) return;
                                wrap.appendChild(makeItem(opt));
                                groupShown++; shown++;
                            });
                            if (groupShown) body.appendChild(wrap);
                        } else if (child.tagName === 'OPTION') {
                            const t = (child.text || '').toLowerCase();
                            if (searchInput && searchInput._q && !t.includes(searchInput._q)) return;
                            body.appendChild(makeItem(child));
                            shown++;
                        }
                    });
                    if (!shown) body.innerHTML = '<div class="picker-empty">Tidak ada hasil.</div>';
                }
                renderList();

                if (searchInput) {
                    searchInput.addEventListener('input', () => {
                        searchInput._q = searchInput.value.trim().toLowerCase();
                        renderList();
                    });
                }

                document.body.appendChild(overlay);
                overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeOverlay(); });
                requestAnimationFrame(() => overlay.classList.add('show'));
                if (sel._pickerBtn) sel._pickerBtn.classList.add('open');
                activeOverlay = overlay;
                document.addEventListener('keydown', onEsc);
                if (searchInput && !('ontouchstart' in window)) setTimeout(() => searchInput.focus(), 180);
            }

            function enhanceSelect(sel) {
                if (sel.dataset.pickerEnhanced || sel.multiple) return;
                sel.dataset.pickerEnhanced = '1';

                const wrap = document.createElement('div');
                wrap.className = 'picker-wrap';
                sel.parentNode.insertBefore(wrap, sel);
                wrap.appendChild(sel);
                sel.classList.add('picker-native');
                sel.tabIndex = -1;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = sel.className.replace('picker-native', '') + ' picker-btn';
                btn.innerHTML = `<i class="fa-solid ${iconFor(sel)} pb-ico"></i><span class="pb-label"></span><i class="fa-solid fa-chevron-down pb-chev"></i>`;
                btn.onclick = () => openPicker(sel);
                wrap.appendChild(btn);
                sel._pickerBtn = btn;

                Object.defineProperty(sel, 'value', {
                    configurable: true,
                    get() { return VALUE_DESC.get.call(sel); },
                    set(v) { VALUE_DESC.set.call(sel, v); refreshBtn(sel); }
                });
                Object.defineProperty(sel, 'selectedIndex', {
                    configurable: true,
                    get() { return INDEX_DESC.get.call(sel); },
                    set(v) { INDEX_DESC.set.call(sel, v); refreshBtn(sel); }
                });

                sel.addEventListener('change', () => refreshBtn(sel));
                new MutationObserver(() => refreshBtn(sel)).observe(sel, { childList: true, subtree: true });

                refreshBtn(sel);
            }

            function scanAndEnhance(root) {
                (root.matches && root.matches('select') ? [root] : Array.from(root.querySelectorAll ? root.querySelectorAll('select') : [])).forEach(enhanceSelect);
            }

            window.addEventListener('DOMContentLoaded', () => scanAndEnhance(document.body));
            document.querySelectorAll('select').forEach(enhanceSelect);

            new MutationObserver(muts => {
                muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) scanAndEnhance(n); }));
            }).observe(document.body, { childList: true, subtree: true });
        })();

        updateCashDisplay();
        renderDealerCatalog();
        initSpbuDatabase();
        initAuth();
        switchLogTab('general');
