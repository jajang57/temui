# Pembelian (AP Invoice)

> Lokasi menu: **Transaksi → Pembelian** — URL `/transaksi/pembelian`

## Apa itu modul ini?

Modul Pembelian mencatat tagihan pembelian dari pemasok (Purchase/AP Invoice) — bisa berisi banyak barang/jasa sekaligus, lengkap dengan diskon, pajak, ongkos kirim (freight), dan materai. Setiap invoice yang disimpan otomatis membuat jurnal ke Buku Besar (Hutang Usaha, akun Pembelian per item, PPN Masukan, dll) — Anda tidak perlu membuat jurnal manual.

## Cara mencatat pembelian baru

1. Klik **Tampilkan Form** (kalau form sedang tersembunyi).
2. Isi bagian header:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Supplier** | Ya | Pilih dari daftar Master Pemasok. |
   | **AP No.** | Otomatis | Default `AUTO`, nomor final dibuat backend (format `APINV-YYYYMMDD-NNN`). |
   | **Tanggal** | Tidak | Default hari ini. |
   | **Delivery Date** | Tidak | Tanggal barang diterima. |
   | **Gudang** | Tidak | Gudang tujuan penerimaan barang. |
   | **Departement** | Tidak | Departemen terkait. |

3. Tambahkan item: klik **+ Tambah Item** → pilih satu atau beberapa barang/jasa dari modal **"Pilih Item"** (bisa difilter dengan kotak pencarian kode/deskripsi) → klik **Add**.
4. Untuk tiap baris item di tabel detail, lengkapi:

   | Kolom | Keterangan |
   |---|---|
   | **Kode Item** | Memilih item otomatis mengisi Nama Item, Unit, dan Price dari data Master Barang/Jasa. |
   | **Qty** | Jumlah barang/jasa. |
   | **Price** | Harga satuan (otomatis terisi, bisa diubah). |
   | **Discount %** | Mengisi ini otomatis menghitung Discount Amount Item; sebaliknya juga berlaku. |
   | **Pajak** | Bisa pilih lebih dari satu jenis pajak per item (mis. PPN + PPh). |
   | **Gudang** | Gudang khusus untuk item ini (bisa beda dari gudang header). |
   | **DPP** dan **Total** | Dihitung otomatis (DPP = Qty×Price − Diskon; Total = DPP + total pajak item). |

   Hapus baris item dengan tombol **✕** di kolom Action.

5. Di bagian ringkasan kanan bawah, lengkapi **Freight** (ongkos kirim) dan **Stamp** (materai) bila ada — **Sub Total** dan baris pajak per jenis dihitung otomatis, begitu juga **Total apinvoice**.
6. *(Opsional)* Isi **Nomor Ref Supplier** dan **Notes**.
7. Klik **Simpan**.

## Validasi sebelum simpan

- **Supplier wajib dipilih.**
- **Minimal satu item** harus diisi (Kode Item terisi dan Qty > 0).
- Kalau ada akun COA yang belum diset di master data (mis. akun Hutang Usaha di Master Mata Uang, akun Pembelian di Master Barang/Jasa, akun Pajak, akun Freight/Materai/Diskon), sistem akan menolak simpan dan menampilkan pesan error yang jelas menyebutkan akun apa yang belum diset — perbaiki dulu di master data terkait sebelum mencoba simpan ulang.

## Mengedit dan menghapus

- Klik **Edit** pada baris di tabel "Daftar Transaksi Pembelian" untuk memuat ulang data (header + semua item) ke form.
- Klik **Hapus** untuk menghapus invoice (perlu konfirmasi) — jurnal GL terkait ikut terhapus.
- Klik ikon mata (👁) pada baris untuk melihat jurnal (GL) yang dihasilkan dari invoice tersebut.
- Tombol **Kosongkan Data** mengosongkan seluruh form dan daftar item (perlu konfirmasi).

## Daftar Transaksi Pembelian (tabel bawah)

- Filter **Periode** (tanggal awal s/d akhir) dan **Filter Supplier** (bisa dicari).
- Kotak pencarian: cari berdasarkan No. AP Invoice, nama Supplier, atau Total.
- Tombol **Reset Filter** mengosongkan pencarian.
- Kolom bisa di-sort: No. AP Invoice, Tanggal, Supplier, Total, Status.
- Pagination dengan pilihan 10/20/50/100 baris per halaman.

## Yang perlu disiapkan di master data sebelum mulai memakai modul ini

Karena jurnal dibuat otomatis, pastikan hal berikut sudah lengkap:
1. **[Master Pemasok](master-pemasok.md)** — data supplier sudah terdaftar, dengan Mata Uang terisi.
2. **[Master Mata Uang](master-mata-uang.md)** (untuk mata uang tiap supplier) — akun Hutang Usaha (label "Akun Pembelian"), Diskon Beli, Biaya Lain-lain, Materai sudah diset.
3. **[Master Barang & Jasa](master-barang-jasa.md)** — setiap item punya akun Pembelian yang sudah diset.
4. **[Master Pajak](master-pajak.md)** — akun pajak (PPN/PPh) sudah diset kalau item dikenai pajak.
5. **[Master Gudang](master-gudang.md)** dan Master Departement (opsional, kalau ingin melacak per gudang/departemen).

## Terkait

- [Master COA](master-coa.md) — akun-akun tujuan posting jurnal otomatis.
- [Buku Besar](buku-besar.md) — melihat hasil jurnal dari setiap invoice pembelian.
- [Penjualan](penjualan.md) — modul dengan struktur & alur yang sangat mirip, untuk sisi piutang.
- [Master Persediaan](master-persediaan.md) — pembelian barang otomatis tercatat sebagai "Qty Masuk" di laporan stok.
