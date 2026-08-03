# Dokumentasi Pengguna — Temui

Temui adalah aplikasi akuntansi & pembukuan berbasis web (backend Go + frontend React). Dokumen ini menjadi pintu masuk panduan penggunaan tiap modul: penjelasan fungsinya, cara input data, dan tombol/fungsi apa saja yang tersedia. Struktur di bawah mengikuti struktur menu sidebar aplikasi.

Dokumentasi ini juga bisa dibuka langsung dari dalam aplikasi lewat menu **Bantuan → Panduan Pengguna (FAQ)**.

## Dashboard

[Dashboard](dashboard.md) — ringkasan finansial (KPI, grafik tren, komposisi aset, arus kas) begitu Anda login.

## Transaksi

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Akun | [master-coa.md](master-coa.md) | Chart of Accounts — daftar akun & kategori akun, pondasi seluruh pencatatan. |
| Buku Kas | [input-transaksi.md](input-transaksi.md) | Mencatat mutasi kas/bank, otomatis membuat jurnal. |
| Pembelian | [pembelian.md](pembelian.md) | Tagihan pembelian dari pemasok (AP Invoice), otomatis membuat jurnal. |
| Penjualan | [penjualan.md](penjualan.md) | Tagihan penjualan ke pelanggan (AR Invoice), otomatis membuat jurnal. |
| Aset Tetap → Master Aset Tetap | [master-aset-tetap.md](master-aset-tetap.md) | Registrasi & kelola data aset tetap, penjualan/pelepasan aset. |
| Aset Tetap → Registrasi Aset | [registrasi-aset.md](registrasi-aset.md) | Mendaftarkan barang hasil Pembelian yang ditandai Aset Tetap. |
| Aset Tetap → Posting ke GL | [posting-aset-gl.md](posting-aset-gl.md) | Memposting jurnal akuisisi aset Draft ke Buku Besar. |
| Aset Tetap → Hitung Penyusutan | [hitung-penyusutan.md](hitung-penyusutan.md) | Menghitung & memposting beban penyusutan bulanan. |

## Jurnal

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Jurnal Umum | [jurnal-umum.md](jurnal-umum.md) | Daftar/riwayat seluruh entri jurnal dari semua modul (read-only). |
| Jurnal Penyesuaian (AJE) | [jurnal-penyesuaian-aje.md](jurnal-penyesuaian-aje.md) | Input jurnal manual/penyesuaian akhir periode. |

*Riwayat Jurnal belum tersedia di aplikasi (placeholder menu).*

## Buku Besar

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Neraca Saldo | [neraca-saldo.md](neraca-saldo.md) | Saldo semua akun per bulan dalam satu tahun. |
| Buku Besar Utama | [buku-besar.md](buku-besar.md) | Rincian mutasi per akun COA dalam periode tertentu. |
| Buku Besar Pembantu | [buku-besar-pembantu.md](buku-besar-pembantu.md) | Rincian mutasi per rekanan (pelanggan/pemasok). |
| Pemasok | [master-pemasok.md](master-pemasok.md) | Master data supplier. |
| Pembeli | [master-pembeli.md](master-pembeli.md) | Master data customer. |
| Pekerjaan | [master-project.md](master-project.md) | Master data proyek untuk pelacakan biaya per proyek. |
| Mata Uang | [master-mata-uang.md](master-mata-uang.md) | Master mata uang & akun GL otomatis untuk Pembelian/Penjualan. |
| Pajak | [master-pajak.md](master-pajak.md) | Master jenis/tarif pajak & akun GL-nya. |

## Persediaan

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Barang Dan Jasa | [master-barang-jasa.md](master-barang-jasa.md) | Katalog item — harga default & akun GL. |
| Gudang | [master-gudang.md](master-gudang.md) | Master lokasi gudang. |
| Penyesuaian Persediaan | [penyesuaian-persediaan.md](penyesuaian-persediaan.md) | Stock opname / koreksi stok, bisa membuat jurnal. |
| Persediaan | [master-persediaan.md](master-persediaan.md) | Laporan saldo & mutasi stok (read-only). |

## Pajak (menu)

