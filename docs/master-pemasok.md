# Master Pemasok (Supplier)

> Lokasi menu: **Buku Besar → Pemasok** — URL `/master-data/pemasok`

## Apa itu modul ini?

Master data pemasok/vendor perusahaan — identitas, alamat, kontak, data bank, NPWP, dan term pembayaran. Dipakai sebagai sumber pilihan "Supplier" di modul [Pembelian](pembelian.md), dan field **Mata Uang** di sini menentukan akun-akun GL apa yang dipakai saat sistem memposting jurnal pembelian secara otomatis.

## Cara menambah pemasok baru

Form terbagi 4 tab:

**Tab Data Utama:**
| Field | Wajib | Keterangan |
|---|---|---|
| Kode Pemasok | Tidak | Kosongkan untuk auto-generate (`VND001`, `VND002`, ...). |
| Nama Pemasok | Ya | |
| Jenis Usaha | Tidak | Contoh: Distributor, Manufaktur. |
| Status | Tidak | Aktif / Tidak Aktif (default Aktif). |
| Keterangan | Tidak | |

**Tab Alamat & Kontak:**
| Field | Wajib | Keterangan |
|---|---|---|
| Alamat | Ya | |
| Kota, Provinsi, Kode Pos, Negara | Tidak | Negara default "Indonesia". |
| Telepon | Ya | Hanya angka. |
| Fax, Email, Website | Tidak | |
| Contact Person, Jabatan Contact, Telepon Contact, Email Contact | Tidak | |

**Tab Bank & Pajak:**
| Field | Wajib | Keterangan |
|---|---|---|
| Nama Bank, No. Rekening, Nama Rekening | Tidak | |
| NPWP | Tidak | |

**Tab Term & Limit:**
| Field | Wajib | Keterangan |
|---|---|---|
| Term Pembayaran (hari) | Tidak | Default 30 hari; isi 0 untuk cash. |
| Limit Kredit | Tidak | Format otomatis Rupiah. |
| **Mata Uang** | Tidak, tapi penting | Pilih dari [Master Mata Uang](master-mata-uang.md). |

Klik **Simpan**.

## ⚠️ Wajib diisi sebelum bertransaksi di Pembelian

Field **"Mata Uang"** di tab Term & Limit **harus diisi** sebelum pemasok ini bisa dipakai di modul Pembelian — sistem memakai mata uang ini untuk mencari akun Hutang Usaha, Diskon Beli, Biaya Lain-lain, dan Biaya Materai secara otomatis dari [Master Mata Uang](master-mata-uang.md). Kalau kosong, transaksi Pembelian ke pemasok ini akan ditolak dengan pesan "Mata uang pemasok belum diset".

## Validasi

- Nama, Alamat, dan Telepon wajib diisi (validasi frontend).
- Kode Pemasok harus unik.

## Mencari & mengelola

Kotak pencarian tunggal (cari di nama/kode/email/telepon). Tabel menampilkan Kode, Nama, Jenis Usaha, Kontak, Alamat, Term, Limit Kredit, Status. Aksi per baris: **Edit**, **Hapus** (dengan konfirmasi).

## Terkait

- [Pembelian](pembelian.md) — memakai daftar pemasok di sini sebagai pilihan Supplier.
- [Master Mata Uang](master-mata-uang.md) — konfigurasi akun GL per mata uang yang dipakai pemasok.
