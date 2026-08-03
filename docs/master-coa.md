# Master COA (Chart of Accounts / Daftar Akun)

> Lokasi menu: **Transaksi → Akun** — URL `/master-data/coa`

## Apa itu modul ini?

Master COA adalah daftar akun (Chart of Accounts) perusahaan — pondasi dari seluruh pencatatan akuntansi di Temui. Semua modul lain (Input Transaksi, Pembelian, Buku Besar, Laporan Keuangan, Aset Tetap) merujuk ke daftar akun yang didefinisikan di sini. Setiap akun dikelompokkan ke dalam **Kategori COA** (mis. Kas & Bank, Piutang, Persediaan, Hutang, Modal, Pendapatan, Beban), dan kategori itu menentukan bagaimana akun tersebut diperlakukan di laporan keuangan.

## Cara menambah akun baru

1. Buka menu **Transaksi → Akun**.
2. Di panel form sebelah kiri, pilih **Kategori** akun terlebih dahulu — ini penting karena field **Kode Akun** akan otomatis terisi begitu kategori dipilih.
3. Field yang harus diisi:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Kode Akun** | Ya | Contoh: `1001`. Otomatis ter-generate begitu Kategori dipilih. Bisa di-generate ulang kapan saja dengan tombol **Auto** di sampingnya. |
   | **Nama Akun** | Ya | Contoh: `Kas`. |
   | **Kategori** | Ya | Menentukan tipe akun (Aset/Kewajiban/Modal/dst) dan bagaimana akun muncul di laporan. Kalau kategori yang dibutuhkan belum ada, pilih opsi **"+ Tambah Kategori"** paling bawah — ini akan membuka form kategori baru. |
   | **Saldo Awal** | Tidak | Saldo pembukaan akun ini. Angka otomatis diberi pemisah ribuan saat tidak sedang diketik. |
   | **Aktivitas Override** (Mapping Arus Kas) | Tidak | Lihat bagian "Mapping Arus Kas" di bawah. |

4. Klik **Simpan**.
5. Kalau ingin mengosongkan form tanpa menyimpan, klik **Kosongkan**.

### Auto-generate Kode Akun

Saat kategori dipilih, sistem membuat kode otomatis berdasarkan pola kode kategori:
- Kalau kode kategori mengandung tanda `-` (misalnya `1-100`), kode akun baru mengikuti pola `1-001`, `1-002`, dst (3 digit, naik otomatis dari kode tertinggi yang sudah ada di kategori itu).
- Kalau kode kategori tidak mengandung `-`, kode akun digabung langsung: `kodeKategori` + 3 digit urut, misalnya `1001`, `1002`.

Tombol **Auto** di sebelah field Kode Akun bisa dipakai kapan saja untuk membuat ulang kode ini (kategori harus sudah dipilih dulu).

## Menambah/mengedit Kategori COA

Klik opsi **"+ Tambah Kategori"** di dropdown Kategori untuk membuka modal **"Tambah/Edit Kategori COA"**:

| Field | Wajib | Keterangan |
|---|---|---|
| **Kode** | Ya | Kode kategori, mis. `1-100`. |
| **Nama** | Ya | Nama kategori, mis. `Kas & Bank`. |
| **Tipe Akun** | Ya | Salah satu dari: Asset, Kewajiban, Modal, Pendapatan, Harga Pokok Penjualan, Beban, Pendapatan Lainnya, Beban Lainnya. Tipe ini yang menentukan apakah akun masuk ke Neraca (Aset/Kewajiban/Modal) atau Laba Rugi (Pendapatan/Beban), dan arah normal saldonya (debit/kredit) di seluruh laporan. |
| **Akun Kas & Bank** (checkbox) | Tidak | **Wajib dicentang** untuk kategori kas/bank/rekening koran. Flag ini dipakai di banyak tempat — mis. dropdown "COA Akun Bank" di Input Transaksi, dan perhitungan Laporan Arus Kas (kas awal/akhir periode). Kalau lupa mencentang, akun tersebut tidak akan muncul sebagai pilihan akun kas/bank. |

Modal ini juga menampilkan tabel semua kategori yang sudah ada di sisi kanan, lengkap dengan tombol **Edit** dan **Hapus** per baris. Kategori yang baru dibuat otomatis langsung terpilih di form Master COA.

## Mapping Arus Kas (opsional, untuk akun non-standar)

Laporan Arus Kas dibuat otomatis oleh sistem berdasarkan tebakan (heuristik) dari nama akun (mis. akun yang namanya mengandung "tetap", "bangunan", "kendaraan" dianggap aktivitas Investasi). Untuk akun yang namanya tidak lazim atau ingin dipastikan klasifikasinya, gunakan:

- **Aktivitas Override**: paksa akun ini masuk sebagai **Operasi**, **Investasi**, atau **Pendanaan** — kosongkan untuk memakai tebakan otomatis sistem.
- **Arah Arus Override** (muncul hanya kalau Aktivitas Override diisi): paksa arah sebagai **Masuk (Inflow)** atau **Keluar (Outflow)**.

> Tips: Kalau Laporan Arus Kas terlihat salah kategori untuk akun tertentu, cek dan atur override ini di Master COA — lihat juga [Laporan Arus Kas](laporan-arus-kas.md).

## Mencari, memfilter, dan mengelola daftar akun

- Kotak **"Cari kode/nama/kategori..."** mencari di semua kolom sekaligus.
- Ada juga filter per kolom di bawah header tabel: **Filter kode**, **Filter nama**, **Filter kategori** — bisa dipakai bersamaan dengan pencarian utama.
- Daftar akun dikelompokkan otomatis berdasarkan kategori (header tebal per kategori), diurutkan berdasarkan kode kategori lalu kode akun.
- Kolom **Arus Kas** menampilkan badge biru (Operating/Investing/Financing) kalau akun punya override manual, atau badge abu-abu **"Auto"** kalau memakai tebakan sistem.
- Tombol **Print** mencetak tabel yang sedang tampil.
- Aksi per baris: **Edit** (memuat data ke form) dan **Hapus** (perlu konfirmasi, permanen).

## Validasi & hal yang perlu diperhatikan

- Kode Akun, Nama Akun, dan Kategori wajib diisi — sistem akan menolak simpan dengan pesan "Semua field wajib diisi!".
- Kode Akun tidak boleh duplikat — sistem cek otomatis dan menampilkan peringatan kalau kode sudah dipakai akun lain.
- Saat mengedit akun, field **Tanggal Saldo Awal** akan ter-reset ke tanggal hari ini (bukan tanggal aslinya) — jangan kaget kalau ini terjadi, cukup normal untuk versi saat ini.
- Menghapus akun bersifat permanen dan tidak bisa dibatalkan — pastikan akun tersebut tidak sedang dipakai di transaksi aktif sebelum menghapus.

## Terkait

- [Input Transaksi](input-transaksi.md) — memakai Master COA untuk pilihan "COA Akun Bank" dan "Akun Transaksi".
- [Master Aset Tetap](master-aset-tetap.md) — memakai Master COA untuk akun aset, akumulasi penyusutan, beban penyusutan, dan akun lawan.
- [Pembelian](pembelian.md) — akun-akun jurnal otomatis (Hutang Usaha, PPN, dll) diambil dari Master Mata Uang & Master Barang/Jasa yang keduanya merujuk ke Master COA.
- [Laporan Arus Kas](laporan-arus-kas.md), [Neraca](neraca.md), [Laba Rugi](laporan-laba-rugi.md) — semua laporan keuangan dibangun dari data akun di sini.
