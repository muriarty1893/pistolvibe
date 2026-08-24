let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noiseBuffer(audio: AudioContext, seconds: number): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

export function playShot() {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime

  const src = audio.createBufferSource()
  src.buffer = noiseBuffer(audio, 0.22)

  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(3200, now)
  filter.frequency.exponentialRampToValueAtTime(220, now + 0.2)

  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.5, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21)

  src.connect(filter).connect(gain).connect(audio.destination)
  src.start(now)
  src.stop(now + 0.22)

  const thump = audio.createOscillator()
  const thumpGain = audio.createGain()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(140, now)
  thump.frequency.exponentialRampToValueAtTime(50, now + 0.1)
  thumpGain.gain.setValueAtTime(0.4, now)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  thump.connect(thumpGain).connect(audio.destination)
  thump.start(now)
  thump.stop(now + 0.13)
}

export function playHit() {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  const ping = audio.createOscillator()
  const gain = audio.createGain()
  ping.type = 'sine'
  ping.frequency.setValueAtTime(1150, now)
  ping.frequency.exponentialRampToValueAtTime(520, now + 0.16)
  gain.gain.setValueAtTime(0.28, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  ping.connect(gain).connect(audio.destination)
  ping.start(now)
  ping.stop(now + 0.19)
}

export function playEmpty() {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  const click = audio.createOscillator()
  const gain = audio.createGain()
  click.type = 'square'
  click.frequency.setValueAtTime(1900, now)
  gain.gain.setValueAtTime(0.12, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  click.connect(gain).connect(audio.destination)
  click.start(now)
  click.stop(now + 0.06)
}

export function playReload() {
  const audio = getCtx()
  if (!audio) return
  ;[0, 0.14, 0.32].forEach((offset, i) => {
    const now = audio.currentTime + offset
    const src = audio.createBufferSource()
    src.buffer = noiseBuffer(audio, 0.06)
    const filter = audio.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 900 + i * 500
    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    src.connect(filter).connect(gain).connect(audio.destination)
    src.start(now)
    src.stop(now + 0.07)
  })
}

export function playEnd() {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  ;[523, 392, 311].forEach((freq, i) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const t = now + i * 0.14
    gain.gain.setValueAtTime(0.18, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    osc.connect(gain).connect(audio.destination)
    osc.start(t)
    osc.stop(t + 0.32)
  })
}
