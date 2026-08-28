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
          <div className="stamp-frame relative mx-auto max-w-3xl rounded-lg bg-card px-6 py-16 text-center">
            <p className="relative font-display text-4xl uppercase tracking-wide text-brass-deep sm:text-6xl">
              #İşbirliği
            </p>
            <p className="relative mx-auto mt-6 max-w-md text-sm text-muted-foreground sm:text-base">
              Sponsorluk ve işbirliği teklifleri için doğrudan e-posta gönderin — en kısa sürede
              dönüş yapıyoruz.
            </p>
            <a
              href="mailto:nezihkarakoc01@hotmail.com"
              className="relative mt-8 inline-flex max-w-full cursor-pointer items-center gap-3 rounded-md border-2 border-primary bg-transparent px-4 py-3 font-display text-xs uppercase tracking-widest text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground sm:px-6 sm:text-sm"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-all">nezihkarakoc01@hotmail.com</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
