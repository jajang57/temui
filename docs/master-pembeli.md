# Master Pembeli (Customer)

> Lokasi menu: **Buku Besar → Pembeli** — URL `/master-data/pembeli`

## Apa itu modul ini?

Master data pelanggan/customer — identitas, alamat, kontak, data bank, term pembayaran, diskon, dan kategori harga. Dipakai sebagai sumber pilihan "Customer" di modul [Penjualan](penjualan.md), dan field **Mata Uang** di sini menentukan akun-akun GL yang dipakai sistem saat memposting jurnal penjualan otomatis.

## Cara menambah pembeli baru

Form terbagi 4 tab:

**Tab Umum:**
| Field | Wajib | Keterangan |
|---|---|---|
| Kode Pembeli | Ya | Contoh: `CUST001` — harus diketik manual (tidak auto-generate). |
| Nama Pembeli | Ya | |
| Jenis Customer | Ya | Corporate / Retail / Wholesale / Individual / Government. |
| Status | Tidak | Aktif / Tidak Aktif (default Aktif). |
| Keterangan | Tidak | |

**Tab Alamat:**
| Field | Wajib | Keterangan |
|---|---|---|
| Alamat Lengkap | Ya | |
| Kota, Kode Pos | Tidak | |
| Telepon | Ya | |
| Email | Tidak | Divalidasi formatnya kalau diisi. |
| Contact Person, Telepon CP | Tidak | |

**Tab Bank:**
| Field | Wajib | Keterangan |
|---|---|---|
| Nama Bank, Nomor Rekening, Atas Nama | Tidak | |
| NPWP | Tidak | |

**Tab Term:**
| Field | Wajib | Keterangan |
|---|---|---|
| Term Pembayaran (Hari) | Tidak | Tidak boleh negatif. |
| Limit Kredit | Tidak | Format otomatis Rupiah, tidak boleh negatif. |
| Diskon (%) | Tidak | 0–100, boleh desimal. |
| Kategori Harga | Tidak | Regular / Corporate / Wholesale / VIP (default Regular). |
| **Mata Uang** | Tidak, tapi penting | Pilih dari [Master Mata Uang](master-mata-uang.md). |

Klik **Simpan**.

## ⚠️ Wajib diisi sebelum bertransaksi di Penjualan

Field **"Mata Uang"** di tab Term **harus diisi** sebelum pembeli ini bisa dipakai di modul Penjualan — sistem mencocokkan berdasarkan **kode** mata uang (bukan nomor ID seperti di Master Pemasok) untuk mencari akun Piutang Usaha, Diskon Jual, Biaya Lain-lain, dan Biaya Materai secara otomatis dari [Master Mata Uang](master-mata-uang.md). Kalau kosong atau kodenya tidak cocok dengan data mata uang mana pun, transaksi Penjualan ke pembeli ini akan ditolak.

## Validasi

- Kode, Nama, Jenis Customer, Alamat Lengkap, dan Telepon wajib diisi.
- Email (jika diisi) harus format valid.
- Term Pembayaran dan Limit Kredit tidak boleh negatif; Diskon harus 0–100%.

## Mencari & mengelola

Kotak pencarian global ("Cari pembeli...") plus filter per kolom (Kode, Nama, Jenis). Tabel menampilkan Kode, Nama, Jenis, Telepon, Email, Term, Limit Kredit, Diskon, Status. Aksi per baris: **Edit**, **Hapus** (dengan konfirmasi).

## Terkait

- [Penjualan](penjualan.md) — memakai daftar pembeli di sini sebagai pilihan Customer.
- [Master Mata Uang](master-mata-uang.md) — konfigurasi akun GL per mata uang yang dipakai pembeli.
