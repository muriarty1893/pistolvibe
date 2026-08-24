import { chromium } from 'playwright-core'

const exec =
  process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'

const shots = [
  { name: 'hero', url: 'http://localhost:3001/#anasayfa', wait: 6000 },
  { name: 'arsenal', url: 'http://localhost:3001/#cephanelik', wait: 6000 },
  { name: 'arena', url: 'http://localhost:3001/#arena', wait: 4000 },
]

const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[console.error]', msg.text().slice(0, 300))
})
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 300)))

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: 'load' })
  await page.waitForTimeout(shot.wait)
  await page.screenshot({ path: `/tmp/opencode/pistolvibe/site_${shot.name}.png` })
  console.log('shot', shot.name)
}

// start the game and capture mid-play (fresh page, like a real user)
const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page2.goto('http://localhost:3001/#arena', { waitUntil: 'load' })
await page2.waitForTimeout(3000)
const startBtn = await page2.getByText('Ateş Başla').first()
if (await startBtn.isVisible()) {
  await startBtn.click()
  await page2.waitForTimeout(2500)
  await page2.mouse.move(700, 400)
  await page2.mouse.down()
  await page2.mouse.up()
  await page2.waitForTimeout(1500)
  await page2.mouse.move(800, 450)
  await page2.mouse.down()
  await page2.mouse.up()
  await page2.waitForTimeout(400)
  await page2.screenshot({ path: '/tmp/opencode/pistolvibe/site_game.png' })
  console.log('shot game')
}
await browser.close()
