import { lazy, Suspense, useEffect, useState } from 'react'
import { Crosshair, ShieldCheck, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'

const PistolViewer = lazy(() =>
  import('@/components/three/PistolViewer').then((m) => ({ default: m.PistolViewer }))
)

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
        modelUrl="/models/glock18c.glb"
        className="absolute inset-0"
        parallax
        autoRotate
      />
    </Suspense>
  )
}

export function Hero() {
  return (
    <section id="anasayfa" className="relative overflow-hidden bg-grid">
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
          <p
            className="mt-2 font-display uppercase text-gold-gradient"
            style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Sadece Tabanca
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tüfek yok, sniper yok. Sadece tabanca, refleks ve cesaret. Adana&apos;nın tek tabanca-only
            airsoft ekibine hoş geldin.
          </p>
        </Reveal>

        <Reveal delay={200} className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <a href="#basvuru">
              <RollingText text="Hemen Başvur" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#arena">
              <RollingText text="Refleksini Test Et" />
            </a>
          </Button>
        </Reveal>

        <div className="pointer-events-auto mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>
    </section>
  )
}
