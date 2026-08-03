# Master Gudang (Warehouse)

> Lokasi menu: **Persediaan → Gudang** — URL `/master-data/gudang`

## Apa itu modul ini?

Master data lokasi gudang/warehouse — dipakai sebagai dimensi pelacakan lokasi stok di [Pembelian](pembelian.md), [Penjualan](penjualan.md), [Penyesuaian Persediaan](penyesuaian-persediaan.md), dan filter laporan [Master Persediaan](master-persediaan.md).

## Cara menambah gudang baru

| Field | Wajib | Keterangan |
|---|---|---|
| Kode Gudang | Tidak | Kosongkan untuk auto-generate (`GDG001`, ...). |
| Nama Gudang | Ya | |
| **Gudang Group** | Ya | Pilih dari daftar, atau **"+ Tambah Group"** untuk buat langsung dari sini. |
| **Departement** | Ya | Pilih dari daftar, atau **"+ Tambah Departement"** untuk buat langsung dari sini. |
| Deskripsi | Tidak | |
| Alamat | Ya | |
| Penanggung Jawab | Ya | |

Klik **Simpan**.

## Validasi

- Nama, Gudang Group, Departement, Alamat, dan Penanggung Jawab wajib diisi.

## Mencari & mengelola

Filter per kolom (Kode, Nama, Group, Departement, Alamat, Penanggung Jawab). Aksi per baris: **Edit**, **Hapus** — ⚠️ hapus di sini **langsung terjadi tanpa dialog konfirmasi**, beda dengan kebanyakan modul lain.

## Terkait

- [Pembelian](pembelian.md), [Penjualan](penjualan.md) — Gudang dipilih per baris item untuk menentukan lokasi stok.
- [Penyesuaian Persediaan](penyesuaian-persediaan.md) — wajib memilih Gudang untuk stock opname.
- [Master Persediaan](master-persediaan.md) — laporan stok bisa difilter per Gudang.
