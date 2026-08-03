# Laporan Arus Kas (Cash Flow Statement)

> Lokasi menu: **Laporan Keuangan → Arus Kas** — URL `/laporan/arus-kas`

## Apa itu laporan ini?

Laporan Arus Kas menunjukkan dari mana kas perusahaan berasal dan ke mana perginya selama satu periode, dengan **metode tidak langsung (indirect method)** — dimulai dari Laba Bersih, lalu disesuaikan dengan perubahan non-kas dan modal kerja. Laporan dibagi 3 aktivitas: **Operasi**, **Investasi**, dan **Pendanaan**.

## Cara memakai

1. Isi **Tanggal Mulai** dan **Tanggal Akhir** (default: 1 Januari s/d 31 Desember tahun berjalan; laporan otomatis tampil begitu halaman dibuka).
2. Klik **Tampilkan** untuk memuat ulang.

## Cara membaca laporan

- **ARUS KAS DARI AKTIVITAS OPERASI** — diawali Laba Bersih periode berjalan, ditambah penyesuaian non-kas (mis. beban penyusutan/amortisasi), dan perubahan modal kerja (piutang, persediaan, hutang, dll).
- **ARUS KAS DARI AKTIVITAS INVESTASI** — mis. pembelian/penjualan aset tetap.
- **ARUS KAS DARI AKTIVITAS PENDANAAN** — mis. setoran modal, pinjaman jangka panjang.
- **KENAIKAN / (PENURUNAN) BERSIH KAS** — jumlah dari tiga aktivitas di atas.
- **Saldo Kas Awal Periode** dan **SALDO KAS AKHIR PERIODE**.
- Baris validasi otomatis di bagian bawah: **"✓ Balance OK"** (hijau) menandakan perhitungan konsisten; **"⚠ Selisih: ..."** (merah) berarti ada selisih perhitungan yang perlu dicek — kalau ini muncul, periksa kelengkapan flag "Akun Kas & Bank" di [Master COA](master-coa.md).

Setiap bagian aktivitas bisa diklik untuk dibuka/tutup (expand/collapse).

## Cara meningkatkan akurasi laporan ini

Laporan Arus Kas dihitung **otomatis** dari data akun — sistem menebak klasifikasi setiap akun (Operasi/Investasi/Pendanaan) berdasarkan nama akunnya kalau belum diatur manual. Untuk hasil yang akurat, pastikan:

1. Setiap akun kas/bank sudah dicentang **"Akun Kas & Bank"** di kategori COA-nya (dipakai untuk menghitung Saldo Kas Awal/Akhir).
2. Untuk akun-akun yang klasifikasinya tidak lazim atau butuh dipastikan, atur manual lewat field **"Aktivitas Override"** dan **"Arah Arus Override"** di [Master COA](master-coa.md) per akun.

## Ekspor & cetak

- **Print** — mencetak langsung dari browser.
- **PDF** — mengunduh `laporan-arus-kas-{tanggal_mulai}-{tanggal_akhir}.pdf` (dibuat dari tangkapan layar laporan, jadi kalau laporan sangat panjang bisa termampatkan ke satu halaman — untuk laporan yang sangat detail, gunakan Export Excel).
- **Excel** — mengunduh file `.xlsx` dengan struktur yang sama seperti tampilan layar.

## Terkait

- [Master COA](master-coa.md) — flag Akun Kas & Bank dan override Aktivitas/Arah Arus Kas.
- [Laporan Laba Rugi](laporan-laba-rugi.md) — Laba Bersih periode adalah titik awal perhitungan Aktivitas Operasi.
