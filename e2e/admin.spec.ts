import { test, expect, type Page } from '@playwright/test'

type MockMode = 'empty' | 'error' | 'slow' | 'forbidden'

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 992, height: 800 },
  { width: 1440, height: 900 },
]

// Sesi tiruan: refresh token palsu dari src/api/mock/auth.ts (hanya dev dengan mock).
async function signIn(page: Page, mode?: MockMode): Promise<void> {
  await page.addInitScript((value) => {
    sessionStorage.setItem('canvas-wedding.refresh-token', 'mock-refresh-token')
    if (value) {
      ;(window as unknown as { __nkMock: string }).__nkMock = value
    }
  }, mode)
}

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

for (const viewport of VIEWPORTS) {
  test.describe(`admin ${viewport.width}px`, () => {
    test.use({ viewport })

    test(`TC-UI-F3-80: template dan membership ${viewport.width}px tanpa scroll horizontal`, async ({
      page,
    }) => {
      await signIn(page)
      await page.goto('/admin/template')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Template Undangan')
      await expect(page.getByTestId('templates-grid')).toBeVisible()
      expect(await hasHorizontalScroll(page)).toBe(false)

      await page.goto('/admin/membership')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Membership')
      await expect(page.getByRole('region', { name: 'Ringkasan membership' })).toBeVisible()
      await expect(page.locator('tbody tr, li.nk-rowcard').first()).toBeVisible()
      expect(await hasHorizontalScroll(page)).toBe(false)
    })
  })
}

