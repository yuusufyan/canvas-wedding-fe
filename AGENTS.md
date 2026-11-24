# AGENTS.md — canvas-wedding-fe

Aturan utama untuk semua kontributor di repo ini. Baca seluruh file ini sebelum mengubah
kode. Jika permintaan bertentangan dengan file ini, tanyakan pemilik repo; jangan
memilih sendiri.

## Project profile

Frontend platform undangan pernikahan digital "Niskala Daisy" (repo `canvas-wedding-fe`),
terhubung ke `canvas-wedding-nestjs` (NestJS, PostgreSQL, Redis). Cakupan:
landing publik dan demo undangan, login, manajemen peran/role (`/roles`) dan pengguna
(`/users`) untuk SuperAdmin; dua yang terakhir belum ada di backend dan dilayani mock. Dalam rencana bertahap
(`docs/features/niskala-ui/change-plan.md`): admin template/membership, area pelanggan
(beranda, budget, tamu/RSVP), dan editor Canvas. Fitur yang endpoint-nya belum ada di backend
dibangun terhadap klien API bertipe dengan data contoh (`src/api/mock`).

Status (2026-11-20): SPA Vue 3.5 dengan login, dashboard, manajemen user dan role terhubung
ke `canvas-wedding-api`, plus landing publik dan demo undangan (data contoh).

- **Bahasa & runtime:** TypeScript 6.0, Node.js (lokal: v26.13.0, npm 11.20.0;
  `engines`: `^22.18.0 || >=24.12.0`)
- **Framework:** Vue 3.5 (Composition API, `<script setup lang="ts">`) + Vite 8,
  `vue-router` 5, `pinia` 4. HTTP client: `fetch` bawaan browser lewat wrapper di
  `src/api/`.
- **Tampilan:** halaman aplikasi yang sudah ada memakai design system Vuexy (Bootstrap 5.1,
  Feather Icons, font Montserrat, tema `semi-dark-layout`). CSS, font, dan gambar Vuexy
  disalin dari aset skill `vuexy-html` ke `public/vuexy/` dan dimuat lewat `<link>` di
  `index.html`. jQuery dan JS Vuexy **tidak** dipakai; perilaku (menu, collapse, dropdown,
  modal) ditulis ulang di Vue. Identitas brand Niskala Daisy (burgundy, krem, emas) ada di satu
  berkas `src/styles/niskala.css` yang diimpor di `main.ts` setelah CSS Vuexy: token `--nk-*`,
  `@font-face`, dan kelas berawalan `nk-` untuk halaman publik. Font Inter, Cormorant
  Garamond, Jost, dan Great Vibes dipasang lokal di `public/fonts/` (OFL). Halaman Vuexy
  lama tetap Montserrat sampai dimigrasi per fase.
  Ikon: `feather-icons` 4.29 lewat `src/components/FeatherIcon.vue`; ikon yang tidak ada di
  Feather (mahkota, kilau, dll.) lewat `src/components/NkIcon.vue` (path Lucide, ISC).
- **Database / ORM:** tidak ada (semua data lewat API backend).
- **Layanan pendukung:** backend NestJS `canvas-wedding-nestjs` (lihat `Workspace`). Kontrak
  API diambil dari folder itu saja; `canvas-wedding-api` (Go) tidak lagi jadi acuan.
- **Arsitektur:** SPA, route di-lazy-load per view.
- **Entry point & URL API:** `src/main.ts`. FE memanggil backend NestJS langsung (tanpa proxy)
  ke `VITE_API_BASE_URL` (default dev `http://localhost:3000`, dibaca di `src/config.ts`).
  Backend tidak punya global prefix (route-nya `/auth/login`). CORS diatur di backend lewat
  env `CORS_ORIGIN` (daftar origin FE, dipisah koma; kosong = CORS mati). Build produksi tanpa
  `VITE_API_BASE_URL` memakai URL relatif (same-origin), jadi isi nilainya saat build.
  Backend NestJS baru punya `/auth/{login,refresh,logout,me}` dan `/health`; endpoint lain
  (register, verify-email, role, user, template, dst.) tetap `TODO(BE)` dan dilayani `src/api/mock`.

## Commands

Perintah bertanda ✓ sudah dijalankan dan lolos pada 2026-11-09.

