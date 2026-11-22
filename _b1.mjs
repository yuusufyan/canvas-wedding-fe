import { chromium } from '@playwright/test'
const out = process.argv[2]
const b = await chromium.launch()
const pages = [['dash', '/admin'], ['users', '/admin/pengguna'], ['roles', '/admin/pengguna/role'], ['access', '/admin/pengguna/role/00000000-0000-4000-8000-0000000000a3'], ['nf', '/halaman-hilang']]
for (const [n, w, h] of [['d', 1440, 900], ['l', 992, 800], ['t', 768, 1024], ['m', 390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(() => sessionStorage.setItem('canvas-wedding.refresh-token', 'mock-refresh-token'))
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  for (const [name, path] of pages) {
    await p.goto('http://localhost:5173' + path)
    await p.waitForTimeout(2500)
    const d = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    console.log(n, name, JSON.stringify(d), errs.splice(0).join('|'))
    await p.screenshot({ path: `${out}/ap-${name}-${n}.png`, fullPage: true })
  }
  await ctx.close()
}
await b.close()
