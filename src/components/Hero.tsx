import { Crosshair, ShieldCheck, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'

const PILLARS = [
  {
    icon: Crosshair,
    title: 'Sadece Tabanca',
    text: 'Tüfek yok, sniper yok. Yakın mesafe, tam konsantrasyon — CQB\u2019nin en saf hali.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair Play',
    text: 'Hit aldım demek erdemdir. Sahada saygı ve dürüstlük her şeyden önce gelir.',
  },
  {
    icon: Users,
    title: 'Kardeşlik',
    text: 'Sahada bir ekip, saha dışında bir aile. Birlikte oynar, birlikte öğreniriz.',
  },
]

export function Hero() {
  return (
    <section id="anasayfa" className="relative overflow-hidden bg-grid">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(212,175,55,0.12), transparent 70%)',
        }}
      />
      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
        <Reveal>
          <img
            src="/assets/logo-nobg.png"
            alt="Pistol Vibe logosu"
            className="mx-auto h-40 w-40 gold-glow sm:h-52 sm:w-52"
          />
        </Reveal>

        <Reveal delay={150}>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-sm">
            Airsoft Takımı • Adana
          </p>
          <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground sm:text-4xl">
            A.T.A Pistol Team
          </h1>
          <p
            className="mt-2 font-display uppercase text-gold-gradient"
            style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            Sadece Tabanca
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tüfek yok, sniper yok. Sadece tabanca, refleks ve cesaret. Adana&apos;nın tek tabanca-only
            airsoft ekibine hoş geldin.
          </p>
        </Reveal>

        <Reveal delay={300} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <a href="#basvuru">
              <RollingText text="Hemen Başvur" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#sponsorlar">
              <RollingText text="Sponsoru Gör" />
            </a>
          </Button>
        </Reveal>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={400 + i * 120}>
              <div className="rounded-lg border border-border bg-card/60 p-6 text-left backdrop-blur-sm transition-colors duration-200 hover:border-primary/50">
                <pillar.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg uppercase tracking-wide">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
