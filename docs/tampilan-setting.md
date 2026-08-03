# Tampilan (Pengaturan Tema)

> Lokasi menu: **Pengaturan → Tampilan** — URL `/setting`

## Apa itu halaman ini?

Kustomisasi tampilan aplikasi: warna tombol, bentuk tombol, font, warna background/card/form, warna header tabel, dan posisi menu. Juga berisi fitur **Backup & Restore Database**.

## Cara memakai

1. Pilih **Mode Theme**: **Dark** atau **Light** — ini langsung mereset semua pengaturan warna ke preset bawaan mode tersebut.
2. Sesuaikan warna & bentuk lewat panel-panel berikut (semua pakai color-picker, bisa dilihat langsung hasilnya di panel **Preview** paling bawah sebelum disimpan):
   - **Warna Button** — warna tombol Simpan, Edit, Hapus, Refresh.
   - **Bentuk & Preview Button** — Default / Rounded / Outline / Block.
   - **Font & Menu** — bentuk font, warna font, posisi menu (Top Navbar / Side Navbar).
   - **Warna Tampilan** — warna Card, Background, Form, Field, Dropdown, Header Tabel.
   - **Pengaturan Tabel** — font tabel, warna font tabel, warna header/body kolom.
   - **Warna Header Software** — warna header aplikasi & background icon.
3. Klik **"Simpan Pengaturan"** di bagian bawah — perubahan baru benar-benar berlaku di seluruh aplikasi setelah ini disimpan.

## Backup & Restore Database

- Isi **"Konfigurasi Path PostgreSQL (pg_dump)"** kalau tombol backup tidak berfungsi karena `pg_dump` tidak ditemukan di sistem (contoh: `C:\Program Files\PostgreSQL\16\bin`).
- **"✨ Buat Backup Baru"** — membuat file backup `.dump` baru di folder `backups/`.
- **"📂 Lihat Daftar & Restore"** — membuka daftar backup yang ada, masing-masing dengan tombol **RESTORE** (perlu konfirmasi karena akan **menimpa semua data saat ini**).

## Terkait

- [Consultant Settings](consultant-settings.md) — punya fitur backup/restore serupa, tapi untuk skala per-client (mode konsultan).
