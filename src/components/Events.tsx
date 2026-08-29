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
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-muted-foreground">
              <CalendarDays className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="text-sm">Planlanmış etkinlik yok. Takipte kal!</p>
            </div>
          </Reveal>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
            {events.map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i * 100, 400)}>
                <div className="h-full rounded-lg border border-border bg-card/60 p-6 transition-colors duration-200 hover:border-primary/50">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-widest text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.date}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg uppercase tracking-wide text-foreground">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
