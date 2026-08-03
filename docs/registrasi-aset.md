# Registrasi Aset

> Lokasi menu: **Transaksi → Aset Tetap → Registrasi Aset** — URL `/aset-tetap/registrasi`

## Apa itu halaman ini?

Halaman ini adalah langkah pertama dari alur "aset tetap yang berasal dari pembelian": mendaftarkan barang hasil transaksi [Pembelian](pembelian.md) yang ditandai sebagai Aset Tetap menjadi record resmi di [Master Aset Tetap](master-aset-tetap.md), berstatus **Draft**.

> ⚠️ Prasyarat: item yang mau didaftarkan harus **sudah ditandai "Aset Tetap"** di [Master Barang & Jasa](master-barang-jasa.md) (checkbox "🏢 Aset Tetap") dan sudah pernah dibeli lewat modul Pembelian. Kalau item belum ditandai begitu, dia tidak akan muncul di daftar halaman ini sama sekali.

## Cara memakai

Halaman menampilkan dua tabel:

1. **"Belum Didaftarkan"** — daftar barang dari Pembelian yang ditandai Aset Tetap tapi belum punya record di Master Aset Tetap. Kolom: No. AP Invoice, Tanggal, Pemasok, Kode Item, Nama Item, Qty, Harga, Total.
2. **"Sudah Didaftarkan"** — barang yang sudah pernah diregistrasi (badge "✓ Terdaftar").

Untuk mendaftarkan aset, klik tombol **"📋 Daftar"** pada baris di tabel "Belum Didaftarkan". Modal **"Daftar Aset Tetap"** terbuka dengan sebagian field sudah terisi otomatis dari data pembelian:

| Field | Wajib | Terisi otomatis dari |
|---|---|---|
| **Kode Aset** | Ya | Auto-generate (bisa diedit manual) |
| **Nama Aset** | Ya | Nama item pembelian |
| **Kategori** | Ya | Kosong, harus dipilih (Kendaraan/Bangunan/Peralatan/Mesin/Furniture/Elektronik/Lainnya) |
| **Tanggal Perolehan** | Tidak | Tanggal pembelian |
| **Harga Perolehan** | Tidak | Nilai (Amount) baris pembelian |
| **Umur Ekonomis (bulan)** | Tidak | Default 12 — sesuaikan sesuai kebijakan aset |
| **Nilai Residu** | Tidak | Default 0 |
| **Metode Penyusutan** | Tidak | Default "Garis Lurus" |
| **Tanggal Mulai Penyusutan** | Tidak | Kosong — **isi ini**, kalau dibiarkan kosong sistem nanti memakai Tanggal Perolehan sebagai gantinya |
| **Akun Aset Tetap** | Ya | Kosong, pilih dari Master COA |
| **Akun Akumulasi Penyusutan** | Ya | Kosong, pilih dari Master COA |
| **Akun Beban Penyusutan** | Ya | Kosong, pilih dari Master COA |
| **Keterangan** | Tidak | "Aset dari pembelian {nomor AP Invoice}" |

Klik **"Simpan Aset"** untuk menyimpan (atau **"Batal"** untuk menutup modal tanpa simpan).

## Validasi

- Kode Aset, Nama Aset, dan Kategori wajib diisi.
- Ketiga akun COA (Akun Aset Tetap, Akun Akumulasi Penyusutan, Akun Beban Penyusutan) wajib dipilih semua.
- Kode Aset tidak boleh duplikat dengan aset yang sudah ada.

## Setelah didaftarkan

Aset baru tersimpan dengan status **Draft** di Master Aset Tetap — belum ada jurnal apa pun yang dibuat. Langkah selanjutnya adalah memposting aset ini ke Buku Besar lewat [Posting ke GL](posting-aset-gl.md).

## Terkait

- [Master Barang & Jasa](master-barang-jasa.md) — tempat menandai item sebagai Aset Tetap.
- [Pembelian](pembelian.md) — sumber data transaksi pembelian aset.
- [Master Aset Tetap](master-aset-tetap.md) — tempat aset yang sudah terdaftar dikelola lebih lanjut.
- [Posting ke GL](posting-aset-gl.md) — langkah berikutnya setelah registrasi.