test.describe('shell desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('TC-UI-F3-81: sidebar dari menus[] /auth/me, halaman aktif, dan tanpa tombol menu', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    const nav = page.getByRole('navigation', { name: 'Menu utama' })

    await expect(nav.getByRole('link')).toHaveText([
      'Dashboard',
      'Template',
      'Undangan',
      'Tamu',
      'Pengguna & Role',
      'Membership',
      'Pengaturan',
    ])
    await expect(nav.getByRole('link', { name: 'Template' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByRole('button', { name: 'Buka menu navigasi' })).toBeHidden()
  })

  test('TC-UI-F3-82: menu tanpa halaman membuka segera hadir; Pengguna & Role membuka halaman barunya', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    const nav = page.getByRole('navigation', { name: 'Menu utama' })

    await nav.getByRole('link', { name: 'Undangan' }).click()
    await expect(page).toHaveURL(/\/admin\/undangan$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Undangan segera hadir')

    await nav.getByRole('link', { name: 'Pengguna & Role' }).click()
    await expect(page).toHaveURL(/\/admin\/pengguna$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pengguna & Role')

    await nav.getByRole('link', { name: 'Membership' }).click()
    await expect(page).toHaveURL(/\/admin\/membership$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Membership')
  })

  test('TC-UI-F3-83: tanpa sesi diarahkan ke login', async ({ page }) => {
    await page.goto('/admin/template')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('TC-UI-F3-84: filter status, pencarian, dan state kosong karena filter dengan reset', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await expect(page.getByTestId('templates-grid').locator('article')).toHaveCount(8)

    await page.getByRole('button', { name: /^Draft/ }).click()
    await expect(page.getByTestId('templates-grid').locator('article')).toHaveCount(2)

    await page.getByLabel('Cari template').fill('tidak-ada-yang-cocok')
    await expect(page.getByText('Tidak ada template untuk filter ini')).toBeVisible()
    await page.getByRole('button', { name: 'Reset filter' }).click()
    await expect(page.getByTestId('templates-grid').locator('article')).toHaveCount(8)

    await page.getByLabel('Filter akses').selectOption('Premium')
    await expect(page.getByTestId('templates-grid').locator('article')).toHaveCount(4)
  })

  test('TC-UI-F3-85: membuat template: dialog terkurung fokus, Esc menutup, sukses menampilkan toast dan kartu', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    const open = page.getByRole('button', { name: 'Template baru' })
    await open.click()
    const dialog = page.getByRole('dialog', { name: 'Template baru' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Nama template')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()

    await open.click()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }

    await expect(dialog.getByRole('button', { name: /Buat template/ })).toBeDisabled()
    await dialog.getByLabel('Nama template').fill('Rustic Emas')
    await dialog.getByText('Premium', { exact: true }).click()
    await dialog.getByRole('button', { name: /Buat template/ }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status').getByText('Template “Rustic Emas” dibuat')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rustic Emas' })).toBeVisible()
  })

  test('TC-UI-F3-86: nama template kembar menampilkan galat generik di dialog', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await page.getByRole('button', { name: 'Template baru' }).click()
    const dialog = page.getByRole('dialog', { name: 'Template baru' })
    await dialog.getByLabel('Nama template').fill('Rustic Hijau')
    await dialog.getByRole('button', { name: /Buat template/ }).click()

    await expect(dialog.getByRole('alert')).toContainText('sudah dipakai')
    await expect(dialog).toBeVisible()
  })

  test('TC-UI-F3-87: arsipkan menampilkan jumlah undangan dan memindahkan template ke Arsip', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await page.getByRole('button', { name: 'Aksi untuk Elegan Putih' }).click()
    await page.getByRole('menuitem', { name: 'Arsipkan' }).click()

    const dialog = page.getByRole('dialog', { name: /Arsipkan “Elegan Putih”/ })
    await expect(dialog).toContainText('Dipakai oleh 12 undangan aktif')
    await dialog.getByRole('button', { name: /^Arsipkan/ }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /^Arsip/ })).toContainText('2')
    await page.getByRole('button', { name: /^Arsip/ }).click()
    await expect(page.getByRole('heading', { name: 'Elegan Putih' })).toBeVisible()
  })

  test('TC-UI-F3-88: hapus perlu mengetik nama; template yang dipakai undangan tidak bisa dihapus', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')

    await page.getByRole('button', { name: 'Aksi untuk Rustic Hijau' }).click()
    await page.getByRole('menuitem', { name: 'Hapus' }).click()
    const blocked = page.getByRole('dialog', { name: /Hapus “Rustic Hijau”/ })
    await expect(blocked).toContainText('Dipakai oleh 14 undangan')
    await expect(blocked.getByRole('textbox')).toBeDisabled()
    await expect(blocked.getByRole('button', { name: /Hapus permanen/ })).toBeDisabled()
    await blocked.getByRole('button', { name: 'Batal' }).click()

    await page.getByRole('button', { name: 'Aksi untuk Floral Blush' }).click()
    await page.getByRole('menuitem', { name: 'Hapus' }).click()
    const dialog = page.getByRole('dialog', { name: /Hapus “Floral Blush”/ })
    await expect(dialog).toContainText('Tidak dipakai undangan mana pun')
    await expect(dialog.getByRole('button', { name: /Hapus permanen/ })).toBeDisabled()
    await dialog.getByRole('textbox').fill('Floral Blush')
    await dialog.getByRole('button', { name: /Hapus permanen/ }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Floral Blush' })).toHaveCount(0)
    await expect(page.getByTestId('templates-grid').locator('article')).toHaveCount(7)
  })

  test('TC-UI-F3-89: tampilan daftar memakai tabel di desktop dan menu aksi bisa dipakai keyboard', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await page.getByRole('button', { name: 'Tampilan daftar' }).click()
    await expect(page.getByRole('table', { name: 'Daftar template' })).toBeVisible()

    const trigger = page.getByRole('button', { name: 'Aksi untuk Batik Klasik' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem').first()).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem').nth(1)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('TC-UI-F3-90: membership: email tersamar, filter status, dan paginasi server', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/membership')
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(10)
    await expect(page.locator('tbody')).toContainText('n***@contoh.test')
    await expect(page.locator('tbody')).not.toContainText(/[a-z]{2,}@contoh\.test/)
    await expect(page.getByText('Menampilkan 1–10 dari 34')).toBeVisible()

    await page.getByRole('button', { name: 'Halaman 2' }).click()
    await expect(page.getByText('Menampilkan 11–20 dari 34')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Halaman 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.getByRole('button', { name: /^Kedaluwarsa/ }).click()
    await expect(page.getByText('Menampilkan 1–5 dari 5')).toBeVisible()
    await expect(page.locator('tbody .nk-status--danger')).toHaveCount(5)

    await page.getByLabel('Cari nama pengguna').fill('zzz')
    await expect(page.getByText('Tidak ada member untuk filter ini')).toBeVisible()
  })

  test('TC-UI-F3-91: server error menampilkan pesan generik dengan coba lagi, 403 menampilkan izin ditolak', async ({
    page,
  }) => {
    await signIn(page, 'error')
    await page.goto('/admin/template')
    await expect(page.getByRole('alert')).toContainText('Template belum bisa dimuat')
    await page.evaluate(() => delete (window as unknown as { __nkMock?: string }).__nkMock)
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByTestId('templates-grid')).toBeVisible()

    const denied = await page.context().newPage()
    await signIn(denied, 'forbidden')
    await denied.goto('/admin/membership')
    await expect(denied.getByText('Kamu tidak punya akses')).toBeVisible()
  })

  test('TC-UI-F3-92: state kosong pertama untuk template dan membership', async ({ page }) => {
    await signIn(page, 'empty')
    await page.goto('/admin/template')
    await expect(page.getByText('Belum ada template')).toBeVisible()
    await page.goto('/admin/membership')
    await expect(page.getByText('Belum ada member')).toBeVisible()
  })
})

