# Master Project (Pekerjaan)

> Lokasi menu: **Buku Besar → Pekerjaan** — URL `/master-data/project`

## Apa itu modul ini?

Daftar kode proyek/pekerjaan yang dipakai untuk menandai transaksi jurnal per proyek — berguna kalau perusahaan ingin melacak biaya/pendapatan per proyek tertentu. Dipakai sebagai pilihan "Project No" di [Input Transaksi](input-transaksi.md) dan [Jurnal Penyesuaian (AJE)](jurnal-penyesuaian-aje.md).

## Cara menambah project baru

1. Isi **Nama Project** (satu-satunya field yang perlu diisi manual — wajib).
2. **Kode Project** tidak bisa diisi manual — otomatis dibuat sistem dengan format `Pro/DDMMYY/XXX` (tanggal + nomor urut yang reset tiap bulan) begitu Anda klik **Simpan**.
3. Klik **Simpan**.

Setelah tersimpan, Nama Project bisa diedit lewat tombol **Edit**, tapi Kode Project tidak bisa diubah lagi.

## Validasi

- Nama Project wajib diisi.

## Mencari & mengelola

Kotak pencarian tunggal (cari di kode maupun nama). Aksi per baris: **Edit**, **Hapus** (dengan konfirmasi).

## Terkait

- [Input Transaksi](input-transaksi.md) — memilih Project No di sini untuk menandai transaksi kas/bank per proyek.
- [Jurnal Penyesuaian (AJE)](jurnal-penyesuaian-aje.md) — juga bisa menandai baris jurnal dengan Project No.
