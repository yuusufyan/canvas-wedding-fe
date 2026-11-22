import { test, expect } from '@playwright/test'

// Halaman 404 memakai gaya Niskala (AuthLayout), bukan halaman error Vuexy.
test('unknown path shows the Niskala not-found page with the display font', async ({ page }) => {
  await page.goto('/alamat-yang-tidak-ada')

  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toHaveText('Halaman tidak ditemukan')
  await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toBeVisible()
  await expect(page.locator('body')).not.toHaveClass(/blank-page/)

  const fontFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(fontFamily).toContain('Cormorant Garamond')
})
