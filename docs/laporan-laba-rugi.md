# Laporan Laba Rugi (Income Statement)

> Lokasi menu: **Laporan Keuangan → Laba Rugi** — URL `/laporan/laba-rugi`

## Apa itu laporan ini?

Laporan Laba Rugi menampilkan seluruh pendapatan dan beban perusahaan dalam satu periode, dikelompokkan per kategori akun, ditutup dengan Laba Bersih (atau Rugi Bersih).

## Cara memakai

1. Isi **Tanggal Mulai** dan **Tanggal Akhir** (default: 1 Januari s/d 31 Desember tahun berjalan; laporan otomatis tampil dengan rentang ini saat halaman pertama kali dibuka).
2. Klik **Tampilkan** untuk memuat ulang dengan tanggal yang dipilih.

## Cara membaca laporan

- **PENDAPATAN** — daftar kategori pendapatan, masing-masing bisa diklik untuk membuka/tutup (expand/collapse) rincian per akun. Diakhiri baris **TOTAL PENDAPATAN**.
- **BEBAN** — sama seperti di atas, diakhiri baris **TOTAL BEBAN**.
- Baris terakhir: **LABA BERSIH** (hijau, kalau Pendapatan > Beban) atau **RUGI BERSIH** (merah, kalau sebaliknya).

> 📌 Catatan penting: Laporan ini **murni berdasarkan periode** — hanya menghitung transaksi Pendapatan/Beban yang terjadi di antara Tanggal Mulai dan Tanggal Akhir yang dipilih (tidak kumulatif sejak awal berdirinya perusahaan seperti [Neraca](neraca.md)). Kalau Anda mengganti Tanggal Mulai, Total Pendapatan/Beban akan ikut berubah.

## Ekspor & cetak

- **Print** — cetak langsung dari browser.
- **Export PDF** — mengunduh `LabaRugi.pdf` (format tabel A4 portrait, warna per section).
- **Export Excel** — mengunduh `LabaRugi.xlsx`.

## Terkait

- [Master COA](master-coa.md) — kategori akun tipe "Pendapatan" dan "Beban" yang menyusun laporan ini.
- [Neraca](neraca.md) — Laba Bersih dari laporan ini masuk sebagai "Laba Ditahan/Laba Berjalan" di Neraca.
- [Perubahan Modal](laporan-perubahan-modal.md) — Laba/Rugi Bersih periode berjalan juga muncul di sini sebagai komponen penambahan/pengurangan modal.