| Tujuan | Perintah |
|---|---|
| install | `npm ci` |
| verify (gerbang utama) | `npm run verify` ✓ (`lint && format:check && test:cov && build`; `build` sudah termasuk type-check) |
| build | `npm run build` ✓ (`vue-tsc --build` + `vite build` paralel) |
| type-check | `npm run type-check` ✓ (`vue-tsc --build`) |
| lint (tanpa fix) | `npm run lint` ✓ (`oxlint . && eslint . --cache`) |
| lint-fix | `npm run lint:fix` |
| format-check | `npm run format:check` ✓ (Prettier, `src/` dan `e2e/`) |
| format | `npm run format` (menulis file) |
| test | `npm test` ✓ (`vitest run`) |
| test-cov | `npm run test:cov` ✓ (`vitest run --coverage`, provider v8) |
| dev server | `npm run dev` (`http://localhost:5173`) |
| e2e | `npx playwright test --project=chromium` ✓. `npm run test:e2e` menjalankan chromium, firefox, dan webkit; dua browser terakhir belum di-install (`npx playwright install`). |
| migration | tidak ada (frontend) |
| seed | tidak ada; seed data ada di backend (`npm run seed` di repo BE, jangan dijalankan tanpa instruksi) |
| dependency audit | `npm audit --omit=dev` |
| secret scan | `node ~/.claude/agent-kit/scripts/secret-scan.mjs` |
| env audit | `node ~/.claude/agent-kit/scripts/env-audit.mjs` |
| scope check | `node ~/.claude/agent-kit/scripts/scope-check.mjs <folder-fitur \| ->` |
| trace matrix | `node ~/.claude/agent-kit/scripts/trace-matrix.mjs <folder-fitur>` |

## Workspace

| Peran | Repo | Path relatif dari repo ini | AGENTS.md |
|---|---|---|---|
| fe | canvas-wedding-fe | . | ./AGENTS.md |
| be | canvas-wedding-nestjs | ../canvas-wedding-nestjs | ../canvas-wedding-nestjs/CLAUDE.md (bila ada) |

Repo backend dibaca dari path relatif di atas. Kontrak API diambil dari controller, DTO, dan
`src/common/` di `../canvas-wedding-nestjs/src/`. Perubahan kode backend dikerjakan di repo
backend mengikuti aturannya.

## Test environment

Frontend saja (tanpa backend) sudah berjalan: Playwright menyalakan `npm run dev` sendiri
(`webServer` di `playwright.config.ts`) dengan `VITE_USE_MOCK_API=true`, sehingga landing dan
demo dilayani data contoh dari `src/api/mock` (hanya mode dev, tidak masuk bundle produksi).
Mode uji manual: `window.__nkMock = 'empty' | 'error' | 'slow'`. Integrasi dengan backend
sungguhan belum ada; usulan minimal:

- Dependensi backend: di repo BE `npm run test:db:up` (PostgreSQL 17 port 5433, Redis 7
  port 6380, dari `docker-compose.test.yml`), migration ke DB test, lalu backend
  dijalankan dengan `test/test.env` (nilai palsu). TODO(verifikasi): BE belum punya
  script "start dengan env test" untuk E2E lintas repo.
- Backend untuk test: base URL `http://localhost:3000` (`VITE_API_BASE_URL`); BE
  punya `GET /health`. TODO(verifikasi): script menjalankan BE dengan env test untuk E2E lintas repo.
- Frontend untuk E2E: `npm run dev` (Vite, default `http://localhost:5173`) memanggil
  backend langsung; `CORS_ORIGIN` backend harus berisi `http://localhost:5173`.
- File env test: usulan `e2e/e2e.env` (nilai palsu: base URL, username/password user test).
  Variabel yang terbaca di browser wajib berawalan `VITE_` dan tidak boleh berisi secret.
- Identitas test per role: SuperAdmin dibuat lewat CLI bootstrap BE (`make bootstrap-superadmin`);
  token lewat `POST /auth/login` (`{ email, password }`). Data test memakai domain
  `contoh.test`; password test palsu ada di env test BE.
- Data seed test: hanya role `SuperAdmin` dari migration BE; data template/undangan fiktif
  datang dari mock FE sampai endpoint-nya ada.
- Framework: unit/component Vitest 4 + `@vue/test-utils` + jsdom
  (`src/**/__tests__/*.spec.ts`), E2E Playwright 1.65 (`e2e/*.spec.ts`). Mock API di
  component test: TODO(verifikasi) (usulan MSW, dependency baru).
