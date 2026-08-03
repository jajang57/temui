# Laporan Fix Asset (History & Summary)

Dua laporan terkait aset tetap, ada di menu **Laporan Keuangan**:

- **Fix Asset History** — riwayat lengkap satu aset (URL `/laporan/fix-asset-history`)
- **Fix Asset Summary** — ringkasan seluruh aset per kategori (URL `/laporan/fix-asset-summary`)

---

## Fix Asset History

### Apa itu laporan ini?

Menampilkan kartu informasi lengkap satu aset tetap beserta riwayat kronologis: dari posting perolehan sampai setiap posting penyusutan yang pernah dijalankan, dengan nilai buku berjalan di setiap baris.

### Cara memakai

1. Pilih aset dari dropdown **"Pilih Aset"** (menampilkan `kodeAset — namaAset`).
2. *(Opsional)* Isi **Tanggal Mulai** dan **Tanggal Akhir** untuk membatasi rentang riwayat yang ditampilkan — kosongkan untuk menampilkan seluruh riwayat sejak perolehan sampai posting penyusutan terakhir.
3. Klik **Tampilkan**. Kalau belum memilih aset, muncul pesan "Pilih aset terlebih dahulu".

### Cara membaca laporan

- **Kartu info aset**: Fix Asset No, Asset Name, Asset Type, Usage Date (tanggal perolehan), Age (umur aset dihitung otomatis sampai hari ini), Method & Rate (mis. "Straight Line (X.XX %)"), Estimated Live (estimasi umur manfaat), Asset Account, Accum Depr Account, Depr Expense Account, Salvage Value (nilai residu).
- **Tabel riwayat**: DATE, NOTE, TRANSNO, SOURCE (badge "fixasset" = posting perolehan, "jv" = jurnal penyusutan), QTY, ASSET COST, DEPRECIATION AMOUNT, BOOK VALUE.
- Baris **Total** di akhir tabel: jumlah Qty, Asset Cost, Depreciation, dan Book Value terakhir.

> ⚠️ Catatan penting: kalau Anda mengisi Tanggal Mulai yang melewati tanggal perolehan aset, baris posting perolehan ("fixasset") **tidak akan ditampilkan** (dan tidak ikut dihitung di Total) — kalau ingin melihat baris perolehan, pastikan Tanggal Mulai mencakup Tanggal Perolehan aset tersebut, atau kosongkan filter tanggal sepenuhnya.

### Ekspor & cetak

- **Print**, **PDF** (`fix-asset-history-{kode-aset}.pdf`), **Excel** (`fix-asset-history-{kode-aset}.xlsx`).

---

## Fix Asset Summary

### Apa itu laporan ini?

Ringkasan seluruh aset tetap perusahaan, dikelompokkan per kategori, menampilkan Harga Perolehan, Akumulasi Penyusutan, Nilai Terjual (kalau ada yang sudah dijual), dan Nilai Buku — mirip daftar aset tetap (fixed asset register) per periode tertentu.

### Cara memakai

1. Pilih **Periode** (bulan-tahun, mis. `2026-08`) — default bulan-tahun berjalan.
2. *(Opsional)* Isi **Min. Book Value** untuk hanya menampilkan aset dengan nilai buku di atas angka tertentu (default 0, artinya semua aset ditampilkan).
3. *(Opsional)* Centang **"Tampilkan Disposed"** untuk ikut menampilkan aset yang sudah dijual/dilepas (secara default aset yang sudah Disposed disembunyikan).
4. Klik **Tampilkan**.

### Cara membaca laporan

- Subjudul **"Filter: ..."** merangkum filter yang sedang aktif (periode, ambang nilai buku, status disposed).
- Tabel dikelompokkan: **Kategori** → **Sub Kategori** → baris per aset (kode - nama, qty, Asset Cost, Acm Depr Amount, Disposed, Book Value) → baris **Sub Total** per sub-kategori → baris **Total** per kategori (biru tebal).
- Baris terakhir **GRAND TOTAL** (latar biru gelap) — jumlah keseluruhan semua aset yang tampil.

> 📌 Catatan: Nilai Buku dihitung berdasarkan akumulasi penyusutan yang **sudah diposting resmi** (status Posted) sampai akhir bulan periode yang dipilih, dan tidak akan pernah turun di bawah Nilai Residu aset tersebut.

### Ekspor & cetak

- **Print**, **PDF** (`fix-asset-summary-{periode}.pdf`), **Excel** (`fix-asset-summary-{periode}.xlsx`).

---

## Terkait

- [Master Aset Tetap](master-aset-tetap.md) — pendaftaran data aset, status Draft/Posted/Disposed, dan estimasi nilai buku secara real-time.
- [Master COA](master-coa.md) — akun-akun yang direferensikan (Asset Account, Accum Depr, Depr Expense).
