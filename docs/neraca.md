# Neraca (Balance Sheet / Laporan Posisi Keuangan)

> Lokasi menu: **Laporan Keuangan → Neraca** — URL `/laporan/neraca`

## Apa itu laporan ini?

Neraca menampilkan posisi keuangan perusahaan (Aset, Liabilitas, Ekuitas) pada satu titik waktu tertentu. Modul ini punya dua mode laporan.

## Mode Laporan

Pilih dari dropdown **"Mode Laporan"**:

1. **Neraca Standar (Resmi)** — laporan posisi keuangan resmi per satu tanggal.
   - Isi **Per Tanggal** (default: hari ini), klik **Tampilkan**.
2. **Neraca Per Tahun (Analisis)** — perbandingan Neraca antar beberapa tahun sekaligus, untuk analisis tren.
   - Isi **Dari Tahun** dan **Sampai Tahun** (default: 2 tahun terakhir s/d tahun berjalan), klik **Tampilkan**.

Setiap kali mode diganti, laporan otomatis dimuat ulang.

## Cara membaca laporan

**Mode Standar:**
- **ASET** — total aset, dengan kategori yang bisa dibuka/tutup untuk melihat rincian per akun. Diakhiri **TOTAL ASET**.
- **LIABILITAS** — total liabilitas (hutang) per kategori.
- **EKUITAS** — total ekuitas per kategori, ditambah baris **"Laba Berjalan (Laba Ditahan)"** (laba/rugi kumulatif sejak awal sampai tanggal laporan, dihitung otomatis dari transaksi Pendapatan−Beban — **tidak perlu jurnal penutup tahunan manual**), diakhiri **TOTAL EKUITAS**.
- Baris terakhir **TOTAL LIABILITAS & EKUITAS** — secara akuntansi harus sama dengan **TOTAL ASET**.

**Mode Komparatif:** tabel dengan kolom per tahun, struktur Aset/Liabilitas/Ekuitas yang sama tapi ditampilkan berdampingan untuk tiap tahun dalam rentang yang dipilih, memudahkan melihat tren dari tahun ke tahun.

> 📌 Catatan penting: Berbeda dari [Laporan Laba Rugi](laporan-laba-rugi.md) yang berbasis periode, saldo di Neraca bersifat **kumulatif sejak awal berdirinya perusahaan sampai "Per Tanggal"** yang dipilih. Jadi Neraca tidak punya "Tanggal Mulai" — hanya satu tanggal cut-off.

## Ekspor & cetak

- **Print** — mencetak laporan resmi dengan kop dan tanda tangan (Direktur Utama / Bagian Keuangan) yang muncul otomatis saat mode cetak, ukuran kertas menyesuaikan mode (Standar = A4 portrait, Komparatif = A4 landscape).
- ⚠️ Neraca **tidak punya tombol Export PDF atau Export Excel** — hanya Print.

## Terkait

- [Master COA](master-coa.md) — kategori akun tipe "Asset", "Kewajiban", "Modal" yang menyusun laporan ini.
- [Laporan Laba Rugi](laporan-laba-rugi.md) — sumber perhitungan "Laba Berjalan" di bagian Ekuitas.
