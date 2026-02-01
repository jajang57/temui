# Panduan Instalasi & Deployment Temui App

Aplikasi ini telah di-build menjadi **Single Executable** (`temui-app.exe`) yang mencakup Backend dan Frontend sekaligus.

## 📂 Struktur Folder
Untuk deployment ke server/komputer klien, cukup copy file dan folder berikut:

```
/TemuiApp
  ├── temui-app.exe      (Aplikasi Utama)
  ├── .env               (Konfigurasi Database & Mode)
  └── dist/              (File Frontend - JANGAN DIHAPUS)
```

> **PENTING**: Folder `dist` harus selalu berada satu folder dengan `temui-app.exe`.

## ⚙️ Konfigurasi (.env)

Buat file `.env` di sebelah `temui-app.exe`.

### 1. Untuk Client (Mode Akuntansi Biasa)
Client mode akan mengaktifkan database akuntansi full dan menonaktifkan fitur proxy/consultant.

```ini
# .env untuk CLIENT
APP_MODE=client
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=temui_client_db
```

### 2. Untuk Consultant (Mode Konsultan/Proxy)
Consultant mode mengaktifkan fitur manajemen multi-klien.

```ini
# .env untuk CONSULTANT
APP_MODE=consultant
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=temui_consultant_db
```

## 🚀 Cara Menjalankan

### Cara 1: Double Click (Windows)
Jika file `.env` sudah ada, Anda bisa langsung double click `temui-app.exe`. Aplikasi akan membaca konfigurasi dari `.env`.

### Cara 2: Command Line (Override Mode)
Anda bisa memaksa mode tertentu tanpa mengubah `.env` melalui terminal (Powershell/CMD):

**Jalankan sebagai Client:**
```powershell
$env:APP_MODE="client"; .\temui-app.exe
```

**Jalankan sebagai Consultant:**
```powershell
$env:APP_MODE="consultant"; .\temui-app.exe
```

## 🌐 Akses Aplikasi
Buka browser dan akses:
`http://localhost:8080`

(Ganti port sesuai setting di .env)