- Bersih-bersih: di repo BE `npm run test:db:down`.

## Directory map

Folder bertanda * belum ada (usulan).

```
index.html             <link> CSS Vuexy, class tema di <html>/<body>
public/
  vuexy/               CSS, font Montserrat, logo, ilustrasi Vuexy (salinan aset skill; jangan diedit)
  fonts/               Inter, Cormorant Garamond, Jost, Great Vibes (woff2 subset Latin, OFL)
  brand/               logo Niskala Daisy (burgundy dan putih)
src/
  main.ts              bootstrap app, router, pinia
  App.vue              hanya <RouterView>
  router/              route (lazy-load) + guard login & permission*
  config.ts            satu-satunya pembaca import.meta.env (pemuat mock API)
  styles/niskala.css   token brand, @font-face, kelas nk- (satu-satunya CSS Niskala)
  layouts/             BlankLayout (login, error); VerticalLayout (sidebar semi-dark, navbar);
                       PublicLayout (landing: header, footer, menu hamburger)
  views/               halaman per domain; landing/ berisi section LandingView
                       (hero, statistik, cara kerja, editor, galeri, harga, FAQ, CTA)
  components/          komponen bersama: FeatherIcon, NkIcon, InvitationRenderer (baca-saja), DemoPlayer,
                       AccordionList, ErrorState, EmptyState; tabel paginasi*, dialog konfirmasi*
  components/__tests__ component test
  api/*                HTTP client (base URL, bearer token, refresh, unwrap envelope) + modul per resource
  api/mock/            fetch tiruan (data contoh) untuk endpoint yang belum ada di BE; hanya dev
  stores/*             pinia: auth (token, profil, role), dll
  composables/*        logika reusable (usePermission, useCountdown, usePlayer, useAsyncState)
  types/*              tipe response API (sinkron dengan DTO backend)
  constants/*          path API, role, konten landing, path ikon NkIcon
e2e/                   Playwright
```

## Conventions

Belum ada modul fitur sebagai acuan. Acuan sementara: `src/components/FeatherIcon.vue`
(prop bertipe ketat, aksesibilitas) dan `src/views/NotFoundView.vue` + `BlankLayout.vue`
(markup Vuexy di Vue). Pola yang ditetapkan:

- Format: Prettier (`semi: false`, `singleQuote: true`, `printWidth: 100`).
- Import dari `src` memakai alias `@/`.

- Komponen: SFC `<script setup lang="ts">`, file PascalCase (`InvitationRenderer.vue`), view
  berakhiran `View` (`DemoView.vue`), composable `useXxx.ts`, store `useXxxStore`.
- Panggilan API hanya lewat `src/api/`; komponen tidak memanggil `fetch` langsung.
- Backend NestJS memakai envelope nest-common untuk semua respons:
  `{ code, status, message, data, meta? }` (error: `status: 'error'`). `apiRequest` membuka
  `data`; `meta` paginasi snake_case (`total_pages`, `total_results`), lihat `src/types/api.ts`.
  Isi `data` camelCase (`accessToken`, `refreshToken`, `expiresIn`). 204 tanpa body.
- Endpoint `TODO(BE)` yang dilayani mock memakai envelope yang sama. List paginasi: query
  `page` (min 1) dan `limit` (1–100, default 10). Saat backend menambah endpoint-nya, samakan
  tipenya dengan isi `data` dari BE.
- Field response dipakai apa adanya di tipe; jangan dikonversi diam-diam.
- `role` di sesi login (`/auth/login`, `/auth/me`) berupa string huruf kecil (`'superadmin'`,
  konstanta `SESSION_ROLES`), bukan objek `{ id, name }`.
- Nama role, status, dan konstanta domain disimpan di `src/constants/`.
- Uang: tampilkan dari nilai server, format dengan
  `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`; total tidak
  dihitung ulang dari input untuk dikirim ke server.
- Endpoint yang belum ada di BE: modul `src/api/*` ditandai `TODO(BE)` dan dilayani
  `src/api/mock` saat dev (`VITE_USE_MOCK_API=true`); bentuk tipe hanya draf sampai Swagger BE ada.
  Nilai dari data (warna, teks) yang masuk ke `style` difilter, tidak ada `v-html`.
