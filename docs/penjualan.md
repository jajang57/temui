# Penjualan (AR Invoice)

> Lokasi menu: **Transaksi → Penjualan** — URL `/transaksi/penjualan`

## Apa itu modul ini?

Modul Penjualan mencatat tagihan penjualan ke pelanggan (Sales/AR Invoice) — mirip struktur dengan [Pembelian](pembelian.md) tapi untuk sisi piutang. Bisa berisi banyak barang/jasa sekaligus, dengan diskon, pajak, ongkos kirim (freight), dan materai. Setiap invoice yang disimpan otomatis membuat jurnal ke Buku Besar (Piutang Usaha, akun Penjualan per item, PPN Keluaran, dll).

## Cara mencatat penjualan baru

1. Klik **Tampilkan Form** (kalau tersembunyi).
2. Isi header:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Customer** | Ya | Pilih dari [Master Pembeli](master-pembeli.md). |
   | **Invoice No.** | Otomatis | Default `AUTO`, nomor final dibuat sistem saat disimpan. |
   | **Tanggal** | Tidak | Default hari ini. |
   | **Due Date** | Tidak | Jatuh tempo pembayaran. |
   | **Gudang** | Tidak | Memilih gudang mengaktifkan validasi stok untuk item barang di baris detail. |
   | **Departement** | Tidak | |

3. Tambah item lewat modal **"Pilih Item"** (checklist dari [Barang & Jasa](master-barang-jasa.md), bisa difilter, tampil sisa stok per item), atau isi baris manual lewat dropdown **Kode Item** per baris (harga & satuan otomatis terisi).
4. Lengkapi tiap baris: **Qty**, **Price**, **Discount %**/**Discount Amount**, **Pajak** (multi-pilih dari [Master Pajak](master-pajak.md)), **Gudang** per baris. **DPP** dan **Total** dihitung otomatis.
5. Isi **Freight** dan **Stamp** di ringkasan bawah bila ada, plus **Nomor eFaktur** dan **Notes** kalau perlu.
6. Klik **Simpan**.

## Validasi stok saat input qty

Untuk item bertipe **Barang** (bukan Jasa), qty yang diisi tidak boleh melebihi stok yang tersedia di gudang terpilih (stok gudang dikurangi qty yang sudah dipakai di baris lain pada invoice yang sama). Kalau melebihi, sistem otomatis memotong qty ke sisa stok yang tersedia dan menampilkan peringatan.

## Perhitungan pajak per baris

- Pajak PPN **menambah** Total baris.
- Pajak bertipe **PPh** (termasuk PPh Final) justru **mengurangi** Total baris (dicatat sebagai potongan, bukan tambahan) — ini konsisten dengan sifat PPh sebagai pajak yang dipotong pembeli.
- Baris pajak yang tampil di ringkasan (Sub Total, dst) mengikuti urutan **"Urutan"** yang diset di Master Pajak.

## Validasi sebelum simpan

- **Customer wajib dipilih** ("Harus pilih dulu customer!").
- Hanya baris dengan **Kode Item terisi dan Qty > 0** yang ikut disimpan.
- Kalau ada akun COA yang belum diset di master data (akun Piutang Usaha di Master Mata Uang, akun Penjualan di Master Barang/Jasa, akun pajak di Master Pajak), sistem menolak simpan dengan pesan yang menyebutkan akun apa yang bermasalah.

## Mengedit dan menghapus

- Klik **Edit** pada baris "Daftar Transaksi" untuk memuat ulang data ke form (termasuk validasi stok ulang, kali ini memperhitungkan qty transaksi ini sendiri supaya tidak salah terblokir).
- Klik **Hapus** untuk menghapus invoice beserta jurnal GL terkait (perlu konfirmasi).
- Klik ikon mata pada baris untuk melihat jurnal (GL) hasil posting invoice tersebut.
- ⚠️ Modul ini **tidak punya tombol Export/Print** — hanya simpan, edit, hapus, dan lihat jurnal.

## Daftar Transaksi Penjualan (tabel bawah)

- Filter **Periode** (tanggal awal s/d akhir) dan **Filter Customer**.
- Kotak pencarian: No. Invoice, nama Customer, atau Total.
- Kolom bisa di-sort: Invoice No., Tanggal, Customer, Total, Status.
- Pagination dengan pilihan 10/20/50/100 baris per halaman.

## Yang perlu disiapkan di master data sebelum mulai memakai modul ini

1. **Master Pembeli** — data customer sudah terdaftar, dengan **Mata Uang** terisi (dicocokkan berdasarkan **kode** mata uang, bukan ID — beda dengan Pemasok di Pembelian yang pakai ID).
2. **Master Mata Uang** (untuk mata uang tiap customer) — akun Piutang Usaha (label "Akun Penjualan" di form Mata Uang), Diskon Jual, Biaya Lain-lain (freight), Biaya Materai sudah diset.
3. **Master Barang/Jasa** — item bertanda "Dijual" punya Akun Penjualan (dan Akun HPP/Retur/Diskon sesuai kombinasi Dijual/Dibeli-nya) yang sudah diset.
4. **Master Pajak** — akun "Akun Pajak Penjualan" sudah diset kalau item dikenai pajak.
5. **Master Gudang** (opsional, kalau ingin validasi stok otomatis).

## Terkait

- [Pembelian](pembelian.md) — modul dengan struktur & alur yang sangat mirip, untuk sisi hutang.
- [Master Pembeli](master-pembeli.md), [Master Mata Uang](master-mata-uang.md), [Master Pajak](master-pajak.md), [Master Barang & Jasa](master-barang-jasa.md), [Master Gudang](master-gudang.md) — master data pendukung.
- [Master Persediaan](master-persediaan.md) — penjualan barang otomatis tercatat sebagai "Qty Keluar" di laporan stok.
