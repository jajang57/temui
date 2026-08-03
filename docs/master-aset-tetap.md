# Master Aset Tetap (Fixed Asset)

> Lokasi menu: **Transaksi → Aset Tetap → Master Aset Tetap** — URL `/master-data/aset-tetap`

## Apa itu modul ini?

Modul ini adalah tempat mendaftarkan dan mengelola data aset tetap perusahaan (kendaraan, bangunan, peralatan, mesin, dll), termasuk data penyusutan (depresiasi) dan proses penjualan/pelepasan aset. Modul ini **tidak** memposting jurnal ke Buku Besar secara langsung — untuk posting akuisisi & penyusutan ke jurnal, ada alur terpisah: **Registrasi Aset**, **Posting ke GL**, dan **Hitung Penyusutan** (lihat catatan di bagian bawah).

## Cara menambah aset baru

1. Klik tombol **"Tambah Aset Tetap"** di kanan atas untuk membuka form (tombol berubah jadi **"Tutup Form"** saat form terbuka).
2. Isi field-field berikut:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Kode Aset** | Ya | Contoh: `AST001`. Harus unik, tidak boleh sama dengan aset lain. |
   | **Nama Aset** | Ya | Nama deskriptif aset. |
   | **Kategori Aset** | Tidak | Pilihan: Kendaraan, Bangunan, Peralatan, Mesin, Furniture, Elektronik, Lainnya. |
   | **Tanggal Perolehan** | Tidak | Tanggal aset dibeli/diperoleh. |
   | **Harga Perolehan** | Tidak | Nilai beli aset (harga pokok). Format angka otomatis rapi (pemisah ribuan). |
   | **Umur Ekonomis (Bulan)** | Tidak | ⚠️ **Diisi dalam satuan BULAN, bukan tahun.** Contoh: untuk aset berumur 5 tahun, isi `60`. |
   | **Qty** | Tidak | Jumlah unit aset (default 1). |
   | **Nilai Residu** | Tidak | Perkiraan nilai sisa aset di akhir masa manfaatnya (nilai jual/scrap value). |
   | **Metode Penyusutan** | Tidak | **Garis Lurus** (default, straight-line) atau **Saldo Menurun** (declining balance). |
   | **Tanggal Mulai Penyusutan** | Tidak | Bisa berbeda dari Tanggal Perolehan, kalau penyusutan baru mulai dihitung belakangan. |
   | **Akun Aset Tetap** | Tidak | Akun COA yang mencatat nilai aset ini (cari & pilih dari daftar Master COA). |
   | **Akun Akumulasi Penyusutan** | Tidak | Akun COA kontra-aset untuk akumulasi penyusutan. |
   | **Akun Beban Penyusutan** | Tidak | Akun COA beban penyusutan (masuk ke Laba Rugi). |
   | **Akun Lawan** | Tidak | Akun kredit yang dipakai saat posting perolehan aset (biasanya Kas/Bank/Hutang). |
   | **Keterangan** | Tidak | Catatan bebas. |
   | **Aktif** | Tidak | Centang jika aset masih aktif digunakan (default: dicentang). |

3. Klik **Simpan**. Tombol **Kosongkan** mengosongkan form kapan saja; saat sedang mengedit, tombol **Cancel** membatalkan edit.

> ⚠️ Penting: field akun-akun COA (Akun Aset Tetap, Akun Akumulasi Penyusutan, Akun Beban Penyusutan, Akun Lawan) sebaiknya diisi lengkap dari awal — field ini dibutuhkan saat aset diposting ke jurnal lewat alur "Posting ke GL" / "Hitung Penyusutan".

## Melihat nilai buku & detail penyusutan

Setiap baris di tabel menampilkan kolom **Nilai Buku** yang dihitung otomatis:

- Kalau data penyusutan sudah pernah diposting resmi (lewat menu Hitung Penyusutan), nilai buku yang tampil adalah nilai resmi dari sistem.
- Kalau belum ada posting resmi, sistem menampilkan **perkiraan** berdasarkan rumus garis lurus:
  - Penyusutan per bulan = (Harga Perolehan − Nilai Residu) ÷ Umur Ekonomis (bulan)
  - Akumulasi penyusutan = Penyusutan per bulan × jumlah bulan berjalan sejak Tanggal Mulai Penyusutan (dibatasi maksimum sebesar Harga Perolehan − Nilai Residu)
  - Nilai Buku = Harga Perolehan − Akumulasi Penyusutan (tidak akan pernah turun di bawah Nilai Residu)

