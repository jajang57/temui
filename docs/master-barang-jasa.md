# Master Barang & Jasa (Item Master)

> Lokasi menu: **Persediaan → Barang Dan Jasa** — URL `/master-data/barang-jasa`

## Apa itu modul ini?

Katalog barang dan jasa perusahaan — nama, harga default, dan pemetaan akun GL untuk seluruh transaksi yang melibatkan item (Pembelian, Penjualan, Penyesuaian Persediaan). Ini adalah salah satu master data paling sering dirujuk modul lain.

## Cara menambah item baru

**Tab Umum:**
| Field | Wajib | Keterangan |
|---|---|---|
| **Jenis** | Ya | **Barang** atau **Jasa** — menentukan field apa saja yang muncul selanjutnya. |
| Kode | Tidak | Kosongkan untuk auto-generate (`BRG001` untuk barang, `JSA001` untuk jasa). |
| Nama | Ya | |
| Kelompok Item | Tidak | Pilih dari daftar, atau **"+ Tambah Kelompok Item"** untuk buat baru langsung dari sini. |
| Kategori | Tidak | Sama seperti Kelompok Item, ada opsi tambah baru langsung. |
| Satuan | Tidak (hanya untuk Barang) | Contoh: pcs, kg, liter. |
| **Harga Beli** | Tidak | Harga default saat item dipilih di Pembelian; juga dipakai sebagai *standard cost* di [Penyesuaian Persediaan](penyesuaian-persediaan.md). |
| **Harga Jual** | Tidak | Harga default saat item dipilih di Penjualan. |
| Stok Minimal | Tidak (hanya untuk Barang) | |
| Deskripsi | Tidak | |
| **Dijual** (checkbox) | — | Default aktif. Menentukan item ini muncul di pilihan Penjualan atau tidak. |
| **Dibeli** (checkbox) | — | Default aktif. Menentukan item ini muncul di pilihan Pembelian atau tidak. |
| Aktif (checkbox) | — | Item nonaktif tidak muncul di dropdown transaksi manapun. |
| **🏢 Aset Tetap** (checkbox, khusus Barang) | — | Centang kalau item ini adalah aset tetap (mis. mesin, kendaraan) — akan muncul di [Registrasi Aset](registrasi-aset.md) setelah dibeli. |
| Gambar Produk | Tidak | Upload gambar (maks 5MB). |

**Tab Akun GL** — field yang tampil berubah tergantung kombinasi Jenis/Dijual/Dibeli:

| Kombinasi | Akun yang wajib diisi |
|---|---|
| Barang, Dijual + Dibeli | Akun Persediaan, Penjualan, Retur Penjualan, Diskon Penjualan, HPP, Retur Pembelian, Diskon Khusus, Pembelian (8 akun) |
| Jasa | Akun Penjualan, Retur Penjualan, Diskon Penjualan, HPP, Diskon Khusus (tanpa Persediaan/Pembelian) |
| Hanya Dijual | Akun Persediaan, Penjualan, Retur Penjualan, Diskon Penjualan, HPP, Diskon Khusus |
| Hanya Dibeli | Akun Persediaan, HPP, **Akun Pembelian** |

Semua field akun wajib diisi sesuai kombinasi di atas — sistem menolak simpan dengan pesan `Field Akun {Nama} wajib diisi!` kalau ada yang kosong.

## Validasi

- Kode, Nama, Jenis wajib diisi. Kode harus unik.
- Semua field Akun GL yang relevan (sesuai tabel di atas) wajib diisi.

## ⚠️ Menghapus item

Hapus item di modul ini bersifat **permanen (hard delete)** dan sistem **tidak mengecek** apakah item tersebut masih dipakai di transaksi Pembelian/Penjualan yang sudah ada. Hindari menghapus item yang sudah pernah dipakai bertransaksi — sebaiknya nonaktifkan saja (uncentang "Aktif") daripada dihapus.

## Mencari & mengelola

Pencarian global + filter per kolom (Kode, Nama, Jenis, Kelompok Item, Kategori). Aksi per baris: **Edit**, **Hapus** (dengan konfirmasi).

## Terkait

- [Pembelian](pembelian.md), [Penjualan](penjualan.md) — memilih item dari sini di baris detail transaksi.
- [Penyesuaian Persediaan](penyesuaian-persediaan.md) — item wajib punya Akun Persediaan terisi agar bisa disesuaikan stoknya.
- [Master Persediaan](master-persediaan.md) — laporan stok berdasarkan item di sini.
- [Registrasi Aset](registrasi-aset.md) — item bertanda "Aset Tetap" muncul di sini setelah dibeli.
