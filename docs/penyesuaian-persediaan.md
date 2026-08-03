# Penyesuaian Persediaan (Stock Opname)

> Lokasi menu: **Persediaan → Penyesuaian Persediaan** — URL `/master-data/penyesuaian-persediaan`

## Apa itu modul ini?

Modul untuk mengoreksi selisih antara stok sistem dan stok fisik hasil hitung langsung di gudang (stock opname). Berbeda dari modul master data lain, ini sebenarnya modul **transaksi** — setiap penyesuaian bisa langsung membuat jurnal ke Buku Besar.

## Cara membuat penyesuaian stok

1. Klik tombol **"Buat Penyesuaian"** (ikon +).
2. Isi:

   | Field | Wajib | Keterangan |
   |---|---|---|
   | **Tanggal** | Tidak | Default hari ini. |
   | **Gudang** | Ya | |
   | **Barang** | Ya | Dari [Master Barang & Jasa](master-barang-jasa.md). |
   | **Qty System** | Otomatis | Terisi sendiri (read-only) begitu Gudang + Barang dipilih — ini stok yang tercatat di sistem saat ini. |
   | **Qty Fisik** | Ya | Hasil hitung fisik di lapangan — isi manual. |
   | Selisih | Otomatis | Ditampilkan (bukan diisi): Qty Fisik − Qty System, berwarna merah (defisit) atau hijau (surplus). |
   | Alasan / Keterangan | Tidak (disarankan diisi) | |
   | **Akun Lawan** | Tidak, tapi penting | Akun beban/pendapatan yang jadi pasangan jurnal — lihat penjelasan di bawah. |

3. Klik **Simpan**.

## Kapan jurnal dibuat

Jurnal ke Buku Besar **hanya dibuat** kalau dua syarat terpenuhi: **ada selisih** (Qty Fisik ≠ Qty System) **dan** **Akun Lawan dipilih**. Kalau salah satu tidak terpenuhi, penyesuaian tetap tersimpan sebagai catatan tapi tanpa jurnal.

- **Surplus** (stok fisik lebih banyak dari sistem): Debit Akun Persediaan, Kredit Akun Lawan.
- **Defisit** (stok fisik lebih sedikit dari sistem): Debit Akun Lawan, Kredit Akun Persediaan.
- Nilai jurnal dihitung dari **selisih qty × Harga Beli** item (dari Master Barang & Jasa) — jadi pastikan Harga Beli item selalu up to date supaya nilai jurnal penyesuaian akurat.

## ⚠️ Prasyarat penting

Item yang disesuaikan **wajib punya "Akun Persediaan" terisi** di [Master Barang & Jasa](master-barang-jasa.md). Kalau kosong dan ada selisih dengan Akun Lawan dipilih, penyimpanan akan **ditolak sistem**.

## Validasi

- Gudang, Barang, dan Qty Fisik wajib diisi.
- Nomor bukti dibuat otomatis (format `ADJ/YYYY/MM/NNNN`), tidak perlu diisi manual.

## Mengedit dan menghapus

- **Edit**: menghapus jurnal lama (kalau ada) dan membuat ulang sesuai data baru.
- **Hapus**: ⚠️ hanya menghapus record penyesuaiannya saja — **jurnal GL yang sudah terlanjur dibuat tidak ikut terhapus/dibalik otomatis**. Kalau perlu membatalkan penyesuaian yang sudah diposting, sebaiknya buat penyesuaian baru dengan arah berlawanan, bukan menghapus record lama begitu saja.

## Mencari & memfilter

Filter **Gudang** di atas tabel, plus kotak pencarian cepat bawaan tabel (mencari di semua kolom sekaligus).

## Terkait

- [Master Barang & Jasa](master-barang-jasa.md) — Akun Persediaan & Harga Beli item yang disesuaikan.
- [Master Gudang](master-gudang.md) — lokasi gudang yang disesuaikan.
- [Master Persediaan](master-persediaan.md) — hasil penyesuaian ini muncul di laporan Mutasi sebagai baris sumber "Penyesuaian".
