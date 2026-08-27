import { lazy, Suspense } from 'react'
import { Users, Swords, Crosshair, CalendarDays } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSiteContent } from '@/lib/use-site-content'

const CountUp = lazy(() => import('@/components/bits/CountUp'))

const ICONS = [Users, Swords, Crosshair, CalendarDays] as const

export function StatsStrip() {
  const { stats } = useSiteContent()

  return (
    <section className="relative border-y border-border bg-card/40 py-20">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Rakamlarla"
          title="Takımın Nabzı"
        />
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={stat.id} delay={i * 100}>
                <div className="rounded-lg border border-border bg-card/60 p-6 text-center transition-colors duration-200 hover:border-primary/50">
                  <Icon className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
                  <p className="mt-4 font-display text-3xl text-[#e8bf4d] sm:text-4xl">
                    <Suspense fallback={<span>{stat.value.toLocaleString('tr-TR')}{stat.suffix}</span>}>
                      <CountUp
                        key={`${stat.id}-${stat.value}`}
                        to={stat.value}
                        // yıl gibi görünen değerler hedeften kısa bir aralıktan sayar
                        from={
                          stat.value >= 1900 && stat.value <= 2100
                            ? Math.floor(stat.value * 0.98)
                            : 0
                        }
                        duration={2.2}
                        separator={stat.value >= 10000 ? '.' : ''}
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
            )
          })}
        </div>
      </div>
    </section>
  )
}
