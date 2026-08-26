import { chromium } from 'playwright-core'
const exec = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'
const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })
// desktop
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)))
page.on('console', m => { if (m.type() === 'error') console.log('[cerr]', m.text().slice(0, 160)) })
await page.goto('http://localhost:3001/#arena', { waitUntil: 'load' })
await page.waitForTimeout(6000)
const startBtn = await page.getByText('Ateş Başla').first()
if (await startBtn.isVisible()) {
  await startBtn.click()
  await page.waitForTimeout(2500)
  await page.mouse.move(720, 430)
  await page.waitForTimeout(600)
  await page.mouse.down(); await page.mouse.up()
  await page.waitForTimeout(60)
  await page.screenshot({ path: '/tmp/opencode/pistolvibe/env_desktop.png' })
  console.log('desktop ok')
}
// mobil
const mp = await browser.newPage({ viewport: { width: 390, height: 844 } })
mp.on('pageerror', e => console.log('[m pageerror]', String(e).slice(0, 300)))
await mp.goto('http://localhost:3001/#arena', { waitUntil: 'load' })
await mp.waitForTimeout(6000)
const mstart = await mp.getByText('Ateş Başla').first()
if (await mstart.isVisible()) {
  await mstart.click()
  await mp.waitForTimeout(2500)
  await mp.screenshot({ path: '/tmp/opencode/pistolvibe/env_mobile.png' })
  console.log('mobile ok')
}
await browser.close()
