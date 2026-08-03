# Hitung Penyusutan

> Lokasi menu: **Transaksi → Aset Tetap → Hitung Penyusutan** — URL `/aset-tetap/penyusutan`

## Apa itu halaman ini?

Langkah terakhir dari alur aset tetap: menghitung dan memposting beban penyusutan bulanan ke Buku Besar untuk aset-aset yang sudah berstatus **Posted** (lihat [Posting ke GL](posting-aset-gl.md)). Aset yang masih berstatus Draft tidak akan muncul di sini.

## Cara memakai

1. Isi **Tanggal Mulai** dan **Tanggal Akhir** (default: awal–akhir bulan berjalan).
2. Klik **"Muat Data Aset"**.
3. Sistem menampilkan tabel penyusutan **per aset per bulan** dalam rentang tanggal tersebut — satu baris untuk tiap kombinasi aset × periode bulan yang belum diposting (dan sudah waktunya disusutkan).
4. Filter **Status** (dropdown): "Belum Disusutkan" (default), "Sudah Disusutkan", atau "Semua".
5. Centang baris yang mau diposting (atau pakai **"Pilih Semua"**).
6. *(Opsional)* Klik **"Preview (N)"** untuk melihat pratinjau jurnal — Debit Akun Beban Penyusutan, Kredit Akun Akumulasi Penyusutan, sejumlah nilai penyusutan bulan tersebut per aset. Modal preview menunjukkan indikator **"✓ Jurnal Balance"** atau **"✗ Jurnal Tidak Balance"**; tombol Post di dalam modal ini nonaktif kalau tidak balance.
7. Klik **"Post ke GL"** — konfirmasi jumlah periode yang diposting, lalu proses.

## Aturan penting: harus berurutan per bulan

Untuk satu aset, baris periode tertentu **hanya bisa dicentang kalau semua periode sebelumnya (untuk aset yang sama) sudah dicentang atau sudah diposting**. Ini mencegah lompat bulan (misalnya memposting Maret sebelum Februari). Meng-uncentang satu baris otomatis meng-uncentang semua periode setelahnya untuk aset itu.

## Perhitungan penyusutan

- **Garis Lurus**: (Harga Perolehan − Nilai Residu) ÷ Umur Ekonomis — nilai sama tiap bulan.
- **Saldo Menurun**: (Harga Perolehan − akumulasi penyusutan saat ini) ÷ Umur Ekonomis — nilai menurun tiap bulan mengikuti sisa nilai buku.
- Penyusutan otomatis dipangkas di bulan-bulan terakhir agar nilai buku tidak pernah turun di bawah Nilai Residu.
- Aset yang sudah habis masa penyusutannya (fully depreciated) tidak akan menghasilkan baris penyusutan baru.

## Validasi & pencegahan duplikasi

- Satu kombinasi aset + periode **tidak bisa diposting dua kali** — sistem menolak dengan pesan error kalau periode tersebut sudah pernah diposting untuk aset itu.
- Baris yang sudah **Sudah Disusutkan** ditampilkan tercentang & terkunci (tidak bisa diubah), dengan tampilan agak redup.

## Setelah posting

Setiap posting mencatat satu baris **riwayat penyusutan** (dengan status Posted) dan langsung membuat jurnal di Buku Besar. Nilai Buku dan Akumulasi Penyusutan yang tampil di [Master Aset Tetap](master-aset-tetap.md) dan [Laporan Fix Asset](laporan-fix-asset.md) selalu dihitung ulang secara real-time dari seluruh riwayat penyusutan yang sudah Posted — jadi begitu Anda posting di sini, nilai buku aset di halaman lain otomatis ikut ter-update.

## Terkait

- [Posting ke GL](posting-aset-gl.md) — langkah sebelum ini (aset harus berstatus Posted dulu).
- [Master Aset Tetap](master-aset-tetap.md) — melihat status & nilai buku terkini aset.
- [Laporan Fix Asset](laporan-fix-asset.md) — riwayat lengkap penyusutan per aset dan ringkasan seluruh aset.
