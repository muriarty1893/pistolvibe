import { Mail } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'

export function Sponsors() {
  return (
    <section id="sponsorlar" className="scroll-mt-24 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Sponsorlar"
          title="Sponsor & İşbirliği"
          description="Markanızı sahamıza taşımak ya da birlikte çalışmak için bize yazın."
        />

        <Reveal>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-primary/30 bg-card/60 px-6 py-16 text-center backdrop-blur-sm">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,175,55,0.1), transparent 70%)',
              }}
            />
            <p className="relative font-display text-4xl uppercase tracking-wide text-gold-gradient sm:text-6xl">
              #İşbirliği
            </p>
            <p className="relative mx-auto mt-6 max-w-md text-sm text-muted-foreground sm:text-base">
              Sponsorluk ve işbirliği teklifleri için doğrudan e-posta gönderin — en kısa sürede
              dönüş yapıyoruz.
            </p>
            <a
              href="mailto:nezihkarakoc01@hotmail.com"
              className="relative mt-8 inline-flex cursor-pointer items-center gap-3 rounded-lg border border-primary/50 bg-primary/10 px-6 py-3 font-display text-sm uppercase tracking-widest text-primary transition-colors duration-200 hover:bg-primary/20"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              nezihkarakoc01@hotmail.com
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
