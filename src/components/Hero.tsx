import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import { Button } from '@/components/ui/button'
import SplitText from '@/components/bits/SplitText'
import { RollingText } from '@/components/RollingText'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const CinematicHeroScene = lazy(() =>
  import('@/components/three/CinematicHeroScene').then((m) => ({ default: m.CinematicHeroScene }))
)

/** overlay opaklık eğrileri — direkt stil yazar, re-render yok */
function ramp(p: number, a: number, b: number) {
  return Math.min(Math.max((p - a) / (b - a), 0), 1)
}

export function Hero() {
  const pinRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const copyARef = useRef<HTMLDivElement>(null)
  const copyBRef = useRef<HTMLDivElement>(null)
  const copyCRef = useRef<HTMLDivElement>(null)
  const barTopRef = useRef<HTMLDivElement>(null)
  const barBotRef = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useGSAP(
    () => {
      if (reduced || !pinRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const set = (el: HTMLElement | null, css: Partial<CSSStyleDeclaration>) => {
          if (el) Object.assign(el.style, css)
        }
        const st = ScrollTrigger.create({
          trigger: pinRef.current!,
          start: 'top top',
          end: () => (window.innerWidth < 768 ? '+=1700' : '+=2700'),
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress
            progressRef.current = p
            // Sahne 1 yazısı: ilk karede tam, kamera kalkarken söner
            const a = 1 - ramp(p, 0.13, 0.2)
            set(copyARef.current, { opacity: String(a), transform: `translateY(${-40 * ramp(p, 0.1, 0.3)}px)` })
            // Sahne 2 yazısı: orta bantta
            const b = ramp(p, 0.3, 0.4) * (1 - ramp(p, 0.66, 0.74))
            set(copyBRef.current, { opacity: String(b) })
            // Sahne 3: kapı
            const c = ramp(p, 0.84, 0.93)
            set(copyCRef.current, { opacity: String(c), pointerEvents: c > 0.6 ? 'auto' : 'none' })
            // letterbox: peak girişinde kapanır, kapıda açılır
            const lb = ramp(p, 0.16, 0.24) * (1 - ramp(p, 0.8, 0.88))
            set(barTopRef.current, { transform: `scaleY(${0.35 + lb * 0.65})` })
            set(barBotRef.current, { transform: `scaleY(${0.35 + lb * 0.65})` })
          },
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { dependencies: [reduced] }
  )

  const copyAOpacity = reduced ? 1 : 1 // JS-on'da onUpdate yönetir; ilk boyama görünür
  const staticCta = reduced // reduced-motion: tek karede CTA da görünür

  return (
    <section id="anasayfa" className="relative">
      <div ref={pinRef} className="relative h-screen overflow-hidden bg-[#0b0b0e]">
        {/* 3B sinematik sahne — tek WebGL context */}
        <Suspense fallback={null}>
          <CinematicHeroScene progressRef={progressRef} reduced={reduced} />
        </Suspense>

        {/* okunabilirlik vignette'i (marka hue'sunda koyu, degrade değil düz katman + kenar silme) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to top, rgba(11,11,14,0.92), rgba(11,11,14,0))' }}
        />

        {/* letterbox bantları */}
        <div
          ref={barTopRef}
          className="pointer-events-none absolute inset-x-0 top-0 h-[26px] origin-top bg-black"
          style={{ transform: 'scaleY(0.35)' }}
        />
        <div
          ref={barBotRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[26px] origin-bottom bg-black"
          style={{ transform: 'scaleY(0.35)' }}
        />

        {/* Sahne 1 — split-asymmetric: yazı sağda, glock solda sahnede */}
        <div
          ref={copyARef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center"
          style={{ opacity: copyAOpacity }}
        >
          <div className="ml-auto w-full max-w-[46rem] px-6 pr-[6vw] sm:px-0">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground sm:text-sm">
              Airsoft Takımı • Adana
            </p>
            <h1 className="mt-4 font-display text-[clamp(40px,6vw,88px)] uppercase leading-[0.98] tracking-[-0.02em] text-foreground">
              Sadece <span className="text-[#d4af37]">Tabanca</span>
            </h1>
            <div className="gold-glow-sm">
              <Suspense
                fallback={
                  <p className="mt-3 font-display uppercase text-[#e8bf4d]" style={{ fontSize: 'clamp(20px,2.4vw,32px)' }}>
                    Pistol-only CQB
                  </p>
                }
              >
                <SplitText
                  text="Pistol-only CQB"
                  className="mt-3 inline-block font-display uppercase text-[clamp(20px,2.4vw,32px)] tracking-[0.04em] text-[#e8bf4d]"
                  delay={40}
                  duration={0.8}
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  textAlign="left"
                />
              </Suspense>
            </div>
            <p className="mt-6 max-w-[46ch] text-base text-muted-foreground sm:text-lg">
              Tüfek yok, sniper yok. Yakın mesafede tam konsantrasyon. A.T.A, Adana'da
              pistol-only CQB oynayan bir airsoft takımıdır.
            </p>
          </div>
        </div>

        {/* Sahne 2 — pinned-canvas: asimetrik alt-sol mikro blok */}
        <div
          ref={copyBRef}
          className="pointer-events-none absolute bottom-24 left-6 z-10 sm:left-16"
          style={{ opacity: 0 }}
        >
          <p className="font-display text-3xl uppercase text-foreground sm:text-5xl">
            İki mevsim, <span className="text-[#d4af37]">tek kural</span>
          </p>
          <p className="mt-3 max-w-[40ch] text-sm text-muted-foreground sm:text-base">
            Pistol-only CQB. İsabet kasettir, ekip ailedir.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
            A.T.A · Adana
          </p>
        </div>

        {/* Sahne 3 — centred-type kapı: CTA */}
        <div
          ref={copyCRef}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 text-center"
          style={{ opacity: 0 }}
        >
          <div style={{ textShadow: '0 1px 8px rgba(11,11,14,0.9), 0 0 24px rgba(11,11,14,0.7)' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#cfcabc]">Arena açık</p>
            <h2 className="mt-3 font-display text-4xl uppercase text-foreground sm:text-6xl">
              Refleksini <span className="text-[#d4af37]">kanıtla</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[44ch] text-sm text-muted-foreground sm:text-base">
              Instagram adınla gir, skorun tabloya yazılsın.
            </p>          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a href="#arena">
                <RollingText text="Refleksini Test Et" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#basvuru">
                <RollingText text="Hemen Başvur" />
              </a>
            </Button>
          </div>
        </div>

        {/* reduced-motion statik CTA — film oynamazsa da kapı görünür */}
        {staticCta && (
          <div className="absolute inset-x-0 bottom-16 z-20 flex justify-center gap-4">
            <Button asChild size="lg">
              <a href="#arena">Refleksini Test Et</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#basvuru">Hemen Başvur</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
