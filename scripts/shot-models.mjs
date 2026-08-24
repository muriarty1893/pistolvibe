import { chromium } from 'playwright-core'

const exec =
  process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'

const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 640, height: 400 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 150)) })

for (const m of ['colt_m1911', 'pistol', '9mm_pistol', 'glock18c', 'deagle']) {
  await page.goto(`http://localhost:8777/viewer.html?model=${m}.glb`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `/tmp/opencode/pistolvibe/new_${m}.png` })
  console.log('shot', m)
}
await browser.close()
