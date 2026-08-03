# Karyawan (Master Data Karyawan)

> Lokasi menu: **Pengaturan → Profil Perusahaan → Karyawan** — URL `/profil/karyawan`

## Apa itu modul ini?

Data induk karyawan perusahaan untuk keperluan referensi HR internal.

## Cara menambah karyawan baru

Form terbagi 4 tab:

**Tab Data Pribadi:**
| Field | Wajib | Keterangan |
|---|---|---|
| NIK | Ya | Harus unik. |
| Nama Lengkap | Ya | |
| Tempat Lahir, Tanggal Lahir | Tidak | |
| Jenis Kelamin | Tidak | Laki-laki / Perempuan (default Laki-laki). |
| Status Pernikahan | Tidak | Belum Menikah / Menikah / Cerai. |

**Tab Alamat & Kontak:**
| Field | Wajib | Keterangan |
|---|---|---|
| Alamat, Kota, Kode Pos | Tidak | |
| No. Telepon | Tidak | |
| Email | Tidak | Divalidasi formatnya kalau diisi. |

**Tab Info Pekerjaan:**
| Field | Wajib | Keterangan |
|---|---|---|
| Departemen, Jabatan | Tidak | |
| **Tanggal Masuk** | Ya | |
| Status Karyawan | Tidak | Aktif / Tidak Aktif / Cuti (default Aktif). |

**Tab Penggajian & Pajak:**
| Field | Wajib | Keterangan |
|---|---|---|
| Gaji Pokok, Tunjangan | Tidak | Format otomatis Rupiah. |
| No. Rekening, Nama Bank | Tidak | |
| NPWP | Tidak | |

Klik **Simpan**.

## Validasi

- NIK, Nama Lengkap, dan Tanggal Masuk wajib diisi.
- NIK harus unik — sistem menolak kalau sudah dipakai karyawan lain.
- Email (jika diisi) harus format valid.

## Mencari & mengelola

Kotak pencarian ("Cari NIK, nama, jabatan...") memanggil pencarian ke server. Aksi per baris: **Edit**, **Hapus** (dengan konfirmasi).

## Terkait

- [Informasi Umum](informasi-umum.md) — profil perusahaan, di menu Pengaturan yang sama.
