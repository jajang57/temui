# Master Pajak (Tax)

> Lokasi menu: **Buku Besar → Pajak** — URL `/master-data/pajak`

## Apa itu modul ini?

Mendefinisikan setiap jenis/tarif pajak (PPN, PPh, PPh Final) beserta akun GL dan rumus DPP-nya. Dipakai sebagai pilihan pajak per baris item di [Pembelian](pembelian.md) dan [Penjualan](penjualan.md).

## Cara menambah pajak baru

| Field | Wajib | Keterangan |
|---|---|---|
| **Urutan** | Tidak | Angka 1, 2, atau 3 — menentukan pajak ini masuk ke kolom pajak keberapa saat tampil di ringkasan Pembelian/Penjualan (kalau satu transaksi punya lebih dari 1 jenis pajak sekaligus). Nilai selain 1/2/3 tidak akan terhitung ke kolom manapun. |
| **Nama Pajak** | Ya | |
| **Persentase Pajak (%)** | Ya | Tarif pajak. |
| **Kode Pajak** | Ya | Harus unik (kode maupun nama tidak boleh sama dengan pajak lain). |
| **Deskripsi** | Tidak | |
| **Akun Pajak Penjualan** | Ya | Akun COA — dipakai saat pajak ini dipilih di Penjualan. |
| **Akun Pajak Pembelian** | Ya | Akun COA — dipakai saat pajak ini dipilih di Pembelian. |
| **Rumus DPP** | Tidak | Lihat catatan khusus di bawah. |
| **Jenis Pajak** | Tidak | PPN / PPH / PPH Final (default PPN). |

Klik **Simpan**.

## ⚠️ Cara mengisi "Rumus DPP" yang benar

Placeholder di field ini menampilkan contoh `(harga - diskon) / 1.1`, tapi sistem **tidak bisa membaca rumus aljabar seperti itu**. Yang benar-benar didukung hanya:
- **Pecahan angka**, contoh: `100/111` atau `10/11`
- **Angka desimal langsung**, contoh: `0.9009`
- Kosongkan saja kalau DPP = 100% dari (Qty × Harga − Diskon), tanpa penyesuaian.

Kalau Anda mengisi rumus aljabar (seperti contoh di placeholder), sistem akan gagal membacanya dan otomatis memakai faktor `1.0` (DPP dianggap 100%, tanpa penyesuaian) — tanpa peringatan. Jadi untuk pajak yang dihitung inklusif (misalnya PPN 11% yang sudah termasuk dalam harga), isi Rumus DPP dengan pecahan seperti `100/111`, bukan rumus aljabar.

## Bagaimana "Jenis Pajak" memengaruhi jurnal

- **PPN**: nilai pajak menambah Total baris di Pembelian/Penjualan, dan didebit ke akun pajak (di Pembelian) atau dikredit (di Penjualan).
- **PPH / PPH Final**: diperlakukan sebagai pajak yang dipotong (withholding) — mengurangi Total baris, dan diproses lewat "Akun Pajak Pembelian"/"Akun Pajak Penjualan" yang sama, tapi dengan arah kredit yang berbeda dari PPN biasa.

## Validasi

- Nama Pajak, Persentase Pajak, Kode Pajak, Akun Pajak Penjualan, dan Akun Pajak Pembelian semuanya wajib diisi.
- Kode Pajak **dan** Nama Pajak masing-masing harus unik — kalau salah satunya sudah dipakai pajak lain, sistem menolak simpan.

## Mencari & mengelola

Filter per kolom (Urutan, Nama, Persentase, Kode, Deskripsi, Jenis Pajak). Aksi per baris: **Edit**, **Hapus** (⚠️ hapus di modul ini **langsung terjadi tanpa dialog konfirmasi** — hati-hati saat klik).

## Terkait

- [Pembelian](pembelian.md), [Penjualan](penjualan.md) — kode pajak di sini dipilih per baris item pada kedua modul tersebut.
