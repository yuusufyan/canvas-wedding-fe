# Canvas Wedding — Frontend (User Management)

Frontend SPA untuk panel administrasi dan **User Management** platform **Canvas Wedding**, terhubung langsung ke backend [`canvas-wedding-api`](../canvas-wedding-api).

Stack utama:
- **Vue 3.5** (Composition API, `<script setup lang="ts">`, TypeScript 6)
- **Vite 8** (Dev Server & Bundler)
- **Pinia 4** (State Management: Sesi Autentikasi)
- **Vue Router 5** (Navigasi & Route Guard)
- **Vuexy Design System** (Bootstrap 5.1, Feather Icons, font Montserrat)

---

## 1. Fitur Utama

- 🔐 **Autentikasi & Sesi:**
  - Login email & kata sandi dengan validasi keamanan.
  - Penyimpanan token aman (Access token di memori aplikasi, refresh token di `sessionStorage`).
  - Pembaruan token otomatis (*silent refresh*) saat kedaluwarsa.
  - Logout instan yang mencabut sesi di backend Redis.
- 👥 **Manajemen Pengguna (`/users`):**
  - Tabel pengguna dengan paginasi server.
  - Tambah pengguna baru dan asosiasi ke peran tertentu.
  - Ubah informasi pengguna (nama, email, role, aktivasi/deaktivasi status, dan reset password).
  - Hapus pengguna (proteksi akun diri sendiri tidak dapat dihapus).
- 🛡️ **Manajemen Peran / Role (`/roles`):**
  - Daftar peran dan hak akses sistem.
  - Tambah peran baru (validasi karakter alfanumerik, spasi, dash, dan underscore).
  - Ubah deskripsi dan nama peran.
  - Hapus peran kustom (peran sistem `SuperAdmin` diproteksi dari penghapusan).
- 🧭 **Proteksi Navigasi (Route Guard):**
  - *Default-deny*: Halaman admin terlindungi dan membutuhkan sesi login yang valid.
  - Pembatasan menu dan route khusus `SuperAdmin`.

---

## 2. Prasyarat Sistem

- **Node.js** `^22.18.0` atau `>= 24.12.0`
- **npm** `>= 10`
- Backend **`canvas-wedding-api`** berjalan di `http://localhost:8080`

Struktur folder yang direkomendasikan:
```text
Canvas-Wedding/
├── canvas-wedding-api/   # Backend Go API (port 8080)
└── canvas-wedding-fe/    # Frontend Vue (repo ini, port 5173)
```

---

## 3. Konfigurasi Environment

Secara default, proxy Vite sudah diarahkan ke backend Go di `http://localhost:8080`.

Jika backend berjalan di port berbeda, Anda dapat menyalin `.env.example`:

```bash
cp .env.example .env
```

Atur variabel `API_PROXY_TARGET`:
```env
API_PROXY_TARGET=http://localhost:8080
```

> **Catatan:** Variabel ini hanya dibaca oleh dev server Vite untuk meneruskan request `/api` ke backend API dan tidak dimasukkan ke bundle browser.

---

## 4. Panduan Menjalankan

```bash
# 1. Pasang dependensi
npm ci

# 2. Jalankan server development
npm run dev
```

Aplikasi dapat diakses di browser melalui: `http://localhost:5173`

---

## 5. Perintah Pengujian & Verifikasi

Proyek ini menerapkan standar kualitas kode yang ketat (*zero warning/error lint*, *type safety*, dan *code coverage*):

| Perintah | Deskripsi |
|---|---|
| `npm run verify` | Menjalankan seluruh gerbang: lint, format check, coverage test, dan build |
| `npm test` | Menjalankan unit test dengan Vitest |
| `npm run test:cov` | Menjalankan pengujian dengan laporan code coverage v8 |
| `npm run type-check` | Pengecekan tipe statis menggunakan `vue-tsc` |
| `npm run lint` | Analisis kode menggunakan `oxlint` dan `eslint` |
| `npm run format` | Memformat kode secara otomatis dengan Prettier |
| `npm run build` | Menghasilkan bundel produksi di direktori `dist/` |
