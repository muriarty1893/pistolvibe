import * as THREE from 'three'

let cached: THREE.CanvasTexture | null = null

/** Namlu alevi için yıldız biçimli radyal sprite dokusu (bir kez üretilir). */
export function getFlashTexture(): THREE.CanvasTexture {
  if (cached) return cached

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const cx = size / 2
  const cy = size / 2

  // dış parlama
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx)
  glow.addColorStop(0, 'rgba(255, 240, 200, 0.9)')
  glow.addColorStop(0.2, 'rgba(255, 200, 90, 0.55)')
  glow.addColorStop(0.5, 'rgba(255, 140, 30, 0.18)')
  glow.addColorStop(1, 'rgba(255, 100, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  // yıldız spike'ları
  ctx.translate(cx, cy)
  const spikes = 7
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2 + Math.random() * 0.4
    const len = (i % 2 === 0 ? 0.95 : 0.6) * cx * (0.75 + Math.random() * 0.35)
    const width = 3 + Math.random() * 5
    const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len)
    grad.addColorStop(0, 'rgba(255, 250, 220, 0.95)')
    grad.addColorStop(0.4, 'rgba(255, 190, 80, 0.7)')
    grad.addColorStop(1, 'rgba(255, 120, 0, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle + Math.PI / 2) * width, Math.sin(angle + Math.PI / 2) * width)
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len)
    ctx.lineTo(Math.cos(angle - Math.PI / 2) * width, Math.sin(angle - Math.PI / 2) * width)
    ctx.closePath()
    ctx.fill()
  }

  // çekirdek
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.22)
  core.addColorStop(0, 'rgba(255, 255, 255, 1)')
  core.addColorStop(0.6, 'rgba(255, 235, 170, 0.95)')
  core.addColorStop(1, 'rgba(255, 190, 80, 0)')
  ctx.fillStyle = core
  ctx.fillRect(-cx, -cy, size, size)

  cached = new THREE.CanvasTexture(canvas)
  cached.colorSpace = THREE.SRGBColorSpace
  return cached
}
