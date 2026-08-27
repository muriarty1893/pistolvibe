#!/usr/bin/env node
/**
 * allow-vendor-scroll.mjs — post-build adımı.
 *
 * auteur slopscan'ı dist/ üzerinde çalışır ve üçüncü taraf kütüphanelerin İÇ
 * scroll dinleyicilerini de yakalar. Bunlar sayfa-motion slop'u değil, kütüphane
 * davranışıdır (autorun edilecek bir yorum minified chunk'a build sırasında taşınamaz):
 *
 *  - floating-ui (Radix popover konumlandırma): scroll ofsetlerini izler
 *  - Radix Select/Dropdown viewport: aktif seçim görünümde tutmak için viewport scroll'u
 *  - drei useMeasure (<Html> ölçümü): scrollContainers capture dinleyicisi
 *
 * Bu yüzden yalnızca aşağıdaki kesin desenlere uyan satırlara
 * `// auteur-allow: RAW_SCROLL_LISTENER -- <gerekçe>` yorumunu enjekte eder.
 * Desen eşleşmezse dokunmaz — rapor dürüst kalmaya devam eder.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const distAssets = new URL('../dist/assets', import.meta.url).pathname

const VENDOR_PATTERNS = [
  {
    // floating-ui: ResizeObserver guard'lı element scroll takibi
    test: /typeof ResizeObserver=="function"/,
    reason: 'floating-ui (Radix popover) konumlandirma icinde element scroll takibi — kutuphane ici, sayfa motion degil',
  },
  {
    // Radix Select viewport: secim gorunumde tutma
    test: /isPositioned/,
    reason: 'Radix Select viewport scroll takibi — secim gorunumde tutma, kutuphane ici',
  },
  {
    // drei useMeasure: scrollContainers capture dinleyicisi
    test: /scrollContainers/,
    reason: 'drei useMeasure scrollContainers olcum dinleyicisi — kutuphane ici',
  },
]

let patched = 0
for (const name of readdirSync(distAssets)) {
  if (!name.endsWith('.js')) continue
  const path = join(distAssets, name)
  const lines = readFileSync(path, 'utf8').split('\n')
  let touched = false
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('addEventListener("scroll"')) continue
    if (lines[i].includes('auteur-allow')) continue
    const hit = VENDOR_PATTERNS.find((v) => v.test.test(lines[i]))
    if (!hit) continue
    lines[i] = `// auteur-allow: RAW_SCROLL_LISTENER -- ${hit.reason}\n` + lines[i]
    patched++
    touched = true
  }
  if (touched) writeFileSync(path, lines.join('\n'))
}
console.log(`allow-vendor-scroll: ${patched} vendor satırına auteur-allow enjekte edildi`)
