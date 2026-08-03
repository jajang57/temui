# Jurnal Umum (General Ledger Viewer)

> Lokasi menu: **Jurnal → Jurnal Umum** — URL `/transaksi/gl`

## Apa itu halaman ini?

⚠️ **Catatan penting:** Berbeda dari namanya, halaman ini **bukan tempat input jurnal manual** — ini adalah daftar/riwayat **seluruh entri jurnal (General Ledger)** yang sudah tercatat di sistem, dari mana pun sumbernya: [Input Transaksi](input-transaksi.md), [Pembelian](pembelian.md), [Penjualan](penjualan.md), penyusutan aset ([Hitung Penyusutan](hitung-penyusutan.md)), [Penyesuaian Persediaan](penyesuaian-persediaan.md), saldo awal Master COA, dan [Jurnal Penyesuaian (AJE)](jurnal-penyesuaian-aje.md).

Kalau Anda ingin **membuat** jurnal manual, gunakan halaman [Jurnal Penyesuaian (AJE)](jurnal-penyesuaian-aje.md).

## Cara memakai

Halaman ini murni untuk menelusuri & memfilter data:

- **Filter per kolom**: Tanggal (pilih beberapa tanggal), Akun Transaksi (multi-pilih akun COA), Deskripsi (cari teks), Nomor Jurnal (cari teks), Nomor Transaksi (cari teks), Project No, Project Name.
- Filter aktif ditampilkan sebagai "chip" yang bisa dihapus satu-satu, atau klik **"RESET FILTER"** untuk menghapus semuanya sekaligus.
- Klik header kolom untuk mengurutkan (sort) data.

## Kolom yang ditampilkan

No, Tanggal, Akun Transaksi (format `(kode) nama`), Deskripsi, Debit, Kredit, Nomor Jurnal, Nomor Transaksi, Project No, Project Name.

## Ekspor & cetak

- **Print** — mencetak tabel yang sedang tampil.
- **Excel** — mengunduh `TransaksiGL.xlsx`.

## Terkait

- [Jurnal Penyesuaian (AJE)](jurnal-penyesuaian-aje.md) — tempat sebenarnya untuk membuat jurnal manual/penyesuaian.
- [Buku Besar Utama](buku-besar.md) — laporan mutasi per akun COA (mirip tapi terstruktur per akun dengan saldo awal/akhir).
- [Buku Besar Pembantu](buku-besar-pembantu.md) — mutasi per rekanan (pelanggan/pemasok).
