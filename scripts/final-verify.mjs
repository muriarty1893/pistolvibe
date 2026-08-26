import { chromium } from 'playwright-core'
const exec = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell'
const browser = await chromium.launch({ executablePath: exec, args: ['--use-gl=angle', '--use-angle=swiftshader'] })

async function run(vp, tag) {
  const p = await browser.newPage({ viewport: vp })
  p.on('pageerror', e => console.log(`[${tag} pageerror]`, String(e).slice(0, 250)))
  p.on('console', m => { if (m.type() === 'error') console.log(`[${tag} cerr]`, m.text().slice(0, 140)) })
  await p.goto('http://localhost:3001/', { waitUntil: 'load' })
  await p.waitForTimeout(2500)
  // arena'ya git, ön yükleme başlasın
  await p.evaluate(() => document.getElementById('arena')?.scrollIntoView({ behavior: 'instant' }))
  await p.waitForTimeout(6000)  // preload süresi
  const startBtn = await p.getByText('Ateş Başla').first()
  if (await startBtn.isVisible()) {
    await startBtn.click()
    await p.waitForTimeout(2000)
    await p.mouse.move(vp.width / 2, vp.height / 2 - 60)
    await p.waitForTimeout(500)
    await p.mouse.down(); await p.mouse.up()
    await p.waitForTimeout(60)
    await p.screenshot({ path: `/tmp/opencode/pistolvibe/final_${tag}.png` })
    const info = await p.evaluate(() => {
      const i = window.__glInfo
      if (!i) return null
      return { calls: i.render.calls, tris: i.render.triangles, geoms: i.memory.geometries, texs: i.memory.textures }
    })
    console.log(`[${tag} diagnostics]`, JSON.stringify(info))
  } else {
    console.log(`[${tag}] start button not found`)
  }
  await p.close()
}

await run({ width: 1440, height: 1000 }, 'desktop')
await run({ width: 390, height: 844 }, 'mobile')
await browser.close()