- Teks UI berbahasa Indonesia.
- Tampilan halaman aplikasi (login, dashboard, user, role): ikuti skill `anthropic-skills:vuexy-html` (baca `SKILL.md`,
  `references/18-craft-anti-slop.md`, `19-states-a11y.md`, dan referensi komponen yang
  dipakai) untuk struktur markup, kelas, warna, ikon, dan copy. Penerjemahan ke Vue:
  - markup dan kelas Vuexy dipakai apa adanya di `<template>`; page shell
    (`.app-content` → `.content-wrapper` → `.content-body`, sidebar, navbar) ada di
    `src/layouts/`; layout mengatur class `<body>` (misal `blank-page`) saat mount/unmount;
  - `<html>` tanpa class `loading` (class itu dilepas oleh `app.js` Vuexy, yang tidak dipakai);
  - path aset ditulis absolut: `/vuexy/app-assets/...`;
  - `<i data-feather>` + `feather.replace()` diganti `<FeatherIcon name="..." />`
    (`aria-hidden` otomatis; beri `label` untuk tombol ikon tanpa teks);
  - tanpa jQuery dan tanpa `app.js`/`app-menu.js` Vuexy; state UI (menu, modal,
    dropdown) dikelola reaktif di Vue;
  - tanpa `<style>` per komponen untuk warna/ukuran/spasi; hanya kelas Vuexy
    (`html { font-size: 14px }`, spasi `-25/-50/-75`, warna dari 9 nama semantik);
  - script `build_page.py`/`render_check.py` dari skill tidak berlaku langsung untuk SFC;
    verifikasi visual lewat Playwright (screenshot desktop 1440 dan mobile 390).
- Halaman publik Niskala (landing, demo, nanti auth): kelas `nk-` dan token `--nk-*` dari
  `src/styles/niskala.css`, grid/utilitas Bootstrap 5.1 seperlunya (titik henti 576/768/992/1200),
  tanpa `<style>` per komponen dan tanpa hex di luar berkas itu. Selector reset memakai
  `:where()` agar kelas `nk-` menang dari selector elemen Vuexy. Fokus keyboard terlihat,
  `prefers-reduced-motion` dihormati, tap target minimal 44 px di layar kecil.
- Commit: Conventional Commits seperti repo backend (`feat(landing): ...`, `fix: ...`),
  subjek huruf kecil, tanpa titik di akhir.

## Shared libraries

Tidak ada. (`go-common` hanya dipakai backend.)

## Data protection

Kelas data dan aturan penanganannya. Setiap field baru wajib diberi kelas di
`security.md` fitur.

| Kelas | Contoh | Penyimpanan | Log | Response API | UI |
|---|---|---|---|---|---|
| Public | nama produk, harga | biasa | boleh | boleh | boleh |
| Internal | ID internal, status, timestamp | biasa | boleh | sesuai kebutuhan | sesuai kebutuhan |
| Confidential | nama, email, nomor HP, alamat | biasa, akses dibatasi | hanya tersamar | pemilik/role berhak saja | tersamar bila bukan pemilik |
| Restricted | password, token, NIK, data pembayaran, data kesehatan | hash (password) atau terenkripsi | **tidak pernah** | **tidak pernah** (kecuali data milik sendiri yang memang diminta) | tidak / tersamar |

Aturan umum:
- **Minimisasi:** jangan kumpulkan data yang tidak dibutuhkan tujuan fitur.
- **Least privilege:** akses data Confidential/Restricted hanya untuk role yang tercatat
  di matriks izin.
- **Audit trail:** create/update/delete pada data Confidential/Restricted tercatat
  (siapa, kapan, apa) tanpa menyimpan nilainya.
- **Retensi:** data dihapus/dianonimkan sesuai kebutuhan bisnis; soft delete tidak sama
  dengan penghapusan.
- Data pribadi sungguhan tidak boleh dipakai di test, seed, fixture, atau contoh.

Inventaris data yang ditampilkan/disimpan di frontend (sumber: entity backend):

| Data | Kelas | Catatan |
|---|---|---|
| password (form login, buat/ubah user) | Restricted | hanya di state form, dikosongkan setelah submit; tidak pernah di log/console/storage |
| access_token, refresh_token | Restricted | access token di memori; refresh token di `sessionStorage`; tidak pernah di log/URL |
| users.email | Confidential | tampil di profil sendiri dan halaman manajemen user |
| users.name, role, is_active | Internal | |
| roles.name, description | Internal | |

