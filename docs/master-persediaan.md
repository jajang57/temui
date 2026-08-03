# Persediaan (Laporan Stok)

> Lokasi menu: **Persediaan → Persediaan** — URL `/master-data/persediaan`

## Apa itu halaman ini?

⚠️ Meski letaknya di menu "Persediaan" bersama modul master data lain, halaman ini **bukan form input** — ini adalah **laporan stok** (read-only) yang menggabungkan data dari [Pembelian](pembelian.md) (stok masuk), [Penjualan](penjualan.md) (stok keluar), dan [Penyesuaian Persediaan](penyesuaian-persediaan.md) (koreksi), dihitung otomatis memakai metode **rata-rata bergerak (moving average)**.

## Filter (berlaku untuk kedua tab)

- **Dari** / **Sampai** — rentang tanggal (default: awal bulan berjalan s/d hari ini).
- **Barang** — opsional, kosongkan untuk semua item.
- **Gudang** — opsional, kosongkan untuk semua gudang.
- Klik **Go** untuk memuat data.

## Tab "Summary"

Ringkasan saldo per item per gudang dalam periode terpilih, dikelompokkan per Gudang. Kolom: Kode, Nama, Gudang, Saldo Awal (Qty & Nilai), Masuk, Keluar, Penyesuaian, Saldo Akhir (Qty), Nilai Akhir. Setiap grup gudang diakhiri baris **Total**.

## Tab "Mutasi"

Kartu stok kronologis per item per gudang — menampilkan setiap transaksi individual yang memengaruhi stok. Kolom: Tanggal, **Sumber** (Pembelian/Penjualan/Penyesuaian), Nomor (nomor bukti transaksi asal), Gudang, Qty Masuk, Qty Keluar, Harga, Saldo Qty, Saldo Nilai, Keterangan.

## Ekspor & cetak

- **PRINT** — cetak tampilan tab yang sedang aktif.
- **EXCEL** — mengunduh `MasterPersediaan_summary.xlsx` atau `MasterPersediaan_mutasi.xlsx` sesuai tab yang aktif.

## Catatan penting

- Laporan ini **selalu real-time** — tidak ada tabel stok fisik terpisah yang di-cache; semua angka dihitung ulang langsung dari transaksi Pembelian, Penjualan, dan Penyesuaian setiap kali laporan dibuka. Perubahan di modul manapun langsung terlihat di sini.
- Metode penilaian: **rata-rata bergerak** — setiap barang masuk menambah qty & nilai, setiap barang keluar mengurangi qty & nilai berdasarkan rata-rata harga berjalan saat itu (bukan FIFO/LIFO).

## Terkait

- [Master Barang & Jasa](master-barang-jasa.md), [Master Gudang](master-gudang.md) — sumber nama item & gudang.
- [Pembelian](pembelian.md), [Penjualan](penjualan.md), [Penyesuaian Persediaan](penyesuaian-persediaan.md) — tiga sumber transaksi yang membentuk laporan ini.
