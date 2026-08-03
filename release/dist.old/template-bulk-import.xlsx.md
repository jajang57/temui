# Template Excel untuk Bulk Import Transaksi

Buat file Excel dengan kolom berikut:

| Tanggal    | Akun Transaksi | Debit      | Kredit     | Deskripsi           | Project No |
|------------|----------------|------------|------------|---------------------|------------|
| 2024-01-01 | 1111           | 1000000    | 0          | Pembayaran Invoice  | PRJ001     |
| 2024-01-02 | 5111           | 0          | 500000     | Beban Gaji          |            |
| 2024-01-03 | 1112           | 750000     | 0          | Penerimaan Kas      | PRJ002     |

**Catatan:**
- Tanggal: Format YYYY-MM-DD atau DD/MM/YYYY
- Akun Transaksi: Kode COA (contoh: 1111, 5111)
- Debit/Kredit: Angka tanpa pemisah ribuan
- Deskripsi: Wajib diisi
- Project No: Opsional

Simpan file sebagai .xlsx dan upload melalui tombol "Bulk Import" di form Input Transaksi.
