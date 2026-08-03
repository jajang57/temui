# Master Mata Uang (Currency)

> Lokasi menu: **Buku Besar → Mata Uang** — URL `/master-data/mata-uang`

## Apa itu modul ini?

Modul ini mendefinisikan setiap mata uang yang dipakai perusahaan bertransaksi (mis. IDR, USD), **dan yang lebih penting**: satu set akun COA default yang dipakai [Pembelian](pembelian.md) dan [Penjualan](penjualan.md) untuk memposting jurnal otomatis. Konfigurasi ini **per mata uang**, bukan per pemasok/pembeli — semua pemasok atau pembeli yang memakai mata uang yang sama, memakai akun GL yang sama juga.

> 📌 Ini salah satu master data paling krusial di aplikasi — kalau Pembelian atau Penjualan gagal disimpan dengan pesan error "akun belum diset", penyebabnya hampir selalu ada di sini.

## Cara menambah mata uang baru

**Tab Umum:**
| Field | Wajib | Keterangan |
|---|---|---|
| Kode Mata Uang | Ya | Contoh: `IDR`, `USD`. Harus unik. |
| Nama Mata Uang | Ya | Contoh: "Rupiah". |
| Simbol Mata Uang | Ya | Contoh: "Rp", "$". |
| Kurs | Ya | Harus lebih besar dari 0. |
| Aktif | Tidak | Default dicentang. |

**Tab Akun GL** — pilih akun COA untuk masing-masing keperluan berikut (semua react-select, cari & pilih dari [Master COA](master-coa.md)):

| Label di form | Dipakai untuk |
|---|---|
| **Akun Pembelian** | Akun **Hutang Usaha** (Payable) — dipakai [Pembelian](pembelian.md). ⚠️ Nama labelnya "Akun Pembelian" tapi sebenarnya ini akun Hutang, bukan akun beban pembelian. |
| **Akun Penjualan** | Akun **Piutang Usaha** (Receivable) — dipakai [Penjualan](penjualan.md). ⚠️ Sama, nama label agak menyesatkan — ini akun Piutang. |
| Akun Uang Muka Pembelian | Uang muka pembelian |
| Akun Uang Muka Penjualan | Uang muka penjualan |
| Akun Diskon Penjualan | Diskon di invoice Penjualan |
| Akun Diskon Pembelian | Diskon di invoice Pembelian |
| Akun Pembulatan | Pembulatan nilai transaksi |
| Akun Keuntungan Direalisasi / Belum Direalisasi | Selisih kurs (untuk mata uang asing) |
| Akun Pembelian Hutang Jatuh Tempo / Penjualan Piutang Jatuh Tempo | Aging hutang/piutang |
| **Akun Biaya Lain-lain** | Akun **Freight/ongkos kirim** — wajib diisi kalau ada transaksi dengan nilai Freight > 0 |
| Akun Biaya Materai | Akun materai |

## Field minimal yang wajib diisi

Supaya Pembelian dan Penjualan bisa berjalan normal, minimal isi:
- **Akun Pembelian** (= Hutang Usaha) — kalau mata uang ini dipakai pemasok manapun di Pembelian.
- **Akun Penjualan** (= Piutang Usaha) — kalau mata uang ini dipakai pembeli manapun di Penjualan.
- **Akun Diskon Pembelian/Penjualan** — kalau ada transaksi memakai diskon.
- **Akun Biaya Lain-lain** — kalau ada transaksi mengisi field Freight.
- **Akun Biaya Materai** — kalau ada transaksi mengisi field Stamp/Materai.

## Validasi

- Kode, Nama, Simbol wajib diisi; Kurs harus lebih dari 0.
- Kode Mata Uang harus unik (kalau duplikat, sistem menampilkan error umum saat simpan).

## Mencari & mengelola

Tabel menampilkan Kode, Nama, Simbol, Kurs, Status. Aksi per baris: **Edit**, **Hapus**. *(Catatan: kotak pencarian di halaman ini belum berfungsi memfilter tabel pada versi saat ini — gunakan Edit langsung dari daftar penuh untuk sementara.)*

## Terkait

- [Master Pemasok](master-pemasok.md) — setiap pemasok memilih Mata Uang (berdasarkan ID) dari sini.
- [Master Pembeli](master-pembeli.md) — setiap pembeli memilih Mata Uang (berdasarkan kode) dari sini.
- [Pembelian](pembelian.md), [Penjualan](penjualan.md) — jurnal otomatis kedua modul ini bergantung penuh pada konfigurasi akun di sini.
