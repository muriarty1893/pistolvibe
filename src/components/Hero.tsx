import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, ShieldCheck, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'
import Magnet from '@/components/bits/Magnet'
import { cn } from '@/lib/utils'
import { playShot } from '@/lib/sfx'

const PistolViewer = lazy(() =>
  import('@/components/three/PistolViewer').then((m) => ({ default: m.PistolViewer }))
)
const Particles = lazy(() => import('@/components/bits/Particles'))
const SplitText = lazy(() => import('@/components/bits/SplitText'))

const PILLARS = [
  {
    icon: Crosshair,
    title: 'Sadece Tabanca',
    text: 'Tüfek yok, sniper yok. Yakın mesafe, tam konsantrasyon — CQB’nin en saf hali.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair Play',
    text: 'Hit aldım demek erdemdir. Sahada saygı ve dürüstlük her şeyden önce gelir.',
  },
  {
    icon: Users,
    title: 'Kardeşlik',
    text: 'Sahada bir ekip, saha dışında bir aile. Birlikte oynar, birlikte öğreniriz.',
  },
]

const fireSignal = { current: 0 }

function HeroCanvas() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 300)
    return () => window.clearTimeout(id)
  }, [])
  if (!mounted) return null
  return (
    <Suspense fallback={null}>
      <PistolViewer
        modelUrl="/models/colt_m1911.glb"
        muzzle={-1}
        animated
        fireSignal={fireSignal}
        aim
        className="absolute inset-0"
        size={1.6}
        position={[1.05, -0.5, 0]}
      />
    </Suspense>
  )
}

function HeroParticles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 600)
    return () => window.clearTimeout(id)
  }, [])
  if (!mounted) return null
  return (
    <div className="pointer-events-none absolute inset-0 opacity-50">
      <Suspense fallback={null}>
        <Particles
          particleCount={180}
          particleSpread={12}
          speed={0.08}
          particleColors={['#d4af37', '#f5d876', '#8a6d1f']}
          moveParticlesOnHover
        />
      </Suspense>
    </div>
  )
}

export function Hero() {
  const [shots, setShots] = useState(0)
  const [marks, setMarks] = useState<{ id: number; x: number; y: number; rot: number }[]>([])
  const markId = useRef(0)

  useEffect(() => {
    try {
      setShots(Number(localStorage.getItem('pv_hero_shots') ?? '0'))
    } catch {
      // localStorage kapalıysa sessizce geç
    }
  }, [])

  const fire = useCallback(() => {
    fireSignal.current += 1
    playShot()
    setMarks((prev) => {
      const mark = {
        id: markId.current++,
        x: 12 + Math.random() * 76,
        y: 18 + Math.random() * 64,
        rot: Math.random() * 360,
      }
      const next = [...prev, mark]
      return next.length > 6 ? next.slice(next.length - 6) : next
    })
    setShots((s) => {
      const next = s + 1
      try {
        localStorage.setItem('pv_hero_shots', String(next))
      } catch {
        // yoksay
      }
      return next
    })
  }, [])

  return (
    <section id="anasayfa" className="relative overflow-hidden bg-grid">
      <HeroParticles />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(212,175,55,0.12), transparent 70%)',
        }}
      />
      <HeroCanvas />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-sm">
            Airsoft Takımı • Adana
          </p>
          <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground sm:text-4xl">
            A.T.A Pistol Team
          </h1>
          <div className="gold-glow-sm">
            <Suspense fallback={
              <p
                className="mt-2 font-display uppercase text-gold-gradient"
                style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
              >
                Sadece Tabanca
              </p>
            }>
              <SplitText
                text="SADECE TABANCA"
                className="split-gold mt-2 inline-block font-display uppercase text-[clamp(3rem,10vw,8rem)] leading-[1.05] tracking-[-0.02em]"
                delay={45}
                duration={0.9}
                splitType="chars"
                from={{ opacity: 0, y: 60, rotateX: -80 }}
                to={{ opacity: 1, y: 0, rotateX: 0 }}
                textAlign="center"
              />
            </Suspense>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tüfek yok, sniper yok. Sadece tabanca, refleks ve cesaret. Adana&apos;nın tek tabanca-only
            airsoft ekibine hoş geldin.
          </p>
        </Reveal>

        <Reveal delay={200} className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Magnet padding={48} magnetStrength={4}>
            <Button asChild size="lg">
              <a href="#basvuru">
                <RollingText text="Hemen Başvur" />
              </a>
            </Button>
          </Magnet>
          <Magnet padding={48} magnetStrength={4}>
            <Button asChild size="lg" variant="outline">
              <a href="#arena">
                <RollingText text="Refleksini Test Et" />
              </a>
            </Button>
          </Magnet>
          <Magnet padding={40} magnetStrength={4}>
            <div className="relative">
              <Button
                size="lg"
                onClick={fire}
                className="relative overflow-visible border border-primary/50 bg-primary/10 text-primary transition-colors duration-200 hover:bg-primary/20"
              >
                <Crosshair className="h-4 w-4" aria-hidden="true" />
                <RollingText text="Ateş Et" />
                {/* mermi izleri */}
                <AnimatePresence>
                  {marks.map((mark) => (
                    <motion.span
                      key={mark.id}
                      className="pointer-events-none absolute"
                      style={{ left: `${mark.x}%`, top: `${mark.y}%`, rotate: mark.rot }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 1.2 } }}
                      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                      aria-hidden="true"
                    >
                      {/* çatlaklar */}
                      <span className="absolute left-1/2 top-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                      <span className="absolute left-1/2 top-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                      <span className="absolute left-1/2 top-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      {/* delik */}
                      <span
                        className={cn(
                          'block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
                          'border border-primary/60 bg-black',
                          'shadow-[0_0_6px_rgba(212,175,55,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)]'
                        )}
                      />
                    </motion.span>
                  ))}
                </AnimatePresence>
              </Button>
            </div>
          </Magnet>
        </Reveal>

        <Reveal delay={350}>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
            <Crosshair className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Tabanca imleci takip eder — Ateş Et ile tetik çek
          </p>
        </Reveal>

        <div className="pointer-events-auto mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={300 + i * 120}>
              <div className="rounded-lg border border-border bg-card/60 p-6 text-left backdrop-blur-sm transition-colors duration-200 hover:border-primary/50">
                <pillar.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-sm uppercase tracking-wider text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {shots > 0 && (
          <div className="pointer-events-none absolute right-6 top-24 rounded border border-primary/40 bg-background/70 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-primary backdrop-blur-sm">
            {shots} mermi atıldı
          </div>
        )}
      </div>
    </section>
  )
}
