import { CalendarDays, MapPin } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSiteContent } from '@/lib/use-site-content'

export function Events() {
  const { events } = useSiteContent()

  return (
    <section id="etkinlikler" className="scroll-mt-24 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Etkinlikler"
          title="Yaklaşan Etkinlikler"
          description={
            events.length > 0
              ? 'Sahada buluşalım — takvimde olan bitenler.'
              : 'Yeni etkinlikler yakında burada duyurulacak.'
          }
        />

        {events.length === 0 ? (
          <Reveal>
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-md border-2 border-dashed border-border py-16 text-muted-foreground">
              <CalendarDays className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="stencil-label">Takvim Boş — Takipte Kal</p>
            </div>
          </Reveal>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            {events.map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i * 100, 400)}>
                <div className="flex h-full overflow-hidden rounded-md border-2 border-foreground/15 bg-card shadow-[4px_4px_0_0_rgba(75,83,32,0.08)] transition-colors duration-200 hover:border-primary/50">
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-border bg-secondary/50 py-6 sm:w-24">
                    <CalendarDays
                      className="h-4 w-4 text-brass-deep"
                      aria-hidden="true"
                    />
                    <span className="mt-1 text-center font-display text-xs uppercase tracking-wider text-primary">
                      {event.date}
                    </span>
                  </div>
                  <div className="flex-1 p-6">
                    <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-brass-deep" aria-hidden="true" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
