import { lazy, Suspense, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { PISTOLS } from '@/lib/pistols'
import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/utils'

const PistolViewer = lazy(() =>
  import('@/components/three/PistolViewer').then((m) => ({ default: m.PistolViewer }))
)

export function Arsenal() {
  const [activeId, setActiveId] = useState(PISTOLS[0].id)
  const [viewerKey, setViewerKey] = useState(0)
  const active = PISTOLS.find((p) => p.id === activeId) ?? PISTOLS[0]

  const select = (id: string) => {
    setActiveId(id)
    setViewerKey((k) => k + 1)
  }

  return (
    <section id="cephanelik" className="relative py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Cephanelik"
          title="Takımın Tabancaları"
          description="Sahada kullandığımız efsanevi tabancalar. Seç, çevir, incele."
        />

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4">
          {PISTOLS.map((pistol, i) => (
            <Reveal key={pistol.id} delay={i * 80}>
              <button
                type="button"
                onClick={() => select(pistol.id)}
                className={cn(
                  'group w-full cursor-pointer rounded-lg border p-4 text-left transition-all duration-200',
                  pistol.id === activeId
                    ? 'border-primary/70 bg-primary/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                    : 'border-border bg-card/50 hover:border-primary/40'
                )}
                aria-pressed={pistol.id === activeId}
              >
                <span className="block font-display text-sm uppercase tracking-wider text-foreground sm:text-base">
                  {pistol.name}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {pistol.caliber} • {pistol.role}
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="relative mx-auto mt-10 grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-5">
          <div className="relative col-span-1 h-[340px] overflow-hidden rounded-xl border border-border bg-gradient-to-b from-card to-background sm:h-[440px] lg:col-span-3">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 55% 45% at 50% 40%, rgba(212,175,55,0.14), transparent 70%)',
              }}
            />
            <Suspense fallback={null}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewerKey}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <PistolViewer modelUrl={active.model} className="h-full w-full" parallax autoRotate />
                </motion.div>
              </AnimatePresence>
            </Suspense>
            <div className="pointer-events-none absolute left-4 top-4 rounded border border-primary/30 bg-background/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-primary backdrop-blur-sm">
              {active.nickname}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-display text-3xl uppercase tracking-wide text-foreground">
                  {active.name}
                </h3>
                <p className="mt-4 text-muted-foreground">{active.description}</p>

                <div className="mt-8 space-y-4">
                  {active.stats.map((stat, i) => (
                    <div key={stat.label}>
                      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wider">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className="font-display text-primary">{stat.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
