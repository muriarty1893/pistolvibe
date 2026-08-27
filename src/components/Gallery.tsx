import { Camera } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSiteContent } from '@/lib/use-site-content'

// Fotoğraflar admin panelinden yönetilir (/api/content üzerinden gelir).
export function Gallery() {
  const { gallery } = useSiteContent()

  return (
    <section id="galeri" className="scroll-mt-24 border-y border-border bg-card/30 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Galeri"
          title="Sahadan Kareler"
          description={
            gallery.length > 0
              ? 'Sahadan son kareler.'
              : 'Saha fotoğraflarımız yakında burada olacak. Bizi takipte kal.'
          }
        />

        {gallery.length === 0 ? (
          <Reveal>
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background/40 text-muted-foreground"
                >
                  <Camera className="h-8 w-8 opacity-40" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
                    Yakında
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">
            {gallery.map((photo) => (
              <Reveal key={photo.id}>
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-lg border border-border"
                  title={photo.caption || undefined}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Adana Tactical Airsoft saha fotoğrafı'}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-[filter,transform] duration-300 group-hover:brightness-110 group-hover:scale-[1.03]"
                  />
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
