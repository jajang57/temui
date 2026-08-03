# Buku Besar Utama (General Ledger)

> Lokasi menu: **Buku Besar → Buku Besar Utama** — URL `/laporan/buku-besar`

## Apa itu laporan ini?

Buku Besar menampilkan rincian seluruh mutasi (transaksi) pada satu atau beberapa akun COA dalam rentang tanggal tertentu, lengkap dengan saldo awal, daftar transaksi, sub total, dan saldo akhir per akun. Ini adalah laporan paling detail untuk menelusuri "kemana saja uang/nilai bergerak" di satu akun.

## Cara memakai

1. Pilih satu atau beberapa akun di kotak **"Pilih Akun COA (bisa lebih dari satu)..."** — bisa mengetik untuk mencari.
2. Isi **Tanggal Awal** dan **Tanggal Akhir**.
3. Klik **Tampilkan**.

Kalau belum memilih akun, sistem menampilkan pesan "Pilih minimal satu akun COA terlebih dahulu." Kalau tanggal belum lengkap, muncul pesan "Tanggal awal dan akhir harus diisi."

## Cara membaca laporan

Untuk setiap akun yang dipilih, laporan menampilkan:

1. Header akun (`kode - nama`).
2. Baris **OB (Opening Balance / Saldo Awal)**.
3. Daftar transaksi dengan kolom: **Tipe** (jenis transaksi, dikenali dari nomor transaksi — mis. Cash Bank Out, Cash Bank In, AP Invoice, Sales Invoice, Journal), **Nomor Transaksi**, **Tanggal**, **Deskripsi**, **Debit**, **Kredit**, **Saldo** (saldo berjalan).
4. Baris **Sub Total** (total debit & kredit akun tersebut dalam periode).
5. Baris **Closing Balance** (saldo awal + sub total debit − sub total kredit).

> ⚠️ Penting: **Saldo Awal** yang ditampilkan bukan hanya dari field "Saldo Awal" di Master COA, tapi juga memperhitungkan semua transaksi sebelum Tanggal Awal yang dipilih. Jadi kalau Anda memilih Tanggal Awal yang jauh di tengah tahun berjalan, Saldo Awal yang muncul sudah termasuk seluruh histori transaksi sebelum tanggal tersebut — bukan saldo Rp 0.

## Ekspor & cetak

- **Print Preview** — mencetak langsung dari browser dengan layout khusus cetak (A4 landscape).
- **Export PDF** — mengunduh `BukuBesarUtama.pdf` (satu tabel per akun, format tabel rapi, format A4 landscape).
- **Export Excel** — mengunduh `BukuBesarUtama.xlsx`.

## Terkait

- [Input Transaksi](input-transaksi.md) — sumber utama transaksi kas/bank yang muncul di sini.
- [Pembelian](pembelian.md) — transaksi AP Invoice juga muncul di sini sebagai baris "AP Invoice".
- [Master COA](master-coa.md) — daftar akun yang bisa dipilih untuk laporan ini.
