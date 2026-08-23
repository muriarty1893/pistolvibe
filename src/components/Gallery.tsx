import { Camera } from 'lucide-react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'

// Galeri görselleri build sırasında src/assets/gallery klasöründen toplanır.
// Fotoğraf eklemek için dosyayı bu klasöre atıp yeniden build almak yeterli.
const galleryModules = import.meta.glob('../assets/gallery/*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const images = Object.values(galleryModules) as string[]

export function Gallery() {
  return (
    <section id="galeri" className="scroll-mt-24 border-y border-border bg-card/30 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Galeri"
          title="Sahadan Kareler"
          description="Saha fotoğraflarımız yakında burada olacak. Bizi takipte kal."
        />

        {images.length === 0 ? (
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
            {images.map((src) => (
              <Reveal key={src}>
                <img
                  src={src}
                  alt="Adana Tactical Airsoft saha fotoğrafı"
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg border border-border object-cover transition-[filter] duration-300 hover:brightness-110"
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
