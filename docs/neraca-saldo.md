# Neraca Saldo (Trial Balance)

> Lokasi menu: **Buku Besar → Neraca Saldo** — URL `/laporan/trial-balance`

## Apa itu laporan ini?

Neraca Saldo menampilkan saldo semua akun COA per bulan dalam satu tahun — Saldo Awal, lalu Debit/Kredit/Mutasi/Saldo untuk tiap bulan dalam rentang yang dipilih. Laporan ini dipakai untuk memverifikasi bahwa pembukuan sudah seimbang (total debit = total kredit) sebelum menyusun laporan keuangan lain.

## Cara memakai

1. Pilih **Tahun**.
2. Pilih **Bulan Awal** dan **Bulan Akhir** (bulan akhir tidak bisa lebih awal dari bulan awal).
3. Data otomatis dimuat ulang setiap kali salah satu filter diubah — tidak ada tombol "Tampilkan" terpisah.

## Cara membaca laporan

Setiap baris adalah satu akun COA (`kode - nama`), dengan kolom:
- **Saldo Awal** — saldo akun sebelum Bulan Awal yang dipilih (kumulatif sejak awal, sama seperti [Neraca](neraca.md)).
- Untuk tiap bulan dalam rentang: **Debit**, **Kredit**, **Mutasi**, **Saldo**.
  - **Mutasi** dihitung berbeda tergantung tipe akun: untuk akun Kewajiban/Modal/Pendapatan = Kredit − Debit; untuk akun Aset/Beban = Debit − Kredit.
  - **Saldo** = saldo awal + akumulasi mutasi dari Bulan Awal sampai bulan tersebut.

Kolom bisa di-drag untuk mengubah lebar tampilan.

## Catatan

⚠️ Laporan ini **tidak punya tombol Print, Export PDF, atau Export Excel** — hanya tampilan tabel di layar.

## Terkait

- [Buku Besar Utama](buku-besar.md) — rincian transaksi per akun (Neraca Saldo hanya menampilkan saldo, bukan detail transaksinya).
- [Master COA](master-coa.md) — sumber tipe akun yang menentukan arah perhitungan Mutasi.
- [Neraca](neraca.md) — laporan posisi keuangan yang saldo Asetnya juga bersifat kumulatif seperti di sini.
