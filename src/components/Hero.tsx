import { lazy, Suspense, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'

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
            size: 1.35,
            position: [-2.0, -1.05, 0],
            spin: 0.32,
            phase: 0,
            tilt: -0.4,
          },
          {
            url: '/models/colt_m1911.glb',
            muzzle: -1,
            size: 1.35,
            position: [2.0, -1.05, 0],
            spin: -0.32,
            phase: 2.1,
            tilt: 0.4,
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
    <div className="pointer-events-none absolute inset-0 opacity-30">
      <Suspense fallback={null}>
        <Particles
          particleCount={180}
          particleSpread={12}
          speed={0.08}
          particleColors={['#8A6A1A', '#6B6558', '#A87D1E']}
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
      .then((data) => setComments(Array.isArray(data) ? data.slice(0, 2) : []))
      .catch(() => setComments([]))
  }, [])

  if (comments.length === 0) return null

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-4 lg:ml-auto lg:mr-0">
      {comments.map((comment, i) => (
        <Reveal key={comment.id} delay={300 + i * 120}>
          <div className="h-full rounded-md border border-border bg-card p-5 transition-colors duration-200 hover:border-primary/50">
            <p className="stencil-label text-muted-foreground/60" aria-hidden="true">
              TAKDİM — {String(i + 1).padStart(2, '0')}
            </p>
            <p className="mt-3 font-display text-sm uppercase tracking-wider text-foreground">
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
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true" />
      <HeroParticles />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(138,106,26,0.10), transparent 70%)',
        }}
      />
      <HeroGuns />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative mx-auto flex min-h-screen flex-col justify-center px-6 pb-16 pt-32">
        <div className="grid w-full items-center gap-12 lg:grid-cols-12">
          <div className="text-center lg:col-span-7 lg:text-left">
            <Reveal>
              <div
                className="flex items-center justify-center gap-3 lg:justify-start"
                aria-hidden="true"
              >
                <span className="inline-block h-2 w-2 bg-primary" />
                <span className="stencil-label text-muted-foreground">
                  A.T.A Pistol Team — Adana
                </span>
                <span className="stencil-label hidden text-muted-foreground/60 sm:inline">
                  BR-110
                </span>
              </div>
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
              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                Tüfek yok, sniper yok. Sadece tabanca, refleks ve cesaret. Adana&apos;nın tek
                tabanca-only airsoft ekibine hoş geldin.
              </p>
              <div className="rule-double mt-8 hidden max-w-md lg:block" />
            </Reveal>

            <Reveal delay={200} className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap lg:items-start lg:justify-start">
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
              <Button asChild size="lg" variant="outline">
                <a href="#topluluk">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  <RollingText text="Yorum Yaz" />
                </a>
              </Button>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <HeroComments />
          </div>
        </div>
      </div>

      <div className="marker-strip relative z-10" aria-hidden="true" />
    </section>
  )
}