Klik tombol **Detail** pada baris aset untuk membuka modal **"Detail Penyusutan Aset"** yang menampilkan rincian lengkap: Harga Perolehan, Nilai Residu, Masa Manfaat (bulan & tahun), Bulan Berjalan, Penyusutan per Bulan, Penyusutan per Tahun, Akumulasi Penyusutan, Nilai Buku Saat Ini, dan Sisa Umur Ekonomis. Kalau aset sudah habis masa penyusutannya, akan muncul catatan "Aset telah selesai disusutkan."

## Status Aset

Setiap aset punya status yang ditampilkan sebagai badge warna:

| Status | Warna | Arti |
|---|---|---|
| **Draft** | Kuning | Aset baru didaftarkan, belum diposting resmi ke jurnal. |
| **Posted** | Hijau | Sudah diposting/diproses penyusutannya. |
| **Disposed** | Merah | Sudah dijual/dilepas — tombol Jual, Edit, dan Hapus otomatis disembunyikan untuk aset berstatus ini (hanya bisa dilihat lewat tombol Detail). |

## Menjual / melepas aset (Jual Aset)

Untuk aset yang belum berstatus Disposed, klik tombol **Jual** (oranye) di baris aset untuk membuka modal **"Jual Aset"**:

| Field | Wajib | Keterangan |
|---|---|---|
| **Tanggal Penjualan** | Ya | |
| **Harga Jual** | Ya | Nilai jual aset. |
| **Akun Kas/Bank** | Ya | Akun COA yang menerima hasil penjualan. |
| **Akun Laba/Rugi Penjualan Aset** | Ya | Akun COA untuk mencatat selisih laba/rugi dari penjualan. |
| **Keterangan** | Tidak | |

Begitu **Harga Jual** diisi, sistem langsung menampilkan estimasi **Laba/Rugi**: kalau Harga Jual ≥ Nilai Buku saat ini → **LABA** (hijau), kalau lebih kecil → **RUGI** (merah), beserta selisihnya dalam Rupiah.

Setelah klik **Simpan** (ada konfirmasi ulang menyebutkan nama aset & harga jual), sistem menampilkan ringkasan berisi Nomor Transaksi, Nilai Buku, Harga Jual, dan besaran Laba/Rugi. Status aset otomatis berubah menjadi **Disposed**.

## Mencari, mengedit, dan menghapus

- Tombol **Print** mencetak tabel aset yang sedang tampil.
- Aksi per baris: **Detail** (selalu ada), **Edit** dan **Hapus** (hanya untuk aset yang belum Disposed).
- Kode Aset tidak boleh duplikat — sistem memberi peringatan kalau mencoba menyimpan kode yang sudah dipakai.

## Alur lengkap siklus hidup aset tetap

Master Aset Tetap adalah titik awal pendaftaran data aset. Untuk memposting aset ke jurnal/GL dan menjalankan penyusutan berkala, ada 3 halaman terkait di menu **Transaksi → Aset Tetap**:

1. [Registrasi Aset](registrasi-aset.md) (`/aset-tetap/registrasi`) — mengubah item pembelian menjadi aset terdaftar berstatus Draft.
2. [Posting ke GL](posting-aset-gl.md) (`/aset-tetap/posting-gl`) — memposting jurnal akuisisi aset draft ke Buku Besar, status jadi Posted.
3. [Hitung Penyusutan](hitung-penyusutan.md) (`/aset-tetap/penyusutan`) — menjalankan & memposting perhitungan penyusutan berkala ke jurnal (hanya untuk aset Posted).

Untuk melihat riwayat lengkap sebuah aset (perolehan + semua posting penyusutan), lihat [Laporan Fix Asset](laporan-fix-asset.md).

## Terkait

- [Master COA](master-coa.md) — sumber pilihan akun (Aset Tetap, Akumulasi Penyusutan, Beban Penyusutan, Akun Lawan, Akun Kas/Bank, Akun Laba/Rugi Penjualan).
- [Master Barang & Jasa](master-barang-jasa.md) — item harus ditandai "Aset Tetap" di sini agar bisa dialurkan lewat Registrasi Aset.
- [Registrasi Aset](registrasi-aset.md), [Posting ke GL](posting-aset-gl.md), [Hitung Penyusutan](hitung-penyusutan.md) — alur lengkap siklus hidup aset.
- [Laporan Fix Asset](laporan-fix-asset.md) — riwayat detail per aset (Fix Asset History) dan ringkasan seluruh aset per kategori (Fix Asset Summary).
