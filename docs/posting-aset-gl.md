# Posting ke GL (Aset Tetap)

> Lokasi menu: **Transaksi → Aset Tetap → Posting ke GL** — URL `/aset-tetap/posting-gl`

## Apa itu halaman ini?

Langkah kedua dari alur aset tetap: memposting aset yang berstatus **Draft** (baru didaftarkan lewat [Registrasi Aset](registrasi-aset.md) atau diinput manual di [Master Aset Tetap](master-aset-tetap.md)) menjadi jurnal resmi di Buku Besar, mengubah statusnya jadi **Posted**.

## Cara memakai

1. Tabel menampilkan semua aset berstatus **Draft**: Kode Aset, Nama Aset, Kategori, Tanggal, Harga.
2. Centang satu atau beberapa aset yang mau diposting (ada checkbox "pilih semua" di header tabel).
3. *(Opsional)* Klik **"👁️ Preview Jurnal (N)"** untuk melihat pratinjau baris jurnal yang akan dibuat — Debit ke Akun Aset Tetap, Kredit ke akun lawan (Akun Persediaan kalau aset berasal dari pembelian, atau Akun Lawan yang diisi manual di Master Aset Tetap kalau input langsung), masing-masing sebesar Harga Perolehan.
4. Klik **"📤 Post ke GL (N)"** — akan muncul konfirmasi jumlah aset yang diposting. Setujui untuk melanjutkan.

## Validasi & kegagalan posting

Posting akan ditolak per-aset (dengan pesan error yang jelas) kalau:
- Aset yang dipilih ternyata **bukan berstatus Draft** lagi (mis. sudah diposting orang lain di waktu bersamaan).
- **Akun Aset Tetap** belum diisi di data aset tersebut.
- Akun lawan (Akun Persediaan dari Master Barang/Jasa, atau Akun Lawan manual) tidak ditemukan/kosong.

Kalau ada satu aset dalam batch yang gagal, seluruh proses posting batch tersebut dibatalkan (tidak ada yang setengah-setengah tersimpan).

## Setelah posting

Status aset berubah jadi **Posted**, dan jurnal (Debit Akun Aset Tetap / Kredit akun lawan) langsung tercatat di Buku Besar. Aset yang sudah Posted baru bisa diproses penyusutannya lewat [Hitung Penyusutan](hitung-penyusutan.md).

## Riwayat Posting Aset

Ada section "Riwayat Posting Aset" di bawah tabel utama untuk menampilkan aset yang sudah Posted beserta link "Lihat Jurnal". **Catatan:** section ini kadang tidak terisi data karena keterbatasan versi saat ini — kalau riwayat tidak muncul, cek langsung status aset lewat [Master Aset Tetap](master-aset-tetap.md) atau [Laporan Fix Asset](laporan-fix-asset.md) sebagai alternatif.

## Terkait

- [Registrasi Aset](registrasi-aset.md) — langkah sebelum ini.
- [Hitung Penyusutan](hitung-penyusutan.md) — langkah berikutnya.
- [Master Aset Tetap](master-aset-tetap.md) — mengelola data induk aset.
