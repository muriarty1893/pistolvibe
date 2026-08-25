import { Crosshair } from 'lucide-react'

import { Marquee } from '@/components/bits/Marquee'
import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'

const PISTOLS = [
  { name: 'NOVRITSCH SSP5 6" GBB', href: 'https://eu.novritsch.com/product/ssp5-gas-blowback-pistol/' },
  { name: 'Glock 17 Gen 4', href: 'https://weairsoft.com/we-g001b-bk.html' },
]

export function Arsenal() {
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
        {/* kenar fade maskeleri */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="border-y border-primary/20 bg-card/40 py-8 backdrop-blur-sm">
          <Marquee pauseOnHover className="py-2 [--duration:28s] [--gap:4rem]" aria-label="Takım tabancaları">
            {PISTOLS.map((pistol) => (
              <span key={pistol.name} className="flex items-center gap-[var(--gap)]">
                <a
                  href={pistol.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap font-display text-4xl uppercase tracking-wide text-foreground transition-colors duration-200 hover:text-primary sm:text-6xl"
                >
                  {pistol.name}
                </a>
                <Crosshair
                  className="h-8 w-8 shrink-0 text-primary gold-glow-sm"
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
            {PISTOLS.map((pistol) => (
              <span key={pistol.name} className="flex items-center gap-[var(--gap)]">
                <span
                  className="whitespace-nowrap font-display text-3xl uppercase tracking-widest text-transparent sm:text-5xl"
                  style={{ WebkitTextStroke: '1px rgba(212,175,55,0.55)' }}
                >
                  {pistol.name}
                </span>
                <span className="h-2 w-2 shrink-0 rotate-45 bg-primary/50" aria-hidden="true" />
              </span>
            ))}
          </Marquee>
        </div>
      </Reveal>
    </section>
  )
}
