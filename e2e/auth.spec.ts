import { test, expect, type Page } from '@playwright/test'

type MockMode = 'rate-limit' | 'unverified' | 'token-expired' | 'network' | 'slow'

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 992, height: 800 },
  { width: 1440, height: 900 },
]

const TOKEN = 'A'.repeat(43)
const EXPIRED_TOKEN = 'x'.repeat(43)

async function useMock(page: Page, mode: MockMode): Promise<void> {
  await page.addInitScript((value) => {
    ;(window as unknown as { __nkMock: string }).__nkMock = value
  }, mode)
}

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

const FAKE_PASSWORD = 'rahasia123' // secret-scan:ignore nilai palsu

async function login(page: Page, email = 'admin@contoh.test', password = FAKE_PASSWORD) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^Masuk/ }).click()
}

async function signUp(page: Page) {
  await page.goto('/daftar')
  await page.getByLabel('Nama lengkap').fill('Hilda Prameswari')
  await page.getByLabel('Email').fill('hilda@contoh.test')
  await page.getByLabel('Kata sandi', { exact: true }).fill('Niskala2026!')
  await page.getByRole('button', { name: /Buat akun gratis/ }).click()
}

for (const viewport of VIEWPORTS) {
  test.describe(`auth ${viewport.width}px`, () => {
    test.use({ viewport })

    test(`TC-UI-F4-60: masuk, daftar, cek email, dan aktivasi ${viewport.width}px tanpa scroll horizontal`, async ({
      page,
    }) => {
      for (const path of ['/login', '/daftar', '/aktivasi']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await hasHorizontalScroll(page)).toBe(false)
      }
      await signUp(page)
      await expect(page.getByRole('heading', { name: 'Cek email-mu' })).toBeVisible()
      expect(await hasHorizontalScroll(page)).toBe(false)
    })

    // Dua layout dipilih saat deklarasi test, bukan di dalam test.
    if (viewport.width >= 992) {
      test(`TC-UI-F4-61: panel brand 640px tampil di ${viewport.width}px`, async ({ page }) => {
        await page.goto('/login')
        const brand = page.locator('.nk-auth__brand')
        await expect(brand).toBeVisible()
        expect((await brand.boundingBox())!.width).toBeCloseTo(640, 0)
        await expect(page.locator('.nk-auth__logo')).toBeHidden()
      })
    } else {
      test(`TC-UI-F4-61: panel brand tersembunyi dan form maksimal 420px di ${viewport.width}px`, async ({
        page,
      }) => {
        await page.goto('/login')
        await expect(page.locator('.nk-auth__brand')).toBeHidden()
        await expect(page.locator('.nk-auth__logo')).toBeVisible()
        const card = (await page.locator('.nk-auth__card').boundingBox())!
        expect(card.width).toBeLessThanOrEqual(420)
      })
    }
  })
}

test.describe('masuk', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('TC-UI-F4-62: login SuperAdmin berhasil lalu diarahkan ke halaman admin', async ({
    page,
  }) => {
    await page.goto('/login')
    await login(page)

    await expect(page).toHaveURL(/\/dashboard$/)
    expect(await page.evaluate(() => sessionStorage.getItem('canvas-wedding.refresh-token'))).toBe(
      'mock-refresh-token',
    )
  })

  test('TC-UI-F4-63: sandi salah menampilkan satu banner generik dan mengosongkan kata sandi', async ({
    page,
  }) => {
    await page.goto('/login')
    await login(page, 'salah@contoh.test', 'apa-saja')

    await expect(page.getByRole('alert')).toHaveText('Email atau kata sandi salah')
    await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Email')).toHaveValue('salah@contoh.test')
    await expect(page).toHaveURL(/\/login$/)
    expect(page.url()).not.toContain('apa-saja')
  })

  test('TC-UI-F4-64: batas percobaan (429) menampilkan banner 15 menit', async ({ page }) => {
    await useMock(page, 'rate-limit')
    await page.goto('/login')
    await login(page)

    await expect(page.getByRole('alert')).toHaveText(
      'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
    )
  })

  test('TC-UI-F4-65: akun belum aktif (403) menampilkan banner kuning dan kirim ulang dengan hitung mundur', async ({
    page,
  }) => {
    await useMock(page, 'unverified')
    await page.goto('/login')
    await login(page)

    const banner = page.locator('.nk-alert--warning')
    await expect(banner).toContainText('Akunmu belum diaktifkan')
    await banner.getByRole('button', { name: 'Kirim ulang tautan' }).click()
    await expect(banner).toContainText('Jika akunmu perlu diaktifkan')
    await expect(banner.getByRole('button', { name: 'Kirim ulang tautan' })).toBeDisabled()
    await expect(banner).toContainText('Tersedia lagi dalam 00:')
  })

  test('TC-UI-F4-66: jaringan putus menampilkan pesan generik', async ({ page }) => {
    await useMock(page, 'network')
    await page.goto('/login')
    await login(page)

    await expect(page.getByRole('alert')).toContainText('Tidak bisa terhubung ke server')
  })

  test('TC-UI-F4-67: tombol tampilkan kata sandi, urutan tab, dan tautan Daftar gratis', async ({
    page,
  }) => {
    await page.goto('/login')
    const password = page.getByLabel('Kata sandi', { exact: true })
    await password.fill('rahasia123')
    await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click()
    await expect(password).toHaveAttribute('type', 'text')

    await page.getByLabel('Email').focus()
    await page.keyboard.press('Tab')
    await expect(password).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Sembunyikan kata sandi' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /^Masuk/ })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Daftar gratis' })).toBeFocused()

    await page.getByRole('link', { name: 'Daftar gratis' }).click()
    await expect(page).toHaveURL(/\/daftar$/)
  })
})

