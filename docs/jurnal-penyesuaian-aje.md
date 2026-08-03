# Jurnal Penyesuaian (AJE — Adjusting Journal Entry)

> Lokasi menu: **Jurnal → Jurnal Penyesuaian** — URL `/transaksi/AJE`

## Apa itu modul ini?

Ini adalah halaman **input jurnal manual** yang sesungguhnya di Temui — dipakai untuk jurnal penyesuaian akhir periode atau jurnal umum lain yang tidak dihasilkan otomatis oleh modul transaksi (Pembelian, Penjualan, dst). Berbeda dari [Jurnal Umum](jurnal-umum.md) yang hanya menampilkan riwayat, di sini Anda benar-benar mengetik baris debit/kredit sendiri.

> 💡 Dropdown "Nama Akun" menampilkan **semua akun COA, termasuk akun Kas & Bank**. Untuk mutasi kas/bank sehari-hari (uang masuk/keluar rekening), tetap lebih disarankan memakai [Input Transaksi](input-transaksi.md) — nomor transaksinya otomatis dan sistem membuat pasangan jurnal double-entry-nya sendiri. Gunakan AJE untuk kas/bank hanya kalau memang perlu jurnal manual/penyesuaian yang tidak tercakup alur normal Input Transaksi.

## Cara membuat jurnal penyesuaian

1. Klik **"+ Tambah Baris"** — baris baru muncul dengan Tanggal hari ini dan **No. Bukti** yang otomatis di-generate (format `AJE/DDMMYYYY/UU-###`).
2. Isi tiap baris:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Tanggal** | Ya | |
   | **No. Bukti** | Otomatis | Baris-baris dengan No. Bukti yang sama dianggap satu grup jurnal (harus balance bersama). |
   | **Nama Akun** | Ya | Dari Master COA — semua akun bisa dipilih, termasuk akun Kas & Bank. |
   | **Deskripsi** | Ya | |
   | **Debit** / **Kredit** | Salah satu | Saling mengunci — isi salah satu saja per baris. |
   | **Project No** | Tidak | Untuk pelacakan biaya per proyek. |

3. Tambahkan baris lain dengan No. Bukti yang **sama** untuk melengkapi pasangan debit-kreditnya (klik "+ Tambah Baris" lagi, lalu ubah No. Bukti kalau perlu supaya sama dengan baris pertama, atau gunakan tombol **📋 Clone** pada baris yang sudah ada untuk menduplikasinya lebih cepat).
4. Klik ikon 💾 **Simpan** pada tiap baris (atau bertahap per baris — baris tersimpan berstatus "belum posting" dan masih bisa diedit/dihapus).
5. Setelah semua baris untuk satu No. Bukti lengkap dan seimbang, klik ikon 📤 **Posting** untuk mengirim jurnal ke Buku Besar.

## Validasi penting

- **Nama Akun dan Deskripsi wajib diisi** per baris.
- **Total Debit harus sama dengan Total Kredit** untuk semua baris dengan No. Bukti yang sama — kalau tidak balance, sistem menolak simpan dan menyebutkan selisihnya.
- **No. Bukti tidak boleh duplikat** dengan jurnal lain yang sudah ada.
- Baris yang sudah **diposting tidak bisa dihapus** — harus di-**Unposting** dulu (ikon ↩️) baru bisa dihapus/diedit.
- Kalau No. Bukti ternyata sudah pernah muncul di Buku Besar (GL) sebelum posting, sistem menolak dengan pesan bahwa nomor tersebut sudah ada.

## Posting & Unposting

- **Posting** (📤): membuat jurnal resmi di Buku Besar dari semua baris dengan No. Bukti tersebut, lalu mengunci baris-baris itu (tidak bisa diedit lagi kecuali di-unposting).
- **Unposting** (↩️, hanya muncul setelah posting): membalikkan proses — menghapus jurnal terkait dari Buku Besar dan membuka kembali baris untuk diedit. Berguna kalau ada kesalahan input yang baru disadari setelah posting.
- Setelah posting, klik ikon mata (👁 **Lihat Jurnal**) untuk melihat hasil jurnal di Buku Besar.

## Mencari & memfilter

Filter tersedia per kolom: Tanggal, No. Bukti, Nama Akun, Deskripsi, dan **Status Posting** ("Sudah Posting"/"Belum Posting"). Klik header kolom untuk sort.

## Terkait

- [Jurnal Umum](jurnal-umum.md) — tempat melihat hasil semua jurnal (termasuk hasil posting AJE) dalam satu daftar gabungan.
- [Master COA](master-coa.md) — sumber daftar akun.
- [Master Project](master-project.md) — sumber pilihan Project No.
- [Input Transaksi](input-transaksi.md) — jalur yang lebih disarankan untuk mutasi kas/bank sehari-hari.
