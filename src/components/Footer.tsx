import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="border-t-2 border-foreground/10 bg-paper-deep py-12">
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 text-center">
        <img src="/assets/logo-nobg.png" alt="Pistol Vibe logosu" className="h-14 w-14" />
        <div>
          <p className="stencil-label text-muted-foreground" aria-hidden="true">
            PV / BR-118 / ADANA
          </p>
          <p className="mt-2 font-display text-lg uppercase tracking-wide">
            Pistol <span className="text-brass-deep">Vibe</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Sadece Tabanca
          </p>
        </div>
        <Separator className="w-24 bg-foreground/30" />
        <div className="max-w-md rounded-md border border-dashed border-foreground/25 p-4">
          <p className="stencil-label mb-2 text-muted-foreground" aria-hidden="true">
            Güvenlik Notu
          </p>
          <p className="text-sm text-muted-foreground">
            Airsoft bir spordur. Saha ve güvenlik kurallarına her zaman uyarız; koruyucu gözlük
            olmadan asla oyuna girmeyiz.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Pistol Vibe. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
