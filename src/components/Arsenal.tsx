import { Crosshair } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Marquee } from '@/components/bits/Marquee'
import { Reveal } from '@/components/Reveal'
import { useSiteContent } from '@/lib/use-site-content'

export function Arsenal() {
  const { arsenal } = useSiteContent()
  return (
    <section id="cephanelik" className="relative overflow-hidden py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Cephanelik"
          title="Takımın Tabancaları"
          description="Sahada kullandığımız efsanevi tabancalar."
        />
      </div>

      <Reveal className="relative mt-4">
        {/* kenar fade maskeleri — bant renginde, paper sızmaz */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-band to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-band to-transparent" />

        <div className="band-invert border-y-2 border-foreground/80 py-10">
          <Marquee pauseOnHover className="py-2 [--duration:28s] [--gap:4rem]" aria-label="Takım tabancaları">
            {arsenal.map((pistol) => (
              <span key={pistol.id} className="flex items-center gap-[var(--gap)]">
                {pistol.href ? (
                  <a
                    href={pistol.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-display text-4xl uppercase tracking-wide text-band-foreground transition-colors duration-200 hover:text-band-gold sm:text-6xl"
                  >
                    {pistol.name}
                  </a>
                ) : (
                  <span className="whitespace-nowrap font-display text-4xl uppercase tracking-wide text-band-foreground sm:text-6xl">
                    {pistol.name}
                  </span>
                )}
                <Crosshair
                  className="h-8 w-8 shrink-0 text-brass-pop"
                  aria-hidden="true"
                />
              </span>
            ))}
          </Marquee>
          <Marquee
            reverse
            pauseOnHover
            className="mt-2 py-2 opacity-70 [--duration:36s] [--gap:4rem]"
            aria-hidden="true"
          >
            {arsenal.map((pistol) => (
              <span key={pistol.id} className="flex items-center gap-[var(--gap)]">
                <span
                  className="whitespace-nowrap font-display text-3xl uppercase tracking-widest text-transparent sm:text-5xl"
                  style={{ WebkitTextStroke: '1px rgba(232,199,102,0.55)' }}
                >
                  {pistol.name}
                </span>
                <span className="h-2 w-2 shrink-0 rotate-45 bg-band-gold/50" aria-hidden="true" />
              </span>
            ))}
          </Marquee>
        </div>
      </Reveal>
    </section>
  )
}
