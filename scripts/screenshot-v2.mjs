import { chromium } from 'playwright-core'

const exec =
  process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'

const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 250)))
page.on('console', (m) => { if (m.type() === 'error') console.log('[cerr]', m.text().slice(0, 150)) })

// hero: wait, move mouse, click to fire twice
await page.goto('http://localhost:3001/#anasayfa', { waitUntil: 'load' })
await page.waitForTimeout(6000)
await page.mouse.move(900, 300)
await page.waitForTimeout(800)
await page.mouse.down(); await page.mouse.up()
await page.waitForTimeout(500)
await page.mouse.move(500, 500)
await page.mouse.down(); await page.mouse.up()
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/opencode/pistolvibe/v2_hero.png' })
console.log('shot hero')

// stats strip
await page.evaluate(() => document.querySelector('section.border-y')?.scrollIntoView({ behavior: 'instant' }))
await page.waitForTimeout(2500)
await page.screenshot({ path: '/tmp/opencode/pistolvibe/v2_stats.png' })
console.log('shot stats')

// arsenal: select colt (animated), then click canvas to fire
await page.evaluate(() => document.getElementById('cephanelik')?.scrollIntoView({ behavior: 'instant' }))
await page.waitForTimeout(3500)
const coltBtn = await page.getByRole('button', { name: /Colt M1911/ }).first()
if (await coltBtn.isVisible()) {
  await coltBtn.click({ force: true })
  await page.waitForTimeout(3000)
  await page.mouse.move(560, 500)
  await page.mouse.down(); await page.mouse.up()
  await page.waitForTimeout(400)
}
await page.screenshot({ path: '/tmp/opencode/pistolvibe/v2_arsenal.png' })
console.log('shot arsenal')

// game: fresh page
const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page2.on('pageerror', (err) => console.log('[game pageerror]', String(err).slice(0, 250)))
await page2.goto('http://localhost:3001/#arena', { waitUntil: 'load' })
await page2.waitForTimeout(3500)
const startBtn = await page2.getByText('Ateş Başla').first()
if (await startBtn.isVisible()) {
  await startBtn.click()
  await page2.waitForTimeout(2500)
  await page2.mouse.move(700, 400)
  await page2.mouse.down(); await page2.mouse.up()
  await page2.waitForTimeout(600)
  await page2.mouse.move(650, 380)
  await page2.mouse.down(); await page2.mouse.up()
  await page2.waitForTimeout(400)
  await page2.screenshot({ path: '/tmp/opencode/pistolvibe/v2_game.png' })
  console.log('shot game')
}
await browser.close()