*Menu Pajak (Kalkulator Pajak, Proyeksi Pajak, Arsip Pajak) masih berupa placeholder dan belum bisa dipakai di versi ini.*

## Laporan Keuangan

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Laba Rugi | [laporan-laba-rugi.md](laporan-laba-rugi.md) | Pendapatan, beban, dan laba/rugi bersih per periode. |
| Neraca | [neraca.md](neraca.md) | Posisi Aset, Liabilitas, Ekuitas per tanggal (+ mode perbandingan antar tahun). |
| Arus Kas | [laporan-arus-kas.md](laporan-arus-kas.md) | Arus kas Operasi/Investasi/Pendanaan per periode. |
| Perubahan Modal | [laporan-perubahan-modal.md](laporan-perubahan-modal.md) | Pergerakan modal/ekuitas dari awal sampai akhir periode. |
| Fix Asset History & Summary | [laporan-fix-asset.md](laporan-fix-asset.md) | Riwayat detail per aset & ringkasan seluruh aset per kategori. |

## Anggaran (menu)

*Menu Anggaran masih berupa placeholder dan belum bisa dipakai di versi ini.*

## Pengaturan

| Modul | Dokumen | Fungsi singkat |
|---|---|---|
| Profil Perusahaan → Informasi Umum | [informasi-umum.md](informasi-umum.md) | Data identitas perusahaan (nama, alamat, logo). |
| Profil Perusahaan → Karyawan | [master-karyawan.md](master-karyawan.md) | Master data karyawan. |
| Tampilan | [tampilan-setting.md](tampilan-setting.md) | Kustomisasi tema aplikasi & backup/restore database. |
| Consultant Settings | [consultant-settings.md](consultant-settings.md) | Kelola banyak client database (mode konsultan). |

*Pajak Perusahaan dan Sinkronisasi masih berupa placeholder dan belum bisa dipakai di versi ini.*

## Bantuan (menu)

Panduan Pengguna ini sendiri bisa dibuka dari menu **Bantuan → Panduan Pengguna (FAQ)** langsung di dalam aplikasi. *Chat Dukungan/Tiket Masalah dan Kontak CS/Konsultan Pajak masih berupa placeholder.*

## Alur kerja yang disarankan

```
1. Setup awal   → Informasi Umum → Master COA → Master Mata Uang & Pajak
                  → Master Pemasok/Pembeli/Barang & Jasa/Gudang → Master Aset Tetap (kalau ada aset)
2. Harian       → Input Transaksi (kas/bank), Pembelian, Penjualan,
                  Penyesuaian Persediaan (kalau stok fisik meleset), Jurnal Penyesuaian (kalau perlu)
3. Siklus aset  → Registrasi Aset → Posting ke GL → Hitung Penyusutan (tiap bulan)
4. Cek berkala  → Jurnal Umum, Buku Besar (Utama/Pembantu), Neraca Saldo, Persediaan (laporan stok)
5. Akhir bulan  → Laba Rugi, Neraca, Arus Kas, Perubahan Modal, Fix Asset Summary
```

Setiap modul transaksi (Input Transaksi, Pembelian, Penjualan, Hitung Penyusutan, Penyesuaian Persediaan, AJE) **otomatis memposting jurnal ke Buku Besar** — Anda tidak perlu membuat jurnal manual untuk alur normal. Kalau ada laporan atau transaksi yang gagal/tidak sesuai, penyebab paling umum adalah data master yang belum lengkap — terutama akun-akun GL di [Master Mata Uang](master-mata-uang.md), [Master Pajak](master-pajak.md), dan [Master Barang & Jasa](master-barang-jasa.md), serta flag "Akun Kas & Bank" di [Master COA](master-coa.md).

## Cara berkontribusi menambah dokumentasi

Ikuti gaya penulisan yang sama seperti dokumen yang sudah ada: judul modul, lokasi menu, "Apa itu modul ini?", langkah-langkah input dengan tabel field, validasi/catatan penting, lalu bagian "Terkait" untuk cross-link ke dokumen lain. Setelah menambah file baru di `docs/`, daftarkan juga di `frontend/src/pages/bantuan/panduanData.js` supaya muncul di halaman Panduan Pengguna dalam aplikasi.
