import { Camera } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { useSiteContent } from '@/lib/use-site-content'

// Fotoğraflar admin panelinden yönetilir (/api/content üzerinden gelir).
export function Gallery() {
  const { gallery } = useSiteContent()

  return (
    <section id="galeri" className="scroll-mt-24 border-y border-border py-24">
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
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="stamp-frame flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-md bg-card text-muted-foreground"
                >
                  <Camera className="h-8 w-8 opacity-40" aria-hidden="true" />
                  <span className="stencil-label opacity-60">Boş Kare</span>
                </div>
              ))}
            </div>
          </Reveal>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3">
            {gallery.map((photo, i) => (
              <Reveal key={photo.id}>
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stamp-frame group block rounded-md bg-card p-2"
                  title={photo.caption || undefined}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Adana Tactical Airsoft saha fotoğrafı'}
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-sm object-cover transition-[filter] duration-300 group-hover:sepia-[0.25] group-hover:contrast-105"
                  />
                  <p className="stencil-label mt-2 truncate px-1 text-[10px] tracking-[0.25em] text-muted-foreground">
                    {photo.caption ? photo.caption : `Kare — ${String(i + 1).padStart(2, '0')}`}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
