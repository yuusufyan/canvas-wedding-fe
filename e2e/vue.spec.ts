import { test, expect } from '@playwright/test'

test('unknown path shows the Vuexy not-found page with the Montserrat font', async ({ page }) => {
  await page.goto('/alamat-yang-tidak-ada')

  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toHaveText('Halaman tidak ditemukan')
  await expect(page.locator('body')).toHaveClass(/blank-page/)

  const fontFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(fontFamily).toContain('Montserrat')
})
