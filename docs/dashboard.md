# Dashboard

> Lokasi menu: **Dashboard** (menu paling atas) — URL `/dashboard`

## Apa itu halaman ini?

Dashboard adalah halaman ringkasan finansial perusahaan — menampilkan KPI utama, grafik tren, dan komposisi keuangan, semuanya dihitung otomatis dari data Buku Besar (GL). Ini adalah halaman pertama yang muncul setelah login.

## Cara memakai

- Pilih **Tahun** dari dropdown di kanan atas (menampilkan 5 tahun terakhir) — data akan otomatis dimuat ulang.
- Klik ikon **refresh** (lingkaran panah) untuk memuat ulang data tahun yang sama tanpa mengganti pilihan.
- Tidak ada form input di halaman ini — murni tampilan ringkasan.

## Isi Dashboard

**Kartu KPI (4 kotak atas):**
- **Revenue (YTD)** — total pendapatan tahun berjalan.
- **Net Profit (YTD)** — laba bersih tahun berjalan.
- **Cash Balance** — total saldo semua akun yang ditandai "Akun Kas & Bank".
- **Total Assets** — total nilai aset.

**Grafik Revenue & Profit Trend** — tren bulanan (Januari–Desember) untuk Revenue dan Net Profit sepanjang tahun yang dipilih.

**Grafik Asset Composition** — diagram donat komposisi aset per kategori COA.

**Grafik Cash Flow Activities** — batang horizontal untuk 3 aktivitas (Operasi, Investasi, Pendanaan), warna hijau untuk arus kas positif dan merah untuk negatif — perhitungannya sama seperti di [Laporan Arus Kas](laporan-arus-kas.md).

**Detailed Summary (4 kartu kecil):** Total Expense, Liabilities, Equity, dan Net Margin (persentase laba bersih terhadap pendapatan).

## Mode Consultant

Kalau aplikasi berjalan dalam **Consultant Mode** (lihat [Consultant Settings](consultant-settings.md)) dan belum ada client yang dipilih di navbar atas, Dashboard menampilkan pesan "Ready to Consult" dan meminta memilih client dulu. Kalau koneksi ke server client gagal, akan muncul pesan error dengan tombol pintasan **"Buka Consultant Settings"** dan **"Coba Lagi"**.

## Terkait

- [Laporan Arus Kas](laporan-arus-kas.md) — logika perhitungan Cash Flow Activities yang sama dipakai di sini.
- [Master COA](master-coa.md) — sumber data kategori & tipe akun untuk semua grafik.
- [Consultant Settings](consultant-settings.md) — memilih client aktif bila memakai mode konsultan.
