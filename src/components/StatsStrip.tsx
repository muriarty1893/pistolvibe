import { lazy, Suspense } from 'react'
import { Users, Swords, Crosshair, CalendarDays } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/utils'
import { useSiteContent } from '@/lib/use-site-content'

const CountUp = lazy(() => import('@/components/bits/CountUp'))

const ICONS = [Users, Swords, Crosshair, CalendarDays] as const

export function StatsStrip() {
  const { stats } = useSiteContent()

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-6">
        <SectionHeading badge="Rakamlarla" title="Takımın Nabzı" />
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6">
          {stats.map((stat, i) => {
            const Icon = ICONS[i % ICONS.length]
            const inverted = i === 0
            return (
              <Reveal key={stat.id} delay={i * 100}>
                <div
                  className={cn(
                    'relative h-full rounded-lg border-2 p-8 transition-colors duration-200',
                    inverted
                      ? 'band-invert border-band hover:border-brass-pop/60'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  <span
                    className={cn(
                      'stencil-label absolute right-4 top-4',
                      inverted ? 'text-band-foreground/40' : 'text-muted-foreground/50'
                    )}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon
                    className={cn('h-6 w-6', inverted ? 'text-brass-pop' : 'text-brass-deep')}
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      'mt-4 font-display text-5xl tabular-nums',
                      inverted ? 'text-brass-pop' : 'text-primary'
                    )}
                  >
                    <Suspense
                      fallback={
                        <span>
                          {stat.value.toLocaleString('tr-TR')}
                          {stat.suffix}
                        </span>
                      }
                    >
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
                  <p
                    className={cn(
                      'stencil-label mt-3',
                      inverted ? 'text-band-foreground/60' : 'text-muted-foreground'
                    )}
                  >
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