test.describe('shell ponsel', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('TC-UI-F3-93: sidebar off-canvas lewat tombol menu, tertutup saat navigasi, Esc, dan klik latar', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    const nav = page.getByRole('navigation', { name: 'Menu utama' })
    await expect(nav).toBeHidden()

    await page.getByRole('button', { name: 'Buka menu navigasi' }).click()
    await expect(nav).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(nav).toBeHidden()

    await page.getByRole('button', { name: 'Buka menu navigasi' }).click()
    await page.getByTestId('shell-backdrop').click({ position: { x: 360, y: 400 } })
    await expect(nav).toBeHidden()

    await page.getByRole('button', { name: 'Buka menu navigasi' }).click()
    await nav.getByRole('link', { name: 'Membership' }).click()
    await expect(page).toHaveURL(/\/admin\/membership$/)
    await expect(nav).toBeHidden()
  })

  test('TC-UI-F3-94: tap target minimal 44px pada kontrol utama template dan membership', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await expect(page.getByTestId('templates-grid')).toBeVisible()
    const selectors =
      '.nk-topbar__menu, .nk-appbtn, .nk-chip, .nk-input, .nk-select, .nk-viewtoggle .nk-iconbtn, .nk-menu .nk-iconbtn'
    for (const box of await page
      .locator(selectors)
      .evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0),
      )) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }

    await page.goto('/admin/membership')
    await expect(page.locator('li.nk-rowcard').first()).toBeVisible()
    for (const box of await page
      .locator('.nk-chip, .nk-pager__btn, .nk-input')
      .evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0),
      )) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('TC-UI-F3-95: dialog menjadi layar penuh dengan tombol utama menempel di bawah', async ({
    page,
  }) => {
    await signIn(page)
    await page.goto('/admin/template')
    await page.getByRole('button', { name: 'Template baru' }).click()
    const panel = page.getByRole('dialog', { name: 'Template baru' })
    await expect(panel).toBeVisible()

    const box = (await panel.boundingBox())!
    expect(box.width).toBeCloseTo(390, 0)
    expect(box.height).toBeCloseTo(844, 0)
    const submit = (await panel.getByRole('button', { name: /Buat template/ }).boundingBox())!
    expect(submit.y + submit.height).toBeGreaterThan(844 - 40)
    expect(await hasHorizontalScroll(page)).toBe(false)
  })

  test('TC-UI-F3-96: membership menjadi daftar kartu di ponsel', async ({ page }) => {
    await signIn(page)
    await page.goto('/admin/membership')
    await expect(page.locator('table')).toHaveCount(0)
    await expect(page.locator('li.nk-rowcard')).toHaveCount(10)
    await expect(page.locator('li.nk-rowcard').first()).toContainText('n***@contoh.test')
  })
})
