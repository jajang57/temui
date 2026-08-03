# Laporan Perubahan Modal (Statement of Changes in Equity)

> Lokasi menu: **Laporan Keuangan → Perubahan Modal** — URL `/laporan/perubahan-modal`

## Apa itu laporan ini?

Laporan ini menunjukkan pergerakan modal/ekuitas perusahaan selama satu periode: dari modal awal, ditambah/dikurangi berbagai komponen (laba/rugi periode berjalan, setoran modal, prive/penarikan), sampai modal akhir periode.

## Cara memakai

1. Isi **Tanggal Mulai** dan **Tanggal Akhir** (default: 1 Januari s/d 31 Desember tahun berjalan; otomatis tampil saat halaman dibuka).
2. Klik **Tampilkan**.

## Cara membaca laporan

- **Modal Awal Periode** — total saldo ekuitas sampai sebelum Tanggal Mulai.
- **Penambahan:** — daftar item penambah modal, misalnya "Laba Bersih Periode Berjalan" atau setoran modal baru. Kalau tidak ada, tampil "Tidak ada penambahan".
- **Pengurangan:** — daftar item pengurang modal, misalnya "Rugi Bersih Periode Berjalan" atau penarikan/prive. Kalau tidak ada, tampil "Tidak ada pengurangan".
- **MODAL AKHIR PERIODE** (baris hijau) — Modal Awal + total Penambahan − total Pengurangan.

> 📌 Catatan: akun yang namanya mengandung kata "prive" atau "drawings", atau akun ekuitas yang saldonya turun selama periode, otomatis masuk ke bagian Pengurangan. Kalau akun Prive/penarikan modal tidak ditutup (di-nol-kan) di akhir tahun, saldo Prive tahun sebelumnya bisa memengaruhi angka Modal Awal tahun berikutnya — koordinasikan dengan proses tutup buku tahunan bila perlu.

## Ekspor & cetak

- **Print** — mencetak langsung dari browser.
- **PDF** — mengunduh `laporan-perubahan-modal-{tanggal_mulai}-{tanggal_akhir}.pdf`.
- **Excel** — mengunduh file `.xlsx` dengan struktur yang sama seperti tampilan layar.

Semua tombol ekspor/cetak nonaktif sampai laporan pertama kali dimuat (klik Tampilkan).

## Terkait

- [Laporan Laba Rugi](laporan-laba-rugi.md) — Laba/Rugi Bersih periode menjadi komponen utama Penambahan/Pengurangan modal.
- [Neraca](neraca.md) — Modal Akhir Periode di sini seharusnya sejalan dengan Total Ekuitas di Neraca pada tanggal yang sama.
