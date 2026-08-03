# Consultant Settings

> Lokasi menu: **Pengaturan → Consultant Settings** — URL `/consultant-settings`

## Apa itu halaman ini?

Halaman khusus **Consultant Mode** — hanya bisa diakses kalau aplikasi berjalan dalam mode ini (dipakai oleh konsultan pajak/akuntansi yang mengelola pembukuan banyak klien sekaligus dari satu akun). Kalau aplikasi berjalan di mode biasa (Client Mode), halaman ini hanya menampilkan pesan "Halaman ini hanya tersedia dalam Consultant Mode."

Setiap **client** yang didaftarkan di sini punya database sendiri-sendiri (terpisah per klien) — konsultan berpindah antar klien lewat pemilih client di navbar atas aplikasi.

## Mengelola daftar Client

- **"+ Tambah Client Baru"** — buka form isi Client ID, Nama Client, URL Server, dan konfigurasi database (Host, Port, DB Name, User, Password).
- Per client di tabel, tersedia aksi:
  - **Test** — cek koneksi ke database client tersebut.
  - **Backup** — buat backup database client ini.
  - **Restore** — pulihkan database client ini dari salah satu file backup.
  - **Migrate** — jalankan migrasi skema database untuk client ini (perlu konfirmasi).
  - **Edit** — ubah data client (Client ID tidak bisa diubah).
  - **Hapus** — hapus client dari daftar (perlu konfirmasi).

## Backup & Restore Master Database

Terpisah dari backup per-client — ini untuk database utama/master milik konsultan sendiri:
- **"Backup Master DB"**.
- **"Restore Master DB"** — ⚠️ ditandai dengan peringatan merah tegas karena akan **menimpa seluruh data utama**, perlu konfirmasi berlapis.

## Global System Settings

Field **"Path Bin PostgreSQL (pg_dump)"** — sama fungsinya dengan pengaturan di halaman [Tampilan](tampilan-setting.md), diisi kalau backup/restore gagal karena `pg_dump` tidak ditemukan.

## Terkait

- [Tampilan](tampilan-setting.md) — pengaturan backup/restore untuk mode Client biasa (non-konsultan).
- [Dashboard](dashboard.md) — kalau belum memilih client aktif, Dashboard akan meminta Anda memilih dulu lewat navbar atas.