test.describe('daftar dan cek email', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('TC-UI-F4-68: validasi per field, indikator kekuatan, dan tombol tampilkan kata sandi', async ({
    page,
  }) => {
    await page.goto('/daftar')
    await page.getByLabel('Email').fill('hilda@')
    await page.getByLabel('Kata sandi', { exact: true }).fill('abc12')
    await expect(page.getByTestId('password-strength')).toContainText('Lemah')
    await page.getByRole('button', { name: /Buat akun gratis/ }).click()

    await expect(page.getByText('Nama lengkap wajib diisi.')).toBeVisible()
    await expect(page.getByText('Format email tidak valid.')).toBeVisible()
    await expect(page.getByText('Kata sandi minimal 8 karakter.')).toBeVisible()
    await expect(page.getByLabel('Nama lengkap')).toBeFocused()

    await page.getByLabel('Kata sandi', { exact: true }).fill('Niskala2026!')
    await expect(page.getByTestId('password-strength')).toContainText('Sangat kuat')
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0)
  })

  test('TC-UI-F4-69: sukses daftar membuka Cek Email dengan email di memori, bukan di URL atau storage', async ({
    page,
  }) => {
    await signUp(page)

    await expect(page).toHaveURL(/\/cek-email$/)
    expect(page.url()).not.toContain('hilda')
    await expect(page.getByTestId('pending-email')).toHaveText('hilda@contoh.test')
    await expect(page.getByTestId('resend-countdown')).toContainText('Kirim ulang tersedia dalam 0')
    await expect(page.getByRole('button', { name: /Kirim ulang email/ })).toBeDisabled()
    const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))
    expect(stored).not.toContain('hilda')
    expect(stored).not.toContain('Niskala2026')
  })

  test('TC-UI-F4-70: email yang sudah terdaftar menghasilkan alur yang sama persis', async ({
    page,
  }) => {
    await page.goto('/daftar')
    await page.getByLabel('Nama lengkap').fill('Admin Utama')
    await page.getByLabel('Email').fill('admin@contoh.test')
    await page.getByLabel('Kata sandi', { exact: true }).fill('Niskala2026!')
    await page.getByRole('button', { name: /Buat akun gratis/ }).click()

    await expect(page).toHaveURL(/\/cek-email$/)
    await expect(page.getByRole('heading', { name: 'Cek email-mu' })).toBeVisible()
    await expect(page.getByText(/sudah terdaftar|sudah dipakai/i)).toHaveCount(0)
  })

  test('TC-UI-F4-71: muat ulang Cek Email menampilkan versi generik tanpa alamat', async ({
    page,
  }) => {
    await signUp(page)
    await expect(page).toHaveURL(/\/cek-email$/)

    await page.reload()

    await expect(page.getByText('email yang kamu daftarkan')).toBeVisible()
    await expect(page.getByTestId('pending-email')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Minta tautan baru' })).toBeVisible()
  })

  test('TC-UI-F4-72: tautan Ubah kembali ke Daftar dan Masuk ke Masuk', async ({ page }) => {
    await signUp(page)

    await page.getByRole('link', { name: 'Ubah' }).click()
    await expect(page).toHaveURL(/\/daftar$/)
    await page.goBack()
    await page.getByRole('link', { name: 'Masuk' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('TC-UI-F4-73: batas permintaan daftar (429) dan jaringan putus menampilkan banner generik', async ({
    page,
  }) => {
    await useMock(page, 'rate-limit')
    await signUp(page)
    await expect(page.getByRole('alert')).toContainText('Terlalu banyak percobaan')
    await expect(page).toHaveURL(/\/daftar$/)

    const offline = await page.context().newPage()
    await useMock(offline, 'network')
    await signUp(offline)
    await expect(offline.getByRole('alert')).toContainText('Tidak bisa terhubung ke server')
  })

  test('TC-UI-F4-74: tombol Mulai gratis di landing mengarah ke Daftar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('banner').getByRole('link', { name: 'Mulai gratis' }).click()

    await expect(page).toHaveURL(/\/daftar$/)
  })
})

test.describe('aktivasi', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('TC-UI-F4-75: token valid: hash dihapus dari URL, tampil berhasil, lalu ke Masuk', async ({
    page,
  }) => {
    const bodies: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/auth/verify-email')) {
        bodies.push(request.method() + ' ' + request.url())
      }
    })
    await page.goto(`/aktivasi#token=${TOKEN}`)

    await expect(page.getByRole('heading', { name: 'Akunmu sudah aktif' })).toBeVisible()
    expect(page.url()).not.toContain(TOKEN)
    expect(page.url()).not.toContain('#')
    const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))
    expect(stored).not.toContain(TOKEN)

    await page.getByRole('link', { name: /Masuk sekarang/ }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(bodies.every((entry) => !entry.includes(TOKEN))).toBe(true)
  })

  test('TC-UI-F4-76: memproses terlihat selama verifikasi berjalan', async ({ page }) => {
    await useMock(page, 'slow')
    await page.goto(`/aktivasi#token=${TOKEN}`)

    await expect(page.getByRole('heading', { name: 'Mengaktifkan akunmu…' })).toBeVisible()
    expect(page.url()).not.toContain(TOKEN)
  })

  test('TC-UI-F4-77: token kedaluwarsa, mode token-expired, dan tanpa token menampilkan satu hasil yang sama', async ({
    page,
  }) => {
    await page.goto(`/aktivasi#token=${EXPIRED_TOKEN}`)
    await expect(page.getByRole('heading', { name: 'Tautan sudah tidak berlaku' })).toBeVisible()
    expect(page.url()).not.toContain(EXPIRED_TOKEN)

    const expired = await page.context().newPage()
    await useMock(expired, 'token-expired')
    await expired.goto(`/aktivasi#token=${TOKEN}`)
    await expect(expired.getByRole('heading', { name: 'Tautan sudah tidak berlaku' })).toBeVisible()

    const none = await page.context().newPage()
    await none.goto('/aktivasi')
    await expect(none.getByRole('heading', { name: 'Tautan sudah tidak berlaku' })).toBeVisible()
  })

  test('TC-UI-F4-78: kirim tautan baru dengan email jawabannya selalu generik', async ({
    page,
  }) => {
    await page.goto(`/aktivasi#token=${EXPIRED_TOKEN}`)

    await page.getByRole('button', { name: /Kirim tautan baru/ }).click()
    await expect(page.getByText('Email wajib diisi.')).toBeVisible()

    await page.getByLabel('Email').fill('siapa-saja@contoh.test')
    await page.getByRole('button', { name: /Kirim tautan baru/ }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Jika akunmu perlu diaktifkan' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Kirim tautan baru/ })).toBeDisabled()
    await expect(page.getByText(/tidak ditemukan|tidak terdaftar/i)).toHaveCount(0)
  })

  test('TC-UI-F4-79: jaringan putus saat verifikasi menawarkan coba lagi tanpa kehilangan token', async ({
    page,
  }) => {
    await useMock(page, 'network')
    await page.goto(`/aktivasi#token=${TOKEN}`)
    await expect(page.getByRole('heading', { name: 'Belum bisa memverifikasi' })).toBeVisible()

    await page.evaluate(() => delete (window as unknown as { __nkMock?: string }).__nkMock)
    await page.getByRole('button', { name: 'Coba lagi' }).click()

    await expect(page.getByRole('heading', { name: 'Akunmu sudah aktif' })).toBeVisible()
  })
})

test.describe('auth ponsel', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('TC-UI-F4-80: tap target minimal 44px pada kontrol auth', async ({ page }) => {
    for (const path of ['/login', '/daftar']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const boxes = await page
        .locator('.nk-authfield__input, .nk-authfield__toggle, .nk-btn, .nk-auth__switch a')
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0),
        )
      expect(boxes.length).toBeGreaterThan(3)
      for (const box of boxes) {
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
      }
    }

    await signUp(page)
    await expect(page.getByRole('heading', { name: 'Cek email-mu' })).toBeVisible()
    for (const box of await page
      .locator('.nk-btn, .nk-auth__switch a')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
})
