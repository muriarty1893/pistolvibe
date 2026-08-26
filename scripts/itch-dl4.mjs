import { chromium } from 'playwright-core'
const exec = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'
const slug = process.argv[2]
const out = process.argv[3]
const browser = await chromium.launch({ executablePath: exec })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(`https://${slug}/purchase`, { waitUntil: 'load' })
await page.waitForTimeout(1200)
const btn = page.locator('.direct_download_btn')
if (await btn.count()) await btn.click()
await page.waitForTimeout(2000)
const row = page.locator('.upload_row, .upload').first()
await row.locator('a.button, a[class*=download]').first().click()
const download = await page.waitForEvent('download', { timeout: 60000 })
await download.saveAs(out)
console.log('saved:', download.suggestedFilename())
await browser.close()
