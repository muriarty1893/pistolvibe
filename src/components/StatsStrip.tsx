import { lazy, Suspense } from 'react'
import { Users, Swords, Crosshair, CalendarDays } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'

const CountUp = lazy(() => import('@/components/bits/CountUp'))

const STATS = [
  { icon: Users, value: 25, suffix: '+', label: 'Aktif Üye' },
  { icon: Swords, value: 40, suffix: '+', label: 'Oynanan Maç' },
  { icon: Crosshair, value: 12500, suffix: '+', label: 'Atılan Airsoft Mermisi', separator: '.' },
  { icon: CalendarDays, value: 2026, suffix: '', label: "Kuruluş Yılı", from: 1990 },
]

export function StatsStrip() {
  return (
    <section className="relative border-y border-border bg-card/40 py-20">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Rakamlarla"
          title="Takımın Nabzı"
        />
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="rounded-lg border border-border bg-card/60 p-6 text-center transition-colors duration-200 hover:border-primary/50">
                <stat.icon className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
                <p className="mt-4 font-display text-3xl text-gold-gradient sm:text-4xl">
                  <Suspense fallback={<span>{stat.value.toLocaleString('tr-TR')}{stat.suffix}</span>}>
                    <CountUp
                      to={stat.value}
                      from={stat.from ?? 0}
                      duration={2.2}
                      separator={stat.separator ?? ''}
                      className="tabular-nums"
                    />
                  </Suspense>
                  {stat.suffix}
                </p>
                <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
