import { chromium } from 'playwright-core'

const exec =
  process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'

const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })

// desktop leaderboard
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://localhost:3001/#tablo', { waitUntil: 'load' })
await page.waitForTimeout(3500)
await page.screenshot({ path: '/tmp/opencode/pistolvibe/site_tablo.png' })
console.log('shot tablo')

// mobile hero + arsenal
const mob = await browser.newPage({ viewport: { width: 375, height: 812 } })
await mob.goto('http://localhost:3001/#anasayfa', { waitUntil: 'load' })
await mob.waitForTimeout(5000)
await mob.screenshot({ path: '/tmp/opencode/pistolvibe/site_mobile.png' })
console.log('shot mobile')

const hasHScroll = await mob.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
)
console.log('mobile horizontal scroll:', hasHScroll)
await browser.close()
