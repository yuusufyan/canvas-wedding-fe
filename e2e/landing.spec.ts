import { test, expect, type Page } from '@playwright/test'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

type MockMode = 'empty' | 'error' | 'slow'

async function setMockMode(page: Page, mode: MockMode): Promise<void> {
  await page.addInitScript((value) => {
    ;(window as unknown as { __nkMock: string }).__nkMock = value
  }, mode)
}

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

for (const viewport of VIEWPORTS) {
  test.describe(`landing ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test(`TC-UI-F2-10: landing ${viewport.width}px tanpa scroll horizontal dan h1 tampil`, async ({
      page,
    }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Undangan yang terasa seperti kalian berdua.',
      )
      await expect(page.getByTestId('gallery-list')).toBeVisible()
      expect(await hasHorizontalScroll(page)).toBe(false)
      await expect(page).toHaveTitle(/Niskala Daisy/)
    })

    test(`TC-UI-F2-11: demo ${viewport.width}px tanpa scroll horizontal`, async ({ page }) => {
      await page.goto('/demo/rustic-hijau')
      await expect(page.getByRole('group', { name: 'Kontrol pemutar demo' })).toBeVisible()
      await expect(page.locator('.nk-stage')).toBeVisible()
      expect(await hasHorizontalScroll(page)).toBe(false)
    })
  })
}

test.describe('landing mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('TC-UI-F2-12: hamburger membuka menu dan tap target minimal 44px', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Buka menu' })
    await expect(toggle).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cara kerja' })).toBeHidden()

    await toggle.click()
    await expect(page.getByRole('button', { name: 'Tutup menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(page.getByRole('link', { name: 'Cara kerja' })).toBeVisible()

    const targets = page.locator(
      '.nk-nav__panel a, .nk-nav__toggle, .nk-hero__cta a, .nk-demo__close',
    )
    for (const box of await targets.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0),
    )) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('TC-UI-F2-13: tap target kontrol demo minimal 44px', async ({ page }) => {
    await page.goto('/demo/rustic-hijau')
    await expect(page.locator('.nk-stage')).toBeVisible()
    const boxes = await page
      .locator('.nk-demo__controls button, .nk-demo__close, .nk-sections button')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))
    expect(boxes.length).toBeGreaterThan(5)
    for (const box of boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })
})

test('TC-UI-F2-14: navigasi anchor dan FAQ accordion bisa dipakai keyboard', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: 'FAQ' })
    .click()
  await expect(page).toHaveURL(/#faq$/)

  const second = page.getByRole('button', { name: 'Apakah saya perlu bisa desain?' })
  await expect(second).toHaveAttribute('aria-expanded', 'false')
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Apakah benar-benar gratis?' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('TC-UI-F2-15: Mulai gratis mengarah ke halaman Daftar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('banner').getByRole('link', { name: 'Mulai gratis' }).click()
  await expect(page).toHaveURL(/\/daftar$/)
})

test('TC-UI-F2-16: demo bisa dijeda, pindah bagian, dan ditutup kembali ke landing', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Lihat demo template Rustic Hijau' }).click()
  await expect(page).toHaveURL(/\/demo\/rustic-hijau$/)

  const play = page.getByRole('button', { name: /^(Jeda|Putar)$/ })
  await play.click()
  await expect(play).toHaveAccessibleName('Putar')

  await page.getByRole('button', { name: 'Acara & Countdown' }).click()
  await expect(page.getByRole('img', { name: /Acara & Countdown/ })).toBeVisible()
  await expect(page.locator('.nk-cd')).toHaveCount(4)

  await page.getByRole('button', { name: 'Tutup demo' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('TC-UI-F2-17: gerak dikurangi membuat demo mulai terjeda', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demo/rustic-hijau')
  await expect(page.getByRole('button', { name: 'Putar' })).toBeVisible()
  await expect(page.getByText('00:00 / 00:45')).toBeVisible()
})

test('TC-UI-F2-18: slug demo tidak dikenal menampilkan halaman tidak ditemukan', async ({
  page,
}) => {
  await page.goto('/demo/tidak-ada')
  await expect(page.getByRole('heading', { name: 'Demo tidak ditemukan' })).toBeVisible()
})

test('TC-UI-F2-19: galeri menampilkan state error lalu pulih dengan coba lagi, dan state kosong', async ({
  page,
}) => {
  await setMockMode(page, 'error')
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Template belum bisa dimuat')
  await page.evaluate(() => delete (window as unknown as { __nkMock?: string }).__nkMock)
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByTestId('gallery-list')).toBeVisible()

  const empty = await page.context().newPage()
  await setMockMode(empty, 'empty')
  await empty.goto('/')
  await expect(empty.getByText('Template segera hadir')).toBeVisible()
})

test('TC-UI-F2-07: halaman login yang ada tetap tersedia dan dashboard lama butuh sesi', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})
