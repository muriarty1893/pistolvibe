import { lazy, Suspense, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'

const DualPistolViewer = lazy(() =>
  import('@/components/three/PistolViewer').then((m) => ({ default: m.DualPistolViewer }))
)
const Particles = lazy(() => import('@/components/bits/Particles'))
const SplitText = lazy(() => import('@/components/bits/SplitText'))

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isDesktop
}

function HeroGuns() {
  const [mounted, setMounted] = useState(false)
  const isDesktop = useIsDesktop()
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 300)
    return () => window.clearTimeout(id)
  }, [])
  // Mobilde 3D tabanca yok — sadece masaüstünde render edilir.
  if (!mounted || !isDesktop) return null
  return (
    <Suspense fallback={null}>
      <DualPistolViewer
        className="absolute inset-0"
        guns={[
          {
            url: '/models/9mm_pistol.glb',
            muzzle: -1,
            size: 1.55,
            position: [-1.75, -0.7, 0],
            spin: 0.32,
            phase: 0,
            tilt: -0.5,
          },
          {
            url: '/models/colt_m1911.glb',
            muzzle: -1,
            size: 1.55,
            position: [1.75, -0.7, 0],
            spin: -0.32,
            phase: 2.1,
            tilt: 0.5,
          },
        ]}
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
          particleColors={['#c9a227', '#8a6a1a', '#e3c766']}
          moveParticlesOnHover
          particleBaseSize={30}
          sizeRandomness={0.6}
          alphaParticles
        />
      </Suspense>
    </div>
  )
}

interface HeroComment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

function HeroComments() {
  const [comments, setComments] = useState<HeroComment[]>([])

  useEffect(() => {
    fetch('/api/comments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setComments(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setComments([]))
  }, [])

  if (comments.length === 0) return null

  return (
    <div className="pointer-events-auto mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
      {comments.map((comment, i) => (
        <Reveal key={comment.id} delay={300 + i * 120}>
          <div className="h-full rounded-lg border border-border bg-card/60 p-6 text-left backdrop-blur-sm transition-colors duration-200 hover:border-primary/50">
            <p className="font-display text-sm uppercase tracking-wider text-foreground">
              {comment.name}
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-primary">{comment.pistol}</p>
            <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{comment.message}</p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

export function Hero() {
  return (
    <section id="anasayfa" className="relative overflow-hidden bg-grid">
      <HeroParticles />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(212,175,55,0.18), transparent 70%)',
        }}
      />
      <HeroGuns />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-sm">
            Airsoft Takımı • Adana
          </p>
          <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground sm:text-4xl">
            A.T.A Pistol Team
          </h1>
          <div className="hero-title-glow">
            <Suspense fallback={null}>
              <SplitText
                text="SADECE TABANCA"
                className="split-gold mt-2 inline-block font-display uppercase text-[clamp(3rem,10vw,8rem)] leading-[1.05] tracking-[-0.02em]"
                delay={45}
                duration={0.9}
                splitType="chars"
                from={{ opacity: 0, y: 60 }}
                to={{ opacity: 1, y: 0 }}
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

        <HeroComments />
      </div>
    </section>
  )
}
