import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, RotateCcw, Timer, Trophy, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SectionHeading } from '@/components/SectionHeading'
import { playEmpty, playEnd, playHit, playReload, playShot } from '@/lib/sfx'
import { cn } from '@/lib/utils'

const RangeScene = lazy(() =>
  import('@/components/three/RangeScene').then((m) => ({ default: m.RangeScene }))
)

const GAME_DURATION = 30
const MAG_SIZE = 12
const RELOAD_MS = 1100

type Phase = 'idle' | 'playing' | 'over'

interface Result {
  score: number
  hits: number
  shots: number
  bestStreak: number
}

function formatTime(ms: number) {
  const s = Math.ceil(ms / 1000)
  return `0:${String(Math.max(s, 0)).padStart(2, '0')}`
}

export function RangeGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [hits, setHits] = useState(0)
  const [shots, setShots] = useState(0)
  const [ammo, setAmmo] = useState(MAG_SIZE)
  const [reloading, setReloading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION * 1000)
  const [result, setResult] = useState<Result | null>(null)
  const [callsign, setCallsign] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const shotSignal = useRef(0)
  const startedAt = useRef(0)
  const reloadUntil = useRef(0)
  const reloadSignal = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef({ hits: 0, shots: 0, bestStreak: 0 })
  const scoreRef = useRef(0)

  useEffect(() => {
    setCallsign(localStorage.getItem('pv_callsign') ?? '')
  }, [])

  const start = useCallback(() => {
    setPhase('playing')
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setHits(0)
    setShots(0)
    setAmmo(MAG_SIZE)
    setReloading(false)
    setResult(null)
    setSubmitState('idle')
    setTimeLeft(GAME_DURATION * 1000)
    startedAt.current = performance.now()
    reloadUntil.current = 0
    statsRef.current = { hits: 0, shots: 0, bestStreak: 0 }
    scoreRef.current = 0
  }, [])

  const finish = useCallback(() => {
    const { hits: h, shots: s, bestStreak: b } = statsRef.current
    setResult({ score: scoreRef.current, hits: h, shots: s, bestStreak: b })
    setPhase('over')
    playEnd()
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const left = GAME_DURATION * 1000 - (performance.now() - startedAt.current)
      if (left <= 0) {
        setTimeLeft(0)
        finish()
      } else {
        setTimeLeft(left)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, finish])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') reload()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reloading, ammo])

  const reload = useCallback(() => {
    if (reloading || ammo === MAG_SIZE || phase !== 'playing') return
    setReloading(true)
    playReload()
    reloadSignal.current += 1
    reloadUntil.current = performance.now() + RELOAD_MS
    window.setTimeout(() => {
      setAmmo(MAG_SIZE)
      setReloading(false)
    }, RELOAD_MS)
  }, [reloading, ammo, phase])

  const handleHit = useCallback(() => {
    statsRef.current.hits += 1
    setHits((h) => h + 1)
    setStreak((s) => {
      const next = s + 1
      statsRef.current.bestStreak = Math.max(statsRef.current.bestStreak, next)
      setBestStreak((b) => Math.max(b, next))
      const gained = 100 + next * 10
      scoreRef.current += gained
      setScore((sc) => sc + gained)
      return next
    })
    playHit()
  }, [])

  const handleMiss = useCallback(() => {
    setStreak(0)
  }, [])

  const shoot = useCallback(() => {
    if (phase !== 'playing') return
    if (performance.now() < reloadUntil.current) return
    if (ammo <= 0) {
      playEmpty()
      return
    }
    statsRef.current.shots += 1
    setAmmo((a) => a - 1)
    setShots((s) => s + 1)
    shotSignal.current += 1
    playShot()
    if (ammo - 1 <= 0) reload()
  }, [phase, ammo, reload])

  const submitScore = useCallback(async () => {
    if (!result || submitState !== 'idle') return
    const name = callsign.trim()
    if (name.length < 2) {
      setSubmitState('error')
      return
    }
    setSubmitState('sending')
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callsign: name,
          score: result.score,
          accuracy: result.shots ? Math.round((result.hits / result.shots) * 100) : 0,
          bestStreak: result.bestStreak,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitState('done')
      window.dispatchEvent(new CustomEvent('pv-scores-updated'))
    } catch {
      setSubmitState('error')
    }
  }, [result, submitState, callsign])

  const accuracy = shots ? Math.round((hits / shots) * 100) : 0

  return (
    <section id="arena" className="relative py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Refleks Arenası"
          title="Nişancılığını Kanıtla"
          description="30 saniye, 12’lik şarjör, çelik hedefler. Kaçırmak serbest — unutmak yasak. Skorun tabloda kalsın."
        />

        <div
          ref={containerRef}
          className="relative mx-auto h-[600px] w-full max-w-md select-none overflow-hidden rounded-xl border border-border bg-[#0b0b0e] sm:h-[560px] sm:max-w-5xl"
        >
          {phase === 'playing' && (
            <div onPointerDown={shoot} className="absolute inset-0 cursor-none">
              <Suspense fallback={null}>
                <RangeScene
                  active={phase === 'playing'}
                  elapsed={(performance.now() - startedAt.current) / 1000}
                  shotSignal={shotSignal}
                  reloadSignal={reloadSignal}
                  onHit={handleHit}
                  onMiss={handleMiss}
                />
              </Suspense>

              {/* crosshair yok: gun baktığı yöne ateş eder, oyuncu tracer ile düzeltir */}

              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 font-display">
                <div className="rounded border border-primary/40 bg-background/80 px-3 py-1.5 text-lg text-primary backdrop-blur-sm">
                  {score.toLocaleString('tr-TR')}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded border bg-background/80 px-3 py-1.5 text-lg backdrop-blur-sm',
                    timeLeft < 6000 ? 'border-destructive/60 text-destructive' : 'border-border text-foreground'
                  )}
                >
                  <Timer className="h-4 w-4" aria-hidden="true" />
                  {formatTime(timeLeft)}
                </div>
                <div className="flex items-center gap-2">
                  {reloading ? (
                    <span className="flex items-center gap-2 rounded border border-primary/50 bg-background/80 px-3 py-1.5 text-sm text-primary backdrop-blur-sm">
                      <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" /> Şarjör
                    </span>
                  ) : (
                    <span className="rounded border border-border bg-background/80 px-3 py-1.5 text-lg text-foreground backdrop-blur-sm">
                      {ammo}
                      <span className="text-xs text-muted-foreground">/{MAG_SIZE}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 rounded border border-border bg-background/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <Zap className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Seri: <span className="font-display text-foreground">{streak}</span>
                {' • '}
                İsabet: <span className="font-display text-foreground">{accuracy}%</span>
                {' • '}
                <span className="hidden sm:inline">R = şarjör</span>
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-grid p-6 text-center">
              <Crosshair className="h-14 w-14 text-primary gold-glow-sm" aria-hidden="true" />
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wide text-foreground">
                  Çelik Hedefler Seni Bekliyor
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Hedefler rastgele yükselir, sen tıkla. Her isabet seriyi büyütür, seri puanı katlar.
                  Şarjör 12 mermi — R ile doldur.
                </p>
              </div>
              <Button size="lg" onClick={start}>
                Ateş Başla
              </Button>
            </div>
          )}

          {phase === 'over' && result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/95 p-6 text-center">
              <Trophy className="h-12 w-12 text-primary gold-glow-sm" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Süre Bitti</p>
                <p className="mt-2 font-display text-5xl text-gold-gradient sm:text-6xl">
                  {result.score.toLocaleString('tr-TR')}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.hits}/{result.shots} isabet • {result.shots ? Math.round((result.hits / result.shots) * 100) : 0}%
                  isabet oranı • en uzun seri {result.bestStreak}
                </p>
              </div>

              {submitState === 'done' ? (
                <p className="font-display uppercase tracking-wider text-primary">
                  Skorun tabloya işlendi. Şerefle anılacaksın.
                </p>
              ) : (
                <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
                  <Input
                    value={callsign}
                    onChange={(e) => {
                      setCallsign(e.target.value)
                      setSubmitState('idle')
                    }}
                    placeholder="Çağrı adın"
                    maxLength={20}
                    aria-label="Çağrı adı"
                  />
                  <Button onClick={submitScore} disabled={submitState === 'sending'}>
                    {submitState === 'sending' ? 'Gönderiliyor…' : 'Skoru Kaydet'}
                  </Button>
                </div>
              )}
              {submitState === 'error' && (
                <p className="text-sm text-destructive">
                  Çağrı adı en az 2 karakter olmalı ya da bir sorun oldu. Tekrar dene.
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={start}>
                  Tekrar Oyna
                </Button>
                <Button variant="ghost" asChild>
                  <a href="#tablo">Tabloyu Gör</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
