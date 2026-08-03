# Buku Besar Pembantu (Sub-Ledger)

> Lokasi menu: **Buku Besar → Buku Besar Pembantu** — URL `/laporan/buku-besar-pembantu`

## Apa itu laporan ini?

Kalau [Buku Besar Utama](buku-besar.md) menampilkan mutasi **per akun COA**, Buku Besar Pembantu menampilkan mutasi **per rekanan** (pelanggan atau pemasok tertentu) — cocok dipakai untuk mengecek riwayat piutang satu pelanggan atau hutang satu pemasok secara spesifik.

## Cara memakai

1. Pilih **Tipe**: "Piutang (Pelanggan)" atau "Hutang (Pemasok)".
2. Pilih pelanggan/pemasok spesifik dari dropdown **"Pilih Pelanggan"** / **"Pilih Pemasok"** — field ini wajib diisi.
3. *(Opsional)* **Filter Akun** — batasi hanya ke satu akun COA tertentu, kosongkan untuk melihat semua akun rekanan tersebut.
4. Isi **Mulai** dan **Sampai** (default: awal bulan berjalan s/d hari ini).
5. Klik **Tampilkan**.

Kalau belum memilih pelanggan/pemasok, muncul pesan "Silakan pilih sub-ledger (Pelanggan/Pemasok) terlebih dahulu."

## Cara membaca laporan

Baris pertama **"SALDO AWAL"** menampilkan saldo pembukaan, lalu daftar transaksi dengan kolom Tanggal, Nomor, Deskripsi, Debit, Kredit, dan **Saldo** (berjalan).

## Ekspor & cetak

- **Print** — cetak langsung dari browser dengan layout resmi (ada kop, nomor kontak, dan blok tanda tangan Direktur Utama/Bagian Keuangan).
- **PDF** — mengunduh `BukuBesarPembantu.pdf`.
- ⚠️ Tidak ada tombol Export Excel di laporan ini (berbeda dengan Buku Besar Utama yang punya ketiganya).

## Terkait

- [Buku Besar Utama](buku-besar.md) — versi per akun COA (tanpa filter rekanan).
- [Master Pemasok](master-pemasok.md), [Master Pembeli](master-pembeli.md) — sumber daftar rekanan yang bisa dipilih.
