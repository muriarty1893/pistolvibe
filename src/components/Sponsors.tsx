import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'

const PISTOLS = [
  { src: '/assets/sponsors_pistol_pic-nobg.png', name: 'Novritsch SSP-5' },
  { src: '/assets/glock18c-nobg.png', name: 'Glock 18C' },
]

export function Sponsors() {
  return (
    <section id="sponsorlar" className="scroll-mt-24 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Sponsorlar"
          title="Sponsorlarımız"
          description="Bizi destekleyen, sahadaki performansımıza güç katan markalar."
        />

        <Reveal>
          <Card className="mx-auto max-w-4xl overflow-hidden border-primary/30 bg-card/80">
            <CardContent className="p-6 sm:p-10">
              <div className="text-center">
                <Badge>Resmi Sponsor</Badge>
                <h3 className="mt-4 font-display text-4xl uppercase tracking-wide text-gold-gradient sm:text-5xl">
                  Novritsch
                </h3>
                <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Ekipman desteği için Novritsch&apos;e teşekkür ederiz. SSP-5 gibi üst düzey tabancalarıyla
                  sahadaki performansımızın en büyük destekçisi.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {PISTOLS.map((pistol) => (
                  <div
                    key={pistol.name}
                    className="group rounded-lg border border-border bg-black/40 p-8 transition-colors duration-200 hover:border-primary/50"
                  >
                    <img
                      src={pistol.src}
                      alt={`${pistol.name} airsoft tabancası`}
                      className="mx-auto max-h-48 w-full object-contain transition-[filter] duration-300 group-hover:gold-glow-sm"
                    />
                    <p className="mt-6 text-center font-display text-sm uppercase tracking-widest text-foreground">
                      {pistol.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Button asChild variant="outline">
                  <a href="https://www.novritsch.com" target="_blank" rel="noopener noreferrer">
                    <RollingText text="novritsch.com'u Ziyaret Et" />
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
