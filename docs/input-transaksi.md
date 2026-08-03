# Input Transaksi (Buku Kas & Bank)

> Lokasi menu: **Transaksi → Buku Kas** — URL `/input-transaksi`

## Apa itu modul ini?

Modul ini dipakai untuk mencatat mutasi kas/bank — setiap kali ada uang masuk atau keluar dari salah satu rekening kas/bank perusahaan. Berbeda dengan jurnal umum bebas, transaksi di sini selalu melibatkan satu **akun Kas/Bank** dan satu **akun lawan** (Akun Transaksi) dari Chart of Accounts. Sistem otomatis membuat pasangan jurnal debit-kredit (double-entry) di Buku Besar di belakang layar, jadi Anda tidak perlu menghitung jurnal secara manual.

## Cara input transaksi

1. Pilih **COA Akun Bank** — rekening kas/bank mana yang terpengaruh oleh transaksi ini. Field lain akan menyesuaikan setelah ini dipilih.
2. **Nomor Transaksi** otomatis dibuatkan sistem (format: `KodeBank/DDMMYY/UserID-Urutan`, misalnya `1112/040826/05-0001`). Kalau perlu, klik tombol **Auto** untuk membuat ulang nomornya.
3. Pastikan/isi **Tanggal** transaksi (default hari ini).
4. Pilih **Akun Transaksi** — akun lawan dari Master COA (akun yang sama dengan COA Akun Bank tidak akan muncul di pilihan ini).
5. *(Opsional)* Kalau transaksi ini adalah pembayaran dari pelanggan atau ke pemasok, gunakan tombol pintasan:
   - **📊 Penjualan** — membuka daftar invoice penjualan yang belum lunas; memilih salah satu otomatis mengisi Deskripsi dan Debit.
   - **📊 Pembelian** — membuka daftar invoice pembelian; memilih salah satu otomatis mengisi Deskripsi dan Kredit.
6. Isi **salah satu** dari **Debit** atau **Kredit** (dua field ini saling mengunci satu sama lain — begitu satu diisi, yang lain otomatis terkunci).
7. Isi **Deskripsi** (wajib).
8. *(Opsional)* Pilih **Project No** — Project Name terisi otomatis.
9. Klik **Simpan**.

Setelah tersimpan, form otomatis reset (COA Akun Bank tetap terpilih) dan Nomor Transaksi baru langsung dibuatkan untuk input berikutnya, sementara tabel di bawah menampilkan transaksi yang baru saja tersimpan.

## Field yang tersedia (ringkasan)

| Field | Wajib | Keterangan |
|---|---|---|
| COA Akun Bank | Ya | Rekening kas/bank yang terpengaruh. |
| Nomor Transaksi | Otomatis | Bisa dibuat ulang lewat tombol Auto; bisa diedit manual saat mode Edit. |
| Tanggal | Ya | |
| Akun Transaksi | Ya | Akun lawan dari Master COA. |
| Debit | Salah satu | Uang masuk ke akun bank (saling eksklusif dengan Kredit). |
| Kredit | Salah satu | Uang keluar dari akun bank (saling eksklusif dengan Debit). |
| Deskripsi | Ya | |
| Project No | Tidak | Untuk pelacakan biaya per proyek/pekerjaan. |

## Fitur "Transaksi Tukar" (transfer antar kas/bank)

Kalau **Akun Transaksi** yang dipilih ternyata juga akun Kas/Bank (misalnya transfer dari BCA ke Mandiri), sistem otomatis membuat **2 transaksi sekaligus**: satu di rekening asal, satu lagi di rekening tujuan dengan nilai Debit/Kredit yang dibalik dan nomor transaksi sendiri. Anda akan melihat notifikasi "2 Transaksi berhasil disimpan (normal + tukar)!".

## Mengedit dan menghapus transaksi

- **Double-click** baris transaksi di tabel untuk masuk ke mode edit — form akan terisi ulang dengan data transaksi tersebut, dan tombol Simpan berubah menjadi **Update**.
- Saat mode edit aktif, muncul banner **"Mode Edit: Mengedit transaksi ID #..."** — klik ✕ untuk membatalkan.
- Tombol **Hapus** di form hanya aktif saat sedang mode edit, dan meminta konfirmasi sebelum menghapus.

## Import massal via Excel

Klik tombol **📤 Import** untuk membuka modal **Bulk Import Transaksi**:

1. Klik **📥 Download Template Excel** untuk mengunduh template kosong.
2. Isi template dengan kolom: **Tanggal | Akun Transaksi | Debit | Kredit | Deskripsi | Project No (opsional)**.
   - Format tanggal: `YYYY-MM-DD`.
   - Kode akun harus sesuai dengan kode di Master COA.
   - Isi hanya salah satu dari Debit atau Kredit per baris.
3. Upload file `.xlsx`/`.xls` — sistem menampilkan pratinjau 10 baris pertama.
4. Klik **Import** — sistem memproses baris demi baris (nomor transaksi dibuat otomatis per baris) dan menampilkan progress serta ringkasan sukses/gagal di akhir.

## Melihat riwayat perubahan (Audit Trail)

Setelah memilih sebuah transaksi (double-click), tombol **📋 Audit** akan aktif. Klik untuk melihat riwayat lengkap siapa yang membuat/mengubah/menghapus transaksi tersebut, lengkap dengan waktu dan detail perubahan (badge hijau = dibuat, oranye = diubah, merah = dihapus).

## Tabel daftar transaksi

Tabel ini hanya muncul setelah **COA Akun Bank** dipilih di form. Kolom yang ditampilkan: No, Tanggal, COA Akun Bank, Akun Transaksi, Deskripsi, Debit, Kredit, **Balance** (saldo berjalan otomatis), No Transaksi, Project No/Name, dan **Jurnal** (link "Lihat" untuk melihat pasangan jurnal GL dari transaksi tersebut).

- Baris pertama tabel selalu berupa **Saldo Awal** akun tersebut.
- Setiap kolom bisa di-**sort** (klik header) dan di-**filter** (ikon filter, isi kata kunci lalu Reset/Close untuk membersihkan).
- Kotak pencarian global mencari di Nomor Transaksi, Deskripsi, Project, dan nama akun.
- Tombol **Print** mencetak tabel; tombol **Export Excel** mengunduh file `.xlsx`.
- Pagination 10 baris per halaman.

## Validasi yang perlu diperhatikan

- **Akun Transaksi wajib dipilih** sebelum menyimpan.
- **Debit atau Kredit wajib diisi salah satu** — tidak boleh kosong dua-duanya, dan tidak boleh diisi keduanya sekaligus.
- Tanggal dan Deskripsi wajib diisi.
- Sistem menentukan arah posting jurnal ke Buku Besar berdasarkan **Tipe Akun** dari akun lawan yang dipilih (Aset/Kewajiban/Modal/Pendapatan/Beban) — jadi pastikan setiap akun sudah dikategorikan dengan benar di [Master COA](master-coa.md) agar posting jurnal otomatis akurat.

## Terkait

- [Master COA](master-coa.md) — sumber daftar "COA Akun Bank" (harus dicentang sebagai Akun Kas & Bank di kategorinya) dan "Akun Transaksi".
- [Buku Besar](buku-besar.md) — tempat melihat hasil posting jurnal dari setiap transaksi di sini.