## Change control

Hal berikut **wajib dikonfirmasi pemilik repo sebelum ditambahkan**, dan didaftarkan di
`docs/features/<slug>/change-plan.md` (atau ditanyakan langsung untuk pekerjaan kecil):

- tabel, kolom, index, migration, atau perubahan tipe/constraint;
- endpoint baru atau perubahan kontrak endpoint yang sudah ada;
- function, method, atau tipe publik (exported) baru, termasuk paket/modul baru;
- dependency baru (termasuk dev dependency) atau upgrade versi major;
- env var / konfigurasi baru, job, queue, atau cron baru;
- penghapusan atau penggantian nama hal publik di atas;
- perubahan di luar file/modul yang terkait fitur (refactor, rename massal).

Tambahan untuk frontend: route/halaman baru, komponen bersama baru di `src/components/`,
store pinia baru, variabel `VITE_*` baru, dan CSS di luar kelas Vuexy (warna, font, ikon,
atau aturan tambahan selain lapisan craft bawaan aset).

Tidak perlu konfirmasi: function privat/helper internal di file yang sudah direncanakan,
test, dan dokumen. Tetap terapkan YAGNI: tidak ada abstraksi, opsi, atau kolom "untuk
nanti". Pemeriksaan otomatis: `node ~/.claude/agent-kit/scripts/scope-check.mjs <folder-fitur | ->`.

## Engineering standards

- Satu fitur/perbaikan per branch; tidak ada commit langsung ke branch utama.
- Commit kecil dan logis; pesan commit mengikuti format di `Conventions`.
- Setiap perubahan lolos `verify`, `secret-scan`, dan `scope-check` sebelum PR.
- Error ke user generik dan berbahasa Indonesia; detail teknis tidak ditampilkan.
- Dependency dipin versinya dan dicek kerentanannya (`dependency audit`).
- Konfigurasi dari env `VITE_*`; tidak ada secret di bundle frontend.
- Setiap layar data punya state loading, kosong, error, dan sukses.
- Tombol submit dinonaktifkan selama request berjalan (cegah klik ganda); backend tetap
  sumber kebenaran untuk data dan status.

## Principles

Berlaku untuk setiap kode baru atau kode yang diubah (tidak perlu refactor kode lama
yang tidak disentuh, kecuali diminta):

1. **Layer tipis di tepi.** Controller/handler hanya memetakan input ke service dan
   membungkus output. Aturan bisnis, query, dan validasi lintas entity ada di service.
   Di frontend: view tipis; logika di composable/store, akses API di `src/api/`.
2. **Batas modul jelas.** Modul lain diakses lewat API publiknya (service yang
   di-export), bukan lewat penyimpanan data internalnya. Hindari dependensi melingkar.
3. **Tipe ketat.** Tanpa tipe longgar baru (`any`, `object`, `dict` tanpa bentuk);
   buat tipe/interface/schema.
4. **Konfigurasi terpusat.** Baca konfigurasi lewat mekanisme config project, bukan
   langsung dari environment di sembarang tempat. Secret tidak boleh punya nilai default.
   Di frontend: `import.meta.env` hanya dibaca di satu modul config.
5. **Tanpa magic string.** Nama role, permission, status, dan konstanta domain
   disimpan sebagai enum/konstanta di satu tempat.
6. **Reuse sebelum menulis.** Perluas base class/utilitas yang ada; jangan menyalin
   blok logika antar modul.
7. **Siap data besar.** List wajib paginasi dengan batas maksimum; tidak ada query
   tanpa batas. Relasi tidak eager-load secara default; hindari N+1 dan query di
   dalam loop. Index untuk foreign key dan kolom filter.
   Di frontend: semua list memakai paginasi server (`limit` ≤ 100); tidak mengambil
   semua data lalu memfilter di browser.
8. **Konsistensi data.** Penulisan ke lebih dari satu tabel/sumber memakai transaksi.
9. **Error eksplisit.** Gunakan tipe error yang tepat dengan pesan jelas; jangan
   menelan error diam-diam.
10. **Ukuran wajar.** Fungsi panjang dipecah; file di atas ~300 baris adalah sinyal
    untuk memecah tanggung jawab.
11. **Kontrak API stabil.** Perubahan bentuk response atau route yang sudah ada adalah
    breaking change dan wajib disebutkan.
12. **Testable by design.** Dependency di-inject, bukan dibuat di dalam, supaya
    mudah di-mock.

## Security model

Penegakan keamanan ada di backend; frontend hanya menyembunyikan UI dan tidak boleh
dianggap sebagai kontrol akses.

- Autentikasi: `POST /auth/login` (`{ email, password }`) mengembalikan
  `{ accessToken, refreshToken, tokenType: 'Bearer', expiresIn, user }`. Access token
  dikirim sebagai header `Authorization: Bearer <token>`. Refresh lewat
  `POST /auth/refresh` (`{ refreshToken }`), logout `POST /auth/logout`, profil
  `GET /auth/me`. Default backend: access 15 menit, refresh 7 hari (sliding), sesi
  absolut 30 hari.
- Penyimpanan token: TODO(verifikasi). Usulan: access token di memori (store pinia),
  refresh token di `sessionStorage`; tidak memakai `localStorage`. Backend belum
  mendukung cookie httpOnly.
- Otorisasi UI: menu, route, dan tombol ditampilkan berdasarkan role dari `GET /auth/me`
  (saat ini hanya `SuperAdmin` yang dibedakan; `usePermission`). Guard router mengarahkan ke
  login bila tidak ada sesi.
- Isolasi pemilik: dari backend (data milik pengguna lain → 404). Frontend menampilkan 404 sebagai "tidak ditemukan".
- 401: coba refresh sekali, gagal → hapus sesi dan arahkan ke login. 403: tampilkan
  pesan tidak punya akses.
- Halaman publik (disengaja): landing `/`, demo undangan `/demo/:slug`, dan login. Landing dan
  demo hanya menampilkan konten pemasaran/template contoh, tanpa data pelanggan, dan tidak
  memanggil endpoint terautentikasi (permintaan publik tanpa header Authorization). Rencana: halaman
  Daftar `/daftar` (menunggu endpoint registrasi di BE). Dashboard lama ada di `/dashboard` (butuh sesi).
- Field sensitif (tidak boleh di log/console/URL/storage permanen): password, token.
- Secret: tidak ada secret di frontend. Variabel `VITE_*` masuk ke bundle dan dianggap
  publik.
- XSS: tidak memakai `v-html` untuk data dari API.

## Quality ratchet

Baseline (2026-11-20, sesudah landing dan demo): lint oxlint + ESLint **0 error / 0 warning**;
coverage **90,75% statements / 86,71% branches / 88,88% functions / 91,8% lines** (sebelum
landing: 86,9 / 81,51 / 83,21 / 88,5). `App.vue`, `NotFoundView`, dan `VerticalLayout` sebagian
dicakup E2E. Threshold belum dipasang di `vitest.config.ts`.

- Jumlah warning lint **tidak boleh naik**; jika turun, perbarui batasnya.
- Threshold coverage **tidak boleh turun**; jika coverage naik signifikan, naikkan.
- Target file baru (store, composable, modul API, guard router): minimal 80% lines, 70% branches.
- Dilarang menambah suppress lint/type/coverage tanpa komentar alasan di baris yang sama.
- Usulan awal: ESLint `--max-warnings 0` dan `coverage.thresholds` Vitest 80% lines /
  70% branches.

## Testing

- Unit/component: Vitest + `@vue/test-utils` + jsdom, `src/**/__tests__/*.spec.ts`
  (aturan `@vitest/eslint-plugin` hanya aktif di folder `__tests__`). Acuan:
  `src/components/__tests__/FeatherIcon.spec.ts`. API di-mock.
- E2E: Playwright `e2e/*.spec.ts`. Acuan: `e2e/vue.spec.ts` (juga memeriksa font
  Montserrat terpasang). Rencana: terhadap backend sungguhan dengan DB test.
- Wajib ada test: login gagal/berhasil, redirect ke login saat 401, refresh token,
  menu/tombol tersembunyi tanpa izin, klik ganda submit hanya mengirim satu request, state
  kosong/error/loading di setiap layar data, dan layar publik tanpa scroll horizontal di
  390/768/1440 px.
- ID test case dari test plan (TC-API-01, TC-E2E-01) ditulis di nama test.

## Hard rules

- Jangan pernah membaca, menampilkan, membuat ulang, atau commit file credential atau
  nilai secret (`.env*` selain file contoh, key, sertifikat, file credential).
  Untuk audit gunakan `secret-scan` dan `env-audit`.
- Jangan hardcode secret atau memberinya nilai fallback.
- Jangan mengembalikan field sensitif di response, dan jangan menyimpannya di log
  maupun audit trail.
- Setiap endpoint baru wajib diautentikasi dan diotorisasi, kecuali memang publik dan
  dinyatakan eksplisit di `Security model`.
- Setiap query data milik tenant/pemilik wajib difilter ke pemiliknya, termasuk operasi baca.
- Jangan mengedit output build, dependency ter-vendor, lockfile (kecuali menambah
  dependency atas persetujuan), atau file hasil generate secara manual.
- Jangan menjalankan migration, seed, deploy, atau perintah yang menyentuh database
  atau layanan eksternal tanpa instruksi eksplisit dari user.
- Jangan menambah dependency baru tanpa menyebutkannya dan alasannya ke user.
- Jangan mengubah file di `~/.claude/agent-kit/`, git hook yang dipasang agent-kit, atau
  `.claude/secret-policy*.json`.
- **Kepemilikan kode:** kode, komentar, nama test, pesan commit, deskripsi PR, dan
  dokumen di repo ditulis sebagai karya pemilik repo/tim. Dilarang menyebut AI, Claude,
  agent, nama tool, atau `AGENTS.md`, dan dilarang menambah trailer `Co-Authored-By`
  atau "Generated with". Commit memakai identitas git yang sudah dikonfigurasi; jangan
  mengubah konfigurasi git.
- Jangan menambah apa pun yang tercantum di `Change control` tanpa konfirmasi.
- Jangan mengubah kode repo backend dari repo ini; perubahan backend dikerjakan di repo
  backend mengikuti AGENTS.md backend.
- Jangan memakai `v-html` untuk data dari API dan jangan menaruh token di URL.
- Jangan menambah jQuery atau library UI lain (Vuetify, PrimeVue, Tailwind, dll); UI
  memakai kelas Vuexy dan, untuk halaman publik Niskala, `src/styles/niskala.css`. Jangan
  mengedit file Vuexy yang disalin di `public/vuexy/`.

## Known issues

1. **Integrasi (backend):** BE memakai CORS dengan origin eksplisit (`CORS_ORIGIN`, dipisah
   koma). FE memanggil BE langsung. Production: isi `VITE_API_BASE_URL` saat build dan daftarkan
   origin FE di `CORS_ORIGIN` BE (TODO(verifikasi) di lingkungan deploy).
2. **Integrasi (backend):** belum ada script menjalankan backend dengan env test untuk E2E
   lintas repo. Landing dan demo masih memakai data contoh (`src/api/mock`) karena endpoint
   publik template belum ada di BE.
3. **Dependency (dev, moderate):** `npm audit` melaporkan 16 temuan moderate di dev
   dependency scaffold; `npm audit --omit=dev` bersih (0). TODO(verifikasi): tinjau
   paket asalnya.
4. **Inkonsistensi (aset):** `public/vuexy/app-assets/vendors/css/vendors.min.css`
   merujuk ikon bendera `fonts/flag-icon-css/` yang tidak ikut di aset skill. Tidak
   berdampak selama kelas `flag-icon` tidak dipakai.

Selesai: `.gitignore` dari scaffold + `.env`, `.env.*` (kecuali `.env.example`),
`playwright-report/`, `test-results/` (2026-11-09).

Jika pekerjaanmu menyentuh area di atas, sebutkan nomornya di ringkasan akhir.

## Definition of done

1. Perintah `verify` lolos (build, lint tanpa error dan tanpa menambah warning,
   format, test, coverage threshold).
2. `secret-scan` tidak menambah temuan baru dan `scope-check` bersih (atau setiap item
   sudah dikonfirmasi).
3. Logika baru disertai test sesuai target coverage file baru.
4. Tidak ada pelanggaran `Hard rules`, `Principles`, maupun `Security model`.
5. Ringkasan akhir berisi: file yang diubah, cara menguji, angka lint dan coverage
   sebelum/sesudah, breaking change (jika ada), dan known issue terkait.
